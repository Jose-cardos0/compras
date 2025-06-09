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

  // Carregar permissões do usuário do Firestore
  const loadUserPermissions = async (userEmail) => {
    try {
      // Se for o admin principal, tem todas as permissões
      if (userEmail === adminCredentials.email) {
        setUserPermissions({
          allowedStatuses: availableStatuses.map((s) => s.value),
          isMainAdmin: true,
          canManageUsers: true,
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
        });
      } else {
        // Usuário não tem permissões cadastradas
        setUserPermissions({
          allowedStatuses: [],
          isMainAdmin: false,
          canManageUsers: false,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      setUserPermissions({
        allowedStatuses: [],
        isMainAdmin: false,
        canManageUsers: false,
      });
    }
  };

  async function login(email, password) {
    try {
      // Verificar se as credenciais são do admin principal
      if (
        email === adminCredentials.email &&
        password === adminCredentials.password
      ) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        toast.success("Login realizado com sucesso!");
        return result;
      } else {
        throw new Error("Credenciais inválidas");
      }
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

  // Obter lista de status que o usuário pode usar
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
    getAllowedStatuses,
    availableStatuses,
    loadUserPermissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
