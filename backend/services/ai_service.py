import requests

# 🔥 Cache
cache = {}

def explain_stock(stock, sentiment, news):
    print("🔥 AI SERVICE FUNCTION CALLED")

    symbol = stock.get("symbol", "Unknown")

    # ✅ Cache check
    if symbol in cache:
        print("⚡ Using cached result")
        return cache[symbol]

    # 🔥 FIX: Always prepare news_text (even if empty)
    if not news:
        print("⚠ No news → using minimal prompt")
        news_text = "No recent news available."
    else:
        news_text = "\n".join(
            [f"- {n.get('title', '')}: {n.get('description', '')}" for n in news[:5]]
        )

    # 🚀 Prompt
    prompt = f"""
You are a professional stock market analyst.

Stock: {symbol}
Trend: {stock.get('trend')}
Sentiment: {sentiment.get('label')}

Recent News:
{news_text}

Explain:
1. Why the stock moved
2. Key reasons (news, sentiment, market)
3. Short future outlook

Keep it simple in 3–5 lines.
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
        print("📦 RAW RESPONSE:", response.text)

        if response.status_code != 200:
            raise Exception("Ollama request failed")

        data = response.json()
        print("📊 PARSED JSON:", data)

        result = data.get("response")

        if not result or result.strip() == "":
            raise Exception("Empty response from Ollama")

        result = result.strip()

        # ✅ Cache result
        cache[symbol] = result

        print("✅ AI RESPONSE GENERATED")

        return result

    except Exception as e:
        print("❌ Ollama error:", e)

        # 🔁 Fallback
        if sentiment.get("label") == "positive":
            return f"{symbol} is rising due to positive sentiment and favorable developments."
        elif sentiment.get("label") == "negative":
            return f"{symbol} is declining due to negative sentiment and market pressure."
        else:
            return f"{symbol} is showing stable movement influenced by mixed market signals."