const { Pool } = require("pg");

const pool = new Pool({
 user: "postgres",
 host: "localhost",
 database: "code_analyzer",
 password: "Daan2105@",
 port: 5432
});

module.exports = pool;