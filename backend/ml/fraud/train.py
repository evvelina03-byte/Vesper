import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pickle
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.transaction import Transaction
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report

FEATURES = ['amount', 'is_online', 'account_age_days', 'hour_of_day', 'category_encoded']

def train():
    print("Loading transaction data...")
    db = SessionLocal()
    transactions = db.query(Transaction).all()
    db.close()

    if len(transactions) < 50:
        print("Not enough data. Run seed_db.py first.")
        return

    data = []
    for t in transactions:
        data.append({
            'amount': t.amount or 0,
            'is_online': 1 if t.is_online else 0,
            'account_age_days': 365,
            'hour_of_day': t.timestamp.hour if t.timestamp else 12,
            'merchant_category': t.merchant_category or 'retail',
            'is_fraud': 1 if t.is_flagged else 0,
        })

    df = pd.DataFrame(data)

    # Encode category
    le = LabelEncoder()
    df['category_encoded'] = le.fit_transform(df['merchant_category'])

    X = df[FEATURES]
    y = df['is_fraud']

    print(f"Training on {len(df)} transactions — {y.sum()} flagged ({y.mean()*100:.1f}%)")

    # Isolation Forest (unsupervised)
    iso_forest = IsolationForest(contamination=0.1, random_state=42)
    iso_forest.fit(X)

    # XGBoost (supervised)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    xgb_model = XGBClassifier(n_estimators=100, max_depth=4, random_state=42, verbosity=0, eval_metric='logloss')
    xgb_model.fit(X_train, y_train)

    y_pred = xgb_model.predict_proba(X_test)[:, 1]
    try:
        auc = roc_auc_score(y_test, y_pred)
        print(f"XGBoost AUC-ROC: {auc:.4f}")
    except:
        print("AUC could not be computed (single class)")

    model_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(model_dir, 'isolation_forest.pkl'), 'wb') as f:
        pickle.dump(iso_forest, f)
    with open(os.path.join(model_dir, 'xgb_model.pkl'), 'wb') as f:
        pickle.dump(xgb_model, f)
    with open(os.path.join(model_dir, 'label_encoder.pkl'), 'wb') as f:
        pickle.dump(le, f)

    print("Fraud models saved.")

if __name__ == '__main__':
    train()
