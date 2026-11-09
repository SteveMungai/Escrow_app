"""One-time setup for a NEW, empty database (e.g.  Supabase project).

 This script creates every table from models.py, then marks the
Alembic history as up to date so future `flask db migrate/upgrade` work.

Run from the backend/ folder, with DATABASE_URL pointing at Supabase:
    python init_db.py
"""
from flask_migrate import stamp

from app import app
from models import db

with app.app_context():
    db.create_all()
    stamp(directory="migrations", revision="head")
    print("Tables created and Alembic stamped at head.")
