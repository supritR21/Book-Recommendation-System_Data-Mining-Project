from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder

from app.config import (
    USERS_CSV,
    BOOKS_CSV,
    RATINGS_CSV,
    MIN_POSITIVE_RATING,
    MIN_BOOK_FREQUENCY,
    MIN_USER_BOOKS,
    MIN_SUPPORT,
    MIN_CONFIDENCE,
    MAX_POPULAR_BOOKS,
    MAX_RULE_LENGTH,
)


class BookRecommender:
    def __init__(self):
        self.users_df: pd.DataFrame = pd.DataFrame()
        self.books_df: pd.DataFrame = pd.DataFrame()
        self.ratings_df: pd.DataFrame = pd.DataFrame()

        self.positive_df: pd.DataFrame = pd.DataFrame()
        self.transactions: List[List[str]] = []
        self.rules_df: pd.DataFrame = pd.DataFrame()

        self.isbn_to_title: Dict[str, str] = {}
        self.isbn_to_author: Dict[str, str] = {}
        self.isbn_to_year: Dict[str, str] = {}

    def _read_csv(self, path: Path) -> pd.DataFrame:
        if not path.exists():
            raise FileNotFoundError(f"Missing file: {path}")

        # Book-Crossing CSVs are often latin-1 encoded.
        # sep=None with engine='python' auto-detects delimiter.
        try:
            df = pd.read_csv(path, sep=None, engine="python", encoding="latin-1", on_bad_lines="skip")
        except Exception:
            df = pd.read_csv(path, encoding="latin-1", on_bad_lines="skip")

        df.columns = [str(c).strip() for c in df.columns]
        return df

    def _normalize_users(self, df: pd.DataFrame) -> pd.DataFrame:
        rename_map = {}
        for c in df.columns:
            lc = c.lower().strip()
            if lc == "user-id":
                rename_map[c] = "User-ID"
            elif lc == "location":
                rename_map[c] = "Location"
            elif lc == "age":
                rename_map[c] = "Age"
        df = df.rename(columns=rename_map)
        return df

    def _normalize_books(self, df: pd.DataFrame) -> pd.DataFrame:
        rename_map = {}
        for c in df.columns:
            lc = c.lower().strip()
            if lc == "isbn":
                rename_map[c] = "ISBN"
            elif lc in {"book-title", "title"}:
                rename_map[c] = "Book-Title"
            elif lc in {"book-author", "author"}:
                rename_map[c] = "Book-Author"
            elif lc in {"year-of-publication", "year"}:
                rename_map[c] = "Year-Of-Publication"
            elif lc == "publisher":
                rename_map[c] = "Publisher"
        df = df.rename(columns=rename_map)
        return df

    def _normalize_ratings(self, df: pd.DataFrame) -> pd.DataFrame:
        rename_map = {}
        for c in df.columns:
            lc = c.lower().strip()
            if lc == "user-id":
                rename_map[c] = "User-ID"
            elif lc == "isbn":
                rename_map[c] = "ISBN"
            elif lc in {"book-rating", "rating"}:
                rename_map[c] = "Book-Rating"
        df = df.rename(columns=rename_map)
        return df

    def load_data(self) -> None:
        self.users_df = self._normalize_users(self._read_csv(USERS_CSV))
        self.books_df = self._normalize_books(self._read_csv(BOOKS_CSV))
        self.ratings_df = self._normalize_ratings(self._read_csv(RATINGS_CSV))

        required_users = {"User-ID"}
        required_books = {"ISBN", "Book-Title"}
        required_ratings = {"User-ID", "ISBN", "Book-Rating"}

        if not required_users.issubset(self.users_df.columns):
            raise ValueError(f"Users.csv must contain columns: {required_users}")
        if not required_books.issubset(self.books_df.columns):
            raise ValueError(f"Books.csv must contain columns: {required_books}")
        if not required_ratings.issubset(self.ratings_df.columns):
            raise ValueError(f"Ratings.csv must contain columns: {required_ratings}")

        # Clean up types / blanks
        self.users_df["User-ID"] = self.users_df["User-ID"].astype(str).str.strip()

        self.books_df["ISBN"] = self.books_df["ISBN"].astype(str).str.strip()
        self.books_df["Book-Title"] = self.books_df["Book-Title"].astype(str).str.strip()

        if "Book-Author" not in self.books_df.columns:
            self.books_df["Book-Author"] = ""
        if "Year-Of-Publication" not in self.books_df.columns:
            self.books_df["Year-Of-Publication"] = ""

        self.ratings_df["User-ID"] = self.ratings_df["User-ID"].astype(str).str.strip()
        self.ratings_df["ISBN"] = self.ratings_df["ISBN"].astype(str).str.strip()
        self.ratings_df["Book-Rating"] = pd.to_numeric(self.ratings_df["Book-Rating"], errors="coerce").fillna(0)

        # Build lookup maps from Books.csv
        self.isbn_to_title = dict(zip(self.books_df["ISBN"], self.books_df["Book-Title"]))
        self.isbn_to_author = dict(zip(self.books_df["ISBN"], self.books_df["Book-Author"].astype(str)))
        self.isbn_to_year = dict(zip(self.books_df["ISBN"], self.books_df["Year-Of-Publication"].astype(str)))

    def build_transactions_and_rules(self) -> None:
        self.load_data()

        # Join ratings with book metadata
        merged = self.ratings_df.merge(
            self.books_df[["ISBN", "Book-Title", "Book-Author", "Year-Of-Publication"]],
            on="ISBN",
            how="inner",
        )

        # Use only positive interactions
        positive = merged[merged["Book-Rating"] >= MIN_POSITIVE_RATING].copy()

        # Fallback if dataset becomes too small
        if positive.empty:
            positive = merged[merged["Book-Rating"] > 0].copy()

        # Reduce noise / size for Apriori
        book_counts = positive["ISBN"].value_counts()
        popular_books = book_counts[book_counts >= MIN_BOOK_FREQUENCY].index.tolist()

        if len(popular_books) == 0:
            popular_books = book_counts.head(MAX_POPULAR_BOOKS).index.tolist()

        positive = positive[positive["ISBN"].isin(popular_books)]

        user_counts = positive["User-ID"].value_counts()
        active_users = user_counts[user_counts >= MIN_USER_BOOKS].index.tolist()
        positive = positive[positive["User-ID"].isin(active_users)]

        # Keep the most popular books only if still too large
        if positive["ISBN"].nunique() > MAX_POPULAR_BOOKS:
            top_books = positive["ISBN"].value_counts().head(MAX_POPULAR_BOOKS).index
            positive = positive[positive["ISBN"].isin(top_books)]

        self.positive_df = positive

        # Each user = one transaction of ISBNs
        transactions = (
            positive.groupby("User-ID")["ISBN"]
            .apply(lambda s: sorted(set(map(str, s.tolist()))))
            .tolist()
        )

        self.transactions = transactions

        if len(transactions) < 2:
            self.rules_df = pd.DataFrame()
            return

        te = TransactionEncoder()
        te_array = te.fit(transactions).transform(transactions)
        basket = pd.DataFrame(te_array, columns=te.columns_)

        frequent_itemsets = apriori(
            basket,
            min_support=MIN_SUPPORT,
            use_colnames=True,
            max_len=MAX_RULE_LENGTH,
        )

        if frequent_itemsets.empty:
            self.rules_df = pd.DataFrame()
            return

        rules = association_rules(
            frequent_itemsets,
            metric="confidence",
            min_threshold=MIN_CONFIDENCE,
        )

        if rules.empty:
            self.rules_df = pd.DataFrame()
            return

        # Keep only simple rules: 1 book -> 1 book
        rules = rules[
            (rules["antecedents"].apply(len) == 1)
            & (rules["consequents"].apply(len) == 1)
        ].copy()

        if rules.empty:
            self.rules_df = pd.DataFrame()
            return

        rules["antecedent_isbn"] = rules["antecedents"].apply(lambda x: list(x)[0])
        rules["consequent_isbn"] = rules["consequents"].apply(lambda x: list(x)[0])

        rules = rules[[
            "antecedent_isbn",
            "consequent_isbn",
            "support",
            "confidence",
            "lift",
        ]].sort_values(by=["confidence", "lift", "support"], ascending=False)

        self.rules_df = rules.reset_index(drop=True)

    def search_books(self, query: str, limit: int = 10) -> List[dict]:
        if self.books_df.empty:
            self.load_data()

        q = query.strip().lower()

        # Search by ISBN exact match first
        exact = self.books_df[self.books_df["ISBN"].astype(str).str.lower() == q]
        if not exact.empty:
            result = exact.head(limit)
        else:
            result = self.books_df[
                self.books_df["Book-Title"].astype(str).str.lower().str.contains(q, na=False)
            ].head(limit)

        items = []
        for _, row in result.iterrows():
            isbn = str(row.get("ISBN", ""))
            items.append({
                "isbn": isbn,
                "title": str(row.get("Book-Title", "")),
                "author": str(row.get("Book-Author", "")) if "Book-Author" in row else None,
                "year": str(row.get("Year-Of-Publication", "")) if "Year-Of-Publication" in row else None,
            })
        return items

    def recommend(self, query: str, top_n: int = 5) -> List[dict]:
        if self.rules_df.empty:
            self.build_transactions_and_rules()

        if self.rules_df.empty:
            return []

        q = query.strip().lower()

        # Resolve query to one or more ISBNs
        matching_isbns = set()

        # Exact ISBN match
        exact = self.books_df[self.books_df["ISBN"].astype(str).str.lower() == q]
        if not exact.empty:
            matching_isbns.update(exact["ISBN"].astype(str).tolist())

        # Title match
        title_matches = self.books_df[
            self.books_df["Book-Title"].astype(str).str.lower().str.contains(q, na=False)
        ]
        matching_isbns.update(title_matches["ISBN"].astype(str).tolist())

        if not matching_isbns:
            return []

        matched_rules = self.rules_df[self.rules_df["antecedent_isbn"].isin(matching_isbns)].copy()

        if matched_rules.empty:
            return []

        matched_rules = matched_rules.sort_values(by=["confidence", "lift", "support"], ascending=False)

        recommendations = []
        seen = set()

        for _, row in matched_rules.iterrows():
            isbn = str(row["consequent_isbn"])
            if isbn in seen or isbn in matching_isbns:
                continue

            seen.add(isbn)
            recommendations.append({
                "isbn": isbn,
                "title": self.isbn_to_title.get(isbn, isbn),
                "author": self.isbn_to_author.get(isbn, ""),
                "confidence": float(row["confidence"]),
                "lift": float(row["lift"]),
                "support": float(row["support"]),
            })

            if len(recommendations) >= top_n:
                break

        return recommendations

    def get_stats(self) -> dict:
        return {
            "users": int(self.users_df["User-ID"].nunique()) if not self.users_df.empty else 0,
            "books": int(self.books_df["ISBN"].nunique()) if not self.books_df.empty else 0,
            "ratings": int(len(self.ratings_df)) if not self.ratings_df.empty else 0,
            "positive_ratings": int(len(self.positive_df)) if not self.positive_df.empty else 0,
            "transactions": int(len(self.transactions)),
            "rules": int(len(self.rules_df)) if not self.rules_df.empty else 0,
        }