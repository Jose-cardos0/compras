// Serviço de WhatsApp com links diretos (WhatsApp Web)
// Solução simples e eficiente sem necessidade de APIs pagas

export async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    // Limpar e formatar o número
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55")
      ? cleanPhone
      : "55" + cleanPhone;

    // Encoding da mensagem para URL
    const encodedMessage = encodeURIComponent(message);

    // Gerar link do WhatsApp
    const whatsappURL = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    // Log da ação (para debug)
    console.log(`📱 GERANDO LINK WHATSAPP PARA: ${phoneNumber}`);
    console.log(`🔗 LINK: ${whatsappURL}`);
    console.log(`📝 MENSAGEM: ${message}`);

    // Abrir automaticamente o WhatsApp Web
    if (typeof window !== "undefined") {
      window.open(whatsappURL, "_blank");
      console.log("✅ Link do WhatsApp aberto automaticamente!");
    }

    return {
      success: true,
      whatsappURL: whatsappURL,
      phoneNumber: formattedPhone,
      message: message,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Erro ao gerar link WhatsApp:", error);
    throw error;
  }
}

// Função para apenas gerar o link sem abrir
export function generateWhatsAppLink(phoneNumber, message) {
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("55")
    ? cleanPhone
    : "55" + cleanPhone;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
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

// Função para envio em lote (abre múltiplas abas)
export function sendBulkWhatsAppMessages(contacts) {
  contacts.forEach((contact, index) => {
    setTimeout(() => {
      sendWhatsAppMessage(contact.phone, contact.message);
    }, index * 1000); // Delay de 1 segundo entre cada abertura
  });
}
