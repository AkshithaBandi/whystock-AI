from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from services.stock_service import get_stock_data
from services.news_service import get_news
from services.sentiment_service import analyze_sentiment
from services.ai_service import explain_stock

from database import Base, engine, get_db
from models.watchlist import Watchlist


# ============================================================
# APP INITIALIZATION
# ============================================================

app = FastAPI(
    title="WhyStock AI",
    description="AI-powered stock movement analysis API",
    version="1.0.0"
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "message": "WhyStock AI Backend Running 🚀"
    }


# ============================================================
# STOCK ANALYSIS
# ============================================================

@app.get("/analyze/{symbol}")
def analyze(symbol: str):

    # Get stock data
    stock = get_stock_data(symbol)

    if not stock:
        return {
            "success": False,
            "error": "Stock data unavailable. Please try again."
        }

    # Get related news
    news = get_news(symbol)

    print("NEWS:", news)

    # Analyze sentiment
    sentiment = analyze_sentiment(news)

    # Generate AI explanation
    explanation = explain_stock(
        stock,
        sentiment,
        news
    )

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


# ============================================================
# WATCHLIST - GET ALL
# ============================================================

@app.get("/watchlist")
def get_watchlist(
    db: Session = Depends(get_db)
):

    items = db.query(Watchlist).all()

    return {
        "success": True,
        "watchlist": [
            item.symbol
            for item in items
        ]
    }


# ============================================================
# WATCHLIST - ADD
# ============================================================

@app.post("/watchlist/{symbol}")
def add_watchlist(
    symbol: str,
    db: Session = Depends(get_db)
):

    symbol = symbol.strip().upper()

    if not symbol:
        raise HTTPException(
            status_code=400,
            detail="Stock symbol is required"
        )

    # Check whether already exists
    existing = (
        db.query(Watchlist)
        .filter(
            Watchlist.symbol == symbol
        )
        .first()
    )

    if existing:
        return {
            "success": False,
            "message": f"{symbol} is already in watchlist"
        }

    # Create new watchlist entry
    item = Watchlist(
        symbol=symbol
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return {
        "success": True,
        "message": f"{symbol} added to watchlist",
        "symbol": symbol
    }


# ============================================================
# WATCHLIST - DELETE
# ============================================================

@app.delete("/watchlist/{symbol}")
def remove_watchlist(
    symbol: str,
    db: Session = Depends(get_db)
):

    symbol = symbol.strip().upper()

    item = (
        db.query(Watchlist)
        .filter(
            Watchlist.symbol == symbol
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail=f"{symbol} not found in watchlist"
        )

    db.delete(item)
    db.commit()

    return {
        "success": True,
        "message": f"{symbol} removed from watchlist"
    }