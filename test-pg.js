require('dotenv').config();
const { parse } = require('pg-connection-string');
const config = parse(process.env.DATABASE_URL);
console.log('Parsed config:', config);
console.log('Type of password:', typeof config.password);
