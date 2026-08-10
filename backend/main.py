from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from services.stock_service import get_stock_data
from services.news_service import get_news
from services.sentiment_service import analyze_sentiment
from services.ai_service import explain_stock

from database import Base, engine, get_db

from models.user import User
from models.watchlist import Watchlist
from models.portfolio import Portfolio
from models.alert import Alert

from auth import router as auth_router
from dependencies import get_current_user


# ============================================================
# APP INITIALIZATION
# ============================================================

app = FastAPI(
    title="WhyStock AI",
    description="AI-powered stock movement analysis API",
    version="1.0.0"
)


# ============================================================
# AUTH ROUTES
# ============================================================

app.include_router(auth_router)


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

    stock = get_stock_data(symbol)

    if not stock:

        return {
            "success": False,
            "error": "Stock data unavailable. Please try again."
        }


    news = get_news(symbol)

    print("NEWS:", news)


    sentiment = analyze_sentiment(news)


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
# WATCHLIST
# ============================================================

# GET USER'S WATCHLIST
# ============================================================

@app.get("/watchlist")
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    items = (
        db.query(Watchlist)
        .filter(
            Watchlist.user_id == current_user.id
        )
        .all()
    )


    return {

        "success": True,

        "watchlist": [
            item.symbol
            for item in items
        ]
    }


# ============================================================
# ADD TO WATCHLIST
# ============================================================

@app.post("/watchlist/{symbol}")
def add_watchlist(
    symbol: str,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):

    symbol = symbol.strip().upper()


    if not symbol:

        raise HTTPException(
            status_code=400,
            detail="Stock symbol is required"
        )


    existing = (
        db.query(Watchlist)
        .filter(
            Watchlist.user_id == current_user.id,
            Watchlist.symbol == symbol
        )
        .first()
    )


    if existing:

        return {

            "success": False,

            "message":
                f"{symbol} is already in watchlist"
        }


    item = Watchlist(

        user_id=current_user.id,

        symbol=symbol
    )


    db.add(item)

    db.commit()

    db.refresh(item)


    return {

        "success": True,

        "message":
            f"{symbol} added to watchlist",

        "symbol": symbol
    }


# ============================================================
# DELETE FROM WATCHLIST
# ============================================================

@app.delete("/watchlist/{symbol}")
def remove_watchlist(
    symbol: str,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):

    symbol = symbol.strip().upper()


    item = (
        db.query(Watchlist)
        .filter(
            Watchlist.user_id == current_user.id,
            Watchlist.symbol == symbol
        )
        .first()
    )


    if not item:

        raise HTTPException(
            status_code=404,
            detail=
                f"{symbol} not found in your watchlist"
        )


    db.delete(item)

    db.commit()


    return {

        "success": True,

        "message":
            f"{symbol} removed from watchlist"
    }


# ============================================================
# PORTFOLIO
# ============================================================

# GET USER'S PORTFOLIO
# ============================================================

@app.get("/portfolio")
def get_portfolio(
    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):

    items = (
        db.query(Portfolio)
        .filter(
            Portfolio.user_id == current_user.id
        )
        .order_by(
            Portfolio.id.desc()
        )
        .all()
    )


    return {

        "success": True,

        "portfolio": [

            {
                "id": item.id,

                "symbol": item.symbol,

                "quantity": item.quantity,

                "buy_price": item.buy_price,

                "added_at": item.added_at
            }

            for item in items
        ]
    }


# ============================================================
# ADD PORTFOLIO HOLDING
# ============================================================

@app.post("/portfolio")
def add_portfolio(
    symbol: str,

    quantity: float,

    buy_price: float,

    added_at: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
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


    if buy_price < 0:

        raise HTTPException(
            status_code=400,
            detail="Buy price cannot be negative"
        )


    holding = Portfolio(

        user_id=current_user.id,

        symbol=symbol,

        quantity=quantity,

        buy_price=buy_price,

        added_at=added_at
    )


    db.add(holding)

    db.commit()

    db.refresh(holding)


    return {

        "success": True,

        "message":
            f"{symbol} added to portfolio",

        "portfolio": {

            "id": holding.id,

            "symbol": holding.symbol,

            "quantity": holding.quantity,

            "buy_price": holding.buy_price,

            "added_at": holding.added_at
        }
    }


# ============================================================
# DELETE PORTFOLIO HOLDING
# ============================================================

@app.delete("/portfolio/{holding_id}")
def remove_portfolio(
    holding_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):

    holding = (
        db.query(Portfolio)
        .filter(
            Portfolio.id == holding_id,

            Portfolio.user_id ==
                current_user.id
        )
        .first()
    )


    if not holding:

        raise HTTPException(
            status_code=404,

            detail=
                "Portfolio holding not found"
        )


    db.delete(holding)

    db.commit()


    return {

        "success": True,

        "message": "Holding removed"
    }


# ============================================================
# ALERTS
# ============================================================

# GET USER'S ALERTS
# ============================================================

@app.get("/alerts")
def get_alerts(
    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):

    items = (
        db.query(Alert)
        .filter(
            Alert.user_id == current_user.id
        )
        .order_by(
            Alert.id.desc()
        )
        .all()
    )


    return {

        "success": True,

        "alerts": [

            {
                "id": item.id,

                "symbol": item.symbol,

                "condition": item.condition,

                "target_price":
                    item.target_price,

                "triggered":
                    item.triggered,

                "created_at":
                    item.created_at
            }

            for item in items
        ]
    }


# ============================================================
# CREATE ALERT
# ============================================================

@app.post("/alerts")
def add_alert(
    symbol: str,

    condition: str,

    target_price: float,

    created_at: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):

    symbol = symbol.strip().upper()

    condition = condition.strip().lower()


    if not symbol:

        raise HTTPException(
            status_code=400,
            detail="Stock symbol is required"
        )


    if condition not in [
        "above",
        "below"
    ]:

        raise HTTPException(
            status_code=400,

            detail=
                "Condition must be 'above' or 'below'"
        )


    if target_price <= 0:

        raise HTTPException(
            status_code=400,

            detail=
                "Target price must be greater than 0"
        )


    alert = Alert(

        user_id=current_user.id,

        symbol=symbol,

        condition=condition,

        target_price=target_price,

        triggered=False,

        created_at=created_at
    )


    db.add(alert)

    db.commit()

    db.refresh(alert)


    return {

        "success": True,

        "message": "Alert created",

        "alert": {

            "id": alert.id,

            "symbol": alert.symbol,

            "condition": alert.condition,

            "target_price":
                alert.target_price,

            "triggered":
                alert.triggered,

            "created_at":
                alert.created_at
        }
    }


# ============================================================
# DELETE ALERT
# ============================================================

@app.delete("/alerts/{alert_id}")
def delete_alert(
    alert_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):

    alert = (
        db.query(Alert)
        .filter(
            Alert.id == alert_id,

            Alert.user_id ==
                current_user.id
        )
        .first()
    )


    if not alert:

        raise HTTPException(
            status_code=404,

            detail="Alert not found"
        )


    db.delete(alert)

    db.commit()


    return {

        "success": True,

        "message": "Alert deleted"
    }


# ============================================================
# TRIGGER ALERT
# ============================================================

@app.patch("/alerts/{alert_id}/trigger")
def trigger_alert(
    alert_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):

    alert = (
        db.query(Alert)
        .filter(
            Alert.id == alert_id,

            Alert.user_id ==
                current_user.id
        )
        .first()
    )


    if not alert:

        raise HTTPException(
            status_code=404,

            detail="Alert not found"
        )


    alert.triggered = True

    db.commit()

    db.refresh(alert)


    return {

        "success": True,

        "message": "Alert triggered",

        "alert": {

            "id": alert.id,

            "symbol": alert.symbol,

            "condition":
                alert.condition,

            "target_price":
                alert.target_price,

            "triggered":
                alert.triggered
        }
    }