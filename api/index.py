import sys
import os

# Ensure root, backend, and app directories are in sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
app_dir = os.path.join(backend_dir, "app")

for d in [root_dir, backend_dir, app_dir]:
    if d and os.path.exists(d) and d not in sys.path:
        sys.path.insert(0, d)

# Direct top-level import for Vercel static inspection detection
from backend.app.main import app
