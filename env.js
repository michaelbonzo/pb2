'use strict';
// Loads secrets from a local .env file if present (Node 20.12+). On hosting platforms, set the same
// variables in the dashboard instead and don't upload a .env file.
const fs = require('fs');
const path = require('path');
exports.load = () => {
  const file = path.join(__dirname, '.env');
  if (fs.existsSync(file)) process.loadEnvFile(file);
};
