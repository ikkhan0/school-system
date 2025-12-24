#!/usr/bin/env node

/**
 * Automated Vercel Environment Variable Setup
 * This script reads your local .env file and pushes variables to Vercel
 * Run once: node setup-vercel-env.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Vercel Environment Setup\n');

// Check if .env exists
const envPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ Error: backend/.env file not found!');
    console.log('\n📝 Please create backend/.env with:');
    console.log('   MONGO_URI=your_mongodb_connection_string');
    console.log('   JWT_SECRET=your_jwt_secret');
    console.log('   PORT=5000');
    console.log('   NODE_ENV=production\n');
    process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
            envVars[key] = value;
        }
    }
});

console.log('📋 Found environment variables:');
Object.keys(envVars).forEach(key => {
    const maskedValue = key.includes('SECRET') || key.includes('URI')
        ? '***' + envVars[key].slice(-4)
        : envVars[key];
    console.log(`   ${key}=${maskedValue}`);
});

console.log('\n🔧 Setting up Vercel CLI...');

try {
    // Check if Vercel CLI is installed
    try {
        execSync('vercel --version', { stdio: 'ignore' });
        console.log('✅ Vercel CLI already installed');
    } catch {
        console.log('📦 Installing Vercel CLI globally...');
        execSync('npm install -g vercel', { stdio: 'inherit' });
    }

    console.log('\n🔗 Linking to Vercel project...');
    console.log('   (You may need to login and select your project)\n');

    try {
        execSync('vercel link', { stdio: 'inherit' });
    } catch (error) {
        console.log('⚠️  Vercel link failed or was cancelled');
        console.log('   You can run "vercel link" manually later\n');
    }

    console.log('\n📤 Pushing environment variables to Vercel...\n');

    // Push each environment variable
    for (const [key, value] of Object.entries(envVars)) {
        try {
            console.log(`   Setting ${key}...`);
            execSync(`vercel env add ${key} production`, {
                input: value,
                stdio: ['pipe', 'inherit', 'inherit']
            });
            console.log(`   ✅ ${key} set successfully`);
        } catch (error) {
            console.log(`   ⚠️  ${key} might already exist or failed to set`);
        }
    }

    console.log('\n✨ Environment variables setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: vercel --prod');
    console.log('   2. Or push to GitHub to trigger auto-deployment\n');

} catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    console.log('\n📖 Manual Setup Instructions:');
    console.log('   1. Go to: https://vercel.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to Settings → Environment Variables');
    console.log('   4. Add each variable from backend/.env\n');
}
