import sys
import os

# Add root, backend, and backend/app directories to sys.path for Vercel Serverless Function resolution
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
app_dir = os.path.join(backend_dir, "app")

for d in [root_dir, backend_dir, app_dir]:
    if d and os.path.exists(d) and d not in sys.path:
        sys.path.insert(0, d)

try:
    from app.main import app
except ImportError:
    from backend.app.main import app
