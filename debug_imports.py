try:
    from src.app.main import app
    print("Successfully imported app from src.app.main")
    from src.app.db.session import engine, Base
    print("Successfully imported database components")
    from src.app.api import auth
    print("Successfully imported auth router")
except Exception as e:
    print(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
