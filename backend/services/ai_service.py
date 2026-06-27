import requests

# 🔥 Cache
cache = {}

def explain_stock(stock, sentiment, news):
    print("🔥 AI SERVICE FUNCTION CALLED")

    symbol = stock.get("symbol", "Unknown")

    # ✅ Better cache key
    cache_key = f"{symbol}_{sentiment.get('label')}"

    if cache_key in cache:
        print("⚡ Using cached result")
        return cache[cache_key]

    # ✅ Prepare news
    if not news:
        print("⚠ No news → using minimal prompt")
        news_text = "No recent news available."
    else:
        news_text = "\n".join(
            [
                f"- {n.get('title', '')}: {n.get('description', '')}"
                for n in news[:5]
            ]
        )

    # 🚀 Improved Prompt
    prompt = f"""
You are a professional stock market analyst.

Stock: {symbol}
Trend: {stock.get('trend')}
Sentiment: {sentiment.get('label')}

Recent News:
{news_text}

Instructions:
- Use only company-related news.
- Ignore unrelated articles.
- Explain why the stock moved.
- Mention the most relevant news items.
- Explain the impact on investor sentiment.
- Provide a short future outlook.
- Return only 3 concise bullet points.

Response format:

• Reason for movement
• Impact on sentiment
• Future outlook
"""

    try:
        print("📡 Sending request to Ollama...")

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "mistral",
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )

        print("✅ STATUS:", response.status_code)

        if response.status_code != 200:
            raise Exception(f"Ollama request failed ({response.status_code})")

        data = response.json()

        result = data.get("response", "").strip()

        if not result:
            raise Exception("Empty response from Ollama")

        # ✅ Save to cache
        cache[cache_key] = result

        print("✅ AI RESPONSE GENERATED")

        return result

    except Exception as e:
        print("❌ Ollama error:", e)

        # 🔁 Fallback
        if sentiment.get("label") == "positive":
            return (
                f"• {symbol} is showing positive momentum.\n"
                f"• Investor sentiment remains optimistic.\n"
                f"• Short-term outlook appears favorable."
            )

        elif sentiment.get("label") == "negative":
            return (
                f"• {symbol} is experiencing downward pressure.\n"
                f"• Investor sentiment remains cautious.\n"
                f"• Short-term volatility may continue."
            )

        else:
            return (
                f"• {symbol} is moving within a neutral trend.\n"
                f"• Market sentiment is mixed.\n"
                f"• Investors may wait for stronger signals."
            )