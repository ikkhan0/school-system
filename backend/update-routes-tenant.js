/**
 * Quick script to update all school_id references to tenant_id in route files
 * This performs a global search and replace
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('Routes.js') && f !== 'authRoutes.js' && f !== 'superAdminRoutes.js');

console.log('Updating route files to use tenant_id...\n');

files.forEach(file => {
    const filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Count replacements
    const schoolIdMatches = (content.match(/req\.user\.school_id/g) || []).length;

    if (schoolIdMatches > 0) {
        // Replace req.user.school_id with req.tenant_id
        content = content.replace(/req\.user\.school_id/g, 'req.tenant_id');

        // Also replace school_id: req.user.school_id with tenant_id: req.tenant_id
        content = content.replace(/school_id:\s*req\.user\.school_id/g, 'tenant_id: req.tenant_id');

        // Write back
        fs.writeFileSync(filePath, content, 'utf8');

        console.log(`✅ ${file}: Updated ${schoolIdMatches} references`);
    } else {
        console.log(`⏭️  ${file}: No changes needed`);
    }
});

console.log('\n✅ All route files updated!');
console.log('\nNOTE: You should also update queries to filter by tenant_id instead of school_id');
console.log('Example: Student.find({ school_id: ... }) -> Student.find({ tenant_id: ... })');
