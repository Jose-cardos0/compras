// Serviço de WhatsApp (simulado para demonstração)
// Para integração real, você pode usar APIs como Twilio, WhatsApp Business API, etc.

export async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    // Simulação do envio de mensagem via WhatsApp
    console.log(`📱 ENVIANDO WHATSAPP PARA: ${phoneNumber}`);
    console.log(`📝 MENSAGEM: ${message}`);
    console.log("✅ Mensagem enviada com sucesso!");

    // Aqui você integraria com uma API real de WhatsApp
    // Exemplo com Twilio:
    /*
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'From': 'whatsapp:+14155238886',
        'To': `whatsapp:${phoneNumber}`,
        'Body': message
      })
    });
    
    return await response.json();
    */

    // Simulação de resposta bem-sucedida
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem WhatsApp:", error);
    throw error;
  }
}

// Função para validar número de telefone
export function validatePhoneNumber(phone) {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, "");

  // Verifica se tem pelo menos 10 dígitos (formato brasileiro)
  if (cleanPhone.length < 10) {
    return false;
  }

  return true;
}

// Função para formatar número de telefone
export function formatPhoneNumber(phone) {
  const cleanPhone = phone.replace(/\D/g, "");

  // Adiciona código do país se não tiver
  if (cleanPhone.length === 11 && !cleanPhone.startsWith("55")) {
    return "+55" + cleanPhone;
  } else if (cleanPhone.length === 13 && cleanPhone.startsWith("55")) {
    return "+" + cleanPhone;
  }

  return phone;
}
