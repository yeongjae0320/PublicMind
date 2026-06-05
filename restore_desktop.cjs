const fs = require('fs');

// 1. Fix MyPage.jsx
let mypage = fs.readFileSync('src/pages/MyPage.jsx', 'utf8');
mypage = mypage.replace(
  /<div className="responsive-sidebar-layout" style=\{\{ display: 'flex', gap: '40px', height: '100%', minHeight: '600px' \}\}>/,
  '<div className="mypage-grid" style={{ display: \'grid\', gridTemplateColumns: \'240px 1fr\', gap: \'40px\', height: \'100%\', minHeight: \'600px\' }}>'
);
mypage = mypage.replace(
  /<div className="responsive-sidebar" style=\{\{ width: '240px', flexShrink: 0 \}\}>/,
  '<div className="mypage-sidebar">'
);
fs.writeFileSync('src/pages/MyPage.jsx', mypage, 'utf8');

// 2. Fix SafetyMap.jsx
let sm = fs.readFileSync('src/pages/SafetyMap.jsx', 'utf8');
sm = sm.replace(
  /<div className="responsive-sidebar-layout" style=\{\{ display: "flex", gap: "24px", minHeight: "700px", paddingBottom: "24px" \}\}>/,
  '<div className="safetymap-layout" style={{ display: "flex", gap: "32px", height: "calc(100vh - 200px)", minHeight: "600px" }}>'
);
sm = sm.replace(
  /<div className="responsive-sidebar" style=\{\{ flex: "0 0 340px", display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" \}\}>/,
  '<div className="safetymap-sidebar" style={{ width: "380px", display: "flex", flexDirection: "column", gap: "20px" }}>'
);
fs.writeFileSync('src/pages/SafetyMap.jsx', sm, 'utf8');

// 3. Fix Health.jsx
let health = fs.readFileSync('src/pages/Health.jsx', 'utf8');
health = health.replace(
  /<div className="responsive-sidebar-layout" style=\{\{ display: "flex", gap: "24px", flex: 1, minHeight: "600px" \}\}>/,
  '<div className="health-layout" style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "32px", height: "calc(100vh - 200px)", minHeight: "600px" }}>'
);
health = health.replace(
  /className="glass-panel responsive-content"/,
  'className="glass-panel"'
);
health = health.replace(
  /<div className="glass-panel responsive-sidebar" style=\{\{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" \}\}>/,
  '<div className="glass-panel health-sidebar" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>'
);
fs.writeFileSync('src/pages/Health.jsx', health, 'utf8');

// 4. Update index.css
let css = fs.readFileSync('src/index.css', 'utf8');
css += `\n
@media (max-width: 768px) {
  .mypage-grid {
    display: flex !important;
    flex-direction: column !important;
    height: auto !important;
  }
  .mypage-sidebar {
    width: 100% !important;
  }
  .safetymap-layout {
    flex-direction: column !important;
    height: auto !important;
  }
  .safetymap-sidebar {
    width: 100% !important;
    flex: none !important;
  }
  .health-layout {
    display: flex !important;
    flex-direction: column !important;
    height: auto !important;
  }
  .health-sidebar {
    width: 100% !important;
    height: 500px !important;
  }
}
`;
fs.writeFileSync('src/index.css', css, 'utf8');
console.log('Restore done!');
