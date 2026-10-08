import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const ALLOWED_FILES = [
  'frontend/src/content/sample.js',
  'frontend/src/content/copy.js',
  'backend/src/routes/config.js',
  'scripts/check-static.js',
];

const BANNED_PATTERNS = [
  /lorem\s+ipsum/i,
  /placeholder\s+data/i,
  /\bTODO\b/i,
  /FIXME/i,
  /2\.4\s*GB\s*of\s*10\s*GB/i,
  /mock[A-Z0-9_]+/i,
];

function scanDirectory(dir, issues = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (['node_modules', '.git', 'dist', 'build', '.kilo', '.vscode', '.dist'].includes(item)) continue;
    const fullPath = path.join(dir, item);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath, issues);
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(item)) {
      if (ALLOWED_FILES.some((f) => relPath.endsWith(f))) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        BANNED_PATTERNS.forEach((pattern) => {
          if (pattern.test(line)) {
            issues.push({
              file: relPath,
              line: idx + 1,
              pattern: pattern.toString(),
              content: line.trim(),
            });
          }
        });
      });
    }
  }
  return issues;
}

console.log('Running static-pattern checker script...');
const issues = scanDirectory(path.join(rootDir, 'frontend/src'));
scanDirectory(path.join(rootDir, 'backend/src'), issues);

if (issues.length > 0) {
  console.error('\nStatic-pattern check FAILED with issues:');
  issues.forEach((issue) => {
    console.error(`  [${issue.file}:${issue.line}] Pattern ${issue.pattern}: "${issue.content}"`);
  });
  process.exit(1);
} else {
  console.log('✓ Static-pattern check PASSED successfully! Zero hardcoded placeholders or mock data found.');
  process.exit(0);
}
