const fs = require('fs');
const path = require('path');
const glob = require('glob');

const blogDir = 'c:/Users/devin/OneDrive/Desktop/thevibecheck-website/Website/blog';

// Regex to find the redundant <div class="inline-related-reading"> block
// This includes the possible variations in spacing and content
const relatedReadingRegex = /<div class="inline-related-reading">[\s\S]*?<\/div>\s*/g;

async function cleanupBlogLayout() {
    console.log('🧹 Starting Blog Layout Cleanup...');

    const files = glob.sync(`${blogDir}/*.html`);
    let count = 0;

    for (const file of files) {
        let content = fs.readFileSync(file, 'utf8');

        if (relatedReadingRegex.test(content)) {
            const newContent = content.replace(relatedReadingRegex, '');
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`✅ Cleaned up: ${path.basename(file)}`);
            count++;
        }
    }

    console.log(`\n✨ Done! Cleaned up ${count} files.`);
}

cleanupBlogLayout().catch(err => {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
});
