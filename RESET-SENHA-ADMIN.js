const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const readline = require('readline');

const dataDir = path.join(__dirname, 'data');
const DB_PATH = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('═══════════════════════════════════════════');
console.log('🔧 RESET DE SENHA - CONTROLE TOTAL');
console.log('═══════════════════════════════════════════\n');

rl.question('Digite o EMAIL do usuário: ', (email) => {
    rl.question('Digite a NOVA SENHA que você quer: ', (password) => {

        const hash = bcrypt.hashSync(password, 10);

        db.get('SELECT id, name FROM users WHERE email = ?', [email], (err, user) => {
            if (err) {
                console.error('❌ Erro:', err);
                rl.close();
                return;
            }

            if (!user) {
                console.error(`❌ Usuário com email "${email}" NÃO ENCONTRADO!`);
                console.log('\n📋 Listando todos os usuários cadastrados:\n');

                db.all('SELECT email, name, role FROM users', [], (err, rows) => {
                    if (rows) {
                        rows.forEach(r => {
                            console.log(`  - ${r.email} (${r.name}) - ${r.role}`);
                        });
                    }
                    rl.close();
                });
                return;
            }

            db.run('UPDATE users SET password = ? WHERE id = ?', [hash, user.id], (err) => {
                if (err) {
                    console.error('❌ Erro ao atualizar senha:', err);
                } else {
                    console.log(`\n✅ SENHA ALTERADA COM SUCESSO!`);
                    console.log(`   Usuário: ${user.name}`);
                    console.log(`   Email: ${email}`);
                    console.log(`   Nova senha: ${password}`);
                }
                rl.close();
            });
        });
    });
});
