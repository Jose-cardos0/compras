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
  ChevronDown,
  ChevronRight,
  PackageOpen,
  Car,
  Hourglass,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [additionalData, setAdditionalData] = useState({});
  const [filterStatus, setFilterStatus] = useState("");
  const [filterById, setFilterById] = useState("");
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [isProductUpdate, setIsProductUpdate] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [orderToCancel, setOrderToCancel] = useState(null);

  const {
    currentUser,
    logout,
    getAllowedStatuses,
    getAllowedStatusesFrom,
    canChangeStatus,
    canChangeStatusFrom,
    userPermissions,
  } = useAuth();
  const navigate = useNavigate();

  const statusConfig = {
    pendente: { label: "Pendente", color: "bg-yellow-500", icon: Clock },
    em_analise: { label: "Em Análise", color: "bg-blue-500", icon: Hourglass },
    em_andamento: {
      label: "Em Andamento",
      color: "bg-purple-500",
      icon: Car,
    },
    cancelado: {
      label: "Cancelado",
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

    // Obter status atual
    const currentStatus =
      isProductUpdate && selectedProduct
        ? selectedProduct.status
        : getOrderStatus(selectedOrder);

    // Verificar permissões com base no fluxo de status
    if (!canChangeStatusFrom(currentStatus, newStatus)) {
      toast.error(
        "Você não pode alterar para este status a partir do status atual!"
      );
      return;
    }

    try {
      let result;

      if (isProductUpdate && selectedProduct) {
        // Atualizar status de produto individual
        result = await ordersService.updateProductStatus(
          selectedOrder.id,
          selectedProduct.id,
          newStatus,
          additionalData
        );
      } else {
        // Atualizar status geral do pedido
        result = await ordersService.updateOrderStatus(
          selectedOrder.id,
          newStatus,
          additionalData
        );
      }

      // Tratar resultado do WhatsApp
      if (result && result.success) {
        toast.success(
          <div className="text-sm">
            <p className="font-semibold mb-2">
              {isProductUpdate ? "Produto" : "Pedido"} atualizado! WhatsApp
              aberto automaticamente!
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.whatsappLink);
                toast.success("Link copiado!", { duration: 2000 });
              }}
              className="text-blue-600 hover:text-blue-800 underline text-xs"
            >
              📋 Clique para copiar o link
            </button>
          </div>,
          { duration: 8000 }
        );
      } else if (result && !result.success) {
        toast.error(
          <div className="text-sm">
            <p className="font-semibold mb-2">
              {isProductUpdate ? "Produto" : "Pedido"} atualizado! Erro ao abrir
              WhatsApp automaticamente
            </p>
            <a
              href={result.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline text-xs"
            >
              🔗 Clique aqui para abrir WhatsApp
            </a>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.success(
          `${isProductUpdate ? "Produto" : "Pedido"} atualizado com sucesso!`
        );
      }

      setStatusModal(false);
      setSelectedOrder(null);
      setSelectedProduct(null);
      setNewStatus("");
      setAdditionalData({});
      setIsProductUpdate(false);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleCancelCompleteOrder = async () => {
    if (!orderToCancel) return;

    try {
      const result = await ordersService.cancelCompleteOrder(
        orderToCancel.id,
        cancelReason
      );

      if (result && result.success) {
        toast.success(
          <div className="text-sm">
            <p className="font-semibold mb-2">
              Pedido cancelado completamente! Cliente notificado via WhatsApp!
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.result.whatsappLink);
                toast.success("Link copiado!", { duration: 2000 });
              }}
              className="text-blue-600 hover:text-blue-800 underline text-xs"
            >
              📋 Clique para copiar o link
            </button>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.success("Pedido cancelado completamente!");
      }

      setCancelModal(false);
      setOrderToCancel(null);
      setCancelReason("");
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
      toast.error("Erro ao cancelar pedido completo");
    }
  };

  const openStatusModal = (order, product = null) => {
    setSelectedOrder(order);
    setSelectedProduct(product);
    setIsProductUpdate(!!product);

    // Definir status atual para determinar opções disponíveis
    const currentStatus = product ? product.status : getOrderStatus(order);
    setNewStatus(currentStatus);
    setStatusModal(true);
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getOrderStatus = (order) => {
    if (!order.produtos || order.produtos.length === 0) {
      return order.status || "pendente";
    }

    // Verificar status dos produtos
    const productStatuses = order.produtos.map((p) => p.status);
    const uniqueStatuses = [...new Set(productStatuses)];

    if (uniqueStatuses.length === 1) {
      return uniqueStatuses[0]; // Todos produtos têm o mesmo status
    }

    // Status mistos - priorizar por ordem de importância
    if (productStatuses.includes("cancelado")) return "cancelado";
    if (productStatuses.includes("entregue")) return "em_andamento"; // Alguns entregues
    if (productStatuses.includes("em_andamento")) return "em_andamento";
    if (productStatuses.includes("em_analise")) return "em_analise";
    return "pendente";
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus
      ? getOrderStatus(order) === filterStatus
      : true;
    const matchesId = filterById
      ? order.id.toLowerCase().includes(filterById.toLowerCase())
      : true;
    return matchesStatus && matchesId;
  });

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

  // Verificar se usuário pode gerenciar usuários
  const canManageUsers =
    userPermissions?.canManageUsers || userPermissions?.isMainAdmin;

  const openCancelModal = (order) => {
    setOrderToCancel(order);
    setCancelModal(true);
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
              <div className="max-md:hidden">
                <h1 className="text-2xl font-bold text-gray-900">
                  Dashboard Administrativo
                </h1>
                <p className="text-gray-600">Gerencie os pedidos de compras</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 max-md:gap-2 max-md:space-x-0">
              {canManageUsers && (
                <button
                  onClick={() => navigate("/admin/users")}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Users className="h-5 w-5" />
                  <span className="max-md:hidden">Gerenciar Usuários</span>
                </button>
              )}
              <button
                onClick={() => navigate("/")}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Package className="h-5 w-5" />
                <span className="max-md:hidden">Ir para o form</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="max-md:text-xs">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = orders.filter(
              (order) => getOrderStatus(order) === status
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

        {/* Informações de Permissões */}
        {!userPermissions?.isMainAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-800">
                Suas Permissões:
              </h3>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Você pode alterar status para:{" "}
              {getAllowedStatuses()
                .map((s) => s.label)
                .join(", ")}
            </p>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 max-md:text-lg">
              Filtrar Pedidos
            </h2>
            <div className="flex items-center space-x-4 ">
              <Filter className="h-5 w-5 text-gray-500 max-md:hidden" />
              <div className="flex items-center space-x-3 max-md:flex-col max-md:space-x-0 max-md:space-y-2">
                <input
                  type="text"
                  placeholder="Buscar por ID..."
                  value={filterById}
                  onChange={(e) => setFilterById(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                />
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
                {(filterStatus || filterById) && (
                  <button
                    onClick={() => {
                      setFilterStatus("");
                      setFilterById("");
                    }}
                    className="flex items-center space-x-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Limpar</span>
                  </button>
                )}
              </div>
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
                const orderStatus = getOrderStatus(order);
                const statusInfo = statusConfig[orderStatus];
                const StatusIcon = statusInfo.icon;
                const isExpanded = expandedOrders.has(order.id);
                const hasProducts = order.produtos && order.produtos.length > 0;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-200"
                  >
                    <div className="p-6 ">
                      <div className="flex items-start justify-between mb-4 max-md:flex-col max-md:space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className={`${statusInfo.color} p-2 rounded-lg`}>
                            <StatusIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900 max-md:text-sm">
                                {hasProducts
                                  ? `Pedido com ${
                                      order.produtos.length
                                    } produto${
                                      order.produtos.length > 1 ? "s" : ""
                                    }`
                                  : order.produto || "Pedido"}
                              </h3>
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
                               font-medium bg-blue-100 text-blue-800 max-md:bg-white"
                              >
                                ID: {order.id.slice(-8).toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              por {order.nomeCompleto}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {hasProducts && (
                            <button
                              onClick={() => toggleExpandOrder(order.id)}
                              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <span>Produtos</span>
                            </button>
                          )}
                          <button
                            onClick={() => openStatusModal(order)}
                            className="flex max-md:hidden items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                            <span>Status Geral</span>
                          </button>
                          {/* Botão para cancelar pedido completo - só aparece se não estiver já cancelado */}
                          {orderStatus !== "cancelado" &&
                            userPermissions?.isMainAdmin && (
                              <button
                                onClick={() => openCancelModal(order)}
                                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                                <span className="max-md:hidden">
                                  Cancelar Pedido
                                </span>
                              </button>
                            )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            ID: {order.id.slice(-12).toUpperCase()}
                          </span>
                        </div>
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

                      {/* Lista de Produtos Expandida */}
                      {hasProducts && isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-200 pt-4 mt-4"
                        >
                          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <PackageOpen className="h-5 w-5 mr-2 text-purple-600" />
                            Produtos do Pedido
                          </h4>
                          <div className="space-y-4">
                            {order.produtos.map((produto, prodIndex) => {
                              const prodStatusInfo =
                                statusConfig[produto.status];
                              const ProdStatusIcon = prodStatusInfo.icon;
                              return (
                                <div
                                  key={produto.id}
                                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className={`${prodStatusInfo.color} p-2 rounded-lg`}
                                      >
                                        <ProdStatusIcon className="h-4 w-4 text-white" />
                                      </div>
                                      <div>
                                        <h5 className="font-semibold text-gray-900">
                                          {produto.produto}
                                        </h5>
                                        <p className="text-sm text-gray-600">
                                          Status: {prodStatusInfo.label}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() =>
                                        openStatusModal(order, produto)
                                      }
                                      className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                      <span>Alterar</span>
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs font-medium text-gray-700 mb-1">
                                        Especificações:
                                      </p>
                                      <p className="text-sm text-gray-600 bg-white p-2 rounded">
                                        {produto.especificacoes}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-700 mb-1">
                                        Motivo:
                                      </p>
                                      <p className="text-sm text-gray-600 bg-white p-2 rounded">
                                        {produto.motivo}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {/* Informações antigas do produto único (compatibilidade) */}
                      {!hasProducts && order.produto && (
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              Produto:
                            </h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {order.produto}
                            </p>
                          </div>
                          {order.especificacoes && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">
                                Especificações:
                              </h4>
                              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                {order.especificacoes}
                              </p>
                            </div>
                          )}
                          {order.motivo && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">
                                Motivo:
                              </h4>
                              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                {order.motivo}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Informações adicionais */}
                      {order.dataPrevisao && (
                        <div className="mt-3">
                          <h4 className="font-medium text-gray-900 mb-1">
                            Data Prevista:
                          </h4>
                          <p className="text-sm text-green-700 font-medium">
                            {order.dataPrevisao}
                          </p>
                        </div>
                      )}

                      {order.motivoCancelamento && (
                        <div className="mt-3">
                          <h4 className="font-medium text-gray-900 mb-1">
                            Motivo do Cancelamento:
                          </h4>
                          <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                            {order.motivoCancelamento}
                          </p>
                        </div>
                      )}
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
                  {isProductUpdate
                    ? "Atualizar Status do Produto"
                    : "Atualizar Status do Pedido"}
                </h3>
                <button
                  onClick={() => setStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {isProductUpdate && selectedProduct && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">
                    Produto: {selectedProduct.produto}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Novo Status
                  </label>
                  {selectedOrder && (
                    <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Status atual:</strong>{" "}
                        {isProductUpdate && selectedProduct
                          ? statusConfig[selectedProduct.status]?.label
                          : statusConfig[getOrderStatus(selectedOrder)]?.label}
                      </p>
                    </div>
                  )}
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione um status</option>
                    {selectedOrder &&
                      getAllowedStatusesFrom(
                        isProductUpdate && selectedProduct
                          ? selectedProduct.status
                          : getOrderStatus(selectedOrder)
                      ).map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                  </select>
                  {selectedOrder &&
                    getAllowedStatusesFrom(
                      isProductUpdate && selectedProduct
                        ? selectedProduct.status
                        : getOrderStatus(selectedOrder)
                    ).length === 0 && (
                      <p className="text-red-500 text-sm mt-1">
                        Não há transições de status disponíveis para o status
                        atual.
                      </p>
                    )}
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
                  disabled={
                    selectedOrder &&
                    getAllowedStatusesFrom(
                      isProductUpdate && selectedProduct
                        ? selectedProduct.status
                        : getOrderStatus(selectedOrder)
                    ).length === 0
                  }
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Atualizar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Cancelar Pedido Completo */}
      <AnimatePresence>
        {cancelModal && (
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
                  ⚠️ Cancelar Pedido Completo
                </h3>
                <button
                  onClick={() => setCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {orderToCancel && (
                <div className="mb-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <h4 className="font-semibold text-red-800">
                        Atenção! Esta ação é irreversível
                      </h4>
                    </div>
                    <p className="text-sm text-red-700">
                      Todos os produtos deste pedido serão cancelados,
                      independente do status atual.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h5 className="font-semibold text-gray-800 mb-2">
                      Pedido: {orderToCancel.id.slice(-8).toUpperCase()}
                    </h5>
                    <p className="text-sm text-gray-600 mb-1">
                      Cliente: <strong>{orderToCancel.nomeCompleto}</strong>
                    </p>
                    {orderToCancel.produtos &&
                    orderToCancel.produtos.length > 0 ? (
                      <p className="text-sm text-gray-600">
                        {orderToCancel.produtos.length} produto
                        {orderToCancel.produtos.length > 1 ? "s" : ""} será
                        {orderToCancel.produtos.length > 1 ? "ão" : ""}{" "}
                        cancelado{orderToCancel.produtos.length > 1 ? "s" : ""}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Produto: {orderToCancel.produto}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo do Cancelamento *
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Digite o motivo pelo qual está cancelando todo o pedido..."
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setCancelModal(false);
                    setOrderToCancel(null);
                    setCancelReason("");
                  }}
                  className="flex-1 max-md:hidden bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar Ação
                </button>
                <button
                  onClick={handleCancelCompleteOrder}
                  disabled={!cancelReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancelar Pedido</span>
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
