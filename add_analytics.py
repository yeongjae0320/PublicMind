import os
import re

targets = [
    {
        'file': 'src/pages/WelfareSearch.jsx',
        'event_name': 'search_welfare',
        'func': 'handleSearch',
        'payload': '{ ...formData }'
    },
    {
        'file': 'src/pages/Childcare.jsx',
        'event_name': 'search_childcare',
        'func': 'handleSearch',
        'payload': '{ region: formData.region, type: formData.type }'
    },
    {
        'file': 'src/pages/DisasterShelter.jsx',
        'event_name': 'search_shelter',
        'func': 'handleSearch',
        'payload': '{ region: formData.region, type: formData.shelterType }'
    },
    {
        'file': 'src/pages/SchoolAnalysis.jsx',
        'event_name': 'search_school',
        'func': 'handleSearch',
        'payload': '{ region: formData.region, schoolLevel: formData.schoolLevel }'
    },
    {
        'file': 'src/pages/SportsReservation.jsx',
        'event_name': 'search_sports',
        'func': 'handleSearch',
        'payload': '{ region: formData.region, sportType: formData.sportType }'
    },
    {
        'file': 'src/pages/YouthPolicy.jsx',
        'event_name': 'search_youth_policy',
        'func': 'handleSearch',
        'payload': '{ query: formData.query, category: formData.category }'
    }
]

for t in targets:
    if not os.path.exists(t['file']):
        continue
        
    with open(t['file'], 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Check if already added
    if "import { analytics }" in content:
        print(f"Skipping {t['file']}, already has analytics")
        continue
        
    # Insert import after the last import statement
    lines = content.split('\n')
    last_import_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import_idx = i
            
    lines.insert(last_import_idx + 1, "import { analytics } from '../firebase';")
    lines.insert(last_import_idx + 2, "import { logEvent } from 'firebase/analytics';")
    
    # Insert logEvent into handleSearch
    # Search for: const handleSearch = (e) => { or const handleSearch = async (e) => {
    
    new_content = '\n'.join(lines)
    
    tracking_code = f"""
    if (analytics) {{
      logEvent(analytics, '{t['event_name']}', {t['payload']});
    }}
"""
    
    # We find handleSearch and inject tracking_code right after e.preventDefault() or just inside it
    new_content = re.sub(
        r'(const handleSearch\s*=\s*(?:async\s*)?\(.*?\)\s*=>\s*\{(?:\s*e\.preventDefault\(\);)?)',
        r'\1' + tracking_code,
        new_content
    )
    
    with open(t['file'], 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {t['file']}")

