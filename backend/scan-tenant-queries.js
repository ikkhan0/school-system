/**
 * Migration Script: Update all queries to use tenant_id instead of school_id
 * 
 * This script helps identify which queries need to be updated for tenant isolation.
 * Run this to see all the places that need updating.
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('Routes.js'));

console.log('Scanning route files for school_id usage...\n');
console.log('='.repeat(70));

files.forEach(file => {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    const matches = [];
    lines.forEach((line, index) => {
        if (line.includes('school_id') && (
            line.includes('.find') ||
            line.includes('.findOne') ||
            line.includes('.create') ||
            line.includes('.updateOne') ||
            line.includes('.deleteMany')
        )) {
            matches.push({
                line: index + 1,
                content: line.trim()
            });
        }
    });

    if (matches.length > 0) {
        console.log(`\n📄 ${file}`);
        console.log(`   Found ${matches.length} queries using school_id`);
        matches.slice(0, 5).forEach(m => {
            console.log(`   Line ${m.line}: ${m.content.substring(0, 80)}...`);
        });
        if (matches.length > 5) {
            console.log(`   ... and ${matches.length - 5} more`);
        }
    }
});

console.log('\n' + '='.repeat(70));
console.log('\nNEXT STEPS:');
console.log('1. Update queries to use req.tenant_id instead of req.user.school_id');
console.log('2. Ensure all models have tenant_id field');
console.log('3. Run migration to populate tenant_id for existing data');
