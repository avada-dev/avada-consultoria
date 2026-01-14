const axios = require('axios');

/**
 * Calculadora de Prazos Processuais
 * Segue regras do CPC (Lei 13.105/2015) e CNJ
 * - Prazos contam em dias úteis
 * - Não contam: sábados, domingos, feriados
 * - Prazo inicia no primeiro dia útil após publicação
 */

// Cache de feriados para evitar múltiplas requisições
const holidaysCache = {};

/**
 * Busca feriados nacionais de um ano
 */
async function fetchNationalHolidays(year) {
    const cacheKey = `national_${year}`;

    if (holidaysCache[cacheKey]) {
        return holidaysCache[cacheKey];
    }

    try {
        const response = await axios.get(`https://brasilapi.com.br/api/feriados/v1/${year}`);
        const holidays = response.data.map(h => new Date(h.date + 'T00:00:00'));
        holidaysCache[cacheKey] = holidays;
        return holidays;
    } catch (error) {
        console.error('Erro ao buscar feriados nacionais:', error.message);
        return [];
    }
}

/**
 * Verifica se uma data é dia útil
 */
function isWorkingDay(date, holidays = []) {
    const dayOfWeek = date.getDay();

    // Sábado (6) ou Domingo (0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
    }

    // Verifica se é feriado
    const dateStr = date.toISOString().split('T')[0];
    const isHoliday = holidays.some(holiday => {
        const holidayStr = holiday.toISOString().split('T')[0];
        return holidayStr === dateStr;
    });

    return !isHoliday;
}

/**
 * Calcula o prazo fatal baseado em data de publicação
 * @param {Date|string} publicationDate - Data da publicação/intimação
 * @param {number} deadlineDays - Número de dias do prazo
 * @param {string} city - Cidade (para feriados municipais)
 * @param {string} state - Estado (para feriados estaduais)
 * @returns {Object} { fatalDeadline, workingDaysAdded, holidaysFound, info }
 */
async function calculateFatalDeadline(publicationDate, deadlineDays, city = null, state = null) {
    let currentDate = new Date(publicationDate);

    // Normalizar hora para evitar problemas de timezone
    currentDate.setHours(0, 0, 0, 0);

    // Buscar feriados do ano
    const year = currentDate.getFullYear();
    const nextYear = year + 1;

    let holidays = [];
    try {
        const currentYearHolidays = await fetchNationalHolidays(year);
        const nextYearHolidays = await fetchNationalHolidays(nextYear);
        holidays = [...currentYearHolidays, ...nextYearHolidays];
    } catch (error) {
        console.error('Erro ao buscar feriados:', error);
    }

    const holidaysFound = [];
    let workingDaysAdded = 0;

    // Começar no próximo dia útil após a publicação
    currentDate.setDate(currentDate.getDate() + 1);

    // Contar dias úteis
    while (workingDaysAdded < deadlineDays) {
        if (isWorkingDay(currentDate, holidays)) {
            workingDaysAdded++;
        } else {
            // Registrar feriado ou fim de semana
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                holidaysFound.push({
                    date: new Date(currentDate),
                    type: dayOfWeek === 0 ? 'Domingo' : 'Sábado'
                });
            } else {
                holidaysFound.push({
                    date: new Date(currentDate),
                    type: 'Feriado Nacional'
                });
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Retroceder um dia para pegar o último dia útil contado
    currentDate.setDate(currentDate.getDate() - 1);

    // Informações sobre o cálculo
    const info = {
        totalCalendarDays: Math.ceil((currentDate - new Date(publicationDate)) / (1000 * 60 * 60 * 24)),
        workingDays: workingDaysAdded,
        weekendDays: holidaysFound.filter(h => h.type !== 'Feriado Nacional').length,
        holidays: holidaysFound.filter(h => h.type === 'Feriado Nacional').length
    };

    return {
        fatalDeadline: currentDate,
        workingDaysAdded,
        holidaysFound,
        info
    };
}

/**
 * Formata informações sobre feriados e fins de semana
 */
function formatHolidaysInfo(holidaysFound) {
    if (holidaysFound.length === 0) {
        return 'Nenhum feriado ou fim de semana no período.';
    }

    const messages = [];

    holidaysFound.forEach(h => {
        const dateStr = h.date.toLocaleDateString('pt-BR');
        messages.push(`${dateStr} - ${h.type}`);
    });

    return messages.join('; ');
}

module.exports = {
    calculateFatalDeadline,
    isWorkingDay,
    fetchNationalHolidays,
    formatHolidaysInfo
};
