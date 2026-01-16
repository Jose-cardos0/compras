import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "../firebase/config";

export const storageService = {
  // Upload de foto de perfil do usuário
  async uploadProfilePhoto(file, userEmail) {
    try {
      // Validar tipo de arquivo (apenas imagens)
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Tipo de arquivo não permitido. Use apenas JPG, PNG ou WEBP."
        );
      }

      // Validar tamanho (máximo 5MB para fotos de perfil)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("Foto muito grande. Máximo permitido: 5MB.");
      }

      // Criar nome único para o arquivo
      const timestamp = Date.now();
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, "_");
      const extension = file.name.split(".").pop();
      const fileName = `${sanitizedEmail}_${timestamp}.${extension}`;
      const filePath = `profile_photos/${fileName}`;

      // Criar referência e fazer upload
      const storageRef = ref(storage, filePath);
      const snapshot = await uploadBytes(storageRef, file);

      // Obter URL de download
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        downloadURL,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath: filePath,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Erro no upload da foto de perfil:", error);
      throw error;
    }
  },

  // Upload de arquivo para produto
  async uploadProductFile(file, orderId, productId) {
    try {
      // Validar tipo de arquivo
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou PDF."
        );
      }

      // Validar tamanho (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("Arquivo muito grande. Máximo permitido: 10MB.");
      }

      // Criar nome único para o arquivo
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `products/${orderId}/${productId}/${fileName}`;

      // Criar referência e fazer upload
      const storageRef = ref(storage, filePath);
      const snapshot = await uploadBytes(storageRef, file);

      // Obter URL de download
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        downloadURL,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath: filePath,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Erro no upload:", error);
      throw error;
    }
  },

  // Upload múltiplo de arquivos
  async uploadMultipleFiles(files, orderId, productId) {
    try {
      const uploadPromises = Array.from(files).map((file) =>
        this.uploadProductFile(file, orderId, productId)
      );

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error("Erro no upload múltiplo:", error);
      throw error;
    }
  },

  // Deletar arquivo do storage
  async deleteFile(storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      console.error("Erro ao deletar arquivo:", error);
      throw error;
    }
  },

  // Validar arquivo antes do upload
  validateFile(file) {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou PDF.",
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: "Arquivo muito grande. Máximo permitido: 10MB.",
      };
    }

    return { valid: true };
  },

  // Formatar tamanho do arquivo para exibição
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  // Verificar se é imagem ou PDF
  isImage(fileType) {
    return fileType.startsWith("image/");
  },

  isPDF(fileType) {
    return fileType === "application/pdf";
  },
};
