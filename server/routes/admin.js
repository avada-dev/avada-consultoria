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
    const userId = req.params.id;

    db.run('DELETE FROM users WHERE id = ? AND role != "admin"', [userId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar usuário' });
        }

        if (this.changes === 0) {
            return res.status(400).json({ error: 'Não é possível deletar administradores' });
        }

        res.json({ message: 'Usuário deletado com sucesso' });
    });
});

// Get all clients (from all lawyers)
router.get('/all-clients', authenticate, adminOnly, (req, res) => {
    const query = `
        SELECT 
            clients.*,
            users.name as lawyer_name,
            users.email as lawyer_email
        FROM clients
        LEFT JOIN users ON clients.user_id = users.id
        ORDER BY clients.created_at DESC
    `;

    db.all(query, [], (err, clients) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar clientes' });
        }
        res.json(clients);
    });
});

// Get all processes (from all lawyers)
router.get('/all-processes', authenticate, adminOnly, (req, res) => {
    const query = `
        SELECT 
            processes.*,
            clients.name as client_name,
            users.name as lawyer_name,
            users.email as lawyer_email
        FROM processes
        JOIN clients ON processes.client_id = clients.id
        LEFT JOIN users ON clients.user_id = users.id
        ORDER BY processes.deadline ASC
    `;

    db.all(query, [], (err, processes) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar processos' });
        }
        res.json(processes);
    });
});

// Get lawyer overview (clients, processes, stats)
router.get('/lawyers/:id/overview', authenticate, adminOnly, (req, res) => {
    const lawyerId = req.params.id;

    // Get lawyer info
    db.get('SELECT id, name, email, phone, oab, role FROM users WHERE id = ?', [lawyerId], (err, lawyer) => {
        if (err || !lawyer) {
            return res.status(404).json({ error: 'Advogado não encontrado' });
        }

        // Get clients
        db.all('SELECT * FROM clients WHERE user_id = ? ORDER BY created_at DESC', [lawyerId], (err, clients) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar clientes' });
            }

            // Get processes
            const processQuery = `
                SELECT 
                    processes.*,
                    clients.name as client_name
                FROM processes
                JOIN clients ON processes.client_id = clients.id
                WHERE clients.user_id = ?
                ORDER BY processes.deadline ASC
            `;

            db.all(processQuery, [lawyerId], (err, processes) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao buscar processos' });
                }

                // Calculate stats
                const stats = {
                    totalClients: clients.length,
                    totalProcesses: processes.length,
                    activeProcesses: processes.filter(p => p.status === 'Em Andamento').length,
                    concludedProcesses: processes.filter(p => p.status === 'Concluído').length,
                    urgentProcesses: processes.filter(p => {
                        if (!p.deadline) return false;
                        const days = Math.ceil((new Date(p.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                        return days >= 0 && days <= 7;
                    }).length
                };

                res.json({
                    lawyer,
                    clients,
                    processes,
                    stats
                });
            });
        });
    });
});

// ========================================================================
// EMERGENCY PASSWORD RESET - Público (sem autenticação)
// Resetar todas as senhas para os padrões conhecidos
// ========================================================================
router.post('/emergency-password-reset', (req, res) => {
    console.log('🚨 EMERGENCY PASSWORD RESET INICIADO');

    const defaultUsers = [
        { email: 'victorvitrine02@gmail.com', password: 'avada2024', name: 'AVADA', role: 'admin' },
        { email: 'florianoteodoro.advogado@hotmail.com', password: 'advogado2024', name: 'Dr. Floriano Aparecido Teodoro', role: 'lawyer' },
        { email: 'carolinafortesadvocacia@gmail.com', password: 'advogado2024', name: 'Dra. Carolina Fortes', role: 'lawyer' },
        { email: 'ricardomachadocunhaadv@gmail.com', password: 'advogado2024', name: 'Dr. Ricardo Machado', role: 'lawyer' },
        { email: 'joadnoribeiro@gmail.com', password: 'advogado2024', name: 'Dr. Joadno de Deus Ribeiro', role: 'lawyer' }
    ];

    let updated = 0;
    let created = 0;
    const results = [];

    defaultUsers.forEach((user, index) => {
        const hash = bcrypt.hashSync(user.password, 10);

        db.get('SELECT id FROM users WHERE email = ?', [user.email], (err, existing) => {
            if (existing) {
                // Update existing
                db.run('UPDATE users SET password = ?, name = ?, role = ? WHERE id = ?',
                    [hash, user.name, user.role, existing.id],
                    (err) => {
                        if (!err) {
                            updated++;
                            results.push(`✅ ATUALIZADO: ${user.email} -> senha: ${user.password}`);
                        }
                        checkComplete();
                    }
                );
            } else {
                // Create new
                db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
                    [user.email, hash, user.name, user.role],
                    (err) => {
                        if (!err) {
                            created++;
                            results.push(`🆕 CRIADO: ${user.email} -> senha: ${user.password}`);
                        }
                        checkComplete();
                    }
                );
            }
        });
    });

    function checkComplete() {
        if (results.length === defaultUsers.length) {
            console.log('✅ EMERGENCY RESET COMPLETADO');
            console.log(`   Atualizados: ${updated}`);
            console.log(`   Criados: ${created}`);

            res.json({
                success: true,
                message: 'Senhas resetadas com sucesso!',
                updated,
                created,
                details: results,
                credentials: {
                    admin: { email: 'victorvitrine02@gmail.com', senha: 'avada2024' },
                    advogados: { senha: 'advogado2024' }
                }
            });
        }
    }
});

module.exports = router;
