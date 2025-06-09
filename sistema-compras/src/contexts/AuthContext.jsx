import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase/config";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const adminCredentials = {
    email: "comprasnatville@gmail.com",
    password: "compras2025@",
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
      toast.success("Logout realizado com sucesso!");
    } catch (error) {
      console.error("Erro no logout:", error);
      toast.error("Erro ao fazer logout");
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
