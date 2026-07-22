import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from core.database import engine, SessionLocal
from models.customer import Customer
from models.loan import LoanApplication, LoanRecommendation
from models.transaction import Transaction
from faker import Faker
import random
import uuid
from datetime import datetime, timedelta

fake = Faker()
random.seed(42)

def seed():
    db = SessionLocal()
    print("Seeding database...")

    # Clear existing data
    db.query(Transaction).delete()
    db.query(LoanApplication).delete()
    db.query(Customer).delete()
    db.commit()

    segments = ['Retail', 'SME', 'Corporate', 'Private Banking']
    regions = ['Region A', 'Region B', 'Region C', 'Region D']
    loan_purposes = ['mortgage', 'auto', 'personal', 'business']
    merchant_categories = ['retail', 'food', 'travel', 'electronics', 'crypto', 'wire_transfer']
    merchant_names = {
        'retail': ['Amazon', 'Zara', 'IKEA', 'H&M'],
        'food': ['Uber Eats', 'Deliveroo', 'McDonald\'s'],
        'travel': ['Air France', 'Booking.com', 'Airbnb'],
        'electronics': ['Apple Store', 'ElectroMart', 'Samsung'],
        'crypto': ['CryptoExchange', 'Binance', 'Coinbase'],
        'wire_transfer': ['IntlWireTransfer', 'SWIFT Transfer'],
    }

    customers = []
    for i in range(200):
        customer = Customer(
            id=uuid.uuid4(),
            customer_number=f'CUST-{str(i+1).zfill(4)}',
            full_name=fake.name(),
            email=fake.unique.email(),
            age=random.randint(22, 72),
            region=random.choice(regions),
            segment=random.choice(segments),
            account_age_days=random.randint(30, 3650),
            is_active=random.random() > 0.05,
            created_at=fake.date_time_between(start_date='-5y', end_date='now'),
        )
        customers.append(customer)
        db.add(customer)

    db.commit()
    print(f"Created {len(customers)} customers")

    # Loan applications
    loans = []
    for customer in customers:
        num_loans = random.randint(0, 3)
        for _ in range(num_loans):
            income = random.uniform(20000, 250000)
            loan_amount = random.uniform(5000, 500000)
            credit_score = random.randint(300, 850)
            dti = random.uniform(0.1, 0.65)
            emp_years = random.uniform(0, 30)
            pod = max(0, min(1, (
                (850 - credit_score) / 850 * 0.4 +
                dti * 0.3 +
                (1 - min(emp_years, 10) / 10) * 0.2 +
                random.uniform(-0.1, 0.1)
            )))
            risk_score = pod * 100
            if pod < 0.2:
                rec = LoanRecommendation.APPROVE
            elif pod < 0.5:
                rec = LoanRecommendation.REVIEW
            else:
                rec = LoanRecommendation.REJECT

            loan = LoanApplication(
                id=uuid.uuid4(),
                customer_id=customer.id,
                age=customer.age,
                income=round(income, 2),
                loan_amount=round(loan_amount, 2),
                loan_term=random.choice([12, 24, 36, 48, 60]),
                credit_score=credit_score,
                employment_years=round(emp_years, 1),
                debt_to_income=round(dti, 3),
                num_credit_lines=random.randint(1, 15),
                num_delinquencies=random.randint(0, 5),
                loan_purpose=random.choice(loan_purposes),
                risk_score=round(risk_score, 2),
                probability_of_default=round(pod, 4),
                recommendation=rec,
                created_at=fake.date_time_between(start_date='-2y', end_date='now'),
            )
            loans.append(loan)
            db.add(loan)

    db.commit()
    print(f"Created {len(loans)} loan applications")

    # Transactions
    transactions = []
    for customer in customers:
        num_txns = random.randint(5, 30)
        for _ in range(num_txns):
            category = random.choice(merchant_categories)
            amount = random.uniform(10, 15000)
            is_crypto_or_wire = category in ['crypto', 'wire_transfer']
            is_large = amount > 5000
            fraud_score = min(1, max(0,
                (0.7 if is_crypto_or_wire else 0) +
                (0.3 if is_large else 0) +
                random.uniform(-0.2, 0.3)
            ))
            is_flagged = fraud_score > 0.7

            txn = Transaction(
                id=uuid.uuid4(),
                customer_id=customer.id,
                transaction_number=f'TX-{fake.unique.numerify("######")}',
                amount=round(amount, 2),
                merchant_category=category,
                merchant_name=random.choice(merchant_names[category]),
                is_online=random.random() > 0.3,
                location=fake.city(),
                timestamp=fake.date_time_between(start_date='-6m', end_date='now'),
                fraud_score=round(fraud_score, 4),
                is_flagged=is_flagged,
                anomaly_reason='High-risk merchant category' if is_crypto_or_wire else ('Large transaction amount' if is_large else None),
                created_at=datetime.utcnow(),
            )
            transactions.append(txn)
            db.add(txn)

    db.commit()
    print(f"Created {len(transactions)} transactions")
    print("Done! Database seeded successfully.")
    db.close()

if __name__ == '__main__':
    seed()
