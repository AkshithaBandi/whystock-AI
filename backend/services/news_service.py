import requests
from utils.config import NEWS_API_KEY

def get_news(symbol: str):
    url = f"https://newsapi.org/v2/everything?q={symbol}&apiKey={NEWS_API_KEY}"

    response = requests.get(url)
    data = response.json()

    articles = []

    for item in data.get("articles", [])[:5]:
        articles.append({
            "title": item["title"],
            "url": item["url"],
            "description": item["description"]
        })

    return articles