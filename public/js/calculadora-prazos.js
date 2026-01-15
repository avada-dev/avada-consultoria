// --- CHAVE DA API GEMINI ---
const GEMINI_API_KEY = "AIzaSyCDcLLQol77KpeOqpa3U0lmfwc1uHUHdAY";

// --- LÓGICA DE DATAS ---
function getEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

function getVariableHolidays(year) {
    const easter = getEaster(year);
    const holidays = {};
    const carnival = new Date(easter);
    carnival.setDate(easter.getDate() - 47);
    holidays[formatDateToKey(carnival)] = "Carnaval";
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    holidays[formatDateToKey(goodFriday)] = "Sexta-feira Santa";
    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);
    holidays[formatDateToKey(corpusChristi)] = "Corpus Christi";
    return holidays;
}

const fixedHolidays = {
    'NACIONAL': {
        '01-01': 'Confraternização Universal',
        '04-21': 'Tiradentes',
        '05-01': 'Dia do Trabalho',
        '09-07': 'Independência do Brasil',
        '10-12': 'Nossa Senhora Aparecida',
        '11-02': 'Finados',
        '11-15': 'Proclamação da República',
        '12-25': 'Natal'
    },
    'AC-RIOBRANCO': { '01-23': 'Dia do Evangélico (Estadual)', '06-15': 'Aniversário do Estado do Acre', '12-28': 'Aniversário de Rio Branco' },
    'AP-MACAPA': { '03-19': 'Dia de São José', '07-25': 'São Tiago', '09-13': 'Criação do Território Federal (Estadual)', '02-04': 'Aniversário de Macapá' },
    'AM-MANAUS': { '09-05': 'Elevação do Amazonas à Categoria de Província', '11-20': 'Dia da Consciência Negra (Estadual)', '10-24': 'Aniversário de Manaus' },
    'AL-MACEIO': { '06-24': 'São João', '06-29': 'São Pedro', '09-16': 'Emancipação Política de Alagoas', '12-05': 'Aniversário de Maceió' },
    'BA-SALVADOR': { '07-02': 'Independência da Bahia' },
    'CE-FORTALEZA': { '03-19': 'São José (Estadual)', '03-25': 'Data Magna do Ceará', '08-15': 'Nossa Senhora da Assunção', '04-13': 'Aniversário de Fortaleza' },
    'DF-BRASILIA': { '04-21': 'Fundação de Brasília', '11-30': 'Dia do Evangélico' },
    'ES-VITORIA': { '09-08': 'Aniversário de Vitória' },
    'GO-GOIANIA': { '10-24': 'Aniversário de Goiânia' },
    'MA-SAOLUIS': { '07-28': 'Adesão do Maranhão à Independência', '09-08': 'Aniversário de São Luís' },
    'MG-BELOHORIZONTE': { '04-21': 'Data Magna de MG (Tiradentes)', '08-15': 'Assunção de Nossa Senhora', '12-08': 'Imaculada Conceição', '12-12': 'Aniversário de Belo Horizonte' },
    'MS-CAMPOGRANDE': { '10-11': 'Criação do Estado', '08-26': 'Aniversário de Campo Grande' },
    'MT-CUIABA': { '11-20': 'Consciência Negra (Estadual)', '04-08': 'Aniversário de Cuiabá' },
    'PA-BELEM': { '08-15': 'Adesão do Grão-Pará à Independência', '01-12': 'Aniversário de Belém' },
    'PB-JOAOPESSOA': { '08-05': 'Fundação do Estado / Aniversário de João Pessoa', '12-08': 'Nossa Sra. da Conceição' },
    'PE-RECIFE': { '03-06': 'Data Magna de Pernambuco (Revolução Pernambucana)', '06-24': 'São João', '07-16': 'Nossa Senhora do Carmo (Padroeira de Recife)' },
    'PI-TERESINA': { '10-19': 'Dia do Piauí', '08-16': 'Aniversário de Teresina' },
    'PR-CURITIBA': { '08-19': 'Emancipação Política do Paraná', '09-08': 'Nossa Senhora da Luz dos Pinhais (Padroeira)', '03-29': 'Aniversário de Curitiba' },
    'RJ-RIODEJANEIRO': { '01-20': 'São Sebastião', '04-23': 'São Jorge', '11-20': 'Consciência Negra' },
    'RN-NATAL': { '12-25': 'Natal' },
    'RS-PORTOALEGRE': { '09-20': 'Revolução Farroupilha', '02-02': 'Aniversário de Porto Alegre' },
    'RO-PORTOVELHO': { '01-04': 'Criação de Rondônia', '06-18': 'Dia do Evangélico' },
    'RR-BOAVISTA': { '10-05': 'Criação de Roraima' },
    'SC-FLORIANOPOLIS': { '08-11': 'Dia de Santa Catarina', '03-23': 'Aniversário de Florianópolis' },
    'SP-SAOPAULO': { '01-25': 'Aniversário de São Paulo', '07-09': 'Revolução Constitucionalista', '11-20': 'Consciência Negra' },
    'SE-ARACAJU': { '07-08': 'Emancipação de Sergipe', '03-17': 'Aniversário de Aracaju' },
    'TO-PALMAS': { '09-08': 'Nossa Senhora da Natividade (Padroeira do Estado)', '10-05': 'Criação do Estado', '05-20': 'Aniversário de Palmas' }
};

const tribunalToLocalidadeMap = {
    'STF': 'DF-BRASILIA', 'STJ': 'DF-BRASILIA',
    'TRF1': 'DF-BRASILIA', 'TRF2': 'RJ-RIODEJANEIRO', 'TRF3': 'SP-SAOPAULO',
    'TRF4': 'RS-PORTOALEGRE', 'TRF5': 'PE-RECIFE', 'TRF6': 'MG-BELOHORIZONTE',
    'TJAC': 'AC-RIOBRANCO', 'TJAL': 'AL-MACEIO', 'TJAP': 'AP-MACAPA', 'TJAM': 'AM-MANAUS',
    'TJBA': 'BA-SALVADOR', 'TJCE': 'CE-FORTALEZA', 'TJDF': 'DF-BRASILIA', 'TJES': 'ES-VITORIA',
    'TJGO': 'GO-GOIANIA', 'TJMA': 'MA-SAOLUIS', 'TJMT': 'MT-CUIABA', 'TJMS': 'MS-CAMPOGRANDE',
    'TJMG': 'MG-BELOHORIZONTE', 'TJPA': 'PA-BELEM', 'TJPB': 'PB-JOAOPESSOA', 'TJPR': 'PR-CURITIBA',
    'TJPE': 'PE-RECIFE', 'TJPI': 'PI-TERESINA', 'TJRJ': 'RJ-RIODEJANEIRO', 'TJRN': 'RN-NATAL',
    'TJRS': 'RS-PORTOALEGRE', 'TJRO': 'RO-PORTOVELHO', 'TJRR': 'RR-BOAVISTA', 'TJSC': 'SC-FLORIANOPOLIS',
    'TJSP': 'SP-SAOPAULO', 'TJSE': 'SE-ARACAJU', 'TJTO': 'TO-PALMAS'
};

function formatDateToKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatToDisplayDate(date, options = {}) {
    const opts = { day: '2-digit', month: '2-digit', year: 'numeric', ...options };
    return date.toLocaleDateString('pt-BR', opts);
}

function isBusinessDay(date, localidade) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return { isBusiness: false, reason: 'Final de semana' };
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if ((month === 12 && day >= 20) || (month === 1 && day <= 20)) return { isBusiness: false, reason: 'Recesso Forense' };
    const year = date.getFullYear();
    const dateKey = formatDateToKey(date);
    const monthDayKey = dateKey.substring(5);
    const variableHolidays = getVariableHolidays(year);
    if (variableHolidays[dateKey]) return { isBusiness: false, reason: variableHolidays[dateKey] };
    if (fixedHolidays.NACIONAL[monthDayKey]) return { isBusiness: false, reason: fixedHolidays.NACIONAL[monthDayKey] };
    if (localidade !== 'BR-NACIONAL' && fixedHolidays[localidade] && fixedHolidays[localidade][monthDayKey])
        return { isBusiness: false, reason: fixedHolidays[localidade][monthDayKey] };
    return { isBusiness: true, reason: '' };
}

function getNextBusinessDay(date, localidade) {
    let nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    while (!isBusinessDay(nextDay, localidade).isBusiness) {
        nextDay.setDate(nextDay.setDate() + 1);
    }
    return nextDay;
}

// Auto-select corridos for specific case types
document.getElementById('tipoCausa').addEventListener('change', function () {
    const valor = this.value;
    const radios = document.getElementsByName('tipoContagem');
    if (['jec_est', 'jefp_est', 'jef_fed', 'penal'].includes(valor)) {
        radios[1].checked = true; // Suggest Corridos
    } else {
        radios[0].checked = true; // Suggest Úteis
    }
});

document.getElementById('calcularBtn').addEventListener('click', async () => {
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.classList.remove('hidden');

    document.getElementById('gemini-initial-report').innerHTML = `<div class="flex items-center text-sm text-blue-600"><div class="loader"></div>Consultando IA...</div>`;
    document.getElementById('action-buttons').classList.add('hidden');
    document.getElementById('deep-research-container').classList.remove('hidden');
    document.getElementById('calculate-container').classList.remove('hidden');
    document.getElementById('final-calculation-report').innerHTML = '';
    document.getElementById('deep-research-results').classList.add('hidden');

    fillReportSummary();

    const tribunal = document.getElementById('tribunal');
    const comarca = document.getElementById('comarca').value;
    const nomeTribunal = tribunal.options[tribunal.selectedIndex].text;
    const localidade = tribunalToLocalidadeMap[tribunal.value] || 'BR-NACIONAL';
    let dataEventoStr = document.getElementById('dataEvento').value;
    let prazoDias = parseInt(document.getElementById('prazoDias').value, 10);
    const publicacaoTexto = document.getElementById('publicacaoTexto').value;

    // IA JSON Extraction
    if (publicacaoTexto && (!dataEventoStr || !prazoDias)) {
        let extracaoPrompt = `Analise o texto: "${publicacaoTexto}". Extraia data publicação e prazo. Retorne JSON: {"data_evento": "YYYY-MM-DD", "prazo_dias": N}`;
        try {
            const extractedData = await callGemini(extracaoPrompt, true);
            if (!dataEventoStr && extractedData.data_evento) {
                dataEventoStr = extractedData.data_evento;
                document.getElementById('dataEvento').value = dataEventoStr;
                document.getElementById('res-data').textContent = formatToDisplayDate(new Date(dataEventoStr + 'T00:00:00'));
            }
            if (extractedData.prazo_dias) {
                prazoDias = extractedData.prazo_dias;
                document.getElementById('prazoDias').value = prazoDias;
                document.getElementById('res-prazo').textContent = prazoDias + ' dias';
            }
        } catch (e) { console.error("Erro extração IA:", e); }
    }

    if (!dataEventoStr) {
        document.getElementById('gemini-initial-report').innerHTML = `<div class="p-4 bg-red-100 border-l-4 border-red-500 text-red-700"><p><strong>Erro:</strong> Informe a Data da Publicação.</p></div>`;
        return;
    }

    // Busca Feriados (IA)
    const dataEvento = new Date(dataEventoStr + 'T00:00:00');
    const dataFinalTemp = new Date(dataEvento);
    dataFinalTemp.setDate(dataFinalTemp.getDate() + prazoDias + 20);

    const publicacaoContexto = publicacaoTexto ? `Baseado no texto: "${publicacaoTexto}".` : "";
    const comarcaCidade = comarca || localidade.split('-')[1].replace(/_/g, ' ');
    const promptFeriados = `Pesquise feriados, suspensões e calendário do tribunal "${nomeTribunal}" em "${comarcaCidade}" entre ${formatToDisplayDate(dataEvento)} e ${formatToDisplayDate(dataFinalTemp)}. ${publicacaoContexto}. Gere relatório em lista.`;

    let geminiText;
    try {
        geminiText = await callGemini(promptFeriados, false);
    } catch (error) {
        console.error("Erro IA Feriados:", error);
        geminiText = `<div class="text-xs text-red-600 mt-2"><strong>Busca IA falhou (CORS/Rede).</strong> Verifique conexão.</div>`;
    }

    document.getElementById('gemini-initial-report').innerHTML = `${geminiText.startsWith('<div') ? geminiText : `<h3 class="text-sm font-semibold text-gray-700 mt-4 border-b pb-2">Relatório da Pesquisa Inicial (IA):</h3><div class="text-xs text-gray-600 whitespace-pre-wrap mt-2">${geminiText}</div>`}`;
    document.getElementById('action-buttons').classList.remove('hidden');

    document.getElementById('deepResearchBtn').onclick = () => {
        const calcData = getCalculationDates();
        if (!calcData) return;
        triggerDeepResearch(calcData.inicioContagem, calcData.dataFinal, nomeTribunal, comarcaCidade);
    };

    document.getElementById('doCalculateBtn').onclick = () => {
        performLocalCalculation(document.getElementById('final-calculation-report'));
    };
});

function fillReportSummary() {
    const tribunalSelect = document.getElementById('tribunal');
    const causaSelect = document.getElementById('tipoCausa');
    const eventoSelect = document.getElementById('tipoEvento');
    const textoPub = document.getElementById('publicacaoTexto').value;
    const dataVal = document.getElementById('dataEvento').value;

    const tipoContagemRadio = document.querySelector('input[name="tipoContagem"]:checked');
    const tipoContagemTexto = tipoContagemRadio ? tipoContagemRadio.parentElement.innerText.trim() : 'N/A';

    document.getElementById('input-summary').classList.remove('hidden');
    document.getElementById('res-tribunal').textContent = tribunalSelect.options[tribunalSelect.selectedIndex].text;
    document.getElementById('res-comarca').textContent = document.getElementById('comarca').value || 'Não informada';
    document.getElementById('res-causa').textContent = causaSelect.options[causaSelect.selectedIndex].text;
    document.getElementById('res-tipo-contagem').textContent = tipoContagemTexto;

    if (textoPub.trim()) {
        document.getElementById('res-texto-container').classList.remove('hidden');
        document.getElementById('res-texto').textContent = textoPub;
    } else {
        document.getElementById('res-texto-container').classList.add('hidden');
    }

    if (dataVal) document.getElementById('res-data').textContent = formatToDisplayDate(new Date(dataVal + 'T00:00:00'));
    document.getElementById('res-prazo').textContent = document.getElementById('prazoDias').value + ' dias';
    document.getElementById('res-tipo-evento').textContent = eventoSelect.options[eventoSelect.selectedIndex].text;
}

// Gemini API Call
async function callGemini(prompt, expectJson = false) {
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    if (expectJson) {
        payload.generationConfig = { responseMimeType: "application/json" };
    } else {
        payload.tools = [{ "google_search": {} }];
    }

    const response = await fetch(apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Erro API: ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Resposta vazia.");
    if (expectJson) {
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);
    }
    return text;
}

async function triggerDeepResearch(inicioContagem, dataFinal, nomeTribunal, comarcaCidade) {
    const deepContainer = document.getElementById('deep-research-container');
    const deepResults = document.getElementById('deep-research-results');
    deepContainer.innerHTML = `<div class="flex items-center text-sm text-blue-600"><div class="loader"></div>Pesquisando...</div>`;
    deepResults.classList.remove('hidden');
    deepResults.innerHTML = '';

    const prompt = `Deep Research: suspensões, portarias e atos do tribunal "${nomeTribunal}" em "${comarcaCidade}" entre ${formatToDisplayDate(inicioContagem)} e ${formatToDisplayDate(dataFinal)}.`;
    let text;
    try {
        text = await callGemini(prompt, false);
    } catch (e) {
        text = `Erro: ${e.message}`;
    }

    deepContainer.innerHTML = `<button id="deepResearchBtn" class="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700">Realizar Pesquisa Aprofundada</button>`;
    document.getElementById('deepResearchBtn').onclick = () => {
        const calcData = getCalculationDates();
        if (calcData) triggerDeepResearch(calcData.inicioContagem, calcData.dataFinal, nomeTribunal, comarcaCidade);
    };

    deepResults.innerHTML = `<h3 class="text-lg font-semibold text-gray-800 mt-4 border-t pt-4">Relatório Deep Research</h3><div class="text-sm text-gray-700 whitespace-pre-wrap mt-2">${text}</div>`;
}

function getCalculationDates() {
    const tribunal = document.getElementById('tribunal').value;
    const tipoCausa = document.getElementById('tipoCausa').value;
    const localidade = tribunalToLocalidadeMap[tribunal] || 'BR-NACIONAL';
    let dataEventoStr = document.getElementById('dataEvento').value;
    const tipoEvento = document.getElementById('tipoEvento').value;
    let prazoDias = parseInt(document.getElementById('prazoDias').value, 10);
    const dataEvento = new Date(dataEventoStr + 'T00:00:00');

    if (tipoCausa === 'penal' || tipoEvento === 'citacao_tacita_privada' || !dataEventoStr) return null;

    let holidaysInRange = {};
    let termoInicial;

    switch (tipoEvento) {
        case 'publicacao_dje':
        case 'juntada_ar_mandado':
            termoInicial = getNextBusinessDay(dataEvento, localidade);
            break;
        case 'citacao_confirmada_dje':
            termoInicial = new Date(dataEvento);
            let d = 0;
            while (d < 5) {
                termoInicial.setDate(termoInicial.getDate() + 1);
                if (isBusinessDay(termoInicial, localidade).isBusiness) d++;
            }
            break;
        case 'intimacao_confirmada_dje':
            termoInicial = new Date(dataEvento);
            if (!isBusinessDay(termoInicial, localidade).isBusiness) {
                termoInicial = getNextBusinessDay(termoInicial, localidade);
            }
            break;
        case 'intimacao_tacita':
        case 'citacao_tacita_publica':
            termoInicial = new Date(dataEvento);
            termoInicial.setDate(termoInicial.getDate() + 10);
            break;
        default:
            termoInicial = getNextBusinessDay(dataEvento, localidade);
    }
    while (!isBusinessDay(termoInicial, localidade).isBusiness) termoInicial.setDate(termoInicial.getDate() + 1);

    const inicioContagem = new Date(termoInicial);
    let dataFinal = new Date(inicioContagem);

    const tipoContagem = document.querySelector('input[name="tipoContagem"]:checked').value;
    const isCorridos = tipoContagem === 'corridos';

    if (isCorridos) {
        dataFinal.setDate(dataFinal.getDate() + prazoDias - 1);
        while (!isBusinessDay(dataFinal, localidade).isBusiness) {
            const c = isBusinessDay(dataFinal, localidade);
            if (!holidaysInRange[formatDateToKey(dataFinal)])
                holidaysInRange[formatDateToKey(dataFinal)] = c.reason;
            dataFinal.setDate(dataFinal.getDate() + 1);
        }
    } else {
        let count = 1;
        if (!isBusinessDay(dataFinal, localidade).isBusiness)
            holidaysInRange[formatDateToKey(dataFinal)] = isBusinessDay(dataFinal, localidade).reason;
        while (count < prazoDias) {
            dataFinal.setDate(dataFinal.getDate() + 1);
            if (isBusinessDay(dataFinal, localidade).isBusiness) {
                count++;
            } else {
                holidaysInRange[formatDateToKey(dataFinal)] = isBusinessDay(dataFinal, localidade).reason;
            }
        }
        while (!isBusinessDay(dataFinal, localidade).isBusiness) {
            holidaysInRange[formatDateToKey(dataFinal)] = isBusinessDay(dataFinal, localidade).reason;
            dataFinal.setDate(dataFinal.getDate() + 1);
        }
    }
    return { dataEvento, tipoEvento, termoInicial, inicioContagem, prazoDias, dataFinal, holidaysInRange, isCorridos };
}

function performLocalCalculation(container) {
    const calcData = getCalculationDates();
    if (!calcData) {
        const tipoCausa = document.getElementById('tipoCausa').value;
        const dataEvento = new Date(document.getElementById('dataEvento').value + 'T00:00:00');
        if (tipoCausa === 'penal') {
            let ini = new Date(dataEvento);
            ini.setDate(ini.getDate() + 1);
            let fim = new Date(ini);
            fim.setDate(fim.getDate() + parseInt(document.getElementById('prazoDias').value) - 1);
            displayPenalResult(container, dataEvento, new Date(dataEvento), ini, 0, fim);
        } else {
            displayPrivateCitationError(container);
        }
        return;
    }
    const { dataEvento, tipoEvento, termoInicial, inicioContagem, prazoDias, dataFinal, holidaysInRange, isCorridos } = calcData;
    const nomeEvento = document.getElementById('tipoEvento').options[document.getElementById('tipoEvento').selectedIndex].text;
    const holidaysHtml = Object.entries(holidaysInRange).map(([date, reason]) => `<li><span class="font-semibold">${formatToDisplayDate(new Date(date + 'T00:00:00'))}</span>: ${reason}</li>`).join('');
    const tipoPrazoTexto = isCorridos ? 'dias corridos' : 'dias úteis';

    container.innerHTML = `<h2 class="text-xl font-bold text-gray-800 mb-4 border-t pt-4">Resultado da Contagem (${tipoPrazoTexto})</h2> 
    <div class="space-y-3 text-sm"> 
        <div class="flex justify-between"> 
            <span class="text-gray-600">Data do Evento:</span> 
            <span class="font-semibold">${formatToDisplayDate(dataEvento)}</span> 
        </div> 
        <div class="flex justify-between"> 
            <span class="text-gray-600">Tipo de Evento:</span> 
            <span class="font-semibold text-right">${nomeEvento}</span> 
        </div> 
        <hr> 
        <div class="flex justify-between"> 
            <span class="text-gray-600">Termo Inicial (Art. 224):</span> 
            <span class="font-semibold">${formatToDisplayDate(termoInicial)}</span> 
        </div> 
        <div class="flex justify-between"> 
            <span class="text-gray-600">Início da Contagem (Dia 1):</span> 
            <span class="font-semibold">${formatToDisplayDate(inicioContagem)}</span> 
        </div> 
        <div class="flex justify-between"> 
            <span class="text-gray-600">Prazo:</span> 
            <span class="font-semibold">${prazoDias} ${tipoPrazoTexto}</span> 
        </div> 
    </div> 
    <div class="mt-6 bg-indigo-100 p-4 rounded-lg text-center"> 
        <p class="text-sm text-indigo-800">O prazo final é</p> 
        <p class="text-2xl font-bold text-indigo-900">${formatToDisplayDate(dataFinal, { weekday: 'long' })}</p> 
    </div> 
    ${holidaysHtml ? `<div class="mt-4"> <h3 class="text-sm font-semibold text-gray-700">Dias não úteis (base interna):</h3> <ul class="text-xs text-gray-600 list-disc list-inside mt-2">${holidaysHtml}</ul> </div>` : ''}`;
}

function displayPenalResult(container, dataEvento, termoInicial, inicioContagem, prazoDias, dataFinal) {
    container.innerHTML = `<h2 class="text-xl font-bold text-gray-800 mb-4 border-t pt-4">Resultado da Contagem (Processo Penal)</h2><div class="p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 mb-4 text-sm"><p><strong>Atenção:</strong> Dias corridos.</p></div><div class="space-y-3 text-sm"><div class="flex justify-between"><span class="text-gray-600">Prazo Final:</span><span class="font-semibold text-xl text-indigo-900">${formatToDisplayDate(dataFinal, { weekday: 'long' })}</span></div></div>`;
}

function displayPrivateCitationError(container) {
    container.innerHTML = `<h2 class="text-xl font-bold text-gray-800 mb-4 border-t pt-4">Atenção - Regra CNJ</h2> <div class="p-4 bg-red-100 border-l-4 border-red-500 text-red-700"><p><strong>O PRAZO NÃO SE INICIA.</strong></p></div>`;
}
