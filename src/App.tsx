import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ArrowLeftRight, Settings, Menu, X, FileText, ExternalLink, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { clearToken, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Movements from "./pages/Movements";
import Reports from "./pages/Reports";
import ItemDetail from "./pages/ItemDetail";
import Config from "./pages/Config";
import Login from "./pages/Login";

function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Estoque", path: "/inventory", icon: Package },
    { name: "Movimentações", path: "/movements", icon: ArrowLeftRight },
    { name: "Relatórios", path: "/reports", icon: FileText },
  ];

  const orgItems = [
    { name: "Configurações", path: "/config", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)} className="bg-white">
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-[240px] bg-[#1e293b] text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col py-6",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-6 mb-8 flex flex-col items-center gap-4">
          <img 
            src="/logo.png" 
            alt="Logo Polícia Penal PR" 
            className="h-24 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="font-bold text-xl tracking-tight">Almox-R6</span>
        </div>

        <nav className="flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 text-sm transition-colors",
                  isActive 
                    ? "bg-[#334155] text-white border-r-4 border-[#2563eb]" 
                    : "text-[#94a3b8] hover:bg-[#334155] hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="px-6 py-6 text-[11px] uppercase tracking-wider text-[#475569] font-bold">
            Organização
          </div>

          {orgItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 text-sm transition-colors",
                  isActive 
                    ? "bg-[#334155] text-white border-r-4 border-[#2563eb]" 
                    : "text-[#94a3b8] hover:bg-[#334155] hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6 pt-6">
          <div className="text-[12px] text-[#94a3b8]">desenvolvido por Sidnei/DTI-R6</div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="h-20 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-4">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="h-12 w-auto object-contain"
          referrerPolicy="no-referrer"
        />
        <div className="flex flex-col">
          <span className="font-bold text-[#1e293b] tracking-tight leading-none">Almoxarifado Regional Umuarama</span>
          <span className="text-xs text-[#64748b] mt-1">Polícia Penal do Paraná - R6</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-[#64748b] hover:bg-[#f1f5f9] gap-2 hidden md:flex"
          onClick={() => window.open(window.location.origin, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
          Abrir em Nova Aba
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-[#64748b] hover:bg-[#fee2e2] hover:text-[#ef4444] gap-2"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));

  if (!authed) {
    return (
      <>
        <Login onLogin={() => setAuthed(true)} />
        <Toaster position="top-right" />
      </>
    );
  }

  const handleLogout = () => {
    clearToken();
    setAuthed(false);
  };

  return (
    <Router>
      <div className="flex h-screen bg-[#f8fafc] text-[#1e293b] font-sans overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onLogout={handleLogout} />
          <main className="flex-1 p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/movements" element={<Movements />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/item/:id" element={<ItemDetail />} />
                <Route path="/config" element={<Config />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
      <Toaster position="top-right" />
    </Router>
  );
}

