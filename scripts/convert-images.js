const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backgroundsDir = path.join(__dirname, '..', 'assets', 'backgrounds');
const files = fs.readdirSync(backgroundsDir);

files.forEach(file => {
    if (file.endsWith('.png')) {
        const input = path.join(backgroundsDir, file);
        const output = path.join(backgroundsDir, file.replace('.png', '.webp'));

        console.log(`Converting ${file} to WebP...`);
        try {
            execSync(`npx -y sharp-cli -i "${input}" -o "${output}" -f webp`, { stdio: 'inherit' });
            console.log(`  Done: ${file} -> ${path.basename(output)}`);
        } catch (err) {
            console.error(`  Error converting ${file}:`, err.message);
        }
    }
});
