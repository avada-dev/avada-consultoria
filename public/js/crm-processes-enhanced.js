// ENHANCED loadProcesses function with Archive button
// This replaces lines 389-449 in crm-app.js

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
                  <button class="btn btn-sm btn-secondary" onclick='editProcess(${JSON.stringify(p).replace(/'/g, "&apos;")})' title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  ${p.status !== 'Arquivado' && currentUser.role === 'admin' ? `
                    <button class="btn btn-sm" style="background: #f59e0b; color: white;" onclick="archiveProcess(${p.id})" title="Arquivar">
                      <i class="fas fa-archive"></i>
                    </button>
                  ` : ''}
                  <button class="btn btn-sm btn-danger" onclick="deleteProcess(${p.id})" title="Excluir">
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
