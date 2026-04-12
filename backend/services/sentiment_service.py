def analyze_sentiment(news_list):
    from textblob import TextBlob

    sentiments = []

    for article in news_list:
        text = article["title"] or ""
        polarity = TextBlob(text).sentiment.polarity
        sentiments.append(polarity)

    avg = sum(sentiments) / len(sentiments) if sentiments else 0

    return {
        "score": round(avg, 3),
        "label": "positive" if avg > 0 else "negative" if avg < 0 else "neutral"
    }