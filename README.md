# 🚗 AVADA Consultoria de Trânsito - Fullstack Application

Sistema completo de website institucional e CRM para a AVADA Consultoria de Trânsito, especializada em assessoria técnica para advogados e profissionais do Direito de Trânsito.

## 📋 Visão Geral

Este projeto consiste em:

### Website Institucional (4 Páginas)
- **Home** (`index.html`) - Apresentação da empresa com animações, contadores e carrossel de depoimentos
- **Serviços** (`servicos.html`) - Detalhamento completo dos 4 serviços principais
- **Sobre** (`sobre.html`) - História da empresa, equipe e certificações
- **Contato** (`contato.html`) - Formulários, informações de contato e FAQ interativo

### CRM Profissional
- Sistema de gestão de clientes e processos
- Autenticação JWT com controle de acesso baseado em perfis (Admin/Advogado)
- Dashboard com estatísticas em tempo real
- Painel administrativo exclusivo para visualizar informações do sistema

## 🛠️ Tecnologias Utilizadas

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Tailwind CSS (via CDN)
- Anime.js - Animações suaves
- Typed.js - Efeito de digitação
- Splide.js - Carrossel de depoimentos
- Font Awesome - Ícones

### Backend
- Node.js + Express.js
- SQLite3 - Banco de dados
- JWT - Autenticação
- bcryptjs - Hash de senhas
- CORS - Segurança

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Passos

1. **Clone/Navegue até o diretório do projeto**
```bash
cd "C:\Users\Anderson Victor\.gemini\antigravity\scratch\avada-consultoria"
```

2. **Instale as dependências**
```bash
npm install
```

3. **Inicie o servidor**
```bash
npm start
```

4. **Acesse a aplicação**
- Website: http://localhost:3000/
- CRM: http://localhost:3000/crm.html

## 🔐 Credenciais de Acesso

### Administrador
- **Email:** victorvitrine02@gmail.com
- **Senha:** avada2024
- **Permissões:** Acesso total ao sistema, incluindo informações do sistema e gerenciamento de usuários

### Advogados (Senha padrão: `advogado2024`)

**Dr. Floriano Teodoro**
- **Email:** florianoteodoro.advogado@hotmail.com
- **OAB/SP:** 144811

**Dra. Carolina Fortes**
- **Email:** carolinafortesadvocacia@gmail.com
- **OAB/MG:** 144.551

**Dr. Ricardo Machado**
- **Email:** ricardomachadocunhaadv@gmail.com
- **OAB/SP:** 428.536

## 📁 Estrutura do Projeto

```
avada-consultoria/
├── public/
│   ├── css/
│   │   ├── style.css          # Design system principal
│   │   └── crm-style.css      # Estilos do CRM
│   ├── js/
│   │   ├── main.js            # JavaScript do website
│   │   └── crm-app.js         # Aplicação CRM
│   ├── images/
│   ├── index.html             # Página inicial
│   ├── servicos.html          # Página de serviços
│   ├── sobre.html             # Página sobre
│   ├── contato.html           # Página de contato
│   └── crm.html               # Sistema CRM
├── server/
│   ├── routes/
│   │   ├── auth.js            # Rotas de autenticação
│   │   ├── clients.js         # Rotas de clientes
│   │   ├── processes.js       # Rotas de processos
│   │   └── admin.js           # Rotas administrativas
│   ├── middleware/
│   │   └── authMiddleware.js  # Middleware de autenticação
│   ├── database.js            # Configuração do banco
│   ├── database.sqlite        # Banco de dados (gerado)
│   └── server.js              # Servidor principal
├── .env                       # Variáveis de ambiente
├── .gitignore
├── package.json
└── README.md
```

## 🎨 Características do Website

### Design Premium
- Paleta de cores profissional (azul marinho #1e3a8a e dourado #d97706)
- Tipografia customizada (Quattrocento Sans, Oranienbaum, Sorts Mill Goudy)
- Animações suaves com Anime.js
- Responsivo para todos os dispositivos

### Funcionalidades Interativas
- Efeito de digitação automática nos títulos
- Contadores animados de estatísticas
- Carrossel de depoimentos
- FAQ com accordion
- Formulários integrados com WhatsApp

### SEO Otimizado
- Meta tags completas
- Estrutura semântica HTML5
- URLs amigáveis
- Performance otimizada

## 🔒 Segurança do CRM

### Autenticação
- Login seguro com JWT tokens
- Senha criptografada com bcrypt
- Tokens com expiração de 24h
- Validação em todas as rotas

### Controle de Acesso
- **Administrador**
  - Acesso completo ao sistema
  - Visualização de informações do sistema
  - Gerenciamento de usuários
  - Visualização de todos os clientes e processos

- **Advogado**
  - Acesso apenas aos próprios clientes
  - Gerenciamento de processos dos clientes
  - Dashboard personalizado
  - SEM acesso a informações administrativas

### Proteção de Dados
- Middleware de autenticação em todas as rotas API
- Validação de perfil de usuário
- Tela de login limpa (sem credenciais visíveis)
- Informações sensíveis apenas para administradores

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login do usuário
- `GET /api/auth/me` - Obter usuário atual
- `POST /api/auth/logout` - Logout

### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Criar cliente
- `PUT /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Excluir cliente

### Processos
- `GET /api/processes` - Listar processos
- `POST /api/processes` - Criar processo
- `PUT /api/processes/:id` - Atualizar processo
- `DELETE /api/processes/:id` - Excluir processo

### Administrativo (Apenas Admin)
- `GET /api/admin/system-info` - Informações do sistema
- `GET /api/admin/users` - Listar usuários
- `POST /api/admin/users` - Criar usuário
- `PUT /api/admin/users/:id` - Atualizar usuário
- `DELETE /api/admin/users/:id` - Excluir usuário

## 📞 Informações de Contato

### AVADA Consultoria
- **Localização:** Fortaleza-CE
- **Telefone:** (85) 99615-0912
- **WhatsApp:** (13) 98185-4881
- **Email:** victorvitrine02@gmail.com
- **Email Alternativo:** avada.geradordepeticoes@gmail.com
- **Instagram:** [@avada_transito.ai](https://www.instagram.com/avada_transito.ai/)
- **Horário:** Segunda a Sexta, 10h às 18h

## 🚀 Desenvolvimento e Deployment

### Ambiente de Desenvolvimento
```bash
npm start
```
O servidor será iniciado em http://localhost:3000

### Ambiente de Produção
Para produção, recomenda-se:
1. Usar PostgreSQL ou MySQL ao invés de SQLite
2. Configurar HTTPS
3. Usar variáveis de ambiente seguras
4. Implementar rate limiting
5. Configurar logs de auditoria

## 🐛 Troubleshooting

### Erro ao conectar ao servidor
- Verifique se o Node.js está instalado
- Certifique-se de que a porta 3000 está disponível
- Execute `npm install` novamente

### Banco de dados não inicializa
- Delete o arquivo `server/database.sqlite`
- Reinicie o servidor (ele criará um novo banco)

### Login não funciona
- Verifique as credenciais
- Limpe o localStorage do navegador
- Verifique se o servidor está rodando

## 📄 Licença

© 2026 AVADA Consultoria de Trânsito. Todos os direitos reservados.

## 👨‍💻 Suporte

Para suporte técnico ou dúvidas sobre o sistema:
- WhatsApp: (13) 98185-4881
- Email: victorvitrine02@gmail.com

---

**Desenvolvido com ❤️ para a AVADA Consultoria de Trânsito**
