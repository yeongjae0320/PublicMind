const fs = require('fs');
const files = fs.readdirSync('src/pages').map(f => 'src/pages/' + f).filter(f => f.endsWith('.jsx'));
files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes("width: '380px'")) {
    code = code.replace(/<div style={{ position: 'absolute', (.*?): '(.*?)', right: '(.*?)', width: '380px'(.*?) }}/g, 
                        '<div className="ai-insight-wrapper" style={{ position: "absolute", $1: "$2", right: "$3", width: "380px"$4 }}');
    fs.writeFileSync(file, code);
    console.log('Fixed', file);
  }
});
