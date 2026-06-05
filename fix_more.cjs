const fs = require('fs');

function fixLayout() {
  let layout = fs.readFileSync('src/Layout.jsx', 'utf8');
  layout = layout.replace(/position: 'relative', overflowX: 'auto', scrollbarWidth: 'none'/, "position: 'relative'");
  layout = layout.replace(
    /<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' \}\}>/,
    "<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '12px' }}>"
  );
  fs.writeFileSync('src/Layout.jsx', layout, 'utf8');
}

function fixIndexCSS() {
  let css = fs.readFileSync('src/index.css', 'utf8');
  css = css.replace(/\.coverflow-wrapper \{ height: 400px;/g, '.coverflow-wrapper { height: 500px;');
  css = css.replace(/@media \(max-width: 480px\) \{\n  \.coverflow-wrapper \{ transform: scale\(0\.7\); margin-bottom: -100px; \}/g, '@media (max-width: 480px) {\n  .coverflow-wrapper { height: 500px; transform: scale(0.7); margin-bottom: -100px; }');
  // Also fix 400px that might be written differently
  css = css.replace(/height: 400px; transform: scale\(0\.85\)/g, 'height: 500px; transform: scale(0.85)');
  fs.writeFileSync('src/index.css', css, 'utf8');
}

fixLayout();
fixIndexCSS();
console.log('fixes applied');
