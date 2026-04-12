from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from services.stock_service import get_stock_data
from services.news_service import get_news
from services.sentiment_service import analyze_sentiment
from services.ai_service import explain_stock

# ✅ CREATE APP FIRST
app = FastAPI()

# ✅ THEN middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ THEN routes
@app.get("/")
def home():
    return {"message": "WhyStock AI Backend Running 🚀"}

@app.get("/analyze/{symbol}")
def analyze(symbol: str):
    stock = get_stock_data(symbol)

    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    news = get_news(symbol)
    sentiment = analyze_sentiment(news)
    explanation = explain_stock(stock, sentiment, news)

    return {
        "success": True,
        "data": {
            "stock": stock,
            "sentiment": sentiment,
            "news": news,
            "insights": {
                "explanation": explanation
            }
        }
    }