// Tabela de preços baseada na proposta TAC Corporation
const priceTable = {
    'sao-paulo': {
        'truck': {
            normal: { frete: 4300.00, pedagio: 123.30 },
            imo: { frete: 4945.00, pedagio: 123.30 }
        },
        'carreta-bau': {
            normal: { frete: 6450.00, pedagio: 396.90 },
            imo: { frete: 7417.50, pedagio: 396.90 }
        },
        'carreta-container': {
            normal: { frete: 6450.00, pedagio: 396.90 },
            imo: { frete: 7417.50, pedagio: 396.90 }
        },
        'rodo-trem': {
            normal: { frete: 10750.00, pedagio: 698.70 },
            imo: { frete: 11825.00, pedagio: 698.70 }
        }
    },
    'sorocaba': {
        'truck': {
            normal: { frete: 4750.00, pedagio: 182.70 },
            imo: { frete: 5462.00, pedagio: 182.70 }
        },
        'carreta-bau': {
            normal: { frete: 6850.00, pedagio: 548.10 },
            imo: { frete: 7850.00, pedagio: 548.10 }
        },
        'carreta-container': {
            normal: { frete: 6850.00, pedagio: 548.10 },
            imo: { frete: 7850.00, pedagio: 548.10 }
        },
        'rodo-trem': {
            normal: { frete: 11750.00, pedagio: 1035.30 },
            imo: { frete: 12900.00, pedagio: 1035.30 }
        }
    }
};

// Constantes para cálculos
const CONSTANTS = {
    AD_VALOREM_RATE: 0.001, // 0,10%
    GRIS_RATE: 0.0003, // 0,03%
    ISCA_RFI_COST: 294.12,
    ISCA_RFI_THRESHOLD_1: 700000, // R$ 700.000,00
    ISCA_RFI_THRESHOLD_2: 2000000, // R$ 2.000.000,00
    SEGURO_CASCO_CONTAINER: 30.00,
    AJUDANTES_COST: 583.85,
    ICMS_DIVISOR: 0.88 // Para calcular ICMS de 12%
};

// Formatação de moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Função para converter string de moeda para número
function parseCurrency(value) {
    if (typeof value === 'number') return value;
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

// Formatação do campo de valor da mercadoria
function setupCurrencyInput() {
    const input = document.getElementById('merchandiseValue');
    
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value === '') {
            e.target.value = '';
            return;
        }
        
        // Converte para centavos
        value = parseInt(value);
        
        // Formata como moeda
        const formatted = (value / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        });
        
        e.target.value = formatted;
    });
    
    input.addEventListener('focus', function(e) {
        if (e.target.value === 'R$ 0,00') {
            e.target.value = '';
        }
    });
}

// Função principal de cálculo
function calculateAllIn(formData) {
    const { operationType, vehicleType, destination, merchandiseValue } = formData;
    
    // Obter valores base da tabela
    const baseValues = priceTable[destination][vehicleType][operationType];
    const frete = baseValues.frete;
    const pedagio = baseValues.pedagio;
    
    // Calcular custos adicionais
    const adValorem = merchandiseValue * CONSTANTS.AD_VALOREM_RATE;
    const gris = merchandiseValue * CONSTANTS.GRIS_RATE;
    
    // Calcular Isca RFI
    let iscaRfi = 0;
    if (merchandiseValue > CONSTANTS.ISCA_RFI_THRESHOLD_2) {
        iscaRfi = CONSTANTS.ISCA_RFI_COST * 2; // Duas iscas
    } else if (merchandiseValue > CONSTANTS.ISCA_RFI_THRESHOLD_1) {
        iscaRfi = CONSTANTS.ISCA_RFI_COST; // Uma isca
    }
    
    // Calcular Seguro Casco Container
    let seguroCasco = 0;
    if (vehicleType === 'carreta-container') {
        seguroCasco = CONSTANTS.SEGURO_CASCO_CONTAINER * 1; // 1 container
    } else if (vehicleType === 'rodo-trem') {
        seguroCasco = CONSTANTS.SEGURO_CASCO_CONTAINER * 2; // 2 containers
    }
    
    // Ajudantes (fixo)
    const ajudantes = CONSTANTS.AJUDANTES_COST;
    
    // Soma de todos os custos antes do ICMS
    const subtotal = frete + pedagio + adValorem + gris + iscaRfi + seguroCasco + ajudantes;
    
    // Calcular ICMS (12% SC para SP)
    const totalComIcms = subtotal / CONSTANTS.ICMS_DIVISOR;
    const icms = totalComIcms - subtotal;
    
    return {
        frete,
        pedagio,
        adValorem,
        gris,
        iscaRfi,
        seguroCasco,
        ajudantes,
        icms,
        total: totalComIcms,
        operationType
    };
}

// Função para exibir resultados
function displayResults(results) {
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    
    const freteLabel = results.operationType === 'imo' ? 'Frete Químico Classificado' : 'Frete';
    
    resultContent.innerHTML = `
        <div class="cost-breakdown">
            <div class="cost-item">
                <span class="cost-label">${freteLabel}</span>
                <span class="cost-value">${formatCurrency(results.frete)}</span>
            </div>
            <div class="cost-item">
                <span class="cost-label">Pedágio</span>
                <span class="cost-value">${formatCurrency(results.pedagio)}</span>
            </div>
            <div class="cost-item">
                <span class="cost-label">Ad Valorem (0,10%)</span>
                <span class="cost-value">${formatCurrency(results.adValorem)}</span>
            </div>
            <div class="cost-item">
                <span class="cost-label">GRIS (0,03%)</span>
                <span class="cost-value">${formatCurrency(results.gris)}</span>
            </div>
            ${results.iscaRfi > 0 ? `
            <div class="cost-item">
                <span class="cost-label">Isca RFI</span>
                <span class="cost-value">${formatCurrency(results.iscaRfi)}</span>
            </div>
            ` : ''}
            ${results.seguroCasco > 0 ? `
            <div class="cost-item">
                <span class="cost-label">Seguro Casco Container</span>
                <span class="cost-value">${formatCurrency(results.seguroCasco)}</span>
            </div>
            ` : ''}
            <div class="cost-item">
                <span class="cost-label">Ajudantes</span>
                <span class="cost-value">${formatCurrency(results.ajudantes)}</span>
            </div>
            <div class="cost-item">
                <span class="cost-label">ICMS (12% SC para SP)</span>
                <span class="cost-value">${formatCurrency(results.icms)}</span>
            </div>
        </div>
        
        <div class="total-section">
            <div class="total-item">
                <span class="total-label">Valor Total Estimado (All-in)</span>
                <span class="total-value">${formatCurrency(results.total)}</span>
            </div>
        </div>
    `;
    
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    setupCurrencyInput();
    
    const form = document.getElementById('transportForm');
    const calculateBtn = form.querySelector('.btn-calculate');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Adicionar estado de loading
        calculateBtn.classList.add('loading');
        
        // Simular delay para melhor UX
        setTimeout(() => {
            try {
                // Coletar dados do formulário
                const formData = new FormData(form);
                const merchandiseValueStr = formData.get('merchandiseValue');
                const merchandiseValue = parseCurrency(merchandiseValueStr);
                
                if (merchandiseValue <= 0) {
                    alert('Por favor, insira um valor válido para a mercadoria.');
                    return;
                }
                
                const data = {
                    operationType: formData.get('operationType'),
                    vehicleType: formData.get('vehicleType'),
                    destination: formData.get('destination'),
                    merchandiseValue: merchandiseValue
                };
                
                // Calcular e exibir resultados
                const results = calculateAllIn(data);
                displayResults(results);
                
            } catch (error) {
                console.error('Erro no cálculo:', error);
                alert('Ocorreu um erro no cálculo. Por favor, verifique os dados e tente novamente.');
            } finally {
                calculateBtn.classList.remove('loading');
            }
        }, 500);
    });
});

// Função para limpar resultados quando o formulário for alterado
document.addEventListener('DOMContentLoaded', function() {
    const formInputs = document.querySelectorAll('#transportForm select, #transportForm input');
    const resultSection = document.getElementById('resultSection');
    
    formInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (resultSection.style.display === 'block') {
                resultSection.style.display = 'none';
            }
        });
    });
});