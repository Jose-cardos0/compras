import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usersService } from "../services/firestore";
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
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editPermissions, setEditPermissions] = useState([]);
  const [editCanManageUsers, setEditCanManageUsers] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const { currentUser, availableStatuses, userPermissions } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await usersService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
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
      loadUsers();
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
      loadUsers();
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
      loadUsers();
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
                  Cadastre e gerencie administradores com permissões
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              <span>Novo Usuário</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="bg-blue-500 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total de Usuários
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.length}
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
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Administradores
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.role === "admin").length}
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
              <div className="bg-purple-500 p-3 rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Com Permissões
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    users.filter(
                      (u) => u.allowedStatuses && u.allowedStatuses.length > 0
                    ).length
                  }
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Usuários Cadastrados
            </h2>
          </div>

          {users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum usuário cadastrado
              </h3>
              <p className="text-gray-500 mb-6">
                Crie o primeiro usuário administrador
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Criar Usuário</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors duration-150 "
                >
                  <div className="flex items-center justify-between max-md:flex-col">
                    <div className="flex items-center space-x-4 max-md:flex-col ">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg max-md:mb-4">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.name}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1 flex-wrap max-md:flex-col max-md:items-start max-md:space-x-0">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {user.email}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Shield className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {user.role}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {formatDate(user.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">
                            Permissões:
                          </p>
                          <p className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded">
                            {formatPermissions(user.allowedStatuses)}
                          </p>
                          {user.canManageUsers && (
                            <p className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded mt-1">
                              Pode gerenciar usuários
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 max-md:mt-4 max-md:ml-0 max-md:justify-center max-md:w-full">
                      {/* Botão Editar Permissões */}
                      <button
                        onClick={() => openEditModal(user)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        title="Editar Permissões"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="max-md:hidden">Editar</span>
                      </button>

                      {/* Botão Deletar */}
                      <button
                        onClick={() => setDeleteUserId(user.id)}
                        className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        title="Deletar Usuário"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="max-md:hidden">Deletar</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criar Usuário */}
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
                {/* Informações Básicas */}
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

                {/* Permissões de Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissões de Status - Quais status este usuário pode
                    alterar?
                  </label>

                  {/* Explicação do fluxo de status */}
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">
                      📋 Fluxo de Status do Sistema:
                    </h4>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>
                        <strong>Pendente</strong> → Em Análise, Cancelado
                      </p>
                      <p>
                        <strong>Em Análise</strong> → Em Andamento, Pendente,
                        Cancelado
                      </p>
                      <p>
                        <strong>Em Andamento</strong> → Entregue, Cancelado
                      </p>
                      <p>
                        <strong>Cancelado/Entregue</strong> → Não pode ser
                        alterado
                      </p>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      ⚠️ Usuários só podem alterar status seguindo este fluxo!
                    </p>
                  </div>

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
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">
                            {status.label}
                          </span>
                        </div>
                      </label>
                    ))}

                    {selectedPermissions.length === 0 && (
                      <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                        ⚠️ Usuário não poderá alterar nenhum status!
                      </p>
                    )}

                    {selectedPermissions.length > 0 && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-xs text-green-700 font-medium mb-1">
                          Permissões selecionadas:
                        </p>
                        <p className="text-xs text-green-600">
                          {selectedPermissions
                            .map((perm) => {
                              const statusInfo = availableStatuses.find(
                                (s) => s.value === perm
                              );
                              return statusInfo ? statusInfo.label : perm;
                            })
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Permissão de Gerenciar Usuários */}
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer bg-blue-50 p-3 rounded-lg">
                    <input
                      type="checkbox"
                      checked={canManageUsers}
                      onChange={(e) => setCanManageUsers(e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Pode gerenciar outros usuários
                      </span>
                    </div>
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
                    Criar Usuário
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Editar Usuário */}
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

              {/* Informações do Usuário */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {editingUser.name}
                    </h4>
                    <p className="text-sm text-gray-600">{editingUser.email}</p>
                    <p className="text-xs text-gray-500">
                      Criado em: {formatDate(editingUser.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Permissões de Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissões de Status - Quais status este usuário pode
                    alterar?
                  </label>

                  {/* Explicação do fluxo de status */}
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">
                      📋 Fluxo de Status do Sistema:
                    </h4>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>
                        <strong>Pendente</strong> → Em Análise, Cancelado
                      </p>
                      <p>
                        <strong>Em Análise</strong> → Em Andamento, Pendente,
                        Cancelado
                      </p>
                      <p>
                        <strong>Em Andamento</strong> → Entregue, Cancelado
                      </p>
                      <p>
                        <strong>Cancelado/Entregue</strong> → Não pode ser
                        alterado
                      </p>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      ⚠️ Usuários só podem alterar status seguindo este fluxo!
                    </p>
                  </div>

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
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">
                            {status.label}
                          </span>
                        </div>
                      </label>
                    ))}

                    {editPermissions.length === 0 && (
                      <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                        ⚠️ Usuário não poderá alterar nenhum status!
                      </p>
                    )}

                    {editPermissions.length > 0 && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-xs text-green-700 font-medium mb-1">
                          Permissões selecionadas:
                        </p>
                        <p className="text-xs text-green-600">
                          {editPermissions
                            .map((perm) => {
                              const statusInfo = availableStatuses.find(
                                (s) => s.value === perm
                              );
                              return statusInfo ? statusInfo.label : perm;
                            })
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Permissão de Gerenciar Usuários */}
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer bg-blue-50 p-3 rounded-lg">
                    <input
                      type="checkbox"
                      checked={editCanManageUsers}
                      onChange={(e) => setEditCanManageUsers(e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Pode gerenciar outros usuários
                      </span>
                    </div>
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
                    Tem certeza que deseja deletar este usuário? Esta ação não
                    pode ser desfeita.
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
