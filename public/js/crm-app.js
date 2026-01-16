// ==========================================
// AVADA CRM - CLIENT APPLICATION
// ==========================================

const API_URL = '/api';
let currentUser = null;
let authToken = null;
let currentProcessId = null; // State for attachments modal

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

  // Upload Form
  const uploadForm = document.getElementById('upload-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', handleUpload);
  }
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

  // Initialize Deadline Alerts
  if (typeof startDeadlineMonitoring === 'function') {
    startDeadlineMonitoring();
  } else {
    console.warn('Deadline alerts script not loaded');
  }
}

// ==========================================
// VIEW SWITCHING
// ==========================================

function switchView(view) {
  console.log('[DEBUG] switchView called with:', view);

  // Prevent if already loading
  if (window.isLoadingView) {
    console.log('[DEBUG] Already loading view, ignoring...');
    return;
  }
  window.isLoadingView = true;

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
      loadProcesses(false); // EXPLICITAMENTE FALSE
      break;
    case 'system-info':
      loadSystemInfo();
      break;
    case 'users':
      loadUsers();
      break;
    case 'archived':
      console.log('[DEBUG] Calling loadProcesses(true) for ARCHIVED');
      loadProcesses(true); // EXPLICITAMENTE TRUE
      break;
  }

  window.isLoadingView = false;
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

    // Categorizar processos por status para Kanban
    const kanbanColumns = {
      'Em Andamento': processes.filter(p => p.status === 'Em Andamento'),
      'Pendente': processes.filter(p => p.status === 'Pendente'),
      'Aguardando': processes.filter(p => p.status === 'Aguardando'),
      'Concluído': processes.filter(p => p.status === 'Concluído')
    };

    const html = `
      <!-- Stats Cards -->
      <div class="stats-grid" style="margin-bottom: 30px;">
        <div class="stat-card" onclick="switchView('clients')" style="cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
          <div class="stat-icon" style="background: rgba(255,255,255,0.2);">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-value" style="color: white;">${stats.totalClients}</div>
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Total de Clientes</div>
        </div>
        
        <div class="stat-card" onclick="switchView('processes')" style="cursor: pointer; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
          <div class="stat-icon" style="background: rgba(255,255,255,0.2);">
            <i class="fas fa-folder-open"></i>
          </div>
          <div class="stat-value" style="color: white;">${stats.totalProcesses}</div>
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Total de Processos</div>
        </div>
        
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;">
          <div class="stat-icon" style="background: rgba(255,255,255,0.2);">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-value" style="color: white;">${stats.activeProcesses}</div>
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Em Andamento</div>
        </div>
        
        <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white;">
          <div class="stat-icon" style="background: rgba(255,255,255,0.2);">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-value" style="color: white;">${stats.completedProcesses}</div>
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Concluídos</div>
        </div>
      </div>

      <!-- Kanban Board -->
      <div style="margin-top: 30px;">
        <h2 style="font-size: 1.5rem; font-weight: 600; color: #2d3748; margin-bottom: 20px;">
          <i class="fas fa-columns"></i> Processos por Status
        </h2>
        <div class="kanban-board">
          ${Object.keys(kanbanColumns).map(status => {
      const statusColors = {
        'Em Andamento': { bg: '#fff5f5', border: '#fc8181', badge: '#e53e3e' },
        'Pendente': { bg: '#fffaf0', border: '#f6ad55', badge: '#dd6b20' },
        'Aguardando': { bg: '#f0f9ff', border: '#63b3ed', badge: '#3182ce' },
        'Concluído': { bg: '#f0fff4', border: '#68d391', badge: '#38a169' }
      };
      const colors = statusColors[status];
      const processesInColumn = kanbanColumns[status];

      return `
              <div class="kanban-column" style="background: ${colors.bg}; border-top: 4px solid ${colors.border};">
                <div class="kanban-column-header" style="background: ${colors.border}; color: white; padding: 15px; border-radius: 8px 8px 0 0; margin: -1px -1px 15px -1px;">
                  <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0;">
                    ${status}
                    <span style="background: rgba(255,255,255,0.3); padding: 3px 10px; border-radius: 12px; font-size: 0.9rem; margin-left: 8px;">
                      ${processesInColumn.length}
                    </span>
                  </h3>
                </div>
                <div class="kanban-cards">
                  ${processesInColumn.length > 0 ? processesInColumn.map(p => `
                    <div class="kanban-card" onclick="viewFullProcess(${p.id})">
                      <div class="kanban-card-header">
                        <strong style="color: #2d3748; font-size: 1rem;">${p.case_number}</strong>
                        <span class="badge" style="background: ${colors.badge}; color: white; font-size: 0.75rem; padding: 3px 8px;">${status}</span>
                      </div>
                      <div class="kanban-card-body">
                        <p style="color: #4a5568; font-size: 0.9rem; margin: 8px 0;">
                          <i class="fas fa-user" style="color: #667eea;"></i> ${p.client_name || 'N/A'}
                        </p>
                        <p style="color: #718096; font-size: 0.85rem; margin: 5px 0;">
                          <i class="fas fa-briefcase"></i> ${p.type}
                        </p>
                        ${p.phase ? `<p style="color: #a0aec0; font-size: 0.8rem; margin: 5px 0;">
                          <i class="fas fa-layer-group"></i> ${p.phase}
                        </p>` : ''}
                      </div>
                      <div class="kanban-card-footer">
                        ${p.deadline ? `
                          <span style="color: ${isDateNear(p.deadline) ? '#e53e3e' : '#718096'}; font-size: 0.8rem;">
                            <i class="fas fa-calendar"></i> ${formatDate(p.deadline)}
                          </span>
                        ` : '<span style="color: #a0aec0; font-size: 0.8rem;">Sem prazo</span>'}
                        <span style="color: #a0aec0; font-size: 0.75rem;">
                          <i class="fas fa-user-tie"></i> ${p.lawyer_name || 'N/A'}
                        </span>
                      </div>
                    </div>
                  `).join('') : `
                    <div class="kanban-empty">
                      <i class="fas fa-inbox" style="font-size: 2rem; color: #cbd5e0; margin-bottom: 10px;"></i>
                      <p style="color: #a0aec0; font-size: 0.9rem;">Nenhum processo</p>
                    </div>
                  `}
                </div>
              </div>
            `;
    }).join('')}
        </div>
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
              <th>Advogado Responsável</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${clients.map(c => `
              <tr>
                <td onclick="viewClientFull(${c.id})" style="cursor: pointer;"><strong>${c.name}</strong></td>
                <td>${c.email || '-'}</td>
                <td>${c.phone}</td>
                <td>${c.cpf || '-'}</td>
                <td>${c.lawyer_name || '-'}</td>
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
    document.getElementById('client-partnership').value = client.partnership_type || 'PARTICULAR';
  } else {
    title.textContent = 'Novo Cliente';
    document.getElementById('client-form').reset();
    document.getElementById('client-id').value = '';
    document.getElementById('client-partnership').value = 'PARTICULAR';
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
    notes: document.getElementById('client-notes').value,
    partnership_type: document.getElementById('client-partnership').value
  };

  try {
    if (id) {
      await fetchAPI(`/clients/${id}`, 'PUT', data);
      alert('Cliente atualizado com sucesso!');
    } else {
      await fetchAPI('/clients', 'POST', data);
      alert('Cliente cadastrado com sucesso!');
    }

    closeClientModal();
    loadClients();
  } catch (error) {
    alert('Erro ao salvar cliente: ' + (error.message || 'Erro desconhecido'));
    console.error('Erro completo:', error);
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

const currentSection = localStorage.getItem('currentSection') || 'processes';

async function loadProcesses(archived = false) {
  console.log('[DEBUG] loadProcesses called with archived:', archived);
  document.getElementById('page-title').textContent = archived ? 'Processos Arquivados' : 'Processos Ativos';

  try {
    const [processes, clients] = await Promise.all([
      fetchAPI(`/processes?archived=${archived}`),
      fetchAPI('/clients')
    ]);

    // Populate client select for modal
    const clientSelect = document.getElementById('process-client');
    clientSelect.innerHTML = '<option value="">Selecione...</option>' +
      clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    const html = `
      <div class="table-container">
        <div class="table-header">
          <h3 class="table-title">${archived ? 'Lista de Arquivados' : 'Lista de Processos'}</h3>
          ${!archived ? `
          <button class="btn btn-primary" onclick="openProcessModal()">
            <i class="fas fa-plus"></i> Novo Processo
          </button>` : ''}
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nº do Caso</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Fase</th>
              <th>Advogado Responsável</th>
              <th>Status</th>
              <th>Prazo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${processes.map(p => `
              <tr>
                <td onclick="viewFullProcess(${p.id})" style="cursor: pointer; color: #667eea; font-weight: 600;"><strong>${p.case_number}</strong></td>
                <td>${p.client_name || 'N/A'}</td>
                <td>${p.type}<br><small class="text-gray-500">${p.process_category || ''}</small></td>
                <td>${p.phase || '-'}</td>
                <td>${p.lawyer_name || '-'}</td>
                <td><span class="badge ${getStatusBadge(p.status)}">${p.status}</span></td>
                <td>${p.deadline ? formatDate(p.deadline) : '-'}</td>
                <td class="table-actions">
                  <button class="btn btn-sm btn-secondary" onclick='editProcess(${JSON.stringify(p).replace(/'/g, "&apos;")})' title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  ${!archived ? `
                  <button class="btn btn-sm btn-warning" onclick="archiveProcess(${p.id})" title="Arquivar">
                    <i class="fas fa-archive"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="deleteProcess(${p.id})" title="Excluir Permanentemente">
                    <i class="fas fa-trash"></i>
                  </button>` : `
                  <button class="btn btn-sm btn-success" onclick="unarchiveProcess(${p.id})" title="Desarquivar">
                    <i class="fas fa-box-open"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="deleteProcess(${p.id})" title="Excluir Permanentemente">
                    <i class="fas fa-trash"></i>
                  </button>`}
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
    if (document.getElementById('process-id')) document.getElementById('process-id').value = process.id;
    if (document.getElementById('process-client')) document.getElementById('process-client').value = process.client_id;
    if (document.getElementById('process-case-number')) document.getElementById('process-case-number').value = process.case_number;
    if (document.getElementById('process-category')) document.getElementById('process-category').value = process.process_category || process.type || '';

    if (document.getElementById('process-phase')) document.getElementById('process-phase').value = process.phase || '';
    if (document.getElementById('process-status')) document.getElementById('process-status').value = process.status;
    if (document.getElementById('process-description')) document.getElementById('process-description').value = process.description || '';
    document.getElementById('process-deadline').value = process.deadline || '';
    document.getElementById('process-partnership').value = process.partnership_type || 'AVADA';

    // Set State and City
    if (document.getElementById('process-state')) {
      document.getElementById('process-state').value = process.state || '';
      // Trigger city population if state exists
      if (process.state && typeof window.loadCitiesByState === 'function') {
        window.loadCitiesByState();
        // Set city after cities are loaded
        setTimeout(() => {
          if (document.getElementById('process-city')) {
            document.getElementById('process-city').value = process.city || '';
          }
        }, 100);
      }
    }

    // Set Agency and handle "Other"
    const agencySelect = document.getElementById('process-agency');
    const agencyOther = document.getElementById('process-agency-other');
    if (process.traffic_agency && !Array.from(agencySelect.options).some(o => o.value === process.traffic_agency)) {
      agencySelect.value = 'Outro';
      agencyOther.style.display = 'block';
      agencyOther.value = process.traffic_agency;
    } else {
      agencySelect.value = process.traffic_agency || '';
      agencyOther.style.display = 'none';
    }

    // Set Court and handle "Other"
    const courtSelect = document.getElementById('process-court');
    const courtOther = document.getElementById('process-court-other');
    if (process.court && !Array.from(courtSelect.options).some(o => o.value === process.court)) {
      courtSelect.value = 'Outro';
      courtOther.style.display = 'block';
      courtOther.value = process.court;
    } else {
      courtSelect.value = process.court || '';
      courtOther.style.display = 'none';
    }
  } else {
    title.textContent = 'Novo Processo';
    document.getElementById('process-form').reset();
    document.getElementById('process-id').value = '';
    document.getElementById('process-partnership').value = 'AVADA';
  }

  modal.classList.add('show');
}

function closeProcessModal() {
  document.getElementById('process-modal').classList.remove('show');
}

// Global function to load cities
window.loadCitiesByState = async function () {
  const stateSelect = document.getElementById('process-state');
  const citySelect = document.getElementById('process-city');
  const state = stateSelect.value;

  if (!state) {
    citySelect.innerHTML = '<option value="">Selecione um Estado primeiro</option>';
    return;
  }

  citySelect.innerHTML = '<option value="">Carregando...</option>';

  try {
    const response = await fetch('data/municipios.json');
    if (!response.ok) throw new Error('Erro ao carregar municípios');

    const data = await response.json();
    const cities = data[state] || [];

    citySelect.innerHTML = '<option value="">Selecione...</option>' +
      cities.map(city => `<option value="${city}">${city}</option>`).join('');

  } catch (error) {
    console.error('Erro ao carregar cidades:', error);
    citySelect.innerHTML = '<option value="">Erro ao carregar</option>';
  }
};

function editProcess(process) {
  openProcessModal(process);
}

async function saveProcess() {
  const id = document.getElementById('process-id').value;
  const data = {
    client_id: parseInt(document.getElementById('process-client').value),
    case_number: document.getElementById('process-case-number').value,
    type: document.getElementById('process-category').value,
    phase: document.getElementById('process-phase').value,
    status: document.getElementById('process-status').value,
    description: document.getElementById('process-description').value,
    deadline: document.getElementById('process-deadline').value,
    partnership_type: document.getElementById('process-partnership').value,
    process_category: document.getElementById('process-category').value,
    state: document.getElementById('process-state').value,
    city: document.getElementById('process-city').value,
    traffic_agency: document.getElementById('process-agency').value === 'Outro' ? document.getElementById('process-agency-other').value : document.getElementById('process-agency').value,
    court: document.getElementById('process-court').value === 'Outro' ? document.getElementById('process-court-other').value : document.getElementById('process-court').value
  };

  try {
    if (id) {
      await fetchAPI(`/processes/${id}`, 'PUT', data);
    } else {
      await fetchAPI('/processes', 'POST', data);
    }

    closeProcessModal();
    // Refresh current view (archived or active)
    const isArchived = document.getElementById('page-title').textContent.includes('Arquivados');
    loadProcesses(isArchived);
  } catch (error) {
    alert('Erro ao salvar processo');
  }
}

async function archiveProcess(id) {
  if (!confirm('Deseja arquivar este processo?')) return;
  try {
    await fetchAPI(`/processes/${id}/archive`, 'PATCH');
    alert('Processo arquivado com sucesso!');
    loadProcesses(false); // Reload active
  } catch (error) {
    alert('Erro ao arquivar processo: ' + (error.message || 'Erro desconhecido'));
  }
}

async function unarchiveProcess(id) {
  if (!confirm('Deseja desarquivar este processo?')) return;
  try {
    await fetchAPI(`/processes/${id}/unarchive`, 'PATCH');
    alert('Processo desarquivado com sucesso!');
    loadProcesses(true); // Reload archived
  } catch (error) {
    alert('Erro ao desarquivar processo: ' + (error.message || 'Erro desconhecido'));
  }
}

async function deleteProcess(id) {
  if (!confirm('ATENÇÃO: Esta ação é PERMANENTE e não pode ser desfeita. Deseja realmente excluir?')) return;

  try {
    await fetchAPI(`/processes/${id}`, 'DELETE');
    loadProcesses(true); // Reload archived (since delete is only available there)
  } catch (error) {
    alert('Erro ao excluir processo');
  }
}

function toggleOtherField(type) {
  const select = document.getElementById(`process-${type}`);
  const otherInput = document.getElementById(`process-${type}-other`);
  if (select.value === 'Outro') {
    otherInput.style.display = 'block';
    otherInput.required = true;
  } else {
    otherInput.style.display = 'none';
    otherInput.required = false;
    otherInput.value = '';
  }
}

// ==========================================
// VIEW FUNCTIONS - CLICKABLE LISTS
// ==========================================

async function viewProcess(id) {
  try {
    const process = await fetchAPI(`/processes/${id}`);
    alert(`Detalhes do Processo ${process.case_number}\n\nCliente: ${process.client_name}\nTipo: ${process.type}\nStatus: ${process.status}\nDescrição: ${process.description || 'Sem descrição'}`);
  } catch (error) {
    alert('Erro ao carregar processo: ' + error.message);
  }
}

async function viewClientFull(id) {
  try {
    const data = await fetchAPI(`/clients/${id}/full`);
    const client = data.client;
    const processes = data.processes;
    const stats = data.stats;

    // Build the HTML for the Full Folder View
    const html = `
      <div class="mb-20">
        <button class="btn btn-secondary" onclick="loadClients()">
          <i class="fas fa-arrow-left"></i> Voltar para Lista de Clientes
        </button>
      </div>

      <div class="info-card mb-20" style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div class="flex-between">
            <h2 style="font-size: 1.8rem; color: #2d3748; margin-bottom: 20px;">
                <i class="fas fa-folder-open" style="color: #667eea;"></i> Pasta Completa: ${client.name}
            </h2>
             <button class="btn btn-primary" onclick='editClient(${JSON.stringify(client).replace(/'/g, "&apos;")})'>
                <i class="fas fa-edit"></i> Editar Dados
             </button>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 10px;">
            <div>
                <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">E-mail</p>
                <p style="font-weight: 600; font-size: 1.1rem;">${client.email || '-'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">Telefone</p>
                <p style="font-weight: 600; font-size: 1.1rem;">${client.phone || '-'}</p>
            </div>
             <div>
                <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">CPF</p>
                <p style="font-weight: 600; font-size: 1.1rem;">${client.cpf || '-'}</p>
            </div>
             <div>
                <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">Endereço</p>
                <p style="font-weight: 600; font-size: 1.1rem;">${client.address || '-'}</p>
            </div>
        </div>
        ${client.notes ? `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
             <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">Observações</p>
             <p style="color: #4a5568;">${client.notes}</p>
        </div>` : ''}
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fas fa-folder"></i></div>
          <div class="stat-value">${stats.totalProcesses}</div>
          <div class="stat-label">Total de Processos</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon green"><i class="fas fa-play"></i></div>
          <div class="stat-value">${stats.activeProcesses}</div>
          <div class="stat-label">Em Andamento</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon purple"><i class="fas fa-check-circle"></i></div>
          <div class="stat-value">${stats.concludedProcesses}</div>
          <div class="stat-label">Concluídos</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon orange"><i class="fas fa-archive"></i></div>
          <div class="stat-value">${stats.archivedProcesses}</div>
          <div class="stat-label">Arquivados</div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <h3 class="table-title">Processos do Cliente</h3>
           <button class="btn btn-primary" onclick="openProcessModal()">
            <i class="fas fa-plus"></i> Novo Processo
          </button>
        </div>
        ${processes.length > 0 ? `
        <table class="data-table">
          <thead>
            <tr>
              <th>Caso / Tipo</th>
              <th>Status / Fase</th>
              <th>Advogado</th>
              <th>Próx. Prazo</th>
              <th>Parceria</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${processes.map(p => `
              <tr>
                <td>
                    <div style="font-weight: bold; color: #2d3748;">${p.case_number}</div>
                    <div style="font-size: 0.85rem; color: #718096;">${p.type}</div>
                </td>
                <td>
                    <span class="badge ${getStatusBadge(p.status)}">${p.status}</span>
                    <div style="font-size: 0.8rem; margin-top: 4px; color: #4a5568;">${p.phase || '-'}</div>
                </td>
                <td>${p.lawyer_name || '-'}</td>
                 <td>${p.deadline ? `<span style="color: ${isDateNear(p.deadline) ? '#e53e3e' : '#2d3748'}; font-weight: 600;"><i class="fas fa-calendar-alt"></i> ${formatDate(p.deadline)}</span>` : '-'}</td>
                 <td>
                    <span class="badge ${p.partnership_type === 'PARTICULAR' ? 'badge-warning' : 'badge-info'}" style="font-size: 0.75rem;">
                        ${p.partnership_type || 'AVADA'}
                    </span>
                 </td>
                <td class="table-actions">
                  <button class="btn btn-sm btn-secondary" onclick='editProcess(${JSON.stringify(p).replace(/'/g, "&apos;")})' title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                   <button class="btn btn-sm btn-info" onclick="openAttachmentsModal(${p.id})" title="Anexos" style="background: #3182ce; color: white;">
                    <i class="fas fa-paperclip"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : `
        <div class="empty-state">
            <div class="empty-state-icon"><i class="fas fa-folder-open"></i></div>
            <div class="empty-state-title">Nenhum processo encontrado</div>
            <p>Este cliente ainda não possui processos cadastrados.</p>
        </div>
        `}
      </div>
    `;

    document.getElementById('content-area').innerHTML = html;
    document.getElementById('page-title').textContent = 'Detalhes do Cliente';

    // Scroll to top
    window.scrollTo(0, 0);

  } catch (error) {
    console.error(error);
    alert('Erro ao carregar pasta do cliente: ' + error.message);
  }
}

// Helper to check if date is near (for red color)
function isDateNear(dateString) {
  const today = new Date();
  const deadline = new Date(dateString);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 5 && diffDays >= 0;
}

// ==========================================
// VIEW FULL PROCESS - Pasta Completa do Processo
// ==========================================

async function viewFullProcess(id) {
  try {
    const data = await fetchAPI(`/processes/${id}/full`);
    const process = data.process;
    const client = data.client;
    const lawyer = data.lawyer;
    const attachments = data.attachments;
    const stats = data.stats;

    // Build the HTML for the Full Process View
    const html = `
      <div class="mb-20">
        <button class="btn btn-secondary" onclick="switchView('processes')">
          <i class="fas fa-arrow-left"></i> Voltar para Lista de Processos
        </button>
      </div>

      <div class="info-card mb-20" style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div class="flex-between">
            <h2 style="font-size: 1.8rem; color: #2d3748; margin-bottom: 20px;">
                <i class="fas fa-gavel" style="color: #667eea;"></i> Pasta Completa: ${process.case_number}
            </h2>
             <button class="btn btn-primary" onclick='editProcess(${JSON.stringify(process).replace(/'/g, "&apos;")})'>
                <i class="fas fa-edit"></i> Editar Processo
             </button>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 10px;">
            <div>
                <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">Cliente</p>
                <p style="font-weight: 600; font-size: 1.1rem;">
                    <i class="fas fa-user" style="color: #667eea;"></i> 
                    <a href="#" onclick="viewClientFull(${process.client_id}); return false;" style="color: #667eea; text-decoration: underline;">${process.client_name}</a>
                </p>
            </div>
            <div>
                <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">Tipo/Categoria</p>
                <p style="font-weight: 600; font-size: 1.1rem;">${process.type || '-'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">Fase Processual</p>
                <p style="font-weight: 600; font-size: 1.1rem;">${process.phase || '-'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">Status</p>
                <p><span class="badge ${getStatusBadge(process.status)}" style="font-size: 1rem;">${process.status}</span></p>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
            <div>
                <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">Estado/Cidade</p>
                <p style="font-weight: 600; font-size: 1.1rem;">${process.state || '-'} / ${process.city || '-'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">Tribunal</p>
                <p style="font-weight: 600; font-size: 1.1rem;">${process.court || '-'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">Órgão de Trânsito</p>
                <p style="font-weight: 600; font-size: 1.1rem;">${process.traffic_agency || '-'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">Prazo</p>
                <p style="font-weight: 600; font-size: 1.1rem; color: ${isDateNear(process.deadline) ? '#e53e3e' : '#2d3748'};">
                    ${process.deadline ? `<i class="fas fa-calendar-alt"></i> ${formatDate(process.deadline)}` : '-'}
                </p>
            </div>
        </div>

        ${process.description ? `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
             <p class="text-sm text-gray-600" style="color: #718096; font-size: 0.9rem;">Descrição</p>
             <p style="color: #4a5568;">${process.description}</p>
        </div>` : ''}
      </div>

      <div class="stats-grid">
        <div class="stat-card blue">
          <div class="stat-icon blue"><i class="fas fa-paperclip"></i></div>
          <div class="stat-value">${stats.totalAttachments}</div>
          <div class="stat-label">Anexos</div>
        </div>
        <div class="stat-card ${process.status === 'Em Andamento' ? 'orange' : process.status === 'Concluído' ? 'green' : 'purple'}">
          <div class="stat-icon ${process.status === 'Em Andamento' ? 'orange' : process.status === 'Concluído' ? 'green' : 'purple'}"><i class="fas fa-tag"></i></div>
          <div class="stat-value">${process.status}</div>
          <div class="stat-label">Status Atual</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon green"><i class="fas fa-user-tie"></i></div>
          <div class="stat-value">${lawyer ? lawyer.name : 'N/A'}</div>
          <div class="stat-label">Advogado Responsável</div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <h3 class="table-title">Anexos do Processo</h3>
           <button class="btn btn-primary" onclick="openAttachmentsModal(${process.id})">
            <i class="fas fa-paperclip"></i> Gerenciar Anexos
          </button>
        </div>
        ${attachments.length > 0 ? `
        <table class="data-table">
          <thead>
            <tr>
              <th>Nome do Arquivo</th>
              <th>Tipo</th>
              <th>Tamanho</th>
              <th>Enviado por</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${attachments.map(a => `
              <tr>
                <td>
                    <i class="fas fa-file"></i> ${a.original_name}
                </td>
                <td>${a.file_type}</td>
                <td>${(a.file_size / 1024).toFixed(2)} KB</td>
                <td>${a.uploaded_by_name || '-'}</td>
                <td>${formatDate(a.created_at)}</td>
                <td class="table-actions">
                  <a href="${API_URL}/processes/attachments/${a.id}/download" class="btn btn-sm btn-success" title="Download" download>
                    <i class="fas fa-download"></i>
                  </a>
                  <button class="btn btn-sm btn-danger" onclick="deleteAttachment(${a.id}, ${process.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : `
        <div class="empty-state">
            <div class="empty-state-icon"><i class="fas fa-file-upload"></i></div>
            <div class="empty-state-title">Nenhum anexo encontrado</div>
            <p>Este processo ainda não possui arquivos anexados.</p>
        </div>
        `}
      </div>
    `;

    document.getElementById('content-area').innerHTML = html;
    document.getElementById('page-title').textContent = 'Detalhes do Processo';

    // Scroll to top
    window.scrollTo(0, 0);

  } catch (error) {
    console.error(error);
    alert('Erro ao carregar pasta do processo: ' + error.message);
  }
}

// ==========================================
// CHANGE PASSWORD
// ==========================================

function openPasswordModal() {
  document.getElementById('password-modal').classList.add('show');
  document.getElementById('password-form').reset();
}

function closePasswordModal() {
  document.getElementById('password-modal').classList.remove('show');
}

async function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert('Preencha todos os campos');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('A nova senha e a confirmação não coincidem');
    return;
  }

  if (newPassword.length < 6) {
    alert('A nova senha deve ter no mínimo 6 caracteres');
    return;
  }

  try {
    await fetchAPI('/auth/change-password', 'PUT', {
      currentPassword,
      newPassword
    });

    alert('Senha alterada com sucesso!');
    closePasswordModal();
  } catch (error) {
    alert('Erro ao alterar senha: ' + error.message);
  }
}

// ==========================================
// SYSTEM INFO VIEW (ADMIN ONLY)
// ==========================================

async function loadSystemInfo() {
  document.getElementById('page-title').textContent = 'Informações do Sistema';
  document.getElementById('content-area').innerHTML = '<div class="loading"></div>';

  try {
    const response = await fetch(`${API_URL}/admin/system-info`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!response.ok) throw new Error('Falha ao carregar informações');

    const data = await response.json();

    const html = `
      <div class="info-grid">
        <div class="info-card">
          <h3><i class="fas fa-database info-card-icon"></i> Banco de Dados</h3>
          <p><strong>Tipo:</strong> ${data.systemInfo.databaseType}</p>
          <p><strong>Status:</strong> Conectado</p>
          <p><strong>Expiração JWT:</strong> ${data.systemInfo.jwtExpiration}</p>
        </div>
        
        <div class="info-card">
          <h3><i class="fas fa-server info-card-icon"></i> Estatísticas Gerais</h3>
          <p><strong>Clientes:</strong> ${data.statistics.totalClients}</p>
          <p><strong>Processos:</strong> ${data.statistics.totalProcesses}</p>
          <p><strong>Advogados:</strong> ${data.statistics.totalLawyers}</p>
        </div>

        <div class="info-card" style="grid-column: 1 / -1;">
          <h3><i class="fas fa-users info-card-icon"></i> Usuários do Sistema (${data.users.length})</h3>
          <ul class="user-list">
            ${data.users.map(u => `
              <li class="user-item">
                <div class="user-item-name">${u.name}</div>
                <div class="user-item-email">${u.email}</div>
                <div class="user-item-role badge ${u.role === 'admin' ? 'badge-danger' : 'badge-info'}">
                  ${u.role}
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
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

// ==========================================
// ATTACHMENTS (FILE UPLOAD)
// ==========================================

function openAttachmentsModal(processId) {
  currentProcessId = processId;
  const modal = document.getElementById('attachments-modal');
  modal.classList.add('show');
  loadAttachments(processId);
}

function closeAttachmentsModal() {
  document.getElementById('attachments-modal').classList.remove('show');
  document.getElementById('upload-form').reset();
  currentProcessId = null;
}

async function loadAttachments(processId) {
  const list = document.getElementById('attachments-list');
  const emptyState = document.getElementById('attachments-empty');
  const loading = document.getElementById('attachments-loading');

  list.innerHTML = '';
  loading.classList.remove('hidden');
  emptyState.classList.add('hidden');

  try {
    const response = await fetch(`${API_URL}/processes/${processId}/attachments`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!response.ok) throw new Error('Erro ao carregar anexos');

    const attachments = await response.json();

    loading.classList.add('hidden');

    if (attachments.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    list.innerHTML = attachments.map(att => `
            <div class="attachment-item">
                <div class="attachment-info">
                    <div class="attachment-icon">
                        ${getIconForFileType(att.file_type)}
                    </div>
                    <div class="attachment-details">
                        <div class="attachment-name">${att.original_name}</div>
                        <div class="attachment-meta">
                            ${(att.file_size / 1024).toFixed(1)} KB • ${formatDate(att.created_at)} • Por ${att.uploaded_by_name || 'Usuário'}
                        </div>
                    </div>
                </div>
                <div class="table-actions">
                    <a href="${API_URL}/processes/attachments/${att.id}/download" target="_blank" class="btn btn-sm btn-secondary" title="Baixar">
                        <i class="fas fa-download"></i>
                    </a>
                    ${currentUser.id === att.uploaded_by || currentUser.role === 'admin' ? `
                    <button class="btn btn-sm btn-danger" onclick="deleteAttachment(${att.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

  } catch (error) {
    loading.classList.add('hidden');
    list.innerHTML = `<div class="error-message show">Erro ao carregar anexos: ${error.message}</div>`;
  }
}

async function handleUpload(e) {
  e.preventDefault();
  if (!currentProcessId) return;

  const fileInput = document.getElementById('attachment-file');
  const file = fileInput.files[0];
  if (!file) return;

  const loading = document.getElementById('upload-progress');
  const btn = e.target.querySelector('button');

  loading.classList.remove('hidden');
  btn.disabled = true;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_URL}/processes/${currentProcessId}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro no upload');
    }

    // Success
    fileInput.value = '';
    loadAttachments(currentProcessId);

  } catch (error) {
    alert('Erro ao enviar arquivo: ' + error.message);
  } finally {
    loading.classList.add('hidden');
    btn.disabled = false;
  }
}

async function deleteAttachment(id) {
  if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

  try {
    await fetchAPI(`/processes/attachments/${id}`, 'DELETE');
    loadAttachments(currentProcessId);
  } catch (error) {
    alert('Erro ao excluir arquivo');
  }
}

function getIconForFileType(mimeType) {
  if (mimeType.includes('pdf')) return '<i class="fas fa-file-pdf" style="color: #e53e3e;"></i>';
  if (mimeType.includes('image')) return '<i class="fas fa-file-image" style="color: #3182ce;"></i>';
  if (mimeType.includes('word')) return '<i class="fas fa-file-word" style="color: #2b6cb0;"></i>';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '<i class="fas fa-file-excel" style="color: #38a169;"></i>';
  return '<i class="fas fa-file-alt" style="color: #718096;"></i>';
}

// ===================================
// PASSWORD CHANGE FUNCTIONS
// ===================================

function openChangePasswordModal() {
  document.getElementById('change-password-modal').style.display = 'flex';
  document.getElementById('change-password-form').reset();
}

function closeChangePasswordModal() {
  document.getElementById('change-password-modal').style.display = 'none';
  document.getElementById('change-password-form').reset();
}

async function submitPasswordChange(event) {
  // Se chamado via evento, prevenir default
  if (event) {
    event.preventDefault();
  }

  // Pegar form diretamente
  const form = document.getElementById('change-password-form');

  // Usar FormData para pegar valores do form
  const formData = new FormData(form);
  const currentPassword = formData.get('current-password')?.trim();
  const newPassword = formData.get('new-password')?.trim();
  const confirmPassword = formData.get('confirm-password')?.trim();

  console.log('[DEBUG] Password Change - FormData:', {
    currentPassword: currentPassword ? '***FILLED***' : 'EMPTY',
    newPassword: newPassword ? '***FILLED***' : 'EMPTY',
    confirmPassword: confirmPassword ? '***FILLED***' : 'EMPTY',
    formExists: !!form
  });

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert('Preencha todos os campos!');
    console.error('[ERROR] Empty fields detected');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('As senhas não coincidem!');
    return;
  }

  if (newPassword.length < 6) {
    alert('A nova senha deve ter pelo menos 6 caracteres!');
    return;
  }

  try {
    await fetchAPI('/auth/change-password', 'POST', {
      currentPassword,
      newPassword
    });

    alert('Senha alterada com sucesso!');
    closeChangePasswordModal();
  } catch (error) {
    alert('Erro ao alterar senha: ' + (error.message || 'Senha atual incorreta'));
  }
}

// ==========================================
// CALCULATOR FUNCTIONS
// ==========================================

async function calculateDeadline() {
  const startDate = document.getElementById('deadline-start-date').value;
  const days = document.getElementById('deadline-days').value;
  const type = document.getElementById('deadline-type').value;
  const resultField = document.getElementById('process-deadline');
  const infoField = document.getElementById('deadline-info');

  if (!startDate || !days) {
    // Don't clear if user manually editing? 
    // But this is calculator mode.
    return;
  }

  // Visual feedback
  infoField.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculando...';

  try {
    // Get city/state (could be dynamic later)
    const city = 'Fortaleza';
    const state = 'CE';

    const response = await fetch(`${API_URL}/processes/calculate-deadline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        startDate,
        days: parseInt(days),
        type,
        city,
        state
      })
    });

    if (!response.ok) throw new Error('Erro na API');

    const data = await response.json();

    // Parse ISO to YYYY-MM-DD safe
    // data.fatalDeadline is e.g. "2026-05-15T00:00:00.000Z"
    const isoDate = data.fatalDeadline;
    const safeDate = isoDate.split('T')[0];

    resultField.value = safeDate;
    const brDate = safeDate.split('-').reverse().join('/');

    // Format details
    let details = `<strong>Prazo Fatal: ${brDate}</strong><br>`;
    details += `Dias Úteis: ${data.workingDaysAdded} | Feriados/FDS: ${data.holidaysFound.length}`;

    // Show first 3 holidays if any
    if (data.holidaysFound.length > 0) {
      const holidayNames = data.holidaysFound.slice(0, 3).map(h => {
        const d = h.date.split('T')[0].split('-').reverse().join('/');
        return `${d} (${h.type})`;
      }).join(', ');
      details += `<br><small class="text-xs text-gray-500">${holidayNames}${data.holidaysFound.length > 3 ? '...' : ''}</small>`;
    }

    infoField.innerHTML = details;

  } catch (error) {
    console.error(error);
    infoField.innerText = "Erro ao calcular prazo.";
  }
}
