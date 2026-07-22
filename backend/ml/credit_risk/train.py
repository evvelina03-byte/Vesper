import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pickle
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.loan import LoanApplication
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from xgboost import XGBClassifier
import shap

FEATURES = [
    'age', 'income', 'loan_amount', 'loan_term',
    'credit_score', 'employment_years', 'debt_to_income',
    'num_credit_lines', 'num_delinquencies'
]

def train():
    print("Loading data from database...")
    db = SessionLocal()
    loans = db.query(LoanApplication).filter(
        LoanApplication.probability_of_default.isnot(None)
    ).all()
    db.close()

    if len(loans) < 50:
        print("Not enough data to train. Run seed_db.py first.")
        return

    data = []
    for loan in loans:
        row = {
            'age': loan.age or 30,
            'income': loan.income or 50000,
            'loan_amount': loan.loan_amount or 10000,
            'loan_term': loan.loan_term or 36,
            'credit_score': loan.credit_score or 650,
            'employment_years': loan.employment_years or 2,
            'debt_to_income': loan.debt_to_income or 0.3,
            'num_credit_lines': loan.num_credit_lines or 3,
            'num_delinquencies': loan.num_delinquencies or 0,
            'default': 1 if loan.probability_of_default > 0.5 else 0,
        }
        data.append(row)

    df = pd.DataFrame(data)
    X = df[FEATURES]
    y = df['default']

    print(f"Training on {len(df)} samples — {y.sum()} defaults ({y.mean()*100:.1f}%)")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss',
        verbosity=0,
    )
    model.fit(X_train, y_train)

    y_pred_proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_pred_proba)
    print(f"AUC-ROC: {auc:.4f}")

    explainer = shap.TreeExplainer(model)

    model_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(model_dir, 'model.pkl'), 'wb') as f:
        pickle.dump(model, f)
    with open(os.path.join(model_dir, 'explainer.pkl'), 'wb') as f:
        pickle.dump(explainer, f)

    print(f"Model saved to {model_dir}")
    print("Training complete.")

if __name__ == '__main__':
    train()
