import firebase_admin
from firebase_admin import credentials, firestore
import os

CREDENTIAL_PATH = "serviceAccountKey.json"
cred = credentials.Certificate(CREDENTIAL_PATH)
try:
    firebase_admin.initialize_app(cred)
except ValueError:
    pass

db = firestore.client()

def wipe_all_alerts():
    users_ref = db.collection('users')
    count = 0
    for user_doc in users_ref.stream():
        alerts_ref = user_doc.reference.collection('alerts')
        for alert_doc in alerts_ref.stream():
            alert_doc.reference.delete()
            count += 1
            
    print(f"✅ Deleted {count} alerts in total to reset the state!")

if __name__ == "__main__":
    wipe_all_alerts()
