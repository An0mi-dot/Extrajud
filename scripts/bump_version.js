const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJSON(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8'); }

const root = path.join(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const updatesPath = path.join(root, 'updates.json');
const versionsPath = path.join(root, 'VERSIONS.md');

const pkg = readJSON(pkgPath);
const oldVersion = String(pkg.version || '0.0.0');
const parts = oldVersion.replace(/^v/i,'').split('.').map(n => parseInt(n)||0);
let [major, minor, patch] = [parts[0]||0, parts[1]||0, parts[2]||0];

// Bump rule: increment patch; when patch > 9 -> minor++, patch = 0
patch += 1;
if (patch > 9) { patch = 0; minor += 1; }
const newVersion = `${major}.${minor}.${patch}`;

pkg.version = newVersion;
writeJSON(pkgPath, pkg);

// Update updates.json if present
if (fs.existsSync(updatesPath)) {
  try {
    const upd = readJSON(updatesPath);
    upd.version = newVersion;
    // keep existing url/raw but update published_at
    upd.published_at = new Date().toISOString();
    writeJSON(updatesPath, upd);
  } catch (e) { /* ignore */ }
}

// Append to VERSIONS.md
const now = new Date();
const dateStr = now.toISOString().split('T')[0];
let commitMsg = '';
let shortSha = '';
try {
  commitMsg = execSync('git log -1 --pretty=%B').toString().trim();
  shortSha = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) { commitMsg = ''; shortSha = ''; }

const header = `## v${newVersion} - ${dateStr}`;
const entry = [`${header}`, '', `- Commit: ${shortSha}`, `- Notes: ${commitMsg || 'n/a'}`, ''].join('\n');

fs.appendFileSync(versionsPath, entry, 'utf8');

// Stage and commit changes
try {
  execSync(`git add ${pkgPath} ${updatesPath} ${versionsPath}`);
  execSync(`git commit -m "chore(release): v${newVersion}"`);
  console.log('Bumped version to', newVersion);
  console.log('Committed release files.');
} catch (e) {
  console.log('Bumped version to', newVersion, '(no commit created)');
}

process.exit(0);
