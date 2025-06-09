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
  // Criar novo pedido
  async createOrder(orderData) {
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        status: "pendente",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Criar mensagem do pedido baseada em produtos
      let message = `🛒 *Pedido Criado!*\n\nOlá ${orderData.nomeCompleto}!\n\nSeu pedido foi recebido com sucesso!\n\n`;

      if (orderData.produtos && orderData.produtos.length > 0) {
        message += `*${orderData.produtos.length} Produto${
          orderData.produtos.length > 1 ? "s" : ""
        } Incluído${orderData.produtos.length > 1 ? "s" : ""}:*\n\n`;
        orderData.produtos.forEach((produto, index) => {
          message += `${index + 1}. *${
            produto.produto
          }*\n   Status: Pendente\n\n`;
        });
      } else if (orderData.produto) {
        message += `*Produto:* ${orderData.produto}\n*Status:* Pendente\n\n`;
      }

      message += `Você receberá atualizações sobre o andamento de cada item do seu pedido.`;

      // Enviar notificação de pedido criado
      const result = await sendWhatsAppMessage(orderData.whatsapp, message);

      return {
        id: docRef.id,
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
  async updateOrderStatus(orderId, status, additionalData = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status,
        ...additionalData,
        updatedAt: serverTimestamp(),
      });

      // Buscar dados do pedido para enviar notificação
      const orderDoc = await getDoc(orderRef);
      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        const result = await this.sendOrderStatusNotification(
          orderData,
          status,
          additionalData
        );
        return result;
      }
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      throw error;
    }
  },

  // Atualizar status de produto individual
  async updateProductStatus(orderId, productId, status, additionalData = {}) {
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
          };
        }
        return produto;
      });

      // Atualizar no banco
      await updateDoc(orderRef, {
        produtos: updatedProducts,
        updatedAt: serverTimestamp(),
      });

      // Encontrar o produto que foi atualizado para notificação
      const updatedProduct = updatedProducts.find((p) => p.id === productId);

      if (updatedProduct) {
        const result = await this.sendProductStatusNotification(
          orderData,
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
    let message = `🔔 *Atualização do Pedido Geral*\n\nOlá ${orderData.nomeCompleto}!\n\n`;

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
        message += `*Status Geral:* ✅ Em Análise\n\nSeu pedido está sendo analisado pela nossa equipe.`;
        break;
      case "em_andamento":
        message += `*Status Geral:* 🔄 Em Andamento\n\nSeu pedido foi aprovado e está em andamento!`;
        if (additionalData.dataPrevisao) {
          message += `\n*Data Prevista:* ${additionalData.dataPrevisao}`;
        }
        break;
      case "cancelado":
        message += `*Status Geral:* ❌ Cancelado/Negado\n\nInfelizmente seu pedido foi cancelado.`;
        if (additionalData.motivoCancelamento) {
          message += `\n*Motivo:* ${additionalData.motivoCancelamento}`;
        }
        break;
      case "entregue":
        message += `*Status Geral:* ✅ Entregue\n\nSeu pedido foi entregue com sucesso!`;
        break;
      default:
        message += `*Status Geral:* ${status}`;
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
    let message = `🔔 *Atualização de Produto*\n\nOlá ${orderData.nomeCompleto}!\n\n`;
    message += `*Produto:* ${product.produto}\n`;

    switch (status) {
      case "em_analise":
        message += `*Status:* ✅ Em Análise\n\nEste produto está sendo analisado pela nossa equipe.`;
        break;
      case "em_andamento":
        message += `*Status:* 🔄 Em Andamento\n\nEste produto foi aprovado e está em andamento!`;
        if (additionalData.dataPrevisao) {
          message += `\n*Data Prevista:* ${additionalData.dataPrevisao}`;
        }
        break;
      case "cancelado":
        message += `*Status:* ❌ Cancelado/Negado\n\nInfelizmente este produto foi cancelado.`;
        if (additionalData.motivoCancelamento) {
          message += `\n*Motivo:* ${additionalData.motivoCancelamento}`;
        }
        break;
      case "entregue":
        message += `*Status:* ✅ Entregue\n\nEste produto foi entregue com sucesso!`;
        break;
      default:
        message += `*Status:* ${status}`;
    }

    // Adicionar informações sobre outros produtos do pedido
    if (orderData.produtos && orderData.produtos.length > 1) {
      message += `\n\n📋 *Outros produtos do pedido:*\n`;
      orderData.produtos.forEach((p, index) => {
        if (p.id !== product.id) {
          const statusLabels = {
            pendente: "⏳ Pendente",
            em_analise: "🔍 Em Análise",
            em_andamento: "🔄 Em Andamento",
            cancelado: "❌ Cancelado",
            entregue: "✅ Entregue",
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
