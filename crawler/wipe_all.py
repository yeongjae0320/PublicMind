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

def wipe_everything():
    policies_ref = db.collection('policies')
    for doc in policies_ref.stream():
        doc.reference.delete()
        
    users_ref = db.collection('users')
    for user_doc in users_ref.stream():
        alerts_ref = user_doc.reference.collection('alerts')
        for alert_doc in alerts_ref.stream():
            alert_doc.reference.delete()
            
    print("[OK] Wiped all policies and alerts for AI reset.")

if __name__ == "__main__":
    wipe_everything()
