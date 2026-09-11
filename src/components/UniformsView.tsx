import React, { useState } from 'react';
import { 
  Shirt, 
  PlusCircle, 
  UserCheck, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Package, 
  Settings2, 
  Flame, 
  History, 
  Users,
  Building,
  Plus,
  Minus,
  Check
} from 'lucide-react';
import { UniformItem, UniformDelivery, UniformDiscard, UniformSummary } from '../shared/types';

interface UniformsViewProps {
  items: UniformItem[];
  deliveries: UniformDelivery[];
  discards: UniformDiscard[];
  summary: UniformSummary | null;
  onAddStockItem: (item: Partial<UniformItem>) => Promise<void>;
  onEditStockItem: (item: Partial<UniformItem>) => Promise<void>;
  onDeleteStockItem: (id: string) => Promise<void>;
  onAddDelivery: (delivery: any) => Promise<void>;
  onEditDelivery: (delivery: Partial<UniformDelivery>) => Promise<void>;
  onDeleteDelivery: (id: string) => Promise<void>;
  onAddDiscard: (discard: Partial<UniformDiscard>) => Promise<void>;
  onDeleteDiscard: (id: string) => Promise<void>;
}

export const UniformsView: React.FC<UniformsViewProps> = ({
  items,
  deliveries,
  discards,
  summary,
  onAddStockItem,
  onEditStockItem,
  onDeleteStockItem,
  onAddDelivery,
  onEditDelivery,
  onDeleteDelivery,
  onAddDiscard,
  onDeleteDiscard
}) => {
  const [subTab, setSubTab] = useState<'stock' | 'deliveries' | 'discards'>('stock');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingStockItem, setEditingStockItem] = useState<UniformItem | null>(null);
  const [stockForm, setStockForm] = useState({
    name: '',
    type: 'CAMISETA' as UniformItem['type'],
    size: 'M' as UniformItem['size'],
    currentQuantity: 10,
    minQuantity: 2,
    unitCost: 35.00,
    notes: ''
  });

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<UniformDelivery | null>(null);
  
  // Delivery Header Info
  const [deliveryEmployee, setDeliveryEmployee] = useState({
    employeeName: '',
    employeeRole: 'Recepção',
    deliveryDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Delivery Items Basket (for delivering multiple items at once)
  const [deliveryBasket, setDeliveryBasket] = useState<{
    uniformItemId: string;
    uniformName: string;
    size: string;
    quantity: number;
  }[]>([]);

  // Item Selector inside Modal
  const [selectedStockId, setSelectedStockId] = useState(items.length > 0 ? items[0].id : '');
  const [itemQuantityToAdd, setItemQuantityToAdd] = useState(1);

  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [discardForm, setDiscardForm] = useState({
    uniformItemId: '',
    uniformName: '',
    size: 'M',
    quantity: 1,
    reason: 'USO_EXCESSO' as UniformDiscard['reason'],
    discardDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Handlers for Stock Items
  const handleOpenAddStock = () => {
    setEditingStockItem(null);
    setStockForm({
      name: '',
      type: 'CAMISETA',
      size: 'M',
      currentQuantity: 10,
      minQuantity: 2,
      unitCost: 35.00,
      notes: ''
    });
    setShowStockModal(true);
  };

  const handleOpenEditStock = (item: UniformItem) => {
    setEditingStockItem(item);
    setStockForm({
      name: item.name,
      type: item.type,
      size: item.size as any,
      currentQuantity: item.currentQuantity,
      minQuantity: item.minQuantity,
      unitCost: item.unitCost,
      notes: item.notes || ''
    });
    setShowStockModal(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.name) return;
    if (editingStockItem) {
      await onEditStockItem({ id: editingStockItem.id, ...stockForm });
    } else {
      await onAddStockItem(stockForm);
    }
    setShowStockModal(false);
  };

  const handleDeleteStock = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o item de uniforme "${name}" do estoque?`)) {
      await onDeleteStockItem(id);
    }
  };

  // Handlers for Deliveries (Multiple Items Support!)
  const handleOpenAddDelivery = () => {
    setEditingDelivery(null);
    setDeliveryEmployee({
      employeeName: '',
      employeeRole: 'Recepção',
      deliveryDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setDeliveryBasket([]);
    if (items.length > 0) {
      setSelectedStockId(items[0].id);
    }
    setItemQuantityToAdd(1);
    setShowDeliveryModal(true);
  };

  const handleOpenEditDelivery = (deliv: UniformDelivery) => {
    setEditingDelivery(deliv);
    setDeliveryEmployee({
      employeeName: deliv.employeeName,
      employeeRole: deliv.employeeRole,
      deliveryDate: deliv.deliveryDate ? deliv.deliveryDate.split('T')[0] : new Date().toISOString().split('T')[0],
      notes: deliv.notes || ''
    });
    setDeliveryBasket([{
      uniformItemId: deliv.uniformItemId,
      uniformName: deliv.uniformName,
      size: deliv.size,
      quantity: deliv.quantity
    }]);
    setShowDeliveryModal(true);
  };

  const handleAddItemToBasket = () => {
    const found = items.find(i => i.id === selectedStockId);
    if (!found) return;

    setDeliveryBasket(prev => {
      const existingIdx = prev.findIndex(p => p.uniformItemId === found.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += itemQuantityToAdd;
        return copy;
      }
      return [...prev, {
        uniformItemId: found.id,
        uniformName: `${found.name} (Tam ${found.size})`,
        size: found.size,
        quantity: itemQuantityToAdd
      }];
    });
  };

  const handleRemoveFromBasket = (index: number) => {
    setDeliveryBasket(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryEmployee.employeeName) return;

    if (editingDelivery) {
      // Editing single record
      const firstItem = deliveryBasket[0];
      await onEditDelivery({
        id: editingDelivery.id,
        employeeName: deliveryEmployee.employeeName,
        employeeRole: deliveryEmployee.employeeRole,
        deliveryDate: deliveryEmployee.deliveryDate,
        notes: deliveryEmployee.notes,
        uniformItemId: firstItem?.uniformItemId || editingDelivery.uniformItemId,
        uniformName: firstItem?.uniformName || editingDelivery.uniformName,
        size: firstItem?.size || editingDelivery.size,
        quantity: firstItem?.quantity || editingDelivery.quantity
      });
    } else {
      // Registering new batch of multiple uniform items at once!
      if (deliveryBasket.length === 0) {
        alert('Por favor, adicione pelo menos um uniforme ao pacote de entrega.');
        return;
      }

      await onAddDelivery({
        employeeName: deliveryEmployee.employeeName,
        employeeRole: deliveryEmployee.employeeRole,
        deliveryDate: deliveryEmployee.deliveryDate,
        notes: deliveryEmployee.notes,
        items: deliveryBasket
      });
    }

    setShowDeliveryModal(false);
  };

  const handleDeleteDelivery = async (id: string, employeeName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o registro de entrega para "${employeeName}"?`)) {
      await onDeleteDelivery(id);
    }
  };

  // Handlers for Discards
  const handleOpenAddDiscard = (item?: UniformItem) => {
    setDiscardForm({
      uniformItemId: item ? item.id : (items.length > 0 ? items[0].id : ''),
      uniformName: item ? `${item.name} (Tam ${item.size})` : (items.length > 0 ? items[0].name : 'Uniforme'),
      size: item ? item.size : 'M',
      quantity: 1,
      reason: 'USO_EXCESSO',
      discardDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowDiscardModal(true);
  };

  const handleDiscardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddDiscard(discardForm);
    setShowDiscardModal(false);
  };

  const handleDeleteDiscard = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de descarte?')) {
      await onDeleteDiscard(id);
    }
  };

  // Filtered views
  const filteredStock = items.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeliveries = deliveries.filter(d =>
    d.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.uniformName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.employeeRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDiscards = discards.filter(d =>
    d.uniformName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total em Estoque */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Em Estoque</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
              <Shirt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-xl sm:text-2xl font-extrabold text-white">
              {summary ? summary.totalStockItems : 0} peças
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Disponíveis para entrega</p>
          </div>
        </div>

        {/* Total Entregue a Funcionários */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Entregue à Equipe</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-400">
              {summary ? summary.totalDeliveredItems : 0} entregas
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Em posse dos colaboradores</p>
          </div>
        </div>

        {/* Total Descartado por Dano/Uso */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Descarte / Dano</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 flex-shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-xl sm:text-2xl font-extrabold text-rose-400">
              {summary ? summary.totalDiscardedItems : 0} baixas
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Desgaste ou avarias</p>
          </div>
        </div>

        {/* Alertas de Estoque Mínimo */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Estoque Baixo</span>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center border flex-shrink-0 ${
              summary && summary.lowStockItemsCount > 0
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className={`text-xl sm:text-2xl font-extrabold ${summary && summary.lowStockItemsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {summary ? summary.lowStockItemsCount : 0} tamanhos
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Limite ou abaixo do mín.</p>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-6 shadow-sm">
        {/* Navigation & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800 pb-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
            <button
              onClick={() => setSubTab('stock')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                subTab === 'stock'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Shirt className="w-4 h-4" />
              Estoque ({items.length})
            </button>

            <button
              onClick={() => setSubTab('deliveries')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                subTab === 'deliveries'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Entregas ({deliveries.length})
            </button>

            <button
              onClick={() => setSubTab('discards')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                subTab === 'discards'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Flame className="w-4 h-4" />
              Baixas / Descartes ({discards.length})
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar uniforme, funcionário..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {subTab === 'stock' && (
              <button
                onClick={handleOpenAddStock}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                Cadastrar Nova Peça
              </button>
            )}

            {subTab === 'deliveries' && (
              <button
                onClick={handleOpenAddDelivery}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                Registrar Entrega
              </button>
            )}

            {subTab === 'discards' && (
              <button
                onClick={() => handleOpenAddDiscard()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                Registrar Descarte
              </button>
            )}
          </div>
        </div>

        {/* SUB-TAB 1: STOCK ITEMS TABLE */}
        {subTab === 'stock' && (
          <div>
            {filteredStock.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Nenhum uniforme cadastrado no estoque. Clique no botão acima para cadastrar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Peça / Descrição</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3 text-center">Tamanho</th>
                      <th className="py-2.5 px-3 text-center">Qtd em Estoque</th>
                      <th className="py-2.5 px-3 text-center">Estoque Mínimo</th>
                      <th className="py-2.5 px-3 text-right">Custo Unit. (R$)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStock.map(item => {
                      const isLow = item.currentQuantity <= item.minQuantity;

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white">{item.name}</div>
                            {item.notes && <div className="text-[10px] text-slate-500">{item.notes}</div>}
                          </td>
                          <td className="py-3 px-3 text-slate-400">{item.type}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-indigo-400 text-sm">
                            {item.size}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-extrabold text-white text-sm">
                            {item.currentQuantity} un
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-400">{item.minQuantity} un</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-300">R$ {item.unitCost.toFixed(2)}</td>
                          <td className="py-3 px-3 text-center">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                <AlertTriangle className="w-3 h-3" />
                                ESTOQUE BAIXO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle className="w-3 h-3" />
                                DISPONÍVEL
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right space-x-1.5">
                            <button
                              onClick={() => handleOpenAddDiscard(item)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition text-[11px] font-semibold"
                              title="Dar baixa por descarte ou uso em excesso"
                            >
                              <Flame className="w-3 h-3" />
                              Baixa / Descarte
                            </button>
                            <button
                              onClick={() => handleOpenEditStock(item)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 transition text-[11px] font-semibold"
                              title="Editar estoque ou valores"
                            >
                              <Settings2 className="w-3 h-3" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteStock(item.id, item.name)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white border border-slate-700 transition text-[11px] font-semibold"
                              title="Excluir peça"
                            >
                              <Trash2 className="w-3 h-3" />
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
        )}

        {/* SUB-TAB 2: DELIVERIES TABLE */}
        {subTab === 'deliveries' && (
          <div>
            {filteredDeliveries.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Nenhuma entrega de uniforme registrada para funcionários. Clique em "Registrar Entrega".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Data Entrega</th>
                      <th className="py-2.5 px-3">Funcionário</th>
                      <th className="py-2.5 px-3">Cargo / Função</th>
                      <th className="py-2.5 px-3">Uniforme Entregue</th>
                      <th className="py-2.5 px-3 text-center">Tamanho</th>
                      <th className="py-2.5 px-3 text-center">Qtd Entregue</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredDeliveries.map(deliv => (
                      <tr key={deliv.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {new Date(deliv.deliveryDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{deliv.employeeName}</div>
                          {deliv.notes && <div className="text-[10px] text-slate-500">{deliv.notes}</div>}
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-medium">{deliv.employeeRole}</td>
                        <td className="py-3 px-3 font-medium text-slate-200">{deliv.uniformName}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-indigo-400 text-sm">
                          {deliv.size}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-extrabold text-emerald-400 text-sm">
                          {deliv.quantity} un
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenEditDelivery(deliv)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 transition text-[11px] font-semibold"
                          >
                            <Settings2 className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteDelivery(deliv.id, deliv.employeeName)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition text-[11px] font-semibold"
                          >
                            <Trash2 className="w-3 h-3" />
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 3: DISCARDS TABLE */}
        {subTab === 'discards' && (
          <div>
            {filteredDiscards.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Nenhum registro de descarte ou dano de uniforme.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Data Descarte</th>
                      <th className="py-2.5 px-3">Peça / Uniforme</th>
                      <th className="py-2.5 px-3 text-center">Tamanho</th>
                      <th className="py-2.5 px-3 text-center">Qtd Descartada</th>
                      <th className="py-2.5 px-3">Motivo da Baixa</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredDiscards.map(disc => (
                      <tr key={disc.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {new Date(disc.discardDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{disc.uniformName}</div>
                          {disc.notes && <div className="text-[10px] text-slate-500">{disc.notes}</div>}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-indigo-400 text-sm">
                          {disc.size}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-extrabold text-rose-400 text-sm">
                          {disc.quantity} un
                        </td>
                        <td className="py-3 px-3">
                          {disc.reason === 'USO_EXCESSO' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Uso em Excesso / Desgaste
                            </span>
                          )}
                          {disc.reason === 'DANIFICADO' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Danificado / Rasgado
                            </span>
                          )}
                          {disc.reason === 'PERDA' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              Perda
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteDiscard(disc.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition text-[11px] font-semibold"
                          >
                            <Trash2 className="w-3 h-3" />
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT STOCK ITEM */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Shirt className="w-5 h-5 text-indigo-400" />
                {editingStockItem ? 'Editar Peça de Uniforme' : 'Cadastrar Nova Peça no Estoque'}
              </h3>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome / Descrição da Peça</label>
                <input
                  type="text"
                  placeholder="Ex: Camiseta Recepção Preta ou Regata Instrutor"
                  value={stockForm.name}
                  onChange={e => setStockForm({ ...stockForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Peça</label>
                  <select
                    value={stockForm.type}
                    onChange={e => setStockForm({ ...stockForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CAMISETA">CAMISETA</option>
                    <option value="CALCA">CALÇA</option>
                    <option value="BERMUDA">BERMUDA / SHORTS</option>
                    <option value="AGASALHO">AGASALHO / BLUSA</option>
                    <option value="REGATA">REGATA</option>
                    <option value="AVENTAL">AVENTAL / OUTROS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tamanho</label>
                  <select
                    value={stockForm.size}
                    onChange={e => setStockForm({ ...stockForm, size: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-indigo-400 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PP">PP</option>
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                    <option value="XGG">XGG</option>
                    <option value="UNICO">ÚNICO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Qtd em Estoque</label>
                  <input
                    type="number"
                    min="0"
                    value={stockForm.currentQuantity}
                    onChange={e => setStockForm({ ...stockForm, currentQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={stockForm.minQuantity}
                    onChange={e => setStockForm({ ...stockForm, minQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Custo Unit. (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={stockForm.unitCost}
                    onChange={e => setStockForm({ ...stockForm, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Observações (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Malha 100% algodão com logo bordado"
                  value={stockForm.notes}
                  onChange={e => setStockForm({ ...stockForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
                >
                  {editingStockItem ? 'Salvar Alterações' : 'Salvar Peça'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER MULTIPLE UNIFORM DELIVERIES AT ONCE */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                {editingDelivery ? 'Editar Registro de Entrega' : 'Registrar Entrega de Uniformes'}
              </h3>
              <button onClick={() => setShowDeliveryModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleDeliverySubmit} className="space-y-4">
              {/* Employee Info Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Funcionário</label>
                  <input
                    type="text"
                    placeholder="Ex: Maria Souza ou Luan Silva"
                    value={deliveryEmployee.employeeName}
                    onChange={e => setDeliveryEmployee({ ...deliveryEmployee, employeeName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    placeholder="Ex: Recepção, Instrutor, Limpeza"
                    value={deliveryEmployee.employeeRole}
                    onChange={e => setDeliveryEmployee({ ...deliveryEmployee, employeeRole: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Delivery Basket Selector (Allowing Multiple Items!) */}
              {!editingDelivery && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    ➕ Adicionar Peça ao Pacote de Entrega
                  </label>

                  {items.length === 0 ? (
                    <p className="text-xs text-slate-500">Cadastre peças no estoque antes de entregar.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-7">
                        <select
                          value={selectedStockId}
                          onChange={e => setSelectedStockId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          {items.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.name} - Tam: {i.size} (Estoque: {i.currentQuantity} un)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setItemQuantityToAdd(Math.max(1, itemQuantityToAdd - 1))}
                            className="px-2 py-1 text-slate-400 hover:text-white"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="flex-1 text-center font-mono font-bold text-xs text-white">{itemQuantityToAdd}</span>
                          <button
                            type="button"
                            onClick={() => setItemQuantityToAdd(itemQuantityToAdd + 1)}
                            className="px-2 py-1 text-slate-400 hover:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddItemToBasket}
                          className="w-full py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow"
                        >
                          <Plus className="w-4 h-4" />
                          Incluir
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Basket Item List */}
                  {deliveryBasket.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-slate-800/80 pt-3">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Itens do Pacote ({deliveryBasket.length}):
                      </p>
                      {deliveryBasket.map((bItem, idx) => (
                        <div key={idx} className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">{bItem.uniformName}</span>
                            <span className="ml-2 font-mono text-indigo-400 font-bold">Tam: {bItem.size}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-extrabold text-emerald-400">{bItem.quantity} un</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromBasket(idx)}
                              className="text-slate-500 hover:text-rose-400 transition"
                              title="Remover este item do pacote"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Data da Entrega</label>
                  <input
                    type="date"
                    value={deliveryEmployee.deliveryDate}
                    onChange={e => setDeliveryEmployee({ ...deliveryEmployee, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Observações (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Entrega de kit completo de admissão"
                    value={deliveryEmployee.notes}
                    onChange={e => setDeliveryEmployee({ ...deliveryEmployee, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!editingDelivery && deliveryBasket.length === 0}
                  className="px-4 py-2 rounded-lg text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition disabled:opacity-40"
                >
                  {editingDelivery
                    ? 'Salvar Alterações'
                    : `Confirmar Entrega de ${deliveryBasket.reduce((sum, i) => sum + i.quantity, 0)} peça(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER DISCARD / DAMAGE */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-400" />
                Registrar Baixa / Descarte de Uniforme
              </h3>
              <button onClick={() => setShowDiscardModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleDiscardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Peça / Uniforme</label>
                <input
                  type="text"
                  value={discardForm.uniformName}
                  onChange={e => setDiscardForm({ ...discardForm, uniformName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Motivo do Descarte</label>
                  <select
                    value={discardForm.reason}
                    onChange={e => setDiscardForm({ ...discardForm, reason: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="USO_EXCESSO">🔥 USO EM EXCESSO / DESGASTE NATURAL</option>
                    <option value="DANIFICADO">⚠️ DANIFICADO / RASGADO</option>
                    <option value="PERDA">❓ PERDA / DESAPARECIDO</option>
                    <option value="OUTRO">OUTRO MOTIVO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tamanho</label>
                  <input
                    type="text"
                    value={discardForm.size}
                    onChange={e => setDiscardForm({ ...discardForm, size: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Qtd a Dar Baixa</label>
                  <input
                    type="number"
                    min="1"
                    value={discardForm.quantity}
                    onChange={e => setDiscardForm({ ...discardForm, quantity: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Data da Baixa</label>
                  <input
                    type="date"
                    value={discardForm.discardDate}
                    onChange={e => setDiscardForm({ ...discardForm, discardDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Observações (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Mancha de tinta insuperável ou desgaste por tempo de uso"
                  value={discardForm.notes}
                  onChange={e => setDiscardForm({ ...discardForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDiscardModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition"
                >
                  Confirmar Baixa / Descarte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
