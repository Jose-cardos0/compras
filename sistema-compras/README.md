# Sistema de Compras Natville

Um sistema web completo para gerenciamento de pedidos de compras com interface moderna e notificações via WhatsApp.

## 🚀 Funcionalidades

### 📋 Formulário de Pedidos (Público)

- Interface elegante com gradientes e animações
- Formulário completo com validação
- Campos obrigatórios:
  - Nome completo
  - Setor do solicitante
  - WhatsApp para notificações
  - Produto desejado
  - Especificações técnicas
  - Motivo da solicitação
  - Setor de destino (Máquinas Industriais, Frota, Químicos, Estrutura, Limpeza, Cozinha, Escritório, Outro)
- Notificação automática via WhatsApp quando pedido é criado

### 🔐 Sistema Administrativo

- **Login seguro** com credenciais específicas
- **Dashboard interativo** com:
  - Estatísticas em tempo real
  - Filtros por status
  - Visualização detalhada dos pedidos
  - Cards animados com informações completas

### 📊 Gerenciamento de Status

- **Pendente** (status inicial)
- **Em Análise**
- **Em Andamento** (com campo para data prevista)
- **Cancelado/Negado** (com campo para motivo)
- **Entregue**
- Notificação automática via WhatsApp a cada mudança de status

### 👥 Gerenciamento de Usuários

- Cadastro de novos administradores
- Exclusão de usuários
- Interface intuitiva com modais de confirmação

## 🛠 Tecnologias Utilizadas

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS 3.4.0
- **Animações**: Framer Motion
- **Formulários**: React Hook Form
- **Ícones**: Lucide React
- **Notificações**: React Hot Toast
- **Roteamento**: React Router DOM
- **Backend**: Firebase (Firestore + Authentication)
- **Notificações**: WhatsApp API (simulado)

## 🔧 Instalação e Configuração

### Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn

### Passos para instalação

1. **Clone o repositório:**

```bash
git clone [URL_DO_REPOSITORIO]
cd sistema-compras
```

2. **Instale as dependências:**

```bash
npm install
```

3. **Configure o Firebase:**

   - Crie um projeto no [Firebase Console](https://console.firebase.google.com)
   - Ative o Firestore Database
   - Ative o Authentication
   - Substitua as credenciais em `src/firebase/config.js`

4. **Execute o projeto:**

```bash
npm run dev
```

5. **Acesse o sistema:**
   - Interface pública: `http://localhost:5173`
   - Login admin: `http://localhost:5173/admin/login`

## 🔑 Credenciais de Acesso

### Administrador Principal

- **Email**: comprasnatville@gmail.com
- **Senha**: compras2025@

## 📱 Integração WhatsApp

O sistema está preparado para integração com APIs de WhatsApp como:

- Twilio WhatsApp API
- WhatsApp Business API
- Meta WhatsApp Business Platform

Atualmente as notificações são simuladas no console. Para ativar as notificações reais, edite o arquivo `src/services/whatsapp.js`.

### Exemplo de integração com Twilio:

```javascript
// Em src/services/whatsapp.js
const response = await fetch(
  "https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json",
  {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa("YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: "whatsapp:+14155238886",
      To: `whatsapp:${phoneNumber}`,
      Body: message,
    }),
  }
);
```

## 🔒 Regras de Segurança do Firestore

Configure as regras de segurança no Firebase Console:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura e escrita apenas para usuários autenticados
    match /orders/{document} {
      allow read, write: if request.auth != null || resource == null;
    }

    match /users/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   └── ProtectedRoute.jsx      # Componente de rota protegida
├── contexts/
│   └── AuthContext.jsx         # Contexto de autenticação
├── firebase/
│   └── config.js              # Configuração do Firebase
├── pages/
│   ├── OrderForm.jsx          # Formulário de pedidos
│   ├── AdminLogin.jsx         # Login administrativo
│   ├── AdminDashboard.jsx     # Dashboard principal
│   └── AdminUsers.jsx         # Gerenciamento de usuários
├── services/
│   ├── firestore.js           # Serviços do Firestore
│   └── whatsapp.js            # Serviços do WhatsApp
├── App.jsx                    # Componente principal
├── main.jsx                   # Ponto de entrada
└── index.css                  # Estilos globais
```

## 🎨 Design e UX

- **Design moderno** com gradientes e animações suaves
- **Responsivo** para todos os dispositivos
- **Interface intuitiva** com feedback visual
- **Acessibilidade** considerada em todos os componentes
- **Tema consistente** em todas as páginas

## 📝 Como Usar

### Para Usuários (Solicitantes)

1. Acesse a página principal
2. Preencha todos os campos obrigatórios
3. Clique em "Enviar Pedido"
4. Receba confirmação via WhatsApp
5. Acompanhe as atualizações via WhatsApp

### Para Administradores

1. Acesse `/admin/login`
2. Faça login com as credenciais
3. Visualize todos os pedidos no dashboard
4. Atualize os status conforme necessário
5. Gerencie usuários em `/admin/users`

## 🔄 Fluxo de Status dos Pedidos

```
Pendente → Em Análise → Em Andamento → Entregue
    ↓
Cancelado/Negado
```

Cada mudança de status gera uma notificação automática via WhatsApp.

## 🚀 Deploy

### Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Upload da pasta dist/
```

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou suporte técnico, entre em contato através do email: comprasnatville@gmail.com

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ para otimizar o processo de compras da empresa**
