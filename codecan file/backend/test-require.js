// Test if superAdminRoutes can be loaded
try {
    console.log('Attempting to load superAdminRoutes...\n');
    const routes = require('./routes/superAdminRoutes');
    console.log('✅ Routes loaded successfully!');
    console.log('Type:', typeof routes);
    console.log('Is function?:', typeof routes === 'function');
    console.log('Has stack?:', routes.stack ? `Yes (${routes.stack.length} routes)` : 'No');
} catch (error) {
    console.error('❌ ERROR loading routes:');
    console.error(error.message);
    console.error('\nFull error:');
    console.error(error);
}
