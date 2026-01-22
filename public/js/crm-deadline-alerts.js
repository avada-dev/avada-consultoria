// ==========================================
// DEADLINE ALERTS SYSTEM
// Sistema de Alertas de Prazos
// ==========================================

// Função para verificar e exibir alertas de prazo
async function checkDeadlineAlerts() {
    try {
        const response = await fetch(`${API_URL}/processes`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const processes = await response.json();
            const alerts = categorizeProcessesByDeadline(processes);

            // Mostrar alertas se existirem
            if (alerts.critical.length > 0 || alerts.warning.length > 0) {
                showDeadlinePopup(alerts);
            }
        }
    } catch (error) {
        console.error('Erro ao verificar prazos:', error);
    }
}

// Categorizar processos por urgência
function categorizeProcessesByDeadline(processes) {
    const now = new Date();
    const alerts = {
        critical: [], // Vencidos
        warning: [],  // Próximos (7 dias)
        info: []      // Futuros
    };

    processes.forEach(process => {
        if (!process.deadline || process.status === 'Concluído' || process.status === 'Arquivado' || process.status === 'Ok Feito') {
            return;
        }

        const deadline = new Date(process.deadline);
        const diffTime = deadline - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            // Prazo vencido
            alerts.critical.push({
                ...process,
                daysOverdue: Math.abs(diffDays)
            });
        } else if (diffDays <= 7) {
            // Prazo próximo (7 dias ou menos)
            alerts.warning.push({
                ...process,
                daysRemaining: diffDays
            });
        } else {
            alerts.info.push(process);
        }
    });

    return alerts;
}

// Exibir popup de alertas
function showDeadlinePopup(alerts) {
    const existingPopup = document.getElementById('deadline-alert-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.id = 'deadline-alert-popup';
    popup.className = 'deadline-popup';

    let popupContent = `
        <div class="deadline-popup-content">
            <button class="deadline-popup-close" onclick="closeDeadlinePopup()">×</button>
            <h2>⚠️ Alertas de Prazos</h2>
    `;

    // Alertas críticos (vencidos)
    if (alerts.critical.length > 0) {
        popupContent += `
            <div class="alert-section alert-critical">
                <h3>🔴 PRAZOS VENCIDOS (${alerts.critical.length})</h3>
                <ul>
        `;
        alerts.critical.forEach(process => {
            popupContent += `
                <li>
                    <strong>${process.case_number}</strong> - ${process.client_name}<br>
                    <span class="alert-detail">Vencido há ${process.daysOverdue} dia(s)</span><br>
                    <span class="alert-deadline">Prazo era: ${formatDate(process.deadline)}</span>
                    <button class="btn-sm" onclick="viewProcess(${process.id})">Ver Detalhes</button>
                </li>
            `;
        });
        popupContent += `
                </ul>
            </div>
        `;
    }

    // Alertas de aviso (próximos 7 dias)
    if (alerts.warning.length > 0) {
        popupContent += `
            <div class="alert-section alert-warning">
                <h3>🟡 PRAZOS PRÓXIMOS (${alerts.warning.length})</h3>
                <ul>
        `;
        alerts.warning.forEach(process => {
            // Check for Urgent (<= 2 days)
            const isUrgent = process.daysRemaining <= 2;
            popupContent += `
                <li>
                    <strong>${process.case_number}</strong> - ${process.client_name}<br>
                    <span class="alert-detail">Vence em ${process.daysRemaining} dia(s)</span><br>
                    <span class="alert-deadline">Prazo: ${formatDate(process.deadline)}</span>
                    ${isUrgent ? '<br><span style="color: red; font-weight: bold; font-size: 0.8em; text-transform: uppercase;">PRAZO SE VENCENDO</span>' : ''}
                    <button class="btn-sm" onclick="viewProcess(${process.id})">Ver Detalhes</button>
                </li>
            `;
        });
        popupContent += `
                </ul>
            </div>
        `;
    }

    popupContent += `
            <div class="popup-actions">
                <button onclick="closeDeadlinePopup()" class="btn btn-secondary">Fechar</button>
                <button onclick="viewAllProcesses()" class="btn btn-primary">Ver Todos os Processos</button>
            </div>
        </div>
    `;

    popup.innerHTML = popupContent;
    document.body.appendChild(popup);

    // Mostrar com animação
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
}

// Fechar popup
function closeDeadlinePopup() {
    const popup = document.getElementById('deadline-alert-popup');
    if (popup) {
        popup.classList.remove('show');
        setTimeout(() => {
            popup.remove();
        }, 300);
    }
}

// Função para iniciar o monitoramento (chamada pelo crm-app.js após login)
function startDeadlineMonitoring() {
    console.log('🔔 Sistema de Alertas de Prazos iniciado');

    // Verificar imediatamente
    checkDeadlineAlerts();

    // Verificar a cada 1 hora (ao invés de 5 min para não sobrecarregar)
    // Armazenar ID do intervalo se quisermos cancelar depois, mas por ora ok deixar rodando
    setInterval(checkDeadlineAlerts, 60 * 60 * 1000);
}

// Ir para a página de processos
function viewAllProcesses() {
    closeDeadlinePopup();
    if (typeof switchView === 'function') {
        switchView('processes');
    }
}

// Nota: A função viewProcess() foi removida daqui pois já existe no crm-app.js
// O botão "Ver Detalhes" no popup chamará a versão do crm-app.js que funciona corretamente.
