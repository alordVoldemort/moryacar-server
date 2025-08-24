require("dotenv").config();
const mysql = require("mysql2");

console.log("=== DATABASE CONNECTION TESTER ===\n");

// Display connection configuration
console.log("📋 Connection Configuration:");
console.log({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD ? `${'*'.repeat(process.env.DB_PASSWORD.length)} (${process.env.DB_PASSWORD.length} chars)` : 'empty'
});
console.log("\n");

// Test 1: Basic Connection Test
console.log("🔍 Test 1: Basic MySQL Connection...");
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000,
  charset: 'utf8mb4'
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Connection Failed!");
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    
    // Specific error handling
    switch(err.code) {
      case 'ECONNREFUSED':
        console.error("🔍 Diagnosis: Server is not accepting connections");
        console.error("   - Check if the database server is running");
        console.error("   - Verify the host and port are correct");
        break;
      case 'ENOTFOUND':
        console.error("🔍 Diagnosis: Host not found");
        console.error("   - Check if the hostname is correct");
        console.error("   - Check your internet connection");
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        console.error("🔍 Diagnosis: Authentication failed");
        console.error("   - Check username and password");
        console.error("   - Verify user has permission to access the database");
        break;
      case 'ER_BAD_DB_ERROR':
        console.error("🔍 Diagnosis: Database does not exist");
        console.error("   - Check if database name is correct");
        console.error("   - Database might need to be created");
        break;
      case 'ETIMEDOUT':
        console.error("🔍 Diagnosis: Connection timeout");
        console.error("   - Server is taking too long to respond");
        console.error("   - Check network connectivity");
        break;
      default:
        console.error("🔍 Diagnosis: Unknown error");
        console.error("   - Check all connection parameters");
    }
    
    console.log("\n⚠️  Attempting connection without database name...");
    testWithoutDatabase();
    return;
  }
  
  console.log("✅ Connection Successful!");
  console.log("📊 Connection ID:", connection.threadId);
  
  // Test 2: Database Operations
  testDatabaseOperations(connection);
});

function testWithoutDatabase() {
  console.log("🔍 Test 2: Connection without database...");
  const connWithoutDB = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectTimeout: 10000
  });
  
  connWithoutDB.connect((err) => {
    if (err) {
      console.error("❌ Connection still failed without database");
      console.error("Error:", err.message);
      process.exit(1);
    }
    
    console.log("✅ Connected without database!");
    
    // Check if database exists
    connWithoutDB.query(`SHOW DATABASES LIKE '${process.env.DB_NAME}'`, (err, results) => {
      if (err) {
        console.error("❌ Error checking databases:", err.message);
      } else if (results.length === 0) {
        console.error(`❌ Database '${process.env.DB_NAME}' does not exist`);
        console.log("🔧 You need to create the database first");
      } else {
        console.log(`✅ Database '${process.env.DB_NAME}' exists`);
      }
      connWithoutDB.end();
      process.exit();
    });
  });
}

function testDatabaseOperations(connection) {
  console.log("\n🔍 Test 3: Database Operations...");
  
  // Test basic query
  connection.query('SELECT 1 as test', (err, results) => {
    if (err) {
      console.error("❌ Basic query failed:", err.message);
    } else {
      console.log("✅ Basic query successful");
    }
    
    // Test show tables
    connection.query('SHOW TABLES', (err, results) => {
      if (err) {
        console.error("❌ Show tables failed:", err.message);
      } else {
        console.log("✅ Show tables successful");
        console.log("📋 Tables found:", results.length);
        if (results.length > 0) {
          console.log("   Tables:", results.map(row => Object.values(row)[0]));
        } else {
          console.log("   No tables found in database");
        }
      }
      
      // Test create table (with error handling for existing table)
      testTableOperations(connection);
    });
  });
}

function testTableOperations(connection) {
  console.log("\n🔍 Test 4: Table Operations...");
  
  const testTableSQL = `
    CREATE TABLE IF NOT EXISTS connection_test (
      id INT AUTO_INCREMENT PRIMARY KEY,
      test_data VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  connection.query(testTableSQL, (err) => {
    if (err) {
      console.error("❌ Create table failed:", err.message);
      connection.end();
      process.exit();
      return;
    }
    
    console.log("✅ Create table successful");
    
    // Test insert
    const insertSQL = 'INSERT INTO connection_test (test_data) VALUES (?)';
    const testData = `Test data ${new Date().toISOString()}`;
    
    connection.query(insertSQL, [testData], (err, results) => {
      if (err) {
        console.error("❌ Insert failed:", err.message);
      } else {
        console.log("✅ Insert successful, ID:", results.insertId);
      }
      
      // Test select
      connection.query('SELECT * FROM connection_test ORDER BY id DESC LIMIT 3', (err, results) => {
        if (err) {
          console.error("❌ Select failed:", err.message);
        } else {
          console.log("✅ Select successful");
          console.log("📊 Recent test records:", results.length);
          results.forEach(row => {
            console.log(`   ID: ${row.id}, Data: ${row.test_data}, Created: ${row.created_at}`);
          });
        }
        
        // Clean up test table
        connection.query('DROP TABLE IF EXISTS connection_test', (err) => {
          if (err) {
            console.error("⚠️  Cleanup warning:", err.message);
          } else {
            console.log("✅ Test table cleaned up");
          }
          
          console.log("\n🎉 Database connection test completed!");
          connection.end();
          process.exit();
        });
      });
    });
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Test interrupted by user');
  if (connection) connection.end();
  process.exit();
});

// Set timeout for the entire test
setTimeout(() => {
  console.log('\n⏰ Test timeout after 30 seconds');
  if (connection) connection.end();
  process.exit();
}, 30000);
