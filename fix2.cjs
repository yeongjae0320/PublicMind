const fs = require('fs');

// Fix SafetyMap.jsx
let safety = fs.readFileSync('src/pages/SafetyMap.jsx', 'utf8');
safety = safety.replace(/<div style=\{\{ display: 'flex', gap: '24px', height: '700px', paddingBottom: '24px' \}\}>/g, '<div className="responsive-sidebar-layout" style={{ display: "flex", gap: "24px", minHeight: "700px", paddingBottom: "24px" }}>');
safety = safety.replace(/<div style=\{\{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' \}\}>/g, '<div className="responsive-sidebar" style={{ flex: "0 0 340px", display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" }}>');
safety = safety.replace(/<div style=\{\{ flex: 1, position: 'relative', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var\(--shadow-md\)', border: '1px solid var\(--border-light\)' \}\}>/g, '<div className="responsive-content" style={{ flex: 1, position: "relative", borderRadius: "20px", overflow: "hidden", boxShadow: "var(--shadow-md)", border: "1px solid var(--border-light)" }}>');
fs.writeFileSync('src/pages/SafetyMap.jsx', safety, 'utf8');

// Fix Health.jsx
let health = fs.readFileSync('src/pages/Health.jsx', 'utf8');
health = health.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', flex: 1, minHeight: '600px' \}\}>/g, '<div className="responsive-sidebar-layout" style={{ display: "flex", gap: "24px", flex: 1, minHeight: "600px" }}>');
health = health.replace(/<div className="glass-panel" style=\{\{ position: 'relative', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', border: '1px solid var\(--border-light\)' \}\}>/g, '<div className="glass-panel responsive-content" style={{ position: "relative", overflow: "hidden", padding: 0, display: "flex", flexDirection: "column", border: "1px solid var(--border-light)" }}>');
health = health.replace(/<div className="glass-panel" style=\{\{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' \}\}>/g, '<div className="glass-panel responsive-sidebar" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>');
fs.writeFileSync('src/pages/Health.jsx', health, 'utf8');

// Fix FineDust.jsx
let finedust = fs.readFileSync('src/pages/FineDust.jsx', 'utf8');
finedust = finedust.replace(/gridTemplateColumns: 'repeat\(3, 1fr\)'/g, "gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'");
fs.writeFileSync('src/pages/FineDust.jsx', finedust, 'utf8');

console.log("Layout fixes applied safely!");
