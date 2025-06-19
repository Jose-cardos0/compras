import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import { storageService } from "../services/storage";
import toast from "react-hot-toast";

const FileUpload = ({ onFilesSelected, selectedFiles = [], maxFiles = 10 }) => {
  const [previews, setPreviews] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const invalidFiles = [];

    // Validar cada arquivo
    fileArray.forEach((file) => {
      const validation = storageService.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ file, error: validation.error });
      }
    });

    // Mostrar erros de arquivos inválidos
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ file, error }) => {
        toast.error(`${file.name}: ${error}`);
      });
    }

    // Verificar limite de arquivos
    const totalFiles = selectedFiles.length + validFiles.length;
    if (totalFiles > maxFiles) {
      toast.error(`Máximo de ${maxFiles} arquivos permitidos`);
      return;
    }

    // Adicionar arquivos válidos
    if (validFiles.length > 0) {
      const newFiles = [...selectedFiles, ...validFiles];
      onFilesSelected(newFiles);

      // Criar previews para os novos arquivos
      const newPreviews = [...previews];
      validFiles.forEach((file) => {
        if (storageService.isImage(file.type)) {
          const reader = new FileReader();
          reader.onload = (e) => {
            newPreviews.push({
              file,
              preview: e.target.result,
              type: "image",
            });
            setPreviews((prev) => [
              ...prev,
              {
                file,
                preview: e.target.result,
                type: "image",
              },
            ]);
          };
          reader.readAsDataURL(file);
        } else {
          const newPreview = {
            file,
            preview: null,
            type: "pdf",
          };
          newPreviews.push(newPreview);
          setPreviews((prev) => [...prev, newPreview]);
        }
      });

      toast.success(`${validFiles.length} arquivo(s) selecionado(s)`);
    }
  };

  // Atualizar previews quando selectedFiles mudar
  useEffect(() => {
    if (selectedFiles.length === 0) {
      setPreviews([]);
    }
  }, [selectedFiles]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onFilesSelected(newFiles);
    setPreviews(newPreviews);
    toast.success("Arquivo removido");
  };

  return (
    <div className="space-y-4">
      {/* Área de Upload */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="text-center">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Clique para selecionar ou arraste arquivos aqui
          </p>
          <p className="text-xs text-gray-500">
            Suporte: JPG, PNG, WEBP, PDF (máx. 10MB cada)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Máximo {maxFiles} arquivos • Os arquivos serão enviados junto com o
            pedido
          </p>
        </div>
      </div>

      {/* Preview dos Arquivos */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">
                Arquivos selecionados ({selectedFiles.length})
              </h4>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                ✓ Prontos para envio
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {previews.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* Preview da Imagem */}
                  {item.type === "image" && item.preview ? (
                    <div className="aspect-square">
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    /* Preview do PDF */
                    <div className="aspect-square flex items-center justify-center bg-red-50">
                      <FileText className="h-8 w-8 text-red-600" />
                    </div>
                  )}

                  {/* Overlay com informações */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <button
                      onClick={() => removeFile(index)}
                      className="opacity-0 group-hover:opacity-100 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Nome e tamanho do arquivo */}
                  <div className="p-2 bg-white">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {storageService.formatFileSize(item.file.size)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Informação sobre envio */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  {selectedFiles.length} arquivo
                  {selectedFiles.length > 1 ? "s" : ""} será
                  {selectedFiles.length > 1 ? "ão" : ""} enviado
                  {selectedFiles.length > 1 ? "s" : ""} automaticamente quando
                  você enviar o pedido
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;
