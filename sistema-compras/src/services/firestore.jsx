import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  getDoc,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { sendWhatsAppMessage, generateWhatsAppLink } from "./whatsapp";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase/config";

// Serviços para Pedidos
export const ordersService = {
  // Função para gerar ID numérico sequencial
  async generateSequentialId() {
    try {
      // Referência para o documento que controla os IDs sequenciais
      const counterRef = doc(db, "counters", "orderIds");

      // Usar transação para garantir atomicidade
      const result = await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);

        let currentId = 1;
        if (counterDoc.exists()) {
          currentId = counterDoc.data().currentId + 1;
        }

        // Atualizar o contador
        transaction.set(counterRef, { currentId }, { merge: true });

        return currentId;
      });

      // Retornar ID formatado com zeros à esquerda (ex: 0001, 0002, etc.)
      return result.toString().padStart(4, "0");
    } catch (error) {
      console.error("Erro ao gerar ID sequencial:", error);
      // Fallback: usar timestamp se falhar
      return Date.now().toString().slice(-4);
    }
  },

  // Função para formatar data no formato brasileiro (DD/MM/YYYY)
  formatDateToBR(dateString) {
    if (!dateString) return "";

    // Se a data está no formato YYYY-MM-DD (input date), trata como string para evitar timezone
    if (
      typeof dateString === "string" &&
      dateString.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    }

    // Para outros formatos, tenta converter para data
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    // Se não conseguir converter, retorna a string original
    return dateString;
  },

  // Obter emoji do status
  getStatusEmoji(status) {
    const statusEmojis = {
      pendente: "⏳",
      em_analise: "✓",
      em_andamento: "⚡",
      cancelado: "✗",
      entregue: "✓",
    };
    return statusEmojis[status] || "❓";
  },

  // Obter label do status
  getStatusLabel(status) {
    const statusLabels = {
      pendente: "Pendente",
      em_analise: "Em Análise",
      em_andamento: "Em Andamento",
      cancelado: "Cancelado/Negado",
      entregue: "Entregue",
    };
    return statusLabels[status] || status;
  },

  // Criar novo pedido
  async createOrder(orderData) {
    try {
      // Gerar ID numérico sequencial
      const sequentialId = await this.generateSequentialId();

      // Criar documento com ID personalizado
      const orderRef = doc(db, "orders", sequentialId);
      await setDoc(orderRef, {
        ...orderData,
        orderNumber: sequentialId, // Manter o número do pedido nos dados
        status: "pendente",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Criar mensagem específica para o ADMIN sobre novo pedido
      let adminMessage = `❗ *NOVO PEDIDO RECEBIDO!*\n\n`;
      adminMessage += `*ID do Pedido:* ${sequentialId}\n\n`;
      adminMessage += `*Cliente:* ${orderData.nomeCompleto}\n`;
      adminMessage += `*Setor:* ${orderData.setor}\n`;
      adminMessage += `*WhatsApp:* ${orderData.whatsapp}\n`;
      adminMessage += `*Setor Destino:* ${
        orderData.setorDestino === "Outro"
          ? orderData.setorOutro
          : orderData.setorDestino
      }\n\n`;

      if (orderData.produtos && orderData.produtos.length > 0) {
        adminMessage += `*${orderData.produtos.length} Produto${
          orderData.produtos.length > 1 ? "s" : ""
        } Solicitado${orderData.produtos.length > 1 ? "s" : ""}:*\n\n`;
        orderData.produtos.forEach((produto, index) => {
          adminMessage += `${index + 1}. *${produto.produto}*\n`;
          adminMessage += `   Quantidade: ${produto.quantidade} ${
            produto.metrica || "UN"
          }\n`;
          adminMessage += `   Especificações: ${produto.especificacoes}\n`;
          adminMessage += `   Motivo: ${produto.motivo}\n\n`;
        });
      } else if (orderData.produto) {
        adminMessage += `*Produto:* ${orderData.produto}\n\n`;
      }

      adminMessage += `⚡ Acesse o painel administrativo para gerenciar este pedido.`;

      // Enviar notificação automática para o ADMIN
      const result = await sendWhatsAppMessage("79991820085", adminMessage);

      return {
        id: sequentialId,
        whatsappResult: result,
      };
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      throw error;
    }
  },

  // Buscar todos os pedidos
  async getAllOrders() {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      throw error;
    }
  },

  // Atualizar status do pedido geral
  async updateOrderStatus(orderId, status, additionalData = {}, userInfo = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);

      // Primeiro, buscar os dados atuais do pedido
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Pedido não encontrado");
      }

      const orderData = orderDoc.data();

      // Preparar atualização dos produtos (se existirem)
      let updatedProducts = [];
      if (orderData.produtos && Array.isArray(orderData.produtos)) {
        // ATUALIZAR TODOS OS PRODUTOS PARA O MESMO STATUS GERAL
        updatedProducts = orderData.produtos.map((produto) => ({
          ...produto,
          status, // Forçar o status geral em TODOS os produtos
          ...additionalData, // Aplicar dados adicionais (como data de previsão, motivo cancelamento)
          updatedAt: new Date(),
          lastModifiedBy:
            userInfo.name || userInfo.email || "Usuário não identificado",
          lastModifiedByEmail: userInfo.email || "email@naoidentificado.com",
          lastModifiedAt: new Date(),
        }));
      }

      // Criar histórico de alteração para o pedido geral
      const statusUpdate = {
        status,
        ...additionalData,
        produtos: updatedProducts, // Incluir produtos atualizados
        updatedAt: serverTimestamp(),
        lastModifiedBy:
          userInfo.name || userInfo.email || "Usuário não identificado",
        lastModifiedByEmail: userInfo.email || "email@naoidentificado.com",
        lastModifiedAt: serverTimestamp(),
      };

      // Atualizar no banco de dados
      await updateDoc(orderRef, statusUpdate);

      // Enviar notificação sobre a atualização geral
      const result = await this.sendOrderStatusNotification(
        { ...orderData, id: orderId }, // Incluir o ID no orderData
        status,
        additionalData
      );

      return result;
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      throw error;
    }
  },

  // Atualizar responsável do pedido
  async updateOrderResponsible(orderId, responsavel, userInfo = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);

      // Atualizar responsável
      const responsibleUpdate = {
        responsavel,
        updatedAt: serverTimestamp(),
        lastModifiedBy:
          userInfo.name || userInfo.email || "Usuário não identificado",
        lastModifiedByEmail: userInfo.email || "email@naoidentificado.com",
        lastModifiedAt: serverTimestamp(),
      };

      await updateDoc(orderRef, responsibleUpdate);

      return {
        success: true,
        message: `Responsável ${
          responsavel ? `atribuído: ${responsavel}` : "removido"
        } com sucesso!`,
        orderId: orderId,
      };
    } catch (error) {
      console.error("Erro ao atualizar responsável do pedido:", error);
      throw error;
    }
  },

  // Atualizar status de produto individual
  async updateProductStatus(
    orderId,
    productId,
    status,
    additionalData = {},
    userInfo = {}
  ) {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        throw new Error("Pedido não encontrado");
      }

      const orderData = orderDoc.data();

      if (!orderData.produtos || !Array.isArray(orderData.produtos)) {
        throw new Error("Estrutura de produtos inválida");
      }

      // Atualizar o produto específico
      const updatedProducts = orderData.produtos.map((produto) => {
        if (produto.id === productId) {
          return {
            ...produto,
            status,
            ...additionalData,
            updatedAt: new Date(),
            lastModifiedBy:
              userInfo.name || userInfo.email || "Usuário não identificado",
            lastModifiedByEmail: userInfo.email || "email@naoidentificado.com",
            lastModifiedAt: new Date(),
          };
        }
        return produto;
      });

      // Preparar dados para atualizar no pedido principal
      const orderUpdateData = {
        produtos: updatedProducts,
        updatedAt: serverTimestamp(),
        lastModifiedBy:
          userInfo.name || userInfo.email || "Usuário não identificado",
        lastModifiedByEmail: userInfo.email || "email@naoidentificado.com",
        lastModifiedAt: serverTimestamp(),
      };

      // Atualizar no banco
      await updateDoc(orderRef, orderUpdateData);

      // Encontrar o produto que foi atualizado para notificação
      const updatedProduct = updatedProducts.find((p) => p.id === productId);

      if (updatedProduct) {
        const result = await this.sendProductStatusNotification(
          { ...orderData, id: orderId },
          updatedProduct,
          status,
          additionalData
        );
        return result;
      }
    } catch (error) {
      console.error("Erro ao atualizar status do produto:", error);
      throw error;
    }
  },

  // Enviar notificação de status do pedido geral
  async sendOrderStatusNotification(orderData, status, additionalData) {
    let message = `❗ *Atualização do Pedido Geral*\n\nOlá ${orderData.nomeCompleto}!\n\n *ID do Pedido:* ${orderData.id}\n\n`;

    // Mostrar resumo do pedido
    if (orderData.produtos && orderData.produtos.length > 0) {
      message += `*Pedido com ${orderData.produtos.length} produto${
        orderData.produtos.length > 1 ? "s" : ""
      }*\n`;
    } else if (orderData.produto) {
      message += `*Produto:* ${orderData.produto}\n`;
    }

    switch (status) {
      case "em_analise":
        message += `*Status Geral:* ✓ Em Análise\n\nSeu pedido está sendo analisado pela nossa equipe.`;
        break;
      case "em_andamento":
        message += `*Status Geral:* ⚡ Em Andamento\n\nSeu pedido foi aprovado e está em andamento!`;
        if (additionalData.dataPrevisao) {
          const formattedDate = this.formatDateToBR(
            additionalData.dataPrevisao
          );
          message += `\n*Data Prevista:* ${formattedDate}`;
        }
        break;
      case "cancelado":
        message += `*Status Geral:* ✗ Cancelado/Negado\n\nInfelizmente seu pedido foi cancelado.`;
        if (additionalData.motivoCancelamento) {
          message += `\n*Motivo:* ${additionalData.motivoCancelamento}`;
        }
        break;
      case "entregue":
        message += `*Status Geral:* ✓ Entregue\n\nSeu pedido foi entregue com sucesso!`;
        break;
      default:
        message += `*Status Geral:* ${status}`;
    }

    // Adicionar lista detalhada dos produtos com seus status atualizados
    if (orderData.produtos && orderData.produtos.length > 0) {
      message += `\n\n📦 *Produtos do Pedido:*\n`;

      orderData.produtos.forEach((produto, index) => {
        const statusEmoji = this.getStatusEmoji(status);
        const statusLabel = this.getStatusLabel(status);

        message += `\n${index + 1}. *${produto.produto}*`;
        message += `\n   • Quantidade: ${produto.quantidade} ${
          produto.metrica || "UN"
        }`;
        if (produto.especificacoes) {
          message += `\n   • Especificações: ${produto.especificacoes}`;
        }
        message += `\n   • Status: ${statusEmoji} ${statusLabel}`;
      });

      message += `\n\n⚠ *Importante:* Todos os ${orderData.produtos.length} produtos deste pedido tiveram seus status atualizados para o status geral.`;
    }

    return this.sendNotification(orderData.whatsapp, message);
  },

  // Enviar notificação de status de produto individual
  async sendProductStatusNotification(
    orderData,
    product,
    status,
    additionalData
  ) {
    let message = `❗ *Atualização de Produto*\n\nOlá ${orderData.nomeCompleto}!\n\n *ID do Pedido:* ${orderData.id}\n\n`;
    message += `*Produto:* ${product.produto}\n`;

    switch (status) {
      case "em_analise":
        message += `*Status:* ✓ Em Análise\n\nEste produto está sendo analisado pela nossa equipe.`;
        break;
      case "em_andamento":
        message += `*Status:* ⚡ Em Andamento\n\nEste produto foi aprovado e está em andamento!`;
        if (additionalData.dataPrevisao) {
          const formattedDate = this.formatDateToBR(
            additionalData.dataPrevisao
          );
          message += `\n*Data Prevista:* ${formattedDate}`;
        }
        break;
      case "cancelado":
        message += `*Status:* ✗ Cancelado/Negado\n\nInfelizmente este produto foi cancelado.`;
        if (additionalData.motivoCancelamento) {
          message += `\n*Motivo:* ${additionalData.motivoCancelamento}`;
        }
        break;
      case "entregue":
        message += `*Status:* ✓ Entregue\n\nO produto está disponível para retirada no almoxarifado.`;
        break;
      default:
        message += `*Status:* ${status}`;
    }

    // Adicionar informações sobre outros produtos do pedido
    if (orderData.produtos && orderData.produtos.length > 1) {
      message += `\n\n⚠ *Outros produtos do pedido:*\n`;
      orderData.produtos.forEach((p, index) => {
        if (p.id !== product.id) {
          const statusLabels = {
            pendente: "⏳ Pendente",
            em_analise: "✓ Em Análise",
            em_andamento: "⚡ Em Andamento",
            cancelado: "✗ Cancelado",
            entregue: "✓ Entregue",
          };
          message += `• ${p.produto}: ${statusLabels[p.status] || p.status}\n`;
        }
      });
    }

    return this.sendNotification(orderData.whatsapp, message);
  },

  // Função auxiliar para envio de notificação
  async sendNotification(phoneNumber, message) {
    try {
      // Gerar e abrir link do WhatsApp
      const result = await sendWhatsAppMessage(phoneNumber, message);

      // Gerar link para possível uso posterior
      const whatsappLink = generateWhatsAppLink(phoneNumber, message);

      return {
        success: true,
        whatsappResult: result,
        whatsappLink: whatsappLink,
        message: message,
        phoneNumber: phoneNumber,
      };
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);

      // Retornar dados para tratamento na UI
      const whatsappLink = generateWhatsAppLink(phoneNumber, message);
      return {
        success: false,
        error: error.message,
        whatsappLink: whatsappLink,
        message: message,
        phoneNumber: phoneNumber,
      };
    }
  },

  // Escutar mudanças nos pedidos em tempo real
  subscribeToOrders(callback) {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(orders);
    });
  },

  // Função para cancelar pedido completo (todos os produtos)
  async cancelCompleteOrder(orderId, motivoCancelamento = "", userInfo = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        throw new Error("Pedido não encontrado");
      }

      const orderData = orderDoc.data();

      // Cancelar todos os produtos do pedido
      let updatedProducts = [];
      if (orderData.produtos && Array.isArray(orderData.produtos)) {
        updatedProducts = orderData.produtos.map((produto) => ({
          ...produto,
          status: "cancelado",
          motivoCancelamento: motivoCancelamento,
          canceledAt: new Date(),
          lastModifiedBy:
            userInfo.name || userInfo.email || "Usuário não identificado",
          lastModifiedByEmail: userInfo.email || "email@naoidentificado.com",
          lastModifiedAt: new Date(),
        }));
      }

      // Atualizar no banco
      await updateDoc(orderRef, {
        status: "cancelado",
        produtos: updatedProducts,
        motivoCancelamento: motivoCancelamento,
        canceledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastModifiedBy:
          userInfo.name || userInfo.email || "Usuário não identificado",
        lastModifiedByEmail: userInfo.email || "email@naoidentificado.com",
        lastModifiedAt: serverTimestamp(),
      });

      // Criar mensagem de notificação para o cliente
      let message = `✗ *PEDIDO CANCELADO*\n\n`;
      message += `*ID do Pedido:* ${orderId}\n\n`;
      message += `Olá ${orderData.nomeCompleto}!\n\n`;
      message += `Infelizmente seu pedido foi cancelado completamente.\n\n`;

      if (motivoCancelamento) {
        message += `*Motivo:* ${motivoCancelamento}\n\n`;
      }

      // Enviar notificação
      const result = await this.sendNotification(orderData.whatsapp, message);

      return {
        success: true,
        message: "Pedido cancelado com sucesso!",
        orderId: orderId,
        result: result,
      };
    } catch (error) {
      console.error("Erro ao cancelar pedido completo:", error);
      throw error;
    }
  },

  // Função para deletar pedido permanentemente (apenas admin)
  async deleteOrder(orderId, userInfo = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);

      // Primeiro, buscar os dados atuais do pedido
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Pedido não encontrado");
      }

      await deleteDoc(orderRef);

      return {
        success: true,
        message: "Pedido deletado permanentemente do sistema",
        orderId: orderId,
      };
    } catch (error) {
      console.error("Erro ao deletar pedido:", error);
      throw error;
    }
  },

  // FUNÇÕES DE OBSERVAÇÕES SIMPLES (etiqueta)
  async addObservation(orderId, observationText, userInfo = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);

      // Buscar pedido atual
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Pedido não encontrado");
      }

      // Atualizar pedido com observação simples
      await updateDoc(orderRef, {
        observacao: observationText,
        observacaoAutor:
          userInfo.name || userInfo.email || "Usuário não identificado",
        observacaoData: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        message: "Observação adicionada com sucesso!",
      };
    } catch (error) {
      console.error("Erro ao adicionar observação:", error);
      throw error;
    }
  },

  async updateObservation(orderId, newText, userInfo = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);

      // Buscar pedido atual
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Pedido não encontrado");
      }

      // Atualizar observação
      await updateDoc(orderRef, {
        observacao: newText,
        observacaoAutor:
          userInfo.name || userInfo.email || "Usuário não identificado",
        observacaoData: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        message: "Observação atualizada com sucesso!",
      };
    } catch (error) {
      console.error("Erro ao atualizar observação:", error);
      throw error;
    }
  },

  async deleteObservation(orderId, userInfo = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);

      // Buscar pedido atual
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Pedido não encontrado");
      }

      // Remover observação (definir como null)
      await updateDoc(orderRef, {
        observacao: null,
        observacaoAutor: null,
        observacaoData: null,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        message: "Observação removida com sucesso!",
      };
    } catch (error) {
      console.error("Erro ao remover observação:", error);
      throw error;
    }
  },

  // FUNÇÕES DE COMENTÁRIOS
  async addComment(orderId, commentText, userInfo = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);

      // Buscar pedido atual
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Pedido não encontrado");
      }

      const orderData = orderDoc.data();
      const currentComments = orderData.comentarios || [];

      // Criar novo comentário
      const newComment = {
        id: Date.now().toString(),
        texto: commentText,
        autor: userInfo.name || userInfo.email || "Usuário não identificado",
        autorEmail: userInfo.email || "email@naoidentificado.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Adicionar comentário à lista
      const updatedComments = [...currentComments, newComment];

      // Atualizar pedido
      await updateDoc(orderRef, {
        comentarios: updatedComments,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        comment: newComment,
        message: "Comentário adicionado com sucesso!",
      };
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      throw error;
    }
  },

  async getComments(orderId) {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        throw new Error("Pedido não encontrado");
      }

      const orderData = orderDoc.data();
      return orderData.comentarios || [];
    } catch (error) {
      console.error("Erro ao buscar comentários:", error);
      throw error;
    }
  },

  async deleteComment(orderId, commentId, userInfo = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);

      // Buscar pedido atual
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Pedido não encontrado");
      }

      const orderData = orderDoc.data();
      const currentComments = orderData.comentarios || [];

      // Encontrar comentário para verificar permissões
      const comment = currentComments.find((c) => c.id === commentId);
      if (!comment) {
        throw new Error("Comentário não encontrado");
      }

      // Verificar se o usuário pode deletar (autor do comentário ou admin principal)
      const canDelete =
        comment.autorEmail === userInfo.email || userInfo.isMainAdmin;

      if (!canDelete) {
        throw new Error("Você não tem permissão para deletar este comentário");
      }

      // Remover comentário
      const updatedComments = currentComments.filter((c) => c.id !== commentId);

      // Atualizar pedido
      await updateDoc(orderRef, {
        comentarios: updatedComments,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        message: "Comentário deletado com sucesso!",
      };
    } catch (error) {
      console.error("Erro ao deletar comentário:", error);
      throw error;
    }
  },
};

// Serviços para Usuários Admin
export const usersService = {
  // Criar novo usuário admin
  async createUser(userData, masterCredentials) {
    try {
      // 1. Cria o usuário no Auth (isso desloga o master)
      await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // 2. Remove a senha antes de salvar no Firestore
      const { password, ...userDataWithoutPassword } = userData;

      // 3. Salva no Firestore
      const userRef = doc(db, "users", userData.email);
      await setDoc(userRef, {
        ...userDataWithoutPassword,
        role: "admin",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 4. Reloga o master, se as credenciais forem fornecidas
      if (
        masterCredentials &&
        masterCredentials.email &&
        masterCredentials.password
      ) {
        await signInWithEmailAndPassword(
          auth,
          masterCredentials.email,
          masterCredentials.password
        );
      }

      return userData.email;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw error;
    }
  },

  // Atualizar permissões de usuário
  async updateUser(userId, userData) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      });
      return userId;
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      throw error;
    }
  },

  // Buscar todos os usuários
  async getAllUsers() {
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      throw error;
    }
  },

  // Deletar usuário
  async deleteUser(userId) {
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      throw error;
    }
  },
};
