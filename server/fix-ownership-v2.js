const db = require('./database');

db.all('SELECT id, name, email, role FROM users', [], (err, rows) => {
    if (err) console.error(err);
    else {
        console.log('--- ALL USERS ---');
        console.table(rows);

        const target = rows.find(r => r.email.trim().toLowerCase() === 'carolinafortesadvocacia@gmail.com');
        if (target) {
            console.log(`FOUND TARGET: ID ${target.id}`);
            updateClients(target.id);
        } else {
            console.log('TARGET NOT FOUND IN LIST!');
        }
    }
});

function updateClients(userId) {
    console.log(`Updating clients to User ID ${userId}...`);
    db.run('UPDATE clients SET user_id = ?', [userId], function (err) {
        if (err) console.error(err);
        else console.log(`DONE: ${this.changes} clients updated.`);
    });
}
