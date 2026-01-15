const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH);
console.log(`📂 Banco de dados conectado em: ${DB_PATH}`);

// Initialize database schema
const initDatabase = () => {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'lawyer')),
        phone TEXT,
        oab TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Clients table
    db.run(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT NOT NULL,
        cpf TEXT,
        address TEXT,
        user_id INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Processes table
    db.run(`
      CREATE TABLE IF NOT EXISTS processes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        case_number TEXT NOT NULL,
        type TEXT NOT NULL,
        phase TEXT,
        status TEXT NOT NULL DEFAULT 'Em Andamento',
        description TEXT,
        deadline DATE,
        city TEXT,
        state TEXT,
        traffic_agency TEXT,
        court TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `);

    // Add new columns if they don't exist (for existing databases)
    db.run(`ALTER TABLE processes ADD COLUMN phase TEXT`, (err) => { });
    db.run(`ALTER TABLE processes ADD COLUMN city TEXT`, (err) => { });
    db.run(`ALTER TABLE processes ADD COLUMN state TEXT`, (err) => { });
    db.run(`ALTER TABLE processes ADD COLUMN traffic_agency TEXT`, (err) => { });
    db.run(`ALTER TABLE processes ADD COLUMN court TEXT`, (err) => { });
    db.run(`ALTER TABLE processes ADD COLUMN case_type TEXT`, (err) => { });
    db.run(`ALTER TABLE processes ADD COLUMN documents TEXT`, (err) => { });
    db.run(`ALTER TABLE processes ADD COLUMN partnership_type TEXT DEFAULT 'PARTICULAR'`, (err) => { });

    // New columns for process categories and deadline calculation
    db.run(`ALTER TABLE processes ADD COLUMN process_category TEXT`, (err) => { });
    db.run(`ALTER TABLE processes ADD COLUMN publication_date DATE`, (err) => { });
    db.run(`ALTER TABLE processes ADD COLUMN deadline_days INTEGER`, (err) => { });
    db.run(`ALTER TABLE processes ADD COLUMN fatal_deadline DATE`, (err) => { });
    db.run(`ALTER TABLE processes ADD COLUMN holidays_info TEXT`, (err) => { });
    db.run(`ALTER TABLE processes ADD COLUMN suspensions_info TEXT`, (err) => { });

    // New fields for process observations and lawyer requests
    db.run(`ALTER TABLE processes ADD COLUMN observations TEXT`, (err) => { });
    db.run(`ALTER TABLE processes ADD COLUMN lawyer_requests TEXT`, (err) => { });

    // Add partnership column to clients
    db.run(`ALTER TABLE clients ADD COLUMN partnership_type TEXT DEFAULT 'PARTICULAR'`, (err) => { });

    // Add archived column to clients
    db.run(`ALTER TABLE clients ADD COLUMN archived INTEGER DEFAULT 0`, (err) => { });

    // Settings table for system configurations
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Attachments table for process files
    db.run(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        uploaded_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    // Check if admin exists
    db.get("SELECT * FROM users WHERE email = ?", ['victorvitrine02@gmail.com'], (err, row) => {
      if (!row) {
        // Seed initial users
        const users = [
          {
            email: 'victorvitrine02@gmail.com',
            password: bcrypt.hashSync('avada2024', 10),
            name: 'AVADA',
            role: 'admin',
            phone: '(85) 99615-0912',
            oab: 'CRA/CE nº 5-763'
          },
          {
            email: 'florianoteodoro.advogado@hotmail.com',
            password: bcrypt.hashSync('advogado2024', 10),
            name: 'Dr. Floriano Aparecido Teodoro',
            role: 'lawyer',
            phone: '(18) 99715-0056',
            oab: 'OAB/SP 144811'
          },
          {
            email: 'carolinafortesadvocacia@gmail.com',
            password: bcrypt.hashSync('advogado2024', 10),
            name: 'Dra. Carolina Fortes',
            role: 'lawyer',
            phone: '(31) 98206-5842',
            oab: 'OAB/MG 144.551'
          },
          {
            email: 'ricardomachadocunhaadv@gmail.com',
            password: bcrypt.hashSync('advogado2024', 10),
            name: 'Dr. Ricardo Machado',
            role: 'lawyer',
            phone: '(12) 98846-3633',
            oab: 'OAB/SP 428.536'
          },
          {
            email: 'joadnoribeiro@gmail.com',
            password: bcrypt.hashSync('advogado2024', 10),
            name: 'Dr. Joadno de Deus Ribeiro',
            role: 'lawyer',
            phone: '(21) 974490650',
            oab: 'OAB/RJ 199312'
          }
        ];

        const stmt = db.prepare("INSERT INTO users (email, password, name, role, phone, oab) VALUES (?, ?, ?, ?, ?, ?)");
        users.forEach(user => {
          stmt.run(user.email, user.password, user.name, user.role, user.phone, user.oab);
        });
        stmt.finalize();

        console.log('✅ Database initialized with default users');
      }
    });

    // Seed some sample clients and processes -> REMOVED per user request
    // db.get("SELECT COUNT(*) as count FROM clients", [], (err, row) => {
    //   if (row.count === 0) {
    //      // Fake data removed
  });
};

initDatabase();

module.exports = db;
