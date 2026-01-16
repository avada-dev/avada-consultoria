const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate } = require('../middleware/authMiddleware');

// Get all clients (filtered by user for lawyers, by partnership for admin)
router.get('/', authenticate, (req, res) => {
    let query = 'SELECT * FROM clients WHERE 1=1';
    let params = [];

    // Admin AVADA sees only AVADA partnership clients
    if (req.user.role === 'admin') {
        query += ' AND partnership_type = ?';
        params.push('AVADA');
    }
    // Lawyers can only see their own clients
    else if (req.user.role === 'lawyer') {
        query += ' AND user_id = ?';
        params.push(req.user.id);
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, clients) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar clientes' });
        }
        res.json(clients);
    });
});

// Get single client
router.get('/:id', authenticate, (req, res) => {
    db.get('SELECT * FROM clients WHERE id = ?', [req.params.id], (err, client) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar cliente' });
        }

        if (!client) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        // Check authorization
        if (req.user.role === 'lawyer' && client.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        res.json(client);
    });
});

// Create new client
router.post('/', authenticate, (req, res) => {
    const { name, email, phone, cpf, address, notes, partnership_type } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }

    const user_id = req.user.role === 'lawyer' ? req.user.id : req.body.user_id || null;
    const partnershipType = partnership_type || 'AVADA'; // Default AVADA

    db.run(
        'INSERT INTO clients (name, email, phone, cpf, address, user_id, notes, partnership_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, phone, cpf, address, user_id, notes, partnershipType],
        function (err) {
            if (err) {
                console.error('Erro ao criar cliente:', err);
                return res.status(500).json({ error: 'Erro ao criar cliente: ' + err.message });
            }

            res.status(201).json({
                id: this.lastID,
                name,
                email,
                phone,
                cpf,
                address,
                user_id,
                notes,
                partnership_type: partnershipType
            });
        }
    );
});

// Update client
router.put('/:id', authenticate, (req, res) => {
    const { name, email, phone, cpf, address, notes } = req.body;

    // Check if client exists and user has permission
    db.get('SELECT * FROM clients WHERE id = ?', [req.params.id], (err, client) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar cliente' });
        }

        if (!client) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        if (req.user.role === 'lawyer' && client.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        db.run(
            'UPDATE clients SET name = ?, email = ?, phone = ?, cpf = ?, address = ?, notes = ? WHERE id = ?',
            [name, email, phone, cpf, address, notes, req.params.id],
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao atualizar cliente' });
                }
                res.json({ message: 'Cliente atualizado com sucesso' });
            }
        );
    });
});

// Delete client
router.delete('/:id', authenticate, (req, res) => {
    db.get('SELECT * FROM clients WHERE id = ?', [req.params.id], (err, client) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar cliente' });
        }

        if (!client) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        if (req.user.role === 'lawyer' && client.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        db.run('DELETE FROM clients WHERE id = ?', [req.params.id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao deletar cliente' });
            }
            res.json({ message: 'Cliente deletado com sucesso' });
        });
    });
});

// Archive/Unarchive client
router.patch('/:id/archive', authenticate, (req, res) => {
    const { id } = req.params;
    const { archived } = req.body; // 1 = archived, 0 = active

    db.get('SELECT * FROM clients WHERE id = ?', [id], (err, client) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar cliente' });
        }

        if (!client) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        if (req.user.role === 'lawyer' && client.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        db.run(
            'UPDATE clients SET archived = ? WHERE id = ?',
            [archived ? 1 : 0, id],
            function (err) {
                if (err) {
                    console.error('Error archiving client:', err);
                    return res.status(500).json({ error: 'Failed to archive client' });
                }

                res.json({
                    success: true,
                    message: archived ? 'Cliente arquivado com sucesso' : 'Cliente desarquivado com sucesso'
                });
            }
        );
    });
});

// ==========================================
// FULL CLIENT FOLDER - Pasta Completa
// ==========================================

// Get client details with ALL processes and attachments
router.get('/:id/full', authenticate, (req, res) => {
    const clientId = req.params.id;

    // Get client
    db.get('SELECT * FROM clients WHERE id = ?', [clientId], (err, client) => {
        if (err || !client) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        // Check permission
        if (req.user.role === 'lawyer' && client.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Get lawyer info  
        db.get('SELECT id, name, email, oab FROM users WHERE id = ?', [client.user_id], (err, lawyer) => {

            // Get all processes of client
            const processQuery = `
                SELECT p.*
                FROM processes p
                WHERE p.client_id = ?
                ORDER BY p.created_at DESC
            `;

            db.all(processQuery, [clientId], (err, processes) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao buscar processos' });
                }

                // Get attachments for each process
                let processesCompleted = 0;
                const totalProcesses = processes.length;

                if (totalProcesses === 0) {
                    return res.json({
                        client,
                        lawyer,
                        processes: [],
                        stats: {
                            totalProcesses: 0,
                            activeProcesses: 0,
                            concludedProcesses: 0,
                            archivedProcesses: 0
                        }
                    });
                }

                processes.forEach(process => {
                    db.all('SELECT * FROM attachments WHERE process_id = ? ORDER BY created_at DESC', [process.id], (err, attachments) => {
                        process.attachments = attachments || [];
                        processesCompleted++;

                        if (processesCompleted === totalProcesses) {
                            // All processes loaded, send response
                            res.json({
                                client,
                                lawyer,
                                processes,
                                stats: {
                                    totalProcesses: processes.length,
                                    activeProcesses: processes.filter(p => p.status === 'Em Andamento').length,
                                    concludedProcesses: processes.filter(p => p.status === 'Concluído').length,
                                    archivedProcesses: processes.filter(p => p.status === 'Arquivado').length
                                }
                            });
                        }
                    });
                });
            });
        });
    });
});

module.exports = router;
