// utils/pix.js
// Utilitário para gerar QR Code PIX Itaú

/**
 * Calcula CRC16-CCITT (usado no PIX)
 */
function calculateCRC16(data) {
  let crc = 0xFFFF;
  const polynomial = 0x1021;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera código PIX copia-e-cola (EMV) para pagamento
 * @param {Object} params - Parâmetros do pagamento
 * @param {string} params.chave - Chave PIX (CNPJ, CPF, email, telefone ou chave aleatória)
 * @param {number} params.valor - Valor em centavos
 * @param {string} params.descricao - Descrição do pagamento
 * @param {string} params.merchantName - Nome do recebedor
 * @param {string} params.merchantCity - Cidade do recebedor
 * @returns {string} Código PIX copia-e-cola
 */
function generatePixCode({ chave, valor, descricao, merchantName = 'Lunabê', merchantCity = 'Vargem Grande Paulista' }) {
  // Chave PIX Itaú fornecida
  const pixKey = chave || '63824145000127';
  
  // Valor em reais, formatado com 2 casas decimais
  const amount = (valor / 100).toFixed(2);
  
  // Construir payload PIX (formato EMV)
  let emvString = '';
  
  // Payload Format Indicator (00)
  emvString += '000201';
  
  // Merchant Account Information (26)
  const pixGui = 'br.gov.bcb.pix';
  const merchantInfo = `0014${pixGui}01${String(pixKey.length).padStart(2, '0')}${pixKey}`;
  emvString += `26${String(merchantInfo.length).padStart(2, '0')}${merchantInfo}`;
  
  // Merchant Category Code (52) - 0000 = não especificado
  emvString += '52040000';
  
  // Transaction Currency (53) - 986 = BRL
  emvString += '5303986';
  
  // Transaction Amount (54)
  const amountStr = amount.replace('.', '');
  emvString += `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;
  
  // Country Code (58) - BR
  emvString += '5802BR';
  
  // Merchant Name (59)
  emvString += `59${String(merchantName.length).padStart(2, '0')}${merchantName}`;
  
  // Merchant City (60)
  emvString += `60${String(merchantCity.length).padStart(2, '0')}${merchantCity}`;
  
  // Additional Data Field Template (62)
  const description = descricao || 'Pagamento Lunabê';
  const additionalData = `05${String(description.length).padStart(2, '0')}${description}`;
  emvString += `62${String(additionalData.length).padStart(2, '0')}${additionalData}`;
  
  // CRC16 (63) - calcular sobre a string + '6304'
  const dataForCrc = emvString + '6304';
  const crc = calculateCRC16(dataForCrc);
  emvString += `6304${crc}`;
  
  return emvString;
}

/**
 * Gera QR Code PIX completo com informações do pedido
 */
function generatePixForOrder(order, totalInCents) {
  const pixCode = generatePixCode({
    chave: '63824145000127', // Chave PIX Itaú
    valor: totalInCents,
    descricao: `Pedido ${order._id.toString().slice(-8)} - Lunabê`,
    merchantName: 'Lunabê',
    merchantCity: 'Vargem Grande Paulista',
  });
  
  return {
    qrCode: pixCode,
    chave: '63824145000127',
    valor: totalInCents / 100,
    descricao: `Pedido ${order._id.toString().slice(-8)} - Lunabê`,
  };
}

export default {
  generatePixCode,
  generatePixForOrder,
};

