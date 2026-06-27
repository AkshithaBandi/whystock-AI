import requests
from utils.config import NEWS_API_KEY

COMPANY_MAP = {
    "TCS.NS": "Tata Consultancy Services",
    "INFY.NS": "Infosys",
    "RELIANCE.NS": "Reliance Industries",
    "HDFCBANK.NS": "HDFC Bank",
    "ICICIBANK.NS": "ICICI Bank",
    "AAPL": "Apple",
    "NVDA": "NVIDIA",
    "MSFT": "Microsoft",
    "GOOGL": "Google",
    "AMZN": "Amazon"
}

def get_news(symbol: str):
    query = COMPANY_MAP.get(symbol, symbol.replace(".NS", ""))

    url = (
        f"https://newsapi.org/v2/everything?"
        f"q={query}&language=en&sortBy=publishedAt&pageSize=5"
        f"&apiKey={NEWS_API_KEY}"
    )

    try:
        response = requests.get(url, timeout=15)
        data = response.json()

        print("NEWS QUERY:", query)
        print("TOTAL RESULTS:", data.get("totalResults", 0))

        articles = []

        for item in data.get("articles", [])[:5]:
            articles.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "description": item.get("description", "")
            })

        print("ARTICLES FOUND:", len(articles))
        return articles

    except Exception as e:
        print("NEWS ERROR:", e)
        return []