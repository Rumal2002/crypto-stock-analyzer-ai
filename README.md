# TradeMind AI 🚀

TradeMind AI is a comprehensive financial analytics platform designed to empower traders with Artificial Intelligence. It combines deep learning-based price predictions with real-time market news, technical indicators, and interactive charting.

The project utilizes a **FastAPI** backend serving a **TensorFlow/Keras LSTM model** and a responsive **React** frontend styled with **Tailwind CSS**.

## ✨ Key Features

*   **🤖 AI Price Prediction:** Uses LSTM (Long Short-Term Memory) neural networks to forecast stock and crypto prices for the next 7 days.
*   **📊 Technical Analysis:** Real-time calculation of RSI (Relative Strength Index), SMA (Simple Moving Average), EMA, and Volatility.
*   **📰 Live News Aggregator:** Scrapes and aggregates latest news for Crypto, Stocks, and Gold from major sources (CoinDesk, Yahoo Finance, etc.).
*   **📈 Interactive Charts:** Professional candlestick charts powered by ApexCharts with zoom and pan capabilities.
*   **🔥 Market Trends:** Live tracking of trending coins and global market overview data via CoinGecko API.
*   **⚡ Real-time Data:** Fetches live market data using `yfinance`.

## 🛠️ Tech Stack

### Frontend
*   **React.js** (Vite)
*   **Tailwind CSS** (Styling)
*   **Framer Motion** (Animations)
*   **ApexCharts** (Financial Charting)
*   **Lucide React** (Icons)

### Backend
*   **FastAPI** (Python Web Framework)
*   **TensorFlow / Keras** (AI Model)
*   **Pandas & NumPy** (Data Processing)
*   **yfinance** (Market Data)
*   **BeautifulSoup & Feedparser** (News Scraping)
