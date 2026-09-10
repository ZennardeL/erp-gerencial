import React, { useState } from 'react';
import { Package, Search, PlusCircle, Filter, Edit3, Trash2, CheckCircle2, AlertCircle, Eye, Archive, DollarSign, Settings2, Shirt, ShoppingBag, Coffee, Layers } from 'lucide-react';
import { Product } from '../shared/types';

interface InventoryViewProps {
  products: Product[];
  onAddProduct: (prod: any) => Promise<void>;
  onEditProduct: (prod: any) => Promise<void>;
  onUpdateStock: (productId: string, newStock: number) => Promise<void>;
  onToggleArchive: (productId: string) => Promise<void>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onAddProduct,
  onEditProduct,
  onUpdateStock,
  onToggleArchive
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [activeGroupTab, setActiveGroupTab] = useState<'ROUPAS' | 'ACESSORIOS' | 'CONSUMIVEIS' | 'ALL'>('ROUPAS');

  // Classification helper for 3 sub-tabs
  const getProductGroup = (p: Product): 'ROUPAS' | 'ACESSORIOS' | 'CONSUMIVEIS' => {
    const text = `${p.name || ''} ${p.category || ''} ${p.brand || ''}`.toLowerCase();
    if (/camiseta|regata|bermuda|calca|calça|agasalho|top|short|blusa|moletom|corta vento|baby look|cropped|roupa|vestuario/.test(text)) {
      return 'ROUPAS';
    }
    if (/coqueteleira|garrafa|chaveiro|necessarie|necessaire|sacochila|bone|boné|mochila|toalha|strap|cinto|luva|squeeze|acessorio|acessório/.test(text)) {
      return 'ACESSORIOS';
    }
    return 'CONSUMIVEIS';
  };

  // Modal State for Manual Physical Stock Count Adjustment
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(0);

  // Modal State for Editing Full Product Details
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    id: '',
    code: '',
    name: '',
    brand: '',
    category: '',
    costPrice: 0,
    salePrice: 0,
    minStockLevel: 5
  });

  // Modal State for New Product
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdForm, setNewProdForm] = useState({
    code: '',
    name: '',
    brand: 'Panobianco',
    category: 'ROUPAS',
    costPrice: 20.00,
    salePrice: 40.00,
    minStockLevel: 5,
    currentStock: 10
  });

  const brands = Array.from(new Set(products.map(p => p.brand || 'Marca Diversa'))).sort();

  // Counts per sub-tab
  const activeProducts = products.filter(p => !showArchived ? !p.isArchived : p.isArchived);
  const roupasCount = activeProducts.filter(p => getProductGroup(p) === 'ROUPAS').length;
  const acessoriosCount = activeProducts.filter(p => getProductGroup(p) === 'ACESSORIOS').length;
  const consumiveisCount = activeProducts.filter(p => getProductGroup(p) === 'CONSUMIVEIS').length;
  const totalCount = activeProducts.length;

  const handleOpenStockModal = (prod: Product) => {
    setStockModalProduct(prod);
    setNewStockInput(prod.currentStock);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditProduct(prod);
    setEditForm({
      id: prod.id,
      code: prod.code || '',
      name: prod.name,
      brand: prod.brand || 'Marca Diversa',
      category: prod.category || 'Geral',
      costPrice: prod.costPrice || 0,
      salePrice: prod.salePrice || 0,
      minStockLevel: prod.minStockLevel || 5
    });
  };

  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalProduct) return;
    await onUpdateStock(stockModalProduct.id, newStockInput);
    setStockModalProduct(null);
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    await onEditProduct(editForm);
    setEditProduct(null);
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdForm.name) return;
    await onAddProduct(newProdForm);
    setShowAddModal(false);
    setNewProdForm({
      code: '',
      name: '',
      brand: 'Panobianco',
      category: 'ROUPAS',
      costPrice: 20.00,
      salePrice: 40.00,
      minStockLevel: 5,
      currentStock: 10
    });
  };

  const filtered = products.filter(p => {
    const isArchivedMatch = showArchived ? p.isArchived : !p.isArchived;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === 'ALL' || (p.brand || 'Marca Diversa') === selectedBrand;
    const matchesGroup = activeGroupTab === 'ALL' || getProductGroup(p) === activeGroupTab;
    return isArchivedMatch && matchesSearch && matchesBrand && matchesGroup;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              Controle Físico de Produtos & Cadastro de Preços
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Edite preços de venda, preços de custo, faça contagens físicas de geladeira e inative produtos antigos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar produto ou código..."
                className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Filter by Brand */}
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Todas as Marcas ({brands.length})</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Toggle Archived */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                showArchived
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              {showArchived ? 'Exibindo Antigos Inativos' : 'Ver Antigos Inativos'}
            </button>

            {/* Add Product Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              Cadastrar Novo Produto
            </button>
          </div>
        </div>

        {/* Sub-Tabs: Roupas, Acessórios, Consumíveis, Todos */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setActiveGroupTab('ROUPAS')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeGroupTab === 'ROUPAS'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500'
                : 'bg-slate-950 text-slate-400 border border-slate-800/80 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Shirt className="w-4 h-4 text-indigo-400" />
            Roupas
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeGroupTab === 'ROUPAS' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {roupasCount}
            </span>
          </button>

          <button
            onClick={() => setActiveGroupTab('ACESSORIOS')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeGroupTab === 'ACESSORIOS'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500'
                : 'bg-slate-950 text-slate-400 border border-slate-800/80 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            Acessórios
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeGroupTab === 'ACESSORIOS' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {acessoriosCount}
            </span>
          </button>

          <button
            onClick={() => setActiveGroupTab('CONSUMIVEIS')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeGroupTab === 'CONSUMIVEIS'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500'
                : 'bg-slate-950 text-slate-400 border border-slate-800/80 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Coffee className="w-4 h-4 text-amber-400" />
            Consumíveis (Suplementos & Bebidas)
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeGroupTab === 'CONSUMIVEIS' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {consumiveisCount}
            </span>
          </button>

          <button
            onClick={() => setActiveGroupTab('ALL')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeGroupTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500'
                : 'bg-slate-950 text-slate-400 border border-slate-800/80 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-slate-400" />
            Todos os Produtos
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeGroupTab === 'ALL' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {totalCount}
            </span>
          </button>
        </div>

        {/* Products Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            {showArchived
              ? 'Nenhum produto inativado/arquivado encontrado.'
              : 'Nenhum produto encontrado. Utilize o filtro acima ou cadastre um novo produto.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Cód</th>
                  <th className="py-2.5 px-3">Nome do Produto</th>
                  <th className="py-2.5 px-3">Marca / Categoria</th>
                  <th className="py-2.5 px-3 text-right">Custo (R$)</th>
                  <th className="py-2.5 px-3 text-right">Preço Venda (R$)</th>
                  <th className="py-2.5 px-3 text-center">Vendas Totais</th>
                  <th className="py-2.5 px-3 text-center">Saldo Físico</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((prod) => {
                  const isNegative = prod.currentStock < 0;
                  const isLow = prod.currentStock >= 0 && prod.currentStock <= prod.minStockLevel;

                  return (
                    <tr key={prod.id} className={`hover:bg-slate-800/40 ${prod.isArchived ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{prod.code || '-'}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{prod.name}</div>
                        {prod.lastPhysicalCountDate && (
                          <div className="text-[10px] text-indigo-400 font-mono">
                            Contado fisicamente em: {new Date(prod.lastPhysicalCountDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-300">{prod.brand}</span>
                        <div className="text-[10px] text-slate-500">{prod.category}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        R$ {(prod.costPrice || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                        R$ {(prod.salePrice || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {prod.totalSold || 0} un
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-sm font-extrabold font-mono ${
                          isNegative ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {prod.currentStock} un
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {prod.isArchived ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            INATIVADO
                          </span>
                        ) : isNegative ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <AlertCircle className="w-3 h-3" />
                            Divergência
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            OK
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        {/* Edit details/price button */}
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 transition text-[11px] font-semibold"
                          title="Editar preços e nome do produto"
                        >
                          <Settings2 className="w-3 h-3" />
                          Editar Valores
                        </button>

                        {/* Stock adjustment button */}
                        <button
                          onClick={() => handleOpenStockModal(prod)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition text-[11px] font-semibold"
                          title="Digitar contagem física da geladeira"
                        >
                          <Edit3 className="w-3 h-3" />
                          Qtd Física
                        </button>

                        {/* Toggle Archive button */}
                        <button
                          onClick={() => onToggleArchive(prod.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded transition text-[11px] font-semibold border ${
                            prod.isArchived
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                          }`}
                          title={prod.isArchived ? "Reativar Produto" : "Inativar produto que não vende mais"}
                        >
                          {prod.isArchived ? 'Reativar' : 'Inativar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Edit Full Product Details (Prices, Name, Brand) */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-amber-400" />
                Editar Dados & Preços do Produto
              </h3>
              <button onClick={() => setEditProduct(null)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Código</label>
                  <input
                    type="text"
                    value={editForm.code}
                    onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Marca</label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={e => setEditForm({ ...editForm, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.costPrice}
                    onChange={e => setEditForm({ ...editForm, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.salePrice}
                    onChange={e => setEditForm({ ...editForm, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={editForm.minStockLevel}
                    onChange={e => setEditForm({ ...editForm, minStockLevel: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md transition"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Physical Stock Count */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                Ajustar Saldo Físico Contado
              </h3>
              <button onClick={() => setStockModalProduct(null)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <div>
              <p className="text-xs text-slate-400">Produto selecionado:</p>
              <p className="text-sm font-bold text-white mt-0.5">{stockModalProduct.name}</p>
              <p className="text-xs text-slate-500 font-mono">Código: {stockModalProduct.code || '-'}</p>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Quantidade Física Real Contada na Geladeira/Estoque:
                </label>
                <input
                  type="number"
                  value={newStockInput}
                  onChange={e => setNewStockInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-lg font-bold font-mono text-white text-center focus:outline-none focus:border-indigo-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Esta ação substituirá qualquer divergência anterior da planilha pela contagem física real digitada.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStockModalProduct(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
                >
                  Confirmar Saldo Físico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Cadastrar Novo Produto no ERP
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Código do Produto</label>
                  <input
                    type="text"
                    placeholder="Ex: 154 ou BEB-01"
                    value={newProdForm.code}
                    onChange={e => setNewProdForm({ ...newProdForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Marca</label>
                  <input
                    type="text"
                    placeholder="Ex: Lindoya, Nutrata, Adaptogen"
                    value={newProdForm.brand}
                    onChange={e => setNewProdForm({ ...newProdForm, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  placeholder="Ex: AGUA LINDOYA COM GAS 500ML"
                  value={newProdForm.name}
                  onChange={e => setNewProdForm({ ...newProdForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProdForm.costPrice}
                    onChange={e => setNewProdForm({ ...newProdForm, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProdForm.salePrice}
                    onChange={e => setNewProdForm({ ...newProdForm, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estoque Físico Inicial</label>
                  <input
                    type="number"
                    value={newProdForm.currentStock}
                    onChange={e => setNewProdForm({ ...newProdForm, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={newProdForm.minStockLevel}
                    onChange={e => setNewProdForm({ ...newProdForm, minStockLevel: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
