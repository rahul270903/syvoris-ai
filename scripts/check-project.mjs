import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(full);
  }
}
walk(srcRoot);
const sourceFiles = files.filter((file) => /\.(ts|tsx)$/.test(file));
const errors = [];
const routeMatches = fs.readFileSync(path.join(srcRoot, 'app/navigation.ts'), 'utf8').matchAll(/item\('[^']*','([^']+)'/g);
const routes = [...routeMatches].map((match) => match[1]);
const duplicateRoutes = routes.filter((route, index) => routes.indexOf(route) !== index);
if (duplicateRoutes.length) errors.push(`Duplicate routes: ${[...new Set(duplicateRoutes)].join(', ')}`);
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const imports = source.matchAll(/from\s+['"](\.[^'"]+)['"]/g);
  for (const match of imports) {
    const base = path.resolve(path.dirname(file), match[1]);
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      errors.push(`${path.relative(root, file)}: missing relative import ${match[1]}`);
    }
  }
}
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const script of ['dev', 'build', 'preview', 'check:project']) {
  if (!packageJson.scripts?.[script]) errors.push(`Missing npm script: ${script}`);
}
const logoFiles = ['public/assets/syvoris-mark.png', 'public/assets/syvoris-wordmark.png'];
for (const asset of logoFiles) if (!fs.existsSync(path.join(root, asset))) errors.push(`Missing brand asset: ${asset}`);
const seed = fs.readFileSync(path.join(srcRoot, 'data/seed.ts'), 'utf8');
for (const requiredEntity of ['organizations', 'contacts', 'leads', 'opportunities', 'quotes', 'salesOrders', 'cases', 'projects', 'agents', 'decisions', 'events', 'audit']) {
  if (!new RegExp(`\\b${requiredEntity}:\\s*\\[`).test(seed)) errors.push(`Missing seed collection: ${requiredEntity}`);
}
console.log(`SYVORIS Ai project check`);
console.log(`Source files inspected: ${sourceFiles.length}`);
console.log(`Navigation routes: ${routes.length}`);
console.log(`Unique navigation routes: ${new Set(routes).size}`);
console.log(`Relative imports checked: ${sourceFiles.length} source files`);
if (errors.length) {
  console.error(`\n${errors.length} issue(s) found:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Project structure checks passed.');
