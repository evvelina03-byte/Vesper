from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import engine, Base
from routers import auth, dashboard, credit_risk, fraud, portfolio, documents, market, options, backtesting
import models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Financial Intelligence Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(credit_risk.router)
app.include_router(fraud.router)
app.include_router(portfolio.router)
app.include_router(documents.router)
app.include_router(market.router)
app.include_router(options.router)
app.include_router(backtesting.router)

@app.get("/")
def root():
    return {"platform": "Vesper", "status": "operational", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
