from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime
import uuid


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    name = Column(String, nullable=False)

    # Holdings as JSON: {"AAPL": 0.3, "MSFT": 0.2}
    holdings = Column(JSONB, default={})

    # Computed metrics
    total_value = Column(Float, default=0.0)
    daily_return = Column(Float, default=0.0)
    sharpe_ratio = Column(Float, default=0.0)
    volatility = Column(Float, default=0.0)
    var_95 = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="portfolios")
    customer = relationship("Customer", back_populates="portfolios")
