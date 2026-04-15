import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Package, History, AlertTriangle, ArrowUpRight, ArrowDownRight, Plus, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Item {
  id: number;
  name: string;
  description: string;
  subcategory_name: string;
  category_name: string;
  current_stock: number;
  unit: string;
}

interface Movement {
  id: number;
  type: 'entry' | 'exit';
  quantity: number;
  date: string;
  notes: string;
}

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState<Item | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [itemData, allMovements] = await Promise.all([
          api.get(`/api/items/${id}`),
          api.get("/api/movements")
        ]);
        setItem(itemData);
        setMovements(allMovements.filter((m: any) => m.item_id === Number(id)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-full">Carregando...</div>;
  if (!item) return <div>Item não encontrado</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/inventory">
          <Button variant="outline" size="icon" className="rounded-lg border-[#e2e8f0] hover:bg-[#f8fafc]">
            <ChevronLeft className="h-4 w-4 text-[#64748b]" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">{item.name}</h1>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            <span>{item.category_name}</span>
            <span className="text-[#cbd5e1]">/</span>
            <span>{item.subcategory_name}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Item Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="sleek-card">
            <h3 className="text-base font-bold mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-[#2563eb]" />
              Informações do Item
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-[11px] uppercase font-bold text-[#64748b] tracking-wider block mb-1">Nome</label>
                <div className="text-sm font-semibold text-[#1e293b]">{item.name}</div>
              </div>
              <div>
                <label className="text-[11px] uppercase font-bold text-[#64748b] tracking-wider block mb-1">SKU / Código</label>
                <div className="text-sm font-semibold text-[#1e293b]">#{item.id.toString().padStart(4, '0')}</div>
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] uppercase font-bold text-[#64748b] tracking-wider block mb-1">Descrição</label>
                <div className="text-sm text-[#64748b] leading-relaxed">{item.description || "Sem descrição informada."}</div>
              </div>
              <div>
                <label className="text-[11px] uppercase font-bold text-[#64748b] tracking-wider block mb-1">Categoria</label>
                <div className="text-[11px] font-bold text-[#2563eb] uppercase bg-[#dbeafe] px-2 py-1 rounded inline-block">
                  {item.category_name}
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase font-bold text-[#64748b] tracking-wider block mb-1">Subcategoria</label>
                <div className="text-sm text-[#1e293b]">{item.subcategory_name}</div>
              </div>
            </div>
          </div>

          <div className="sleek-card overflow-hidden !p-0">
            <div className="p-6 border-b border-[#f1f5f9]">
              <h3 className="text-base font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-[#64748b]" />
                Histórico de Movimentações
              </h3>
            </div>
            <Table>
              <TableHeader className="bg-[#f8fafc]">
                <TableRow className="border-b border-[#f1f5f9]">
                  <TableHead className="text-[#64748b] font-semibold">Data</TableHead>
                  <TableHead className="text-[#64748b] font-semibold">Tipo</TableHead>
                  <TableHead className="text-right text-[#64748b] font-semibold">Qtd</TableHead>
                  <TableHead className="text-[#64748b] font-semibold">Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id} className="hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9]">
                    <TableCell className="text-[13px] text-[#64748b] py-3">
                      {format(new Date(m.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "sleek-badge",
                        m.type === 'entry' ? "badge-in" : "badge-out"
                      )}>
                        {m.type === 'entry' ? "Entrada" : "Saída"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-[13px]">
                      {m.type === 'entry' ? "+" : "-"}{m.quantity}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#64748b] max-w-[150px] truncate">
                      {m.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {movements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-[#64748b]">
                      Nenhuma movimentação para este item.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Stock Status */}
        <div className="space-y-8">
          <div className="sleek-card bg-[#1e293b] text-white border-none">
            <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest mb-6">Status do Estoque</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-4xl font-bold">{item.current_stock}</div>
                  <div className="text-xs opacity-60 uppercase font-bold mt-1">{item.unit} Disponíveis</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold uppercase opacity-60">
                  <span>Nível de Estoque</span>
                </div>
                <div className="h-2 bg-[#334155] rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 bg-[#10b981]"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#334155] grid grid-cols-1 gap-4">
                <div>
                  <div className="text-[10px] opacity-60 uppercase font-bold">Unidade</div>
                  <div className="text-lg font-bold">{item.unit}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="sleek-card">
            <h3 className="text-sm font-bold mb-4">Ações Rápidas</h3>
            <div className="grid gap-2">
              <Button className="w-full justify-start gap-2 bg-[#2563eb] hover:bg-[#1d4ed8]">
                <Plus className="h-4 w-4" /> Registrar Entrada
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 border-[#e2e8f0] text-[#1e293b] hover:bg-[#f8fafc]">
                <ArrowLeftRight className="h-4 w-4" /> Registrar Saída
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
