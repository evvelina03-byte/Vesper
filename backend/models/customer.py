from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime
import uuid


class Customer(Base):
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_number = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    age = Column(Integer)
    region = Column(String)
    segment = Column(String)
    account_age_days = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    loan_applications = relationship("LoanApplication", back_populates="customer")
    transactions = relationship("Transaction", back_populates="customer")
    portfolios = relationship("Portfolio", back_populates="customer")
