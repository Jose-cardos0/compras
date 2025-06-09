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
} from "firebase/firestore";
import { db } from "../firebase/config";
import { sendWhatsAppMessage } from "./whatsapp";

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

      // Enviar notificação de pedido criado
      await sendWhatsAppMessage(
        orderData.whatsapp,
        `🛒 *Pedido Criado!*\n\nOlá ${orderData.nomeCompleto}!\n\nSeu pedido foi recebido com sucesso!\n\n*Produto:* ${orderData.produto}\n*Status:* Pendente\n\nVocê receberá atualizações sobre o andamento do seu pedido.`
      );

      return docRef.id;
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

  // Atualizar status do pedido
  async updateOrderStatus(orderId, status, additionalData = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status,
        ...additionalData,
        updatedAt: serverTimestamp(),
      });

      // Buscar dados do pedido para enviar notificação
      const orderDoc = await getDocs(
        query(collection(db, "orders"), where("__name__", "==", orderId))
      );
      if (!orderDoc.empty) {
        const orderData = orderDoc.docs[0].data();
        await this.sendStatusNotification(orderData, status, additionalData);
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      throw error;
    }
  },

  // Enviar notificação de status
  async sendStatusNotification(orderData, status, additionalData) {
    let message = `🔔 *Atualização do Pedido*\n\nOlá ${orderData.nomeCompleto}!\n\n*Produto:* ${orderData.produto}\n`;

    switch (status) {
      case "em_analise":
        message += `*Status:* ✅ Em Análise\n\nSeu pedido está sendo analisado pela nossa equipe.`;
        break;
      case "em_andamento":
        message += `*Status:* 🔄 Em Andamento\n\nSeu pedido foi aprovado e está em andamento!`;
        if (additionalData.dataPrevisao) {
          message += `\n*Data Prevista:* ${additionalData.dataPrevisao}`;
        }
        break;
      case "cancelado":
        message += `*Status:* ❌ Cancelado/Negado\n\nInfelizmente seu pedido foi cancelado.`;
        if (additionalData.motivo) {
          message += `\n*Motivo:* ${additionalData.motivo}`;
        }
        break;
      case "entregue":
        message += `*Status:* ✅ Entregue\n\nSeu pedido foi entregue com sucesso!`;
        break;
      default:
        message += `*Status:* ${status}`;
    }

    try {
      await sendWhatsAppMessage(orderData.whatsapp, message);
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
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
  async createUser(userData) {
    try {
      const docRef = await addDoc(collection(db, "users"), {
        ...userData,
        role: "admin",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
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
