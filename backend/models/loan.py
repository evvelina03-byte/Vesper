from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime
import uuid
import enum


class LoanRecommendation(str, enum.Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    REVIEW = "REVIEW"


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)

    # Applicant features
    age = Column(Integer)
    income = Column(Float)
    loan_amount = Column(Float)
    loan_term = Column(Integer)
    credit_score = Column(Integer)
    employment_years = Column(Float)
    debt_to_income = Column(Float)
    num_credit_lines = Column(Integer)
    num_delinquencies = Column(Integer, default=0)
    loan_purpose = Column(String)

    # Model outputs
    risk_score = Column(Float)
    probability_of_default = Column(Float)
    recommendation = Column(Enum(LoanRecommendation))
    model_version = Column(String, default="xgboost_v1")

    # Audit
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="loan_applications")
