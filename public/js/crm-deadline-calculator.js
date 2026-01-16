// ==========================================
// CITIES DATA AND IA-POWERED CALCULATOR
// ==========================================

const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

// Brazilian cities by state (top cities + capital)
const citiesByState = {
    'AC': ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá'],
    'AL': ['Maceió', 'Arapiraca', 'Palmeira dos Índios', 'Rio Largo'],
    'AP': ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque'],
    'AM': ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru'],
    'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro', 'Ilhéus'],
    'CE': ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanú', 'Sobral', 'Crato'],
    'DF': ['Brasília'],
    'ES': ['Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Cachoeiro de Itapemirim'],
    'GO': ['Goiânia', 'Aparecida de Goiânia', 'Rio Verde', 'Luziânia', 'Anápolis'],
    'MA': ['São Luís', 'Imperatriz', 'Caxias', 'Timon', 'Codó'],
    'MT': ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra'],
    'MS': ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã'],
    'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba'],
    'PA': ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Castanhal'],
    'PB': ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux'],
    'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'Foz do Iguaçu'],
    'PE': ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Paulista', 'Caruaru', 'Petrolina'],
    'PI': ['Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano'],
    'RJ': ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Campos dos Goytacazes'],
    'RN': ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba'],
    'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí'],
    'RO': ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Cacoal', 'Vilhena'],
    'RR': ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Mucajaí'],
    'SC': ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma', 'Chapecó'],
    'SP': ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Ribeirão Preto', 'Sorocaba', 'Santos'],
    'SE': ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'Estância'],
    'TO': ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins']
};

// Load cities when state changes
function loadCitiesByState() {
    const stateSelect = document.getElementById('process-state');
    const citySelect = document.getElementById('process-city');
    const state = stateSelect.value;

    citySelect.innerHTML = '<option value="">Selecione...</option>';

    if (state && citiesByState[state]) {
        citiesByState[state].forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    } else if (state) {
        citySelect.innerHTML = '<option value="">Digite manualmente a cidade</option>';
    }
}

// Tornar funções globais para serem chamadas pelo HTML via onchange/onclick
window.loadCitiesByState = loadCitiesByState;
window.calculateProcessDeadline = calculateProcessDeadline;

// Calculadora de Prazos com IA integrada
async function calculateProcessDeadline() {
    const startDate = document.getElementById('deadline-start-date').value;
    const days = parseInt(document.getElementById('deadline-days').value);
    const state = document.getElementById('process-state').value;
    const city = document.getElementById('process-city').value;
    const tribunal = document.getElementById('process-court').value;

    if (!startDate) {
        document.getElementById('process-deadline').value = '';
        document.getElementById('deadline-info').textContent = 'Selecione a data inicial para calcular.';
        return;
    }

    if (!state || !city) {
        document.getElementById('deadline-info').innerHTML = '<span style="color: #e53e3e;">⚠️ Selecione Estado e Cidade para buscar feriados via IA.</span>';
        calculateSimpleDeadline(startDate, days);
        return;
    }

    // Show AI loading status
    document.getElementById('deadline-ai-status').style.display = 'block';
    document.getElementById('deadline-info').textContent = 'Consultando IA para feriados...';

    try {
        // Call AI to search for holidays
        const prompt = `Pesquise feriados municipais em ${city}-${state}, feriados estaduais de ${state} e feriados nacionais do Brasil entre ${startDate} e ${addDays(startDate, days + 15)}. Liste apenas as datas no formato DD/MM/YYYY e o nome do feriado.`;

        const response = await fetch(`${API_URL}/gemini/gemini-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, expectJson: false })
        });

        let aiHolidays = [];
        if (response.ok) {
            const data = await response.json();
            const holidayText = data.result || '';
            // Extract holidays from AI response (simple parsing)
            const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g;
            const matches = holidayText.match(dateRegex);
            if (matches) {
                aiHolidays = matches.map(d => {
                    const parts = d.split('/');
                    return `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert to YYYY-MM-DD
                });
            }
        }

        // Calculate deadline with AI-found holidays
        const finalDate = calculateDeadlineWithHolidays(startDate, days, aiHolidays);
        document.getElementById('process-deadline').value = finalDate;

        document.getElementById('deadline-ai-status').style.display = 'none';
        document.getElementById('deadline-info').innerHTML = `<span style="color: #38a169;">✓ Prazo calculado com feriados via IA (${aiHolidays.length} feriados encontrados)</span>`;

    } catch (error) {
        console.error('Erro na busca IA:', error);
        document.getElementById('deadline-ai-status').style.display = 'none';
        document.getElementById('deadline-info').innerHTML = '<span style="color: #e53e3e;">⚠️ Erro na busca IA. Cálculo simples aplicado.</span>';
        calculateSimpleDeadline(startDate, days);
    }
}

// Calculate deadline WITH AI-found holidays
function calculateDeadlineWithHolidays(startDate, businessDays, holidays = []) {
    let currentDate = new Date(startDate + 'T00:00:00');
    let count = 0;

    // Start counting from next business day
    currentDate.setDate(currentDate.getDate() + 1);

    while (count < businessDays) {
        const dayOfWeek = currentDate.getDay();
        const dateStr = formatDateToYYYYMMDD(currentDate);

        // Check if it's NOT a weekend and NOT a holiday
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateStr)) {
            count++;
        }

        if (count < businessDays) {
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    return formatDateToYYYYMMDD(currentDate);
}

// Simple deadline calculation (no AI)
function calculateSimpleDeadline(startDate, businessDays) {
    let currentDate = new Date(startDate + 'T00:00:00');
    let count = 0;

    currentDate.setDate(currentDate.getDate() + 1);

    while (count < businessDays) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        if (count < businessDays) {
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    document.getElementById('process-deadline').value = formatDateToYYYYMMDD(currentDate);
}

// Helper functions
function addDays(dateStr, days) {
    const date = new Date(dateStr + 'T00:00:00');
    date.setDate(date.getDate() + days);
    return formatDateToYYYYMMDD(date);
}

function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
