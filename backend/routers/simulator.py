from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np

router = APIRouter(prefix="/simulator", tags=["Scenario Simulator"])

class ScenarioRequest(BaseModel):
    interest_rate: float = 5.0
    gdp_growth: float = 2.0
    unemployment_rate: float = 4.0
    inflation_rate: float = 2.5
    market_volatility: float = 20.0

@router.post("/run")
def run_scenario(request: ScenarioRequest):
    # Default rate model
    base_default = 3.2
    rate_impact = (request.interest_rate - 5.0) * 0.8
    unemployment_impact = (request.unemployment_rate - 4.0) * 0.6
    gdp_impact = -(request.gdp_growth - 2.0) * 0.4
    default_rate = max(0.5, min(25.0, base_default + rate_impact + unemployment_impact + gdp_impact))

    # Portfolio return model
    base_return = 11.7
    rate_return_impact = -(request.interest_rate - 5.0) * 1.2
    gdp_return_impact = (request.gdp_growth - 2.0) * 0.9
    vol_impact = -(request.market_volatility - 20.0) * 0.15
    portfolio_return = base_return + rate_return_impact + gdp_return_impact + vol_impact

    # VaR model
    base_var = 2.1
    var_vol_impact = (request.market_volatility - 20.0) * 0.08
    portfolio_var = max(0.5, base_var + var_vol_impact)

    # Sharpe ratio
    risk_free = request.interest_rate / 100
    excess_return = portfolio_return / 100 - risk_free
    vol = request.market_volatility / 100
    sharpe = excess_return / vol if vol > 0 else 0

    # Credit risk score
    credit_stress = max(0, min(100,
        50 + (default_rate - 3.2) * 5 +
        (request.interest_rate - 5) * 3 +
        (request.unemployment_rate - 4) * 4
    ))

    # Loan approval rate
    base_approval = 32.4
    approval_rate = max(5.0, min(80.0,
        base_approval - (default_rate - 3.2) * 2 - (request.interest_rate - 5) * 1.5
    ))

    # Revenue impact
    base_revenue = 48.2
    revenue = base_revenue + (request.gdp_growth - 2.0) * 3.2 - (request.interest_rate - 5.0) * 1.8

    # Stress level
    if default_rate > 8 or request.market_volatility > 35:
        stress_level = "SEVERE"
        stress_color = "#f87171"
    elif default_rate > 5 or request.market_volatility > 25:
        stress_level = "HIGH"
        stress_color = "#fbbf24"
    elif default_rate > 3.5:
        stress_level = "MODERATE"
        stress_color = "#fbbf24"
    else:
        stress_level = "LOW"
        stress_color = "#4ade80"

    return {
        "default_rate": round(default_rate, 2),
        "portfolio_return": round(portfolio_return, 2),
        "portfolio_var": round(portfolio_var, 2),
        "sharpe_ratio": round(sharpe, 3),
        "credit_stress_score": round(credit_stress, 1),
        "loan_approval_rate": round(approval_rate, 2),
        "revenue_impact": round(revenue, 1),
        "stress_level": stress_level,
        "stress_color": stress_color,
    }
