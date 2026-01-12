const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate } = require('../middleware/authMiddleware');

// Get all clients (filtered by user for lawyers)
router.get('/', authenticate, (req, res) => {
    let query = 'SELECT * FROM clients';
    let params = [];

    // Lawyers can only see their own clients
    if (req.user.role === 'lawyer') {
        query += ' WHERE user_id = ?';
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
    const { name, email, phone, cpf, address, notes } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }

    const user_id = req.user.role === 'lawyer' ? req.user.id : req.body.user_id || null;

    db.run(
        'INSERT INTO clients (name, email, phone, cpf, address, user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, phone, cpf, address, user_id, notes],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criar cliente' });
            }

            res.status(201).json({
                id: this.lastID,
                name,
                email,
                phone,
                cpf,
                address,
                user_id,
                notes
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

module.exports = router;
