const mongoose = require('mongoose');
require('dotenv').config();

const WhatsappTemplate = require('../models/WhatsappTemplate');

const MONGO_URI = process.env.MONGO_URI;

async function listAllTemplates() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected\n');

        // Get all templates
        const templates = await WhatsappTemplate.find({}).sort({ tenant_id: 1, name: 1, createdAt: -1 });

        console.log(`📊 Total templates in database: ${templates.length}\n`);

        if (templates.length === 0) {
            console.log('No templates found!');
            process.exit(0);
        }

        // Group by tenant_id for better readability
        const byTenant = {};

        templates.forEach(t => {
            const tenantKey = t.tenant_id ? t.tenant_id.toString() : 'SYSTEM_DEFAULT';
            if (!byTenant[tenantKey]) {
                byTenant[tenantKey] = [];
            }
            byTenant[tenantKey].push(t);
        });

        // Display templates grouped by tenant
        Object.keys(byTenant).forEach(tenantKey => {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`📁 Tenant: ${tenantKey === 'SYSTEM_DEFAULT' ? 'System Default (null)' : tenantKey}`);
            console.log(`${'='.repeat(80)}\n`);

            const tenantTemplates = byTenant[tenantKey];

            // Count duplicates
            const nameCounts = {};
            tenantTemplates.forEach(t => {
                const name = t.name;
                nameCounts[name] = (nameCounts[name] || 0) + 1;
            });

            tenantTemplates.forEach((t, index) => {
                const isDuplicate = nameCounts[t.name] > 1;
                const marker = isDuplicate ? '🔴 DUPLICATE' : '✅';

                console.log(`${marker} [${index + 1}] "${t.name}"`);
                console.log(`    ID: ${t._id}`);
                console.log(`    Type: ${t.type}`);
                console.log(`    Active: ${t.isActive}`);
                console.log(`    Created: ${t.createdAt}`);
                console.log(`    Content Preview: ${t.content.substring(0, 50)}...`);
                console.log(`    Name Length: ${t.name.length} chars`);
                console.log(`    Name (with quotes): "${t.name}"`);
                console.log(`    Name (hex): ${Buffer.from(t.name).toString('hex')}`);

                if (isDuplicate) {
                    console.log(`    ⚠️  WARNING: ${nameCounts[t.name]} templates with this name!`);
                }
                console.log('');
            });

            console.log(`Subtotal for this tenant: ${tenantTemplates.length} templates\n`);
        });

        // Find exact duplicates by checking name byte-by-byte
        console.log(`\n${'='.repeat(80)}`);
        console.log('🔍 DUPLICATE DETECTION ANALYSIS');
        console.log(`${'='.repeat(80)}\n`);

        Object.keys(byTenant).forEach(tenantKey => {
            const tenantTemplates = byTenant[tenantKey];
            const nameGroups = {};

            tenantTemplates.forEach(t => {
                const nameKey = t.name.trim().toLowerCase(); // Normalize for comparison
                if (!nameGroups[nameKey]) {
                    nameGroups[nameKey] = [];
                }
                nameGroups[nameKey].push(t);
            });

            Object.keys(nameGroups).forEach(nameKey => {
                if (nameGroups[nameKey].length > 1) {
                    console.log(`🔴 Found ${nameGroups[nameKey].length} duplicates in tenant ${tenantKey}:`);
                    console.log(`   Name: "${nameGroups[nameKey][0].name}"`);
                    nameGroups[nameKey].forEach((t, i) => {
                        console.log(`   ${i + 1}. ID: ${t._id}, Created: ${t.createdAt}`);
                    });
                    console.log('');
                }
            });
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

listAllTemplates();
