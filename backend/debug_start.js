try {
    console.log('Attempting to require index.js...');
    require('./index.js');
    console.log('index.js required successfully!');
} catch (e) {
    console.log('CRITICAL ERROR DETAILS:');
    console.log('Message:', e.message);
    console.log('Code:', e.code);
    if (e.requireStack) console.log('Stack:', e.requireStack);
}
