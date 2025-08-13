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
        'rodo-trem-bau': {
            normal: { frete: 10750.00, pedagio: 698.70 },
            imo: { frete: 11825.00, pedagio: 698.70 }
        },
        'carreta-container': {
            normal: { frete: 6450.00, pedagio: 396.90 },
            imo: { frete: 7417.50, pedagio: 396.90 }
        },
        'rodo-trem-container': {
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
        'rodo-trem-bau': {
            normal: { frete: 11750.00, pedagio: 1035.30 },
            imo: { frete: 12900.00, pedagio: 1035.30 }
        },
        'carreta-container': {
            normal: { frete: 6850.00, pedagio: 548.10 },
            imo: { frete: 7850.00, pedagio: 548.10 }
        },
        'rodo-trem-container': {
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
    ICMS_DIVISOR: 0.88, // Para calcular ICMS de 12%
    RODO_TREM_PALLETS_LIMIT: 48,
    RODO_TREM_WEIGHT_LIMIT: 48000
};

// Senha predefinida
const PASSWORD = "sym2025";


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

// Função para determinar o tipo de veículo
function determineVehicle(payloadType, pallets, totalWeight, containerQty) {
    if (payloadType === 'bau') {
        const weightInTons = totalWeight / 1000;
        if (pallets > CONSTANTS.RODO_TREM_PALLETS_LIMIT || totalWeight > CONSTANTS.RODO_TREM_WEIGHT_LIMIT) {
            throw new Error('Excedido por peso máximo 48TON ou 48 paletes. Favor cotar 2 ou mais veículos para a operação.');
        }
        
        if (pallets <= 16 && weightInTons <= 10) {
            return 'truck';
        } else if (pallets <= 28 && weightInTons <= 25) {
            return 'carreta-bau';
        } else if (pallets <= 48 && weightInTons <= 48) {
            return 'rodo-trem-bau';
        }
    } else if (payloadType === 'container') {
        if (containerQty === 1) {
            return 'carreta-container';
        } else if (containerQty === 2) {
            return 'rodo-trem-container';
        }
    }
    return null;
}

// Função principal de cálculo
function calculateAllIn(formData) {
    const { operationType, destination, merchandiseValue, payloadType, pallets, totalWeight, containerQty } = formData;
    
    const vehicleType = determineVehicle(payloadType, pallets, totalWeight, containerQty);
    
    if (!vehicleType) {
        throw new Error('Não foi possível determinar o tipo de veículo com base nas informações fornecidas.');
    }
    
    const baseValues = priceTable[destination][vehicleType][operationType];
    const frete = baseValues.frete;
    const pedagio = baseValues.pedagio;
    
    const adValorem = merchandiseValue * CONSTANTS.AD_VALOREM_RATE;
    const gris = merchandiseValue * CONSTANTS.GRIS_RATE;
    
    let iscaRfi = 0;
    if (merchandiseValue > CONSTANTS.ISCA_RFI_THRESHOLD_2) {
        iscaRfi = CONSTANTS.ISCA_RFI_COST * 2;
    } else if (merchandiseValue > CONSTANTS.ISCA_RFI_THRESHOLD_1) {
        iscaRfi = CONSTANTS.ISCA_RFI_COST;
    }
    
    let seguroCasco = 0;
    if (vehicleType === 'carreta-container') {
        seguroCasco = CONSTANTS.SEGURO_CASCO_CONTAINER * 1;
    } else if (vehicleType === 'rodo-trem-container') {
        seguroCasco = CONSTANTS.SEGURO_CASCO_CONTAINER * 2;
    }
    
    const ajudantes = CONSTANTS.AJUDANTES_COST;
    
    const subtotal = frete + pedagio + adValorem + gris + iscaRfi + seguroCasco + ajudantes;
    
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
        operationType,
        vehicleType
    };
}

// Função para exibir resultados e adicionar o evento de exportação
function displayResults(results) {
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    const exportBtn = document.getElementById('exportBtn');
    
    const freteLabel = results.operationType === 'imo' ? 'Frete Químico Classificado' : 'Frete';

    const vehicleNames = {
        'truck': 'Truck Baú',
        'carreta-bau': 'Carreta Baú',
        'rodo-trem-bau': 'Rodo-Trem Baú',
        'carreta-container': 'Carreta Porta Container',
        'rodo-trem-container': 'Rodo-Trem Porta Container'
    };
    
    resultContent.innerHTML = `
        <div class="vehicle-info">
            <p><strong>Veículo Selecionado:</strong> ${vehicleNames[results.vehicleType]}</p>
        </div>
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
    
    exportBtn.classList.remove('hidden');
    exportBtn.onclick = () => exportToExcel(results);
}

// Função para exportar os resultados para um arquivo Excel (XLS) com formatação
function exportToExcel(results) {
    const vehicleNames = {
        'truck': 'Truck Baú',
        'carreta-bau': 'Carreta Baú',
        'rodo-trem-bau': 'Rodo-Trem Baú',
        'carreta-container': 'Carreta Porta Container',
        'rodo-trem-container': 'Rodo-Trem Porta Container'
    };

    const freteLabel = results.operationType === 'imo' ? 'Frete Químico Classificado' : 'Frete';
    
    const sheetName = "Cálculo de Transporte";

    // Cria a tabela HTML com a formatação contábil
    let tableHtml = `
    <html>
        <head>
            <meta charset="utf-8">
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-family: Arial, sans-serif;
                }
                th, td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                .align-right {
                    text-align: right;
                }
                .align-center {
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <table>
                <thead>
                    <tr>
                        <th colspan="2" class="align-center" style="font-size: 20px;">Detalhes do Cálculo de Transporte</th>
                    </tr>
                    <tr>
                        <th>Item</th>
                        <th class="align-right">Valor (R$)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="2"><strong>Veículo: ${vehicleNames[results.vehicleType]}</strong></td>
                    </tr>
                    <tr>
                        <td>${freteLabel}</td>
                        <td class="align-right" style="mso-number-format:'\\0022R$\\0022\\ #,##0.00';">${results.frete.toFixed(2).replace('.', ',')}</td>
                    </tr>
                    <tr>
                        <td>Pedágio</td>
                        <td class="align-right" style="mso-number-format:'\\0022R$\\0022\\ #,##0.00';">${results.pedagio.toFixed(2).replace('.', ',')}</td>
                    </tr>
                    <tr>
                        <td>Ad Valorem (0,10%)</td>
                        <td class="align-right" style="mso-number-format:'\\0022R$\\0022\\ #,##0.00';">${results.adValorem.toFixed(2).replace('.', ',')}</td>
                    </tr>
                    <tr>
                        <td>GRIS (0,03%)</td>
                        <td class="align-right" style="mso-number-format:'\\0022R$\\0022\\ #,##0.00';">${results.gris.toFixed(2).replace('.', ',')}</td>
                    </tr>
    `;

    if (results.iscaRfi > 0) {
        tableHtml += `
            <tr>
                <td>Isca RFI</td>
                <td class="align-right" style="mso-number-format:'\\0022R$\\0022\\ #,##0.00';">${results.iscaRfi.toFixed(2).replace('.', ',')}</td>
            </tr>
        `;
    }

    if (results.seguroCasco > 0) {
        tableHtml += `
            <tr>
                <td>Seguro Casco Container</td>
                <td class="align-right" style="mso-number-format:'\\0022R$\\0022\\ #,##0.00';">${results.seguroCasco.toFixed(2).replace('.', ',')}</td>
            </tr>
        `;
    }
    
    tableHtml += `
                    <tr>
                        <td>Ajudantes</td>
                        <td class="align-right" style="mso-number-format:'\\0022R$\\0022\\ #,##0.00';">${results.ajudantes.toFixed(2).replace('.', ',')}</td>
                    </tr>
                    <tr>
                        <td>ICMS (12% SC para SP)</td>
                        <td class="align-right" style="mso-number-format:'\\0022R$\\0022\\ #,##0.00';">${results.icms.toFixed(2).replace('.', ',')}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold; background-color: #6d0000ff; color:#fff;">
                        <td>Valor Total Estimado (All-in)</td>
                        <td class="align-right" style="mso-number-format:'\\0022R$\\0022\\ #,##0.00';">${results.total.toFixed(2).replace('.', ',')}</td>
                    </tr>
                </tfoot>
            </table>
        </body>
    </html>
    `;

    const encodedUri = 'data:application/vnd.ms-excel,' + encodeURIComponent(tableHtml);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${sheetName.replace(/ /g, '_')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Função para gerenciar a visibilidade dos campos com base no tipo de carga
function setupFormLogic() {
    const payloadTypeRadios = document.querySelectorAll('input[name="payloadType"]');
    const bauOptions = document.getElementById('bauOptions');
    const containerOptions = document.getElementById('containerOptions');

    payloadTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'bau') {
                bauOptions.classList.remove('hidden');
                containerOptions.classList.add('hidden');
                document.getElementById('pallets').setAttribute('required', 'true');
                document.getElementById('totalWeight').setAttribute('required', 'true');
                document.getElementById('containerQty').removeAttribute('required');
                document.getElementById('containerQty').value = '';
            } else if (this.value === 'container') {
                containerOptions.classList.remove('hidden');
                bauOptions.classList.add('hidden');
                document.getElementById('containerQty').setAttribute('required', 'true');
                document.getElementById('pallets').removeAttribute('required');
                document.getElementById('totalWeight').removeAttribute('required');
                document.getElementById('pallets').value = '';
                document.getElementById('totalWeight').value = '';
            }
        });
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const passwordModal = document.getElementById('passwordModal');
    const passwordForm = document.getElementById('passwordForm');
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    const calculatorContainer = document.getElementById('calculatorContainer');

    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const enteredPassword = passwordInput.value;

        if (enteredPassword === PASSWORD) {
            passwordModal.classList.add('hidden');
            calculatorContainer.classList.remove('hidden');
            setupCurrencyInput();
            setupFormLogic();
        } else {
            passwordError.classList.remove('hidden');
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    const form = document.getElementById('transportForm');
    const calculateBtn = form.querySelector('.btn-calculate');
    const resultSection = document.getElementById('resultSection');
    const exportBtn = document.getElementById('exportBtn');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        calculateBtn.classList.add('loading');
        
        setTimeout(() => {
            try {
                const formData = new FormData(form);
                const merchandiseValueStr = formData.get('merchandiseValue');
                const merchandiseValue = parseCurrency(merchandiseValueStr);
                
                const payloadType = formData.get('payloadType');
                let pallets = 0;
                let totalWeight = 0;
                let containerQty = 0;

                if (payloadType === 'bau') {
                    pallets = parseInt(formData.get('pallets')) || 0;
                    totalWeight = parseInt(formData.get('totalWeight')) || 0;
                } else if (payloadType === 'container') {
                    containerQty = parseInt(formData.get('containerQty')) || 0;
                }

                if (merchandiseValue <= 0) {
                    alert('Por favor, insira um valor válido para a mercadoria.');
                    calculateBtn.classList.remove('loading');
                    return;
                }

                if (payloadType === 'bau' && (pallets <= 0 || totalWeight <= 0)) {
                     alert('Por favor, insira a quantidade de pallets e o peso total.');
                    calculateBtn.classList.remove('loading');
                    return;
                }

                if (payloadType === 'container' && containerQty <= 0) {
                     alert('Por favor, insira a quantidade de containers.');
                    calculateBtn.classList.remove('loading');
                    return;
                }
                
                const data = {
                    operationType: formData.get('operationType'),
                    destination: formData.get('destination'),
                    merchandiseValue: merchandiseValue,
                    payloadType: payloadType,
                    pallets: pallets,
                    totalWeight: totalWeight,
                    containerQty: containerQty
                };
                
                const results = calculateAllIn(data);
                displayResults(results);
                
            } catch (error) {
                console.error('Erro no cálculo:', error);
                alert(error.message);
            } finally {
                calculateBtn.classList.remove('loading');
            }
        }, 500);
    });

    const formInputs = document.querySelectorAll('#transportForm select, #transportForm input');
    
    formInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (resultSection.style.display === 'block') {
                resultSection.style.display = 'none';
                exportBtn.classList.add('hidden');
            }
        });
    });
});