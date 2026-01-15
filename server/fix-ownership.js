const db = require('./database');
const bcrypt = require('bcryptjs');

function fixOwnership() {
    const email = 'carolinafortesadvocacia@gmail.com';

    console.log(`Checking for user: ${email}...`);

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            console.error('Error fetching user:', err);
            return;
        }

        if (!user) {
            console.error(`CRITICAL: User ${email} NOT FOUND! I will create her now with the provided credentials.`);
            // Create the user if missing (safety net, though user implies she exists)
            const password = 'advogado2024';
            const hash = bcrypt.hashSync(password, 10);

            db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
                ['Dra. Carolina Fortes', email, hash, 'lawyer'],
                function (err) {
                    if (err) {
                        console.error('Error creating user:', err);
                    } else {
                        console.log(`User created with ID: ${this.lastID}`);
                        updateClients(this.lastID);
                    }
                }
            );
        } else {
            console.log(`User found! ID: ${user.id}, Name: ${user.name}, Role: ${user.role}`);
            updateClients(user.id);
        }
    });
}

function updateClients(userId) {
    console.log(`Updating ALL clients to belong to User ID: ${userId}...`);

    db.run('UPDATE clients SET user_id = ?', [userId], function (err) {
        if (err) {
            console.error('Error updating clients:', err);
            return;
        }
        console.log(`Success! ${this.changes} clients updated to belong to Dra. Carolina.`);

        // Check Admin visibility logic assurance
        verifyDataQuality();
    });
}

function verifyDataQuality() {
    console.log('Verifying existing processes partnership types...');
    db.all('SELECT id, partnership_type FROM clients', [], (err, rows) => {
        if (err) return;
        const particular = rows.filter(r => r.partnership_type === 'PARTICULAR').length;
        const avada = rows.filter(r => r.partnership_type === 'AVADA').length;
        console.log(`Distribution: ${avada} AVADA clients, ${particular} PARTICULAR clients.`);
    });
}

fixOwnership();
