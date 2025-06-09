import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Package,
  User,
  Building,
  FileText,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";
import { ordersService } from "../services/firestore";
import { validatePhoneNumber, formatPhoneNumber } from "../services/whatsapp";

const OrderForm = () => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const setorOptions = [
    "Máquinas Industriais",
    "Frota",
    "Químicos",
    "Estrutura da Empresa",
    "Limpeza",
    "Cozinha",
    "Escritório",
    "Outro",
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Validar e formatar número de WhatsApp
      if (!validatePhoneNumber(data.whatsapp)) {
        toast.error("Número de WhatsApp inválido");
        setLoading(false);
        return;
      }

      const formattedData = {
        ...data,
        whatsapp: formatPhoneNumber(data.whatsapp),
        // Se o setor for "Outro", usar o valor digitado
        setorDestino:
          data.setorDestino === "Outro" ? data.setorOutro : data.setorDestino,
      };

      await ordersService.createOrder(formattedData);
      toast.success(
        "Pedido enviado com sucesso! Você receberá atualizações no WhatsApp."
      );
      reset();
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header com Logo */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-6">
            <img
              src="https://i.ibb.co/DPCKjMYN/2024.webp"
              alt="Logo da Empresa"
              className="h-16 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Formulário Principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header do Formulário */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-8">
            <div className="text-center">
              <Package className="h-12 w-12 text-white mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">
                Solicitação de Compras
              </h1>
              <p className="text-blue-100">
                Preencha o formulário abaixo para fazer sua solicitação
              </p>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
            {/* Informações Pessoais */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <User className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-800">
                  Informações Pessoais
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    {...register("nomeCompleto", {
                      required: "Nome completo é obrigatório",
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Digite seu nome completo"
                  />
                  {errors.nomeCompleto && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.nomeCompleto.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Setor *
                  </label>
                  <input
                    {...register("setor", { required: "Setor é obrigatório" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Digite seu setor"
                  />
                  {errors.setor && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.setor.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp para Notificações *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    {...register("whatsapp", {
                      required: "WhatsApp é obrigatório",
                    })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                {errors.whatsapp && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.whatsapp.message}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Informações do Produto */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Package className="h-6 w-6 text-purple-600" />
                <h2 className="text-2xl font-semibold text-gray-800">
                  Informações do Produto
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produto Desejado *
                </label>
                <input
                  {...register("produto", {
                    required: "Produto é obrigatório",
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Digite o produto que deseja"
                />
                {errors.produto && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.produto.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especificações Técnicas *
                </label>
                <textarea
                  {...register("especificacoes", {
                    required: "Especificações são obrigatórias",
                  })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Descreva as especificações técnicas do produto..."
                />
                {errors.especificacoes && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.especificacoes.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da Solicitação *
                </label>
                <textarea
                  {...register("motivo", { required: "Motivo é obrigatório" })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Explique o motivo da solicitação..."
                />
                {errors.motivo && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.motivo.message}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Setor de Destino */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Building className="h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl font-semibold text-gray-800">
                  Setor de Destino
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Para qual setor será o produto? *
                </label>
                <select
                  {...register("setorDestino", {
                    required: "Setor de destino é obrigatório",
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Selecione o setor</option>
                  {setorOptions.map((setor) => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>
                {errors.setorDestino && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.setorDestino.message}
                  </p>
                )}
              </div>

              {/* Campo para "Outro" setor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Se selecionou "Outro", especifique:
                </label>
                <input
                  {...register("setorOutro")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Digite o setor específico"
                />
              </div>
            </motion.div>

            {/* Botão de Envio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center pt-6"
            >
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 min-w-[200px] justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Enviar Pedido</span>
                  </>
                )}
              </button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderForm;
