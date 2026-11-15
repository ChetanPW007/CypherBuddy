import os
import pymongo
import bcrypt
import datetime

# Credentials come from the environment - never commit a connection string.
#   export MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/cypherbuddy?retryWrites=true&w=majority"
#   export ADMIN_PASSWORD="<long random secret>"   ADMIN_EMAIL / ADMIN_PHONE optional
URI = os.environ.get("MONGODB_URI")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@cypherbuddy.org").strip().lower()
ADMIN_PHONE = os.environ.get("ADMIN_PHONE", "").strip()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")
if not URI or not ADMIN_PASSWORD:
    raise SystemExit("Set MONGODB_URI and ADMIN_PASSWORD in the environment before running this script.")

def hash_pw(pw: str) -> str:
    pw_bytes = pw.encode('utf-8')[:72]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode('utf-8')

def main():
    print("Connecting to MongoDB Atlas Cluster...")
    client = pymongo.MongoClient(URI, serverSelectionTimeoutMS=10000)
    db = client["cypherbuddy"]

    res = db.command('ping')
    print(f"Ping result: {res}")

    admin_pass_hash = hash_pw(ADMIN_PASSWORD)
    user_pass_hash = hash_pw(os.environ.get("DEMO_USER_PASSWORD", "Password123!"))

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    admin_doc = {
        "id": "ADM-001",
        "name": "Official CypherBuddy Admin",
        "email": ADMIN_EMAIL,
        "phone": ADMIN_PHONE,
        "passwordHash": admin_pass_hash,
        "role": "ADMIN",
        "createdAt": now_iso
    }

    user_doc = {
        "id": "USR-001",
        "name": "Demo User",
        "email": "user@cypherbuddy.org",
        "phone": "+919876543210",
        "passwordHash": user_pass_hash,
        "role": "USER",
        "createdAt": now_iso
    }

    print("Seeding 'admin_users' collection...")
    db.admin_users.delete_many({"$or": [{"email": ADMIN_EMAIL}] + ([{"phone": ADMIN_PHONE}] if ADMIN_PHONE else [])})
    db.admin_users.insert_one(admin_doc)

    print("Seeding 'users' collection...")
    db.users.delete_many({"$or": [{"email": ADMIN_EMAIL}, {"email": "user@cypherbuddy.org"}]})
    db.users.insert_one(admin_doc.copy())
    db.users.insert_one(user_doc.copy())

    print("Creating Indexes...")
    try:
        db.users.create_index([("email", pymongo.ASCENDING)], unique=True)
        db.admin_users.create_index([("email", pymongo.ASCENDING)], unique=True)
        db.admin_users.create_index([("phone", pymongo.ASCENDING)], unique=True)
        db.otp_requests.create_index([("contact", pymongo.ASCENDING)])
        db.otp_requests.create_index([("created_at", pymongo.ASCENDING)], expireAfterSeconds=600)
        db.audit_logs.create_index([("timestamp", pymongo.DESCENDING)])
    except Exception as e:
        print(f"Index creation note: {str(e)}")

    print("Logging System Startup Audit Event...")
    db.audit_logs.insert_one({
        "event": "DATABASE_INITIALIZED",
        "user_id": "ADM-001",
        "details": "MongoDB Atlas cypherbuddy database successfully seeded and initialized.",
        "timestamp": now_iso
    })

    print("\nSUCCESS! Database 'cypherbuddy' and collections ('admin_users', 'users', 'otp_requests', 'audit_logs') created and populated!")

if __name__ == "__main__":
    main()
