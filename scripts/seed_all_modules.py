import os
import json
import random
import uuid
from datetime import datetime, timedelta

# --- CONFIG ---
HOUSEHOLD_ID = "9ba2bdbc-9a60-42f5-b797-cc8d838ed1c5"
USER_ID = "12e4009d-03e1-41bb-9e42-ac2f132fe54d"
CHILD_ID = "c37bb4d5-43bd-41ca-9692-1b3c4dae24f2"

# Finance Categories (Mapped from DB query)
FINANCE_CAT = {
    "food": "bbcd4a5a-545e-4b9d-89f2-f305c5ed9c7d",
    "transport": "5ea074cd-4d06-4795-a952-131990219236",
    "shopping": "97e48507-8870-48c9-badf-bec15ae0ee72",
    "salary": "4e5f56a9-bee8-4248-bbe1-2c09a8e1854a"
}

# Baby Activity Types (Mapped from DB query)
BABY_ACT = {
    "formula": "f4a3d3a2-3050-4092-86a9-87fc0ec13004",
    "breast": "61f83e09-981c-4c8d-9f66-1705d011243c",
    "pee": "fb55f085-4317-4374-a470-ef768e11f3af",
    "poop": "958d5913-89db-4653-b9d3-6962a525c85c",
    "sleep": "887cbdfc-174f-468a-a212-dc18e6d64262"
}

# Calendar Categories
CAL_CAT = {
    "personal": "5a6b13d4-7578-433f-a28f-fa322cea4a5e",
    "work": "d5198777-6992-412b-88ff-219cf926ad13",
    "family": "a9061222-6155-49eb-aa2b-b90ab7f1bb38"
}

def generate_sql():
    sql = []
    now = datetime.now()

    # --- 1. Finance Accounts ---
    checking_id = str(uuid.uuid4())
    savings_id = str(uuid.uuid4())
    sql.append(f"""
    INSERT INTO finance_accounts (id, household_id, created_by, name, type, balance, currency, color)
    VALUES 
    ('{checking_id}', '{HOUSEHOLD_ID}', '{USER_ID}', 'Checking Account', 'checking', 50000, 'TWD', '#3b82f6'),
    ('{savings_id}', '{HOUSEHOLD_ID}', '{USER_ID}', 'Savings Account', 'savings', 120000, 'TWD', '#10b981')
    ON CONFLICT (id) DO NOTHING;
    """)

    # --- 2. Finance Transactions (Last 30 days) ---
    for i in range(30):
        date = (now - timedelta(days=i)).strftime('%Y-%m-%d')
        # Salary on 1st
        if (now - timedelta(days=i)).day == 1:
            sql.append(f"INSERT INTO finance_transactions (household_id, created_by, account_id, category_id, type, amount, date, description) VALUES ('{HOUSEHOLD_ID}', '{USER_ID}', '{checking_id}', '{FINANCE_CAT['salary']}', 'income', 60000, '{date}', 'Monthly Salary');")
        
        # Daily expenses
        sql.append(f"INSERT INTO finance_transactions (household_id, created_by, account_id, category_id, type, amount, date, description) VALUES ('{HOUSEHOLD_ID}', '{USER_ID}', '{checking_id}', '{FINANCE_CAT['food']}', 'expense', {random.randint(100, 500)}, '{date}', 'Lunch');")
        if random.random() > 0.5:
            sql.append(f"INSERT INTO finance_transactions (household_id, created_by, account_id, category_id, type, amount, date, description) VALUES ('{HOUSEHOLD_ID}', '{USER_ID}', '{checking_id}', '{FINANCE_CAT['shopping']}', 'expense', {random.randint(500, 2000)}, '{date}', 'Shopping');")

    # --- 3. Home Devices ---
    devices = [
        ('Smart Fridge', 'appliances', 'Samsung', 'RF28'),
        ('Living Room TV', 'electronics', 'Sony', 'Bravia'),
        ('Air Purifier', 'electronics', 'Dyson', 'Pure Cool'),
        ('Baby Monitor', 'baby', 'Nanit', 'Pro')
    ]
    for name, cat, brand, model in devices:
        sql.append(f"INSERT INTO home_devices (household_id, created_by, name, category, brand, model_number) VALUES ('{HOUSEHOLD_ID}', '{USER_ID}', '{name}', '{cat}', '{brand}', '{model}');")

    # --- 4. Notes ---
    notes = [
        ('Grocery List', 'Milk, Eggs, Bread, Diapers', True),
        ('Travel Plan', 'Flight at 10 AM, Hotel booked at Hilton', False),
        ('Meeting Notes', 'Discuss Q1 Roadmap and Budget', False)
    ]
    for title, content, pinned in notes:
        sql.append(f"INSERT INTO notes (household_id, created_by, title, content, is_pinned) VALUES ('{HOUSEHOLD_ID}', '{USER_ID}', '{title}', '{content}', {str(pinned).lower()});")

    # --- 5. Tasks ---
    tasks = [
        ('Buy Diapers', 'Size 3, Huggies', 'high', (now + timedelta(days=1)).strftime('%Y-%m-%d')),
        ('Schedule Pediatrician', 'Checkup at 6 months', 'medium', (now + timedelta(days=3)).strftime('%Y-%m-%d')),
        ('Pay Utility Bills', 'Water and Electricity', 'high', (now + timedelta(days=5)).strftime('%Y-%m-%d')),
        ('Clean Baby Room', 'Vacuum and organize toys', 'low', None)
    ]
    for title, desc, prio, due in tasks:
        due_val = f"'{due}'" if due else "NULL"
        sql.append(f"INSERT INTO tasks (household_id, created_by, title, description, priority, due_date) VALUES ('{HOUSEHOLD_ID}', '{USER_ID}', '{title}', '{desc}', '{prio}', {due_val});")

    # --- 6. Calendar Events ---
    events = [
        ('Family Dinner', 'At Grandmas house', now.replace(hour=18, minute=0), now.replace(hour=20, minute=0), CAL_CAT['family']),
        ('Project Deadline', 'Submit final report', now + timedelta(days=2, hours=9), now + timedelta(days=2, hours=10), CAL_CAT['work']),
        ('Baby Swimming', 'First lesson', now + timedelta(days=1, hours=14), now + timedelta(days=1, hours=15), CAL_CAT['family'])
    ]
    for title, desc, start, end, cat_id in events:
        sql.append(f"INSERT INTO events (household_id, created_by, title, description, start_time, end_time, category_id) VALUES ('{HOUSEHOLD_ID}', '{USER_ID}', '{title}', '{desc}', '{start.isoformat()}', '{end.isoformat()}', '{cat_id}');")

    # --- 7. Much More Baby Logs (Historical Data for Trends) ---
    # Generate data for the last 14 days
    for i in range(14):
        date = now - timedelta(days=i)
        # Feeding (6 times a day)
        for h in [2, 6, 10, 14, 18, 22]:
            st = date.replace(hour=h, minute=random.randint(0, 30))
            sql.append(f"INSERT INTO logs (child_id, activity_type_id, start_time, value, unit) VALUES ('{CHILD_ID}', '{BABY_ACT['formula']}', '{st.isoformat()}', {random.choice([120, 150, 180])}, 'ml');")
        
        # Sleep (3 naps + night)
        # Night
        night_start = date.replace(hour=20, minute=0)
        night_end = (date + timedelta(days=1)).replace(hour=7, minute=0)
        sql.append(f"INSERT INTO logs (child_id, activity_type_id, start_time, end_time) VALUES ('{CHILD_ID}', '{BABY_ACT['sleep']}', '{night_start.isoformat()}', '{night_end.isoformat()}');")
        
        # Naps
        for nap_h in [10, 14]:
            st = date.replace(hour=nap_h, minute=0)
            et = date.replace(hour=nap_h + 1, minute=30)
            sql.append(f"INSERT INTO logs (child_id, activity_type_id, start_time, end_time) VALUES ('{CHILD_ID}', '{BABY_ACT['sleep']}', '{st.isoformat()}', '{et.isoformat()}');")

    return "\n".join(sql)

if __name__ == "__main__":
    print(generate_sql())
