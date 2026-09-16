# Vesper
Financial Intelligence Platform for Risk, Analytics & AI
Vesper is a full-stack financial analytics platform built with FastAPI, Next.js, PostgreSQL, and machine learning. It covers the full spectrum of quantitative finance, risk, and business intelligence across 12 modules.

Executive Dashboard
Live KPI overview pulling real data from the database : total assets, loan portfolio, default rate, portfolio return, fraud alerts, customer growth, revenue, and VaR. Includes a fraud alert feed and AI-generated business insights with priority indicators.

Credit Risk Analytics
XGBoost-powered loan scoring that returns a probability of default, risk score (0–100), and approve/reject/review recommendation. Every prediction includes a full SHAP explainability breakdown showing which features drove the decision: credit score, debt-to-income, employment years, loan amount , ranked by impact magnitude. All predictions are logged to an audit trail.

Fraud Detection
Real-time transaction scoring using an XGBoost classifier (AUC-ROC 0.9943) trained on 3,500+ transactions. Returns a fraud score, risk level (LOW/MEDIUM/HIGH/CRITICAL), and anomaly reasons. Includes a live transaction feed that auto-refreshes every 10 seconds showing fraud scores across all recent transactions.

Portfolio Analytics
Mean-variance optimization using scipy that finds the maximum Sharpe ratio allocation across any set of tickers using real Yahoo Finance data. Outputs optimized weights, efficient frontier scatter plot, and a full risk metrics suite: annual return, volatility, Sharpe, Sortino, Calmar, VaR (95%), CVaR/Expected Shortfall (95%), and max drawdown. Benchmarks against SPY (or any ticker) with alpha, tracking error, and information ratio. Includes a 60-day performance chart comparing the optimised portfolio against the benchmark.

Options Analytics
Black-Scholes option pricing engine with full Greeks: Delta, Gamma, Theta, Vega, Rho , plus intrinsic value, time value, and moneyness classification (ITM/ATM/OTM). Interactive payoff diagram showing P&L at expiry vs current value, and a theoretical volatility smile across strikes. Supports both calls and puts with adjustable spot, strike, time to expiry, risk-free rate, and volatility inputs.

Strategy Backtesting
Historical strategy testing on any US ticker with five strategies: Buy & Hold, SMA Crossover, RSI, MACD, and Momentum. Accounts for transaction costs and slippage. Reports CAGR, Sharpe, Sortino, Calmar, max drawdown, win rate, profit factor, and total trade count. Equity curve chart compares strategy vs buy & hold after costs.

Company Valuation (DCF)
Fetches real financial statements from Yahoo Finance: revenue, EBITDA, net income, free cash flow, debt, cash, and displays valuation multiples: P/E, EV/EBITDA, P/B, P/S. Runs a 5-year DCF model with user-adjustable WACC, revenue growth, terminal growth rate, and margin improvement assumptions. Returns intrinsic value per share, upside/downside vs market price, PV of FCFs, terminal value, and a BUY/HOLD/SELL recommendation. Projection chart shows year-by-year revenue, FCF, and discounted FCF.

Scenario Simulator
Real-time macroeconomic stress testing with five adjustable variables: interest rate, GDP growth, unemployment, inflation, and market volatility (VIX). Five preset scenarios: Base Case, Rate Hike, Recession, Bull Market, and Stagflation. Updates default rate, portfolio return, VaR, Sharpe, loan approval rate, revenue, and credit stress score (0–100) instantly as sliders move. Generates a narrative analysis with actionable recommendations based on the scenario.

Market Intelligence
Live market data dashboard via Yahoo Finance covering major indices (S&P 500, NASDAQ, Dow Jones, VIX, Russell 2000), commodities (Gold, Oil, Bitcoin, Silver), forex (EUR/USD, USD/JPY, GBP/USD), and Treasury yields (2Y, 10Y, 30Y). Sector performance bars for 8 GICS sectors. Interactive price chart for any ticker with 1W/1M/3M/6M/1Y periods. Top 5 gainers and losers from the S&P 500.

Executive Intelligence (BI)
Business intelligence dashboard with real data from the platform database. Customer segmentation donut by segment (Retail, SME, Corporate, Private Banking) with average loan amounts and default rates. Regional analysis table with customer counts, default rates, and fraud alerts by region. Monthly revenue trend bar chart. AI-generated business insights with priority levels and color-coded recommendations.

AI Financial Assistant
RAG-based document analysis using Gemini. Upload any PDF: annual reports, earnings transcripts, investor presentations, and ask natural language questions. The pipeline chunks the document, retrieves the most relevant passages via keyword scoring, and sends them to Gemini with a financial analyst system prompt. Suggested questions include: summarize this document, what are the biggest risks, how did revenue change, what are the key financial ratios.

ML Model Monitoring
MLOps dashboard showing the health of both deployed models. For each model: version, status (healthy/missing), last trained date, model size, total prediction volume, 7-day prediction count, key performance metrics, and a drift indicator. Includes trend charts for daily prediction volume and average scores over the last 30 days. Full audit log showing every prediction with timestamp, action, recommendation, and probability of default.

Technical Stack
Backend: Python, FastAPI, SQLAlchemy, PostgreSQL, XGBoost, scikit-learn, SHAP, scipy, yfinance, Google Gemini
Frontend: Next.js 14, TypeScript, Tailwind CSS, Recharts
Infrastructure: Docker-ready, GitHub, deployable to Vercel + Railway

Vesper is a full-stack financial analytics platform built with FastAPI, Next.js, PostgreSQL, and machine learning. It covers the full spectrum of quantitative finance, risk, and business intelligence across 12 modules.

Executive Dashboard

Live KPI overview pulling real data from the database : total assets, loan portfolio, default rate, portfolio return, fraud alerts, customer growth, revenue, and VaR. Includes a fraud alert feed and AI-generated business insights with priority indicators.

Credit Risk Analytics

XGBoost-powered loan scoring that returns a probability of default, risk score (0–100), and approve/reject/review recommendation. Every prediction includes a full SHAP explainability breakdown showing which features drove the decision: credit score, debt-to-income, employment years, loan amount , ranked by impact magnitude. All predictions are logged to an audit trail.

Fraud Detection

Real-time transaction scoring using an XGBoost classifier (AUC-ROC 0.9943) trained on 3,500+ transactions. Returns a fraud score, risk level (LOW/MEDIUM/HIGH/CRITICAL), and anomaly reasons. Includes a live transaction feed that auto-refreshes every 10 seconds showing fraud scores across all recent transactions.

Portfolio Analytics

Mean-variance optimization using scipy that finds the maximum Sharpe ratio allocation across any set of tickers using real Yahoo Finance data. Outputs optimized weights, efficient frontier scatter plot, and a full risk metrics suite: annual return, volatility, Sharpe, Sortino, Calmar, VaR (95%), CVaR/Expected Shortfall (95%), and max drawdown. Benchmarks against SPY (or any ticker) with alpha, tracking error, and information ratio. Includes a 60-day performance chart comparing the optimised portfolio against the benchmark.

Options Analytics

Black-Scholes option pricing engine with full Greeks: Delta, Gamma, Theta, Vega, Rho , plus intrinsic value, time value, and moneyness classification (ITM/ATM/OTM). Interactive payoff diagram showing P&L at expiry vs current value, and a theoretical volatility smile across strikes. Supports both calls and puts with adjustable spot, strike, time to expiry, risk-free rate, and volatility inputs.

Strategy Backtesting

Historical strategy testing on any US ticker with five strategies: Buy & Hold, SMA Crossover, RSI, MACD, and Momentum. Accounts for transaction costs and slippage. Reports CAGR, Sharpe, Sortino, Calmar, max drawdown, win rate, profit factor, and total trade count. Equity curve chart compares strategy vs buy & hold after costs.

Company Valuation (DCF)

Fetches real financial statements from Yahoo Finance: revenue, EBITDA, net income, free cash flow, debt, cash, and displays valuation multiples: P/E, EV/EBITDA, P/B, P/S. Runs a 5-year DCF model with user-adjustable WACC, revenue growth, terminal growth rate, and margin improvement assumptions. Returns intrinsic value per share, upside/downside vs market price, PV of FCFs, terminal value, and a BUY/HOLD/SELL recommendation. Projection chart shows year-by-year revenue, FCF, and discounted FCF.

Scenario Simulator

Real-time macroeconomic stress testing with five adjustable variables: interest rate, GDP growth, unemployment, inflation, and market volatility (VIX). Five preset scenarios: Base Case, Rate Hike, Recession, Bull Market, and Stagflation. Updates default rate, portfolio return, VaR, Sharpe, loan approval rate, revenue, and credit stress score (0–100) instantly as sliders move. Generates a narrative analysis with actionable recommendations based on the scenario.

Market Intelligence

Live market data dashboard via Yahoo Finance covering major indices (S&P 500, NASDAQ, Dow Jones, VIX, Russell 2000), commodities (Gold, Oil, Bitcoin, Silver), forex (EUR/USD, USD/JPY, GBP/USD), and Treasury yields (2Y, 10Y, 30Y). Sector performance bars for 8 GICS sectors. Interactive price chart for any ticker with 1W/1M/3M/6M/1Y periods. Top 5 gainers and losers from the S&P 500.

Executive Intelligence (BI)

Business intelligence dashboard with real data from the platform database. Customer segmentation donut by segment (Retail, SME, Corporate, Private Banking) with average loan amounts and default rates. Regional analysis table with customer counts, default rates, and fraud alerts by region. Monthly revenue trend bar chart. AI-generated business insights with priority levels and color-coded recommendations.

AI Financial Assistant

RAG-based document analysis using Gemini. Upload any PDF: annual reports, earnings transcripts, investor presentations, and ask natural language questions. The pipeline chunks the document, retrieves the most relevant passages via keyword scoring, and sends them to Gemini with a financial analyst system prompt. Suggested questions include: summarize this document, what are the biggest risks, how did revenue change, what are the key financial ratios.

ML Model Monitoring

MLOps dashboard showing the health of both deployed models. For each model: version, status (healthy/missing), last trained date, model size, total prediction volume, 7-day prediction count, key performance metrics, and a drift indicator. Includes trend charts for daily prediction volume and average scores over the last 30 days. Full audit log showing every prediction with timestamp, action, recommendation, and probability of default.