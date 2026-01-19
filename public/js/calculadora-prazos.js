/**
 * CALCULADORA DE PRAZOS V2
 * Reescrita completa para robustez e integração correta com Gemini AI.
 */

const CalculadoraApp = (() => {
    // === CONFIGURAÇÃO ===
    const CONFIG = {
        API_URL: window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api'
            : 'https://avada-consultoria-production.up.railway.app/api',
        TIMEOUT_MS: 45000, // 45 segundos para IA (margem segura)
        FERIADOS_NACIONAIS: [
            '01-01', '21-04', '01-05', '07-09', '12-10', '02-11', '15-11', '25-12'
        ]
    };

    // === STATE ===
    const state = {
        feriados: [],
        loading: false
    };

    // === UI HELPERS ===
    const UI = {
        btnCalcular: document.getElementById('calcularBtn'),
        btnEfetuarCalculo: document.getElementById('btnEfetuarCalculo'),
        divResultado: document.getElementById('resultado'),
        divFeriados: document.getElementById('lista-feriados'),
        spinner: document.querySelector('.spinner-border'),

        setLoading(isLoading) {
            state.loading = isLoading;
            if (this.spinner) this.spinner.classList.toggle('d-none', !isLoading);
            if (this.btnCalcular) {
                this.btnCalcular.disabled = isLoading;
                this.btnCalcular.textContent = isLoading ? 'Buscando...' : '1. Buscar Feriados (IA)';
            }
        },

        showError(msg) {
            const container = document.querySelector('.card-body');
            const alert = document.createElement('div');
            alert.className = 'alert alert-danger alert-dismissible fade show mt-3';
            alert.innerHTML = `
                <strong>Erro:</strong> ${msg}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            container.appendChild(alert);
            setTimeout(() => alert.remove(), 10000);
        },

        renderFeriados(feriados) {
            if (!this.divFeriados) return;

            if (feriados.length === 0) {
                this.divFeriados.innerHTML = '<div class="alert alert-info">Nenhum feriado encontrado no período.</div>';
                return;
            }

            let html = '<ul class="list-group mb-3">';
            feriados.forEach(f => {
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${formatDateBr(f.data)}</strong> - ${f.nome}
                            <span class="badge bg-secondary ms-2">${f.tipo || 'Feriado'}</span>
                        </div>
                        <input type="checkbox" checked class="form-check-input feriado-check" value="${f.data}">
                    </li>
                `;
            });
            html += '</ul>';
            this.divFeriados.innerHTML = html;
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

    /**
     * Busca Feriados via Gemini IA
     */
    async function buscarFeriadosIA() {
        const tribunal = document.getElementById('tribunal').value;
        const comarca = document.getElementById('comarca').value;
        const dataEvento = document.getElementById('dataEvento').value;
        const prazo = document.getElementById('prazoDias').value;

        // Validação
        if (!tribunal || !comarca || !dataEvento || !prazo) {
            UI.showError('Preencha todos os campos antes de buscar feriados.');
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
            console.log('[CALC] Iniciando busca IA:', { tribunal, comarca });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

            const response = await fetch(`${CONFIG.API_URL}/gemini/gemini-search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    expectJson: true
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[CALC] Erro API:', errorData);

                // Erro de Chave (400 ou 403)
                if (response.status === 400 || response.status === 403) {
                    throw new Error('Erro de Configuração da IA. Contate o suporte.');
                }

                // Erro de Servidor (500)
                throw new Error('Serviço de IA temporariamente indisponível.');
            }

            const data = await response.json();

            if (data.result && Array.isArray(data.result)) {
                state.feriados = data.result;
                UI.renderFeriados(state.feriados);

                // Mostra botão de calcular final
                if (UI.btnEfetuarCalculo) {
                    UI.btnEfetuarCalculo.parentElement.classList.remove('d-none');
                }
            } else {
                throw new Error('Formato de resposta inválido da IA.');
            }

        } catch (error) {
            console.error('[CALC] Erro Catch:', error);
            if (error.name === 'AbortError') {
                UI.showError('A busca demorou muito. Tente novamente.');
            } else {
                UI.showError(error.message);
            }
        } finally {
            UI.setLoading(false);
        }
    }

    /**
     * Calcula o Prazo Final (Logística Jurídica)
     */
    function calcularPrazoFinal() {
        const dataEvento = document.getElementById('dataEvento').value;
        const diasPrazo = parseInt(document.getElementById('prazoDias').value);
        const contagemDiasUteis = document.getElementById('tipoContagem').value === 'uteis';

        if (!dataEvento || !diasPrazo) return;

        // Captura feriados confirmados pelo usuário (checkboxes)
        const checkboxes = document.querySelectorAll('.feriado-check:checked');
        const feriadosConfirmados = Array.from(checkboxes).map(cb => cb.value);

        let dataAtual = new Date(dataEvento + 'T00:00:00'); // Fix timezone issue
        let diasContados = 0;
        let logCalculo = [];

        // Dia da Publicação (D) -> Início da contagem é D+1
        logCalculo.push(`Publicação: ${formatDateBr(dataEvento)}`);

        // Avança para o dia seguinte (Início do Prazo)
        dataAtual = addDays(dataAtual, 1);

        // Se o início cair em feriado/fds, prorroga o início
        while (true) {
            const dateStr = dataAtual.toISOString().split('T')[0];
            const ehFimDeSemana = isWeekend(dataAtual);
            const ehFeriado = isHoliday(dateStr, feriadosConfirmados);

            if (!ehFimDeSemana && !ehFeriado) break;

            logCalculo.push(`Prorrogado (${formatDateBr(dateStr)}): ${ehFeriado ? 'Feriado' : 'Fim de Semana'}`);
            dataAtual = addDays(dataAtual, 1);
        }

        const dataInicio = new Date(dataAtual);
        logCalculo.push(`<strong>Início da Contagem: ${formatDateBr(dataInicio.toISOString().split('T')[0])}</strong>`);

        // Loop de Contagem
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
                // logCalculo.push(`Dia ${diasContados}: ${formatDateBr(dateStr)}`);
            } else {
                // logCalculo.push(`Suspenso (${formatDateBr(dateStr)}): ${ehFeriado ? 'Feriado' : 'Fim de Semana'}`);
            }

            // Se for o último dia, verifica se cai em feriado/fds para prorrogar vencimento
            if (diasContados === diasPrazo) {
                // Prorrogação do vencimento
                while (true) {
                    const vencimentoStr = dataAtual.toISOString().split('T')[0];
                    const vencIsWeekend = isWeekend(dataAtual);
                    const vencIsHoliday = isHoliday(vencimentoStr, feriadosConfirmados);

                    if (!vencIsWeekend && !vencIsHoliday) break;

                    logCalculo.push(`Vencimento Prorrogado (${formatDateBr(vencimentoStr)}): ${vencIsHoliday ? 'Feriado' : 'Fim de Semana'}`);
                    dataAtual = addDays(dataAtual, 1);
                }
            } else {
                dataAtual = addDays(dataAtual, 1);
            }
        }

        const dataFinal = dataAtual.toISOString().split('T')[0];

        // Render Resultado
        UI.divResultado.innerHTML = `
            <div class="card bg-success text-white mt-3">
                <div class="card-body text-center">
                    <h3>Prazo Final: ${formatDateBr(dataFinal)}</h3>
                    <p class="mb-0">Contagem de ${diasPrazo} dias ${contagemDiasUteis ? 'úteis' : 'corridos'}</p>
                    <small>Início em: ${formatDateBr(dataInicio.toISOString().split('T')[0])}</small>
                </div>
            </div>
            <div class="mt-3 p-3 bg-light border rounded">
                <h6>Memória de Cálculo:</h6>
                <ul class="small mb-0 list-unstyled">
                    ${logCalculo.map(l => `<li>${l}</li>`).join('')}
                </ul>
            </div>
        `;

        UI.divResultado.classList.remove('d-none');
    }

    // === INIT ===
    function init() {
        if (UI.btnCalcular) {
            UI.btnCalcular.addEventListener('click', buscarFeriadosIA);
        }
        if (UI.btnEfetuarCalculo) {
            UI.btnEfetuarCalculo.addEventListener('click', calcularPrazoFinal);
        }
    }

    return { init };
})();

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', CalculadoraApp.init);
