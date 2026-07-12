import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.user import Employee
from app.core.security import get_password_hash
from sqlalchemy.exc import IntegrityError
import uuid

def seed():
    # Make sure all tables are created. In a real environment, you'd use alembic.
    # Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    
    admin_email = "admin@assetflow.com"
    existing_admin = db.query(Employee).filter(Employee.email == admin_email).first()
    
    if existing_admin:
        print("Admin user already exists!")
    else:
        admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
        if admin_password == "admin123":
            print("WARNING: Using default password 'admin123'. Change this immediately in a production environment!")
            
        admin_user = Employee(
            id=f"emp-{uuid.uuid4().hex[:8]}",
            name="System Admin",
            email=admin_email,
            password_hash=get_password_hash(admin_password),
            role="Admin",
            status="Active"
        )
        db.add(admin_user)
        try:
            db.commit()
            print("Admin user created successfully!")
            print(f"Email: {admin_email}")
        except IntegrityError:
            db.rollback()
            print("Failed to create admin user due to a database constraint violation.")
        
    db.close()

if __name__ == "__main__":
    seed()
