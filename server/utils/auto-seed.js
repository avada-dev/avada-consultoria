const db = require('../database');
const bcrypt = require('bcryptjs');

const TARGET_EMAIL = 'carolinafortesadvocacia@gmail.com';
const TARGET_PASS = 'advogado2024';

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
    { name: 'SH ampar', phone: '(85) 9XXXX-XXXX', cpf: '', email: '' },
    { name: 'Joaquin Valetu', caseNumber: 'JV-JOAQ-2020-F', caseType: 'Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' }
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
    { client: 'Henreges', caseNumber: 'GE-HENR-2020', caseType: 'Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' },
    { client: 'SH ampar', caseNumber: 'SH-SHAP-2020', caseType: 'Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Arquivado', partnership: 'AVADA', deadline: '2020-12-14' }
];

async function checkAndSeed() {
    return new Promise((resolve) => {
        db.get('SELECT count(*) as count FROM clients', [], (err, row) => {
            if (row && row.count === 0) {
                console.log('🌱 Database empty. Running Auto-Seed for Dra. Caroline Fortes...');
                runSeeding().then(resolve);
            } else {
                console.log('✨ Data exists. Skipping seed.');
                resolve();
            }
        });
    });
}

function runSeeding() {
    return new Promise((resolve) => {
        db.get('SELECT id FROM users WHERE email = ?', [TARGET_EMAIL], (err, user) => {
            if (!user) {
                console.error('❌ User not found for seeding! (Should have been created by database.js)');
                resolve();
                return;
            }

            insertData(user.id).then(resolve);
        });
    });
}

function insertData(userId) {
    return new Promise((resolve) => {
        db.serialize(() => {
            // Insert Clients
            const stmt = db.prepare(` INSERT INTO clients (name, phone, cpf, email, notes, user_id, partnership_type) VALUES (?, ?, ?, ?, ?, ?, ?) `);
            clientsData.forEach(c => {
                stmt.run(c.name, c.phone, c.cpf, c.email, 'Imported Auto-Seed', userId, 'AVADA');
            });
            stmt.finalize();

            // Insert Processes
            // (Simplified for brevity as clients need ID lookup - assuming names match is flaky but efficient loop needed)
            // Actually, we must look up client IDs.

            let processed = 0;
            processesData.forEach(p => {
                db.get('SELECT id FROM clients WHERE name = ?', [p.client], (err, row) => {
                    if (row) {
                        db.run(`INSERT INTO processes (client_id, case_number, type, status, phase, partnership_type, process_category, deadline, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [row.id, p.caseNumber, p.caseType, p.status, p.phase, 'AVADA', p.caseType, p.deadline, new Date().toISOString()]);
                    }
                    processed++;
                    if (processed === processesData.length) setTimeout(resolve, 1000); // Give DB a moment
                });
            });

            if (processesData.length === 0) resolve();
        });
    });
}

module.exports = { checkAndSeed };
