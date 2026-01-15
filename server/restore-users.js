const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '../data');
const DB_PATH = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH);

const users = [
    {
        email: 'victorvitrine02@gmail.com',
        password: 'avada2024', // Default from database.js
        name: 'AVADA',
        role: 'admin',
        phone: '(85) 99615-0912',
        oab: 'CRA/CE nº 5-763'
    },
    {
        email: 'florianoteodoro.advogado@hotmail.com',
        password: 'advogado2024',
        name: 'Dr. Floriano Aparecido Teodoro',
        role: 'lawyer',
        phone: '(18) 99715-0056',
        oab: 'OAB/SP 144811'
    },
    {
        email: 'carolinafortesadvocacia@gmail.com',
        password: 'advogado2024',
        name: 'Dra. Carolina Fortes',
        role: 'lawyer',
        phone: '(31) 98206-5842',
        oab: 'OAB/MG 144.551'
    },
    {
        email: 'ricardomachadocunhaadv@gmail.com',
        password: 'advogado2024',
        name: 'Dr. Ricardo Machado',
        role: 'lawyer',
        phone: '(12) 98846-3633',
        oab: 'OAB/SP 428.536'
    },
    {
        email: 'joadnoribeiro@gmail.com',
        password: 'advogado2024',
        name: 'Dr. Joadno de Deus Ribeiro',
        role: 'lawyer',
        phone: '(21) 974490650',
        oab: 'OAB/RJ 199312'
    }
];

function restoreUsers() {
    db.serialize(() => {
        users.forEach(user => {
            const hash = bcrypt.hashSync(user.password, 10);

            db.get('SELECT id FROM users WHERE email = ?', [user.email], (err, row) => {
                if (err) {
                    console.error('Error checking user:', err);
                    return;
                }

                if (row) {
                    console.log(`Updating existing user: ${user.email}`);
                    db.run(`UPDATE users SET password = ?, name = ?, role = ?, phone = ?, oab = ? WHERE id = ?`,
                        [hash, user.name, user.role, user.phone, user.oab, row.id],
                        (err) => {
                            if (err) console.error(err);
                            else console.log(`✅ Password reset for: ${user.name}`);
                        }
                    );
                } else {
                    console.log(`Creating missing user: ${user.email}`);
                    db.run(`INSERT INTO users (email, password, name, role, phone, oab) VALUES (?, ?, ?, ?, ?, ?)`,
                        [user.email, hash, user.name, user.role, user.phone, user.oab],
                        (err) => {
                            if (err) console.error(err);
                            else console.log(`✅ User created: ${user.name}`);
                        }
                    );
                }
            });
        });
    });
}

restoreUsers();
