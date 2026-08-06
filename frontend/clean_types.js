import { globSync } from 'glob';
import fs from 'fs';

const files = globSync('src/**/*.js').concat(globSync('src/**/*.jsx'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Split by lines and remove lines that look like type imports, unless it imports UserRole
  let lines = content.split('\n');
  lines = lines.map(line => {
    if (line.match(/import.*from.*['"](.*types.*)['"]/)) {
      if (!line.includes('UserRole')) {
        return '// ' + line;
      }
    }
    // Also remove exports of types if they remain
    if (line.match(/^export (interface|type) /)) {
      return '// ' + line;
    }
    return line;
  });

  content = lines.join('\n');
  
  // if file ends in .types.js and is basically empty now except imports, we don't care, it'll just be an empty module.
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Cleaned: ${file}`);
  }
});
