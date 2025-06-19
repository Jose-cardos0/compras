import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
} from "lucide-react";
import { storageService } from "../services/storage";

const FileViewer = ({ files, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !files || files.length === 0) return null;

  const currentFile = files[currentIndex];
  const isImage = storageService.isImage(currentFile.fileType);
  const isPDF = storageService.isPDF(currentFile.fileType);

  const nextFile = () => {
    setCurrentIndex((prev) => (prev + 1) % files.length);
    resetTransforms();
  };

  const prevFile = () => {
    setCurrentIndex((prev) => (prev - 1 + files.length) % files.length);
    resetTransforms();
  };

  const resetTransforms = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = currentFile.downloadURL;
    link.download = currentFile.fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-7xl max-h-full w-full h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <h3 className="text-lg font-semibold truncate max-w-md">
                  {currentFile.fileName}
                </h3>
                <p className="text-sm text-gray-300">
                  {currentIndex + 1} de {files.length} •{" "}
                  {storageService.formatFileSize(currentFile.fileSize)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Controles de imagem */}
              {isImage && (
                <>
                  <button
                    onClick={handleZoomOut}
                    className="text-white hover:text-gray-300 p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
                    title="Diminuir zoom"
                  >
                    <ZoomOut className="h-5 w-5" />
                  </button>
                  <span className="text-white text-sm px-2">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="text-white hover:text-gray-300 p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
                    title="Aumentar zoom"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleRotate}
                    className="text-white hover:text-gray-300 p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
                    title="Rotacionar"
                  >
                    <RotateCw className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Download */}
              <button
                onClick={handleDownload}
                className="text-white hover:text-gray-300 p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
                title="Baixar arquivo"
              >
                <Download className="h-5 w-5" />
              </button>

              {/* Fechar */}
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            {isImage ? (
              <div className="relative flex items-center justify-center w-full h-full">
                <img
                  src={currentFile.downloadURL}
                  alt={currentFile.fileName}
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: "center",
                  }}
                  onLoad={resetTransforms}
                />
              </div>
            ) : isPDF ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="bg-white rounded-lg p-8 text-center max-w-md">
                  <FileText className="h-16 w-16 text-red-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Documento PDF
                  </h4>
                  <p className="text-gray-600 mb-4">{currentFile.fileName}</p>
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        window.open(currentFile.downloadURL, "_blank")
                      }
                      className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Visualizar PDF</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Baixar PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-white text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Tipo de arquivo não suportado para visualização</p>
              </div>
            )}
          </div>

          {/* Navegação */}
          {files.length > 1 && (
            <>
              <button
                onClick={prevFile}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all"
                title="Arquivo anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextFile}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all"
                title="Próximo arquivo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Thumbnails */}
          {files.length > 1 && (
            <div className="bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="flex space-x-2 overflow-x-auto">
                {files.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      resetTransforms();
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? "border-white"
                        : "border-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {storageService.isImage(file.fileType) ? (
                      <img
                        src={file.downloadURL}
                        alt={file.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-red-100 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FileViewer;
