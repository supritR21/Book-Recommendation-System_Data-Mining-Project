from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

USERS_CSV = DATA_DIR / "Users.csv"
BOOKS_CSV = DATA_DIR / "Books.csv"
RATINGS_CSV = DATA_DIR / "Ratings.csv"

# Tuning for Apriori / recommendation quality
MIN_POSITIVE_RATING = 8
MIN_BOOK_FREQUENCY = 8
MIN_USER_BOOKS = 5
MIN_SUPPORT = 0.02
MIN_CONFIDENCE = 0.30
MAX_POPULAR_BOOKS = 2000
MAX_RULE_LENGTH = 2