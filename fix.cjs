const fs = require('fs');

let mypage = fs.readFileSync('src/pages/MyPage.jsx', 'utf8');
mypage = mypage.replace(/className="fade-in" style=\{\{ padding: '40px'/g, 'className="fade-in mypage-section" style={{ ');
mypage = mypage.replace(/className="fade-in" style=\{\{ padding: '40px 0'/g, 'className="fade-in mypage-section" style={{ ');
mypage = mypage.replace(/whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'/g, "display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-all'");
fs.writeFileSync('src/pages/MyPage.jsx', mypage, 'utf8');

let disaster = fs.readFileSync('src/pages/DisasterShelter.jsx', 'utf8');
disaster = disaster.replace(/whiteSpace: 'nowrap', overflow: 'hidden'/g, "display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden'");
fs.writeFileSync('src/pages/DisasterShelter.jsx', disaster, 'utf8');

let finedust = fs.readFileSync('src/pages/FineDust.jsx', 'utf8');
finedust = finedust.replace(/padding: '40px 32px'/g, "padding: '24px'");
fs.writeFileSync('src/pages/FineDust.jsx', finedust, 'utf8');

console.log("Responsive fixes applied successfully!");
