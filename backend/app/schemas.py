from pydantic import BaseModel, Field
from typing import Optional, List


class RecommendRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Book title or ISBN")
    top_n: int = Field(default=5, ge=1, le=20)


class SearchBookItem(BaseModel):
    isbn: str
    title: str
    author: Optional[str] = None
    year: Optional[str] = None


class RecommendationItem(BaseModel):
    isbn: str
    title: str
    author: Optional[str] = None
    confidence: float
    lift: float
    support: float


class StatsResponse(BaseModel):
    users: int
    books: int
    ratings: int
    positive_ratings: int
    transactions: int
    rules: int