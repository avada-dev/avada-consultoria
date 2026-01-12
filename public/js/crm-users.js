// ==========================================
// USER MANAGEMENT FUNCTIONS (ADMIN ONLY)
// ==========================================

async function loadUsers() {
    if (currentUser.role !== 'admin') {
        showError('Acesso negado. Apenas administradores.');
        return;
    }

    document.getElementById('page-title').textContent = 'Gerenciar Usuários';

    try {
        const users = await fetchAPI('/admin/users');

        const html = `
      <div class="table-container">
        <div class="table-header">
          <h3 class="table-title">Profissionais Cadastrados</h3>
          <button class="btn btn-primary" onclick="openUserModal()">
            <i class="fas fa-user-plus"></i> Cadastrar Profissional
          </button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>OAB/Registro</th>
              <th>Telefone</th>
              <th>Data Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td><span class="badge ${u.role === 'admin' ? 'badge-danger' : 'badge-info'}">${u.role === 'admin' ? 'Administrador' : 'Advogado'}</span></td>
                <td>${u.oab || '-'}</td>
                <td>${u.phone || '-'}</td>
                <td>${formatDate(u.created_at)}</td>
                <td class="table-actions">
                  <button class="btn btn-sm btn-secondary" onclick='editUser(${JSON.stringify(u).replace(/'/g, "&apos;")})'>
                    <i class="fas fa-edit"></i>
                  </button>
                  ${u.role !== 'admin' ? `
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">
                      <i class="fas fa-trash"></i>
                    </button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="info-card mt-20">
        <h3><i class="fas fa-info-circle"></i> Informações Importantes</h3>
        <div class="alert alert-info">
          <p><strong>Senha Padrão:</strong> Novos profissionais receberão a senha padrão <code>advogado2024</code></p>
          <p><strong>Recomendação:</strong> Solicite que alterem a senha no primeiro acesso</p>
        </div>
      </div>
    `;

        document.getElementById('content-area').innerHTML = html;
    } catch (error) {
        showError('Erro ao carregar usuários');
    }
}

function openUserModal(user = null) {
    const modal = document.getElementById('user-modal');
    const title = document.getElementById('user-modal-title');

    if (user) {
        title.textContent = 'Editar Profissional';
        document.getElementById('user-id').value = user.id;
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-role').value = user.role;
        document.getElementById('user-phone').value = user.phone || '';
        document.getElementById('user-oab').value = user.oab || '';
        document.getElementById('user-password-group').style.display = 'none';
    } else {
        title.textContent = 'Cadastrar Novo Profissional';
        document.getElementById('user-form').reset();
        document.getElementById('user-id').value = '';
        document.getElementById('user-password-group').style.display = 'block';
    }

    modal.classList.add('show');
}

function closeUserModal() {
    document.getElementById('user-modal').classList.remove('show');
    document.getElementById('user-form').reset();
}

function editUser(user) {
    openUserModal(user);
}

async function saveUser() {
    const id = document.getElementById('user-id').value;
    const data = {
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        role: document.getElementById('user-role').value,
        phone: document.getElementById('user-phone').value,
        oab: document.getElementById('user-oab').value
    };

    if (!id) {
        const password = document.getElementById('user-password').value;
        data.password = password || 'advogado2024';
    }

    try {
        if (id) {
            await fetchAPI(`/admin/users/${id}`, 'PUT', data);
            alert('Profissional atualizado com sucesso!');
        } else {
            await fetchAPI('/admin/users', 'POST', data);
            alert('Profissional cadastrado com sucesso! Senha padrão: advogado2024');
        }

        closeUserModal();
        loadUsers();
    } catch (error) {
        alert('Erro ao salvar profissional: ' + error.message);
    }
}

async function deleteUser(id) {
    if (!confirm('Tem certeza que deseja excluir este profissional? Todos os clientes e processos associados permanecerão no sistema.')) return;

    try {
        await fetchAPI(`/admin/users/${id}`, 'DELETE');
        alert('Profissional excluído com sucesso!');
        loadUsers();
    } catch (error) {
        alert('Erro ao excluir profissional: ' + error.message);
    }
}

async function archiveProcess(id) {
    if (!confirm('Deseja arquivar este processo?')) return;

    try {
        await fetchAPI(`/processes/${id}`, 'PUT', { status: 'Arquivado' });
        alert('Processo arquivado com sucesso!');
        loadProcesses();
    } catch (error) {
        alert('Erro ao arquivar processo: ' + error.message);
    }
}
