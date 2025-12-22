const { execSync } = require('child_process');
try {
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('Pushing database schema...');
  execSync('npm run db:push', { stdio: 'inherit' });
  console.log('Done.');
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
