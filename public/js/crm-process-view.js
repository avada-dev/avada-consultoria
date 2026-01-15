// ==========================================
// MODAL DE VISUALIZAÇÃO COMPLETA DE PROCESSO
// ==========================================

let currentViewProcessId = null;

// Open process view modal with complete details
async function viewProcessDetails(processId) {
    try {
        currentViewProcessId = processId;

        // Fetch process details
        const process = await fetchAPI(`/processes/${processId}`);

        // Fetch client details
        const client = await fetchAPI(`/clients/${process.client_id}`);

        // Populate modal fields
        document.getElementById('view-case-number').textContent = process.case_number || '-';
        document.getElementById('view-client-name').textContent = client.name || '-';
        document.getElementById('view-category').textContent = process.process_category || process.type || '-';
        document.getElementById('view-phase').textContent = process.phase || '-';
        document.getElementById('view-status').textContent = process.status || '-';
        document.getElementById('view-deadline').textContent = process.deadline ? new Date(process.deadline).toLocaleDateString('pt-BR') : '-';

        // Location fields
        document.getElementById('view-state').textContent = process.state || '-';
        document.getElementById('view-city').textContent = process.city || '-';
        document.getElementById('view-court').textContent = process.court || '-';
        document.getElementById('view-agency').textContent = process.traffic_agency || '-';

        // Description
        document.getElementById('view-description').textContent = process.description || 'Sem descrição';

        // Editable fields
        document.getElementById('view-observations').value = process.observations || '';
        document.getElementById('view-lawyer-requests').value = process.lawyer_requests || '';

        // Dates
        document.getElementById('view-created-at').textContent = process.created_at ? new Date(process.created_at).toLocaleString('pt-BR') : '-';
        document.getElementById('view-updated-at').textContent = process.updated_at ? new Date(process.updated_at).toLocaleString('pt-BR') : '-';

        // Show modal
        document.getElementById('process-view-modal').style.display = 'flex';

    } catch (error) {
        console.error('Error loading process details:', error);
        alert('Erro ao carregar detalhes do processo');
    }
}

// Close process view modal
function closeProcessViewModal() {
    document.getElementById('process-view-modal').style.display = 'none';
    currentViewProcessId = null;
}

// Save observations and lawyer requests
async function saveProcessObservations() {
    if (!currentViewProcessId) return;

    try {
        const observations = document.getElementById('view-observations').value;
        const lawyerRequests = document.getElementById('view-lawyer-requests').value;

        // Get current process data
        const process = await fetchAPI(`/processes/${currentViewProcessId}`);

        // Update with observations
        await fetchAPI(`/processes/${currentViewProcessId}`, 'PUT', {
            ...process,
            observations,
            lawyer_requests: lawyerRequests
        });

        alert('Observações salvas com sucesso!');

    } catch (error) {
        console.error('Error saving observations:', error);
        alert('Erro ao salvar observações');
    }
}

// Edit process from view modal
function editProcessFromView() {
    closeProcessViewModal();
    if (currentViewProcessId) {
        editProcess(currentViewProcessId);
    }
}

// ==========================================
// ARCHIVE CLIENT FUNCTIONALITY
// ==========================================

async function archiveClient(clientId, archived = true) {
    const action = archived ? 'arquivar' : 'desarquivar';

    if (!confirm(`Deseja ${action} este cliente?`)) return;

    try {
        await fetchAPI(`/clients/${clientId}/archive`, 'PATCH', { archived });
        alert(`Cliente ${archived ? 'arquivado' : 'desarquivado'} com sucesso!`);
        loadClients(); // Reload clients list
    } catch (error) {
        console.error(`Error ${action} client:`, error);
        alert(`Erro ao ${action} cliente`);
    }
}
