import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Package,
  User,
  Building,
  FileText,
  MessageSquare,
  Phone,
  Send,
  Shield,
  Plus,
  Trash2,
  Paperclip,
  Image as ImageIcon,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { ordersService } from "../services/firestore";
import { validatePhoneNumber, formatPhoneNumber } from "../services/whatsapp";
import FileUpload from "../components/FileUpload";
import { storageService } from "../services/storage";
import { useAuth } from "../contexts/AuthContext";

const OrderForm = () => {
  const [loading, setLoading] = useState(false);
  const [productFiles, setProductFiles] = useState({}); // Armazenar arquivos por produto
  const navigate = useNavigate();
  const { currentUser, appUserData, logout } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
  } = useForm({
    defaultValues: {
      nomeCompleto: "",
      setor: "",
      whatsapp: "",
      produtos: [
        {
          produto: "",
          especificacoes: "",
          motivo: "",
          quantidade: 1,
          metrica: "UN",
        },
      ], // Pelo menos 1 produto
    },
  });

  // Preencher campos com dados do usuário logado
  useEffect(() => {
    if (appUserData) {
      setValue("nomeCompleto", appUserData.name || "");
      setValue("setor", appUserData.setor || "");
    }
  }, [appUserData, setValue]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao sair");
    }
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "produtos",
  });

  const setorOptions = [
    "Químicos",
    "Subestação",
    "Escritório",
    "Pátio",
    "Plataforma de Recepção",
    "Empacotamento",
    "Produção",
    "Câmera Fria",
    "Sala de Máquinas",
    "Laboratório",
    "Pasteurização",
    "Envase UHT",
    "FINAL DE LINHA (DES)",
    "Expedição",
    "Concentração",
    "Secagem",
    "Caldeira",
    "ETE",
    "Lavanderia",
    "Almoxarifado",
    "Outro",
  ];

  const addProduct = () => {
    append({
      produto: "",
      especificacoes: "",
      motivo: "",
      quantidade: 1,
      metrica: "UN",
    });
  };

  const removeProduct = (index) => {
    if (fields.length > 1) {
      remove(index);
      // Remover arquivos deste produto
      const newProductFiles = { ...productFiles };
      delete newProductFiles[index];
      // Reajustar índices
      const adjustedFiles = {};
      Object.keys(newProductFiles).forEach((key) => {
        const keyIndex = parseInt(key);
        if (keyIndex > index) {
          adjustedFiles[keyIndex - 1] = newProductFiles[key];
        } else {
          adjustedFiles[key] = newProductFiles[key];
        }
      });
      setProductFiles(adjustedFiles);
    } else {
      toast.error("Deve haver pelo menos 1 produto!");
    }
  };

  const handleFilesSelected = (productIndex, files) => {
    setProductFiles((prev) => ({
      ...prev,
      [productIndex]: files,
    }));
  };

  const removeFileFromProduct = (productIndex, fileIndex) => {
    setProductFiles((prev) => ({
      ...prev,
      [productIndex]:
        prev[productIndex]?.filter((_, i) => i !== fileIndex) || [],
    }));
    toast.success("Arquivo removido");
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Validar e formatar número de WhatsApp
      if (!validatePhoneNumber(data.whatsapp)) {
        toast.error("Número de WhatsApp inválido");
        setLoading(false);
        return;
      }

      // Validar se todos os produtos estão preenchidos
      const produtosValidos = data.produtos.every(
        (produto) =>
          produto.produto.trim() &&
          produto.especificacoes.trim() &&
          produto.motivo.trim() &&
          produto.quantidade > 0 &&
          produto.metrica
      );

      if (!produtosValidos) {
        toast.error("Todos os produtos devem estar preenchidos completamente!");
        setLoading(false);
        return;
      }

      const totalFiles = Object.values(productFiles).flat().length;

      // Mostrar toast de progresso se há arquivos para enviar
      if (totalFiles > 0) {
        toast.loading(`Enviando pedido com ${totalFiles} arquivo(s)...`, {
          id: "upload-progress",
        });
      }

      // Gerar ID temporário para o pedido (para organizar arquivos)
      const tempOrderId = `order_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // 1. Fazer upload dos arquivos primeiro (se existirem)
      const produtosComArquivos = await Promise.all(
        data.produtos.map(async (produto, index) => {
          const files = productFiles[index] || [];
          let uploadedFiles = [];

          if (files.length > 0) {
            try {
              // Fazer upload dos arquivos deste produto
              const uploadResults = await storageService.uploadMultipleFiles(
                files,
                tempOrderId,
                `produto_${index}`
              );
              uploadedFiles = uploadResults;
            } catch (uploadError) {
              console.error(
                `Erro no upload dos arquivos do produto ${index + 1}:`,
                uploadError
              );
              toast.error(`Erro ao enviar arquivos do produto ${index + 1}`);
            }
          }

          return {
            ...produto,
            id: `produto_${Date.now()}_${index}`,
            status: "pendente",
            files: uploadedFiles,
          };
        })
      );

      // 2. Criar o pedido completo com todos os arquivos
      const formattedData = {
        ...data,
        whatsapp: formatPhoneNumber(data.whatsapp),
        setorDestino:
          data.setorDestino === "Outro" ? data.setorOutro : data.setorDestino,
        produtos: produtosComArquivos,
        // Adicionar informações do usuário logado
        userEmail: currentUser?.email || "",
        userName: appUserData?.name || data.nomeCompleto,
        userSetor: appUserData?.setor || data.setor,
        userCargo: appUserData?.cargo || "",
      };

      const result = await ordersService.createOrder(formattedData);

      // Dismissar toast de progresso
      if (totalFiles > 0) {
        toast.dismiss("upload-progress");
      }

      // 3. Mostrar mensagem de sucesso
      if (result.whatsappResult && result.whatsappResult.success) {
        toast.success(
          <div className="text-sm">
            <p className="font-semibold mb-2">Pedido enviado com sucesso!</p>
            <p className="text-gray-600 text-xs mb-2">
              ID do Pedido:{" "}
              <span className="font-mono font-bold text-blue-600">
                {result.id}
              </span>
            </p>
            <p className="text-gray-600 text-xs mb-2">
              {data.produtos.length} produto(s) incluído(s) no pedido
            </p>
            {totalFiles > 0 && (
              <p className="text-gray-600 text-xs mb-2">
                📎 {totalFiles} arquivo(s) anexado(s) e enviado(s)
              </p>
            )}
            <p className="text-green-600 text-xs mb-2">
              ✅ Administrador notificado via WhatsApp
            </p>
            <p className="text-blue-600 text-xs mt-1">
              Você receberá atualizações sobre o status dos produtos via
              WhatsApp.
            </p>
            <p className="text-amber-600 text-xs mt-1">
              💡 Seu pedido apareceu no painel administrativo automaticamente.
            </p>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.success(
          `Pedido ${result.id} com ${data.produtos.length} produto(s) e ${totalFiles} arquivo(s) enviado com sucesso! Admin notificado. Você receberá atualizações de status no WhatsApp.`
        );
      }

      reset();
      setProductFiles({});
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      toast.dismiss("upload-progress");
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const removerAcentos = (texto) =>
    texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header com Logo e Usuário */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <img
                src="https://i.ibb.co/DPCKjMYN/2024.webp"
                alt="Logo da Empresa"
                className="h-12 w-auto"
              />
            </div>

            {/* Usuário logado e ações */}
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

              {/* Botão Meus Pedidos */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/dashboard")}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">Meus Pedidos</span>
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
                    onChange={(e) => {
                      const textoLimpo = removerAcentos(e.target.value);
                      e.target.value = textoLimpo;
                    }}
                    readOnly={!!appUserData?.name}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      appUserData?.name ? "bg-gray-100 text-gray-600" : ""
                    }`}
                    placeholder="Digite seu nome completo"
                  />
                  {errors.nomeCompleto && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.nomeCompleto.message}
                    </p>
                  )}
                  {appUserData?.name && (
                    <p className="text-xs text-gray-500 mt-1">
                      Dados do seu cadastro
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Setor *
                  </label>
                  <input
                    {...register("setor", { required: "Setor é obrigatório" })}
                    readOnly={!!appUserData?.setor}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      appUserData?.setor ? "bg-gray-100 text-gray-600" : ""
                    }`}
                    placeholder="Digite seu setor"
                  />
                  {errors.setor && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.setor.message}
                    </p>
                  )}
                  {appUserData?.setor && (
                    <p className="text-xs text-gray-500 mt-1">
                      Dados do seu cadastro
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

            {/* Lista de Produtos */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Package className="h-6 w-6 text-purple-600" />
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Lista de Produtos ({fields.length})
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={addProduct}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Produto</span>
                </motion.button>
              </div>

              {/* Produtos Dinâmicos */}
              <AnimatePresence mode="popLayout">
                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Produto {index + 1}
                        </h3>
                        {fields.length > 1 && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => removeProduct(index)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome do Produto *
                          </label>
                          <input
                            {...register(`produtos.${index}.produto`, {
                              required: "Nome do produto é obrigatório",
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            placeholder="Digite o nome do produto"
                          />
                          {errors.produtos?.[index]?.produto && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.produtos[index].produto.message}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantidade *
                            </label>
                            <input
                              {...register(`produtos.${index}.quantidade`, {
                                required: "Quantidade é obrigatória",
                                min: {
                                  value: 1,
                                  message: "Quantidade deve ser pelo menos 1",
                                },
                                valueAsNumber: true,
                              })}
                              type="number"
                              min="1"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                              placeholder="Ex: 5"
                            />
                            {errors.produtos?.[index]?.quantidade && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.produtos[index].quantidade.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Métrica *
                            </label>
                            <select
                              {...register(`produtos.${index}.metrica`, {
                                required: "Métrica é obrigatória",
                              })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="UN">UN (Unidade)</option>
                              <option value="PC">PC (Peça)</option>
                              <option value="MT">MT (Metro)</option>
                              <option value="KG">KG (Quilograma)</option>
                              <option value="LT">LT (Litro)</option>
                            </select>
                            {errors.produtos?.[index]?.metrica && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.produtos[index].metrica.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Especificações Técnicas *
                          </label>
                          <textarea
                            {...register(`produtos.${index}.especificacoes`, {
                              required: "Especificações são obrigatórias",
                            })}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            placeholder="Descreva as especificações técnicas..."
                          />
                          {errors.produtos?.[index]?.especificacoes && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.produtos[index].especificacoes.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo da Solicitação *
                          </label>
                          <textarea
                            {...register(`produtos.${index}.motivo`, {
                              required: "Motivo é obrigatório",
                            })}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            placeholder="Explique o motivo da solicitação..."
                          />
                          {errors.produtos?.[index]?.motivo && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.produtos[index].motivo.message}
                            </p>
                          )}
                        </div>

                        {/* Seção de Upload de Arquivos */}
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <Paperclip className="h-5 w-5 text-purple-600" />
                            <label className="block text-sm font-medium text-gray-700">
                              Anexar Imagens ou PDFs (Opcional)
                            </label>
                          </div>
                          <p className="text-xs text-gray-500 mb-4">
                            Adicione fotos do produto, especificações técnicas,
                            catálogos ou qualquer documento relevante
                          </p>

                          <FileUpload
                            onFilesSelected={(files) =>
                              handleFilesSelected(index, files)
                            }
                            selectedFiles={productFiles[index] || []}
                            maxFiles={10}
                          />

                          {/* Lista de arquivos já anexados */}
                          {productFiles[index] &&
                            productFiles[index].length > 0 && (
                              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <ImageIcon className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-800">
                                    Arquivos Selecionados (
                                    {productFiles[index].length})
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {productFiles[index].map(
                                    (file, fileIndex) => (
                                      <div
                                        key={fileIndex}
                                        className="flex items-center justify-between text-xs"
                                      >
                                        <span className="text-green-700 truncate flex items-center">
                                          {storageService.isImage(file.type) ? (
                                            <ImageIcon className="h-3 w-3 mr-1" />
                                          ) : (
                                            <FileText className="h-3 w-3 mr-1" />
                                          )}
                                          {file.name}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeFileFromProduct(
                                              index,
                                              fileIndex
                                            )
                                          }
                                          className="text-red-600 hover:text-red-800 ml-2"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AnimatePresence>
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
                  Para qual setor serão os produtos? *
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
                    <span>
                      Enviar Pedido ({fields.length} produto
                      {fields.length > 1 ? "s" : ""}
                      {Object.values(productFiles).flat().length > 0 &&
                        ` + ${
                          Object.values(productFiles).flat().length
                        } arquivo${
                          Object.values(productFiles).flat().length > 1
                            ? "s"
                            : ""
                        }`}
                      )
                    </span>
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
