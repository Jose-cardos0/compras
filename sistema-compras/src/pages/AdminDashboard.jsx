import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ordersService } from "../services/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  User,
  Calendar,
  MessageSquare,
  Phone,
  Building,
  CheckCircle,
  Clock,
  Play,
  XCircle,
  Edit3,
  LogOut,
  Users,
  Filter,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [additionalData, setAdditionalData] = useState({});
  const [filterStatus, setFilterStatus] = useState("");

  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const statusConfig = {
    pendente: { label: "Pendente", color: "bg-yellow-500", icon: Clock },
    em_analise: { label: "Em Análise", color: "bg-blue-500", icon: Play },
    em_andamento: { label: "Em Andamento", color: "bg-purple-500", icon: Play },
    cancelado: {
      label: "Cancelado/Negado",
      color: "bg-red-500",
      icon: XCircle,
    },
    entregue: { label: "Entregue", color: "bg-green-500", icon: CheckCircle },
  };

  useEffect(() => {
    const unsubscribe = ordersService.subscribeToOrders((ordersData) => {
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      await ordersService.updateOrderStatus(
        selectedOrder.id,
        newStatus,
        additionalData
      );
      toast.success("Status atualizado com sucesso!");
      setStatusModal(false);
      setSelectedOrder(null);
      setNewStatus("");
      setAdditionalData({});
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusModal(true);
  };

  const filteredOrders = filterStatus
    ? orders.filter((order) => order.status === filterStatus)
    : orders;

  const formatDate = (timestamp) => {
    if (!timestamp) return "Data não disponível";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return (
      date.toLocaleDateString("pt-BR") +
      " às " +
      date.toLocaleTimeString("pt-BR")
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

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
              <img
                src="https://i.ibb.co/DPCKjMYN/2024.webp"
                alt="Logo da Empresa"
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dashboard Administrativo
                </h1>
                <p className="text-gray-600">Gerencie os pedidos de compras</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin/users")}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users className="h-5 w-5" />
                <span>Gerenciar Usuários</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = orders.filter(
              (order) => order.status === status
            ).length;
            const Icon = config.icon;
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
              >
                <div className="flex items-center">
                  <div className={`${config.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {config.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Filtrar Pedidos
            </h2>
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os Status</option>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <option key={status} value={status}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Pedidos ({filteredOrders.length})
          </h2>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-500">
                {filterStatus
                  ? "Não há pedidos com este status."
                  : "Ainda não há pedidos cadastrados."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredOrders.map((order, index) => {
                const statusInfo = statusConfig[order.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-200"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`${statusInfo.color} p-2 rounded-lg`}>
                            <StatusIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {order.produto}
                            </h3>
                            <p className="text-sm text-gray-600">
                              por {order.nomeCompleto}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => openStatusModal(order)}
                          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Editar Status</span>
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            Setor: {order.setor}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            Destino: {order.setorDestino}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {order.whatsapp}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            Especificações:
                          </h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {order.especificacoes}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            Motivo:
                          </h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {order.motivo}
                          </p>
                        </div>

                        {order.dataPrevisao && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              Data Prevista:
                            </h4>
                            <p className="text-sm text-green-700 font-medium">
                              {order.dataPrevisao}
                            </p>
                          </div>
                        )}

                        {order.motivoCancelamento && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              Motivo do Cancelamento:
                            </h4>
                            <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                              {order.motivoCancelamento}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Status */}
      <AnimatePresence>
        {statusModal && (
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
                  Atualizar Status
                </h3>
                <button
                  onClick={() => setStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Novo Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <option key={status} value={status}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {newStatus === "em_andamento" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Prevista de Chegada
                    </label>
                    <input
                      type="date"
                      value={additionalData.dataPrevisao || ""}
                      onChange={(e) =>
                        setAdditionalData({
                          ...additionalData,
                          dataPrevisao: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {newStatus === "cancelado" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo do Cancelamento
                    </label>
                    <textarea
                      value={additionalData.motivoCancelamento || ""}
                      onChange={(e) =>
                        setAdditionalData({
                          ...additionalData,
                          motivoCancelamento: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite o motivo do cancelamento..."
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setStatusModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Atualizar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
