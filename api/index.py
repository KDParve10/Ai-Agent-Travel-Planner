import os
import sys

# Add the backend directory to sys.path so 'from app.main import app' works
backend_path = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.append(backend_path)

from app.main import app

# Vercel needs the app to be exported
# Since app is already imported from backend.app.main, we are good.
