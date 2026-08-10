from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from services.stock_service import get_stock_data
from services.news_service import get_news
from services.sentiment_service import analyze_sentiment
from services.ai_service import explain_stock

from database import Base, engine, get_db
from models.watchlist import Watchlist
from models.portfolio import Portfolio
from models.alert import Alert

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

@app.get("/portfolio")
def get_portfolio(
    db: Session = Depends(get_db)
):
    items = (
        db.query(Portfolio)
        .order_by(Portfolio.id)
        .all()
    )

    return {
        "success": True,
        "portfolio": [
            {
                "id": item.id,
                "sym": item.symbol,
                "qty": item.quantity,
                "buy": item.buy_price,
                "addedAt": item.added_at
            }
            for item in items
        ]
    }

@app.post("/portfolio")
def add_portfolio(
    symbol: str,
    quantity: float,
    buy_price: float,
    added_at: int,
    db: Session = Depends(get_db)
):

    symbol = symbol.strip().upper()

    if not symbol:
        raise HTTPException(
            status_code=400,
            detail="Stock symbol is required"
        )

    if quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    if buy_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Buy price must be greater than 0"
        )

    item = Portfolio(
        symbol=symbol,
        quantity=quantity,
        buy_price=buy_price,
        added_at=added_at
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return {
        "success": True,
        "message": f"{symbol} added to portfolio",
        "portfolio": {
            "id": item.id,
            "sym": item.symbol,
            "qty": item.quantity,
            "buy": item.buy_price,
            "addedAt": item.added_at
        }
    }

@app.delete("/portfolio/{portfolio_id}")
def remove_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db)
):

    item = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Portfolio holding not found"
        )

    db.delete(item)
    db.commit()

    return {
        "success": True,
        "message": "Portfolio holding removed"
    }

@app.get("/alerts")
def get_alerts(
    db: Session = Depends(get_db)
):
    items = (
        db.query(Alert)
        .order_by(Alert.id)
        .all()
    )

    return {
        "success": True,
        "alerts": [
            {
                "id": item.id,
                "sym": item.symbol,
                "cond": item.condition,
                "price": item.target_price,
                "triggered": item.triggered,
                "createdAt": item.created_at
            }
            for item in items
        ]
    }

@app.post("/alerts")
def add_alert(
    symbol: str,
    condition: str,
    target_price: float,
    created_at: int,
    db: Session = Depends(get_db)
):

    symbol = symbol.strip().upper()

    if not symbol:
        raise HTTPException(
            status_code=400,
            detail="Stock symbol is required"
        )

    if condition not in ["above", "below"]:
        raise HTTPException(
            status_code=400,
            detail="Condition must be 'above' or 'below'"
        )

    if target_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Target price must be greater than 0"
        )

    item = Alert(
        symbol=symbol,
        condition=condition,
        target_price=target_price,
        triggered=False,
        created_at=created_at
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return {
        "success": True,
        "message": f"Alert set for {symbol}",
        "alert": {
            "id": item.id,
            "sym": item.symbol,
            "cond": item.condition,
            "price": item.target_price,
            "triggered": item.triggered,
            "createdAt": item.created_at
        }
    }

@app.delete("/alerts/{alert_id}")
def remove_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):

    item = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    db.delete(item)
    db.commit()

    return {
        "success": True,
        "message": "Alert removed"
    }

@app.patch("/alerts/{alert_id}/trigger")
def trigger_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):

    item = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    item.triggered = True

    db.commit()
    db.refresh(item)

    return {
        "success": True,
        "message": "Alert marked as triggered",
        "id": item.id
    }