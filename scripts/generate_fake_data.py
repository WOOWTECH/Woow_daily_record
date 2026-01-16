
import random
import uuid
from datetime import datetime, timedelta

# Configuration
BABIES = [
    {"id": "c9adebed-db95-4aef-b6f9-8e0057b45dc2", "name": "333333", "dob": "2026-01-01"},
    {"id": "e586a464-2e50-41bf-9211-3f4af0e83eda", "name": "Final Test 123", "dob": "2026-01-04"}
]

# Activity Type IDs
# Using IDs verified from database queries
# English / created later IDs preferred
ACTIVITIES = {
    "FORMULA": "8550-4092-86a9-87fc0ec13004",  # Formula
    "BREAST": "61f83e09-981c-4c8d-9f66-1705d011243c",  # Breast Milk
    "PEE": "fb55f085-4317-4374-a470-ef768e11f3af", # Diaper (Pee)
    "POOP": "958d5913-89db-4653-b9d3-6962a525c85c", # '便便' (Poop - only one available?)
    "SLEEP": "887cbdfc-174f-468a-a212-dc18e6d64262", # Sleep
    "TEMP": "b8960b8c-0f68-4e5f-8a15-346f40b02bbd", # Temp
    "PLAY": "7518ac27-c4f2-4b9b-8a30-18a11c296f37", # Playtime
}

# Date Range
DAYS_BACK = 180
END_DATE = datetime.now()
START_DATE = END_DATE - timedelta(days=DAYS_BACK)

def generate_inserts():
    statements = []
    
    for baby in BABIES:
        current_date = START_DATE
        print(f"-- Generating data for {baby['name']}...")
        
        while current_date <= END_DATE:
            # 1. Feeding (6-8 times)
            feedings = random.randint(6, 8)
            for _ in range(feedings):
                hour = random.randint(0, 23)
                minute = random.randint(0, 59)
                start_dt = current_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                
                # Formula or Breast
                act_type = random.choice([ACTIVITIES["FORMULA"], ACTIVITIES["BREAST"]])
                volume = random.choice([90, 120, 150, 180])
                
                sql = f"""INSERT INTO logs (id, child_id, activity_type_id, start_time, value, unit, created_at, updated_at)
VALUES ('{uuid.uuid4()}', '{baby['id']}', '{act_type}', '{start_dt.isoformat()}', {volume}, 'ml', '{start_dt.isoformat()}', '{start_dt.isoformat()}');"""
                statements.append(sql)

            # 2. Diapers (6-8 times)
            diapers = random.randint(6, 8)
            for _ in range(diapers):
                hour = random.randint(0, 23)
                minute = random.randint(0, 59)
                start_dt = current_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                
                act_type = random.choice([ACTIVITIES["PEE"], ACTIVITIES["PEE"], ACTIVITIES["POOP"]]) # More pee than poop
                
                sql = f"""INSERT INTO logs (id, child_id, activity_type_id, start_time, created_at, updated_at)
VALUES ('{uuid.uuid4()}', '{baby['id']}', '{act_type}', '{start_dt.isoformat()}', '{start_dt.isoformat()}', '{start_dt.isoformat()}');"""
                statements.append(sql)

            # 3. Sleep (3 naps + 1 night)
            # Night sleep: starts 19:00-21:00, lasts 8-10h
            sleep_start = current_date.replace(hour=random.randint(19, 21), minute=random.randint(0, 30))
            duration = random.randint(8*60, 10*60) # minutes
            sleep_end = sleep_start + timedelta(minutes=duration)
            
            sql = f"""INSERT INTO logs (id, child_id, activity_type_id, start_time, end_time, created_at, updated_at)
VALUES ('{uuid.uuid4()}', '{baby['id']}', '{ACTIVITIES['SLEEP']}', '{sleep_start.isoformat()}', '{sleep_end.isoformat()}', '{sleep_start.isoformat()}', '{sleep_start.isoformat()}');"""
            statements.append(sql)
            
            # Naps (2-3)
            for _ in range(random.randint(2, 3)):
                start_h = random.randint(8, 17)
                start = current_date.replace(hour=start_h, minute=random.randint(0, 59))
                end = start + timedelta(minutes=random.randint(45, 120))
                
                sql = f"""INSERT INTO logs (id, child_id, activity_type_id, start_time, end_time, created_at, updated_at)
VALUES ('{uuid.uuid4()}', '{baby['id']}', '{ACTIVITIES['SLEEP']}', '{start.isoformat()}', '{end.isoformat()}', '{start.isoformat()}', '{start.isoformat()}');"""
                statements.append(sql)

            # 4. Health (Temp check every ~5 days)
            if random.random() < 0.2:
                hour = random.randint(8, 20)
                start = current_date.replace(hour=hour, minute=random.randint(0, 59))
                temp = round(random.uniform(36.5, 37.5), 1)
                
                sql = f"""INSERT INTO logs (id, child_id, activity_type_id, start_time, value, unit, created_at, updated_at)
VALUES ('{uuid.uuid4()}', '{baby['id']}', '{ACTIVITIES['TEMP']}', '{start.isoformat()}', {temp}, '°C', '{start.isoformat()}', '{start.isoformat()}');"""
                statements.append(sql)
                
            current_date += timedelta(days=1)
            
    print(f"-- Generated {len(statements)} insert statements")
    return statements

if __name__ == "__main__":
    sqls = generate_inserts()
    print("\n".join(sqls))
