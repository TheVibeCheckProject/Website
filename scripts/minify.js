const fs = require('fs');
const path = require('path');

/**
 * Very basic CSS/JS minifier using regex for environments where 
 * full tools like terser or clean-css aren't installed.
 */

function minifyCSS(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s*([\{\}:;,])\s*/g, '$1') // Remove spaces around characters
        .replace(/\n+/g, '') // Remove newlines
        .trim();
}

function minifyJS(js) {
    // Basic JS minification (removes comments and some spaces)
    // NOTE: This is NOT a full parser-based minifier, but good for simple scripts.
    return js
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/([^:])\/\/.*/g, '$1') // Remove line comments (avoiding http://)
        .replace(/\s+/g, ' ') // Collapse whitespaces
        .replace(/\s*([=+\-{}\(\);,])\s*/g, '$1') // Remove spaces around operators
        .trim();
}

const filesToMinify = [
    { src: 'css/styles.css', dest: 'css/styles.min.css', type: 'css' },
    { src: 'js/script.js', dest: 'js/script.min.js', type: 'js' },
    { src: 'js/animations.js', dest: 'js/animations.min.js', type: 'js' }
];

const websiteDir = path.join(__dirname, '..');

filesToMinify.forEach(file => {
    const srcPath = path.join(websiteDir, file.src);
    const destPath = path.join(websiteDir, file.dest);

    if (fs.existsSync(srcPath)) {
        console.log(`Minifying ${file.src}...`);
        const content = fs.readFileSync(srcPath, 'utf8');
        const minified = file.type === 'css' ? minifyCSS(content) : minifyJS(content);
        fs.writeFileSync(destPath, minified);
        const originalSize = fs.statSync(srcPath).size;
        const newSize = fs.statSync(destPath).size;
        const savings = ((1 - newSize / originalSize) * 100).toFixed(2);
        console.log(`  Saved ${savings}% (${originalSize} -> ${newSize} bytes)`);
    } else {
        console.warn(`  Warning: ${file.src} not found at ${srcPath}`);
    }
});
