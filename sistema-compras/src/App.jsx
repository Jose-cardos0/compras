import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Páginas
import OrderForm from "./pages/OrderForm";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App notranslate" translate="no">
          <Routes>
            {/* Rota pública - Formulário de pedidos */}
            <Route path="/" element={<OrderForm />} />

            {/* Rota de login do admin */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Rotas protegidas do admin */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />

            {/* Redirecionamento para rotas não encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Componente de notificações toast */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#fff",
                color: "#363636",
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "16px",
              },
              success: {
                style: {
                  background: "#f0fdf4",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                },
                iconTheme: {
                  primary: "#16a34a",
                  secondary: "#f0fdf4",
                },
              },
              error: {
                style: {
                  background: "#fef2f2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                },
                iconTheme: {
                  primary: "#dc2626",
                  secondary: "#fef2f2",
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
