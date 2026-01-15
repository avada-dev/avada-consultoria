// Adicionar ao final do arquivo crm-app.js

// ==========================================
// MAKE ITEMS CLICKABLE IN TABLES
// ==========================================

// Override renderProcessesTable to make items clickable
const _originalLoadProcesses = loadProcesses;
window.loadProcesses = async function () {
    await _originalLoadProcesses();

    // Make process case numbers clickable
    setTimeout(() => {
        const processRows = document.querySelectorAll('[data-process-id]');
        processRows.forEach(row => {
            const processId = row.getAttribute('data-process-id');
            const cells = row.querySelectorAll('td');

            // Make first cell (case number) clickable with pointer cursor
            if (cells[0]) {
                cells[0].style.cursor = 'pointer';
                cells[0].style.color = '#667eea';
                cells[0].style.fontWeight = '600';
                cells[0].onclick = () => viewProcessDetails(processId);
            }

            // Make second cell (client name) clickable
            if (cells[1]) {
                cells[1].style.cursor = 'pointer';
                cells[1].style.color = '#667eea';
                cells[1].onclick = () => viewProcessDetails(processId);
            }
        });
    }, 100);
};

// Override loadClients to add archive buttons
const _originalLoadClients = loadClients;
window.loadClients = async function () {
    await _originalLoadClients();

    // Add archive buttons to client actions
    setTimeout(() => {
        const clientRows = document.querySelectorAll('[data-client-id]');
        clientRows.forEach(row => {
            const clientId = row.getAttribute('data-client-id');
            const actionsCell = row.querySelector('.actions-cell');

            if (actionsCell && !actionsCell.querySelector('.archive-btn')) {
                const archiveBtn = document.createElement('button');
                archiveBtn.className = 'action-btn archive-btn';
                archiveBtn.title = 'Arquivar Cliente';
                archiveBtn.innerHTML = '<i class="fas fa-archive"></i>';
                archiveBtn.onclick = (e) => {
                    e.stopPropagation();
                    archiveClient(clientId, true);
                };
                actionsCell.appendChild(archiveBtn);
            }
        });
    }, 100);
};

// Ensure data attributes are added when processes are rendered
if (typeof renderProcessesView !== 'undefined') {
    console.log('[Process View] Clickable items initialized');
}
