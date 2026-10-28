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

const buildDirs = [
  path.resolve('android/app/build'),
  path.resolve('node_modules/@capacitor/android/capacitor/build'),
  path.resolve('node_modules/@capacitor/app/android/build'),
  path.resolve('node_modules/@capacitor/device/android/build'),
  path.resolve('node_modules/@capacitor/share/android/build'),
];
for (const bDir of buildDirs) {
  if (fs.existsSync(bDir)) {
    try {
      fs.rmSync(bDir, { recursive: true, force: true });
      console.log(`Cleaned ${bDir} to prevent OneDrive lock.`);
    } catch (e) {
      // ignore
    }
  }
}

for (const target of targets) {
  touchFiles(target);
}
console.log('Successfully touched all Android assets and res files to remove OneDrive ReparsePoint.');
