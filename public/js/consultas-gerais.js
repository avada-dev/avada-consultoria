/**
 * Módulo de Consultas Gerais
 * Gerencia links dinâmicos e abertura de popups
 */

// Função para formatar data YYYY-MM-DD
function getTodayDateISO() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Abre link em popup centralizado
function openPopup(url, title, w, h) {
    const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
    const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
    window.open(url, title, `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${w}, height=${h}, top=${y}, left=${x}`);
}

// Toggle do Submenu
function toggleConsultasMenu() {
    const submenu = document.getElementById('submenu-consultas');
    const icon = document.getElementById('icon-consultas-arrow');
    
    if (submenu.classList.contains('hidden')) {
        submenu.classList.remove('hidden');
        if(icon) icon.style.transform = 'rotate(180deg)';
    } else {
        submenu.classList.add('hidden');
        if(icon) icon.style.transform = 'rotate(0deg)';
    }
}

// Ações de Consulta
const ConsultasGerais = {
    pje: (tribunal) => {
        const date = getTodayDateISO();
        let url = '';
        
        if (tribunal === 'TJSP') {
            url = `https://comunica.pje.jus.br/consulta?siglaTribunal=TJSP&dataDisponibilizacaoInicio=${date}&dataDisponibilizacaoFim=${date}`;
        } else if (tribunal === 'TJRJ') {
            url = `https://comunica.pje.jus.br/consulta?siglaTribunal=TJRJ&dataDisponibilizacaoInicio=${date}&dataDisponibilizacaoFim=${date}`;
        } else if (tribunal === 'TJMG') {
            url = `https://comunica.pje.jus.br/consulta?siglaTribunal=TJMG&dataDisponibilizacaoInicio=${date}&dataDisponibilizacaoFim=${date}`;
        } else {
            url = 'https://comunica.pje.jus.br/';
        }
        
        // PJe abre em nova aba normal, pois é um sistema complexo
        window.open(url, '_blank');
    },

    jurisprudencia: () => {
        openPopup('https://modeloinicial.com.br/buscar-jurisprudencia', 'Jurisprudencia', 1000, 700);
    },

    radar: () => {
        openPopup('https://radar.serpro.gov.br/main.html#/cidadao', 'RADAR', 1000, 700);
    },

    inmetro: () => {
        openPopup('https://servicos.rbmlq.gov.br/Instrumento', 'INMETRO', 1000, 700);
    },

    inmetro2: () => {
        openPopup('https://servicos.rbmlq.gov.br/DeclaracoesConformidade', 'DeclaracaoConformidade', 1000, 700);
    },

    prf: (tipo) => {
        let url = '';
        if (tipo === 'radares-fixos') {
            url = 'https://www.gov.br/prf/pt-br/assuntos/fiscalizacao-de-velocidade/radares-fixos';
        } else if (tipo === 'trechos-criticos') {
            url = 'https://www.gov.br/prf/pt-br/assuntos/fiscalizacao-de-velocidade/trechos-criticos';
        } else if (tipo === 'lista-radares') {
            url = 'https://www.gov.br/prf/pt-br/assuntos/fiscalizacao-de-velocidade/lista-de-radares';
        }
        
        // PRF tem restrições de gov.br, abrir em popup
        if (url) openPopup(url, 'PRF', 1000, 700);
    }
};
