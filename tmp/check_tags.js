const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const allFiles = walk('src/data');
console.log('Total files in src/data:', allFiles.length);
allFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const hasName = (content.match(/name:\s*['"]/g) || []).length;
  const hasTags = (content.match(/tags:\s*\[/g) || []).length;
  if (hasName > 0) {
    console.log(`${f} -> name entries: ${hasName}, tags entries: ${hasTags}`);
  }
});
