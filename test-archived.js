const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/database.sqlite');

console.log('=== TESTING ARCHIVED FILTER ===\n');

// Test 1: Get all processes with status
db.all(`SELECT id, case_number, status, client_id FROM processes ORDER BY status`, [], (err, all) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    console.log('ALL PROCESSES:');
    all.forEach(p => console.log(`  ${p.id}: ${p.case_number} - ${p.status}`));
    console.log(`\nTotal: ${all.length} processes\n`);

    // Test 2: Filter archived (simulating backend NOT archived logic)
    db.all(`SELECT id, case_number, status FROM processes WHERE status != 'Arquivado' ORDER BY id`, [], (err, notArchived) => {
        if (err) {
            console.error('Error:', err);
            return;
        }
        console.log('NOT ARCHIVED (Active Processes):');
        notArchived.forEach(p => console.log(`  ${p.id}: ${p.case_number} - ${p.status}`));
        console.log(`\nTotal: ${notArchived.length} active processes\n`);

        // Test 3: Filter archived (simulating backend archived logic)
        db.all(`SELECT id, case_number, status FROM processes WHERE status = 'Arquivado' ORDER BY id`, [], (err, archived) => {
            if (err) {
                console.error('Error:', err);
                return;
            }
            console.log('ARCHIVED ONLY:');
            archived.forEach(p => console.log(`  ${p.id}: ${p.case_number} - ${p.status}`));
            console.log(`\nTotal: ${archived.length} archived processes\n`);

            db.close();
        });
    });
});
