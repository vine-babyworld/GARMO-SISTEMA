import { useState } from "react";
import { Navigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginWithEmail } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Informe e-mail e senha.");
      return;
    }

    try {
      setIsSubmitting(true);

      await loginWithEmail(email.trim(), password);

    } catch (error: any) {
      console.error("LOGIN ERROR:", error);
      console.error("LOGIN ERROR CODE:", error?.code);
      console.error("LOGIN ERROR MESSAGE:", error?.message);

      if (error?.code === "auth/invalid-credential") {
        setErrorMessage("Credenciais inválidas ou usuário não encontrado.");
      } else if (error?.code === "auth/user-disabled") {
        setErrorMessage("Usuário desativado.");
      } else if (error?.code === "auth/invalid-email") {
        setErrorMessage("E-mail inválido.");
      } else {
        setErrorMessage(`Erro: ${error?.code ?? "desconhecido"}`);
      }

    } finally {
      setIsSubmitting(false); // 🔥 ESSENCIAL
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <LogIn className="h-6 w-6 text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            Entrar no sistema
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse o Precificação BW-GARMO com seu usuário.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              E-mail
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@empresa.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Senha
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
            />
          </div>

          {errorMessage && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            <LogIn className="h-4 w-4" />
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}