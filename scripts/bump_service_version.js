const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJSON(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8'); }

const root = path.join(__dirname, '..');
const servicesPath = path.join(root, 'services.json');
if (!process.argv[2]) {
  console.error('Usage: node scripts/bump_service_version.js <SERVICE_KEY>');
  process.exit(2);
}
const service = process.argv[2].toUpperCase();
let services = {};
try { services = readJSON(servicesPath); } catch (e) { services = {}; }
const old = String(services[service] || '0.0.0');
const parts = old.replace(/^v/i,'').split('.').map(n => parseInt(n)||0);
let [major, minor, patch] = [parts[0]||0, parts[1]||0, parts[2]||0];
patch += 1;
if (patch > 9) { patch = 0; minor += 1; }
const newV = `${major}.${minor}.${patch}`;
services[service] = newV;
writeJSON(servicesPath, services);
try {
  execSync(`git add ${servicesPath}`);
  execSync(`git commit -m "chore(service): bump ${service} to v${newV}"`);
  execSync('git push');
  console.log(`${service} bumped to v${newV} and committed`);
} catch (e) {
  console.log(`${service} bumped to v${newV} (no commit created)`);
}
process.exit(0);
