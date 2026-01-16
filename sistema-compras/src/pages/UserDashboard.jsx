import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  User,
  LogOut,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
  Building,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { appUsersService } from "../services/firestore";

const UserDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("todos");

  const { currentUser, appUserData, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.email) {
      // Subscrever para atualizações em tempo real
      const unsubscribe = appUsersService.subscribeToUserOrders(
        currentUser.email,
        (ordersData) => {
          setOrders(ordersData);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao sair");
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pendente: {
        label: "Pendente",
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: Clock,
        bgCard: "bg-amber-50",
      },
      em_analise: {
        label: "Em Análise",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: AlertCircle,
        bgCard: "bg-blue-50",
      },
      em_andamento: {
        label: "Em Andamento",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Truck,
        bgCard: "bg-purple-50",
      },
      cancelado: {
        label: "Cancelado",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        bgCard: "bg-red-50",
      },
      entregue: {
        label: "Entregue",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        bgCard: "bg-green-50",
      },
    };
    return configs[status] || configs.pendente;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Data não disponível";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("pt-BR") + " às " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Filtrar pedidos por status
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "todos") return true;
    return order.status === statusFilter;
  });

  // Estatísticas
  const stats = {
    total: orders.length,
    pendente: orders.filter((o) => o.status === "pendente").length,
    em_analise: orders.filter((o) => o.status === "em_analise").length,
    em_andamento: orders.filter((o) => o.status === "em_andamento").length,
    entregue: orders.filter((o) => o.status === "entregue").length,
    cancelado: orders.filter((o) => o.status === "cancelado").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <img
                src="https://i.ibb.co/DPCKjMYN/2024.webp"
                alt="Logo da Empresa"
                className="h-12 w-auto"
              />
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-gray-900">
                  Meus Pedidos
                </h1>
                <p className="text-sm text-gray-500">
                  Acompanhe suas solicitações de compras
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Perfil do usuário */}
              <div className="flex items-center space-x-3">
                {appUserData?.photoURL ? (
                  <img
                    src={appUserData.photoURL}
                    alt={appUserData.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-800">
                    {appUserData?.name || currentUser?.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {appUserData?.setor} • {appUserData?.cargo}
                  </p>
                </div>
              </div>

              {/* Botão de nova solicitação */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/")}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Solicitação</span>
              </motion.button>

              {/* Botão de logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-xl shadow-lg p-4 border-l-4 border-gray-400 cursor-pointer transition-all ${
              statusFilter === "todos" ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setStatusFilter("todos")}
          >
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-white rounded-xl shadow-lg p-4 border-l-4 border-amber-400 cursor-pointer transition-all ${
              statusFilter === "pendente" ? "ring-2 ring-amber-500" : ""
            }`}
            onClick={() => setStatusFilter("pendente")}
          >
            <p className="text-xs text-gray-500 mb-1">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pendente}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-400 cursor-pointer transition-all ${
              statusFilter === "em_analise" ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setStatusFilter("em_analise")}
          >
            <p className="text-xs text-gray-500 mb-1">Em Análise</p>
            <p className="text-2xl font-bold text-blue-600">{stats.em_analise}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-white rounded-xl shadow-lg p-4 border-l-4 border-purple-400 cursor-pointer transition-all ${
              statusFilter === "em_andamento" ? "ring-2 ring-purple-500" : ""
            }`}
            onClick={() => setStatusFilter("em_andamento")}
          >
            <p className="text-xs text-gray-500 mb-1">Em Andamento</p>
            <p className="text-2xl font-bold text-purple-600">{stats.em_andamento}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-400 cursor-pointer transition-all ${
              statusFilter === "entregue" ? "ring-2 ring-green-500" : ""
            }`}
            onClick={() => setStatusFilter("entregue")}
          >
            <p className="text-xs text-gray-500 mb-1">Entregues</p>
            <p className="text-2xl font-bold text-green-600">{stats.entregue}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`bg-white rounded-xl shadow-lg p-4 border-l-4 border-red-400 cursor-pointer transition-all ${
              statusFilter === "cancelado" ? "ring-2 ring-red-500" : ""
            }`}
            onClick={() => setStatusFilter("cancelado")}
          >
            <p className="text-xs text-gray-500 mb-1">Cancelados</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelado}</p>
          </motion.div>
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center"
            >
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {statusFilter === "todos"
                  ? "Nenhum pedido encontrado"
                  : `Nenhum pedido ${getStatusConfig(statusFilter).label.toLowerCase()}`}
              </h3>
              <p className="text-gray-500 mb-6">
                {statusFilter === "todos"
                  ? "Você ainda não fez nenhuma solicitação de compra."
                  : "Não há pedidos com este status no momento."}
              </p>
              {statusFilter === "todos" && (
                <button
                  onClick={() => navigate("/")}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Fazer Primeira Solicitação</span>
                </button>
              )}
            </motion.div>
          ) : (
            filteredOrders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedOrder === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  {/* Header do Pedido */}
                  <div
                    className={`p-6 cursor-pointer ${statusConfig.bgCard}`}
                    onClick={() => toggleOrderExpand(order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${statusConfig.color}`}>
                          <StatusIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-bold text-gray-800">
                              Pedido #{order.id}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                            >
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(order.createdAt)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Building className="h-4 w-4" />
                              <span>{order.setorDestino}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Package className="h-4 w-4" />
                              <span>
                                {order.produtos?.length || 1} produto(s)
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronUp className="h-6 w-6 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-6 space-y-6">
                          {/* Informações adicionais do status */}
                          {order.status === "em_andamento" && order.dataPrevisao && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <p className="text-sm text-purple-800">
                                <strong>Previsão de entrega:</strong>{" "}
                                {order.dataPrevisao}
                              </p>
                            </div>
                          )}

                          {order.status === "cancelado" && order.motivoCancelamento && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="text-sm text-red-800">
                                <strong>Motivo do cancelamento:</strong>{" "}
                                {order.motivoCancelamento}
                              </p>
                            </div>
                          )}

                          {/* Última atualização */}
                          {order.lastModifiedBy && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <p className="text-sm text-gray-600">
                                <strong>Última atualização:</strong>{" "}
                                {order.lastModifiedBy} -{" "}
                                {formatDate(order.lastModifiedAt)}
                              </p>
                            </div>
                          )}

                          {/* Responsável */}
                          {order.responsavel && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-sm text-blue-800">
                                <strong>Responsável:</strong> {order.responsavel}
                              </p>
                            </div>
                          )}

                          {/* Lista de Produtos */}
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">
                              Produtos Solicitados
                            </h4>
                            <div className="space-y-4">
                              {order.produtos?.map((produto, idx) => {
                                const produtoStatus = getStatusConfig(
                                  produto.status || order.status
                                );
                                return (
                                  <div
                                    key={produto.id || idx}
                                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <h5 className="font-semibold text-gray-800">
                                            {produto.produto}
                                          </h5>
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${produtoStatus.color}`}
                                          >
                                            {produtoStatus.label}
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                          <p>
                                            <span className="font-medium">Quantidade:</span>{" "}
                                            {produto.quantidade} {produto.metrica}
                                          </p>
                                          {produto.especificacoes && (
                                            <p className="col-span-2">
                                              <span className="font-medium">Especificações:</span>{" "}
                                              {produto.especificacoes}
                                            </p>
                                          )}
                                          {produto.motivo && (
                                            <p className="col-span-2">
                                              <span className="font-medium">Motivo:</span>{" "}
                                              {produto.motivo}
                                            </p>
                                          )}
                                        </div>

                                        {/* Previsão e cancelamento por produto */}
                                        {produto.dataPrevisao && (
                                          <p className="text-sm text-purple-600 mt-2">
                                            <strong>Previsão:</strong> {produto.dataPrevisao}
                                          </p>
                                        )}
                                        {produto.motivoCancelamento && (
                                          <p className="text-sm text-red-600 mt-2">
                                            <strong>Motivo cancelamento:</strong>{" "}
                                            {produto.motivoCancelamento}
                                          </p>
                                        )}

                                        {/* Arquivos anexados */}
                                        {produto.files && produto.files.length > 0 && (
                                          <div className="mt-3">
                                            <p className="text-xs font-medium text-gray-500 mb-2">
                                              Arquivos anexados:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                              {produto.files.map((file, fileIdx) => (
                                                <a
                                                  key={fileIdx}
                                                  href={file.downloadURL}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex items-center space-x-1 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                                                >
                                                  {file.fileType?.startsWith("image/") ? (
                                                    <ImageIcon className="h-3 w-3" />
                                                  ) : (
                                                    <FileText className="h-3 w-3" />
                                                  )}
                                                  <span className="truncate max-w-[100px]">
                                                    {file.fileName}
                                                  </span>
                                                  <ExternalLink className="h-3 w-3" />
                                                </a>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Observações */}
                          {order.observacao && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <p className="text-sm font-medium text-yellow-800 mb-1">
                                Observação:
                              </p>
                              <p className="text-sm text-yellow-700">
                                {order.observacao}
                              </p>
                              {order.observacaoAutor && (
                                <p className="text-xs text-yellow-600 mt-2">
                                  Por: {order.observacaoAutor}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Comentários */}
                          {order.comentarios && order.comentarios.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                                Comentários
                              </h4>
                              <div className="space-y-3">
                                {order.comentarios.map((comentario, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                  >
                                    <p className="text-sm text-gray-800">
                                      {comentario.texto}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                      {comentario.autor} -{" "}
                                      {formatDate(comentario.createdAt)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

