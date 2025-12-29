const express = require('express');
const app = express();

try {
    console.log('Testing studentRoutes syntax...');
    require('./routes/studentRoutes');
    console.log('SUCCESS: studentRoutes syntax is valid.');
} catch (error) {
    console.error('FAILURE: Syntax error in studentRoutes:', error);
}
