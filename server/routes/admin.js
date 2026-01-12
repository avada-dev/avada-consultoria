const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// Get system information (admin only)
router.get('/system-info', authenticate, adminOnly, (req, res) => {
    // Get all users
    db.all('SELECT id, email, name, role, phone, oab, created_at FROM users ORDER BY created_at DESC', [], (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuários' });
        }

        // Get statistics
        db.get('SELECT COUNT(*) as total FROM clients', [], (err, clientCount) => {
            db.get('SELECT COUNT(*) as total FROM processes', [], (err, processCount) => {
                db.get('SELECT COUNT(*) as total FROM users WHERE role = "lawyer"', [], (err, lawyerCount) => {
                    res.json({
                        users: users,
                        statistics: {
                            totalClients: clientCount.total,
                            totalProcesses: processCount.total,
                            totalLawyers: lawyerCount.total,
                            totalUsers: users.length
                        },
                        systemInfo: {
                            defaultPassword: 'advogado2024',
                            jwtExpiration: '24h',
                            databaseType: 'SQLite'
                        }
                    });
                });
            });
        });
    });
});

// Get all users (admin only)
router.get('/users', authenticate, adminOnly, (req, res) => {
    db.all('SELECT id, email, name, role, phone, oab, created_at FROM users ORDER BY created_at DESC', [], (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuários' });
        }
        res.json(users);
    });
});

// Create new user (admin only)
router.post('/users', authenticate, adminOnly, (req, res) => {
    const { email, password, name, role, phone, oab } = req.body;

    if (!email || !password || !name || !role) {
        return res.status(400).json({ error: 'Email, senha, nome e perfil são obrigatórios' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
        'INSERT INTO users (email, password, name, role, phone, oab) VALUES (?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, name, role, phone, oab],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Email já cadastrado' });
                }
                return res.status(500).json({ error: 'Erro ao criar usuário' });
            }

            res.status(201).json({
                id: this.lastID,
                email,
                name,
                role,
                phone,
                oab
            });
        }
    );
});

// Update user (admin only)
router.put('/users/:id', authenticate, adminOnly, (req, res) => {
    const { email, name, role, phone, oab, password } = req.body;

    let query = 'UPDATE users SET email = ?, name = ?, role = ?, phone = ?, oab = ?';
    let params = [email, name, role, phone, oab];

    // Update password if provided
    if (password) {
        query += ', password = ?';
        params.push(bcrypt.hashSync(password, 10));
    }

    query += ' WHERE id = ?';
    params.push(req.params.id);

    db.run(query, params, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar usuário' });
        }
        res.json({ message: 'Usuário atualizado com sucesso' });
    });
});

// Delete user (admin only)
router.delete('/users/:id', authenticate, adminOnly, (req, res) => {
    // Prevent deleting own account
    if (parseInt(req.params.id) === req.user.id) {
        return res.status(400).json({ error: 'Não é possível deletar sua própria conta' });
    }

    db.run('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar usuário' });
        }
        res.json({ message: 'Usuário deletado com sucesso' });
    });
});

module.exports = router;
