# 📈 WhyStock AI

WhyStock AI is an AI-powered stock movement analysis platform that combines real-time stock market data, financial news, sentiment analysis, and Large Language Models (LLMs) to generate explainable stock insights.

The platform helps investors understand **why a stock is moving** by analyzing market trends, news sentiment, and recent company-related news, then generating concise AI-powered explanations.

---

# 🚀 Live Demo

### Frontend

🔗 https://whystock-5e07jffal-akdha.vercel.app/

### Backend API

🔗 https://whystock-ai.onrender.com/

---

# 🚀 Features

## 📊 Real-Time Stock Analysis

- Fetches stock prices using Yahoo Finance.
- Supports both Indian (NSE) and US stock symbols.
- Displays current stock price and trend direction.
- Provides historical price data for visualization.

## 📰 Financial News Aggregation

- Retrieves company-related news using NewsAPI.
- Filters relevant financial news articles.
- Provides direct links to original news sources.

## 😊 Sentiment Analysis

- Analyzes recent news headlines and descriptions.
- Calculates sentiment scores.
- Classifies sentiment as:
  - Positive
  - Negative
  - Neutral

## 🤖 AI-Powered Stock Insights

- Uses Groq API with Llama 3.3 70B.
- Generates explainable stock movement summaries.
- Combines:
  - Market trends
  - News sentiment
  - Recent company news

## 📈 Interactive Dashboard

- Modern responsive user interface.
- Interactive stock charts.
- AI explanation panel.
- Real-time analysis results.
- Stock price visualization.

## 🔐 User Authentication

- User registration and login.
- JWT-based authentication.
- Secure password hashing using Argon2.
- User-specific data isolation.
- Protected API endpoints.

## ⭐ Watchlist

- Add stocks to a personal watchlist.
- Remove stocks from the watchlist.
- Watchlist data is stored per user.
- Persistent PostgreSQL storage.

## 💼 Portfolio

- Add portfolio holdings.
- Track quantity and purchase price.
- Calculate current portfolio value.
- Calculate profit/loss.
- Calculate portfolio returns.
- Portfolio data is isolated per user.

## 🔔 Price Alerts

- Create price-based alerts.
- Supports:
  - Price rises above target
  - Price falls below target
- Automatically checks stock prices.
- Browser notifications when targets are reached.
- Alert status tracking.
- Alerts are stored per user.

---

# 🏗️ System Architecture

```text
                         ┌──────────────────┐
                         │      User        │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    Frontend      │
                         │  HTML/CSS/JS     │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ JWT Authentication│
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  FastAPI Backend │
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
                                             │    Analysis    │
                                             └───────┬────────┘
                                                     │
                                                     ▼
                                             ┌────────────────┐
                                             │   Groq API     │
                                             │ Llama 3.3 70B  │
                                             └───────┬────────┘
                                                     │
                                                     ▼
                                             ┌────────────────┐
                                             │  AI-Generated  │
                                             │    Insights    │
                                             └───────┬────────┘
                                                     │
                                                     ▼
                                             ┌────────────────┐
                                             │   Dashboard    │
                                             └────────────────┘
```

---

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
- Vercel
- Render

## Architecture

- RESTful API Architecture
- User-specific data isolation
- JWT-based authentication
- PostgreSQL-backed persistent storage

---

# ⚙️ Installation

## 1. Clone Repository

```bash
git clone https://github.com/AkshithaBandi/whystock-AI.git
cd whystock-AI
```

## 2. Create Virtual Environment

```bash
python -m venv venv
```

## 3. Activate Virtual Environment

### Windows

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

## 4. Install Dependencies

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
```

### Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL database connection URL |
| `NEWS_API_KEY` | NewsAPI authentication key |
| `GROQ_API_KEY` | Groq API authentication key |
| `JWT_SECRET_KEY` | Secret key used to sign JWT authentication tokens |

> ⚠️ Never commit your `.env` file or expose API keys, database credentials, or JWT secrets publicly.

---

# ▶️ Run Backend

Navigate to the backend directory:

```bash
cd backend
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API Documentation:

```text
http://127.0.0.1:8000/docs
```

---

# 🌐 Run Frontend

Open a new terminal and navigate to the frontend:

```bash
cd frontend
```

Start the frontend server:

```bash
python -m http.server 5500
```

Open:

```text
http://127.0.0.1:5500
```

---

# 🔑 Authentication Flow

WhyStock AI uses JWT-based authentication to ensure that each user's data remains isolated.

```text
User
  ↓
Sign Up / Login
  ↓
FastAPI Authentication API
  ↓
Password Verification
  ↓
JWT Token Generated
  ↓
Frontend Stores Session
  ↓
JWT Token Sent With API Requests
  ↓
Backend Identifies User
  ↓
User-Specific Data Returned
```

Each authenticated user has their own:

- Watchlist
- Portfolio
- Price Alerts

---

# 🗄️ Database Structure

WhyStock AI uses PostgreSQL with SQLAlchemy ORM.

```text
Users
│
├── id
├── name
├── email
├── password_hash
└── created_at
      │
      ├───────────────┐
      │               │
      ▼               ▼
Watchlist          Portfolio
│                  │
├── id             ├── id
├── user_id        ├── user_id
└── symbol         ├── symbol
                   ├── quantity
                   ├── buy_price
                   └── added_at

      │
      ▼
    Alerts
      │
      ├── id
      ├── user_id
      ├── symbol
      ├── condition
      ├── target_price
      ├── triggered
      └── created_at
```

---

# 📊 Application Workflow

```text
User enters stock symbol
        ↓
Frontend sends request
        ↓
FastAPI Backend
        ↓
Yahoo Finance
        ↓
Stock price + historical data
        ↓
NewsAPI
        ↓
Financial news
        ↓
Sentiment Analysis
        ↓
News sentiment
        ↓
Groq API
        ↓
Llama 3.3 70B
        ↓
AI explanation
        ↓
Frontend Dashboard
        ↓
User receives stock movement explanation
```

---

# 📸 Screenshots

## 🔐 Authentication Page

Add your login/signup screenshot here.

## 📊 Dashboard

Add your main dashboard screenshot here.

## 🤖 AI Insights

Add your AI-generated stock analysis screenshot here.

## ⭐ Watchlist & Portfolio

Add your Watchlist and Portfolio screenshot here.

## 🔔 Price Alerts

Add your Price Alerts screenshot here.

---

# ☁️ Deployment

## Frontend

The frontend is deployed using Vercel.

```text
https://whystock-5e07jffal-akdha.vercel.app/
```

## Backend

The FastAPI backend is deployed using Render.

```text
https://whystock-ai.onrender.com/
```

## Database

PostgreSQL is used for persistent storage of:

- Users
- Watchlists
- Portfolio holdings
- Price alerts

---

# 📈 Future Improvements

- 🔄 Real-Time WebSocket Updates
- 📊 Advanced Portfolio Analytics
- 🤖 Multi-LLM Support
- 📈 Advanced Technical Indicator Analysis
- 📰 Improved Financial News & Sentiment Analysis
- 📱 Progressive Web App (PWA)
- ⚡ Performance Optimization & Caching
- 📈 Backtesting and Strategy Evaluation

---

# 🧪 Testing

The application can be tested locally using:

### Backend API

```text
http://127.0.0.1:8000/docs
```

### Frontend

```text
http://127.0.0.1:5500
```

Test the following:

- User registration
- User login
- JWT authentication
- Stock analysis
- Watchlist creation/removal
- Portfolio creation/removal
- Price alert creation/removal
- User-specific data isolation

---

# 🔒 Security

WhyStock AI follows several security practices:

- Passwords are hashed using Argon2.
- JWT tokens are used for authenticated API requests.
- User-specific resources are protected using authenticated user IDs.
- API keys are stored in environment variables.
- Database credentials are not hardcoded.
- `.env` should never be committed to GitHub.

---

# 👩‍💻 Author

## Akshitha Bandi

GitHub:

https://github.com/AkshithaBandi

---

# ⭐ Support

If you found **WhyStock AI** useful, consider giving the repository a ⭐ on GitHub.

---

## ⚠️ Disclaimer

WhyStock AI is an educational and informational project.
