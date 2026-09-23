import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatDbDate } from "@/lib/datetime";
import { FileText, TrendingDown, AlertTriangle, Package, Calendar, Download, Search, X, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";

interface ReportData {
  lowStockItems: any[];
  outOfStockItems: any[];
  movementsByType: any[];
  topItems: any[];
  monthlyMovements: any[];
  allItems: any[];
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    api.get("/api/reports")
      .then(setData)
      .catch(err => {
        console.error("Failed to fetch reports:", err);
        setError("Erro ao carregar relatórios.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64">Carregando relatórios...</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-500">{error}</div>;
  if (!data) return <div className="flex items-center justify-center h-64">Nenhum dado encontrado.</div>;

  const COLORS = ['#2563eb', '#ef4444', '#10b981', '#f59e0b'];

  const movementData = data.monthlyMovements.reduce((acc: any[], curr: any) => {
    const existing = acc.find(item => item.month === curr.month);
    if (existing) {
      existing[curr.type] = curr.total_quantity;
    } else {
      acc.push({
        month: curr.month,
        [curr.type]: curr.total_quantity
      });
    }
    return acc;
  }, []);

  const pieData = data.movementsByType.map(m => ({
    name: m.type === 'entry' ? 'Entradas' : 'Saídas',
    value: m.count
  }));

  const filteredItems = data.allItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subcategory_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toString().includes(searchTerm)
  );

  const exportToCSV = () => {
    if (!data) return;
    
    const headers = ["Codigo", "Nome", "Categoria", "Subcategoria", "Estoque Atual", "Unidade", "Estoque Minimo", "Entradas Totais", "Saidas Totais", "Ultima Movimentacao"];
    const rows = data.allItems.map(item => [
      `#${item.id.toString().padStart(4, '0')}`,
      item.name,
      item.category_name,
      item.subcategory_name,
      item.current_stock,
      item.unit,
      item.min_stock,
      item.total_entries || 0,
      item.total_exits || 0,
      item.last_movement ? formatDbDate(item.last_movement, "dd/MM/yyyy") : "-"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_estoque_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório exportado com sucesso!");
  };

  return (
    <div className="space-y-8" id="printable-report">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada do seu almoxarifado.</p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" className="border-zinc-200" onClick={() => window.open(window.location.origin + '/reports', '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" /> Abrir em Nova Aba
          </Button>
          <Button variant="outline" className="border-zinc-200" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8" onClick={() => {
            toast.info("Preparando impressão...", { duration: 2000 });
            setTimeout(() => {
              window.print();
            }, 500);
          }}>
            <FileText className="mr-2 h-4 w-4" /> Imprimir Relatório
          </Button>
        </div>
      </div>

      {/* Header for Print Only */}
      <div className="hidden print:block mb-8 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
            <div>
              <h1 className="text-2xl font-bold">Relatório de Almoxarifado</h1>
              <p className="text-sm text-zinc-500">Regional Umuarama - R6</p>
            </div>
          </div>
          <div className="text-right text-sm text-zinc-500">
            Gerado em: {new Date().toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Itens atingiram o estoque mínimo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.outOfStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Itens com quantidade zero</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.movementsByType.find(m => m.type === 'exit')?.total_quantity || 0}
            </div>
            <p className="text-xs text-muted-foreground">Unidades retiradas no total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.movementsByType.find(m => m.type === 'entry')?.total_quantity || 0}
            </div>
            <p className="text-xs text-muted-foreground">Unidades recebidas no total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 no-print">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Fluxo de Movimentação Mensal</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={movementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="entry" name="Entradas" stroke="#10b981" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="exit" name="Saídas" stroke="#ef4444" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Distribuição de Movimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 no-print">
        <Card>
          <CardHeader>
            <CardTitle>Itens Mais Retirados (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="total_quantity" name="Quantidade" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerta de Reposição</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.lowStockItems.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum item com estoque crítico.</p>
              )}
              {data.lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category_name} - {item.subcategory_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-600">{item.current_stock} {item.unit}</p>
                    <p className="text-[10px] text-muted-foreground">Mínimo: {item.min_stock}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Item List for Print and Screen */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Relatório Detalhado de Estoque</CardTitle>
          <div className="relative w-64 no-print flex items-center">
            <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar itens..."
              className="pl-8 pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 border">Cód.</th>
                  <th className="px-4 py-3 border">Item</th>
                  <th className="px-4 py-3 border">Categoria / Sub</th>
                  <th className="px-4 py-3 border text-right">Entradas</th>
                  <th className="px-4 py-3 border text-right">Saídas</th>
                  <th className="px-4 py-3 border text-right">Estoque</th>
                  <th className="px-4 py-3 border text-center">Últ. Mov.</th>
                  <th className="px-4 py-3 border text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-zinc-50">
                    <td className="px-4 py-3 border text-zinc-500 font-mono">#{item.id.toString().padStart(4, '0')}</td>
                    <td className="px-4 py-3 border font-medium">{item.name}</td>
                    <td className="px-4 py-3 border">
                      <div className="text-xs font-bold text-zinc-400 uppercase">{item.category_name}</div>
                      <div className="text-xs">{item.subcategory_name}</div>
                    </td>
                    <td className="px-4 py-3 border text-right text-green-600 font-medium">
                      {item.total_entries || 0}
                    </td>
                    <td className="px-4 py-3 border text-right text-red-600 font-medium">
                      {item.total_exits || 0}
                    </td>
                    <td className="px-4 py-3 border text-right font-bold">
                      {item.current_stock} {item.unit}
                    </td>
                    <td className="px-4 py-3 border text-center text-xs text-zinc-500">
                      {item.last_movement ? formatDbDate(item.last_movement, "dd/MM/yy") : "-"}
                    </td>
                    <td className="px-4 py-3 border text-center">
                      {item.current_stock === 0 ? (
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">SEM ESTOQUE</span>
                      ) : item.current_stock <= item.min_stock ? (
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">BAIXO</span>
                      ) : (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">NORMAL</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum item encontrado com os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
