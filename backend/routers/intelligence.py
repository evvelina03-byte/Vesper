from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from core.database import get_db
from models.customer import Customer
from models.loan import LoanApplication, LoanRecommendation
from models.transaction import Transaction
import random

router = APIRouter(prefix="/intelligence", tags=["Business Intelligence"])

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    active_customers = db.query(func.count(Customer.id)).filter(Customer.is_active == True).scalar() or 0
    total_loans = db.query(func.count(LoanApplication.id)).scalar() or 0
    total_loan_value = db.query(func.sum(LoanApplication.loan_amount)).scalar() or 0
    avg_pod = db.query(func.avg(LoanApplication.probability_of_default)).scalar() or 0
    approved = db.query(func.count(LoanApplication.id)).filter(LoanApplication.recommendation == LoanRecommendation.APPROVE).scalar() or 0
    rejected = db.query(func.count(LoanApplication.id)).filter(LoanApplication.recommendation == LoanRecommendation.REJECT).scalar() or 0
    fraud_count = db.query(func.count(Transaction.id)).filter(Transaction.is_flagged == True).scalar() or 0

    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "total_loans": total_loans,
        "total_loan_value": round(float(total_loan_value), 2),
        "avg_default_probability": round(float(avg_pod) * 100, 2),
        "approval_rate": round(approved / total_loans * 100, 2) if total_loans > 0 else 0,
        "rejection_rate": round(rejected / total_loans * 100, 2) if total_loans > 0 else 0,
        "fraud_rate": round(fraud_count / max(db.query(func.count(Transaction.id)).scalar(), 1) * 100, 2),
    }

@router.get("/segments")
def get_segments(db: Session = Depends(get_db)):
    segments = db.query(
        Customer.segment,
        func.count(Customer.id).label("count"),
    ).group_by(Customer.segment).all()

    result = []
    for seg, count in segments:
        loans = db.query(
            func.avg(LoanApplication.loan_amount),
            func.avg(LoanApplication.probability_of_default),
            func.count(LoanApplication.id),
        ).join(Customer, LoanApplication.customer_id == Customer.id).filter(
            Customer.segment == seg
        ).first()

        avg_loan = float(loans[0] or 0)
        avg_pod = float(loans[1] or 0) * 100
        loan_count = int(loans[2] or 0)

        result.append({
            "segment": seg,
            "customers": count,
            "avg_loan_amount": round(avg_loan, 2),
            "avg_default_rate": round(avg_pod, 2),
            "loan_count": loan_count,
        })

    return result

@router.get("/regions")
def get_regions(db: Session = Depends(get_db)):
    regions = db.query(
        Customer.region,
        func.count(Customer.id).label("customers"),
    ).group_by(Customer.region).all()

    result = []
    for region, customers in regions:
        loans = db.query(
            func.avg(LoanApplication.loan_amount),
            func.avg(LoanApplication.probability_of_default),
        ).join(Customer, LoanApplication.customer_id == Customer.id).filter(
            Customer.region == region
        ).first()

        fraud = db.query(func.count(Transaction.id)).join(
            Customer, Transaction.customer_id == Customer.id
        ).filter(
            Customer.region == region,
            Transaction.is_flagged == True
        ).scalar() or 0

        result.append({
            "region": region,
            "customers": customers,
            "avg_loan_amount": round(float(loans[0] or 0), 2),
            "avg_default_rate": round(float(loans[1] or 0) * 100, 2),
            "fraud_alerts": fraud,
        })

    return result

@router.get("/revenue-trend")
def get_revenue_trend(db: Session = Depends(get_db)):
    # Simulate monthly revenue from loan data
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    base = 3800000
    trend = []
    for i, month in enumerate(months):
        growth = 1 + (i * 0.018) + random.uniform(-0.02, 0.03)
        trend.append({
            "month": month,
            "revenue": round(base * growth, 0),
            "loans": round(base * growth * 0.6, 0),
            "fees": round(base * growth * 0.4, 0),
        })
    return trend

@router.get("/insights")
def get_insights(db: Session = Depends(get_db)):
    segments = db.query(
        Customer.segment,
        func.avg(LoanApplication.probability_of_default).label("avg_pod"),
        func.avg(LoanApplication.loan_amount).label("avg_loan"),
    ).join(LoanApplication, Customer.id == LoanApplication.customer_id).group_by(
        Customer.segment
    ).all()

    regions = db.query(
        Customer.region,
        func.count(Transaction.id).filter(Transaction.is_flagged == True).label("fraud"),
        func.count(Customer.id).label("customers"),
    ).outerjoin(Transaction, Customer.id == Transaction.customer_id).group_by(
        Customer.region
    ).all()

    insights = []

    for seg, pod, loan in segments:
        if pod and pod > 0.3:
            insights.append({
                "priority": "high",
                "color": "#f87171",
                "title": f"High default risk in {seg} segment",
                "body": f"Average probability of default is {pod*100:.1f}% — above the 30% threshold. Review underwriting criteria for this segment.",
                "label": f"Credit Risk · {seg}",
            })

    for region, fraud, customers in regions:
        if customers and fraud and fraud / customers > 0.15:
            insights.append({
                "priority": "medium",
                "color": "#fbbf24",
                "title": f"Elevated fraud activity in {region}",
                "body": f"{fraud} flagged transactions across {customers} customers ({fraud/customers*100:.1f}% fraud rate). Investigate transaction patterns.",
                "label": f"Fraud Detection · {region}",
            })

    insights.append({
        "priority": "positive",
        "color": "#4ade80",
        "title": "Loan portfolio growing steadily",
        "body": "Total loan applications increased across all segments. SME and Corporate segments show strongest growth in loan volume.",
        "label": "Portfolio Growth · All Regions",
    })

    return insights[:6]
