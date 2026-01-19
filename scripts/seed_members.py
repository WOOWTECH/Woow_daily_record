import os
import json
import random
import time
import urllib.request
import urllib.error
from typing import List, Dict, Any

# --- CONFIG ---
# Attempt to load from environment, otherwise fallback to known values (shim for now)
# Ideally these should be loaded from .env.local
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://iblkvzjresocxtpvejnf.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibGt2empyZXNvY3h0cHZlam5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDg3MDYsImV4cCI6MjA4MDEyNDcwNn0.bIuTQVUzf3jaG-W7ut6yeN8JRT4743QZM3jGX74mFHc")

AUTH_SIGNUP_URL = f"{SUPABASE_URL}/auth/v1/signup"
HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
}

FAKE_NAMES = [
    "Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince", "Evan Wright",
    "Fiona Gallagher", "George Martin", "Hannah Montana", "Ian Somerhalder", "Julia Roberts"
]

def generate_email(name: str) -> str:
    slug = name.lower().replace(" ", ".")
    return f"{slug}.{random.randint(100, 999)}@example.com"

def signup_user(email: str, password: str, full_name: str) -> Dict[str, Any]:
    """
    Signs up a user using Supabase Auth API.
    Returns the response JSON if successful, or None.
    """
    payload = {
        "email": email,
        "password": password,
        "data": {
            "full_name": full_name,
            "role": "member" # Custom claim if needed
        }
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(AUTH_SIGNUP_URL, data=data, headers=HEADERS, method='POST')
    
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status in [200, 201]:
                return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"❌ Failed to create {email}: {e.code} {e.read().decode()}")
        return None
    except Exception as e:
        print(f"❌ Error creating {email}: {e}")
        return None
    return None

def main():
    print(f"🚀 Starting member seed for {SUPABASE_URL}...")
    print("------------------------------------------------")
    
    success_count = 0
    
    for name in FAKE_NAMES:
        email = generate_email(name)
        password = "Password123!" # Simple default password
        
        print(f"Creating: {name} ({email})...")
        
        result = signup_user(email, password, name)
        
        if result:
            user_id = result.get('user', {}).get('id') or result.get('id')
            if user_id:
                print(f"✅ Created User ID: {user_id}")
                success_count += 1
            else:
                print("⚠️  Created but no ID returned?")
        
        # Don't hammer the API
        time.sleep(0.5)

    print("------------------------------------------------")
    print(f"🎉 Finished! Created {success_count}/{len(FAKE_NAMES)} users.")
    print("ℹ️  Note: Profiles should have been automatically created by DB triggers.")

if __name__ == "__main__":
    main()
