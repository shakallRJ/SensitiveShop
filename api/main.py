
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import os
from typing import List, Optional

app = FastAPI()

# Simple mock storage for direct API access if needed, 
# although the React app uses Supabase directly for speed.
# This serves as a lightweight proxy or custom logic layer.

class ProductUpdate(BaseModel):
    stock: int

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Gestão Interna API is running"}

@app.get("/api/config")
def get_config():
    # Helper to check if env vars are present on Vercel
    return {
        "supabase_configured": os.getenv("VITE_SUPABASE_URL") is not None,
        "auth_configured": os.getenv("VITE_APP_PASSWORD") is not None
    }

# Example of a protected endpoint if you decide to move logic here
@app.post("/api/verify")
def verify_password(password: str, x_app_key: Optional[str] = Header(None)):
    app_pass = os.getenv("APP_PASSWORD", "admin123")
    if password == app_pass:
        return {"authorized": True}
    raise HTTPException(status_code=401, detail="Unauthorized")
