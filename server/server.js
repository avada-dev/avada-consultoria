const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Initialize database
require('./database');

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/processes', require('./routes/processes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/import', require('./routes/import'));
app.use('/api/gemini', require('./routes/gemini'));

// Default route for SPA
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Rota não encontrada' });
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🚗 AVADA CONSULTORIA DE TRÂNSITO 🚗               ║
║                                                           ║
║  Servidor rodando em: http://localhost:${PORT}            ║
║                                                           ║
║  📄 Website: http://localhost:${PORT}/                     ║
║  🔐 CRM: http://localhost:${PORT}/crm.html                 ║
║                                                           ║
║  Credenciais de Admin:                                   ║
║  Email: victorvitrine02@gmail.com                        ║
║  Senha: avada2024                                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
