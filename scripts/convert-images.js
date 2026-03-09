const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const backgroundsDir = path.join(assetsDir, 'backgrounds');

const convertDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        if (file.endsWith('.png')) {
            const input = path.join(dir, file);
            const output = path.join(dir, file.replace('.png', '.webp'));

            console.log(`Converting ${file} to WebP...`);
            try {
                execSync(`npx -y sharp-cli -i "${input}" -o "${output}" -f webp`, { stdio: 'inherit' });
                console.log(`  Done: ${file} -> ${path.basename(output)}`);
            } catch (err) {
                console.error(`  Error converting ${file}:`, err.message);
            }
        }
    });
};

console.log('--- Converting Backgrounds ---');
convertDir(backgroundsDir);

console.log('\n--- Converting Blog Covers ---');
convertDir(assetsDir);

console.log('\nAll conversions complete.');
