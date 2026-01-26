/**
 * Módulo Datajus (Consulta Processual CNJ)
 * Portado de React para Vanilla JS
 */

const DATAJUS_API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";
const DATAJUS_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

const TRIBUNAIS_DATAJUS = [
    {
        label: "Tribunais Superiores", options: [
            { name: "TST - Superior do Trabalho", alias: "api_publica_tst" },
            { name: "TSE - Superior Eleitoral", alias: "api_publica_tse" },
            { name: "STJ - Superior de Justiça", alias: "api_publica_stj" },
            { name: "STM - Superior Militar", alias: "api_publica_stm" },
        ]
    },
    {
        label: "Justiça Federal", options: [
            { name: "TRF1 - 1ª Região", alias: "api_publica_trf1" },
            { name: "TRF2 - 2ª Região", alias: "api_publica_trf2" },
            { name: "TRF3 - 3ª Região", alias: "api_publica_trf3" },
            { name: "TRF4 - 4ª Região", alias: "api_publica_trf4" },
            { name: "TRF5 - 5ª Região", alias: "api_publica_trf5" },
            { name: "TRF6 - 6ª Região", alias: "api_publica_trf6" },
        ]
    },
    {
        label: "Justiça Estadual", options: [
            { name: "TJSP - São Paulo", alias: "api_publica_tjsp" },
            { name: "TJRJ - Rio de Janeiro", alias: "api_publica_tjrj" },
            { name: "TJMG - Minas Gerais", alias: "api_publica_tjmg" },
            { name: "TJRS - Rio Grande do Sul", alias: "api_publica_tjrs" },
            { name: "TJPR - Paraná", alias: "api_publica_tjpr" },
            { name: "TJBA - Bahia", alias: "api_publica_tjba" },
            { name: "TJDFT - Distrito Federal", alias: "api_publica_tjdft" },
            { name: "TJAC - Acre", alias: "api_publica_tjac" },
            { name: "TJAL - Alagoas", alias: "api_publica_tjal" },
            { name: "TJAM - Amazonas", alias: "api_publica_tjam" },
            { name: "TJAP - Amapá", alias: "api_publica_tjap" },
            { name: "TJCE - Ceará", alias: "api_publica_tjce" },
            { name: "TJES - Espírito Santo", alias: "api_publica_tjes" },
            { name: "TJGO - Goiás", alias: "api_publica_tjgo" },
            { name: "TJMA - Maranhão", alias: "api_publica_tjma" },
            { name: "TJMS - Mato Grosso do Sul", alias: "api_publica_tjms" },
            { name: "TJMT - Mato Grosso", alias: "api_publica_tjmt" },
            { name: "TJPA - Pará", alias: "api_publica_tjpa" },
            { name: "TJPB - Paraíba", alias: "api_publica_tjpb" },
            { name: "TJPE - Pernambuco", alias: "api_publica_tjpe" },
            { name: "TJPI - Piauí", alias: "api_publica_tjpi" },
            { name: "TJRN - Rio Grande do Norte", alias: "api_publica_tjrn" },
            { name: "TJRO - Rondônia", alias: "api_publica_tjro" },
            { name: "TJRR - Roraima", alias: "api_publica_tjrr" },
            { name: "TJSC - Santa Catarina", alias: "api_publica_tjsc" },
            { name: "TJSE - Sergipe", alias: "api_publica_tjse" },
            { name: "TJTO - Tocantins", alias: "api_publica_tjto" },
        ]
    },
    {
        label: "Justiça do Trabalho", options: Array.from({ length: 24 }, (_, i) => ({
            name: `TRT${i + 1} - ${i + 1}ª Região`,
            alias: `api_publica_trt${i + 1}`
        }))
    },
];

// --- VIEW LOADER ---
function loadDatajusView() {
    console.log('[FRONTEND] Loading Datajus View');
    document.getElementById('page-title').textContent = 'Consulta Datajus (CNJ)'; // Atualiza título

    // Renderiza o HTML base
    const html = `
    <div class="datajus-container" style="max-width: 1000px; margin: 0 auto; font-family: 'Inter', sans-serif;">
        
        <!-- Header Style Inspired from Original Code -->
        <div class="bg-gray-900 text-white p-6 shadow-lg rounded-xl mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="flex items-center gap-3">
                <div class="bg-blue-600 p-2 rounded-lg">
                    <i class="fas fa-balance-scale text-white text-2xl"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight">Datajus Explorer Pro</h1>
                    <p class="text-gray-400 text-sm">Consulta de Metadados Processuais (CNJ/TPU)</p>
                </div>
            </div>
            <div class="flex items-center gap-2 text-xs bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                <i class="fas fa-shield-alt text-green-400"></i>
                <span class="text-gray-300">API Key: Pública</span>
            </div>
        </div>

        <!-- Info Box -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800 flex items-start gap-3">
            <i class="fas fa-database mt-1"></i>
            <div>
                <strong>Nota Técnica:</strong> Esta ferramenta conecta-se diretamente à API oficial Datajud/CNJ.
                Caso haja bloqueio por CORS, um proxy de fallback será ativado automaticamente.
            </div>
        </div>

        <!-- Search Form -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <form id="datajus-form" onsubmit="handleDatajusSearch(event)">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="form-group">
                        <label class="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                            <i class="fas fa-building"></i> Tribunal / Órgão
                        </label>
                        <div class="relative">
                            <select id="datajus-tribunal" class="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium">
                                ${TRIBUNAIS_DATAJUS.map(group => `
                                    <optgroup label="${group.label}">
                                        ${group.options.map(opt => `<option value="${opt.alias}">${opt.name}</option>`).join('')}
                                    </optgroup>
                                `).join('')}
                            </select>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">Base de dados Datajud (Elasticsearch)</p>
                    </div>

                    <div class="form-group">
                        <label class="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                            <i class="fas fa-file-alt"></i> Número do Processo
                        </label>
                        <input type="text" id="datajus-processo" 
                            placeholder="Ex: 00008323520184013202"
                            class="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            oninput="this.value = formatProcessNumber(this.value)">
                        <p class="text-xs text-gray-500 mt-1">Digite apenas números (CNJ unificado)</p>
                    </div>
                </div>

                <button type="submit" id="btn-datajus-search" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 w-full transition-all shadow-md">
                    <i class="fas fa-search"></i> Executar Pesquisa
                </button>
            </form>
        </div>

        <!-- Loading -->
        <div id="datajus-loading" class="hidden flex flex-col items-center justify-center py-20 text-gray-400">
            <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
            <p>Conectando ao Datajud...</p>
        </div>

        <!-- Error -->
        <div id="datajus-error" class="hidden bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg shadow-sm">
            <div class="flex items-center gap-3">
                <i class="fas fa-exclamation-circle text-red-500 text-2xl"></i>
                <div>
                    <h3 class="font-bold text-red-700">Erro na Requisição</h3>
                    <p id="datajus-error-msg" class="text-red-600 text-sm mt-1"></p>
                </div>
            </div>
        </div>

        <!-- Results Area -->
        <div id="datajus-results" class="hidden space-y-6">
            <div class="flex justify-between items-end border-b border-gray-200 pb-2">
                <div>
                    <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Resultados da Pesquisa
                        <span id="proxy-badge" class="hidden text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200 flex items-center gap-1 font-normal">
                             <i class="fas fa-globe"></i> Via Proxy
                        </span>
                    </h2>
                    <p class="text-sm text-gray-500" id="datajus-stats"></p>
                </div>
            </div>

            <div id="datajus-list" class="grid gap-6">
                <!-- Cards Injected Here -->
            </div>
        </div>
    </div>
    `;

    document.getElementById('content-area').innerHTML = html;
}

// --- UTILS ---
function formatProcessNumber(val) {
    if (!val) return "";
    return val.replace(/\D/g, "").substring(0, 20);
}

function formatDate(isoString) {
    if (!isoString) return "-";
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch (e) {
        return isoString;
    }
}

function getTribunalUrl(tribunal, numeroProcesso) {
    if (!tribunal) return "#";
    const t = tribunal.toUpperCase().trim();
    const cleanNum = numeroProcesso ? numeroProcesso.replace(/\D/g, "") : "";

    // Lógica simplificada de URL (pode expandir conformne o original)
    if (t === "TST") return `https://consultaprocessual.tst.jus.br/consultaProcessual/`;
    if (t === "STJ") return `https://processo.stj.jus.br/processo/pesquisa/?src=1.1.2&aplicacao=processos.ea&tipoPesquisa=tipoPesquisaGenerica&num_registro=${cleanNum}`;

    // TRTs
    if (t.startsWith("TRT")) {
        const region = t.replace("TRT", "");
        return `https://pje.trt${region}.jus.br/consultaprocessual/`;
    }

    // Estaduais (Exemplos comuns)
    const estaduais = {
        "TJSP": "https://esaj.tjsp.jus.br/cpopg/open.do",
        "TJRJ": "https://www3.tjrj.jus.br/consultaprocessual/#/consultapublica",
        "TJMG": "https://pje.tjmg.jus.br/pje/ConsultaPublica/listView.seam",
    };
    if (estaduais[t]) return estaduais[t];

    return `https://www.google.com/search?q=consulta+processual+${t}+${cleanNum}`;
}

// --- LOGIC ---

async function handleDatajusSearch(e) {
    e.preventDefault();
    const tribunal = document.getElementById('datajus-tribunal').value;
    const processo = document.getElementById('datajus-processo').value;
    const btn = document.getElementById('btn-datajus-search');
    const loading = document.getElementById('datajus-loading');
    const resultsArea = document.getElementById('datajus-results');
    const errorArea = document.getElementById('datajus-error');
    const listArea = document.getElementById('datajus-list');
    const proxyBadge = document.getElementById('proxy-badge');

    // Reset UI
    loading.classList.remove('hidden');
    resultsArea.classList.add('hidden');
    errorArea.classList.add('hidden');
    proxyBadge.classList.add('hidden');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Pesquisando...';

    const queryBody = processo.trim()
        ? { query: { match: { numeroProcesso: processo.replace(/\D/g, "") } } }
        : { query: { match_all: {} } };

    // Payload Default Sort
    if (!queryBody.sort) {
        queryBody.sort = [{ "@timestamp": { "order": "asc" } }];
    }

    const directUrl = `${DATAJUS_BASE_URL}/${tribunal}/_search`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(directUrl)}`;

    try {
        let response;
        let isProxy = false;

        // Fetch Helper
        const doFetch = async (url) => {
            return fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `APIKey ${DATAJUS_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(queryBody)
            });
        };

        try {
            response = await doFetch(directUrl);
        } catch (err) {
            console.warn("Direct fetch failed, trying proxy...", err);
            response = await doFetch(proxyUrl);
            isProxy = true;
        }

        if (!response.ok) {
            if (response.status === 403) throw new Error("Acesso Negado (403). Verifique o tribunal.");
            if (response.status === 404) throw new Error("Endpoint não encontrado (404).");
            throw new Error(`Erro API: ${response.status}`);
        }

        const data = await response.json();

        // Render Results
        if (data.hits && data.hits.hits.length > 0) {
            renderResults(data, isProxy);
        } else {
            listArea.innerHTML = `
                <div class="bg-white p-12 text-center rounded-xl border border-dashed border-gray-300">
                    <i class="far fa-file-alt text-4xl text-gray-300 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-600">Nenhum processo encontrado</h3>
                </div>`;
            resultsArea.classList.remove('hidden');
        }

    } catch (error) {
        console.error(error);
        document.getElementById('datajus-error-msg').textContent = error.message;
        errorArea.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-search"></i> Executar Pesquisa';
    }
}

function renderResults(data, isProxy) {
    const listArea = document.getElementById('datajus-list');
    const resultsArea = document.getElementById('datajus-results');
    const stats = document.getElementById('datajus-stats');
    const proxyBadge = document.getElementById('proxy-badge');

    if (isProxy) proxyBadge.classList.remove('hidden');
    stats.textContent = `Encontrados ${data.hits.total.value} processos (${data.took}ms)`;

    listArea.innerHTML = data.hits.hits.map(hit => renderProcessCard(hit)).join('');
    resultsArea.classList.remove('hidden');
}

function renderProcessCard(hit) {
    const source = hit._source;
    const officialUrl = getTribunalUrl(source.tribunal, source.numeroProcesso);
    const formattedDate = formatDate(source.dataAjuizamento).split(' ')[0];
    const lastUpdate = formatDate(source.dataHoraUltimaAtualizacao);

    // Assuntos Tags
    let assuntosHtml = '';
    if (source.assuntos && source.assuntos.length) {
        assuntosHtml = source.assuntos.map(as => {
            const item = Array.isArray(as) ? as[0] : as;
            return `<span class="inline-block bg-indigo-50 text-indigo-800 text-xs px-2 py-1 rounded border border-indigo-100 mr-2 mb-1">${item?.nome || "?"}</span>`;
        }).join('');
    }

    // Timeline Loop
    let timelineHtml = '<div class="text-gray-500 text-sm py-2 italic pl-4">Nenhuma movimentação.</div>';
    if (source.movimentos && source.movimentos.length) {
        const sorted = [...source.movimentos].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora)).slice(0, 5);
        timelineHtml = sorted.map(mov => `
            <div class="relative pl-6 pb-4 border-l-2 border-gray-200 ml-2">
                <div class="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500"></div>
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-bold text-gray-800 text-sm">${mov.nome}</div>
                        ${mov.complementosTabelados ? mov.complementosTabelados.map(c => `<div class="text-xs text-gray-600 bg-gray-50 p-1 rounded mt-1">${c.descricao || c.valor}</div>`).join('') : ''}
                    </div>
                    <div class="text-right text-xs text-gray-500">
                        ${formatDate(mov.dataHora)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <!-- Header -->
        <div class="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
            <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-gray-700 text-lg select-all">${source.numeroProcesso}</span>
                ${source.nivelSigilo > 0 ? `<span class="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded uppercase"><i class="fas fa-shield-alt"></i> Sigilo ${source.nivelSigilo}</span>` : ''}
            </div>
            <a href="${officialUrl}" target="_blank" class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors">
                <i class="fas fa-external-link-alt"></i> Abrir Oficial
            </a>
        </div>

        <div class="p-5">
            <!-- Metadata -->
            <div class="flex flex-col md:flex-row justify-between mb-4 text-sm">
                <div class="space-y-1">
                    <div class="flex gap-2 mb-2">
                         <span class="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">${source.tribunal}</span>
                         <span class="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded border">${source.grau || "-"}</span>
                    </div>
                    <div class="font-semibold text-gray-900"><i class="fas fa-book text-blue-500"></i> ${source.classe?.nome || "Classe n/d"}</div>
                    <div class="text-gray-600"><i class="fas fa-university text-gray-400"></i> ${source.orgaoJulgador?.nome || "-"}</div>
                </div>
                <div class="text-right text-xs text-gray-500">
                    <div>Atualizado: <span class="font-mono text-gray-800">${lastUpdate}</span></div>
                    <div>Ajuizado: <span class="font-mono text-gray-800">${formattedDate}</span></div>
                </div>
            </div>

            <!-- Assuntos -->
            ${assuntosHtml ? `<div class="mb-4 text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><i class="fas fa-hashtag"></i> Assuntos</div><div class="mb-4 flex flex-wrap">${assuntosHtml}</div>` : ''}

            <!-- Timeline -->
            <div class="border-t border-gray-100 pt-3">
                 <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><i class="fas fa-history"></i> Últimas Movimentações</h4>
                 ${timelineHtml}
            </div>
        </div>
    </div>
    `;
}
