import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase/config";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
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
  const [appUserData, setAppUserData] = useState(null); // Dados do usuário do app (não admin)
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null); // 'admin', 'appUser', 'pendingUser', null

  // Lista de emails que são MainAdmin
  const mainAdminEmails = [
    "comprasnatville@gmail.com",
    "compras6natville@gmail.com",
  ];

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
      // Se for um dos admins principais, tem todas as permissões
      if (mainAdminEmails.includes(userEmail)) {
        setUserPermissions({
          allowedStatuses: availableStatuses.map((s) => s.value),
          isMainAdmin: true,
          canManageUsers: true,
          name:
            userEmail === "comprasnatville@gmail.com"
              ? "Alefe Oliveira"
              : "Admin Natville",
          email: userEmail,
        });
        setUserType("admin");
        setAppUserData(null);
        return;
      }

      // Buscar permissões de admin no Firestore
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
        setUserType("admin");
        setAppUserData(null);
        return;
      }

      // Se não for admin, verificar se é usuário do app
      const appUserQuery = await getDoc(doc(db, "appUsers", userEmail));
      if (appUserQuery.exists()) {
        const appUser = appUserQuery.data();
        if (appUser.isApproved) {
          setAppUserData({ id: userEmail, ...appUser });
          setUserType("appUser");
          setUserPermissions(null);
          return;
        } else {
          // Usuário existe mas não está aprovado
          setAppUserData({ id: userEmail, ...appUser, pendingApproval: true });
          setUserType("pendingUser");
          setUserPermissions(null);
          return;
        }
      }

      // Verificar se tem solicitação pendente
      const requestQuery = await getDoc(doc(db, "registrationRequests", userEmail));
      if (requestQuery.exists()) {
        const requestData = requestQuery.data();
        if (requestData.status === "pendente") {
          setAppUserData({ id: userEmail, ...requestData, pendingApproval: true });
          setUserType("pendingUser");
          setUserPermissions(null);
          return;
        } else if (requestData.status === "rejeitado") {
          setAppUserData({ id: userEmail, ...requestData, rejected: true });
          setUserType("rejectedUser");
          setUserPermissions(null);
          return;
        }
      }

      // Usuário não tem permissões cadastradas e não é usuário do app
      setUserPermissions(null);
      setAppUserData(null);
      setUserType(null);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      setUserPermissions(null);
      setAppUserData(null);
      setUserType(null);
    }
  };

  // Registrar novo usuário (apenas cria no Auth, dados ficam na solicitação)
  async function registerUser(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error("Erro no registro:", error);
      if (error.code === "auth/email-already-in-use") {
        throw new Error("Este email já está em uso.");
      }
      throw error;
    }
  }

  // Login para usuários do app
  async function loginAppUser(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error("Erro no login:", error);
      if (error.code === "auth/user-not-found") {
        throw new Error("Usuário não encontrado.");
      }
      if (error.code === "auth/wrong-password") {
        throw new Error("Senha incorreta.");
      }
      throw error;
    }
  }

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
        setAppUserData(null);
        setUserType(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Verificar se é admin
  const isAdmin = () => {
    return userType === "admin" || mainAdminEmails.includes(currentUser?.email);
  };

  // Verificar se é usuário do app aprovado
  const isApprovedAppUser = () => {
    return userType === "appUser" && appUserData?.isApproved;
  };

  // Verificar se está pendente aprovação
  const isPendingApproval = () => {
    return userType === "pendingUser";
  };

  // Verificar se foi rejeitado
  const isRejected = () => {
    return userType === "rejectedUser";
  };

  const value = {
    currentUser,
    userPermissions,
    appUserData,
    userType,
    login,
    logout,
    loginAppUser,
    registerUser,
    loading,
    canChangeStatus,
    canChangeStatusFrom,
    getAllowedStatuses,
    getAllowedStatusesFrom,
    availableStatuses,
    statusWorkflow,
    loadUserPermissions,
    isAdmin,
    isApprovedAppUser,
    isPendingApproval,
    isRejected,
    mainAdminEmails,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
