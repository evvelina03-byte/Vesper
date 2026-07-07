from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime
import uuid
import enum


class UserRole(str, enum.Enum):
    EXECUTIVE = "executive"
    RISK_ANALYST = "risk_analyst"
    PORTFOLIO_MANAGER = "portfolio_manager"
    FRAUD_INVESTIGATOR = "fraud_investigator"
    RELATIONSHIP_MANAGER = "relationship_manager"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.RISK_ANALYST, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    portfolios = relationship("Portfolio", back_populates="user")
    documents = relationship("Document", back_populates="user")
