from fastapi import APIRouter
import yfinance as yf
from datetime import datetime, timedelta

router = APIRouter(prefix="/market", tags=["Market Intelligence"])

INDICES = {
    "S&P 500": "^GSPC",
    "NASDAQ": "^IXIC",
    "Dow Jones": "^DJI",
    "VIX": "^VIX",
    "Russell 2000": "^RUT",
}

COMMODITIES = {
    "Gold": "GC=F",
    "Oil (WTI)": "CL=F",
    "Bitcoin": "BTC-USD",
    "Silver": "SI=F",
}

FOREX = {
    "EUR/USD": "EURUSD=X",
    "USD/JPY": "JPY=X",
    "GBP/USD": "GBPUSD=X",
}

TREASURY = {
    "2Y Yield": "^IRX",
    "10Y Yield": "^TNX",
    "30Y Yield": "^TYX",
}

SECTORS = {
    "Technology": "XLK",
    "Financials": "XLF",
    "Healthcare": "XLV",
    "Energy": "XLE",
    "Consumer Disc.": "XLY",
    "Industrials": "XLI",
    "Real Estate": "XLRE",
    "Utilities": "XLU",
}

def get_quote(ticker: str) -> dict:
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="2d")
        if hist.empty:
            return None
        current = float(hist['Close'].iloc[-1])
        prev = float(hist['Close'].iloc[-2]) if len(hist) > 1 else current
        change = current - prev
        change_pct = (change / prev) * 100 if prev else 0
        return {
            "price": round(current, 2),
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
            "up": change >= 0,
        }
    except:
        return None

@router.get("/overview")
def get_overview():
    result = {}
    for name, ticker in {**INDICES, **COMMODITIES, **FOREX, **TREASURY}.items():
        quote = get_quote(ticker)
        if quote:
            result[name] = quote
    return result

@router.get("/sectors")
def get_sectors():
    result = {}
    for name, ticker in SECTORS.items():
        quote = get_quote(ticker)
        if quote:
            result[name] = quote
    return result

@router.get("/movers")
def get_movers():
    # Top S&P 500 stocks to scan for movers
    tickers = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", 
               "BRK-B", "JPM", "V", "UNH", "XOM", "JNJ", "PG", "MA",
               "HD", "CVX", "MRK", "ABBV", "PEP"]
    
    movers = []
    for ticker in tickers:
        quote = get_quote(ticker)
        if quote:
            movers.append({"ticker": ticker, **quote})
    
    movers.sort(key=lambda x: abs(x["change_pct"]), reverse=True)
    gainers = [m for m in movers if m["up"]][:5]
    losers = [m for m in movers if not m["up"]][:5]
    
    return {"gainers": gainers, "losers": losers}

@router.get("/chart/{ticker}")
def get_chart(ticker: str, period: str = "1mo"):
    try:
        t = yf.Ticker(ticker.upper())
        hist = t.history(period=period)
        return {
            "ticker": ticker.upper(),
            "data": [
                {"date": str(d.date()), "close": round(float(c), 2), "volume": int(v)}
                for d, c, v in zip(hist.index, hist['Close'], hist['Volume'])
            ]
        }
    except Exception as e:
        return {"error": str(e)}
