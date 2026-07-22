from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from models.transaction import Transaction
from pydantic import BaseModel
from typing import Optional
import pickle
import numpy as np
import os
import uuid
from datetime import datetime

router = APIRouter(prefix="/fraud", tags=["Fraud Detection"])

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml', 'fraud')

def load_models():
    with open(os.path.join(MODEL_DIR, 'xgb_model.pkl'), 'rb') as f:
        xgb = pickle.load(f)
    with open(os.path.join(MODEL_DIR, 'label_encoder.pkl'), 'rb') as f:
        le = pickle.load(f)
    return xgb, le

class TransactionRequest(BaseModel):
    amount: float
    merchant_category: str
    merchant_name: Optional[str] = None
    is_online: bool = False
    account_age_days: Optional[int] = 365
    customer_id: Optional[str] = None

class FraudResponse(BaseModel):
    fraud_score: float
    is_flagged: bool
    risk_level: str
    anomaly_reason: Optional[str]

@router.post("/score", response_model=FraudResponse)
def score_transaction(request: TransactionRequest, db: Session = Depends(get_db)):
    xgb, le = load_models()

    # Encode category
    try:
        category_encoded = le.transform([request.merchant_category])[0]
    except:
        category_encoded = 0

    hour = datetime.utcnow().hour
    features = np.array([[
        request.amount,
        1 if request.is_online else 0,
        request.account_age_days or 365,
        hour,
        category_encoded,
    ]])

    fraud_score = float(xgb.predict_proba(features)[0][1])
    is_flagged = fraud_score > 0.7

    if fraud_score > 0.9:
        risk_level = "CRITICAL"
    elif fraud_score > 0.7:
        risk_level = "HIGH"
    elif fraud_score > 0.4:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    reasons = []
    if request.merchant_category in ['crypto', 'wire_transfer']:
        reasons.append("High-risk merchant category")
    if request.amount > 5000:
        reasons.append("Large transaction amount")
    if request.is_online and request.amount > 2000:
        reasons.append("Large online transaction")
    anomaly_reason = " · ".join(reasons) if reasons else None

    # Save transaction
    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=uuid.UUID(request.customer_id) if request.customer_id else None,
        transaction_number=f'TX-{str(uuid.uuid4())[:6].upper()}',
        amount=request.amount,
        merchant_category=request.merchant_category,
        merchant_name=request.merchant_name,
        is_online=request.is_online,
        timestamp=datetime.utcnow(),
        fraud_score=round(fraud_score, 4),
        is_flagged=is_flagged,
        anomaly_reason=anomaly_reason,
    )
    db.add(txn)
    db.commit()

    return FraudResponse(
        fraud_score=round(fraud_score, 4),
        is_flagged=is_flagged,
        risk_level=risk_level,
        anomaly_reason=anomaly_reason,
    )

@router.get("/feed")
def get_feed(limit: int = 20, db: Session = Depends(get_db)):
    transactions = db.query(Transaction).order_by(
        Transaction.timestamp.desc()
    ).limit(limit).all()

    return [
        {
            "id": str(t.id)[:8].upper(),
            "transaction_number": t.transaction_number,
            "amount": t.amount,
            "merchant": t.merchant_name or t.merchant_category,
            "merchant_category": t.merchant_category,
            "is_online": t.is_online,
            "fraud_score": t.fraud_score,
            "is_flagged": t.is_flagged,
            "risk_level": "HIGH" if t.fraud_score and t.fraud_score > 0.7 else "MEDIUM" if t.fraud_score and t.fraud_score > 0.4 else "LOW",
            "anomaly_reason": t.anomaly_reason,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
        }
        for t in transactions
    ]

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    flagged = db.query(Transaction).filter(
        Transaction.is_flagged == True
    ).order_by(Transaction.fraud_score.desc()).limit(10).all()

    return [
        {
            "id": str(t.id)[:8].upper(),
            "transaction_number": t.transaction_number,
            "amount": t.amount,
            "merchant": t.merchant_name or t.merchant_category,
            "fraud_score": t.fraud_score,
            "risk_level": "CRITICAL" if t.fraud_score and t.fraud_score > 0.9 else "HIGH",
            "anomaly_reason": t.anomaly_reason,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
        }
        for t in flagged
    ]

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Transaction.id)).scalar() or 0
    flagged = db.query(func.count(Transaction.id)).filter(Transaction.is_flagged == True).scalar() or 0
    avg_score = db.query(func.avg(Transaction.fraud_score)).scalar() or 0

    return {
        "total_transactions": total,
        "flagged_transactions": flagged,
        "flag_rate": round(flagged / total * 100, 2) if total > 0 else 0,
        "avg_fraud_score": round(avg_score, 4),
    }
