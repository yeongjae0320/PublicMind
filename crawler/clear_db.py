import firebase_admin
from firebase_admin import credentials, firestore
import os

CREDENTIAL_PATH = "serviceAccountKey.json"

if not os.path.exists(CREDENTIAL_PATH):
    print("serviceAccountKey.json is missing.")
    exit(1)

cred = credentials.Certificate(CREDENTIAL_PATH)
try:
    firebase_admin.initialize_app(cred)
except ValueError:
    pass # Already initialized

db = firestore.client()

def clear_fake_data():
    fake_titles = [
        "놓치기 쉬운 청년 월세 지원사업",
        "2026년 일반건강검진 대상 안내",
        "서울시 안심 귀갓길 스카우트 신청",
        "가족 건강검진 및 돌봄 지원"
    ]
    
    # 1. Clear from policies collection
    policies_ref = db.collection('policies')
    count = 0
    for doc in policies_ref.stream():
        data = doc.to_dict()
        if data.get('title') in fake_titles:
            doc.reference.delete()
            count += 1
    print(f"Deleted {count} fake policies from 'policies' collection.")

    # 2. Clear from all users' alerts collection
    users_ref = db.collection('users')
    count_alerts = 0
    for user_doc in users_ref.stream():
        alerts_ref = user_doc.reference.collection('alerts')
        for alert_doc in alerts_ref.stream():
            data = alert_doc.to_dict()
            if data.get('title') in fake_titles:
                alert_doc.reference.delete()
                count_alerts += 1
    
    print(f"Deleted {count_alerts} fake alerts from users.")

if __name__ == "__main__":
    clear_fake_data()
