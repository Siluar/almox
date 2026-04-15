import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Tag, Layers, Trash2, Pencil, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
}

export default function Config() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newSub, setNewSub] = useState({ name: "", category_id: "" });
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cats, subs] = await Promise.all([
        api.get("/api/categories"),
        api.get("/api/subcategories")
      ]);
      setCategories(cats);
      setSubcategories(subs);
    } catch (err) {
      toast.error("Erro ao carregar configurações");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory) return;
    try {
      if (editingCategory) {
        await api.put(`/api/categories/${editingCategory.id}`, { name: newCategory });
        toast.success("Categoria atualizada!");
      } else {
        await api.post("/api/categories", { name: newCategory });
        toast.success("Categoria criada!");
      }
      setNewCategory("");
      setEditingCategory(null);
      setIsCatDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error("Erro ao salvar categoria");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await api.delete(`/api/categories/${id}`);
      toast.success("Categoria excluída!");
      loadData();
    } catch (err) {
      toast.error("Erro ao excluir categoria (pode haver itens vinculados)");
    }
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.name || !newSub.category_id) return;
    try {
      if (editingSubcategory) {
        await api.put(`/api/subcategories/${editingSubcategory.id}`, newSub);
        toast.success("Subcategoria atualizada!");
      } else {
        await api.post("/api/subcategories", newSub);
        toast.success("Subcategoria criada!");
      }
      setNewSub({ name: "", category_id: "" });
      setEditingSubcategory(null);
      setIsSubDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error("Erro ao salvar subcategoria");
    }
  };

  const handleDeleteSub = async (id: number) => {
    try {
      await api.delete(`/api/subcategories/${id}`);
      toast.success("Subcategoria excluída!");
      loadData();
    } catch (err) {
      toast.error("Erro ao excluir subcategoria");
    }
  };

  const handleExport = async () => {
    try {
      const data = await api.get("/api/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-almoxarifado-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Backup exportado com sucesso!");
    } catch (err) {
      toast.error("Erro ao exportar backup");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        await api.post("/api/import", data);
        toast.success("Dados importados com sucesso!");
        loadData();
      } catch (err) {
        toast.error("Erro ao importar arquivo. Verifique o formato.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-zinc-500">Gerencie a estrutura organizacional do seu estoque.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            Exportar Backup
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="rounded-xl">
              <Upload className="h-4 w-4 mr-2" />
              Importar Backup
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Categories */}
        <div className="sleek-card">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5 text-[#2563eb]" />
            <h3 className="text-base font-bold">Categorias</h3>
          </div>
          <p className="text-[13px] text-[#64748b] mb-6">Defina os grupos principais de itens.</p>
          
          <div className="space-y-6">
            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <Input 
                placeholder="Nome da categoria" 
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="h-10 text-sm"
              />
              <Button type="submit" size="icon" className="bg-[#2563eb] hover:bg-[#1d4ed8] shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <span className="font-medium text-sm text-[#1e293b]">{cat.name}</span>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-[#f1f5f9]"
                      onClick={() => {
                        setEditingCategory(cat);
                        setNewCategory(cat.name);
                        setIsCatDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 text-[#64748b]" />
                    </Button>
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
                          <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a categoria <strong>{cat.name}</strong>? Isso excluirá todas as subcategorias e itens vinculados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-xl"
                            onClick={() => handleDeleteCategory(cat.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-xs text-[#64748b] text-center py-4 italic">Nenhuma categoria cadastrada.</p>
              )}
            </div>

            <Dialog open={isCatDialogOpen} onOpenChange={(open) => {
              setIsCatDialogOpen(open);
              if (!open) {
                setEditingCategory(null);
                setNewCategory("");
              }
            }}>
              <DialogContent className="bg-white ring-1 ring-[#e2e8f0]">
                <DialogHeader>
                  <DialogTitle>Editar Categoria</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCategory} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome da Categoria</Label>
                    <Input 
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white h-11 rounded-xl">
                    Salvar Alterações
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Subcategories */}
        <div className="sleek-card">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-[#10b981]" />
            <h3 className="text-base font-bold">Subcategorias</h3>
          </div>
          <p className="text-[13px] text-[#64748b] mb-6">Refine a organização dentro das categorias.</p>
          
          <div className="space-y-6">
            <form onSubmit={handleCreateSub} className="space-y-3">
              <Select 
                value={newSub.category_id} 
                onValueChange={v => setNewSub({...newSub, category_id: v})}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Selecione a categoria pai" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input 
                  placeholder="Nome da subcategoria" 
                  value={newSub.name}
                  onChange={e => setNewSub({...newSub, name: e.target.value})}
                  className="h-10 text-sm"
                />
                <Button type="submit" size="icon" className="bg-[#10b981] hover:bg-[#059669] shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </form>

            <div className="space-y-2">
              {subcategories.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-[#1e293b]">{sub.name}</span>
                    <span className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">{sub.category_name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-[#f1f5f9]"
                      onClick={() => {
                        setEditingSubcategory(sub);
                        setNewSub({ name: sub.name, category_id: sub.category_id.toString() });
                        setIsSubDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 text-[#64748b]" />
                    </Button>
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
                          <AlertDialogTitle>Excluir Subcategoria</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a subcategoria <strong>{sub.name}</strong>? Isso excluirá todos os itens vinculados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-xl"
                            onClick={() => handleDeleteSub(sub.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              {subcategories.length === 0 && (
                <p className="text-xs text-[#64748b] text-center py-4 italic">Nenhuma subcategoria cadastrada.</p>
              )}
            </div>

            <Dialog open={isSubDialogOpen} onOpenChange={(open) => {
              setIsSubDialogOpen(open);
              if (!open) {
                setEditingSubcategory(null);
                setNewSub({ name: "", category_id: "" });
              }
            }}>
              <DialogContent className="bg-white ring-1 ring-[#e2e8f0]">
                <DialogHeader>
                  <DialogTitle>Editar Subcategoria</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSub} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Categoria Pai</Label>
                    <Select 
                      value={newSub.category_id} 
                      onValueChange={v => setNewSub({...newSub, category_id: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome da Subcategoria</Label>
                    <Input 
                      value={newSub.name}
                      onChange={e => setNewSub({...newSub, name: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#10b981] hover:bg-[#059669] text-white h-11 rounded-xl">
                    Salvar Alterações
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
