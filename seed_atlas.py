import os
import pymongo
import bcrypt
import datetime

URI = "mongodb+srv://chetanpw75_db_user:nhHhXzhJTFyn2XTC@cypherbuddy.s5gdpwj.mongodb.net/cypherbuddy?retryWrites=true&w=majority"

def hash_pw(pw: str) -> str:
    pw_bytes = pw.encode('utf-8')[:72]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode('utf-8')

def main():
    print("Connecting to MongoDB Atlas Cluster...")
    client = pymongo.MongoClient(URI, serverSelectionTimeoutMS=10000)
    db = client["cypherbuddy"]

    res = db.command('ping')
    print(f"Ping result: {res}")

    admin_pass_hash = hash_pw("AdminPass123!")
    user_pass_hash = hash_pw("Password123!")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    admin_doc = {
        "id": "ADM-001",
        "name": "Official CypherBuddy Admin",
        "email": "admin@cypherbuddy.org",
        "phone": "+917349107584",
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
    db.admin_users.delete_many({"$or": [{"email": "admin@cypherbuddy.org"}, {"phone": "+917349107584"}]})
    db.admin_users.insert_one(admin_doc)

    print("Seeding 'users' collection...")
    db.users.delete_many({"$or": [{"email": "admin@cypherbuddy.org"}, {"email": "user@cypherbuddy.org"}]})
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
