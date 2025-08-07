import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  runTransaction,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

// Script de migração para converter IDs existentes para o novo sistema numérico
export const migrationService = {
  // Função para gerar ID numérico sequencial (mesma lógica do ordersService)
  async generateSequentialId() {
    try {
      const counterRef = doc(db, "counters", "orderIds");

      const result = await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);

        let currentId = 1;
        if (counterDoc.exists()) {
          currentId = counterDoc.data().currentId + 1;
        }

        transaction.set(counterRef, { currentId }, { merge: true });

        return currentId;
      });

      return result.toString().padStart(4, "0");
    } catch (error) {
      console.error("Erro ao gerar ID sequencial:", error);
      return Date.now().toString().slice(-4);
    }
  },

  // Função para identificar duplicatas
  async identifyDuplicates() {
    try {
      console.log("🔍 Identificando duplicatas...");

      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const orders = ordersSnapshot.docs;

      const duplicates = [];
      const processedIds = new Set();

      // Agrupar por dados similares (nome, setor, data de criação)
      const groups = {};

      orders.forEach((orderDoc) => {
        const orderData = orderDoc.data();
        const key = `${orderData.nomeCompleto}_${orderData.setor}_${
          orderData.createdAt?.toDate?.()?.toISOString() || "no-date"
        }`;

        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push({
          id: orderDoc.id,
          data: orderData,
          hasOrderNumber: !!orderData.orderNumber,
          createdAt: orderData.createdAt?.toDate?.() || new Date(0),
        });
      });

      // Identificar grupos com mais de um pedido
      Object.entries(groups).forEach(([key, groupOrders]) => {
        if (groupOrders.length > 1) {
          // Ordenar por data de criação (mais antigo primeiro)
          groupOrders.sort((a, b) => a.createdAt - b.createdAt);

          duplicates.push({
            key,
            orders: groupOrders,
            original: groupOrders[0], // O mais antigo
            duplicates: groupOrders.slice(1), // Os mais novos
          });
        }
      });

      console.log(`📊 Encontradas ${duplicates.length} duplicatas`);

      return {
        totalOrders: orders.length,
        duplicates: duplicates,
        duplicateCount: duplicates.reduce(
          (sum, dup) => sum + dup.duplicates.length,
          0
        ),
      };
    } catch (error) {
      console.error("Erro ao identificar duplicatas:", error);
      throw error;
    }
  },

  // Função para limpar duplicatas
  async cleanDuplicates() {
    try {
      console.log("🧹 Iniciando limpeza de duplicatas...");

      const duplicateInfo = await this.identifyDuplicates();
      let deletedCount = 0;
      let errorCount = 0;

      for (const duplicate of duplicateInfo.duplicates) {
        console.log(`🔄 Processando duplicata: ${duplicate.key}`);

        for (const dupOrder of duplicate.duplicates) {
          try {
            console.log(`🗑️ Deletando duplicata: ${dupOrder.id}`);
            await deleteDoc(doc(db, "orders", dupOrder.id));
            deletedCount++;
          } catch (error) {
            console.error(`❌ Erro ao deletar ${dupOrder.id}:`, error);
            errorCount++;
          }
        }
      }

      console.log(`✅ Limpeza concluída! ${deletedCount} duplicatas removidas`);

      return {
        success: true,
        deletedCount,
        errorCount,
        totalDuplicates: duplicateInfo.duplicateCount,
      };
    } catch (error) {
      console.error("Erro durante limpeza:", error);
      throw error;
    }
  },

  // Função para migrar pedidos existentes (CORRIGIDA)
  async migrateExistingOrders() {
    try {
      console.log("🚀 Iniciando migração de pedidos existentes...");

      // Primeiro, limpar duplicatas existentes
      console.log("🧹 Limpando duplicatas antes da migração...");
      await this.cleanDuplicates();

      // Buscar todos os pedidos existentes
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const existingOrders = ordersSnapshot.docs;

      console.log(
        `📊 Encontrados ${existingOrders.length} pedidos para migrar`
      );

      // Ordenar por data de criação (mais antigos primeiro)
      const sortedOrders = existingOrders.sort((a, b) => {
        const aData = a.data();
        const bData = b.data();
        const aTime = aData.createdAt?.toDate?.() || new Date(0);
        const bTime = bData.createdAt?.toDate?.() || new Date(0);
        return aTime - bTime;
      });

      let migratedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const orderDoc of sortedOrders) {
        try {
          const oldId = orderDoc.id;
          const orderData = orderDoc.data();

          // Verificar se já tem orderNumber (já foi migrado)
          if (orderData.orderNumber) {
            console.log(`⏭️ Pedido ${oldId} já migrado, pulando...`);
            skippedCount++;
            continue;
          }

          // Verificar se o ID já é numérico (4 dígitos)
          if (/^\d{4}$/.test(oldId)) {
            console.log(
              `⏭️ Pedido ${oldId} já tem ID numérico, apenas adicionando orderNumber...`
            );

            // Apenas adicionar orderNumber ao documento existente
            await updateDoc(doc(db, "orders", oldId), {
              orderNumber: oldId,
              migratedAt: new Date(),
            });

            migratedCount++;
            continue;
          }

          // Gerar novo ID numérico
          const newId = await this.generateSequentialId();

          console.log(`🔄 Migrando pedido ${oldId} → ${newId}`);

          // Criar novo documento com ID numérico
          const newOrderRef = doc(db, "orders", newId);
          await setDoc(newOrderRef, {
            ...orderData,
            orderNumber: newId,
            originalId: oldId, // Manter referência ao ID original
            migratedAt: new Date(),
          });

          // Deletar documento antigo
          await deleteDoc(orderDoc.ref);

          migratedCount++;
          console.log(`✅ Pedido ${oldId} migrado para ${newId}`);
        } catch (error) {
          console.error(`❌ Erro ao migrar pedido ${orderDoc.id}:`, error);
          errorCount++;
        }
      }

      console.log(`🎉 Migração concluída!`);
      console.log(`✅ ${migratedCount} pedidos migrados com sucesso`);
      console.log(`⏭️ ${skippedCount} pedidos pulados (já migrados)`);
      console.log(`❌ ${errorCount} erros durante a migração`);

      return {
        success: true,
        migratedCount,
        skippedCount,
        errorCount,
        totalOrders: existingOrders.length,
      };
    } catch (error) {
      console.error("❌ Erro durante a migração:", error);
      throw error;
    }
  },

  // Função para verificar status da migração
  async checkMigrationStatus() {
    try {
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const orders = ordersSnapshot.docs;

      const migratedOrders = orders.filter((doc) => doc.data().orderNumber);
      const nonMigratedOrders = orders.filter((doc) => !doc.data().orderNumber);

      // Verificar duplicatas
      const duplicateInfo = await this.identifyDuplicates();

      return {
        totalOrders: orders.length,
        migratedOrders: migratedOrders.length,
        nonMigratedOrders: nonMigratedOrders.length,
        migrationProgress: (migratedOrders.length / orders.length) * 100,
        duplicates: duplicateInfo.duplicates.length,
        duplicateCount: duplicateInfo.duplicateCount,
      };
    } catch (error) {
      console.error("Erro ao verificar status da migração:", error);
      throw error;
    }
  },

  // Função para resetar o contador de IDs
  async resetIdCounter() {
    try {
      console.log("🔄 Resetando contador de IDs...");

      const counterRef = doc(db, "counters", "orderIds");
      await setDoc(counterRef, { currentId: 0 });

      console.log("✅ Contador resetado com sucesso!");

      return { success: true };
    } catch (error) {
      console.error("Erro ao resetar contador:", error);
      throw error;
    }
  },
};
