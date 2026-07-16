from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import hash_password, verify_password, create_access_token
from models.user import User
from schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create token
    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        full_name=user.full_name,
        role=user.role.value,
    )


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        full_name=user.full_name,
        role=user.role.value,
    )


@router.get("/me", response_model=UserResponse)
def get_me(db: Session = Depends(get_db)):
    # Placeholder — we'll add JWT middleware next
    raise HTTPException(status_code=401, detail="Not implemented yet")
