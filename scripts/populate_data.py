
import json
import uuid
import random
import time
from datetime import datetime, timedelta
import urllib.request
import urllib.error

# --- CONFIG ---
SUPABASE_URL = "https://iblkvzjresocxtpvejnf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibGt2empyZXNvY3h0cHZlam5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDg3MDYsImV4cCI6MjA4MDEyNDcwNn0.bIuTQVUzf3jaG-W7ut6yeN8JRT4743QZM3jGX74mFHc"

API_URL = f"{SUPABASE_URL}/rest/v1/logs"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

BABIES = [
    {"id": "c9adebed-db95-4aef-b6f9-8e0057b45dc2", "name": "333333"},
    {"id": "e586a464-2e50-41bf-9211-3f4af0e83eda", "name": "Final Test 123"}
]

ACTIVITIES = {
    "FORMULA": "f4a3d3a2-3050-4092-86a9-87fc0ec13004",
    "BREAST": "61f83e09-981c-4c8d-9f66-1705d011243c",
    "PEE": "fb55f085-4317-4374-a470-ef768e11f3af",
    "POOP": "958d5913-89db-4653-b9d3-6962a525c85c",
    "SLEEP": "887cbdfc-174f-468a-a212-dc18e6d64262",
    "TEMP": "b8960b8c-0f68-4e5f-8a15-346f40b02bbd",
}

DAYS_BACK = 180
BATCH_SIZE = 200


def create_record(child_id, act_id, start_time, end_time=None, value=None, unit=None, note=None, details=None):
    return {
        "id": str(uuid.uuid4()),
        "child_id": child_id,
        "activity_type_id": act_id,
        "start_time": start_time,
        "end_time": end_time,
        "value": value,
        "unit": unit,
        "note": note,
        "details": details,
        "created_at": start_time,
        "updated_at": start_time
    }

def generate_records():
    records = []
    end_date = datetime.now()
    start_date = end_date - timedelta(days=DAYS_BACK)
    
    for baby in BABIES:
        print(f"Generating for {baby['name']}...")
        curr = start_date
        while curr <= end_date:
            # 1. Feeding (6-8)
            for _ in range(random.randint(6, 8)):
                h = random.randint(0, 23)
                m = random.randint(0, 59)
                dt = curr.replace(hour=h, minute=m, second=0, microsecond=0)
                
                records.append(create_record(
                    baby["id"],
                    random.choice([ACTIVITIES["FORMULA"], ACTIVITIES["BREAST"]]),
                    dt.isoformat(),
                    value=random.choice([90, 120, 150, 180]),
                    unit="ml"
                ))

            # 2. Diaper (6-8)
            for _ in range(random.randint(6, 8)):
                h = random.randint(0, 23)
                m = random.randint(0, 59)
                dt = curr.replace(hour=h, minute=m, second=0, microsecond=0)
                
                records.append(create_record(
                    baby["id"],
                    random.choice([ACTIVITIES["PEE"], ACTIVITIES["PEE"], ACTIVITIES["POOP"]]),
                    dt.isoformat()
                ))

            # 3. Sleep (Night + 2-3 Naps)
            # Night
            sleep_start = curr.replace(hour=random.randint(19, 21), minute=random.randint(0, 30))
            duration = random.randint(8*60, 10*60)
            sleep_end = sleep_start + timedelta(minutes=duration)
            records.append(create_record(
                baby["id"],
                ACTIVITIES["SLEEP"],
                sleep_start.isoformat(),
                end_time=sleep_end.isoformat()
            ))
            
            # Naps
            for _ in range(random.randint(2, 3)):
                h = random.randint(8, 17)
                s = curr.replace(hour=h, minute=random.randint(0, 59))
                e = s + timedelta(minutes=random.randint(45, 120))
                records.append(create_record(
                    baby["id"],
                    ACTIVITIES["SLEEP"],
                    s.isoformat(),
                    end_time=e.isoformat()
                ))
            
            # 4. Health (Temp)
            if random.random() < 0.2:
                h = random.randint(8, 20)
                s = curr.replace(hour=h, minute=random.randint(0, 59))
                temp = round(random.uniform(36.5, 37.5), 1)
                records.append(create_record(
                    baby["id"],
                    ACTIVITIES["TEMP"],
                    s.isoformat(),
                    value=temp,
                    unit="°C"
                ))

            curr += timedelta(days=1)
            
    return records


def post_batch(batch):
    data = json.dumps(batch).encode('utf-8')
    req = urllib.request.Request(API_URL, data=data, headers=HEADERS, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status in [200, 201]:
                print(f"Success: {resp.status}")
                return True
            else:
                print(f"Failed: {resp.status} {resp.read()}")
                return False
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} {e.read()}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    print("Generating records...")
    all_records = generate_records()
    print(f"Total records: {len(all_records)}")
    
    total_batches = (len(all_records) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for i in range(0, len(all_records), BATCH_SIZE):
        batch = all_records[i:i + BATCH_SIZE]
        print(f"Posting batch {i//BATCH_SIZE + 1}/{total_batches} ({len(batch)} records)...")
        if not post_batch(batch):
            print("Stopping due to error.")
            break
        time.sleep(0.1) # Be nice to API

if __name__ == "__main__":
    main()
