from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import numpy as np
from scipy.stats import norm
import math

router = APIRouter(prefix="/options", tags=["Options Analytics"])

class OptionRequest(BaseModel):
    spot_price: float
    strike_price: float
    time_to_expiry: float  # in years
    risk_free_rate: float  # as decimal e.g. 0.05
    volatility: float      # as decimal e.g. 0.2
    option_type: str = "call"  # "call" or "put"

def black_scholes(S, K, T, r, sigma, option_type="call"):
    if T <= 0:
        if option_type == "call":
            return max(S - K, 0)
        return max(K - S, 0)
    
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    
    if option_type == "call":
        price = S * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)
        delta = norm.cdf(d1)
    else:
        price = K * math.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
        delta = norm.cdf(d1) - 1
    
    gamma = norm.pdf(d1) / (S * sigma * math.sqrt(T))
    theta = (
        -S * norm.pdf(d1) * sigma / (2 * math.sqrt(T))
        - r * K * math.exp(-r * T) * (norm.cdf(d2) if option_type == "call" else norm.cdf(-d2))
    ) / 365
    vega = S * norm.pdf(d1) * math.sqrt(T) / 100
    rho = (
        K * T * math.exp(-r * T) * (norm.cdf(d2) if option_type == "call" else norm.cdf(-d2))
    ) / 100
    
    return {
        "price": round(price, 4),
        "delta": round(delta, 4),
        "gamma": round(gamma, 6),
        "theta": round(theta, 4),
        "vega": round(vega, 4),
        "rho": round(rho, 4),
        "d1": round(d1, 4),
        "d2": round(d2, 4),
    }

@router.post("/price")
def price_option(request: OptionRequest):
    result = black_scholes(
        request.spot_price,
        request.strike_price,
        request.time_to_expiry,
        request.risk_free_rate,
        request.volatility,
        request.option_type,
    )
    
    # Intrinsic and time value
    if request.option_type == "call":
        intrinsic = max(request.spot_price - request.strike_price, 0)
    else:
        intrinsic = max(request.strike_price - request.spot_price, 0)
    
    time_value = result["price"] - intrinsic
    moneyness = "ATM"
    if request.option_type == "call":
        if request.spot_price > request.strike_price * 1.02:
            moneyness = "ITM"
        elif request.spot_price < request.strike_price * 0.98:
            moneyness = "OTM"
    else:
        if request.spot_price < request.strike_price * 0.98:
            moneyness = "ITM"
        elif request.spot_price > request.strike_price * 1.02:
            moneyness = "OTM"

    return {
        **result,
        "intrinsic_value": round(intrinsic, 4),
        "time_value": round(time_value, 4),
        "moneyness": moneyness,
        "option_type": request.option_type,
    }

@router.post("/payoff")
def payoff_diagram(request: OptionRequest):
    spot_range = np.linspace(
        request.spot_price * 0.7,
        request.spot_price * 1.3,
        50
    )
    premium = black_scholes(
        request.spot_price, request.strike_price,
        request.time_to_expiry, request.risk_free_rate,
        request.volatility, request.option_type
    )["price"]
    
    points = []
    for s in spot_range:
        if request.option_type == "call":
            payoff = max(s - request.strike_price, 0) - premium
        else:
            payoff = max(request.strike_price - s, 0) - premium
        
        current = black_scholes(
            s, request.strike_price,
            request.time_to_expiry, request.risk_free_rate,
            request.volatility, request.option_type
        )["price"] - premium
        
        points.append({
            "spot": round(float(s), 2),
            "payoff_expiry": round(float(payoff), 4),
            "payoff_now": round(float(current), 4),
        })
    
    return {"points": points, "premium": round(premium, 4), "breakeven": round(
        request.strike_price + premium if request.option_type == "call"
        else request.strike_price - premium, 2
    )}

@router.post("/vol-smile")
def vol_smile(request: OptionRequest):
    strikes = np.linspace(request.spot_price * 0.8, request.spot_price * 1.2, 15)
    base_vol = request.volatility
    points = []
    for k in strikes:
        moneyness = k / request.spot_price
        skew = base_vol + 0.05 * (1 - moneyness) ** 2 + 0.02 * abs(1 - moneyness)
        points.append({
            "strike": round(float(k), 2),
            "implied_vol": round(float(skew * 100), 2),
            "moneyness": round(float(moneyness), 3),
        })
    return {"points": points}
