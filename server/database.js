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

    // Seed some sample clients and processes
    db.get("SELECT COUNT(*) as count FROM clients", [], (err, row) => {
      if (row.count === 0) {
        const sampleClients = [
          { name: 'João Silva', email: 'joao@email.com', phone: '(11) 98765-4321', cpf: '123.456.789-00', user_id: 2 },
          { name: 'Maria Santos', email: 'maria@email.com', phone: '(11) 98765-4322', cpf: '987.654.321-00', user_id: 3 },
          { name: 'Pedro Costa', email: 'pedro@email.com', phone: '(11) 98765-4323', cpf: '456.789.123-00', user_id: 4 }
        ];

        const stmt = db.prepare("INSERT INTO clients (name, email, phone, cpf, user_id) VALUES (?, ?, ?, ?, ?)");
        sampleClients.forEach(client => {
          stmt.run(client.name, client.email, client.phone, client.cpf, client.user_id);
        });
        stmt.finalize();

        // Add sample processes
        const sampleProcesses = [
          { client_id: 1, case_number: '2024001-SP', type: 'Recurso de Multa', status: 'Em Andamento', description: 'Recurso de multa por velocidade' },
          { client_id: 2, case_number: '2024002-MG', type: 'Perícia Digital', status: 'Concluído', description: 'Análise de CNH' },
          { client_id: 3, case_number: '2024003-SP', type: 'Parecer Técnico', status: 'Aguardando Documentos', description: 'Laudo técnico de acidente' }
        ];

        const stmtProc = db.prepare("INSERT INTO processes (client_id, case_number, type, status, description) VALUES (?, ?, ?, ?, ?)");
        sampleProcesses.forEach(proc => {
          stmtProc.run(proc.client_id, proc.case_number, proc.type, proc.status, proc.description);
        });
        stmtProc.finalize();

        console.log('✅ Sample data added');
      }
    });
  });
};

initDatabase();

module.exports = db;
