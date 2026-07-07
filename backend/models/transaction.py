from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime
import uuid


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    transaction_number = Column(String, unique=True, nullable=False)

    # Transaction features
    amount = Column(Float, nullable=False)
    merchant_category = Column(String)
    merchant_name = Column(String)
    is_online = Column(Boolean, default=False)
    location = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Model outputs
    fraud_score = Column(Float)
    is_flagged = Column(Boolean, default=False)
    anomaly_reason = Column(String)
    model_version = Column(String, default="isolation_forest_v1")

    # Audit
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="transactions")
