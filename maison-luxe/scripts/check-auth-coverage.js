const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach((f) => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full, filelist);
    else filelist.push(full);
  });
  return filelist;
}

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
if (!fs.existsSync(apiDir)) {
  console.error('API directory not found:', apiDir);
  process.exit(1);
}

const files = walk(apiDir).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

const report = [];

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const hasWithAuth = /withAuth\(/.test(content) || /withAdminAuth\(/.test(content);
  const hasValidation = /withBodyValidation\(/.test(content);
  const exports = /export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=/g;
  const hasExport = exports.test(content);
  if (hasExport && !hasWithAuth && !hasValidation) {
    report.push({ file: path.relative(process.cwd(), file), hasWithAuth, hasValidation });
  }
});

if (report.length === 0) {
  console.log('All API routes appear to use withAuth/withAdminAuth or withBodyValidation.');
  process.exit(0);
}

console.log('API routes missing auth/validation wrappers:');
report.forEach((r) => console.log('-', r.file, ' validation:', r.hasValidation, ' auth:', r.hasWithAuth));
process.exit(0);
