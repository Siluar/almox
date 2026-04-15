import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, ArrowDownRight, Plus, History, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Movement {
  id: number;
  item_id: number;
  item_name: string;
  item_description: string;
  category_name: string;
  subcategory_name: string;
  type: 'entry' | 'exit';
  quantity: number;
  date: string;
  notes: string;
  unit: string;
}

interface Item {
  id: number;
  name: string;
  unit: string;
  category_name: string;
  subcategory_name: string;
}

export default function Movements() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newMovement, setNewMovement] = useState({
    item_id: "",
    type: "entry",
    quantity: "",
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [movementsData, itemsData] = await Promise.all([
        api.get("/api/movements"),
        api.get("/api/items")
      ]);
      setMovements(movementsData);
      setItems(itemsData);
    } catch (err) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovement.item_id) return toast.error("Selecione um item");
    if (Number(newMovement.quantity) <= 0) return toast.error("Quantidade deve ser maior que zero");
    
    try {
      await api.post("/api/movements", {
        ...newMovement,
        quantity: Number(newMovement.quantity)
      });
      toast.success("Movimentação registrada!");
      setIsDialogOpen(false);
      setNewMovement({ item_id: "", type: "entry", quantity: "", notes: "" });
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar movimentação");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/movements/${id}`);
      toast.success("Movimentação excluída e estoque revertido!");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir movimentação");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimentações</h1>
          <p className="text-zinc-500">Histórico completo de entradas e saídas de estoque.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11 px-6">
                <Plus className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Movimentação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Item</Label>
                <Select 
                  value={newMovement.item_id} 
                  onValueChange={v => setNewMovement({...newMovement, item_id: v})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map(item => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        <div className="flex flex-col py-1">
                          <span className="font-semibold">#{item.id.toString().padStart(4, '0')} - {item.name}</span>
                          <span className="text-[10px] text-[#64748b] uppercase font-bold">
                            {item.category_name} • {item.subcategory_name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={newMovement.type} 
                    onValueChange={v => setNewMovement({...newMovement, type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entrada</SelectItem>
                      <SelectItem value="exit">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={newMovement.quantity}
                    onChange={e => setNewMovement({...newMovement, quantity: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input 
                  id="notes" 
                  placeholder="Ex: Compra via fornecedor X" 
                  value={newMovement.notes}
                  onChange={e => setNewMovement({...newMovement, notes: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11 rounded-xl">
                Registrar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="sleek-card overflow-hidden !p-0">
        <Table>
          <TableHeader className="bg-[#f1f5f9]">
            <TableRow className="border-b-2 border-[#e2e8f0]">
              <TableHead className="text-[#64748b] font-semibold py-3">Data/Hora</TableHead>
              <TableHead className="text-[#64748b] font-semibold">Cód.</TableHead>
              <TableHead className="text-[#64748b] font-semibold">Item</TableHead>
              <TableHead className="text-[#64748b] font-semibold">Categoria</TableHead>
              <TableHead className="text-[#64748b] font-semibold">Subcategoria</TableHead>
              <TableHead className="text-[#64748b] font-semibold">Tipo</TableHead>
              <TableHead className="text-right text-[#64748b] font-semibold">Quantidade</TableHead>
              <TableHead className="text-[#64748b] font-semibold">Observações</TableHead>
              <TableHead className="text-right text-[#64748b] font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((m) => (
              <TableRow key={m.id} className="hover:bg-[#f1f5f9] transition-colors border-b border-[#e2e8f0]">
                <TableCell className="whitespace-nowrap py-4">
                  <div className="flex items-center gap-2 text-[#64748b] text-[13px]">
                    <CalendarIcon className="h-3 w-3" />
                    {format(new Date(m.date), "dd/MM HH:mm", { locale: ptBR })}
                  </div>
                </TableCell>
                <TableCell className="py-4 font-mono text-[12px] text-[#64748b]">
                  #{m.item_id.toString().padStart(4, '0')}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#1e293b]">{m.item_name}</span>
                    <span className="text-[11px] text-[#64748b]">{m.item_description}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                    {m.category_name}
                  </span>
                </TableCell>
                <TableCell className="text-[#64748b] text-[13px]">{m.subcategory_name}</TableCell>
                <TableCell>
                  <span className={cn(
                    "sleek-badge",
                    m.type === 'entry' ? "badge-in" : "badge-out"
                  )}>
                    {m.type === 'entry' ? "Entrada" : "Saída"}
                  </span>
                </TableCell>
                <TableCell className="text-right font-bold">
                  <span className={m.type === 'entry' ? "text-[#10b981]" : "text-[#ef4444]"}>
                    {m.type === 'entry' ? "+" : "-"}{m.quantity}
                  </span>
                  <span className="text-[11px] font-normal text-[#64748b] ml-1 uppercase">{m.unit}</span>
                </TableCell>
                <TableCell className="text-[#64748b] text-[13px] max-w-[200px] truncate">
                  {m.notes || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-[#fee2e2] group">
                          <Trash2 className="h-3.5 w-3.5 text-[#64748b] group-hover:text-[#ef4444]" />
                        </Button>
                      }
                    />
                    <AlertDialogContent className="bg-white ring-1 ring-[#e2e8f0]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Movimentação</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta movimentação? O estoque do item <strong>{m.item_name}</strong> será revertido automaticamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-xl"
                          onClick={() => handleDelete(m.id)}
                        >
                          Excluir e Reverter
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {movements.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-[#64748b]">
                  Nenhuma movimentação registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
