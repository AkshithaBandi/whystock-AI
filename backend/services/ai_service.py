from groq import Groq
from utils.config import GROQ_API_KEY

# Cache
cache = {}

client = Groq(api_key=GROQ_API_KEY)

def explain_stock(stock, sentiment, news):

    print("🔥 AI SERVICE FUNCTION CALLED")

    symbol = stock.get("symbol", "Unknown")

    cache_key = f"{symbol}_{sentiment.get('label')}"

    if cache_key in cache:
        print("⚡ Using cached result")
        return cache[cache_key]

    if not news:
        news_text = "No recent company news available."
    else:
        news_text = "\n".join([
            f"- {n.get('title', '')}: {n.get('description', '')}"
            for n in news[:5]
        ])

    prompt = f"""
You are a professional stock market analyst.

Stock: {symbol}
Current Trend: {stock.get('trend')}
Sentiment: {sentiment.get('label')}

Recent News:
{news_text}

Instructions:
- Use only relevant company news.
- Ignore unrelated articles.
- Explain why the stock moved.
- Explain investor sentiment.
- Give a short outlook.
- Keep the response concise.

Return exactly:

• Reason for movement
• Impact on sentiment
• Future outlook
"""

    try:

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.4,
            max_tokens=250
        )

        result = completion.choices[0].message.content.strip()

        cache[cache_key] = result

        print("✅ GROQ RESPONSE GENERATED")

        return result

    except Exception as e:

        print("❌ GROQ ERROR:", e)

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