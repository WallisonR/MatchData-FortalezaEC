import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

const FALLBACK_EMAIL = "admin@matchdata.com";
const FALLBACK_PASSWORD = "fec2026";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
      });

      if (response.ok) {
        localStorage.setItem("md_client_auth", "1");
        setLocation("/dashboard", { replace: true });
        return;
      }

      // fallback para deploy estático sem backend de API
      if (
        normalizedEmail === FALLBACK_EMAIL &&
        normalizedPassword === FALLBACK_PASSWORD
      ) {
        localStorage.setItem("md_client_auth", "1");
        setLocation("/dashboard", { replace: true });
        return;
      }

      throw new Error("Credenciais inválidas");
    } catch {
      // fallback para indisponibilidade da API
      if (
        normalizedEmail === FALLBACK_EMAIL &&
        normalizedPassword === FALLBACK_PASSWORD
      ) {
        localStorage.setItem("md_client_auth", "1");
        setLocation("/dashboard", { replace: true });
        return;
      }

      setError("Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login MatchData</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
