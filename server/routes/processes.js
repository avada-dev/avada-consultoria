const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../config/upload');
const path = require('path');
const fs = require('fs');

// Get all processes (filtered by partnership for admin, by user for lawyers)
router.get('/', authenticate, (req, res) => {
    const includeArchived = req.query.archived === 'true';
    console.log('[DEBUG] ===== GET /processes =====');
    console.log('[DEBUG] Full query object:', JSON.stringify(req.query));
    console.log('[DEBUG] req.query.archived raw value:', req.query.archived);
    console.log('[DEBUG] typeof req.query.archived:', typeof req.query.archived);
    console.log('[DEBUG] includeArchived result:', includeArchived);
    console.log('[DEBUG] User role:', req.user.role);

    let query = `
    SELECT p.*, c.name as client_name, c.phone as client_phone, c.partnership_type, u.name as lawyer_name
    FROM processes p 
    JOIN clients c ON p.client_id = c.id
    LEFT JOIN users u ON c.user_id = u.id
    WHERE 1=1
  `;
    let params = [];

    // Filter archived processes
    if (!includeArchived) {
        query += ' AND p.status != ?';
        params.push('Arquivado');
        console.log('[DEBUG] Filter mode: EXCLUDE archived (showing active)');
    } else {
        // Only show archived
        query += ' AND p.status = ?';
        params.push('Arquivado');
        console.log('[DEBUG] Filter mode: SHOW ONLY archived');
    }

    // Admin AVADA sees only processes from AVADA clients
    if (req.user.role === 'admin') {
        query += ' AND c.partnership_type = ?';
        params.push('AVADA');
    }
    // Lawyers can only see processes of their clients
    else if (req.user.role === 'lawyer') {
        query += ' AND c.user_id = ?';
        params.push(req.user.id);
    }

    query += ' ORDER BY p.created_at DESC';

    console.log('[DEBUG] Final SQL query:', query);
    console.log('[DEBUG] SQL params:', params);

    db.all(query, params, (err, processes) => {
        if (err) {
            console.error('[ERROR] Database error:', err);
            return res.status(500).json({ error: 'Erro ao buscar processos' });
        }
        console.log('[DEBUG] Query returned', processes.length, 'processes');
        if (processes.length > 0) {
            console.log('[DEBUG] First process status:', processes[0].status);
            console.log('[DEBUG] Last process status:', processes[processes.length - 1].status);
        }
        res.json(processes);
    });
});

// Get single process
router.get('/:id', authenticate, (req, res) => {
    const query = `
    SELECT p.*, c.name as client_name, c.email as client_email, c.phone as client_phone 
    FROM processes p 
    JOIN clients c ON p.client_id = c.id 
    WHERE p.id = ?
  `;

    db.get(query, [req.params.id], (err, process) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar processo' });
        }

        if (!process) {
            return res.status(404).json({ error: 'Processo não encontrado' });
        }

        res.json(process);
    });
});

// Create new process
router.post('/', authenticate, (req, res) => {
    const { client_id, case_number, type, status, description, deadline, phase, city, state, traffic_agency, court } = req.body;

    if (!client_id || !case_number || !type) {
        return res.status(400).json({ error: 'Cliente, número do caso e tipo são obrigatórios' });
    }

    // Verify client belongs to user (for lawyers)
    if (req.user.role === 'lawyer') {
        db.get('SELECT * FROM clients WHERE id = ? AND user_id = ?', [client_id, req.user.id], (err, client) => {
            if (err || !client) {
                return res.status(403).json({ error: 'Cliente não encontrado ou acesso negado' });
            }
            createProcess();
        });
    } else {
        createProcess();
    }

    function createProcess() {
        db.run(
            `INSERT INTO processes (client_id, case_number, type, status, description, deadline, phase, city, state, traffic_agency, court) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [client_id, case_number, type, status || 'Em Andamento', description, deadline, phase, city, state, traffic_agency, court],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao criar processo' });
                }

                res.status(201).json({
                    id: this.lastID,
                    client_id,
                    case_number,
                    type,
                    status: status || 'Em Andamento',
                    description,
                    deadline,
                    phase,
                    city,
                    state,
                    traffic_agency,
                    court
                });
            }
        );
    }
});

// Update process
router.put('/:id', authenticate, (req, res) => {
    const { case_number, type, status, description, deadline, phase, city, state, traffic_agency, court } = req.body;

    db.run(
        `UPDATE processes 
         SET case_number = ?, type = ?, status = ?, description = ?, deadline = ?, phase = ?, city = ?, state = ?, traffic_agency = ?, court = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [case_number, type, status, description, deadline, phase, city, state, traffic_agency, court, req.params.id],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao atualizar processo' });
            }
            res.json({ message: 'Processo atualizado com sucesso' });
        }
    );
});

// Delete process
router.delete('/:id', authenticate, (req, res) => {
    db.run('DELETE FROM processes WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar processo' });
        }
        res.json({ message: 'Processo deletado com sucesso' });
    });
});

// Archive process (only updates status field)
router.patch('/:id/archive', authenticate, (req, res) => {
    db.run(
        `UPDATE processes SET status = 'Arquivado', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao arquivar processo' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Processo não encontrado' });
            }
            res.json({ message: 'Processo arquivado com sucesso' });
        }
    );
});

// Unarchive process (restore to 'Em Andamento')
router.patch('/:id/unarchive', authenticate, (req, res) => {
    db.run(
        `UPDATE processes SET status = 'Em Andamento', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao desarquivar processo' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Processo não encontrado' });
            }
            res.json({ message: 'Processo desarquivado com sucesso' });
        }
    );
});

// Get full process data (similar to /clients/:id/full)
router.get('/:id/full', authenticate, async (req, res) => {
    const processId = req.params.id;

    try {
        // Get process with client info
        const process = await new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, c.name as client_name, c.email as client_email, c.phone as client_phone,
                       c.cpf as client_cpf, c.address as client_address
                FROM processes p
                JOIN clients c ON p.client_id = c.id
                WHERE p.id = ?
            `;
            db.get(query, [processId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!process) {
            return res.status(404).json({ error: 'Processo não encontrado' });
        }

        // Get client full data
        const client = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM clients WHERE id = ?', [process.client_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Get lawyer
        const lawyer = await new Promise((resolve, reject) => {
            db.get('SELECT id, name, email, oab FROM users WHERE id = ?', [client?.user_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Get attachments
        const attachments = await new Promise((resolve, reject) => {
            const query = `
                SELECT a.*, u.name as uploaded_by_name
                FROM attachments a
                LEFT JOIN users u ON a.uploaded_by = u.id
                WHERE a.process_id = ?
                ORDER BY a.created_at DESC
            `;
            db.all(query, [processId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        res.json({
            process,
            client,
            lawyer,
            attachments,
            stats: {
                totalAttachments: attachments.length
            }
        });

    } catch (error) {
        console.error('Error fetching full process:', error);
        res.status(500).json({ error: 'Erro ao buscar processo completo' });
    }
});


// ==========================================
// ATTACHMENTS - Upload de Arquivos
// ==========================================

// Upload arquivo para processo
router.post('/:id/attachments', authenticate, upload.single('file'), (req, res) => {
    const processId = req.params.id;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Salvar no banco
    const query = `
        INSERT INTO attachments (process_id, filename, original_name, file_type, file_size, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [processId, file.filename, file.originalname, file.mimetype, file.size, req.user.id], function (err) {
        if (err) {
            // Deletar arquivo se falhar no banco
            fs.unlink(file.path, () => { });
            return res.status(500).json({ error: 'Erro ao salvar arquivo' });
        }

        res.status(201).json({
            id: this.lastID,
            filename: file.filename,
            original_name: file.originalname,
            file_type: file.mimetype,
            file_size: file.size
        });
    });
});

// Listar anexos de um processo
router.get('/:id/attachments', authenticate, (req, res) => {
    const query = `
        SELECT a.*, u.name as uploaded_by_name 
        FROM attachments a
        LEFT JOIN users u ON a.uploaded_by = u.id
        WHERE a.process_id = ?
        ORDER BY a.created_at DESC
    `;

    db.all(query, [req.params.id], (err, attachments) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar anexos' });
        }
        res.json(attachments);
    });
});

// Download arquivo
router.get('/attachments/:id/download', authenticate, (req, res) => {
    db.get('SELECT * FROM attachments WHERE id = ?', [req.params.id], (err, attachment) => {
        if (err || !attachment) {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }

        const filePath = path.join(__dirname, '../../uploads', attachment.filename);

        // Verificar se arquivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
        }

        res.download(filePath, attachment.original_name);
    });
});

// Deletar arquivo
router.delete('/attachments/:id', authenticate, (req, res) => {
    db.get('SELECT * FROM attachments WHERE id = ?', [req.params.id], (err, attachment) => {
        if (err || !attachment) {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }

        // Deletar arquivo físico
        const filePath = path.join(__dirname, '../../uploads', attachment.filename);
        fs.unlink(filePath, (err) => {
            // Ignorar erro se arquivo não existir
        });

        // Deletar do banco
        db.run('DELETE FROM attachments WHERE id = ?', [req.params.id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao deletar arquivo' });
            }
            res.json({ message: 'Arquivo deletado com sucesso' });
        });
    });
});

// Calculate deadline
router.post('/calculate-deadline', authenticate, async (req, res) => {
    try {
        const { startDate, days, type, city, state } = req.body;
        const { calculateFatalDeadline } = require('../utils/deadline-calculator');

        if (!startDate || !days) {
            return res.status(400).json({ error: 'Data inicial e dias são obrigatórios' });
        }

        // Se for "Publicação", o prazo começa a contar no próximo dia útil
        // O utilitário calculateFatalDeadline já lida com a lógica de "começar no próximo dia útil"
        // baseada na data de publicação passada.

        // No entanto, se o tipo for "Notificação", geralmente conta do dia ou dia útil seguinte dependendo da regra.
        // O prompt diz: "Quando escolhido Data da Publicação, significa a data da publicação no Diário Oficial... deve acionar calculadora"

        // Vamos assumir que o utilitário já faz a lógica correta para "Publicação" (CPC).
        // Para "Notificação", se a regra for a mesma (CPC/CPP), usamos a mesma função.

        const result = await calculateFatalDeadline(startDate, parseInt(days), city, state);

        res.json(result);
    } catch (error) {
        console.error('Erro ao calcular prazo:', error);
        res.status(500).json({ error: 'Erro ao calcular prazo' });
    }
});

module.exports = router;
