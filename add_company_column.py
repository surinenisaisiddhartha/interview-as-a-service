from db.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_name VARCHAR"))
    conn.commit()
    print("✅ company_name column added to jobs table.")
