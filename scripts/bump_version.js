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

// Bump all services versions if services.json exists (unless disabled)
let bumpedServices = null;
const servicesPath = path.join(root, 'services.json');
const noBumpServices = process.argv.includes('--no-services') || process.env.NO_BUMP_SERVICES;
if (noBumpServices) {
  console.log('Skipping services bump due to --no-services / NO_BUMP_SERVICES');
} else if (fs.existsSync(servicesPath)) {
  try {
    const services = readJSON(servicesPath);
    bumpedServices = {};
    for (const k of Object.keys(services)) {
      const oldV = String(services[k] || '0.0.0').replace(/^v/i,'');
      const parts = oldV.split('.').map(n => parseInt(n)||0);
      let [maj, min, pat] = [parts[0]||0, parts[1]||0, parts[2]||0];
      pat += 1;
      if (pat > 9) { pat = 0; min += 1; }
      const newV = `${maj}.${min}.${pat}`;
      services[k] = newV;
      bumpedServices[k] = newV;
    }
    writeJSON(servicesPath, services);
    console.log('Bumped services:', Object.entries(bumpedServices).map(([k,v])=>`${k}->v${v}`).join(', '));
  } catch (e) { bumpedServices = null; }
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
let entryLines = [header, '', `- Commit: ${shortSha}`, `- Notes: ${commitMsg || 'n/a'}`];
if (bumpedServices) {
  entryLines.push('- Services:');
  for (const [k, v] of Object.entries(bumpedServices)) {
    entryLines.push(`  - ${k}: v${v}`);
  }
}
entryLines.push('');
const entry = entryLines.join('\n');

fs.appendFileSync(versionsPath, entry, 'utf8');

// Stage and commit changes
let gitAddPaths = `${pkgPath} ${updatesPath} ${versionsPath}`;
if (bumpedServices && fs.existsSync(servicesPath)) gitAddPaths += ` ${servicesPath}`;
try {
  execSync(`git add ${gitAddPaths}`);
  const svcMsg = bumpedServices ? ` (services: ${Object.entries(bumpedServices).map(([k,v])=>`${k}@v${v}`).join(', ')})` : '';
  execSync(`git commit -m "chore(release): v${newVersion}${svcMsg}"`);
  console.log('Bumped version to', newVersion);
  console.log('Committed release files.');
} catch (e) {
  console.log('Bumped version to', newVersion, '(no commit created)');
}

process.exit(0);
