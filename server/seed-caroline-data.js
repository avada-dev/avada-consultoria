const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Conectar ao banco de dados
const dataDir = path.join(__dirname, '../data');
const DB_PATH = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH);

console.log('🔄 Iniciando importação dos dados da Dra. Caroline Fortes...\n');

const TARGET_EMAIL = 'carolinafortesadvocacia@gmail.com';
const TARGET_PASS = 'advogado2024';

// Dados extraídos das planilhas
const clientsData = [
    { name: 'Protildo', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'TEAGLA', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'THALIA', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Priscila', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Ediltom Borges', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Debra do Perpétuo Libra', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Luís Marcée Terto', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Alessandro Paleira', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Diana Casaeiro', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Wandrelly Gomes de Areia', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Ligia Moneda', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Renato Alexandre', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Vitória Aragão', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Jusara', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Paola', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    // Arquivados
    { name: 'Doria Casaeiro', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'João Caçapão', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Baldrs', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Marcos Vinícius Breve', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Renato', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Joaquin Valetu', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'LaMonte', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Celes', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Henreges', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'SH ampar', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' }
];

const processesData = [
    // PROCESSOS ATIVOS - PENDENTES
    { client: 'Protildo', caseNumber: 'FH-PROT-2025', caseType: 'Administrativo', phase: 'Recurso à JARI', status: 'Aguardando Petição - JARI', partnership: 'AVADA', deadline: '2025-01-01' },
    { client: 'TEAGLA', caseNumber: 'TE-TEAG-2025', caseType: 'Administrativo', phase: 'Defesa de Autuação', status: 'Aguardando Petição - Defesa', partnership: 'AVADA', deadline: '2025-01-01' },
    { client: 'THALIA', caseNumber: 'TE-THAL-2025', caseType: 'Administrativo', phase: 'Defesa de Autuação', status: 'Aguardando Petição - Defesa', partnership: 'AVADA', deadline: '2025-01-01' },
    { client: 'Priscila', caseNumber: 'FH-PRIS-2025-A', caseType: 'Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Aguardando Recurso ao Colegiado da JARI', partnership: 'AVADA', deadline: '2025-01-01' },
    { client: 'Priscila', caseNumber: 'FH-PRIS-2025-B', caseType: 'Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Aguardando Recurso ao Colegiado da JARI', partnership: 'AVADA', deadline: '2025-01-01' },

    // AGUARDANDO
    { client: 'Ediltom Borges', caseNumber: 'DF-EDIL-2025', caseType: 'Administrativo', phase: 'Defesa de Autuação', status: 'Ok Feito', partnership: 'AVADA', deadline: '2025-01-01' },
    { client: 'Debra do Perpétuo Libra', caseNumber: 'DP-DEBR-2025', caseType: 'Administrativo', phase: 'Defesa de Autuação', status: 'Ok Feito', partnership: 'AVADA', deadline: '2025-01-01' },
    { client: 'Luís Marcée Terto', caseNumber: 'LUIZ-MARC-2025', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Aguardando Recurso Administrativo (CETRAN)', partnership: 'AVADA', deadline: '2025-01-01' },
    { client: 'Alessandro Paleira', caseNumber: 'AH-ALES-2025-A', caseType: 'Judicial', phase: 'Petição Inicial (sempre solicite gratuidade de justiça)', status: 'Aguardando Petição - Inicial', partnership: 'AVADA', deadline: '2025-01-01' },
    { client: 'Alessandro Paleira', caseNumber: 'AH-ALES-2025-B', caseType: 'Judicial', phase: 'Petição Inicial (sempre solicite gratuidade de justiça)', status: 'Aguardando Petição - Inicial', partnership: 'AVADA', deadline: '2025-01-01' },
    { client: 'Alessandro Paleira', caseNumber: 'AH-ALES-2025-C', caseType: 'Judicial', phase: 'Petição Inicial (sempre solicite gratuidade de justiça)', status: 'Aguardando Petição - Inicial', partnership: 'AVADA', deadline: '2025-01-01' },
    { client: 'Diana Casaeiro', caseNumber: 'MB-DIAN-2025-A', caseType: 'Administrativo', phase: 'Recurso à JARI', status: 'Aguardando Recurso Administrativo (JARI)', partnership: 'AVADA', deadline: '2025-01-01' },

    // PROTOCOLADOS
    { client: 'Diana Casaeiro', caseNumber: 'MB-DIAN-2025-B', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Protocolado', partnership: 'AVADA', deadline: '2025-01-01' },
    { client: 'Wandrelly Gomes de Areia', caseNumber: 'WLL-WAND-2025', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Protocolado', partnership: 'AVADA', deadline: '2025-01-20' },
    { client: 'Ligia Moneda', caseNumber: 'LF-LIGI-2025-A', caseType: 'Judicial', phase: 'Petição Inicial (sempre solicite gratuidade de justiça)', status: 'Protocolado', partnership: 'AVADA', deadline: '2025-01-21' },
    { client: 'Ligia Moneda', caseNumber: 'LF-LIGI-2025-B', caseType: 'Administrativo', phase: 'Defesa de Autuação', status: 'Protocolado', partnership: 'AVADA', deadline: '2025-01-30' },
    { client: 'Renato Alexandre', caseNumber: 'RA-RENA-2025', caseType: 'Administrativo', phase: 'Defesa de Autuação', status: 'Protocolado', partnership: 'AVADA', deadline: '2025-01-30' },
    { client: 'Vitória Aragão', caseNumber: 'VA-VITO-2025-A', caseType: 'Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Protocolado', partnership: 'AVADA', deadline: '2025-01-30' },
    { client: 'Vitória Aragão', caseNumber: 'VA-VITO-2025-B', caseType: 'Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Protocolado', partnership: 'AVADA', deadline: '2025-01-30' },
    { client: 'Jusara', caseNumber: 'JO-JUSA-2026-A', caseType: 'Judicial', phase: 'Petição Inicial (sempre solicite gratuidade de justiça)', status: 'Protocolado', partnership: 'AVADA', deadline: '2026-01-31' },
    { client: 'Jusara', caseNumber: 'JO-JUSA-2026-B', caseType: 'Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Protocolado', partnership: 'AVADA', deadline: '2026-02-01' },
    { client: 'Paola', caseNumber: 'PA-PAOL-2026', caseType: 'Administrativo', phase: 'Defesa de Autuação', status: 'Protocolado', partnership: 'AVADA', deadline: '2026-02-01' },

    // PROCESSOS ARQUIVADOS (CONCLUÍDOS)
    { client: 'Doria Casaeiro', caseNumber: 'GE-DORI-2020', caseType: 'Administrativo', phase: 'Defesa de Autuação', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-07-04' },
    { client: 'João Caçapão', caseNumber: 'JM-JOAO-2020', caseType: 'Judicial', phase: 'Petição Inicial (sempre solicite gratuidade de justiça)', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-07-05' },
    { client: 'Baldrs', caseNumber: 'SA-BALD-2020', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'Marcos Vinícius Breve', caseNumber: 'MA-MARC-2020', caseType: 'Judicial', phase: 'Petição Inicial (sempre solicite gratuidade de justiça)', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'Renato', caseNumber: 'RE-RENA-2020', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'Joaquin Valetu', caseNumber: 'JV-JOAQ-2020-A', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'Joaquin Valetu', caseNumber: 'JV-JOAQ-2020-B', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'Joaquin Valetu', caseNumber: 'JV-JOAQ-2020-C', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'Joaquin Valetu', caseNumber: 'JV-JOAQ-2020-D', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'Joaquin Valetu', caseNumber: 'JV-JOAQ-2020-E', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'LaMonte', caseNumber: 'LA-LAMO-2020', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'Celes', caseNumber: 'CS-CELE-2020', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'Renato', caseNumber: 'RE-RENA-2020-B', caseType: 'Administrativo', phase: 'Recurso à JARI', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'Henreges', caseNumber: 'GE-HENR-2020', caseType: 'Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'SH ampar', caseNumber: 'SH-SHAP-2020', caseType: 'Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'Joaquin Valetu', caseNumber: 'JV-JOAQ-2020-F', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' }
];

async function ensureUser() {
    return new Promise((resolve, reject) => {
        const hash = bcrypt.hashSync(TARGET_PASS, 10);

        db.get('SELECT * FROM users WHERE email = ?', [TARGET_EMAIL], (err, row) => {
            if (err) return reject(err);

            if (row) {
                console.log(`✅ Usuário encontrado (ID: ${row.id}). Atualizando senha...`);
                db.run('UPDATE users SET password = ? WHERE id = ?', [hash, row.id], function (err) {
                    if (err) return reject(err);
                    resolve(row.id);
                });
            } else {
                console.log(`🆕 Criando usuário ${TARGET_EMAIL}...`);
                db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                    ['Dra. Caroline Fortes', TARGET_EMAIL, hash, 'lawyer'],
                    function (err) {
                        if (err) return reject(err);
                        resolve(this.lastID);
                    }
                );
            }
        });
    });
}

// Função para inserir clientes
function insertClients(userId) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            const stmt = db.prepare(`
                INSERT INTO clients (name, phone, cpf, email, notes, user_id, partnership_type) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            let count = 0;
            clientsData.forEach((client) => {
                stmt.run(
                    client.name,
                    client.phone,
                    client.cpf,
                    client.email,
                    'Cliente importado da planilha da Dra. Caroline Fortes - Parceria AVADA',
                    userId,
                    'AVADA',
                    (err) => {
                        if (err) {
                            console.error(`❌ Erro ao inserir ${client.name}:`, err.message);
                        } else {
                            count++;
                            console.log(`✅ Cliente cadastrado: ${client.name}`);
                        }
                    }
                );
            });

            stmt.finalize(() => {
                console.log(`\n📊 Total de clientes cadastrados: ${count}/${clientsData.length}\n`);
                resolve();
            });
        });
    });
}

// Função para inserir processos
function insertProcesses() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            let count = 0;
            let processedCount = 0;

            processesData.forEach((process) => {
                // Buscar ID do cliente
                db.get('SELECT id FROM clients WHERE name = ?', [process.client], (err, row) => {
                    if (err || !row) {
                        console.error(`❌ Cliente não encontrado: ${process.client}`);
                        processedCount++;
                        if (processedCount === processesData.length) resolve();
                        return;
                    }

                    const clientId = row.id;

                    // Inserir processo
                    // Note: case_number matches the schema now
                    // type matches schema (caseType from import mapped to 'type')
                    db.run(`
                        INSERT INTO processes (
                            client_id, 
                            case_number, 
                            type, 
                            status, 
                            phase,
                            partnership_type,
                            documents,
                            process_category,
                            deadline,
                            created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        clientId,
                        process.caseNumber,
                        process.caseType, // Mapped to type column
                        process.status,
                        process.phase,
                        'AVADA', // Force AVADA partnership
                        JSON.stringify({
                            imported_from: 'Planilha Dra. Caroline Fortes'
                        }),
                        process.caseType, // Map caseType to category/type
                        process.deadline,
                        new Date().toISOString()
                    ], (err) => {
                        if (err) {
                            console.error(`❌ Erro ao inserir processo ${process.caseNumber}:`, err.message);
                        } else {
                            count++;
                            console.log(`✅ Processo cadastrado: ${process.caseNumber} - ${process.client} - ${process.status}`);
                        }

                        processedCount++;
                        if (processedCount === processesData.length) {
                            console.log(`\n📊 Total de processos cadastrados: ${count}/${processesData.length}\n`);
                            resolve();
                        }
                    });
                });
            });
        });
    });
}

// Executar importação
async function runImport() {
    try {
        console.log('🔐 Configurando usuário...');
        const userId = await ensureUser();
        console.log(`👤 Usuário alvo ID: ${userId}`);

        console.log('📥 FASE 1: Cadastrando Clientes...');
        await insertClients(userId);

        console.log('📥 FASE 2: Cadastrando Processos...');
        await insertProcesses();

        console.log('🎉 IMPORTAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('✅ Todos os dados da Dra. Caroline Fortes foram cadastrados.');
        console.log('✅ Senha definida para: advogado2024');
        console.log('\n💡 Tudo pronto para uso.\n');

        db.close();
    } catch (error) {
        console.error('❌ Erro durante importação:', error);
        db.close();
    }
}

runImport();
