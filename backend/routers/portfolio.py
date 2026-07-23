from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from scipy.optimize import minimize
import yfinance as yf
from datetime import datetime, timedelta

router = APIRouter(prefix="/portfolio", tags=["Portfolio Analytics"])

class PortfolioRequest(BaseModel):
    tickers: List[str]
    start_date: Optional[str] = None
    end_date: Optional[str] = None

def get_returns(tickers: List[str], start: str, end: str):
    data = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)
    if len(tickers) == 1:
        prices = data['Close'].to_frame()
        prices.columns = tickers
    else:
        prices = data['Close']
    prices = prices.dropna()
    returns = prices.pct_change().dropna()
    return returns, prices

def portfolio_stats(weights, returns):
    weights = np.array(weights)
    port_return = np.sum(returns.mean() * weights) * 252
    port_vol = np.sqrt(np.dot(weights.T, np.dot(returns.cov() * 252, weights)))
    sharpe = port_return / port_vol if port_vol > 0 else 0
    return port_return, port_vol, sharpe

def neg_sharpe(weights, returns):
    r, v, s = portfolio_stats(weights, returns)
    return -s

def max_drawdown(returns_series):
    cumulative = (1 + returns_series).cumprod()
    rolling_max = cumulative.expanding().max()
    drawdown = (cumulative - rolling_max) / rolling_max
    return float(drawdown.min())

@router.post("/optimize")
def optimize_portfolio(request: PortfolioRequest):
    end = request.end_date or datetime.today().strftime('%Y-%m-%d')
    start = request.start_date or (datetime.today() - timedelta(days=365)).strftime('%Y-%m-%d')
    
    tickers = [t.upper().strip() for t in request.tickers]
    
    try:
        returns, prices = get_returns(tickers, start, end)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch data: {str(e)}")
    
    if returns.empty:
        raise HTTPException(status_code=400, detail="No data returned for these tickers")
    
    n = len(tickers)
    available_tickers = list(returns.columns)
    
    # Equal weights baseline
    equal_weights = np.array([1/n] * n)
    eq_return, eq_vol, eq_sharpe = portfolio_stats(equal_weights, returns)
    
    # Optimize for max Sharpe
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
    bounds = [(0.05, 0.6)] * n
    
    result = minimize(
        neg_sharpe, equal_weights,
        args=(returns,),
        method='SLSQP',
        bounds=bounds,
        constraints=constraints,
    )
    
    opt_weights = result.x
    opt_return, opt_vol, opt_sharpe = portfolio_stats(opt_weights, returns)
    
    # VaR (95%)
    port_returns = returns.dot(opt_weights)
    var_95 = float(np.percentile(port_returns, 5))
    mdd = max_drawdown(port_returns)
    
    # Efficient frontier
    frontier_points = []
    target_returns = np.linspace(returns.mean().min() * 252, returns.mean().max() * 252, 20)
    
    for target in target_returns:
        cons = [
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
            {'type': 'eq', 'fun': lambda w, t=target: portfolio_stats(w, returns)[0] - t},
        ]
        try:
            res = minimize(
                lambda w: portfolio_stats(w, returns)[1],
                equal_weights, method='SLSQP',
                bounds=bounds, constraints=cons,
            )
            if res.success:
                r, v, s = portfolio_stats(res.x, returns)
                frontier_points.append({'return': round(r * 100, 2), 'volatility': round(v * 100, 2), 'sharpe': round(s, 2)})
        except:
            pass
    
    # Historical performance
    port_value = (1 + port_returns).cumprod()
    history = [
        {'date': str(d.date()), 'value': round(float(v), 4)}
        for d, v in zip(port_returns.index[-60:], port_value.values[-60:])
    ]
    
    return {
        'tickers': available_tickers,
        'optimized_weights': {t: round(float(w), 4) for t, w in zip(available_tickers, opt_weights)},
        'equal_weights': {t: round(float(w), 4) for t, w in zip(available_tickers, equal_weights)},
        'metrics': {
            'annual_return': round(opt_return * 100, 2),
            'annual_volatility': round(opt_vol * 100, 2),
            'sharpe_ratio': round(opt_sharpe, 4),
            'var_95_daily': round(var_95 * 100, 2),
            'max_drawdown': round(mdd * 100, 2),
        },
        'equal_weight_metrics': {
            'annual_return': round(eq_return * 100, 2),
            'annual_volatility': round(eq_vol * 100, 2),
            'sharpe_ratio': round(eq_sharpe, 4),
        },
        'frontier': frontier_points,
        'history': history,
    }

@router.get("/prices/{ticker}")
def get_prices(ticker: str, days: int = 30):
    end = datetime.today().strftime('%Y-%m-%d')
    start = (datetime.today() - timedelta(days=days)).strftime('%Y-%m-%d')
    try:
        data = yf.download(ticker.upper(), start=start, end=end, auto_adjust=True, progress=False)
        prices = data['Close'].dropna()
        return {
            'ticker': ticker.upper(),
            'prices': [{'date': str(d.date()), 'price': round(float(p), 2)} for d, p in zip(prices.index, prices.values)],
            'current_price': round(float(prices.iloc[-1]), 2) if not prices.empty else None,
            'change_pct': round(float((prices.iloc[-1] - prices.iloc[0]) / prices.iloc[0] * 100), 2) if len(prices) > 1 else 0,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
