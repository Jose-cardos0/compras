import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, XCircle } from "lucide-react";

const ProtectedUserRoute = ({ children }) => {
  const { currentUser, loading, isApprovedAppUser, isPendingApproval, isRejected, appUserData } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verificando autenticação...</p>
        </motion.div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver pendente de aprovação
  if (isPendingApproval()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Aguardando Aprovação
          </h2>
          <p className="text-gray-600 mb-6">
            Sua solicitação de cadastro foi enviada e está aguardando aprovação de um administrador.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              Você receberá acesso ao sistema assim que sua conta for aprovada. 
              Por favor, aguarde.
            </p>
          </div>
          {appUserData?.name && (
            <div className="text-sm text-gray-500">
              <p>Solicitante: <span className="font-medium">{appUserData.name}</span></p>
              <p>Email: <span className="font-medium">{currentUser.email}</span></p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Se foi rejeitado
  if (isRejected()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Solicitação Rejeitada
          </h2>
          <p className="text-gray-600 mb-6">
            Infelizmente sua solicitação de cadastro foi rejeitada.
          </p>
          {appUserData?.motivoRejeicao && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-medium mb-1">Motivo:</p>
              <p className="text-sm text-red-700">{appUserData.motivoRejeicao}</p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Entre em contato com um administrador para mais informações.
          </p>
        </motion.div>
      </div>
    );
  }

  // Se não é um usuário do app aprovado
  if (!isApprovedAppUser()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedUserRoute;

