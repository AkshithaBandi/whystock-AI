# 📈 WhyStock AI

WhyStock AI is an AI-powered stock movement analysis platform that combines real-time stock market data, financial news, sentiment analysis, and Large Language Models (LLMs) to generate explainable stock insights.

The platform helps investors understand why a stock is moving by analyzing market trends, news sentiment, and recent company-related news, then generating concise AI-powered explanations.

---
# 🚀 Live Demo
### Frontend
🔗 https://whystock-5e07jffal-akdha.vercel.app/

### Backend API
🔗https://whystock-ai.onrender.com/

## 🚀 Features

### 📊 Real-Time Stock Analysis
- Fetches live stock prices using Yahoo Finance.
- Supports both Indian (NSE) and US stock symbols.
- Displays current stock price and trend direction.

### 📰 Financial News Aggregation
- Retrieves company-related news using NewsAPI.
- Filters relevant news articles.
- Provides direct links to original news sources.

### 😊 Sentiment Analysis
- Analyzes recent news headlines and descriptions.
- Calculates sentiment scores.
- Classifies sentiment as:
  - Positive
  - Negative
  - Neutral

### 🤖 AI-Powered Stock Insights
- Uses Groq API with Llama 3.3 70B.
- Generates explainable stock movement summaries.
- Combines:
  - Market trend
  - News sentiment
  - Recent company news

### 📈 Interactive Dashboard
- Responsive modern UI.
- Interactive stock charts.
- AI explanation panel.
- Real-time analysis results.

### ⭐ Watchlist & Portfolio
- Manage favorite stocks.
- Track portfolio holdings.
- Save user preferences locally.

### 🔔 Price Alerts
- Set target prices.
- Browser notifications when targets are reached.
- Automatic stock monitoring.

---

# 🏗️ System Architecture

```text
                         ┌──────────────────┐
                         │      User        │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   Frontend      │
                         │ HTML/CSS/JS      │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ JWT Authentication│
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ FastAPI Backend  │
                         └────────┬─────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
      ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
      │ PostgreSQL   │    │ Yahoo Finance│    │   NewsAPI    │
      │              │    │              │    │              │
      │ • Users      │    │ Stock Data   │    │ Financial    │
      │ • Watchlist  │    │              │    │ News         │
      │ • Portfolio  │    └──────────────┘    └──────┬───────┘
      │ • Alerts     │                               │
      └──────────────┘                               ▼
                                             ┌────────────────┐
                                             │   Sentiment    │
                                             │   Analysis     │
                                             └───────┬────────┘
                                                     │
                                                     ▼
                                             ┌────────────────┐
                                             │ Groq API       │
                                             │ Llama 3.3 70B  │
                                             └───────┬────────┘
                                                     │
                                                     ▼
                                             ┌────────────────┐
                                             │ AI-Generated   │
                                             │ Insights       │
                                             └───────┬────────┘
                                                     │
                                                     ▼
                                             ┌────────────────┐
                                             │   Dashboard    │
                                             └────────────────┘
# 🛠️ Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript (ES6+)
- Chart.js

## Backend

- Python
- FastAPI
- REST APIs
- Uvicorn

## Authentication & Security

- JWT (JSON Web Tokens)
- PyJWT
- Argon2
- pwdlib

## AI & NLP

- Groq API
- Llama 3.3 70B
- Sentiment Analysis

## Data Sources

- Yahoo Finance (yfinance)
- NewsAPI

## Database & Storage

- PostgreSQL
- SQLAlchemy ORM

## Development & Deployment

- Git
- GitHub
- VS Code
- Render

## Architecture

- RESTful API Architecture
- User-specific data isolation
- JWT-based authentication
- PostgreSQL-backed persistent storage
---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/AkshithaBandi/whystock-AI.git
cd whystock-AI
```

## Create Virtual Environment

```bash
python -m venv venv
```

## Activate Environment

### Windows

```bash
venv\Scripts\activate
```

## Install Dependencies

```bash
pip install -r backend/requirements.txt
```

---

# 🔑 Environment Variables

Create a `.env` file inside the `backend` directory:

```env
DATABASE_URL=your_postgresql_database_url
NEWS_API_KEY=your_newsapi_key
GROQ_API_KEY=your_groq_api_key
JWT_SECRET_KEY=your_secret_key

---

# ▶️ Run Backend

```bash
cd backend
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API Docs:

```text
http://127.0.0.1:8000/docs
```

---

# 🌐 Run Frontend

```bash
cd frontend
python -m http.server 5500
```

Open:

```text
http://127.0.0.1:5500
```

---

# 📸 Screenshots

### Authentication Page
<img width="938" height="433" alt="Screenshot 2026-07-06 134322" src="https://github.com/user-attachments/assets/37833545-f250-4e31-82c1-0492e34e68e3" />


## Dashboard

<img width="952" height="434" alt="Screenshot 2026-07-06 134341" src="https://github.com/user-attachments/assets/7a8fdc92-75ba-4e25-a2c4-cdb3850a6bc2" />

## AI Insights

<img width="953" height="438" alt="Screenshot 2026-07-06 141802" src="https://github.com/user-attachments/assets/060ceaa0-5ac8-4e48-b7b0-3f1cfa37d831" />
<img width="936" height="441" alt="Screenshot 2026-07-06 141818" src="https://github.com/user-attachments/assets/1bbe7008-6303-4cb6-9311-05ce2df0d485" />



## Watchlist & Portfolio
<img width="955" height="429" alt="Screenshot 2026-07-06 134402" src="https://github.com/user-attachments/assets/6e4c9c7d-b883-4374-a336-f09e9263959a" />

<img width="947" height="430" alt="Screenshot 2026-07-06 134437" src="https://github.com/user-attachments/assets/f4f8af39-3eb1-4ead-abf7-7129fabeb8e2" />



# 📈 Future Improvements

- 🔄 Real-Time WebSocket Updates
- 📊 Advanced Portfolio Analytics
- 🤖 Multi-LLM Support
- 📈 Advanced Technical Indicator Analysis
- 🔔 Smart AI-Based Price Alerts
- 📰 Improved Financial News & Sentiment Analysis
- 📱 Mobile-Responsive / Progressive Web App
- ⚡ Performance Optimization & Caching
- 📈 Backtesting and Strategy Evaluation
---

# 👩‍💻 Author

**Akshitha Bandi**

GitHub:
https://github.com/AkshithaBandi

LinkedIn:
https://www.linkedin.com/in/akshitha-dhakshayani-57b0892bb
---

⭐ If you found this project useful, consider giving it a star.
