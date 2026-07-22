from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.loan import LoanApplication, LoanRecommendation
from models.audit import AuditLog
from pydantic import BaseModel
from typing import Optional
import pickle
import numpy as np
import os
import uuid

router = APIRouter(prefix="/credit-risk", tags=["Credit Risk"])

# Load model and explainer
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml', 'credit_risk')

def load_model():
    with open(os.path.join(MODEL_DIR, 'model.pkl'), 'rb') as f:
        return pickle.load(f)

def load_explainer():
    with open(os.path.join(MODEL_DIR, 'explainer.pkl'), 'rb') as f:
        return pickle.load(f)

FEATURES = [
    'age', 'income', 'loan_amount', 'loan_term',
    'credit_score', 'employment_years', 'debt_to_income',
    'num_credit_lines', 'num_delinquencies'
]

class LoanRequest(BaseModel):
    age: int
    income: float
    loan_amount: float
    loan_term: int
    credit_score: int
    employment_years: float
    debt_to_income: float
    num_credit_lines: int
    num_delinquencies: int
    loan_purpose: Optional[str] = "personal"
    customer_id: Optional[str] = None

class ShapFeature(BaseModel):
    feature: str
    value: float
    shap_value: float
    impact: str

class PredictionResponse(BaseModel):
    probability_of_default: float
    risk_score: float
    recommendation: str
    shap_values: list[ShapFeature]
    model_version: str

@router.post("/predict", response_model=PredictionResponse)
def predict(request: LoanRequest, db: Session = Depends(get_db)):
    try:
        model = load_model()
        explainer = load_explainer()
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Model not trained yet. Run train.py first.")

    # Prepare features
    features = np.array([[
        request.age,
        request.income,
        request.loan_amount,
        request.loan_term,
        request.credit_score,
        request.employment_years,
        request.debt_to_income,
        request.num_credit_lines,
        request.num_delinquencies,
    ]])

    # Predict
    pod = float(model.predict_proba(features)[0][1])
    risk_score = round(pod * 100, 2)

    if pod < 0.2:
        recommendation = "APPROVE"
    elif pod < 0.5:
        recommendation = "REVIEW"
    else:
        recommendation = "REJECT"

    # SHAP
    shap_vals = explainer.shap_values(features)
    if isinstance(shap_vals, list):
        shap_vals = shap_vals[1]
    shap_vals = shap_vals[0]

    feature_values = features[0]
    shap_features = []
    for i, feat in enumerate(FEATURES):
        shap_features.append(ShapFeature(
            feature=feat.replace('_', ' ').title(),
            value=float(feature_values[i]),
            shap_value=float(shap_vals[i]),
            impact="positive" if shap_vals[i] > 0 else "negative",
        ))

    # Sort by absolute shap value
    shap_features.sort(key=lambda x: abs(x.shap_value), reverse=True)

    # Save to DB
    loan = LoanApplication(
        id=uuid.uuid4(),
        customer_id=uuid.UUID(request.customer_id) if request.customer_id else None,
        age=request.age,
        income=request.income,
        loan_amount=request.loan_amount,
        loan_term=request.loan_term,
        credit_score=request.credit_score,
        employment_years=request.employment_years,
        debt_to_income=request.debt_to_income,
        num_credit_lines=request.num_credit_lines,
        num_delinquencies=request.num_delinquencies,
        loan_purpose=request.loan_purpose,
        risk_score=risk_score,
        probability_of_default=pod,
        recommendation=LoanRecommendation(recommendation),
    )
    db.add(loan)

    # Audit log
    audit = AuditLog(
        action="loan_prediction",
        entity_type="loan_application",
        entity_id=loan.id,
        details={
            "recommendation": recommendation,
            "probability_of_default": pod,
            "risk_score": risk_score,
        }
    )
    db.add(audit)
    db.commit()

    return PredictionResponse(
        probability_of_default=round(pod, 4),
        risk_score=risk_score,
        recommendation=recommendation,
        shap_values=shap_features,
        model_version="xgboost_v1",
    )

@router.get("/history")
def get_history(limit: int = 20, db: Session = Depends(get_db)):
    loans = db.query(LoanApplication).order_by(
        LoanApplication.created_at.desc()
    ).limit(limit).all()

    return [
        {
            "id": str(loan.id),
            "credit_score": loan.credit_score,
            "loan_amount": loan.loan_amount,
            "income": loan.income,
            "risk_score": loan.risk_score,
            "probability_of_default": loan.probability_of_default,
            "recommendation": loan.recommendation.value if loan.recommendation else None,
            "created_at": loan.created_at.isoformat() if loan.created_at else None,
        }
        for loan in loans
    ]
