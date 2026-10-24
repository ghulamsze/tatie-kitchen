import fs from 'node:fs';
import path from 'node:path';

function touchFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      touchFiles(fullPath);
    } else if (entry.isFile()) {
      try {
        const buf = fs.readFileSync(fullPath);
        fs.writeFileSync(fullPath, buf);
      } catch (e) {
        // ignore
      }
    }
  }
}

const targets = [
  path.resolve('android/app/src/main/assets'),
  path.resolve('android/app/src/main/res'),
];

for (const target of targets) {
  touchFiles(target);
}
console.log('Successfully touched all Android assets and res files to remove OneDrive ReparsePoint.');
