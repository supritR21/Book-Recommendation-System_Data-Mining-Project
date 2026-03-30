from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.recommender import BookRecommender
from app.schemas import RecommendRequest, SearchBookItem, RecommendationItem, StatsResponse

app = FastAPI(title="Book Recommendation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

recommender = BookRecommender()


@app.on_event("startup")
def startup_event():
    recommender.build_transactions_and_rules()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/stats", response_model=StatsResponse)
def stats():
    return recommender.get_stats()


@app.get("/books/search", response_model=list[SearchBookItem])
def search_books(q: str, limit: int = 10):
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return recommender.search_books(q, limit)


@app.post("/recommend", response_model=list[RecommendationItem])
def recommend(request: RecommendRequest):
    recommendations = recommender.recommend(request.query, request.top_n)
    if not recommendations:
        raise HTTPException(
            status_code=404,
            detail=f"No recommendations found for '{request.query}'",
        )
    return recommendations


@app.post("/rebuild")
def rebuild_rules():
    recommender.build_transactions_and_rules()
    return {
        "message": "Rules rebuilt successfully",
        "stats": recommender.get_stats(),
    }