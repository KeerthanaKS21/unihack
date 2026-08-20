import sys
from pathlib import Path

# Add parent directory to path so app modules can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent))

from seed import seed_database

if __name__ == "__main__":
    print("Running dynamic data-driven seeding via seed_procurement.py wrapper...")
    seed_database()
