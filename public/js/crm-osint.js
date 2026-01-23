// OSINT Module Frontend Logic

async function loadOSINTView() {
    console.log('[FRONTEND] Loading OSINT View');
    document.getElementById('page-title').textContent = 'Buscar Servidor';

    const html = `
        <div class="osint-container" style="max-width: 800px; margin: 0 auto;">
            <div class="info-card mb-4" style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <h3 style="color: #2d3748; margin-bottom: 15px;"><i class="fas fa-user-shield" style="color: #667eea;"></i> Buscar Servidor Público</h3>
                <p class="text-gray-600 mb-4">
                    Utilize esta ferramenta para buscar informações públicas (Portal da Transparência, Diários Oficiais) utilizando Inteligência Artificial.
                </p>
                
                <form id="osint-form" onsubmit="handleOSINTSearch(event)">
                    <div class="form-group mb-4">
                        <label class="form-label">Provedor de Busca *</label>
                        <select id="osint-provider" class="form-input" required>
                            <option value="tavily">Tavily API (Busca Otimizada para IA) - Recomendado</option>
                            <option value="serpapi">SerpApi (Google Search API)</option>
                            <option value="scraperapi">ScraperApi (Web Scraping)</option>
                        </select>
                        <small class="text-gray-500">Escolha a tecnologia que será usada para varrer a internet.</small>
                    </div>

                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Matrícula / ID *</label>
                            <input type="text" id="osint-matricula" class="form-input" required placeholder="Ex: 12345-6">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nome do Alvo (Opcional)</label>
                            <input type="text" id="osint-name" class="form-input" placeholder="Nome completo para refinar busca">
                        </div>
                    </div>
                    
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Estado *</label>
                            <select id="osint-state" class="form-input" required onchange="loadCitiesForOSINT()">
                                <option value="">Selecione...</option>
                                <option value="AC">Acre (AC)</option>
                                <option value="AL">Alagoas (AL)</option>
                                <option value="AP">Amapá (AP)</option>
                                <option value="AM">Amazonas (AM)</option>
                                <option value="BA">Bahia (BA)</option>
                                <option value="CE">Ceará (CE)</option>
                                <option value="DF">Distrito Federal (DF)</option>
                                <option value="ES">Espírito Santo (ES)</option>
                                <option value="GO">Goiás (GO)</option>
                                <option value="MA">Maranhão (MA)</option>
                                <option value="MT">Mato Grosso (MT)</option>
                                <option value="MS">Mato Grosso do Sul (MS)</option>
                                <option value="MG">Minas Gerais (MG)</option>
                                <option value="PA">Pará (PA)</option>
                                <option value="PB">Paraíba (PB)</option>
                                <option value="PR">Paraná (PR)</option>
                                <option value="PE">Pernambuco (PE)</option>
                                <option value="PI">Piauí (PI)</option>
                                <option value="RJ">Rio de Janeiro (RJ)</option>
                                <option value="RN">Rio Grande do Norte (RN)</option>
                                <option value="RS">Rio Grande do Sul (RS)</option>
                                <option value="RO">Rondônia (RO)</option>
                                <option value="RR">Roraima (RR)</option>
                                <option value="SC">Santa Catarina (SC)</option>
                                <option value="SP">São Paulo (SP)</option>
                                <option value="SE">Sergipe (SE)</option>
                                <option value="TO">Tocantins (TO)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Cidade *</label>
                            <select id="osint-city" class="form-input" required>
                                <option value="">Selecione o Estado primeiro</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-actions mt-4 text-right">
                        <button type="submit" class="btn btn-primary" id="btn-osint-search">
                            <i class="fas fa-robot"></i> Iniciar Investigação IA
                        </button>
                    </div>
                </form>
            </div>

            <!-- Loading State -->
            <div id="osint-loading" style="display: none; text-align: center; padding: 40px;">
                <div class="flex flex-col items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p class="text-gray-600 font-medium">Buscando informações na web...</p>
                    <p class="text-xs text-gray-400 mt-2">Isso pode levar de 10 a 30 segundos.</p>
                </div>
            </div>
            
            <!-- Result Card -->
            <div id="osint-result" class="info-card" style="display: none; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 5px solid #48bb78;">
                <h3 style="color: #2d3748; margin-bottom: 15px;">
                    <i class="fas fa-file-contract" style="color: #48bb78;"></i> Relatório de Inteligência
                </h3>
                <div class="markdown-body" id="osint-report-content" style="font-size: 0.95rem; line-height: 1.6; color: #2d3748;">
                    <!-- Report content goes here -->
                </div>
            </div>
            
            <!-- History Section -->
            <div class="mt-8">
                <h3 style="margin-bottom: 15px; color: #4a5568;">Histórico de Buscas</h3>
                <div id="osint-history-list">
                    <!-- History items -->
                </div>
            </div>
        </div>
        
        <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .markdown-body h1, .markdown-body h2, .markdown-body h3 { margin-top: 1em; margin-bottom: 0.5em; font-weight: 600; color: #2d3748; }
            .markdown-body ul { padding-left: 20px; margin-bottom: 1em; }
            .markdown-body li { margin-bottom: 0.25em; }
            .markdown-body strong { color: #1a202c; }
        </style>
    `;

    document.getElementById('content-area').innerHTML = html;
    loadOSINTHistory();
}

async function loadCitiesForOSINT() {
    const state = document.getElementById('osint-state').value;
    const citySelect = document.getElementById('osint-city');

    if (!state) {
        citySelect.innerHTML = '<option value="">Selecione o Estado primeiro</option>';
        return;
    }

    citySelect.innerHTML = '<option>Carregando...</option>';

    try {
        const response = await fetch('data/municipios.json');
        const data = await response.json();
        const cities = data[state] || [];

        citySelect.innerHTML = cities.map(c => `<option value="${c}">${c}</option>`).join('');
    } catch (e) {
        console.error(e);
        citySelect.innerHTML = '<option>Erro ao carregar</option>';
    }
}

async function handleOSINTSearch(e) {
    e.preventDefault();

    const matricula = document.getElementById('osint-matricula').value;
    const city = document.getElementById('osint-city').value;
    const state = document.getElementById('osint-state').value;
    const name = document.getElementById('osint-name').value;
    const provider = document.getElementById('osint-provider').value; // PROVIDER

    const btn = document.getElementById('btn-osint-search');
    const loading = document.getElementById('osint-loading');
    const resultDiv = document.getElementById('osint-result');
    const resultContent = document.getElementById('osint-report-content');

    // UI State Loading
    btn.disabled = true;
    loading.style.display = 'block';
    resultDiv.style.display = 'none';

    try {
        const response = await fetchAPI('/osint/search', 'POST', {
            matricula, city, state, target_name: name, provider // PROVIDER
        });

        // Render Markdown (basic implementation or use a lib if available, here we assume text)
        // Converting newlines to <br> and bold to <strong> for simple md support without lib
        let formattedReport = response.report
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\* (.*?)(<br>|$)/g, '<li>$1</li>'); // Lists

        resultContent.innerHTML = formattedReport;
        resultDiv.style.display = 'block';

        // Refresh history
        loadOSINTHistory();

    } catch (error) {
        console.error('Frontend OSINT Error:', error);
        alert('Erro detalhado: ' + (error.details || error.message || error));
    } finally {
        btn.disabled = false;
        loading.style.display = 'none';
    }
}

async function loadOSINTHistory() {
    try {
        const history = await fetchAPI('/osint/history');
        const container = document.getElementById('osint-history-list');

        if (history.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Nenhuma busca realizada.</p>';
            return;
        }

        container.innerHTML = history.map(item => `
            <div class="card mb-2" style="padding: 15px; border-left: 4px solid #cbd5e0;">
                <div class="flex-between">
                    <div>
                        <strong>${item.target_id}</strong> - ${item.city}/${item.state}
                        <div class="text-sm text-gray-500">${new Date(item.created_at).toLocaleString()}</div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Erro ao carregar histórico', e);
    }
}
