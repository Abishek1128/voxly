from backend.db.database import engine, Base
from backend.models import *
from sqlalchemy import inspect

def create_tables():
    print("Registered tables:", Base.metadata.tables.keys())
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    print("Tables in DB:", inspector.get_table_names())

if __name__ == "__main__":
    create_tables()
