from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from models.loan import LoanApplication, LoanRecommendation
from models.transaction import Transaction
from models.audit import AuditLog
import os
import pickle
from datetime import datetime, timedelta

router = APIRouter(prefix="/monitoring", tags=["ML Monitoring"])

MODEL_DIR_CREDIT = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml', 'credit_risk')
MODEL_DIR_FRAUD = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml', 'fraud')

def get_model_info(model_path: str) -> dict:
    try:
        stat = os.stat(model_path)
        return {
            "exists": True,
            "last_trained": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "size_kb": round(stat.st_size / 1024, 1),
        }
    except:
        return {"exists": False, "last_trained": None, "size_kb": 0}

@router.get("/models")
def get_model_status(db: Session = Depends(get_db)):
    # Credit risk model info
    credit_model_info = get_model_info(os.path.join(MODEL_DIR_CREDIT, 'model.pkl'))
    fraud_model_info = get_model_info(os.path.join(MODEL_DIR_FRAUD, 'xgb_model.pkl'))

    # Credit risk metrics from DB
    total_predictions = db.query(func.count(LoanApplication.id)).filter(
        LoanApplication.probability_of_default.isnot(None)
    ).scalar() or 0

    approved = db.query(func.count(LoanApplication.id)).filter(
        LoanApplication.recommendation == LoanRecommendation.APPROVE
    ).scalar() or 0

    rejected = db.query(func.count(LoanApplication.id)).filter(
        LoanApplication.recommendation == LoanRecommendation.REJECT
    ).scalar() or 0

    avg_pod = db.query(func.avg(LoanApplication.probability_of_default)).scalar() or 0
    avg_risk_score = db.query(func.avg(LoanApplication.risk_score)).scalar() or 0

    # Recent predictions (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_predictions = db.query(func.count(LoanApplication.id)).filter(
        LoanApplication.created_at >= week_ago
    ).scalar() or 0

    # Fraud model metrics
    total_transactions = db.query(func.count(Transaction.id)).scalar() or 0
    flagged = db.query(func.count(Transaction.id)).filter(
        Transaction.is_flagged == True
    ).scalar() or 0
    avg_fraud_score = db.query(func.avg(Transaction.fraud_score)).filter(
        Transaction.fraud_score.isnot(None)
    ).scalar() or 0

    recent_fraud = db.query(func.count(Transaction.id)).filter(
        Transaction.created_at >= week_ago,
        Transaction.is_flagged == True
    ).scalar() or 0

    return {
        "credit_risk": {
            "model_version": "xgboost_v1",
            "status": "healthy" if credit_model_info["exists"] else "missing",
            "last_trained": credit_model_info["last_trained"],
            "model_size_kb": credit_model_info["size_kb"],
            "total_predictions": total_predictions,
            "recent_predictions_7d": recent_predictions,
            "avg_probability_of_default": round(float(avg_pod) * 100, 2),
            "avg_risk_score": round(float(avg_risk_score), 2),
            "approval_rate": round(approved / total_predictions * 100, 2) if total_predictions > 0 else 0,
            "rejection_rate": round(rejected / total_predictions * 100, 2) if total_predictions > 0 else 0,
            "drift_indicator": "stable" if float(avg_pod) < 0.4 else "drift_detected",
        },
        "fraud_detection": {
            "model_version": "isolation_forest_v1 + xgboost_v1",
            "status": "healthy" if fraud_model_info["exists"] else "missing",
            "last_trained": fraud_model_info["last_trained"],
            "model_size_kb": fraud_model_info["size_kb"],
            "total_scored": total_transactions,
            "recent_flagged_7d": recent_fraud,
            "flag_rate": round(flagged / total_transactions * 100, 2) if total_transactions > 0 else 0,
            "avg_fraud_score": round(float(avg_fraud_score), 2),
            "drift_indicator": "stable" if float(avg_fraud_score) < 0.5 else "drift_detected",
        },
    }

@router.get("/predictions/trend")
def get_prediction_trend(db: Session = Depends(get_db)):
    # Last 30 days of predictions grouped by day
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    loans = db.query(
        func.date(LoanApplication.created_at).label("date"),
        func.count(LoanApplication.id).label("predictions"),
        func.avg(LoanApplication.probability_of_default).label("avg_pod"),
    ).filter(
        LoanApplication.created_at >= thirty_days_ago
    ).group_by(
        func.date(LoanApplication.created_at)
    ).order_by(
        func.date(LoanApplication.created_at)
    ).all()

    fraud = db.query(
        func.date(Transaction.created_at).label("date"),
        func.count(Transaction.id).label("scored"),
        func.avg(Transaction.fraud_score).label("avg_score"),
    ).filter(
        Transaction.created_at >= thirty_days_ago
    ).group_by(
        func.date(Transaction.created_at)
    ).order_by(
        func.date(Transaction.created_at)
    ).all()

    return {
        "credit_risk": [
            {
                "date": str(r.date),
                "predictions": r.predictions,
                "avg_pod": round(float(r.avg_pod) * 100, 2) if r.avg_pod else 0,
            }
            for r in loans
        ],
        "fraud": [
            {
                "date": str(r.date),
                "scored": r.scored,
                "avg_score": round(float(r.avg_score), 2) if r.avg_score else 0,
            }
            for r in fraud
        ],
    }

@router.get("/audit-log")
def get_audit_log(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": str(log.id),
            "action": log.action,
            "entity_type": log.entity_type,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at is not None else None,
        }
        for log in logs
    ]
