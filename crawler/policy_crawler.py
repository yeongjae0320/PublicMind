import feedparser
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter
import html
import re
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("[ERROR] GEMINI_API_KEY is missing in .env")
    exit(1)

def clean_html(raw_html):
    if not raw_html:
        return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    cleantext = html.unescape(cleantext)
    return cleantext.strip()

def remove_emojis(text):
    if not text:
        return ""
    return text.encode('ascii', 'ignore').decode('ascii')

def analyze_policy_with_ai(title, desc):
    prompt = f"""
    아래는 정부 정책 뉴스의 제목과 설명입니다.
    이 정책이 어떤 사람들을 위한 것인지 아주 정밀하게 분석해서 JSON 포맷으로만 응답해주세요.
    
    분석할 텍스트:
    제목: {title}
    설명: {desc}
    
    출력 형식 (반드시 순수 JSON 문자열만 응답할 것):
    {{
        "targets": ["청년", "가족", "어르신", "프리랜서", "소상공인", "장애인", "임산부", "다자녀", "전체"],
        "locations": ["서울", "경기", "부산", "제주", "전국"],
        "summary": "핵심 1줄 요약"
    }}
    (targets나 locations가 명확하지 않거나 전체 대상이면 "전체", "전국"을 포함해주세요.)
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [{"parts":[{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1}
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        text = data['candidates'][0]['content']['parts'][0]['text']
        
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)
    except Exception as e:
        print(f"[AI Error] {e}")
        return {"targets": ["전체"], "locations": ["전국"], "summary": desc[:50]}

def run_crawler():
    CREDENTIAL_PATH = "serviceAccountKey.json"
    if not os.path.exists(CREDENTIAL_PATH):
        print("serviceAccountKey.json is missing.")
        exit(1)

    cred = credentials.Certificate(CREDENTIAL_PATH)
    try:
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass

    db = firestore.client()

    RSS_URL = "https://www.korea.kr/rss/policy.xml"
    print(f"[FETCH] {RSS_URL} AI Analysis Started...")
    
    import time
    for attempt in range(3):
        try:
            response = requests.get(RSS_URL, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            response.raise_for_status()
            feed = feedparser.parse(response.content)
            break
        except Exception as e:
            print(f"[FETCH ERROR] Attempt {attempt+1} failed: {e}")
            time.sleep(2)
    else:
        print("[EMPTY] Failed to fetch entries after 3 attempts.")
        return

    if not feed.entries:
        print("[EMPTY] No entries found.")
        return

    collection_ref = db.collection('policies')
    
    # Process only top 5 to save API calls
    top_entries = feed.entries[:5]
    print(f"[DEBUG] Found {len(top_entries)} policies to analyze.")

    added_count = 0
    for entry in top_entries:
        title_raw = getattr(entry, 'title', '')
        desc_raw = getattr(entry, 'description', '')
        
        title = clean_html(title_raw)
        desc = clean_html(desc_raw)

        if not title:
            continue

        # Check if already exists in DB
        docs = collection_ref.where(filter=FieldFilter("title", "==", title)).get()
        if not docs:
            # AI Analysis
            ai_data = analyze_policy_with_ai(title, desc)
            
            doc_data = {
                "title": title,
                "desc": ai_data.get("summary", desc[:100] + "..."),
                "full_desc": desc,
                "link": getattr(entry, 'link', ''),
                "pubDate": getattr(entry, 'published', ''),
                "targets": ai_data.get("targets", ["전체"]),
                "locations": ai_data.get("locations", ["전국"]),
                "createdAt": firestore.SERVER_TIMESTAMP
            }
            collection_ref.add(doc_data)
            
            safe_title = title[:20].encode('cp949', 'ignore').decode('cp949')
            print(f"[AI MATCH] {safe_title}... -> Targets: {ai_data.get('targets')}")
            added_count += 1
        else:
            safe_title = title[:20].encode('cp949', 'ignore').decode('cp949')
            print(f"[SKIP] Already exists: {safe_title}...")

    print(f"[DONE] Crawler & AI Analysis finished! Added {added_count} new policies.")

if __name__ == "__main__":
    run_crawler()
