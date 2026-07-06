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

KEYWORDS_MAP = {
    "TCS.NS": ["tcs", "tata consultancy services"],
    "INFY.NS": ["infosys"],
    "RELIANCE.NS": ["reliance industries", "reliance"],
    "HDFCBANK.NS": ["hdfc bank"],
    "ICICIBANK.NS": ["icici bank"],
    "AAPL": ["apple"],
    "NVDA": ["nvidia"],
    "MSFT": ["microsoft"],
    "GOOGL": ["google", "alphabet"],
    "AMZN": ["amazon"]
}

def get_news(symbol: str):
    query = COMPANY_MAP.get(symbol, symbol.replace(".NS", ""))

    url = (
        f"https://newsapi.org/v2/everything?"
        f"q={query}&language=en&sortBy=publishedAt&pageSize=20"
        f"&apiKey={NEWS_API_KEY}"
    )

    try:
        response = requests.get(url, timeout=15)
        data = response.json()

        print("NEWS QUERY:", query)
        print("TOTAL RESULTS:", data.get("totalResults", 0))

        keywords = KEYWORDS_MAP.get(symbol, [query.lower()])

        articles = []

        for item in data.get("articles", []):

            title = (item.get("title") or "").lower()
            description = (item.get("description") or "").lower()

            text = f"{title} {description}"

            # Only keep relevant company articles
            if not any(keyword in text for keyword in keywords):
                continue

            articles.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "description": item.get("description", "")
            })

            if len(articles) >= 5:
                break

        print("FILTERED ARTICLES:", len(articles))
        print("NEWS:", articles)

        return articles

    except Exception as e:
        print("NEWS ERROR:", e)
        return []