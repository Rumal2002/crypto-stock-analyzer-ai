from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import yfinance as yf
from keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
from fastapi.middleware.cors import CORSMiddleware
import datetime
from datetime import timedelta
import pandas as pd
import aiohttp
import asyncio
from typing import Optional
import feedparser
import re
from bs4 import BeautifulSoup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = load_model('bitcoin_prediction_model.h5')

class StockRequest(BaseModel):
    symbol: str

class NewsRequest(BaseModel):
    category: str  # 'crypto', 'stocks', 'gold', 'all'

# ===================== NEWS SOURCES =====================
NEWS_SOURCES = {
    'crypto': [
        {
            'name': 'CoinDesk',
            'url': 'https://www.coindesk.com/arc/outboundfeeds/rss/',
            'type': 'rss'
        },
        {
            'name': 'CoinTelegraph',
            'url': 'https://cointelegraph.com/rss',
            'type': 'rss'
        },
        {
            'name': 'Bitcoin Magazine',
            'url': 'https://bitcoinmagazine.com/feed',
            'type': 'rss'
        },
        {
            'name': 'Decrypt',
            'url': 'https://decrypt.co/feed',
            'type': 'rss'
        }
    ],
    'stocks': [
        {
            'name': 'Yahoo Finance',
            'url': 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=AAPL,TSLA,GOOGL,MSFT,AMZN&region=US&lang=en-US',
            'type': 'rss'
        },
        {
            'name': 'MarketWatch',
            'url': 'https://feeds.marketwatch.com/marketwatch/topstories/',
            'type': 'rss'
        },
        {
            'name': 'Investing.com',
            'url': 'https://www.investing.com/rss/news.rss',
            'type': 'rss'
        }
    ],
    'gold': [
        {
            'name': 'Kitco News',
            'url': 'https://www.kitco.com/rss/news.xml',
            'type': 'rss'
        },
        {
            'name': 'Gold Price',
            'url': 'https://www.goldprice.org/news/feed',
            'type': 'rss'
        }
    ]
}

# Clean HTML tags from text
def clean_html(text):
    if not text:
        return ""
    soup = BeautifulSoup(text, 'html.parser')
    return soup.get_text()[:200] + "..." if len(soup.get_text()) > 200 else soup.get_text()

# Extract image from entry
def extract_image(entry):
    # Try different image locations
    if hasattr(entry, 'media_content') and entry.media_content:
        return entry.media_content[0].get('url', '')
    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
        return entry.media_thumbnail[0].get('url', '')
    if hasattr(entry, 'enclosures') and entry.enclosures:
        for enc in entry.enclosures:
            if 'image' in enc.get('type', ''):
                return enc.get('href', '')
    # Try to find image in content
    if hasattr(entry, 'content'):
        for content in entry.content:
            match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', content.get('value', ''))
            if match:
                return match.group(1)
    if hasattr(entry, 'summary'):
        match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', entry.summary)
        if match:
            return match.group(1)
    return None

# Parse RSS feed
async def parse_rss_feed(source, category):
    try:
        feed = feedparser.parse(source['url'])
        news_items = []
        
        for entry in feed.entries[:5]:  # Get top 5 from each source
            published = ''
            if hasattr(entry, 'published'):
                published = entry.published
            elif hasattr(entry, 'updated'):
                published = entry.updated
            
            image_url = extract_image(entry)
            
            news_items.append({
                'title': entry.title if hasattr(entry, 'title') else 'No Title',
                'description': clean_html(entry.summary if hasattr(entry, 'summary') else ''),
                'url': entry.link if hasattr(entry, 'link') else '',
                'source': source['name'],
                'category': category,
                'published': published,
                'image': image_url
            })
        
        return news_items
    except Exception as e:
        print(f"Error parsing {source['name']}: {e}")
        return []

# Fetch news from CryptoCompare API (backup for crypto)
async def fetch_cryptocompare_news():
    try:
        async with aiohttp.ClientSession() as session:
            url = "https://min-api.cryptocompare.com/data/v2/news/?lang=EN"
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    news_items = []
                    for item in data.get('Data', [])[:10]:
                        news_items.append({
                            'title': item.get('title', ''),
                            'description': item.get('body', '')[:200] + '...',
                            'url': item.get('url', ''),
                            'source': item.get('source', 'CryptoCompare'),
                            'category': 'crypto',
                            'published': datetime.datetime.fromtimestamp(item.get('published_on', 0)).strftime('%Y-%m-%d %H:%M'),
                            'image': item.get('imageurl', None)
                        })
                    return news_items
    except Exception as e:
        print(f"CryptoCompare error: {e}")
    return []

# ===================== NEWS ENDPOINT =====================
@app.post("/news")
async def get_news(request: NewsRequest):
    try:
        category = request.category.lower()
        all_news = []
        
        if category == 'all':
            categories = ['crypto', 'stocks', 'gold']
        else:
            categories = [category]
        
        for cat in categories:
            if cat in NEWS_SOURCES:
                for source in NEWS_SOURCES[cat]:
                    if source['type'] == 'rss':
                        news = await parse_rss_feed(source, cat)
                        all_news.extend(news)
        
        # Add CryptoCompare as backup for crypto
        if category in ['crypto', 'all']:
            crypto_news = await fetch_cryptocompare_news()
            all_news.extend(crypto_news)
        
        # Remove duplicates based on title
        seen_titles = set()
        unique_news = []
        for item in all_news:
            if item['title'] not in seen_titles:
                seen_titles.add(item['title'])
                unique_news.append(item)
        
        # Sort by published date (most recent first)
        # Limit to 20 items
        return {
            "success": True,
            "category": category,
            "count": len(unique_news[:20]),
            "news": unique_news[:20],
            "last_updated": datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
    except Exception as e:
        print(f"News Error: {e}")
        return {"success": False, "error": str(e), "news": []}

# ===================== TRENDING COINS ENDPOINT =====================
@app.get("/trending")
async def get_trending():
    try:
        async with aiohttp.ClientSession() as session:
            # CoinGecko trending
            url = "https://api.coingecko.com/api/v3/search/trending"
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    trending = []
                    for coin in data.get('coins', [])[:7]:
                        item = coin.get('item', {})
                        trending.append({
                            'name': item.get('name', ''),
                            'symbol': item.get('symbol', ''),
                            'thumb': item.get('thumb', ''),
                            'market_cap_rank': item.get('market_cap_rank', 0),
                            'price_btc': item.get('price_btc', 0)
                        })
                    return {"success": True, "trending": trending}
        return {"success": False, "trending": []}
    except Exception as e:
        return {"success": False, "error": str(e), "trending": []}

# ===================== MARKET OVERVIEW ENDPOINT =====================
@app.get("/market-overview")
async def get_market_overview():
    try:
        async with aiohttp.ClientSession() as session:
            url = "https://api.coingecko.com/api/v3/global"
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    global_data = data.get('data', {})
                    return {
                        "success": True,
                        "total_market_cap": global_data.get('total_market_cap', {}).get('usd', 0),
                        "total_volume": global_data.get('total_volume', {}).get('usd', 0),
                        "btc_dominance": global_data.get('market_cap_percentage', {}).get('btc', 0),
                        "eth_dominance": global_data.get('market_cap_percentage', {}).get('eth', 0),
                        "active_cryptocurrencies": global_data.get('active_cryptocurrencies', 0),
                        "market_cap_change_24h": global_data.get('market_cap_change_percentage_24h_usd', 0)
                    }
        return {"success": False}
    except Exception as e:
        return {"success": False, "error": str(e)}

# RSI Calculation
def calculate_rsi(data, window=14):
    delta = data.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

# ===================== PREDICT ENDPOINT =====================
@app.post("/predict")
async def predict_price(request: StockRequest):
    try:
        symbol = request.symbol
        end_date = datetime.date.today().strftime("%Y-%m-%d")
        start_date = "2023-01-01"

        data = yf.download(symbol, start=start_date, end=end_date)
        
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)

        if len(data) < 60:
            return {"error": "Not enough data"}

        # Technical Indicators
        data['SMA_50'] = data['Close'].rolling(window=50).mean()
        data['EMA_20'] = data['Close'].ewm(span=20, adjust=False).mean()
        data['Returns'] = data['Close'].pct_change()
        volatility = data['Returns'].std() * 100

        day_volume = float(data['Volume'].iloc[-1])
        day_high = float(data['High'].iloc[-1])
        day_low = float(data['Low'].iloc[-1])

        # AI Prediction
        scaler = MinMaxScaler(feature_range=(0,1))
        data_close = data[['Close']].values
        scaler.fit(data_close)

        current_batch = data_close[-60:]
        current_batch_scaled = scaler.transform(current_batch)
        current_input = current_batch_scaled.reshape(1, 60, 1)

        future_predictions = []
        for i in range(7):
            pred_scaled = model.predict(current_input)
            future_predictions.append(pred_scaled[0][0])
            new_step = pred_scaled.reshape(1, 1, 1)
            current_input = np.append(current_input[:, 1:, :], new_step, axis=1)

        future_predictions = np.array(future_predictions).reshape(-1, 1)
        future_predictions = scaler.inverse_transform(future_predictions)

        forecast_dates = []
        today = datetime.date.today()
        for i in range(1, 8):
            next_day = today + timedelta(days=i)
            forecast_dates.append(next_day.strftime("%Y-%m-%d"))

        forecast_data = []
        for i in range(7):
            forecast_data.append({
                "date": forecast_dates[i],
                "price": round(float(future_predictions[i][0]), 2)
            })

        # Signal Generation
        last_real_price = float(data_close[-1][0])
        next_day_price = forecast_data[0]['price']
        
        rsi_series = calculate_rsi(data['Close'])
        current_rsi = float(rsi_series.iloc[-1]) if not pd.isna(rsi_series.iloc[-1]) else 50.0

        ai_trend = "UP" if next_day_price > last_real_price else "DOWN"
        
        signal = "HOLD"
        signal_color = "gray"

        if ai_trend == "UP" and current_rsi < 40:
            signal = "STRONG BUY 🚀"
            signal_color = "green"
        elif ai_trend == "UP":
            signal = "BUY 🟢"
            signal_color = "green"
        elif ai_trend == "DOWN" and current_rsi > 60:
            signal = "STRONG SELL 📉"
            signal_color = "red"
        elif ai_trend == "DOWN":
            signal = "SELL 🔴"
            signal_color = "red"

        difference = next_day_price - last_real_price

        # Chart Data
        recent_data = data.tail(90).reset_index()
        
        candlestick_data = []
        sma_data = []
        ema_data = []

        for index, row in recent_data.iterrows():
            date_ms = int(row['Date'].timestamp() * 1000)
            
            candlestick_data.append({
                "x": date_ms,
                "y": [float(row['Open']), float(row['High']), float(row['Low']), float(row['Close'])]
            })
            
            if not pd.isna(row['SMA_50']):
                sma_data.append({"x": date_ms, "y": float(row['SMA_50'])})
            
            if not pd.isna(row['EMA_20']):
                ema_data.append({"x": date_ms, "y": float(row['EMA_20'])})

        return {
            "symbol": symbol,
            "current_price": round(last_real_price, 2),
            "signal": signal,
            "signal_color": signal_color,
            "rsi": round(current_rsi, 2),
            "volatility": round(volatility, 2),
            "volume": day_volume,
            "day_high": round(day_high, 2),
            "day_low": round(day_low, 2),
            "difference": round(difference, 2),
            "chart_data": {
                "candles": candlestick_data,
                "sma": sma_data,
                "ema": ema_data
            },
            "forecast_7_days": forecast_data
        }

    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)