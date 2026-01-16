import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usersService, registrationRequestsService, appUsersService } from "../services/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  Users,
  UserPlus,
  Trash2,
  Mail,
  User,
  ArrowLeft,
  Calendar,
  Shield,
  X,
  Plus,
  CheckCircle,
  Settings,
  Edit,
  Clock,
  XCircle,
  Eye,
  UserCheck,
  UserX,
  Building,
  Briefcase,
  CreditCard,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [appUsers, setAppUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewRequestModal, setShowViewRequestModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editPermissions, setEditPermissions] = useState([]);
  const [editCanManageUsers, setEditCanManageUsers] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [activeTab, setActiveTab] = useState("requests"); // 'requests', 'appUsers', 'admins'

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const { currentUser, availableStatuses, userPermissions } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadAllData();

    // Subscrever para atualizações em tempo real das solicitações
    const unsubscribe = registrationRequestsService.subscribeToRequests((requests) => {
      setRegistrationRequests(requests);
    });

    return () => unsubscribe();
  }, []);

  const loadAllData = async () => {
    try {
      const [usersData, requestsData, appUsersData] = await Promise.all([
        usersService.getAllUsers(),
        registrationRequestsService.getAllRequests(),
        appUsersService.getAllApprovedUsers(),
      ]);
      setUsers(usersData);
      setRegistrationRequests(requestsData);
      setAppUsers(appUsersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const userData = {
        ...data,
        allowedStatuses: selectedPermissions,
        canManageUsers: canManageUsers,
      };

      await usersService.createUser(userData, {
        email: currentUser.email,
        password: "compras2025@",
      });
      toast.success("Usuário criado com sucesso!");
      setShowCreateModal(false);
      reset();
      setSelectedPermissions([]);
      setCanManageUsers(false);
      loadAllData();
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      toast.error("Erro ao criar usuário");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await usersService.deleteUser(userId);
      toast.success("Usuário deletado com sucesso!");
      setDeleteUserId(null);
      loadAllData();
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      toast.error("Erro ao deletar usuário");
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditPermissions(user.allowedStatuses || []);
    setEditCanManageUsers(user.canManageUsers || false);
    setShowEditModal(true);
  };

  const handleUpdatePermissions = async () => {
    if (!editingUser) return;

    try {
      await usersService.updateUser(editingUser.id, {
        allowedStatuses: editPermissions,
        canManageUsers: editCanManageUsers,
      });

      toast.success("Permissões atualizadas com sucesso!");
      setShowEditModal(false);
      setEditingUser(null);
      setEditPermissions([]);
      setEditCanManageUsers(false);
      loadAllData();
    } catch (error) {
      console.error("Erro ao atualizar permissões:", error);
      toast.error("Erro ao atualizar permissões");
    }
  };

  const togglePermission = (statusValue) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(statusValue)) {
        return prev.filter((p) => p !== statusValue);
      } else {
        return [...prev, statusValue];
      }
    });
  };

  const toggleEditPermission = (statusValue) => {
    setEditPermissions((prev) => {
      if (prev.includes(statusValue)) {
        return prev.filter((p) => p !== statusValue);
      } else {
        return [...prev, statusValue];
      }
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Data não disponível";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return (
      date.toLocaleDateString("pt-BR") +
      " às " +
      date.toLocaleTimeString("pt-BR")
    );
  };

  const formatPermissions = (allowedStatuses) => {
    if (!allowedStatuses || allowedStatuses.length === 0) {
      return "Nenhuma permissão";
    }

    const statusLabels = allowedStatuses.map((status) => {
      const statusConfig = availableStatuses.find((s) => s.value === status);
      return statusConfig ? statusConfig.label : status;
    });

    return statusLabels.join(", ");
  };

  // Aprovar solicitação de cadastro
  const handleApproveRequest = async (email) => {
    try {
      await registrationRequestsService.approveRequest(
        email,
        userPermissions?.name || currentUser.email
      );
      toast.success("Usuário aprovado com sucesso!");
      setShowViewRequestModal(false);
      setSelectedRequest(null);
      loadAllData();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      toast.error("Erro ao aprovar solicitação");
    }
  };

  // Rejeitar solicitação de cadastro
  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    try {
      await registrationRequestsService.rejectRequest(
        selectedRequest.email,
        userPermissions?.name || currentUser.email,
        rejectMotivo
      );
      toast.success("Solicitação rejeitada");
      setShowRejectModal(false);
      setShowViewRequestModal(false);
      setSelectedRequest(null);
      setRejectMotivo("");
      loadAllData();
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      toast.error("Erro ao rejeitar solicitação");
    }
  };

  // Desativar usuário do app
  const handleDeactivateAppUser = async (email) => {
    try {
      await appUsersService.deactivateUser(email);
      toast.success("Usuário desativado");
      loadAllData();
    } catch (error) {
      console.error("Erro ao desativar:", error);
      toast.error("Erro ao desativar usuário");
    }
  };

  // Reativar usuário do app
  const handleReactivateAppUser = async (email) => {
    try {
      await appUsersService.reactivateUser(email);
      toast.success("Usuário reativado");
      loadAllData();
    } catch (error) {
      console.error("Erro ao reativar:", error);
      toast.error("Erro ao reativar usuário");
    }
  };

  // Estatísticas
  const pendingRequests = registrationRequests.filter((r) => r.status === "pendente");

  // Verificar se usuário atual pode gerenciar usuários
  if (!userPermissions?.canManageUsers && !userPermissions?.isMainAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-500 mb-4">
            Você não tem permissão para gerenciar usuários.
          </p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar ao Dashboard</span>
              </button>
              <div className="border-l border-gray-300 pl-4 max-md:hidden">
                <img
                  src="https://i.ibb.co/DPCKjMYN/2024.webp"
                  alt="Logo da Empresa"
                  className="h-12 w-auto"
                />
              </div>
              <div className="max-md:hidden">
                <h1 className="text-2xl font-bold text-gray-900">
                  Gerenciamento de Usuários
                </h1>
                <p className="text-gray-600">
                  Gerencie usuários e solicitações de cadastro
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              <span className="hidden sm:inline">Novo Admin</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="bg-amber-500 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Solicitações Pendentes
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {pendingRequests.length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="bg-green-500 p-3 rounded-lg">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Usuários Ativos
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {appUsers.filter((u) => u.isApproved).length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="bg-blue-500 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total de Solicitações
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {registrationRequests.length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="bg-purple-500 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Administradores
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("requests")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "requests"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Solicitações de Cadastro</span>
                  {pendingRequests.length > 0 && (
                    <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {pendingRequests.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab("appUsers")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "appUsers"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Usuários do Sistema</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("admins")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "admins"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Administradores</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Solicitações de Cadastro */}
            {activeTab === "requests" && (
              <div>
                {registrationRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      Nenhuma solicitação
                    </h3>
                    <p className="text-gray-500">
                      Não há solicitações de cadastro no momento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registrationRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`border rounded-xl p-4 transition-colors ${
                          request.status === "pendente"
                            ? "border-amber-200 bg-amber-50"
                            : request.status === "aprovado"
                            ? "border-green-200 bg-green-50"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {request.photoURL ? (
                              <img
                                src={request.photoURL}
                                alt={request.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {request.name}
                              </h4>
                              <p className="text-sm text-gray-600">{request.email}</p>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <Building className="h-3 w-3" />
                                  <span>{request.setor}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Briefcase className="h-3 w-3" />
                                  <span>{request.cargo}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(request.createdAt)}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                request.status === "pendente"
                                  ? "bg-amber-200 text-amber-800"
                                  : request.status === "aprovado"
                                  ? "bg-green-200 text-green-800"
                                  : "bg-red-200 text-red-800"
                              }`}
                            >
                              {request.status === "pendente"
                                ? "Pendente"
                                : request.status === "aprovado"
                                ? "Aprovado"
                                : "Rejeitado"}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowViewRequestModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            {request.status === "pendente" && (
                              <>
                                <button
                                  onClick={() => handleApproveRequest(request.email)}
                                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                  title="Aprovar"
                                >
                                  <UserCheck className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowRejectModal(true);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Rejeitar"
                                >
                                  <UserX className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Usuários do Sistema */}
            {activeTab === "appUsers" && (
              <div>
                {appUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      Nenhum usuário
                    </h3>
                    <p className="text-gray-500">
                      Não há usuários aprovados no sistema.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`border rounded-xl p-4 transition-colors ${
                          user.isApproved
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {user.photoURL ? (
                              <img
                                src={user.photoURL}
                                alt={user.name}
                                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {user.name}
                              </h4>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <CreditCard className="h-3 w-3" />
                                  <span>{user.cpf}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Building className="h-3 w-3" />
                                  <span>{user.setor}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Briefcase className="h-3 w-3" />
                                  <span>{user.cargo}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.isApproved
                                  ? "bg-green-200 text-green-800"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {user.isApproved ? "Ativo" : "Inativo"}
                            </span>
                            {user.isApproved ? (
                              <button
                                onClick={() => handleDeactivateAppUser(user.email)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Desativar"
                              >
                                <UserX className="h-5 w-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivateAppUser(user.email)}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Reativar"
                              >
                                <UserCheck className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Administradores */}
            {activeTab === "admins" && (
              <div>
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      Nenhum administrador cadastrado
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Crie o primeiro usuário administrador
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Criar Administrador</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border border-purple-200 bg-purple-50 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {user.name}
                              </h4>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <Shield className="h-3 w-3" />
                                  <span>{user.role}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(user.createdAt)}</span>
                                </span>
                              </div>
                              <div className="mt-2">
                                <p className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded inline-block">
                                  {formatPermissions(user.allowedStatuses)}
                                </p>
                                {user.canManageUsers && (
                                  <p className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded inline-block ml-2">
                                    Pode gerenciar usuários
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                              title="Editar Permissões"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              onClick={() => setDeleteUserId(user.id)}
                              className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                              title="Deletar"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Deletar</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Ver Solicitação */}
      <AnimatePresence>
        {showViewRequestModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Detalhes da Solicitação
                </h3>
                <button
                  onClick={() => {
                    setShowViewRequestModal(false);
                    setSelectedRequest(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Foto */}
              <div className="flex justify-center mb-6">
                {selectedRequest.photoURL ? (
                  <img
                    src={selectedRequest.photoURL}
                    alt={selectedRequest.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Dados */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs text-gray-500 font-medium">Nome Completo</label>
                  <p className="text-gray-800 font-semibold">{selectedRequest.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs text-gray-500 font-medium">Email</label>
                    <p className="text-gray-800">{selectedRequest.email}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs text-gray-500 font-medium">CPF</label>
                    <p className="text-gray-800">{selectedRequest.cpf}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs text-gray-500 font-medium">Setor</label>
                    <p className="text-gray-800">{selectedRequest.setor}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs text-gray-500 font-medium">Cargo</label>
                    <p className="text-gray-800">{selectedRequest.cargo}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs text-gray-500 font-medium">Data da Solicitação</label>
                  <p className="text-gray-800">{formatDate(selectedRequest.createdAt)}</p>
                </div>

                <div
                  className={`rounded-lg p-4 ${
                    selectedRequest.status === "pendente"
                      ? "bg-amber-50 border border-amber-200"
                      : selectedRequest.status === "aprovado"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <label className="text-xs text-gray-500 font-medium">Status</label>
                  <p
                    className={`font-semibold ${
                      selectedRequest.status === "pendente"
                        ? "text-amber-800"
                        : selectedRequest.status === "aprovado"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {selectedRequest.status === "pendente"
                      ? "Aguardando Aprovação"
                      : selectedRequest.status === "aprovado"
                      ? "Aprovado"
                      : "Rejeitado"}
                  </p>
                  {selectedRequest.status === "rejeitado" && selectedRequest.motivoRejeicao && (
                    <p className="text-sm text-red-700 mt-2">
                      <strong>Motivo:</strong> {selectedRequest.motivoRejeicao}
                    </p>
                  )}
                </div>
              </div>

              {/* Botões de ação */}
              {selectedRequest.status === "pendente" && (
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => handleApproveRequest(selectedRequest.email)}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Aprovar</span>
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>Rejeitar</span>
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Rejeitar */}
      <AnimatePresence>
        {showRejectModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Rejeitar Solicitação
                </h3>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectMotivo("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Você está prestes a rejeitar a solicitação de{" "}
                  <strong>{selectedRequest.name}</strong>.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da rejeição (opcional)
                </label>
                <textarea
                  value={rejectMotivo}
                  onChange={(e) => setRejectMotivo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Informe o motivo da rejeição..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectMotivo("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectRequest}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirmar Rejeição
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Criar Admin */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Novo Usuário Admin
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                    setSelectedPermissions([]);
                    setCanManageUsers(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo
                    </label>
                    <input
                      {...register("name", { required: "Nome é obrigatório" })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite o nome completo"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      {...register("email", {
                        required: "Email é obrigatório",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Email inválido",
                        },
                      })}
                      type="email"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="admin@exemplo.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Temporária
                  </label>
                  <input
                    {...register("password", {
                      required: "Senha é obrigatória",
                      minLength: {
                        value: 6,
                        message: "Senha deve ter pelo menos 6 caracteres",
                      },
                    })}
                    type="password"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissões de Status
                  </label>
                  <div className="grid grid-cols-1 gap-3 bg-gray-50 p-4 rounded-lg">
                    {availableStatuses.map((status) => (
                      <label
                        key={status.value}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(status.value)}
                          onChange={() => togglePermission(status.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {status.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer bg-blue-50 p-3 rounded-lg">
                    <input
                      type="checkbox"
                      checked={canManageUsers}
                      onChange={(e) => setCanManageUsers(e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Pode gerenciar outros usuários
                    </span>
                  </label>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      reset();
                      setSelectedPermissions([]);
                      setCanManageUsers(false);
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Criar Administrador
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Editar Admin */}
      <AnimatePresence>
        {showEditModal && editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Editar Permissões - {editingUser.name}
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setEditPermissions([]);
                    setEditCanManageUsers(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissões de Status
                  </label>
                  <div className="grid grid-cols-1 gap-3 bg-gray-50 p-4 rounded-lg">
                    {availableStatuses.map((status) => (
                      <label
                        key={status.value}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={editPermissions.includes(status.value)}
                          onChange={() => toggleEditPermission(status.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {status.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer bg-blue-50 p-3 rounded-lg">
                    <input
                      type="checkbox"
                      checked={editCanManageUsers}
                      onChange={(e) => setEditCanManageUsers(e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Pode gerenciar outros usuários
                    </span>
                  </label>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                      setEditPermissions([]);
                      setEditCanManageUsers(false);
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdatePermissions}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Atualizar Permissões
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmar Deletar */}
      <AnimatePresence>
        {deleteUserId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Confirmar Exclusão
                </h3>
                <button
                  onClick={() => setDeleteUserId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <Trash2 className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-gray-700 text-center">
                    Tem certeza que deseja deletar este administrador? Esta ação
                    não pode ser desfeita.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteUserId(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteUserId)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Deletar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
