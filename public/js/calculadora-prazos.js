/**
 * CALCULADORA DE PRAZOS V2 (Tailwind Integration)
 * Matches public/calculadora.html structure.
 */

const CalculadoraApp = (() => {
    // === CONFIGURAÇÃO ===
    const CONFIG = {
        API_URL: window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api'
            : 'https://avada-consultoria-production.up.railway.app/api',
        TIMEOUT_MS: 45000,
        FERIADOS_NACIONAIS: ['01-01', '21-04', '01-05', '07-09', '12-10', '02-11', '15-11', '25-12']
    };

    // === STATE ===
    const state = {
        feriados: [],
        loading: false
    };

    // === UI HELPERS ===
    const UI = {
        // Inputs
        tribunal: document.getElementById('tribunal'),
        comarca: document.getElementById('comarca'),
        dataEvento: document.getElementById('dataEvento'),
        prazoDias: document.getElementById('prazoDias'),

        // Buttons
        btnCalcular: document.getElementById('calcularBtn'),
        btnEfetuarCalculo: document.getElementById('doCalculateBtn'),

        // Containers (IDs from calculator.html)
        divParte2: document.getElementById('resultado'),
        divGeminiReport: document.getElementById('gemini-initial-report'),
        divFinalReport: document.getElementById('final-calculation-report'),
        divInputSummary: document.getElementById('input-summary'),
        divActionButtons: document.getElementById('action-buttons'),

        setLoading(isLoading) {
            state.loading = isLoading;
            if (this.btnCalcular) {
                this.btnCalcular.disabled = isLoading;
                if (isLoading) {
                    this.btnCalcular.innerHTML = `
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Buscando Feriados...
                    `;
                } else {
                    this.btnCalcular.textContent = '1. Buscar Feriados (IA)';
                }
            }
        },

        showError(msg) {
            // Remove existing alerts
            const existing = document.getElementById('custom-alert');
            if (existing) existing.remove();

            const container = document.getElementById('input-section');
            const alert = document.createElement('div');
            alert.id = 'custom-alert';
            alert.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4';
            alert.role = 'alert';
            alert.innerHTML = `
                <strong class="font-bold">Erro:</strong>
                <span class="block sm:inline">${msg}</span>
                <span class="absolute top-0 bottom-0 right-0 px-4 py-3" onclick="this.parentElement.remove()">
                    <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                </span>
            `;
            container.prepend(alert);
            setTimeout(() => { if (alert) alert.remove() }, 10000);
        },

        renderFeriados(feriados) {
            // Show result container
            this.divParte2.classList.remove('hidden');
            this.divInputSummary.classList.remove('hidden');
            this.divActionButtons.classList.remove('hidden');

            // Populate Summary
            document.getElementById('res-tribunal').textContent = this.tribunal.value;
            document.getElementById('res-comarca').textContent = this.comarca.value;
            document.getElementById('res-data').textContent = formatDateBr(this.dataEvento.value);
            document.getElementById('res-prazo').textContent = this.prazoDias.value + ' dias';

            let html = '<h4 class="text-md font-bold text-gray-800 mb-2">Feriados Identificados (IA):</h4>';

            if (feriados.length === 0) {
                html += '<div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert"><p>Nenhum feriado encontrado no período de 60 dias.</p></div>';
            } else {
                html += '<ul class="space-y-2">';
                feriados.forEach(f => {
                    html += `
                        <li class="bg-white border rounded p-3 flex justify-between items-center shadow-sm">
                            <div>
                                <span class="font-bold text-indigo-600">${formatDateBr(f.data)}</span>
                                <span class="ml-2 text-gray-700 font-medium">${f.nome}</span>
                                <span class="ml-2 text-xs bg-gray-200 text-gray-600 py-1 px-2 rounded-full">${f.tipo || 'Feriado'}</span>
                            </div>
                            <label class="inline-flex items-center">
                                <input type="checkbox" checked class="form-checkbox h-5 w-5 text-indigo-600 feriado-check" value="${f.data}">
                                <span class="ml-2 text-gray-600 text-sm">Considerar</span>
                            </label>
                        </li>
                    `;
                });
                html += '</ul>';
            }

            this.divGeminiReport.innerHTML = html;
        }
    };

    // === LOGIC ===
    function formatDateBr(dateStr) {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    }

    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    function isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6; // 0=Dom, 6=Sab
    }

    function isHoliday(dateStr, feriadosLocais) {
        const dateKey = dateStr.slice(5); // MM-DD
        if (CONFIG.FERIADOS_NACIONAIS.includes(dateKey)) return true;
        return feriadosLocais.includes(dateStr);
    }

    async function buscarFeriadosIA() {
        const tribunal = UI.tribunal.value;
        const comarca = UI.comarca.value;
        const dataEvento = UI.dataEvento.value; // YYYY-MM-DD
        const prazo = UI.prazoDias.value;

        if (!tribunal || !comarca || !dataEvento || !prazo) {
            UI.showError('Preencha os campos: Tribunal, Comarca, Data e Prazo.');
            return;
        }

        UI.setLoading(true);

        const prompt = `
            Atue como um especialista jurídico brasileiro.
            Liste os feriados e suspensões de prazo forense para o Tribunal: ${tribunal}, Comarca: ${comarca}.
            Período: a partir de ${formatDateBr(dataEvento)} até 60 dias à frente.
            
            Retorne APENAS um JSON estrito no seguinte formato, sem markdown:
            [
                {"data": "YYYY-MM-DD", "nome": "Nome do Feriado", "tipo": "Nacional/Estadual/Municipal/Suspensão"}
            ]
        `;

        try {
            console.log('[CALC] Iniciando busca IA:', { tribunal, comarca, dataEvento });

            // AbortController para Timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

            const response = await fetch(`${CONFIG.API_URL}/gemini/gemini-search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, expectJson: true }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[CALC] Erro API:', errorData);

                const err = new Error(errorData.error || 'Erro ao comunicar com a IA');
                err.details = errorData.details;
                err.debug_key_prefix = errorData.debug_key_prefix;
                throw err;
            }

            const data = await response.json();

            if (data.result && Array.isArray(data.result)) {
                state.feriados = data.result;
                UI.renderFeriados(state.feriados);
            } else {
                state.feriados = []; // Fallback empty
                UI.renderFeriados([]);
                // throw new Error('A IA não retornou uma lista válida de feriados.');
            }

        } catch (error) {
            console.error('[CALC] Erro Catch:', error);

            let msg = error.message || 'Erro desconhecido.';

            // Tratamento específico para erro da API Gemini (vindo do backend)
            if (msg === 'Erro na API Gemini' && error.details) {
                if (error.debug_key_prefix === 'undefined') {
                    msg = 'ERRO CRÍTICO: A Chave de API (GEMINI_API_KEY) não está configurada no Railway. Verifique as Variáveis de Ambiente.';
                } else {
                    msg = `Erro na API Gemini: ${JSON.stringify(error.details.error?.message || error.details)}`;
                }
            } else if (msg.includes('Configuration')) {
                msg = 'Erro de Configuração da IA. Verifique se a chave de API é válida.';
            }

            // Se for timeout
            if (error.name === 'AbortError') {
                msg = 'O tempo limite da requisição foi excedido. Tente novamente.';
            }

            UI.showError(msg);
        } finally {
            UI.setLoading(false);
        }
    }

    function calcularPrazoFinal() {
        const tipoContagemEl = document.querySelector('input[name="tipoContagem"]:checked');
        const contagemDiasUteis = tipoContagemEl ? tipoContagemEl.value === 'uteis' : true;
        const dataEvento = UI.dataEvento.value;
        const diasPrazo = parseInt(UI.prazoDias.value);

        if (!dataEvento || !diasPrazo) {
            UI.showError('Dados inválidos para cálculo.');
            return;
        }

        const checkboxes = document.querySelectorAll('.feriado-check:checked');
        const feriadosConfirmados = Array.from(checkboxes).map(cb => cb.value);

        // Ajuste de timezone para evitar problemas de "dia anterior"
        // Criar data baseada no input YYYY-MM-DD e setar hora para meio-dia
        let dataAtual = new Date(dataEvento + 'T12:00:00');
        let diasContados = 0;
        let logCalculo = [];

        logCalculo.push(`Publicação: ${formatDateBr(dataEvento)}`);

        // Dia seguinte (Início do Prazo)
        dataAtual = addDays(dataAtual, 1);

        // Prorroga início se cair em feriado/fds
        while (true) {
            const dateStr = dataAtual.toISOString().split('T')[0];
            const ehFimDeSemana = isWeekend(dataAtual);
            const ehFeriado = isHoliday(dateStr, feriadosConfirmados);

            if (!ehFimDeSemana && !ehFeriado) break;

            logCalculo.push(`<span class="text-xs text-orange-600">Prorrogado (${formatDateBr(dateStr)}): ${ehFeriado ? 'Feriado' : 'Fim de Semana'}</span>`);
            dataAtual = addDays(dataAtual, 1);
        }

        const dataInicio = new Date(dataAtual);
        logCalculo.push(`<strong>Início da Contagem: ${formatDateBr(dataInicio.toISOString().split('T')[0])}</strong>`);

        while (diasContados < diasPrazo) {
            const dateStr = dataAtual.toISOString().split('T')[0];
            const ehFimDeSemana = isWeekend(dataAtual);
            const ehFeriado = isHoliday(dateStr, feriadosConfirmados);

            let contabiliza = true;
            if (contagemDiasUteis) {
                if (ehFimDeSemana || ehFeriado) contabiliza = false;
            }

            if (contabiliza) {
                diasContados++;
            } else {
                // logCalculo.push(`Suspenso (${formatDateBr(dateStr)})`);
            }

            if (diasContados === diasPrazo) {
                // Verificar vencimento
                while (true) {
                    const vencimentoStr = dataAtual.toISOString().split('T')[0];
                    const vencIsWeekend = isWeekend(dataAtual);
                    const vencIsHoliday = isHoliday(vencimentoStr, feriadosConfirmados);

                    if (!vencIsWeekend && !vencIsHoliday) break;

                    logCalculo.push(`<span class="text-xs text-red-600">Vencimento Prorrogado (${formatDateBr(vencimentoStr)}): ${vencIsHoliday ? 'Feriado' : 'Fim de Semana'}</span>`);
                    dataAtual = addDays(dataAtual, 1);
                }
            } else {
                dataAtual = addDays(dataAtual, 1);
            }
        }

        const dataFinal = dataAtual.toISOString().split('T')[0];

        // Render Resultado Final
        UI.divFinalReport.innerHTML = `
            <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow mt-6">
                <div class="flex items-center">
                    <div class="py-1"><svg class="fill-current h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/></svg></div>
                    <div>
                        <p class="font-bold text-xl">Prazo Final: ${formatDateBr(dataFinal)}</p>
                        <p class="text-sm">Contagem de ${diasPrazo} dias ${contagemDiasUteis ? 'úteis' : 'corridos'}</p>
                    </div>
                </div>
            </div>
            
            <div class="mt-4 p-4 bg-gray-50 rounded border text-sm text-gray-600">
                 <h5 class="font-bold mb-2">Memória de Cálculo (Início/Prorrogações):</h5>
                 <ul class="list-disc pl-5">
                    ${logCalculo.map(l => `<li>${l}</li>`).join('')}
                 </ul>
            </div>
        `;
    }

    // === INIT ===
    function init() {
        console.log('[CALC] Inicializando Calculadora V2...');

        if (UI.btnCalcular) {
            UI.btnCalcular.addEventListener('click', buscarFeriadosIA);
            console.log('[CALC] Listener adicionado ao btnCalcular');
        } else {
            console.error('[CALC] btnCalcular não encontrado!');
        }

        if (UI.btnEfetuarCalculo) {
            UI.btnEfetuarCalculo.addEventListener('click', calcularPrazoFinal);
            console.log('[CALC] Listener adicionado ao btnEfetuarCalculo');
        }
    }

    return { init };
})();

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', CalculadoraApp.init);
