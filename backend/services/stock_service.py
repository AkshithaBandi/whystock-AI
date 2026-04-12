import yfinance as yf

def get_stock_data(symbol: str):
    stock = yf.Ticker(symbol)
    hist = stock.history(period="7d")

    if hist.empty:
        return None

    prices = hist["Close"].tolist()
    dates = hist.index.strftime("%Y-%m-%d").tolist()

    trend = "up" if prices[-1] > prices[0] else "down"

    return {
        "symbol": symbol.upper(),
        "latest_price": prices[-1],
        "trend": trend,
        "chart": {
            "dates": dates,
            "prices": prices
        }
    }