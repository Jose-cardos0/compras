import { useState, useEffect } from "react";
import { migrationService } from "../services/migration";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Loader,
  Trash2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

const MigrationPage = () => {
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [cleaningResult, setCleaningResult] = useState(null);
  const { userPermissions } = useAuth();
  const navigate = useNavigate();

  // Verificar se o usuário tem permissão de admin principal
  const isMainAdmin = userPermissions?.isMainAdmin;

  useEffect(() => {
    if (!isMainAdmin) {
      toast.error(
        "Acesso negado. Apenas administradores principais podem acessar esta página."
      );
      navigate("/admin/dashboard");
      return;
    }

    checkMigrationStatus();
  }, [isMainAdmin, navigate]);

  const checkMigrationStatus = async () => {
    try {
      const status = await migrationService.checkMigrationStatus();
      setMigrationStatus(status);
    } catch (error) {
      console.error("Erro ao verificar status da migração:", error);
      toast.error("Erro ao verificar status da migração");
    }
  };

  const handleCleanDuplicates = async () => {
    if (!migrationStatus || migrationStatus.duplicateCount === 0) {
      toast.error("Não há duplicatas para limpar!");
      return;
    }

    setIsCleaning(true);
    setCleaningResult(null);

    try {
      toast.loading("Limpando duplicatas...", { id: "cleaning" });

      const result = await migrationService.cleanDuplicates();

      toast.success("Limpeza de duplicatas concluída!", { id: "cleaning" });
      setCleaningResult(result);

      // Atualizar status
      await checkMigrationStatus();
    } catch (error) {
      console.error("Erro durante limpeza:", error);
      toast.error("Erro durante limpeza de duplicatas", { id: "cleaning" });
    } finally {
      setIsCleaning(false);
    }
  };

  const handleMigration = async () => {
    if (!migrationStatus || migrationStatus.nonMigratedOrders === 0) {
      toast.error("Não há pedidos para migrar!");
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      toast.loading("Iniciando migração...", { id: "migration" });

      const result = await migrationService.migrateExistingOrders();

      toast.success("Migração concluída com sucesso!", { id: "migration" });
      setMigrationResult(result);

      // Atualizar status
      await checkMigrationStatus();
    } catch (error) {
      console.error("Erro durante a migração:", error);
      toast.error("Erro durante a migração", { id: "migration" });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleResetCounter = async () => {
    if (
      !window.confirm(
        "⚠️ ATENÇÃO: Isso irá resetar o contador de IDs para 0. Tem certeza?"
      )
    ) {
      return;
    }

    try {
      toast.loading("Resetando contador...", { id: "reset" });

      await migrationService.resetIdCounter();

      toast.success("Contador resetado com sucesso!", { id: "reset" });

      // Atualizar status
      await checkMigrationStatus();
    } catch (error) {
      console.error("Erro ao resetar contador:", error);
      toast.error("Erro ao resetar contador", { id: "reset" });
    }
  };

  if (!isMainAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Database className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Migração de IDs
                </h1>
                <p className="text-gray-600">
                  Converter IDs complexos para sistema numérico
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status da Migração */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg my-8">
          <p className="text-2xl text-yellow-800">
            ⚠️ ATENÇÃO ADMIN: Esta página é para uso exclusivo do PROGRAMADOR.
            Não compartilhe com outros usuários.
          </p>
        </div>
        {migrationStatus && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-600" />
              Status da Migração
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {migrationStatus.totalOrders}
                    </p>
                  </div>
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Migrados
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {migrationStatus.migratedOrders}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">
                      Pendentes
                    </p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {migrationStatus.nonMigratedOrders}
                    </p>
                  </div>
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">
                      Duplicatas
                    </p>
                    <p className="text-2xl font-bold text-red-900">
                      {migrationStatus.duplicateCount}
                    </p>
                  </div>
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      Progresso
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {migrationStatus.migrationProgress.toFixed(1)}%
                    </p>
                  </div>
                  <RefreshCw className="h-6 w-6 text-purple-600" />
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">
                      Grupos
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      {migrationStatus.duplicates}
                    </p>
                  </div>
                  <Trash2 className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${migrationStatus.migrationProgress}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={checkMigrationStatus}
                  disabled={isMigrating || isCleaning}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isMigrating || isCleaning ? "animate-spin" : ""
                    }`}
                  />
                  <span>Atualizar Status</span>
                </button>

                <button
                  onClick={handleResetCounter}
                  disabled={isMigrating || isCleaning}
                  className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  title="Resetar contador de IDs para 0"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Resetar Contador</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {migrationStatus.duplicateCount > 0 && (
                  <button
                    onClick={handleCleanDuplicates}
                    disabled={isMigrating || isCleaning}
                    className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isCleaning ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span>
                      {isCleaning
                        ? "Limpando..."
                        : `Limpar ${migrationStatus.duplicateCount} Duplicatas`}
                    </span>
                  </button>
                )}

                {migrationStatus.nonMigratedOrders > 0 && (
                  <button
                    onClick={handleMigration}
                    disabled={isMigrating || isCleaning}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isMigrating ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    <span>
                      {isMigrating
                        ? "Migrando..."
                        : `Migrar ${migrationStatus.nonMigratedOrders} Pedidos`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resultado da Limpeza */}
        {cleaningResult && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-red-600" />
              Resultado da Limpeza de Duplicatas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-600">
                  Duplicatas Removidas
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {cleaningResult.deletedCount}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-600">Erros</p>
                <p className="text-2xl font-bold text-red-900">
                  {cleaningResult.errorCount}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-600">
                  Total de Duplicatas
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {cleaningResult.totalDuplicates}
                </p>
              </div>
            </div>

            {cleaningResult.errorCount > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Algumas duplicatas não puderam ser removidas. Verifique os
                  logs do console para mais detalhes.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Resultado da Migração */}
        {migrationResult && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Resultado da Migração
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-600">
                  Migrados com Sucesso
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {migrationResult.migratedCount}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-600">
                  Pulos (Já Migrados)
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {migrationResult.skippedCount || 0}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-600">Erros</p>
                <p className="text-2xl font-bold text-red-900">
                  {migrationResult.errorCount}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-purple-600">
                  Total Processado
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {migrationResult.totalOrders}
                </p>
              </div>
            </div>

            {migrationResult.errorCount > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Alguns pedidos não puderam ser migrados. Verifique os logs
                  do console para mais detalhes.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Informações sobre a Migração */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Sobre a Migração
          </h2>

          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-900">Novo Sistema de IDs</p>
                <p>
                  Os pedidos agora usam IDs numéricos sequenciais (0001, 0002,
                  0003...) em vez dos IDs complexos do Firebase.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-900">
                  Limpeza de Duplicatas
                </p>
                <p>
                  O sistema identifica e remove automaticamente pedidos
                  duplicados baseado em nome, setor e data de criação.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-900">Processo Seguro</p>
                <p>
                  A migração é feita de forma segura, mantendo sempre o pedido
                  mais antigo e removendo duplicatas.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-900">Rastreabilidade</p>
                <p>
                  O ID original é mantido no campo "originalId" para referência
                  futura.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>🚨 ATENÇÃO:</strong> Esta migração deve ser executada
              apenas uma vez. Após a migração, todos os novos pedidos usarão
              automaticamente o sistema de IDs numéricos. A limpeza de
              duplicatas remove permanentemente os pedidos duplicados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationPage;
