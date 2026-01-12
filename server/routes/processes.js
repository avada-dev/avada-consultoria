const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate } = require('../middleware/authMiddleware');

// Get all processes (filtered by user for lawyers)
router.get('/', authenticate, (req, res) => {
    let query = `
    SELECT p.*, c.name as client_name, c.phone as client_phone 
    FROM processes p 
    JOIN clients c ON p.client_id = c.id
  `;
    let params = [];

    // Lawyers can only see processes of their clients
    if (req.user.role === 'lawyer') {
        query += ' WHERE c.user_id = ?';
        params.push(req.user.id);
    }

    query += ' ORDER BY p.created_at DESC';

    db.all(query, params, (err, processes) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar processos' });
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
    const { client_id, case_number, type, status, description, deadline } = req.body;

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
            'INSERT INTO processes (client_id, case_number, type, status, description, deadline) VALUES (?, ?, ?, ?, ?, ?)',
            [client_id, case_number, type, status || 'Em Andamento', description, deadline],
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
                    deadline
                });
            }
        );
    }
});

// Update process
router.put('/:id', authenticate, (req, res) => {
    const { case_number, type, status, description, deadline } = req.body;

    db.run(
        'UPDATE processes SET case_number = ?, type = ?, status = ?, description = ?, deadline = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [case_number, type, status, description, deadline, req.params.id],
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

module.exports = router;
