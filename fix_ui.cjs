const fs = require('fs');

function fixMyPage() {
  let code = fs.readFileSync('src/pages/MyPage.jsx', 'utf8');
  // Fix 1: 계정 삭제
  code = code.replace(
    /style=\{\{ background: deleteInput === '계정 삭제' \? 'var\(--accent-red\)' : '#f87171', color: '#fff', opacity: deleteInput === '계정 삭제' \? 1 : 0\.6, cursor: deleteInput === '계정 삭제' \? 'pointer' : 'not-allowed' \}\}/,
    "style={{ background: deleteInput === '계정 삭제' ? 'var(--accent-red)' : '#f87171', color: '#fff', opacity: deleteInput === '계정 삭제' ? 1 : 0.6, cursor: deleteInput === '계정 삭제' ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0, minWidth: 'max-content' }}"
  );
  // Fix 2: 구성원 추가
  code = code.replace(
    /style=\{\{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0\.9rem', color: 'white', background: 'var\(--primary-blue\)', padding: '10px 16px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' \}\}/,
    "style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'white', background: 'var(--primary-blue)', padding: '10px 16px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}"
  );
  // Fix 3: 상세보기
  code = code.replace(
    /style=\{\{ padding: '8px 16px', borderRadius: '8px', background: 'var\(--bg-base\)', border: '1px solid var\(--border-light\)', fontSize: '0\.9rem', fontWeight: 600, color: 'var\(--text-secondary\)' \}\}/g,
    "style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-light)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}"
  );
  fs.writeFileSync('src/pages/MyPage.jsx', code, 'utf8');
}

function fixMyActivity() {
  let code = fs.readFileSync('src/components/MyActivityTab.jsx', 'utf8');
  // Fix 4: 메모 textarea
  code = code.replace(
    /width: '100%', minHeight: '100px', padding: '16px', borderRadius: '12px',/,
    "width: '100%', minHeight: '100px', padding: '16px', borderRadius: '12px', boxSizing: 'border-box',"
  );
  fs.writeFileSync('src/components/MyActivityTab.jsx', code, 'utf8');
}

function fixLayout() {
  let code = fs.readFileSync('src/Layout.jsx', 'utf8');
  // Fix 5: Header overflow
  code = code.replace(
    /position: 'relative'/,
    "position: 'relative', overflowX: 'auto', scrollbarWidth: 'none'"
  );
  fs.writeFileSync('src/Layout.jsx', code, 'utf8');
}

fixMyPage();
fixMyActivity();
fixLayout();
console.log('UI fixes applied successfully!');
