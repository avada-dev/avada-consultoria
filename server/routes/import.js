const express = require('express');
const router = express.Router();
const db = require('../database');

// POST /api/import/import-caroline-data
router.post('/import-caroline-data', async (req, res) => {
    try {
        console.log('🔄 Iniciando importação dos dados da Dra. Caroline Fortes...');

        // Buscar ID da Dra. Carolina Fortes
        const carolina = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE email = ?', ['carolinafortesadvocacia@gmail.com'], (err, row) => {
                if (err) reject(err);
                else if (!row) reject(new Error('Usuária Dra. Carolina Fortes não encontrada'));
                else resolve(row);
            });
        });

        const carolinaId = carolina.id;
        console.log(`✅ Dra. Carolina ID: ${carolinaId}`);

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
            { client: 'Protildo', caseNumber: 'FH-PROT-2025', caseType: 'Trânsito Administrativo', phase: 'Recurso à JARI', status: 'Pendente', deadline: '2025-01-01' },
            { client: 'TEAGLA', caseNumber: 'TE-TEAG-2025', caseType: 'Trânsito Administrativo', phase: 'Defesa de Autuação', status: 'Pendente', deadline: '2025-01-01' },
            { client: 'THALIA', caseNumber: 'TE-THAL-2025', caseType: 'Trânsito Administrativo', phase: 'Defesa de Autuação', status: 'Pendente', deadline: '2025-01-01' },
            { client: 'Priscila', caseNumber: 'FH-PRIS-2025-A', caseType: 'Trânsito Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Aguardando', deadline: '2025-01-01' },
            { client: 'Priscila', caseNumber: 'FH-PRIS-2025-B', caseType: 'Trânsito Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Aguardando', deadline: '2025-01-01' },
            { client: 'Ediltom Borges', caseNumber: 'DF-EDIL-2025', caseType: 'Trânsito Administrativo', phase: 'Defesa de Autuação', status: 'Aguardando', deadline: '2025-01-01' },
            { client: 'Debra do Perpétuo Libra', caseNumber: 'DP-DEBR-2025', caseType: 'Trânsito Administrativo', phase: 'Defesa de Autuação', status: 'Aguardando', deadline: '2025-01-01' },
            { client: 'Luís Marcée Terto', caseNumber: 'LUIZ-MARC-2025', caseType: 'Trânsito Administrativo', phase: 'Recurso ao CETRAN', status: 'Aguardando', deadline: '2025-01-01' },
            { client: 'Alessandro Paleira', caseNumber: 'AH-ALES-2025-A', caseType: 'Trânsito Judicial', phase: 'Petição Inicial', status: 'Aguardando', deadline: '2025-01-01' },
            { client: 'Alessandro Paleira', caseNumber: 'AH-ALES-2025-B', caseType: 'Trânsito Judicial', phase: 'Petição Inicial', status: 'Aguardando', deadline: '2025-01-01' },
            { client: 'Alessandro Paleira', caseNumber: 'AH-ALES-2025-C', caseType: 'Trânsito Judicial', phase: 'Petição Inicial', status: 'Aguardando', deadline: '2025-01-01' },
            { client: 'Diana Casaeiro', caseNumber: 'MB-DIAN-2025-A', caseType: 'Trânsito Administrativo', phase: 'Recurso à JARI', status: 'Aguardando', deadline: '2025-01-01' },
            { client: 'Diana Casaeiro', caseNumber: 'MB-DIAN-2025-B', caseType: 'Trânsito Administrativo', phase: 'Recurso ao CETRAN', status: 'Protocolado', deadline: '2025-01-01' },
            { client: 'Wandrelly Gomes de Areia', caseNumber: 'WLL-WAND-2025', caseType: 'Trânsito Administrativo', phase: 'Recurso ao CETRAN', status: 'Protocolado', deadline: '2025-01-20' },
            { client: 'Ligia Moneda', caseNumber: 'LF-LIGI-2025-A', caseType: 'Trânsito Judicial', phase: 'Petição Inicial', status: 'Protocolado', deadline: '2025-01-21' },
            { client: 'Ligia Moneda', caseNumber: 'LF-LIGI-2025-B', caseType: 'Trânsito Administrativo', phase: 'Defesa de Autuação', status: 'Protocolado', deadline: '2025-01-30' },
            { client: 'Renato Alexandre', caseNumber: 'RA-RENA-2025', caseType: 'Trânsito Administrativo', phase: 'Defesa de Autuação', status: 'Protocolado', deadline: '2025-01-30' },
            { client: 'Vitória Aragão', caseNumber: 'VA-VITO-2025-A', caseType: 'Trânsito Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Protocolado', deadline: '2025-01-30' },
            { client: 'Vitória Aragão', caseNumber: 'VA-VITO-2025-B', caseType: 'Trânsito Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Protocolado', deadline: '2025-01-30' },
            { client: 'Jusara', caseNumber: 'JO-JUSA-2026-A', caseType: 'Trânsito Judicial', phase: 'Petição Inicial', status: 'Protocolado', deadline: '2026-01-31' },
            { client: 'Jusara', caseNumber: 'JO-JUSA-2026-B', caseType: 'Trânsito Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Protocolado', deadline: '2026-02-01' },
            { client: 'Paola', caseNumber: 'PA-PAOL-2026', caseType: 'Trâns Administrativo', phase: 'Defesa de Autuação', status: 'Protocolado', deadline: '2026-02-01' },
            // Arquivados
            { client: 'Doria Casaeiro', caseNumber: 'GE-DORI-2020', caseType: 'Trânsito Administrativo', phase: 'Defesa de Autuação', status: 'Arquivado', deadline: '2020-07-04' },
            { client: 'João Caçapão', caseNumber: 'JM-JOAO-2020', caseType: 'Trânsito Judicial', phase: 'Petição Inicial', status: 'Arquivado', deadline: '2020-07-05' },
            { client: 'Baldrs', caseNumber: 'SA-BALD-2020', caseType: 'Trânsito Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', deadline: '2020-12-14' },
            { client: 'Marcos Vinícius Breve', caseNumber: 'MA-MARC-2020', caseType: 'Trânsito Judicial', phase: 'Petição Inicial', status: 'Arquivado', deadline: '2020-12-14' },
            { client: 'Renato', caseNumber: 'RE-RENA-2020', caseType: 'Trânsito Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', deadline: '2020-12-14' },
            { client: 'Joaquin Valetu', caseNumber: 'JV-JOAQ-2020-A', caseType: 'Trânsito Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', deadline: '2020-12-14' },
            { client: 'Joaquin Valetu', caseNumber: 'JV-JOAQ-2020-B', caseType: 'Trânsito Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', deadline: '2020-12-14' },
            { client: 'Joaquin Valetu', caseNumber: 'JV-JOAQ-2020-C', caseType: 'Trânsito Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', deadline: '2020-12-14' },
            { client: 'Joaquin Valetu', caseNumber: 'JV-JOAQ-2020-D', caseType: 'Trânsito Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', deadline: '2020-12-14' },
            { client: 'Joaquin Valetu', caseNumber: 'JV-JOAQ-2020-E', caseType: 'Trânsito Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', deadline: '2020-12-14' },
            { client: 'LaMonte', caseNumber: 'LA-LAMO-2020', caseType: 'Trânsito Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', deadline: '2020-12-14' },
            { client: 'Celes', caseNumber: 'CS-CELE-2020', caseType: 'Trânsito Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', deadline: '2020-12-14' },
            { client: 'Renato', caseNumber: 'RE-RENA-2020-B', caseType: 'Trânsito Administrativo', phase: 'Recurso à JARI', status: 'Arquivado', deadline: '2020-12-14' },
            { client: 'Henreges', caseNumber: 'GE-HENR-2020', caseType: 'Trânsito Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Arquivado', deadline: '2020-12-14' },
            { client: 'SH ampar', caseNumber: 'SH-SHAP-2020', caseType: 'Trânsito Administrativo', phase: 'Recurso ao Colegiado da JARI', status: 'Arquivado', deadline: '2020-12-14' },
            { client: 'Joaquin Valetu', caseNumber: 'JV-JOAQ-2020-F', caseType: 'Trânsito Administrativo', phase: 'Recurso ao CETRAN', status: 'Arquivado', deadline: '2020-12-14' }
        ];

        const clientIds = {};
        let clientsInserted = 0;

        // FASE 1: Inserir clientes vinculados à Dra. Carolina
        for (const clientData of clientsData) {
            const result = await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO clients (name, phone, cpf, email, notes, user_id, partnership_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        clientData.name,
                        clientData.phone,
                        clientData.cpf,
                        clientData.email,
                        'Cliente da Dra. Carolina Fortes - Parceria AVADA',
                        carolinaId, // VINCULANDO À CAROLINA
                        'AVADA'
                    ],
                    function (err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            clientIds[clientData.name] = result;
            clientsInserted++;
            console.log(`✅ Cliente cadastrado: ${clientData.name} (ID: ${result}, Advogada: Carolina)`);
        }

        // FASE 2: Inserir processos
        let processesInserted = 0;
        for (const processData of processesData) {
            const clientId = clientIds[processData.client];

            if (!clientId) {
                console.error(`❌ Cliente não encontrado: ${processData.client}`);
                continue;
            }

            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO processes (
                        client_id, 
                        case_number,
                        type,
                        process_category,
                        phase,
                        status,
                        deadline,
                        partnership_type
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        clientId,
                        processData.caseNumber,
                        processData.caseType,
                        processData.caseType,
                        processData.phase,
                        processData.status,
                        processData.deadline,
                        'AVADA'
                    ],
                    function (err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            processesInserted++;
            console.log(`✅ Processo cadastrado: ${processData.caseNumber} - ${processData.client}`);
        }

        res.json({
            success: true,
            message: 'Importação concluída com sucesso!',
            summary: {
                lawyerId: carolinaId,
                lawyerName: 'Dra. Carolina Fortes',
                clientsInserted,
                processesInserted,
                totalExpected: {
                    clients: clientsData.length,
                    processes: processesData.length
                }
            }
        });

        console.log('🎉 IMPORTAÇÃO CONCLUÍDA - Todos os dados vinculados à Dra. Carolina!');

    } catch (error) {
        console.error('❌ Erro durante importação:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
