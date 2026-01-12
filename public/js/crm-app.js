// ==========================================
// AVADA CRM - CLIENT APPLICATION
// ==========================================

const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let authToken = null;

// ==========================================
// AUTHENTICATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
});

function checkAuth() {
  const token = localStorage.getItem('authToken');
  if (token) {
    authToken = token;
    validateToken();
  } else {
    showLoginPage();
  }
}

async function validateToken() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      currentUser = await response.json();
      showDashboard();
    } else {
      localStorage.removeItem('authToken');
      showLoginPage();
    }
  } catch (error) {
    console.error('Error validating token:', error);
    showLoginPage();
  }
}

function setupEventListeners() {
  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', handleLogin);

  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', handleLogout);

  // Menu items
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  const btnText = document.getElementById('login-btn-text');
  const loading = document.getElementById('login-loading');

  // Show loading
  btnText.classList.add('hidden');
  loading.classList.remove('hidden');
  errorDiv.classList.remove('show');

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('authToken', authToken);
      showDashboard();
    } else {
      errorDiv.textContent = data.error || 'Credenciais inválidas';
      errorDiv.classList.add('show');
    }
  } catch (error) {
    errorDiv.textContent = 'Erro ao conectar ao servidor';
    errorDiv.classList.add('show');
  } finally {
    btnText.classList.remove('hidden');
    loading.classList.add('hidden');
  }
}

function handleLogout() {
  localStorage.removeItem('authToken');
  authToken = null;
  currentUser = null;
  showLoginPage();
}

function showLoginPage() {
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('dashboard-page').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('dashboard-page').classList.remove('hidden');

  // Update user info
  document.getElementById('user-name').textContent = currentUser.name;
  document.getElementById('user-role').textContent = currentUser.role === 'admin' ? 'Administrador' : 'Advogado';

  // Show/hide admin menu items
  const adminItems = document.querySelectorAll('.admin-only');
  if (currentUser.role === 'admin') {
    adminItems.forEach(item => item.classList.remove('hidden'));
  } else {
    adminItems.forEach(item => item.classList.add('hidden'));
  }

  // Load dashboard
  loadDashboard();
}

// ==========================================
// VIEW SWITCHING
// ==========================================

function switchView(view) {
  // Update active menu item
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

  // Load view content
  switch (view) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'clients':
      loadClients();
      break;
    case 'processes':
      loadProcesses();
      break;
    case 'system-info':
      loadSystemInfo();
      break;
    case 'users':
      loadUsers();
      break;
  }
}

// ==========================================
// DASHBOARD VIEW
// ==========================================

async function loadDashboard() {
  document.getElementById('page-title').textContent = 'Dashboard';

  try {
    const [clients, processes] = await Promise.all([
      fetchAPI('/clients'),
      fetchAPI('/processes')
    ]);

    const stats = {
      totalClients: clients.length,
      totalProcesses: processes.length,
      activeProcesses: processes.filter(p => p.status === 'Em Andamento').length,
      completedProcesses: processes.filter(p => p.status === 'Concluído').length
    };

    const html = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-value">${stats.totalClients}</div>
          <div class="stat-label">Total de Clientes</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon green">
            <i class="fas fa-folder-open"></i>
          </div>
          <div class="stat-value">${stats.totalProcesses}</div>
          <div class="stat-label">Total de Processos</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon orange">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-value">${stats.activeProcesses}</div>
          <div class="stat-label">Em Andamento</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon purple">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-value">${stats.completedProcesses}</div>
          <div class="stat-label">Concluídos</div>
        </div>
      </div>

      <div class="table-container mt-20">
        <div class="table-header">
          <h3 class="table-title">Processos Recentes</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nº do Caso</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${processes.slice(0, 5).map(p => `
              <tr>
                <td><strong>${p.case_number}</strong></td>
                <td>${p.client_name || 'N/A'}</td>
                <td>${p.type}</td>
                <td><span class="badge ${getStatusBadge(p.status)}">${p.status}</span></td>
                <td>${formatDate(p.created_at)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('content-area').innerHTML = html;
  } catch (error) {
    showError('Erro ao carregar dashboard');
  }
}

// ==========================================
// CLIENTS VIEW
// ==========================================

async function loadClients() {
  document.getElementById('page-title').textContent = 'Clientes';

  try {
    const clients = await fetchAPI('/clients');

    const html = `
      <div class="table-container">
        <div class="table-header">
          <h3 class="table-title">Lista de Clientes</h3>
          <button class="btn btn-primary" onclick="openClientModal()">
            <i class="fas fa-plus"></i> Novo Cliente
          </button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>CPF</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${clients.map(c => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.email || '-'}</td>
                <td>${c.phone}</td>
                <td>${c.cpf || '-'}</td>
                <td class="table-actions">
                  <button class="btn btn-sm btn-secondary" onclick='editClient(${JSON.stringify(c)})'>
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="deleteClient(${c.id})">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('content-area').innerHTML = html;
  } catch (error) {
    showError('Erro ao carregar clientes');
  }
}

function openClientModal(client = null) {
  const modal = document.getElementById('client-modal');
  const title = document.getElementById('client-modal-title');

  if (client) {
    title.textContent = 'Editar Cliente';
    document.getElementById('client-id').value = client.id;
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-email').value = client.email || '';
    document.getElementById('client-phone').value = client.phone;
    document.getElementById('client-cpf').value = client.cpf || '';
    document.getElementById('client-address').value = client.address || '';
    document.getElementById('client-notes').value = client.notes || '';
  } else {
    title.textContent = 'Novo Cliente';
    document.getElementById('client-form').reset();
    document.getElementById('client-id').value = '';
  }

  modal.classList.add('show');
}

function closeClientModal() {
  document.getElementById('client-modal').classList.remove('show');
  document.getElementById('client-form').reset();
}

function editClient(client) {
  openClientModal(client);
}

async function saveClient() {
  const id = document.getElementById('client-id').value;
  const data = {
    name: document.getElementById('client-name').value,
    email: document.getElementById('client-email').value,
    phone: document.getElementById('client-phone').value,
    cpf: document.getElementById('client-cpf').value,
    address: document.getElementById('client-address').value,
    notes: document.getElementById('client-notes').value
  };

  try {
    if (id) {
      await fetchAPI(`/clients/${id}`, 'PUT', data);
    } else {
      await fetchAPI('/clients', 'POST', data);
    }

    closeClientModal();
    loadClients();
  } catch (error) {
    alert('Erro ao salvar cliente');
  }
}

async function deleteClient(id) {
  if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

  try {
    await fetchAPI(`/clients/${id}`, 'DELETE');
    loadClients();
  } catch (error) {
    alert('Erro ao excluir cliente');
  }
}

// ==========================================
// PROCESSES VIEW
// ==========================================

async function loadProcesses() {
  document.getElementById('page-title').textContent = 'Processos';

  try {
    const [processes, clients] = await Promise.all([
      fetchAPI('/processes'),
      fetchAPI('/clients')
    ]);

    // Populate client select for modal
    const clientSelect = document.getElementById('process-client');
    clientSelect.innerHTML = '<option value="">Selecione...</option>' +
      clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    const html = `
      <div class="table-container">
        <div class="table-header">
          <h3 class="table-title">Lista de Processos</h3>
          <button class="btn btn-primary" onclick="openProcessModal()">
            <i class="fas fa-plus"></i> Novo Processo
          </button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nº do Caso</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Prazo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${processes.map(p => `
              <tr>
                <td><strong>${p.case_number}</strong></td>
                <td>${p.client_name || 'N/A'}</td>
                <td>${p.type}</td>
                <td><span class="badge ${getStatusBadge(p.status)}">${p.status}</span></td>
                <td>${p.deadline ? formatDate(p.deadline) : '-'}</td>
                <td class="table-actions">
                  <button class="btn btn-sm btn-secondary" onclick='editProcess(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="deleteProcess(${p.id})">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('content-area').innerHTML = html;
  } catch (error) {
    showError('Erro ao carregar processos');
  }
}

function openProcessModal(process = null) {
  const modal = document.getElementById('process-modal');
  const title = document.getElementById('process-modal-title');

  if (process) {
    title.textContent = 'Editar Processo';
    document.getElementById('process-id').value = process.id;
    document.getElementById('process-client').value = process.client_id;
    document.getElementById('process-case-number').value = process.case_number;
    document.getElementById('process-type').value = process.type;
    document.getElementById('process-phase').value = process.phase || '';
    document.getElementById('process-status').value = process.status;
    document.getElementById('process-description').value = process.description || '';
    document.getElementById('process-deadline').value = process.deadline || '';
  } else {
    title.textContent = 'Novo Processo';
    document.getElementById('process-form').reset();
    document.getElementById('process-id').value = '';
  }

  modal.classList.add('show');
}

function closeProcessModal() {
  document.getElementById('process-modal').classList.remove('show');
}

function editProcess(process) {
  openProcessModal(process);
}

async function saveProcess() {
  const id = document.getElementById('process-id').value;
  const data = {
    client_id: parseInt(document.getElementById('process-client').value),
    case_number: document.getElementById('process-case-number').value,
    type: document.getElementById('process-type').value,
    phase: document.getElementById('process-phase').value,
    status: document.getElementById('process-status').value,
    description: document.getElementById('process-description').value,
    deadline: document.getElementById('process-deadline').value
  };

  try {
    if (id) {
      await fetchAPI(`/processes/${id}`, 'PUT', data);
    } else {
      await fetchAPI('/processes', 'POST', data);
    }

    closeProcessModal();
    loadProcesses();
  } catch (error) {
    alert('Erro ao salvar processo');
  }
}

async function deleteProcess(id) {
  if (!confirm('Tem certeza que deseja excluir este processo?')) return;

  try {
    await fetchAPI(`/processes/${id}`, 'DELETE');
    loadProcesses();
  } catch (error) {
    alert('Erro ao excluir processo');
  }
}

// ==========================================
// SYSTEM INFO VIEW (ADMIN ONLY)
// ==========================================

async function loadSystemInfo() {
  if (currentUser.role !== 'admin') {
    showError('Acesso negado. Apenas administradores.');
    return;
  }

  document.getElementById('page-title').textContent = 'Informações do Sistema';

  try {
    const data = await fetchAPI('/admin/system-info');

    const html = `
      <div class="info-grid">
        <div class="info-card">
          <h3>
            <span class="info-card-icon">📊</span>
            Estatísticas do Sistema
          </h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${data.statistics.totalUsers}</div>
              <div class="stat-label">Total de Usuários</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.statistics.totalLawyers}</div>
              <div class="stat-label">Advogados</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.statistics.totalClients}</div>
              <div class="stat-label">Clientes</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.statistics.totalProcesses}</div>
              <div class="stat-label">Processos</div>
            </div>
          </div>
        </div>

        <div class="info-card">
          <h3>
            <span class="info-card-icon">👥</span>
            Usuários do Sistema
          </h3>
          <ul class="user-list">
            ${data.users.map(u => `
              <li class="user-item">
                <div class="user-item-name">${u.name}</div>
                <div class="user-item-email">${u.email}</div>
                <div class="user-item-role">
                  <span class="badge ${u.role === 'admin' ? 'badge-danger' : 'badge-info'}">
                    ${u.role === 'admin' ? 'Administrador' : 'Advogado'}
                  </span>
                  ${u.oab ? `<span class="badge badge-success">${u.oab}</span>` : ''}
                </div>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="info-card">
          <h3>
            <span class="info-card-icon">🔐</span>
            Informações de Segurança
          </h3>
          <div class="alert alert-info">
            <p><strong>Senha padrão para novos advogados:</strong> ${data.systemInfo.defaultPassword}</p>
            <p><strong>Expiração do Token:</strong> ${data.systemInfo.jwtExpiration}</p>
            <p><strong>Banco de Dados:</strong> ${data.systemInfo.databaseType}</p>
          </div>
          <div class="alert alert-warning">
            <p><strong>⚠️ Atenção:</strong> Estas informações são confidenciais e devem ser mantidas seguras. 
            Solicite que os usuários alterem a senha padrão no primeiro acesso.</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('content-area').innerHTML = html;
  } catch (error) {
    showError('Erro ao carregar informações do sistema');
  }
}

// ==========================================
// USERS VIEW (ADMIN ONLY)
// ==========================================

async function loadUsers() {
  if (currentUser.role !== 'admin') {
    showError('Acesso negado. Apenas administradores.');
    return;
  }

  document.getElementById('page-title').textContent = 'Gerenciar Usuários';

  const html = `
    <div class="info-card">
      <h3>Gerenciamento de Usuários</h3>
      <p>Funcionalidade de gerenciamento de usuários disponível via API.</p>
      <p>Use os endpoints em /api/admin/users para criar, editar e excluir usuários.</p>
    </div>
  `;

  document.getElementById('content-area').innerHTML = html;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

async function fetchAPI(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro na requisição');
  }

  return response.json();
}

function getStatusBadge(status) {
  const badges = {
    'Concluído': 'badge-success',
    'Em Andamento': 'badge-info',
    'Aguardando Documentos': 'badge-warning',
    'Arquivado': 'badge-danger'
  };
  return badges[status] || 'badge-info';
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function showError(message) {
  document.getElementById('content-area').innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <div class="empty-state-title">${message}</div>
    </div>
  `;
}

console.log('🚀 AVADA CRM - Application initialized');
