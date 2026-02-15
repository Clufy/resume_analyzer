
import sys
import os

# Add backend to path
sys.path.append(os.getcwd())

try:
    import app.main
    print("Successfully imported app.main")
except Exception as e:
    import traceback
    traceback.print_exc()
