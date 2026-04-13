import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster as Sonner } from "./components/ui/sonner";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Products from "./pages/Products";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import AutoPricing from "./pages/AutoPricing";
import FreightSettings from "./pages/FreightSettings";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Devolucoes from "./pages/Devolucoes";
import TariffsSettingsPage from "./pages/TariffsSettings";
import UsersPage from "./pages/Users";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route
                path="/price-view"
                element={<PlaceholderPage title="Visão de Preços" />}
              />
              <Route
                path="/mercado-livre"
                element={<PlaceholderPage title="Mercado Livre" />}
              />
              <Route
                path="/shopee"
                element={<PlaceholderPage title="Shopee" />}
              />
              <Route path="/devolucoes" element={<Devolucoes />} />
              <Route path="/products" element={<Products />} />
              <Route
                path="/updates"
                element={<PlaceholderPage title="Atualizações" />}
              />
              <Route path="/auto-pricing" element={<AutoPricing />} />
              <Route path="/settings/freight" element={<FreightSettings />} />
              <Route path="/settings/users" element={<UsersPage />} />
              <Route
                path="/settings/tariffs"
                element={<TariffsSettingsPage />}
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;