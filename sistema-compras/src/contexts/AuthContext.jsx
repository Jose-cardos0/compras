import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase/config";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  const adminCredentials = {
    email: "comprasnatville@gmail.com",
    password: "compras2025@",
  };

  // Definir status disponíveis no sistema
  const availableStatuses = [
    { value: "pendente", label: "Pendente" },
    { value: "em_analise", label: "Em Análise" },
    { value: "em_andamento", label: "Em Andamento" },
    { value: "cancelado", label: "Cancelado/Negado" },
    { value: "entregue", label: "Entregue" },
  ];

  // Definir fluxo de status - de qual status para qual status pode mudar
  const statusWorkflow = {
    pendente: ["em_analise", "cancelado"], // Pendente pode ir para Em Análise ou Cancelado
    em_analise: ["em_andamento", "pendente", "cancelado"], // Em Análise pode ir para Em Andamento, voltar para Pendente ou Cancelado
    em_andamento: ["entregue", "cancelado"], // Em Andamento pode ir para Entregue ou Cancelado
    cancelado: [], // Cancelado não pode mudar para outro status
    entregue: [], // Entregue não pode mudar para outro status
  };

  // Carregar permissões do usuário do Firestore
  const loadUserPermissions = async (userEmail) => {
    try {
      // Se for o admin principal, tem todas as permissões
      if (userEmail === adminCredentials.email) {
        setUserPermissions({
          allowedStatuses: availableStatuses.map((s) => s.value),
          isMainAdmin: true,
          canManageUsers: true,
          name: "Alefe Oliveira",
          email: userEmail,
        });
        return;
      }

      // Buscar permissões no Firestore
      const userQuery = await getDoc(doc(db, "users", userEmail));
      if (userQuery.exists()) {
        const userData = userQuery.data();
        setUserPermissions({
          allowedStatuses: userData.allowedStatuses || [],
          isMainAdmin: false,
          canManageUsers: userData.canManageUsers || false,
          name: userData.name || userEmail,
          email: userEmail,
        });
      } else {
        // Usuário não tem permissões cadastradas
        setUserPermissions({
          allowedStatuses: [],
          isMainAdmin: false,
          canManageUsers: false,
          name: userEmail,
          email: userEmail,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      setUserPermissions({
        allowedStatuses: [],
        isMainAdmin: false,
        canManageUsers: false,
        name: userEmail || "Usuário desconhecido",
        email: userEmail || "",
      });
    }
  };

  async function login(email, password) {
    try {
      // Permitir login de qualquer usuário cadastrado no Auth
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login realizado com sucesso!");
      return result;
    } catch (error) {
      console.error("Erro no login:", error);
      toast.error("Email ou senha incorretos");
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      setUserPermissions(null);
      toast.success("Logout realizado com sucesso!");
    } catch (error) {
      console.error("Erro no logout:", error);
      toast.error("Erro ao fazer logout");
    }
  }

  // Verificar se usuário pode alterar determinado status
  const canChangeStatus = (status) => {
    if (!userPermissions) return false;
    if (userPermissions.isMainAdmin) return true;
    return userPermissions.allowedStatuses.includes(status);
  };

  // Verificar se é possível mudar de um status para outro (considerando fluxo + permissões)
  const canChangeStatusFrom = (currentStatus, newStatus) => {
    if (!userPermissions) return false;

    // Admin principal pode fazer qualquer mudança
    if (userPermissions.isMainAdmin) return true;

    // Verificar se tem permissão para o novo status
    if (!userPermissions.allowedStatuses.includes(newStatus)) return false;

    // Verificar se a transição é permitida pelo fluxo
    const allowedTransitions = statusWorkflow[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  };

  // Obter lista de status que o usuário pode usar baseado no status atual
  const getAllowedStatusesFrom = (currentStatus) => {
    if (!userPermissions) return [];

    if (userPermissions.isMainAdmin) {
      // Admin pode fazer qualquer transição permitida pelo fluxo
      const allowedTransitions = statusWorkflow[currentStatus] || [];
      return availableStatuses.filter((status) =>
        allowedTransitions.includes(status.value)
      );
    }

    // Para usuários normais, verificar permissões E fluxo
    const allowedTransitions = statusWorkflow[currentStatus] || [];
    return availableStatuses.filter(
      (status) =>
        userPermissions.allowedStatuses.includes(status.value) &&
        allowedTransitions.includes(status.value)
    );
  };

  // Obter lista de status que o usuário pode usar (função original mantida para compatibilidade)
  const getAllowedStatuses = () => {
    if (!userPermissions) return [];
    if (userPermissions.isMainAdmin) {
      return availableStatuses;
    }
    return availableStatuses.filter((status) =>
      userPermissions.allowedStatuses.includes(status.value)
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserPermissions(user.email);
      } else {
        setUserPermissions(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userPermissions,
    login,
    logout,
    loading,
    canChangeStatus,
    canChangeStatusFrom,
    getAllowedStatuses,
    getAllowedStatusesFrom,
    availableStatuses,
    statusWorkflow,
    loadUserPermissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
