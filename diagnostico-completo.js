const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const DB_PATH = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH);

console.log('═══════════════════════════════════════════════════════════');
console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA DE AUTENTICAÇÃO');
console.log('═══════════════════════════════════════════════════════════\n');

// 1. Verificar todos os usuários
console.log('📋 USUÁRIOS CADASTRADOS NO BANCO:');
console.log('─────────────────────────────────────────────────────────────');

db.all('SELECT id, email, name, role, created_at FROM users ORDER BY id', [], (err, users) => {
    if (err) {
        console.error('❌ ERRO ao buscar usuários:', err);
        return;
    }

    if (!users || users.length === 0) {
        console.log('⚠️  BANCO VAZIO - NENHUM USUÁRIO ENCONTRADO!\n');
        console.log('Isso explica porque o login não funciona.');
        console.log('Solução: Executar script de criação de usuários.\n');
        db.close();
        return;
    }

    console.log(`Total de usuários: ${users.length}\n`);
    users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Nome: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Criado em: ${user.created_at}`);
        console.log('');
    });

    // 2. Testar senhas conhecidas
    console.log('\n🔐 TESTANDO SENHAS CONHECIDAS:');
    console.log('─────────────────────────────────────────────────────────────');

    const senhasTeste = [
        { email: 'victorvitrine02@gmail.com', senhas: ['avada2024', 'admin123', 'admin', 'avada'] },
        { email: 'carolinafortesadvocacia@gmail.com', senhas: ['advogado2024', 'carolina2024', 'admin123'] },
        { email: 'florianoteodoro.advogado@hotmail.com', senhas: ['advogado2024', 'floriano2024'] }
    ];

    let testCount = 0;
    const totalTests = senhasTeste.reduce((sum, item) => sum + item.senhas.length, 0);

    senhasTeste.forEach(teste => {
        db.get('SELECT id, email, password, name FROM users WHERE email = ?', [teste.email], (err, user) => {
            if (!user) {
                console.log(`⚠️  Usuário ${teste.email} não encontrado no banco!`);
                testCount += teste.senhas.length;
                if (testCount >= totalTests) finalizarDiagnostico();
                return;
            }

            console.log(`\nTestando: ${user.name} (${user.email})`);

            teste.senhas.forEach(senha => {
                const match = bcrypt.compareSync(senha, user.password);
                testCount++;

                if (match) {
                    console.log(`   ✅ SENHA CORRETA: "${senha}"`);
                } else {
                    console.log(`   ❌ Falhou: "${senha}"`);
                }

                if (testCount >= totalTests) {
                    finalizarDiagnostico();
                }
            });
        });
    });

    function finalizarDiagnostico() {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('📊 RESUMO DO DIAGNÓSTICO');
        console.log('═══════════════════════════════════════════════════════════\n');

        // 3. Verificar clientes e processos
        db.get('SELECT COUNT(*) as count FROM clients', [], (err, result) => {
            console.log(`📁 Clientes cadastrados: ${result ? result.count : 0}`);

            db.get('SELECT COUNT(*) as count FROM processes', [], (err, result) => {
                console.log(`📋 Processos cadastrados: ${result ? result.count : 0}\n`);

                console.log('═══════════════════════════════════════════════════════════');
                console.log('💡 PRÓXIMOS PASSOS:');
                console.log('═══════════════════════════════════════════════════════════');
                console.log('1. Se encontrou senha correta acima (✅), anote-a');
                console.log('2. Se NENHUMA senha funcionou, execute: node criar-usuarios.js');
                console.log('3. Após confirmar senhas localmente, fazer deploy');
                console.log('\n');

                db.close();
            });
        });
    }
});
