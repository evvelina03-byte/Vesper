from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import yfinance as yf
import numpy as np

router = APIRouter(prefix="/valuation", tags=["Company Valuation"])

class DCFRequest(BaseModel):
    ticker: str
    revenue_growth_rate: float = 8.0      # % year 1-5
    terminal_growth_rate: float = 2.5     # % terminal
    wacc: float = 10.0                    # % discount rate
    ebitda_margin_improvement: float = 0.5 # % per year
    projection_years: int = 5

@router.get("/financials/{ticker}")
def get_financials(ticker: str):
    try:
        t = yf.Ticker(ticker.upper())
        info = t.info
        financials = t.financials
        balance = t.balance_sheet
        cashflow = t.cashflow

        # Current price and market data
        current_price = info.get("currentPrice") or info.get("regularMarketPrice", 0)
        shares_outstanding = info.get("sharesOutstanding", 0)
        market_cap = info.get("marketCap", 0)
        enterprise_value = info.get("enterpriseValue", 0)

        # Income statement
        revenue = float(financials.loc["Total Revenue"].iloc[0]) if "Total Revenue" in financials.index else 0
        ebitda = float(financials.loc["EBITDA"].iloc[0]) if "EBITDA" in financials.index else 0
        ebit = float(financials.loc["EBIT"].iloc[0]) if "EBIT" in financials.index else 0
        net_income = float(financials.loc["Net Income"].iloc[0]) if "Net Income" in financials.index else 0

        # Balance sheet
        total_debt = info.get("totalDebt", 0) or 0
        cash = info.get("totalCash", 0) or 0
        total_assets = info.get("totalAssets", 0) or 0

        # Ratios
        pe_ratio = info.get("trailingPE", 0) or 0
        ev_ebitda = info.get("enterpriseToEbitda", 0) or 0
        pb_ratio = info.get("priceToBook", 0) or 0
        ps_ratio = info.get("priceToSalesTrailing12Months", 0) or 0
        roe = info.get("returnOnEquity", 0) or 0
        roic = info.get("returnOnAssets", 0) or 0
        revenue_growth = info.get("revenueGrowth", 0) or 0
        gross_margin = info.get("grossMargins", 0) or 0
        ebitda_margin = ebitda / revenue if revenue else 0
        free_cashflow = info.get("freeCashflow", 0) or 0

        return {
            "ticker": ticker.upper(),
            "company_name": info.get("longName", ticker.upper()),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "current_price": round(current_price, 2),
            "market_cap": market_cap,
            "enterprise_value": enterprise_value,
            "shares_outstanding": shares_outstanding,
            "financials": {
                "revenue": revenue,
                "ebitda": ebitda,
                "ebit": ebit,
                "net_income": net_income,
                "free_cashflow": free_cashflow,
                "total_debt": total_debt,
                "cash": cash,
                "total_assets": total_assets,
                "ebitda_margin": round(ebitda_margin * 100, 2),
                "gross_margin": round(gross_margin * 100, 2),
                "revenue_growth": round(revenue_growth * 100, 2),
                "roe": round(roe * 100, 2),
                "roic": round(roic * 100, 2),
            },
            "multiples": {
                "pe_ratio": round(pe_ratio, 2),
                "ev_ebitda": round(ev_ebitda, 2),
                "pb_ratio": round(pb_ratio, 2),
                "ps_ratio": round(ps_ratio, 2),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch data for {ticker}: {str(e)}")

@router.post("/dcf")
def run_dcf(request: DCFRequest):
    try:
        t = yf.Ticker(request.ticker.upper())
        info = t.info
        financials = t.financials

        revenue = float(financials.loc["Total Revenue"].iloc[0]) if "Total Revenue" in financials.index else 0
        ebitda = float(financials.loc["EBITDA"].iloc[0]) if "EBITDA" in financials.index else 0
        free_cashflow = info.get("freeCashflow", 0) or 0
        shares_outstanding = info.get("sharesOutstanding", 1)
        total_debt = info.get("totalDebt", 0) or 0
        cash = info.get("totalCash", 0) or 0
        current_price = info.get("currentPrice") or info.get("regularMarketPrice", 0)
        ebitda_margin = ebitda / revenue if revenue else 0.15

        wacc = request.wacc / 100
        growth_rate = request.revenue_growth_rate / 100
        terminal_growth = request.terminal_growth_rate / 100
        margin_improvement = request.ebitda_margin_improvement / 100

        # Project free cash flows
        projected_fcf = []
        projected_revenue = []
        current_revenue = revenue
        current_margin = ebitda_margin

        for year in range(1, request.projection_years + 1):
            current_revenue *= (1 + growth_rate)
            current_margin += margin_improvement
            fcf = current_revenue * current_margin * 0.7  # Tax adjustment
            projected_fcf.append(fcf)
            projected_revenue.append(current_revenue)

        # Terminal value
        terminal_fcf = projected_fcf[-1] * (1 + terminal_growth)
        terminal_value = terminal_fcf / (wacc - terminal_growth)

        # DCF
        pv_fcfs = []
        for i, fcf in enumerate(projected_fcf):
            pv = fcf / (1 + wacc) ** (i + 1)
            pv_fcfs.append(pv)

        pv_terminal = terminal_value / (1 + wacc) ** request.projection_years
        enterprise_value_dcf = sum(pv_fcfs) + pv_terminal
        equity_value = enterprise_value_dcf - total_debt + cash
        intrinsic_value = equity_value / shares_outstanding if shares_outstanding else 0

        upside = ((intrinsic_value - current_price) / current_price * 100) if current_price else 0

        if upside > 15:
            recommendation = "BUY"
            rec_color = "#4ade80"
        elif upside < -15:
            recommendation = "SELL"
            rec_color = "#f87171"
        else:
            recommendation = "HOLD"
            rec_color = "#fbbf24"

        return {
            "ticker": request.ticker.upper(),
            "intrinsic_value": round(intrinsic_value, 2),
            "current_price": round(current_price, 2),
            "upside_downside": round(upside, 2),
            "recommendation": recommendation,
            "recommendation_color": rec_color,
            "enterprise_value_dcf": round(enterprise_value_dcf, 0),
            "pv_fcfs": round(sum(pv_fcfs), 0),
            "pv_terminal": round(pv_terminal, 0),
            "terminal_value_pct": round(pv_terminal / enterprise_value_dcf * 100, 1),
            "projections": [
                {
                    "year": i + 1,
                    "revenue": round(rev, 0),
                    "fcf": round(fcf, 0),
                    "pv_fcf": round(pv, 0),
                }
                for i, (rev, fcf, pv) in enumerate(zip(projected_revenue, projected_fcf, pv_fcfs))
            ],
            "assumptions": {
                "revenue_growth": request.revenue_growth_rate,
                "terminal_growth": request.terminal_growth_rate,
                "wacc": request.wacc,
                "projection_years": request.projection_years,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DCF failed: {str(e)}")
