const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticate } = require('../middleware/authMiddleware');
require('dotenv').config();

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro no servidor' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verify password
        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                oab: user.oab
            }
        });
    });
});

// Get current user
router.get('/me', authenticate, (req, res) => {
    db.get('SELECT id, email, name, role, phone, oab FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        res.json(user);
    });
});

// Change password (authenticated users only)
router.post('/change-password', authenticate, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Senhas são obrigatórias' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    // Get user
    db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Senha atual incorreta' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        db.run('UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId],
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao atualizar senha' });
                }
                res.json({ message: 'Senha alterada com sucesso' });
            }
        );
    });
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logout realizado com sucesso' });
});

module.exports = router;
