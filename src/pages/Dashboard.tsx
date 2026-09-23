import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDbDate } from "@/lib/datetime";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, ArrowUpRight, ArrowDownRight, AlertTriangle, History } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalItems: number;
  totalMovements: number;
  recentMovements: any[];
  itemsByCategory: any[];
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/api/stats")
      .then(setStats)
      .catch(err => {
        console.error("Failed to fetch stats:", err);
        setError("Erro ao carregar dados do servidor.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full">Carregando...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
  if (!stats) return <div className="flex items-center justify-center h-full">Nenhum dado encontrado.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-zinc-500">Visão geral do seu almoxarifado em tempo real.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="sleek-card">
          <div className="text-[13px] text-[#64748b] mb-2">Itens em Estoque</div>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
          <div className="text-[12px] font-medium text-[#10b981] mt-2">↑ Atualizado agora</div>
        </div>

        <div className="sleek-card">
          <div className="text-[13px] text-[#64748b] mb-2">Movimentações</div>
          <div className="text-2xl font-bold">{stats.totalMovements}</div>
          <div className="text-[12px] font-medium text-[#64748b] mt-2">Total registrado</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart */}
        <div className="lg:col-span-4 sleek-card">
          <h3 className="text-base font-bold mb-4 flex justify-between items-center">
            Estoque por Categoria
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.itemsByCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff' }}
                  labelFormatter={(label) => `Categoria: ${label}`}
                  formatter={(value) => [`${value} item(ns)`, "Itens"]}
                />
                <Bar dataKey="count" name="Itens" radius={[4, 4, 0, 0]}>
                  {stats.itemsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Movements */}
        <div className="lg:col-span-3 sleek-card">
          <h3 className="text-base font-bold mb-4">Últimas Movimentações</h3>
          <div className="space-y-4">
            {stats.recentMovements.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors cursor-pointer">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                  m.type === 'entry' ? "bg-[#dbeafe] text-[#2563eb]" : "bg-[#fee2e2] text-[#ef4444]"
                )}>
                  {m.type === 'entry' ? "+" : "−"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{m.item_name}</div>
                  <div className="text-[11px] text-[#64748b] truncate">{m.item_description}</div>
                  <div className="text-[10px] text-[#64748b] uppercase font-bold mt-0.5">
                    {m.category_name} • {m.subcategory_name}
                  </div>
                  <div className="text-[11px] text-[#94a3b8]">
                    {formatDbDate(m.date)}
                  </div>
                </div>
                <div className={cn(
                  "text-[13px] font-bold",
                  m.type === 'entry' ? "text-[#10b981]" : "text-[#ef4444]"
                )}>
                  {m.type === 'entry' ? "+" : "-"}{m.quantity}
                </div>
              </div>
            ))}
            {stats.recentMovements.length === 0 && (
              <p className="text-sm text-[#64748b] text-center py-10">Nenhuma movimentação recente.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
