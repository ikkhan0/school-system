/**
 * Update query filters to use tenant_id instead of school_id
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('Routes.js') && f !== 'authRoutes.js' && f !== 'superAdminRoutes.js');

console.log('Updating query filters to use tenant_id...\n');

files.forEach(file => {
    const filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    let changeCount = 0;

    // Replace school_id in query objects
    // Pattern: { school_id: req.tenant_id } or { school_id: req.user.school_id }
    const patterns = [
        { from: /school_id:\s*req\.tenant_id/g, to: 'tenant_id: req.tenant_id' },
        { from: /school_id:\s*req\.user\.school_id/g, to: 'tenant_id: req.tenant_id' },
        { from: /{\s*school_id:\s*req\.tenant_id/g, to: '{ tenant_id: req.tenant_id' },
        { from: /,\s*school_id:\s*req\.tenant_id/g, to: ', tenant_id: req.tenant_id' }
    ];

    patterns.forEach(pattern => {
        const matches = (content.match(pattern.from) || []).length;
        if (matches > 0) {
            content = content.replace(pattern.from, pattern.to);
            changeCount += matches;
        }
    });

    if (changeCount > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${file}: Updated ${changeCount} query filters`);
    } else {
        console.log(`⏭️  ${file}: No query filters to update`);
    }
});

console.log('\n✅ All query filters updated!');
