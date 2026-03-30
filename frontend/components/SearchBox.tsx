"use client";

import { useState } from "react";
import api from "@/lib/api";

type Book = {
  isbn: string;
  title: string;
  author?: string;
};

export default function SearchBox({
  onSelect,
}: {
  onSelect: (book: Book) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);

  const searchBooks = async (value: string) => {
    setQuery(value);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    try {
      const res = await api.get("/books/search", {
        params: { q: value },
      });
      setResults(res.data);
    } catch {
      setResults([]);
    }
  };

  return (
    <div className="search-wrapper">
      <input
        type="text"
        value={query}
        onChange={(e) => searchBooks(e.target.value)}
        placeholder="e.g. The Name of the Wind…"
        className="search-input"
      />

      {results.length > 0 && (
        <div className="search-dropdown">
          {results.map((book) => (
            <div
              key={book.isbn}
              onClick={() => {
                onSelect(book);
                setResults([]);
                setQuery(book.title);
              }}
              className="search-result"
            >
              <p className="result-title">{book.title}</p>
              {book.author && (
                <p className="result-author">{book.author}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}