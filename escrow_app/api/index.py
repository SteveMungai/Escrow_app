"""Vercel entrypoint: exposes the Flask app in backend/app.py as a serverless function.

vercel.json rewrites every /api/* request here, and Flask then routes on the
original path (/api/login, /api/projects, ...).
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app import app  # noqa: E402,F401  (Vercel looks for a top-level `app`)
