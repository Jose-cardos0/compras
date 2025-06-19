# 🔥 Instruções de Configuração do Firebase

Para resolver o erro de permissões, você precisa aplicar as regras corretas no Firebase Console.

## 📋 1. Regras do Firestore

Vá para o **Firebase Console** → **Firestore Database** → **Rules** e cole o seguinte código:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura e escrita para todos nos pedidos (orders)
    match /orders/{document} {
      allow read, write: if true;
    }

    // Permitir leitura e escrita para todos nos usuários (users)
    match /users/{document} {
      allow read, write: if true;
    }

    // Para outras coleções, negar acesso por padrão
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 🗂️ 2. Regras do Storage

Vá para o **Firebase Console** → **Storage** → **Rules** e cole o seguinte código:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Permitir leitura para todos (para visualizar arquivos)
    match /{allPaths=**} {
      allow read: if true;
    }

    // Regras específicas para uploads de produtos
    match /products/{orderId}/{productId}/{fileName} {
      // Permitir upload de arquivos para produtos
      allow write: if resource == null
        && request.resource.size < 10 * 1024 * 1024  // Máximo 10MB
        && request.resource.contentType.matches('image/.*|application/pdf'); // Apenas imagens e PDFs
    }

    // Permitir delete apenas para admin (opcional - caso queira implementar depois)
    match /products/{orderId}/{productId}/{fileName} {
      allow delete: if false; // Desabilitado por enquanto
    }
  }
}
```

## ⚠️ 3. Importante!

Após aplicar as regras:

1. **Clique em "Publish"** para ativar as regras
2. **Aguarde alguns segundos** para as regras se propagarem
3. **Teste o sistema** novamente

## 🔧 4. Estrutura dos Arquivos no Storage

Os arquivos serão organizados assim:

```
storage/
└── products/
    └── order_1234567890_abc123def/  (ID do pedido)
        ├── produto_0/               (primeiro produto)
        │   ├── 1634567890_imagem1.jpg
        │   └── 1634567891_spec.pdf
        └── produto_1/               (segundo produto)
            └── 1634567892_foto.png
```

## ✅ 5. Verificação

Após aplicar as regras, o sistema deve:

- ✅ Permitir criar pedidos no Firestore
- ✅ Permitir upload de arquivos no Storage
- ✅ Permitir leitura dos dados no Dashboard Admin
- ✅ Funcionar sem erros de permissão

---

**🎯 Resultado:** O sistema funcionará completamente sem erros de permissão!
