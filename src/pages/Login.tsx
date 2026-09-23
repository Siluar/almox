import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { toast } from "sonner";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      const { token } = await api.post<{ token: string }>("/api/auth/login", { code: code.trim() });
      localStorage.setItem("almox_token", token);
      toast.success("Bem-vindo!");
      onLogin();
    } catch (err: any) {
      toast.error(err.message || "Código de acesso inválido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 mb-8">
          <img
            src="/logo.png"
            alt="Logo Polícia Penal PR"
            className="h-24 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#1e293b]">Almox-R6</h1>
            <p className="text-sm text-[#64748b] mt-1">Almoxarifado Regional Umuarama</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="sleek-card">
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold text-[#64748b] tracking-wider block mb-1">
                Código de Acesso
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                <Input
                  type="password"
                  placeholder="Digite o código de acesso"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="pl-10 h-12 bg-white"
                  autoFocus
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white h-11 rounded-xl mt-4"
            >
              {loading ? "Verificando..." : "Entrar"}
            </Button>
          </div>
        </form>

        <p className="text-center text-[11px] text-[#94a3b8] mt-6">
          desenvolvido por Sidnei/DTI-R6
        </p>
      </div>
    </div>
  );
}