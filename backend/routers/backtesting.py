from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import yfinance as yf
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

router = APIRouter(prefix="/backtesting", tags=["Backtesting"])

class BacktestRequest(BaseModel):
    ticker: str
    strategy: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    initial_capital: float = 10000
    short_window: int = 20
    long_window: int = 50
    rsi_period: int = 14
    rsi_oversold: int = 30
    rsi_overbought: int = 70
    transaction_cost: float = 0.1  # % per trade
    slippage: float = 0.05         # % per trade

def calculate_metrics(returns, equity_curve, initial_capital):
    total_return = (equity_curve.iloc[-1] - initial_capital) / initial_capital * 100
    n_years = len(returns) / 252
    cagr = ((equity_curve.iloc[-1] / initial_capital) ** (1 / max(n_years, 0.01)) - 1) * 100
    sharpe = returns.mean() / returns.std() * np.sqrt(252) if returns.std() > 0 else 0
    rolling_max = equity_curve.expanding().max()
    drawdown = (equity_curve - rolling_max) / rolling_max * 100
    max_drawdown = drawdown.min()
    calmar = float(cagr) / abs(float(max_drawdown)) if max_drawdown != 0 else 0
    wins = (returns > 0).sum()
    losses = (returns < 0).sum()
    total_trades = (returns != 0).sum()
    win_rate = wins / total_trades * 100 if total_trades > 0 else 0
    avg_win = returns[returns > 0].mean() if wins > 0 else 0
    avg_loss = returns[returns < 0].mean() if losses > 0 else 0
    profit_factor = abs(avg_win * wins / (avg_loss * losses)) if losses > 0 and avg_loss != 0 else 0
    sortino_std = returns[returns < 0].std() * np.sqrt(252) if len(returns[returns < 0]) > 0 else 1
    sortino = returns.mean() * 252 / sortino_std if sortino_std > 0 else 0

    return {
        "total_return": round(float(total_return), 2),
        "cagr": round(float(cagr), 2),
        "sharpe_ratio": round(float(sharpe), 4),
        "sortino_ratio": round(float(sortino), 4),
        "calmar_ratio": round(float(calmar), 4),
        "max_drawdown": round(float(max_drawdown), 2),
        "win_rate": round(float(win_rate), 2),
        "profit_factor": round(float(profit_factor), 4),
        "total_trades": int(total_trades),
    }

@router.post("/run")
def run_backtest(request: BacktestRequest):
    end = request.end_date or datetime.today().strftime('%Y-%m-%d')
    start = request.start_date or (datetime.today() - timedelta(days=365*3)).strftime('%Y-%m-%d')

    ticker = request.ticker.upper()
    data = yf.download(ticker, start=start, end=end, auto_adjust=True, progress=False)

    if data.empty:
        return {"error": f"No data found for {ticker}"}

    prices = data['Close'].squeeze()
    signals = pd.Series(0, index=prices.index)

    if request.strategy == "buy_hold":
        signals[:] = 1
    elif request.strategy == "sma_crossover":
        short_ma = prices.rolling(request.short_window).mean()
        long_ma = prices.rolling(request.long_window).mean()
        signals[short_ma > long_ma] = 1
        signals[short_ma <= long_ma] = 0
    elif request.strategy == "rsi":
        delta = prices.diff()
        gain = delta.where(delta > 0, 0).rolling(request.rsi_period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(request.rsi_period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        signals[rsi < request.rsi_oversold] = 1
        signals[rsi > request.rsi_overbought] = 0
        signals = signals.ffill().fillna(0)
    elif request.strategy == "macd":
        exp1 = prices.ewm(span=12).mean()
        exp2 = prices.ewm(span=26).mean()
        macd = exp1 - exp2
        signal_line = macd.ewm(span=9).mean()
        signals[macd > signal_line] = 1
        signals[macd <= signal_line] = 0
    elif request.strategy == "momentum":
        momentum = prices.pct_change(20)
        signals[momentum > 0] = 1
        signals[momentum <= 0] = 0

    # Transaction costs and slippage
    total_cost = (request.transaction_cost + request.slippage) / 100
    signal_changes = signals.diff().fillna(0).abs()
    cost_series = signal_changes * total_cost

    price_returns = prices.pct_change().fillna(0)
    strategy_returns = signals.shift(1).fillna(0) * price_returns - cost_series
    equity_curve = (1 + strategy_returns).cumprod() * request.initial_capital
    bh_equity = (1 + price_returns).cumprod() * request.initial_capital

    metrics = calculate_metrics(strategy_returns, equity_curve, request.initial_capital)

    chart_data = []
    for date, eq, bh, sig in zip(equity_curve.index, equity_curve.values, bh_equity.values, signals.values):
        chart_data.append({
            "date": str(date.date()),
            "strategy": round(float(eq), 2),
            "buy_hold": round(float(bh), 2),
            "position": int(sig),
        })

    bh_return = round(float((bh_equity.iloc[-1] - request.initial_capital) / request.initial_capital * 100), 2)
    total_costs_paid = round(float(cost_series.sum() * request.initial_capital), 2)

    return {
        "ticker": ticker,
        "strategy": request.strategy,
        "metrics": metrics,
        "buy_hold_return": bh_return,
        "chart": chart_data[-500:],
        "initial_capital": request.initial_capital,
        "final_value": round(float(equity_curve.iloc[-1]), 2),
        "transaction_cost_pct": request.transaction_cost,
        "slippage_pct": request.slippage,
        "total_costs_paid": total_costs_paid,
    }
