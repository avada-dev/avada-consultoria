const express = require('express');
const router = express.Router();
const db = require('../database');

// Dados da importação
const clientsData = [
    { name: 'Protildo', phone: '(85) 9XXXX-XXXX' },
    { name: 'TEAGLA', phone: '(85) 9XXXX-XXXX' },
    { name: 'THALIA', phone: '(85) 9XXXX-XXXX' },
    { name: 'Priscila', phone: '(85) 9XXXX-XXXX' },
    { name: 'Ediltom Borges', phone: '(85) 9XXXX-XXXX' },
    { name: 'Debra do Perpétuo Libra', phone: '(85) 9XXXX-XXXX' },
    { name: 'Luís Marcée Terto', phone: '(85) 9XXXX-XXXX' },
    { name: 'Alessandro Paleira', phone: '(85) 9XXXX-XXXX' },
    { name: 'Diana Casaeiro', phone: '(85) 9XXXX-XXXX' },
    { name: 'Wandrelly Gomes de Areia', phone: '(85) 9XXXX-XXXX' },
    { name: 'Ligia Moneda', phone: '(85) 9XXXX-XXXX' },
    { name: 'Renato Alexandre', phone: '(85) 9XXXX-XXXX' },
    { name: 'Vitória Aragão', phone: '(85) 9XXXX-XXXX' },
    { name: 'Jusara', phone: '(85) 9XXXX-XXXX' },
    { name: 'Paola', phone: '(85) 9XXXX-XXXX' },
    { name: 'Doria Casaeiro', phone: '(85) 9XXXX-XXXX' },
    { name: 'João Caçapão', phone: '(85) 9XXXX-XXXX' },
    { name: 'Baldrs', phone: '(85) 9XXXX-XXXX' },
    { name: 'Marcos Vinícius Breve', phone: '(85) 9XXXX-XXXX' },
    { name: 'Renato', phone: '(85) 9XXXX-XXXX' },
    { name: 'Joaquin Valetu', phone: '(85) 9XXXX-XXXX' },
    { name: 'LaMonte', phone: '(85) 9XXXX-XXXX' },
    { name: 'Celes', phone: '(85) 9XXXX-XXXX' },
    { name: 'Henreges', phone: '(85) 9XXXX-XXXX' },
    { name: 'SH ampar', phone: '(85) 9XXXX-XXXX' }
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

// POST /api/admin/import-caroline-data
router.post('/import-caroline-data', async (req, res) => {
    try {
        console.log('🔄 Iniciando importação dos dados da Dra. Caroline Fortes...');

        const clientIds = {};
        let clientsInserted = 0;
        let processesInserted = 0;

        // FASE 1: Inserir clientes
        for (const clientData of clientsData) {
            const result = await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO clients (name, phone, cpf, email, notes) VALUES (?, ?, ?, ?, ?)',
                    [
                        clientData.name,
                        clientData.phone,
                        '',
                        '',
                        'Cliente importado da planilha da Dra. Caroline Fortes - Parceria AVADA'
                    ],
                    function (err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            clientIds[clientData.name] = result;
            clientsInserted++;
            console.log(`✅ Cliente cadastrado: ${clientData.name} (ID: ${result})`);
        }

        // FASE 2: Inserir processos
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
                        process_number, 
                        case_type, 
                        status, 
                        partnership_type,
                        documents
                    ) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        clientId,
                        processData.caseNumber,
                        processData.caseType,
                        processData.status,
                        processData.partnership,
                        JSON.stringify({
                            phase: processData.phase,
                            deadline: processData.deadline,
                            imported_from: 'Planilha Dra. Caroline Fortes',
                            partnership: 'AVADA'
                        })
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
                clientsInserted,
                processesInserted,
                totalExpected: {
                    clients: clientsData.length,
                    processes: processesData.length
                }
            }
        });

        console.log('🎉 IMPORTAÇÃO CONCLUÍDA!');

    } catch (error) {
        console.error('❌ Erro durante importação:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
