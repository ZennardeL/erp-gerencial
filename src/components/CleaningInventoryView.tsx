import React, { useState, useMemo } from 'react';
import { 
  Sparkles, PlusCircle, AlertTriangle, CheckCircle, Search, DollarSign, 
  Calendar, Package, Settings2, Trash2, TrendingUp, BarChart3, LineChart as LineChartIcon,
  ShoppingCart, Copy, Check, MessageSquare, Filter, ShieldAlert, ArrowUpRight, ArrowDownRight, Clock, Plus, Minus, Receipt
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Cell } from 'recharts';
import { CleaningProduct } from '../shared/types';
import { formatDate } from '../shared/formatters';

interface CleaningInventoryViewProps {
  products: CleaningProduct[];
  onAddProduct: (prod: Partial<CleaningProduct>) => Promise<void>;
  onEditProduct: (prod: Partial<CleaningProduct>) => Promise<void>;
  onDeleteProduct: (idOrIds: string | string[]) => Promise<void>;
}

export const CleaningInventoryView: React.FC<CleaningInventoryViewProps> = ({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct
}) => {
  // Main Sub-tabs: CURRENT_STOCK (Estoque Atual da Academia) | INVOICE_HISTORY (Histórico de Compras por Mês) | ANALYTICS (Curva ABC & Inflação) | FORECAST (Cotação WhatsApp)
  const [activeTab, setActiveTab] = useState<'CURRENT_STOCK' | 'INVOICE_HISTORY' | 'ANALYTICS' | 'FORECAST'>('CURRENT_STOCK');
  
  // Month selector filter for Invoice History tab
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');

  const [showModal, setShowModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CleaningProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [selectedProductInflation, setSelectedProductInflation] = useState<string>('PAPEL HIG. ROLAO C/ 8');

  // Form state for add/edit modal
  const [form, setForm] = useState({
    arrivalDate: new Date().toISOString().split('T')[0],
    name: '',
    category: 'DESINFETANTE' as CleaningProduct['category'],
    unit: 'LITROS' as CleaningProduct['unit'],
    currentQuantity: 10,
    minQuantity: 5,
    unitCost: 15.00,
    supplier: 'Rosana Galvão / Distribuidora'
  });

  // State for order generator checkboxes
  const [orderItems, setOrderItems] = useState<{ [key: string]: { selected: boolean; qty: number; unit: string } }>({});

  // Sort products strictly by date DESCENDING (Most recent first)
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const dateA = new Date(a.arrivalDate || '2025-06-11').getTime();
      const dateB = new Date(b.arrivalDate || '2025-06-11').getTime();
      return dateB - dateA;
    });
  }, [products]);

  // --- 1. CONSOLIDATED CURRENT STOCK (ESTOQUE ATUAL VIGENTE DA ACADEMIA) ---
  // Grouping items by normalized name to show unique product rows with latest stock status
  const currentStockList = useMemo(() => {
    const map: { [key: string]: {
      id: string;
      allIds: string[];
      name: string;
      category: CleaningProduct['category'];
      unit: CleaningProduct['unit'];
      latestUnitCost: number;
      currentQuantity: number;
      minQuantity: number;
      lastArrivalDate: string;
      supplier: string;
      rawItem: CleaningProduct;
    } } = {};

    sortedProducts.forEach(p => {
      const key = p.name.trim().toUpperCase();
      if (!map[key]) {
        map[key] = {
          id: p.id,
          allIds: [p.id],
          name: p.name,
          category: p.category,
          unit: p.unit,
          latestUnitCost: p.unitCost,
          currentQuantity: p.currentQuantity,
          minQuantity: p.minQuantity,
          lastArrivalDate: p.arrivalDate || '2025-06-11',
          supplier: p.supplier || 'Rosana Galvão / Distribuidora',
          rawItem: p
        };
      } else {
        map[key].allIds.push(p.id);
      }
    });

    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [sortedProducts]);

  // Filtered current stock based on search term
  const filteredCurrentStock = useMemo(() => {
    return currentStockList.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentStockList, searchTerm]);

  // --- 2. INVOICE HISTORY BY MONTH (NOTAS FISCAIS ORGANIZADAS POR PERÍODO) ---
  // Extract list of unique months with invoice totals
  const invoiceMonthList = useMemo(() => {
    const map: { [key: string]: { dateKey: string; label: string; dateStr: string; total: number; count: number } } = {};

    sortedProducts.forEach(p => {
      const dateStr = p.arrivalDate ? p.arrivalDate.substring(0, 10) : '2025-06-11';
      const dateKey = p.arrivalDate ? p.arrivalDate.substring(0, 7) : '2025-06';
      
      // Format label e.g., "Junho/2026 (30/06/2026)"
      const [year, month] = dateKey.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthIndex = parseInt(month, 10) - 1;
      const formattedMonth = `${monthNames[monthIndex] || month}/${year}`;

      const cost = p.totalValue || (p.currentQuantity * p.unitCost);

      if (!map[dateStr]) {
        map[dateStr] = {
          dateKey,
          label: `${formattedMonth} (${formatDate(dateStr)})`,
          dateStr,
          total: 0,
          count: 0
        };
      }
      map[dateStr].total += cost;
      map[dateStr].count += 1;
    });

    return Object.values(map).sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
  }, [sortedProducts]);

  // Filtered products for Invoice History tab
  const filteredInvoiceProducts = useMemo(() => {
    return sortedProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.category.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedMonthFilter === 'ALL') return true;
      const pDate = p.arrivalDate ? p.arrivalDate.substring(0, 10) : '2025-06-11';
      return pDate === selectedMonthFilter;
    });
  }, [sortedProducts, searchTerm, selectedMonthFilter]);

  // Total calculated for currently selected month filter
  const selectedMonthTotal = useMemo(() => {
    return filteredInvoiceProducts.reduce((acc, p) => acc + (p.totalValue || (p.currentQuantity * p.unitCost)), 0);
  }, [filteredInvoiceProducts]);

  // KPI Calculations
  const currentStockTotalValue = currentStockList.reduce((acc, item) => acc + (item.currentQuantity * item.latestUnitCost), 0);
  const currentStockTotalItems = currentStockList.reduce((acc, item) => acc + item.currentQuantity, 0);
  const lowStockCount = currentStockList.filter(item => item.currentQuantity <= item.minQuantity).length;

  // Handlers for Add/Edit/Delete
  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      arrivalDate: new Date().toISOString().split('T')[0],
      name: '',
      category: 'DESINFETANTE',
      unit: 'LITROS',
      currentQuantity: 10,
      minQuantity: 5,
      unitCost: 15.00,
      supplier: 'Rosana Galvão / Distribuidora'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: CleaningProduct) => {
    setEditingItem(item);
    setForm({
      arrivalDate: item.arrivalDate ? item.arrivalDate.split('T')[0] : new Date().toISOString().split('T')[0],
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentQuantity: item.currentQuantity,
      minQuantity: item.minQuantity,
      unitCost: item.unitCost,
      supplier: item.supplier || ''
    });
    setShowModal(true);
  };

  // Quick Quantity Increase/Decrease on Current Stock Tab
  const handleAdjustQuantity = async (rawItem: CleaningProduct, delta: number) => {
    const newQty = Math.max(0, rawItem.currentQuantity + delta);
    await onEditProduct({
      id: rawItem.id,
      currentQuantity: newQty
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    if (editingItem) {
      await onEditProduct({
        id: editingItem.id,
        ...form
      });
    } else {
      await onAddProduct(form);
    }
    setShowModal(false);
  };

  const handleDelete = async (idOrIds: string | string[], name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${name}" do estoque da academia?`)) {
      await onDeleteProduct(idOrIds);
    }
  };

  // --- ANALYTICS CALCULATIONS ---
  const monthlyData = useMemo(() => {
    const map: { [key: string]: number } = {};
    sortedProducts.forEach(p => {
      const date = p.arrivalDate || (p.createdAt ? p.createdAt.split('T')[0] : '');
      if (!date) return;
      const dateStr = date.substring(0, 7);
      const cost = p.totalValue || (p.currentQuantity * p.unitCost);
      map[dateStr] = (map[dateStr] || 0) + cost;
    });

    return Object.keys(map)
      .sort()
      .map(month => ({
        month: month.replace(/(\d{4})-(\d{2})/, '$2/$1'),
        total: Math.round(map[month] * 100) / 100
      }));
  }, [sortedProducts]);

  const abcCurveData = useMemo(() => {
    const productMap: { [key: string]: { totalCost: number; totalQty: number; unit: string; category: string } } = {};

    sortedProducts.forEach(p => {
      const normalizedName = p.name.toUpperCase().trim();
      const cost = p.totalValue || (p.currentQuantity * p.unitCost);

      if (!productMap[normalizedName]) {
        productMap[normalizedName] = {
          totalCost: 0,
          totalQty: 0,
          unit: p.unit,
          category: p.category
        };
      }
      productMap[normalizedName].totalCost += cost;
      productMap[normalizedName].totalQty += p.currentQuantity;
    });

    return Object.keys(productMap)
      .map(name => ({
        name,
        totalCost: Math.round(productMap[name].totalCost * 100) / 100,
        totalQty: productMap[name].totalQty,
        unit: productMap[name].unit,
        category: productMap[name].category
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [sortedProducts]);

  const uniqueProductNames = useMemo(() => {
    const set = new Set<string>();
    sortedProducts.forEach(p => set.add(p.name.trim()));
    return Array.from(set).sort();
  }, [sortedProducts]);

  const priceHistoryData = useMemo(() => {
    const targetName = selectedProductInflation.toLowerCase().trim();
    return sortedProducts
      .filter(p => p.name.toLowerCase().trim().includes(targetName) || targetName.includes(p.name.toLowerCase().trim()))
      .map(p => ({
        id: p.id,
        date: p.arrivalDate ? p.arrivalDate.substring(0, 10) : '2025-06-11',
        formattedDate: p.arrivalDate ? formatDate(p.arrivalDate) : '11/06/2025',
        unitCost: p.unitCost,
        supplier: p.supplier || 'Distribuidora'
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sortedProducts, selectedProductInflation]);

  const priceInflationCalc = useMemo(() => {
    if (priceHistoryData.length < 2) return null;
    const firstPrice = priceHistoryData[0].unitCost;
    const lastPrice = priceHistoryData[priceHistoryData.length - 1].unitCost;
    const diff = lastPrice - firstPrice;
    const percent = ((diff / firstPrice) * 100).toFixed(1);
    return { firstPrice, lastPrice, diff, percent: Number(percent) };
  }, [priceHistoryData]);

  // Order Generator
  const handleOpenOrderModal = () => {
    const initial: { [key: string]: { selected: boolean; qty: number; unit: string } } = {};
    currentStockList.forEach(item => {
      const isLow = item.currentQuantity <= item.minQuantity;
      initial[item.name] = {
        selected: isLow,
        qty: Math.max(item.minQuantity * 2, 2),
        unit: item.unit
      };
    });
    setOrderItems(initial);
    setShowOrderModal(true);
  };

  const generatedOrderText = useMemo(() => {
    const selectedList = Object.keys(orderItems).filter(name => orderItems[name]?.selected);
    const today = new Date().toLocaleDateString('pt-BR');

    if (selectedList.length === 0) return 'Nenhum item selecionado para cotação.';

    let text = `📋 *SOLICITAÇÃO DE COTAÇÃO - LIMPEZA & HIGIENE*\n`;
    text += `🏢 *Academia Receptor ERP*\n`;
    text += `📅 *Data:* ${today}\n`;
    text += `-------------------------------------------\n\n`;
    text += `Olá, Rosana! Gostaria de solicitar o orçamento dos seguintes materiais:\n\n`;

    selectedList.forEach((name, idx) => {
      const info = orderItems[name];
      text += `${idx + 1}. *${name}*\n   └ Qtd Solicitada: *${info.qty} ${info.unit}*\n`;
    });

    text += `\n-------------------------------------------\n`;
    text += ` Por favor, nos envie os valores unitários e o prazo de entrega.\n`;
    text += `Ficamos no aguardo! Obrigado.`;

    return text;
  }, [orderItems]);

  const handleCopyWhatsapp = () => {
    navigator.clipboard.writeText(generatedOrderText);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 2500);
  };

  const handleOpenWhatsappWeb = () => {
    const encoded = encodeURIComponent(generatedOrderText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Patrimônio Atual no Estoque */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Estoque Físico</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-lg sm:text-xl font-extrabold text-white">
              R$ {currentStockTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Valor em materiais</p>
          </div>
        </div>

        {/* Variedade de Produtos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Itens Únicos</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-lg sm:text-xl font-extrabold text-indigo-400">
              {currentStockList.length} Produtos
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">{currentStockTotalItems} un. em estoque</p>
          </div>
        </div>

        {/* Alertas de Recompra */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Recompra</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${
              lowStockCount > 0
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className={`text-lg sm:text-xl font-extrabold ${lowStockCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {lowStockCount} Produto(s)
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Abaixo do mínimo</p>
          </div>
        </div>

        {/* Botão Cotação Rápida */}
        <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Cotação
            </span>
            <span className="text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/30">
              Rosana
            </span>
          </div>
          <button
            onClick={handleOpenOrderModal}
            className="mt-2 w-full py-1.5 sm:py-2 px-2 sm:px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] sm:text-xs rounded-lg shadow-md flex items-center justify-center gap-1.5 transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Gerar Pedido
          </button>
        </div>
      </div>

      {/* Main Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none max-w-full">
        <button
          onClick={() => setActiveTab('CURRENT_STOCK')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex-shrink-0 ${
            activeTab === 'CURRENT_STOCK'
              ? 'bg-emerald-600 text-white shadow-lg ring-1 ring-emerald-400'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-300" />
          ESTOQUE ATUAL ({currentStockList.length})
        </button>

        <button
          onClick={() => setActiveTab('INVOICE_HISTORY')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex-shrink-0 ${
            activeTab === 'INVOICE_HISTORY'
              ? 'bg-indigo-600 text-white shadow-lg ring-1 ring-indigo-400'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4 text-indigo-300" />
          HISTÓRICO DE COMPRAS ({invoiceMonthList.length})
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex-shrink-0 ${
            activeTab === 'ANALYTICS'
              ? 'bg-indigo-600 text-white shadow-lg ring-1 ring-indigo-400'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-400" />
          CURVA ABC & INFLAÇÃO
        </button>

        <button
          onClick={() => setActiveTab('FORECAST')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex-shrink-0 ${
            activeTab === 'FORECAST'
              ? 'bg-indigo-600 text-white shadow-lg ring-1 ring-indigo-400'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-400" />
          COTAÇÃO WHATSAPP
        </button>
      </div>

      {/* TAB 1: CONSOLIDATED CURRENT STOCK (ESTOQUE ATUAL REAL NA PRATELEIRA) */}
      {activeTab === 'CURRENT_STOCK' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                Estoque Atual Vigente da Academia (Posição Física de Hoje)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Visualização consolidada do saldo disponível na prateleira. Altere quantidades rapidamente com + / - ao realizar a contagem diária.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar estoque atual..."
                  className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
              >
                <PlusCircle className="w-4 h-4" />
                Cadastrar / Entrada de Produto
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCurrentStock.map(item => {
              const isLow = item.currentQuantity <= item.minQuantity;
              const totalVal = item.currentQuantity * item.latestUnitCost;

              return (
                <div key={item.name} className={`p-4 rounded-xl border transition shadow-sm flex flex-col justify-between ${
                  isLow ? 'bg-rose-950/20 border-rose-500/40' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {item.category}
                        </span>
                        <h3 className="font-bold text-sm text-white mt-1.5 leading-snug">{item.name}</h3>
                      </div>
                      {isLow ? (
                        <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> RECOMPRA
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          OK
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Último Custo Unit.:</span>
                        <span className="font-mono font-bold text-slate-200">R$ {item.latestUnitCost.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Valor Total Estoque:</span>
                        <span className="font-mono font-extrabold text-emerald-400">R$ {totalVal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Estoque Físico Atual:</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xl font-extrabold text-white font-mono">{item.currentQuantity}</span>
                        <span className="text-xs text-slate-400">{item.unit}</span>
                      </div>
                    </div>

                    {/* Quick Adjustment Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdjustQuantity(item.rawItem, -1)}
                        className="w-7 h-7 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg flex items-center justify-center font-bold text-sm transition"
                        title="Diminuir 1 unidade (Uso no dia)"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleAdjustQuantity(item.rawItem, 1)}
                        className="w-7 h-7 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg flex items-center justify-center font-bold text-sm transition"
                        title="Adicionar 1 unidade"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item.rawItem)}
                        className="w-7 h-7 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-400 rounded-lg flex items-center justify-center transition"
                        title="Editar Detalhes"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.allIds, item.name)}
                        className="w-7 h-7 bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 rounded-lg flex items-center justify-center transition"
                        title="Excluir produto do estoque"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INVOICE HISTORY BY MONTH (HISTÓRICO ORGANIZADO DE NOTAS FISCAIS POR MÊS) */}
      {activeTab === 'INVOICE_HISTORY' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                Histórico de Notas Fiscais & Compras por Período
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Selecione qualquer mês para visualizar os produtos comprados e o valor total de cada Nota Fiscal em ordem cronológica estrita.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Total Filtrado:</span>
              <span className="text-sm font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg font-mono">
                R$ {selectedMonthTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Month Selector Filter Bar */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-400" /> Selecione o Pedido / Nota Fiscal por Data:
            </span>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMonthFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedMonthFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                📋 Todas as Notas ({products.length} itens)
              </button>

              {invoiceMonthList.map(month => (
                <button
                  key={month.dateStr}
                  onClick={() => setSelectedMonthFilter(month.dateStr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedMonthFilter === month.dateStr
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {month.label} — <span className="font-mono text-emerald-400">R$ {month.total.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Strict Chronological Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Data Chegada</th>
                  <th className="py-2.5 px-3">Nome do Produto</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-center">Quantidade Comprada</th>
                  <th className="py-2.5 px-3 text-right">Custo Unitário (R$)</th>
                  <th className="py-2.5 px-3 text-right">Total Nota (R$)</th>
                  <th className="py-2.5 px-3">Fornecedor / Nota Fiscal</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoiceProducts.map((item) => {
                  const total = item.totalValue || (item.currentQuantity * item.unitCost);

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-300 font-bold font-mono">
                        {item.arrivalDate ? formatDate(item.arrivalDate) : '11/06/2025'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{item.name}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{item.category}</td>
                      <td className="py-3 px-3 text-center font-extrabold text-white text-sm">
                        {item.currentQuantity} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">R$ {item.unitCost.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">R$ {total.toFixed(2)}</td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[200px]">
                        {item.supplier || 'ROSANA GALVÃO / DISTRIBUIDORA'}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2 py-1 bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-slate-950 rounded border border-amber-500/30 transition text-[11px] font-semibold"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="px-2 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded border border-rose-500/30 transition text-[11px] font-semibold"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS & INFLATION TRACKER */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Restock Expenditure Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    Histórico de Investimento por Mês (2025 - 2026)
                  </h3>
                  <p className="text-[11px] text-slate-400">Total investido em notas fiscais de limpeza por período</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis width={65} stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `R$ ${val}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Total Nota']}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {monthlyData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Inflation Tracker for Specific Items */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <LineChartIcon className="w-4 h-4 text-amber-400" />
                    Rastreador de Inflação de Preços por Item
                  </h3>
                  <p className="text-[11px] text-slate-400">Acompanhe variações de custo unitário ao longo do tempo</p>
                </div>

                <select
                  value={selectedProductInflation}
                  onChange={(e) => setSelectedProductInflation(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 max-w-[200px]"
                >
                  {uniqueProductNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {priceInflationCalc && (
                <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Preço Inicial (2025):</span>
                    <span className="font-mono font-bold text-white">R$ {priceInflationCalc.firstPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Preço Atual (2026):</span>
                    <span className="font-mono font-bold text-white">R$ {priceInflationCalc.lastPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Variação / Inflação:</span>
                    <span className={`font-mono font-extrabold flex items-center gap-1 ${
                      priceInflationCalc.percent > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {priceInflationCalc.percent > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {priceInflationCalc.percent > 0 ? `+${priceInflationCalc.percent}%` : `${priceInflationCalc.percent}%`}
                    </span>
                  </div>
                </div>
              )}

              <div className="h-44 w-full">
                {priceHistoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistoryData} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={10} />
                      <YAxis width={65} stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `R$ ${val}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                        formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Custo Unitário']}
                      />
                      <Line type="monotone" dataKey="unitCost" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-500">
                    Selecione um produto para visualizar o histórico de preço.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Curva ABC Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Curva ABC — Maiores Ofensores de Custo do Estoque de Limpeza
                </h3>
                <p className="text-xs text-slate-400">Ranking ordenado por investimento financeiro total acumulado</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 text-center">Posição</th>
                    <th className="py-2.5 px-3">Nome do Produto</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3 text-center">Volume Total Comprado</th>
                    <th className="py-2.5 px-3 text-right">Investimento Acumulado (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {abcCurveData.slice(0, 10).map((item, index) => {
                    const isTop1 = index === 0;

                    return (
                      <tr key={item.name} className={`hover:bg-slate-800/40 ${isTop1 ? 'bg-amber-500/5 font-semibold' : ''}`}>
                        <td className="py-3 px-3 text-center font-bold">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-extrabold ${
                            index === 0 ? 'bg-amber-500 text-slate-950' :
                            index === 1 ? 'bg-slate-400 text-slate-950' :
                            index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {index + 1}º
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">
                          {item.name}
                          {isTop1 && <span className="ml-2 text-[10px] text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">🔥 Maior Custo</span>}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{item.category}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-200">
                          {item.totalQty} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          R$ {item.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FORECAST & WHATSAPP ORDER GENERATOR */}
      {activeTab === 'FORECAST' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Previsão de Recompra & Autonomia de Estoque
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Estimativa inteligente de dias restantes de estoque com base nos níveis de consumo da academia.
              </p>
            </div>

            <button
              onClick={handleOpenOrderModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-2 transition"
            >
              <ShoppingCart className="w-4 h-4" />
              Gerar Pedido para Fornecedor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentStockList.map(item => {
              const isUrgent = item.currentQuantity <= item.minQuantity;

              return (
                <div key={item.name} className={`p-4 rounded-xl border transition shadow-sm ${
                  isUrgent ? 'bg-rose-950/20 border-rose-500/40' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.category}</p>
                    </div>
                    {isUrgent ? (
                      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> URGENTE
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        OK
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Estoque Atual:</span>
                      <span className="font-bold text-white font-mono">{item.currentQuantity} {item.unit}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Estoque Mínimo:</span>
                      <span className="font-bold text-slate-300 font-mono">{item.minQuantity} {item.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD/EDIT CLEANING PRODUCT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                {editingItem ? 'Editar Produto de Limpeza' : 'Cadastrar / Entrada de Produto'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Data de Chegada</label>
                  <input
                    type="date"
                    value={form.arrivalDate}
                    onChange={e => setForm({ ...form, arrivalDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Categoria / Tipo</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="DESINFETANTE">DESINFETANTE</option>
                    <option value="DETERGENTE">DETERGENTE</option>
                    <option value="PAPEL">PAPEL / HIGIÊNICO</option>
                    <option value="PANOS_FLANELAS">PANOS / FLANELAS</option>
                    <option value="SABONETE">SABONETE / ÁLCOOL</option>
                    <option value="OUTROS">OUTROS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  placeholder="Ex: Desinfetante Pinho 5 Litros"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Qtd Atual</label>
                  <input
                    type="number"
                    min="0"
                    value={form.currentQuantity}
                    onChange={e => setForm({ ...form, currentQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unidade</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LITROS">LITROS</option>
                    <option value="UNIDADES">UNIDADES</option>
                    <option value="CAIXAS">CAIXAS</option>
                    <option value="ROULOS">RÓULOS</option>
                    <option value="KG">KG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minQuantity}
                    onChange={e => setForm({ ...form, minQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Custo Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.unitCost}
                    onChange={e => setForm({ ...form, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fornecedor / Nota Fiscal</label>
                  <input
                    type="text"
                    placeholder="Ex: Rosana Galvão / NOTA 081.052"
                    value={form.supplier}
                    onChange={e => setForm({ ...form, supplier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={() => {
                      const itemInStock = currentStockList.find(c => c.rawItem.id === editingItem.id || c.name.toLowerCase() === editingItem.name.toLowerCase());
                      const ids = itemInStock ? itemInStock.allIds : [editingItem.id];
                      setShowModal(false);
                      handleDelete(ids, editingItem.name);
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir do Estoque
                  </button>
                ) : <div />}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
                  >
                    {editingItem ? 'Salvar Alterações' : 'Salvar Entrada'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WHATSAPP ORDER GENERATOR */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                Gerador de Pedido de Compra (WhatsApp)
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto md:overflow-hidden">
              {/* Product Selection Column */}
              <div className="space-y-3 overflow-y-auto pr-2">
                <span className="text-xs font-bold text-slate-300 block">Selecione os itens para solicitar cotação:</span>
                
                {currentStockList.map(item => {
                  const name = item.name;
                  const isChecked = !!orderItems[name]?.selected;
                  const currentQty = orderItems[name]?.qty || 2;

                  return (
                    <div key={name} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                      isChecked ? 'bg-indigo-950/30 border-indigo-500/50' : 'bg-slate-950 border-slate-800/80 opacity-70'
                    }`}>
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setOrderItems({
                              ...orderItems,
                              [name]: {
                                ...orderItems[name],
                                selected: e.target.checked,
                                qty: orderItems[name]?.qty || Math.max(item.minQuantity * 2, 2),
                                unit: item.unit
                              }
                            });
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate font-medium text-white text-xs">{name}</span>
                      </label>

                      {isChecked && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <input
                            type="number"
                            min="1"
                            value={currentQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setOrderItems({
                                ...orderItems,
                                [name]: { ...orderItems[name], qty: val }
                              });
                            }}
                            className="w-14 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-xs text-white font-mono"
                          />
                          <span className="text-[10px] text-slate-400">{item.unit}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Message Preview Column */}
              <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-hidden">
                <span className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5 flex-shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" /> Pré-visualização da Mensagem:
                </span>
                
                <textarea
                  readOnly
                  value={generatedOrderText}
                  className="flex-1 w-full p-3 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-slate-200 focus:outline-none resize-none leading-relaxed"
                />

                <div className="mt-3 flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  <button
                    onClick={handleCopyWhatsapp}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      copiedWhatsapp
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    {copiedWhatsapp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedWhatsapp ? 'Texto Copiado!' : 'Copiar Texto'}
                  </button>

                  <button
                    onClick={handleOpenWhatsappWeb}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-md transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Abrir no WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
