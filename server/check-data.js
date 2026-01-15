const db = require('./database');

db.all('SELECT count(*) as total FROM clients', [], (err, rows) => {
    console.log('Total Clients:', rows[0].total);
});

db.all('SELECT user_id, count(*) as count FROM clients GROUP BY user_id', [], (err, rows) => {
    console.log('Clients per User:', rows);
});

db.all('SELECT count(*) as total FROM processes', [], (err, rows) => {
    console.log('Total Processes:', rows[0].total);
});
