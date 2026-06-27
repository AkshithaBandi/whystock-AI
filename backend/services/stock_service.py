import yfinance as yf

def get_stock_data(symbol):
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="7d")

        if hist.empty:
            return None

        latest = hist.iloc[-1]

        return {
            "symbol": symbol,
            "price": round(float(latest["Close"]), 2),
            "trend": "up" if latest["Close"] > hist.iloc[0]["Close"] else "down"
        }

    except Exception as e:
        print("Stock fetch error:", e)
        return None