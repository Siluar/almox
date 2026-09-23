import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, MoreHorizontal, AlertTriangle, Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pagination } from "@/components/ui/pagination";

interface Item {
  id: number;
  name: string;
  description: string;
  subcategory_id: number;
  subcategory_name: string;
  category_name: string;
  current_stock: number;
  min_stock: number;
  unit: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_name: string;
}

interface Category {
  id: number;
  name: string;
}

export default function Inventory() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    subcategory_id: "",
    unit: "un",
    initial_stock: "0",
    min_stock: "0"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, catsData, subsData] = await Promise.all([
        api.get("/api/items"),
        api.get("/api/categories"),
        api.get("/api/subcategories")
      ]);
      setItems(itemsData);
      setCategories(catsData);
      setSubcategories(subsData);
      setPage(1);
    } catch (err) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.subcategory_id) return toast.error("Selecione uma subcategoria");
    
    try {
      if (editingItem) {
        await api.put(`/api/items/${editingItem.id}`, newItem);
        toast.success("Item atualizado com sucesso!");
      } else {
        await api.post("/api/items", newItem);
        toast.success("Item criado com sucesso!");
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      setSelectedCategoryId("");
      setNewItem({ 
        name: "", 
        description: "", 
        subcategory_id: "", 
        unit: "un",
        initial_stock: "0",
        min_stock: "0"
      });
      loadData();
    } catch (err) {
      toast.error(editingItem ? "Erro ao atualizar item" : "Erro ao criar item");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/items/${id}`);
      toast.success("Item excluído com sucesso!");
      loadData();
    } catch (err) {
      toast.error("Erro ao excluir item");
    }
  };

  const handleEdit = (item: Item) => {
    const sub = subcategories.find(s => s.id === item.subcategory_id);
    if (sub) {
      const cat = categories.find(c => c.name === sub.category_name);
      if (cat) setSelectedCategoryId(cat.id.toString());
    }

    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description,
      subcategory_id: item.subcategory_id.toString(),
      unit: item.unit,
      initial_stock: item.current_stock.toString(),
      min_stock: item.min_stock?.toString() || "0"
    });
    setIsDialogOpen(true);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category_name.toLowerCase().includes(search.toLowerCase()) ||
    item.subcategory_name.toLowerCase().includes(search.toLowerCase()) ||
    item.id.toString().includes(search)
  );

  const filteredSubcategories = subcategories.filter(s => 
    !selectedCategoryId || s.category_name === categories.find(c => c.id.toString() === selectedCategoryId)?.name
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-zinc-500">Gerencie todos os itens do seu almoxarifado.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingItem(null);
            setSelectedCategoryId("");
            setNewItem({ 
              name: "", 
              description: "", 
              subcategory_id: "", 
              unit: "un",
              initial_stock: "0",
              min_stock: "0"
            });
          }
        }}>
          <DialogTrigger
            render={
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11 px-6">
                <Plus className="h-4 w-4 mr-2" />
                Novo Item
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[500px] rounded-2xl bg-white ring-1 ring-[#e2e8f0]">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Item" : "Cadastrar Novo Item"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Item</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Papel A4" 
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input 
                  id="description" 
                  placeholder="Ex: Pacote com 500 folhas" 
                  value={newItem.description}
                  onChange={e => setNewItem({...newItem, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select 
                    value={selectedCategoryId} 
                    onValueChange={v => {
                      setSelectedCategoryId(v);
                      setNewItem({...newItem, subcategory_id: ""});
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategoria</Label>
                  <Select 
                    value={newItem.subcategory_id} 
                    onValueChange={v => setNewItem({...newItem, subcategory_id: v})}
                    disabled={!selectedCategoryId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={selectedCategoryId ? "Selecione a subcategoria" : "Selecione a categoria primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubcategories.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select 
                    value={newItem.unit} 
                    onValueChange={v => setNewItem({...newItem, unit: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">Unidade (un)</SelectItem>
                      <SelectItem value="kg">Quilo (kg)</SelectItem>
                      <SelectItem value="m">Metro (m)</SelectItem>
                      <SelectItem value="pct">Pacote (pct)</SelectItem>
                      <SelectItem value="cx">Caixa (cx)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock">Estoque Mínimo</Label>
                  <Input 
                    id="min_stock" 
                    type="number"
                    step="0.01"
                    value={newItem.min_stock}
                    onChange={e => setNewItem({...newItem, min_stock: e.target.value})}
                  />
                </div>
              </div>
              {!editingItem && (
                <div className="space-y-2">
                  <Label htmlFor="initial_stock">Estoque Inicial</Label>
                  <Input 
                    id="initial_stock" 
                    type="number"
                    step="0.01"
                    value={newItem.initial_stock}
                    onChange={e => setNewItem({...newItem, initial_stock: e.target.value})}
                  />
                </div>
              )}
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11 rounded-xl">
                {editingItem ? "Salvar Alterações" : "Salvar Item"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input 
          placeholder="Buscar por código, nome, categoria ou subcategoria..." 
          className="pl-10 h-12 bg-white border-none shadow-sm rounded-xl"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="sleek-card overflow-hidden !p-0">
        <Table>
          <TableHeader className="bg-[#f1f5f9]">
            <TableRow className="border-b-2 border-[#e2e8f0]">
              <TableHead className="w-[80px] text-[#64748b] font-semibold py-3">Cód.</TableHead>
              <TableHead className="w-[300px] text-[#64748b] font-semibold py-3">Item</TableHead>
              <TableHead className="text-[#64748b] font-semibold">Categoria</TableHead>
              <TableHead className="text-[#64748b] font-semibold">Subcategoria</TableHead>
              <TableHead className="text-right text-[#64748b] font-semibold">Estoque</TableHead>
              <TableHead className="text-right text-[#64748b] font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-[#f1f5f9] transition-colors border-b border-[#e2e8f0]">
                <TableCell className="py-4 font-mono text-[12px] text-[#64748b]">
                  #{item.id.toString().padStart(4, '0')}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#1e293b]">{item.name}</span>
                    <span className="text-[11px] text-[#64748b]">{item.description}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                    {item.category_name}
                  </span>
                </TableCell>
                <TableCell className="text-[#64748b] text-[13px]">{item.subcategory_name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      {item.current_stock <= item.min_stock && item.current_stock > 0 && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" title="Estoque Baixo" />
                      )}
                      {item.current_stock === 0 && (
                        <AlertTriangle className="h-4 w-4 text-red-500" title="Sem Estoque" />
                      )}
                      <span className="font-bold text-base text-[#1e293b]">
                        {item.current_stock} <span className="text-[11px] font-normal text-[#64748b] uppercase">{item.unit}</span>
                      </span>
                    </div>
                    {item.min_stock > 0 && (
                      <span className="text-[10px] text-[#94a3b8]">Mín: {item.min_stock}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to={`/item/${item.id}`}>
                      <Button variant="ghost" size="icon" className="rounded-lg hover:bg-[#f1f5f9]">
                        <Eye className="h-4 w-4 text-[#64748b]" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-lg hover:bg-[#f1f5f9]"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="h-4 w-4 text-[#64748b]" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button variant="ghost" size="icon" className="rounded-lg hover:bg-[#fee2e2] group">
                            <Trash2 className="h-4 w-4 text-[#64748b] group-hover:text-[#ef4444]" />
                          </Button>
                        }
                      />
                      <AlertDialogContent className="bg-white ring-1 ring-[#e2e8f0]">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Item</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o item <strong>{item.name}</strong>? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-xl"
                            onClick={() => handleDelete(item.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-[#64748b]">
                  Nenhum item encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination page={safePage} pageSize={pageSize} total={filteredItems.length} onPageChange={setPage} />
      </div>

    </div>
  );
}
