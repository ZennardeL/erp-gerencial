import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Plus, 
  Calendar, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Edit, 
  Trash2, 
  Copy, 
  Check, 
  X, 
  Search, 
  FileText, 
  Layers, 
  ChevronRight, 
  ChevronLeft,
  Barcode,
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import { BorderoWeekly, BorderoItem, BorderoBillType } from '../shared/types';
import { formatCurrency, formatDate } from '../shared/formatters';

interface BorderoViewProps {
  borderos: BorderoWeekly[];
  onAddBordero: (data: Partial<BorderoWeekly>) => Promise<void>;
  onUpdateBordero: (id: string, data: Partial<BorderoWeekly>) => Promise<void>;
  onDeleteBordero: (id: string) => Promise<void>;
  onAddItem: (borderoId: string, item: Partial<BorderoItem>) => Promise<void>;
  onUpdateItem: (itemId: string, item: Partial<BorderoItem>) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onToggleStatus: (itemId: string, nextStatus: 'PENDENTE' | 'PAGO') => Promise<void>;
}

export const BorderoView: React.FC<BorderoViewProps> = ({
  borderos,
  onAddBordero,
  onUpdateBordero,
  onDeleteBordero,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onToggleStatus
}) => {
  // Selected Bordero (defaults to most recent)
  const [selectedBorderoId, setSelectedBorderoId] = useState<string>(() => {
    return borderos.length > 0 ? borderos[0].id : '';
  });

  // If selectedBorderoId is empty but borderos exist, pick first
  const currentBordero = useMemo(() => {
    if (!selectedBorderoId && borderos.length > 0) {
      return borderos[0];
    }
    return borderos.find(b => b.id === selectedBorderoId) || borderos[0] || null;
  }, [borderos, selectedBorderoId]);

  // Modals state
  const [showNewBorderoModal, setShowNewBorderoModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BorderoItem | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Form State: New Bordero
  const [borderoForm, setBorderoForm] = useState({
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  // Form State: Item
  const [itemForm, setItemForm] = useState({
    recipient: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    amount: '',
    billType: 'SISTEMA_BOLETO' as BorderoBillType,
    barcode: '',
    notes: ''
  });

  // Linha digitável smart parser
  const [pasteBoletoInput, setPasteBoletoInput] = useState('');
  const handleParseBoleto = (rawInput: string) => {
    setPasteBoletoInput(rawInput);
    const clean = rawInput.replace(/[^\d]/g, '');
    
    // Título Bancário (47 dígitos)
    if (clean.length === 47) {
      // Valor nos últimos 10 dígitos (em centavos)
      const valStr = clean.substring(37);
      const valNum = parseInt(valStr, 10) / 100;
      if (valNum > 0) {
        setItemForm(prev => ({ ...prev, amount: valNum.toFixed(2), barcode: rawInput }));
      }
      // Fator de vencimento (posições 33 a 37 - 4 dígitos)
      const factor = parseInt(clean.substring(33, 37), 10);
      if (factor > 1000) {
        const baseDate = factor >= 1000 && factor < 3000 ? new Date(2025, 1, 22) : new Date(1997, 9, 7);
        const calcDate = new Date(baseDate.getTime() + (factor - 1000) * 24 * 60 * 60 * 1000);
        if (!isNaN(calcDate.getTime())) {
          setItemForm(prev => ({ ...prev, dueDate: calcDate.toISOString().split('T')[0] }));
        }
      }
    } 
    // Concessionária (48 dígitos)
    else if (clean.length === 48) {
      const valStr = clean.substring(4, 15);
      const valNum = parseInt(valStr, 10) / 100;
      if (valNum > 0) {
        setItemForm(prev => ({ ...prev, amount: valNum.toFixed(2), barcode: rawInput, billType: 'CONCESSIONARIA' }));
      }
    }
  };

  // Open Create Item Modal
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setItemForm({
      recipient: '',
      description: '',
      dueDate: currentBordero ? currentBordero.startDate : new Date().toISOString().split('T')[0],
      amount: '',
      billType: 'SISTEMA_BOLETO',
      barcode: '',
      notes: ''
    });
    setPasteBoletoInput('');
    setShowItemModal(true);
  };

  // Open Edit Item Modal
  const handleOpenEditItem = (item: BorderoItem) => {
    setEditingItem(item);
    setItemForm({
      recipient: item.recipient,
      description: item.description || '',
      dueDate: item.dueDate,
      amount: String(item.amount),
      billType: item.billType,
      barcode: item.barcode || '',
      notes: item.notes || ''
    });
    setPasteBoletoInput(item.barcode || '');
    setShowItemModal(true);
  };

  // Save Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBordero) return;
    if (!itemForm.recipient.trim()) {
      alert('Informe o favorecido / credor.');
      return;
    }
    const amountNum = parseFloat(itemForm.amount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Informe um valor válido em reais.');
      return;
    }

    if (editingItem) {
      await onUpdateItem(editingItem.id, {
        recipient: itemForm.recipient.trim(),
        description: itemForm.description.trim(),
        dueDate: itemForm.dueDate,
        amount: amountNum,
        billType: itemForm.billType,
        barcode: itemForm.barcode.trim(),
        notes: itemForm.notes.trim()
      });
    } else {
      await onAddItem(currentBordero.id, {
        recipient: itemForm.recipient.trim(),
        description: itemForm.description.trim(),
        dueDate: itemForm.dueDate,
        amount: amountNum,
        billType: itemForm.billType,
        barcode: itemForm.barcode.trim(),
        notes: itemForm.notes.trim()
      });
    }
    setShowItemModal(false);
  };

  // Save New Bordero
  const handleSaveBordero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borderoForm.startDate || !borderoForm.endDate) {
      alert('Informe o período da semana.');
      return;
    }
    const defaultTitle = `Borderô Semanal - ${formatDate(borderoForm.startDate)} a ${formatDate(borderoForm.endDate)}`;
    await onAddBordero({
      title: borderoForm.title.trim() || defaultTitle,
      startDate: borderoForm.startDate,
      endDate: borderoForm.endDate,
      notes: borderoForm.notes.trim()
    });
    setShowNewBorderoModal(false);
  };

  // Group items by Due Date
  const groupedItems = useMemo(() => {
    if (!currentBordero) return [];
    const map: Record<string, BorderoItem[]> = {};

    currentBordero.items.forEach(item => {
      const d = item.dueDate || 'Outros';
      if (!map[d]) map[d] = [];
      map[d].push(item);
    });

    const sortedDates = Object.keys(map).sort();

    return sortedDates.map(dateKey => {
      const items = map[dateKey];
      const subtotal = items.reduce((acc, i) => acc + i.amount, 0);
      const paidSubtotal = items.filter(i => i.status === 'PAGO').reduce((acc, i) => acc + i.amount, 0);

      let dayName = '';
      let isToday = false;
      if (dateKey !== 'Outros') {
        const parts = dateKey.split('-');
        if (parts.length === 3) {
          const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
          dayName = weekdays[dObj.getDay()];

          const now = new Date();
          isToday = now.getFullYear() === dObj.getFullYear() && 
                    now.getMonth() === dObj.getMonth() && 
                    now.getDate() === dObj.getDate();
        }
      }

      return {
        dateKey,
        dayName,
        isToday,
        subtotal,
        paidSubtotal,
        items
      };
    });
  }, [currentBordero]);

  // Overall KPIs for current bordero
  const kpis = useMemo(() => {
    if (!currentBordero || currentBordero.items.length === 0) {
      return { totalAmount: 0, totalPaid: 0, totalPending: 0, itemsCount: 0, paidCount: 0 };
    }
    const totalAmount = currentBordero.items.reduce((acc, i) => acc + i.amount, 0);
    const totalPaid = currentBordero.items.filter(i => i.status === 'PAGO').reduce((acc, i) => acc + i.amount, 0);
    const totalPending = totalAmount - totalPaid;
    const itemsCount = currentBordero.items.length;
    const paidCount = currentBordero.items.filter(i => i.status === 'PAGO').length;

    return { totalAmount, totalPaid, totalPending, itemsCount, paidCount };
  }, [currentBordero]);

  // Type badge helper
  const getBillTypeBadge = (type: BorderoBillType) => {
    switch (type) {
      case 'CONCESSIONARIA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">CONCESSIONÁRIA</span>;
      case 'SISTEMA_BOLETO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">SISTEMA / BOLETO</span>;
      case 'MARKETING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">MARKETING</span>;
      case 'GUIA_BOLETO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">GUIA / BOLETO</span>;
      case 'PIX':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PIX</span>;
      case 'FOLHA_SALARIO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">FOLHA / RH</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">OUTRO</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur border border-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 flex-shrink-0 shadow-md">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Borderô Semanal de Pagamentos</h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wide">
                Contas a Pagar
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              Controle de vencimentos semanais, cálculos diários e geração do relatório oficial Panobianco
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowPrintModal(true)}
            disabled={!currentBordero || currentBordero.items.length === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Visualizar e imprimir no modelo Panobianco A4"
          >
            <Printer className="w-4 h-4 text-orange-400" />
            Visualizar / Imprimir A4
          </button>

          <button
            onClick={handleOpenCreateItem}
            disabled={!currentBordero}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-orange-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Conta
          </button>
        </div>
      </div>

      {/* 2. Week Navigation & Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0" style={{ scrollbarWidth: 'none' }}>
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 flex-shrink-0">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Semana:
          </span>

          <select
            value={currentBordero?.id || ''}
            onChange={(e) => setSelectedBorderoId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
          >
            {borderos.map(b => (
              <option key={b.id} value={b.id}>
                {b.title} ({formatDate(b.startDate)} a {formatDate(b.endDate)})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowNewBorderoModal(true)}
            className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-semibold px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Semana
          </button>
        </div>

        {currentBordero && (
          <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-slate-400 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
            <span>Período: <strong className="text-slate-200">{formatDate(currentBordero.startDate)} até {formatDate(currentBordero.endDate)}</strong></span>
            <button
              onClick={() => {
                if (confirm(`Deseja excluir o "${currentBordero.title}" e todas as suas contas?`)) {
                  onDeleteBordero(currentBordero.id);
                }
              }}
              className="text-slate-500 hover:text-rose-400 transition p-1 cursor-pointer"
              title="Excluir Borderô da Semana"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. KPI Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total da Semana */}
        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Total Geral da Semana</p>
            <p className="text-lg sm:text-2xl font-bold text-white mt-1">{formatCurrency(kpis.totalAmount)}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">{kpis.itemsCount} contas no borderô</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Total Já Pago */}
        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Liquidado / Pago</p>
            <p className="text-lg sm:text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(kpis.totalPaid)}</p>
            <p className="text-[10px] sm:text-[11px] text-emerald-500/80 mt-0.5">{kpis.paidCount} de {kpis.itemsCount} pagas</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Saldo Pendente */}
        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">A Pagar (Pendente)</p>
            <p className="text-lg sm:text-2xl font-bold text-amber-400 mt-1">{formatCurrency(kpis.totalPending)}</p>
            <p className="text-[10px] sm:text-[11px] text-amber-500/80 mt-0.5">{kpis.itemsCount - kpis.paidCount} pendentes</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Status de Execução */}
        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Progresso de Quitação</p>
            <p className="text-lg sm:text-2xl font-bold text-indigo-400 mt-1">
              {kpis.totalAmount > 0 ? Math.round((kpis.totalPaid / kpis.totalAmount) * 100) : 0}%
            </p>
            <div className="w-24 sm:w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="bg-indigo-500 h-full transition-all duration-500"
                style={{ width: `${kpis.totalAmount > 0 ? (kpis.totalPaid / kpis.totalAmount) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* 4. Categorized Days & Accounts Table */}
      {!currentBordero || currentBordero.items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">Nenhuma conta cadastrada neste borderô</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Comece adicionando as faturas e boletos que vencem nesta semana (ex: CPFL, SABESP, Sistema EVO, etc.).
          </p>
          <button
            onClick={handleOpenCreateItem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl transition shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Primeira Conta
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedItems.map((group, gIdx) => (
            <div 
              key={group.dateKey}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
            >
              {/* Day Header Banner */}
              <div className={`p-3 sm:p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
                group.isToday 
                  ? 'bg-rose-500/10 border-rose-500/30' 
                  : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${
                    group.isToday ? 'bg-rose-500 animate-ping' : 'bg-orange-500'
                  }`} />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      {group.dayName} • {formatDate(group.dateKey)}
                      {group.isToday && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white uppercase">
                          Vencendo Hoje
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Subtotal do Dia</span>
                    <span className="text-sm sm:text-base font-mono font-bold text-white">
                      {formatCurrency(group.subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List (Card on Mobile, Table on Desktop) */}
              <div className="divide-y divide-slate-800/60">
                {group.items.map((item) => {
                  const isPaid = item.status === 'PAGO';
                  return (
                    <div 
                      key={item.id}
                      className={`p-3.5 sm:p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isPaid ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Left: Checkbox & Recipient Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Interactive Payment Checkbox */}
                        <button
                          type="button"
                          onClick={() => onToggleStatus(item.id, isPaid ? 'PENDENTE' : 'PAGO')}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition mt-0.5 cursor-pointer ${
                            isPaid 
                              ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20' 
                              : 'border-slate-700 hover:border-orange-500 bg-slate-950 text-transparent'
                          }`}
                          title={isPaid ? 'Marcar como Pendente' : 'Marcar como Pago / Visto'}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`text-sm font-bold truncate ${isPaid ? 'line-through text-slate-400' : 'text-white'}`}>
                              {item.recipient}
                            </h4>
                            {getBillTypeBadge(item.billType)}
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                PAGO
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                          )}

                          {/* Barcode / Linha digitável copy */}
                          {item.barcode && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[280px] sm:max-w-md">
                                {item.barcode}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopy(item.barcode!, `barcode-${item.id}`, e)}
                                className={`p-1 rounded transition text-xs flex items-center gap-1 cursor-pointer ${
                                  copiedKey === `barcode-${item.id}`
                                    ? 'text-emerald-400 bg-emerald-500/10'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                                title="Copiar código de barras"
                              >
                                {copiedKey === `barcode-${item.id}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-[10px] text-emerald-400">Copiado</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span className="text-[10px]">Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] text-slate-500 uppercase block font-medium">Valor</span>
                          <span className={`text-base font-mono font-bold ${
                            isPaid ? 'text-slate-400' : 'text-white'
                          }`}>
                            {formatCurrency(item.amount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditItem(item)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Editar Conta"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir o título "${item.recipient}"?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Excluir Conta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. CREATE / EDIT ITEM MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-400" />
                {editingItem ? 'Editar Conta do Borderô' : 'Adicionar Nova Conta ao Borderô'}
              </h3>
              <button 
                onClick={() => setShowItemModal(false)}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-4 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Smart Boleto Reader Box */}
              {!editingItem && (
                <div className="bg-orange-500/5 border border-orange-500/20 p-3 rounded-xl space-y-1.5">
                  <label className="text-xs font-semibold text-orange-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    Leitor Inteligente de Linha Digitável / Boleto
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Cole a linha digitável do boleto para preencher automaticamente o valor e o vencimento:
                  </p>
                  <input
                    type="text"
                    placeholder="Cole aqui a linha digitável (47 ou 48 dígitos)..."
                    value={pasteBoletoInput}
                    onChange={(e) => handleParseBoleto(e.target.value)}
                    className="w-full bg-slate-950 border border-orange-500/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              )}

              {/* Favorecido / Beneficiário */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Favorecido / Fornecedor *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CPFL PAULISTA, SABESP, PJBANK (EVO)..."
                  value={itemForm.recipient}
                  onChange={(e) => setItemForm({ ...itemForm, recipient: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Descrição / Categoria */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição / Categoria Operacional</label>
                <input
                  type="text"
                  placeholder="Ex: Consumo de Energia Elétrica • Alta Tensão / Demanda"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Due Date & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={itemForm.dueDate}
                    onChange={(e) => setItemForm({ ...itemForm, dueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$) *</label>
                  <input
                    type="text"
                    required
                    placeholder="0.00"
                    value={itemForm.amount}
                    onChange={(e) => setItemForm({ ...itemForm, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* Tipo de Conta */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Título / Documento</label>
                <select
                  value={itemForm.billType}
                  onChange={(e) => setItemForm({ ...itemForm, billType: e.target.value as BorderoBillType })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="CONCESSIONARIA">Concessionária de Água / Energia / Gás</option>
                  <option value="SISTEMA_BOLETO">Sistema / Software / Boleto Bancário</option>
                  <option value="MARKETING">Marketing / Anúncios Google / Tráfego Pago</option>
                  <option value="GUIA_BOLETO">Guia de Imposto / Taxa / Direitos Autorais (ECAD)</option>
                  <option value="PIX">Pagamento via PIX</option>
                  <option value="FOLHA_SALARIO">Folha de Pagamento / Salários</option>
                  <option value="OUTRO">Outro Tipo</option>
                </select>
              </div>

              {/* Código de barras / Linha Digitável */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-orange-400" />
                  Código de Barras / Linha Digitável (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 836300000248... para pagar com 1 clique"
                  value={itemForm.barcode}
                  onChange={(e) => setItemForm({ ...itemForm, barcode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-orange-600/20 cursor-pointer"
                >
                  {editingItem ? 'Salvar Alterações' : 'Adicionar ao Borderô'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CREATE NEW BORDERO MODAL */}
      {showNewBorderoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-400" />
                Novo Borderô Semanal
              </h3>
              <button 
                onClick={() => setShowNewBorderoModal(false)}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBordero} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título do Borderô (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Borderô Semanal - 21/09 a 27/09/2026"
                  value={borderoForm.title}
                  onChange={(e) => setBorderoForm({ ...borderoForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Início da Semana</label>
                  <input
                    type="date"
                    required
                    value={borderoForm.startDate}
                    onChange={(e) => setBorderoForm({ ...borderoForm, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fim da Semana</label>
                  <input
                    type="date"
                    required
                    value={borderoForm.endDate}
                    onChange={(e) => setBorderoForm({ ...borderoForm, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações / Notas</label>
                <textarea
                  rows={2}
                  placeholder="Notas gerais sobre a semana de pagamentos..."
                  value={borderoForm.notes}
                  onChange={(e) => setBorderoForm({ ...borderoForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewBorderoModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-orange-600/20 cursor-pointer"
                >
                  Criar Borderô
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. OFFICIAL PANOBIANCO PRINT & A4 PREVIEW MODAL */}
      {showPrintModal && currentBordero && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden shadow-2xl print:max-w-none print:max-h-none print:border-none print:shadow-none print:bg-white">
            {/* Modal Actions Header (Hidden in Print) */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/60 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">Visualização Oficial Panobianco (Pronto para Imprimir A4)</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-orange-600/30 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-slate-400 hover:text-white transition p-1.5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Document Printable Sheet */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950/40 print:p-0 print:bg-white print:overflow-visible">
              <div 
                id="panobianco-official-bordero"
                className="panobianco-a4-sheet bg-white text-slate-900 mx-auto rounded-xl p-5 sm:p-6 shadow-2xl max-w-[840px] border border-slate-200 print:shadow-none print:border-none print:rounded-none print:p-0 print:max-w-none"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              >
                {/* 1. Header Oficial */}
                <div className="flex justify-between items-start border-b-2 border-orange-600 pb-2.5 mb-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-orange-600 leading-none">
                      PANOBIANCO <span className="text-slate-900">ACADEMIAS</span>
                    </h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                      CONTROLE FINANCEIRO • BORDERÔ SEMANAL DE PAGAMENTOS
                    </p>
                  </div>
                  <div className="text-right bg-slate-100 border border-slate-300 rounded px-2.5 py-1">
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Semana de Referência</span>
                    <span className="text-xs font-black text-slate-900">
                      {formatDate(currentBordero.startDate)} a {formatDate(currentBordero.endDate)}
                    </span>
                  </div>
                </div>

                {/* 2. Top KPI Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5">
                  {groupedItems.slice(0, 3).map((g, idx) => (
                    <div 
                      key={g.dateKey}
                      className={`p-2 rounded border-l-4 shadow-sm ${
                        idx === 0 
                          ? 'border-l-rose-500 bg-rose-50' 
                          : idx === 1 
                          ? 'border-l-amber-500 bg-amber-50' 
                          : 'border-l-blue-500 bg-blue-50'
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase text-slate-600 block truncate">
                        {g.dayName} ({formatDate(g.dateKey).substring(0, 5)})
                      </span>
                      <p className="text-sm font-black text-slate-900 mt-0.5">{formatCurrency(g.subtotal)}</p>
                      <span className="text-[8.5px] text-slate-500 block truncate">{g.items.map(i => i.recipient).join(' + ')}</span>
                    </div>
                  ))}

                  {/* Total Geral KPI */}
                  <div className="p-2 rounded border-l-4 border-l-emerald-600 bg-emerald-50 shadow-sm">
                    <span className="text-[9px] font-bold uppercase text-emerald-800 block">TOTAL GERAL</span>
                    <p className="text-sm font-black text-emerald-900 mt-0.5">{formatCurrency(kpis.totalAmount)}</p>
                    <span className="text-[8.5px] text-emerald-700 block">{kpis.itemsCount} obrigações</span>
                  </div>
                </div>

                {/* 3. Categorized Days Tables */}
                <div className="space-y-3">
                  {groupedItems.map((group, idx) => (
                    <div key={group.dateKey} className="border border-slate-200 rounded overflow-hidden">
                      {/* Section Header */}
                      <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-900">
                          {idx + 1}. VENCIMENTOS DO DIA {formatDate(group.dateKey).toUpperCase()} ({group.dayName.toUpperCase()})
                        </span>
                        <span className="font-black text-slate-900 text-[11px]">
                          SUBTOTAL: {formatCurrency(group.subtotal)}
                        </span>
                      </div>

                      {/* Items Table */}
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-[9px] uppercase border-b border-slate-200">
                            <th className="py-1 px-2.5 w-12 text-center">Visto</th>
                            <th className="py-1 px-2.5">Favorecido / Beneficiário</th>
                            <th className="py-1 px-2.5">Descrição / Categoria</th>
                            <th className="py-1 px-2.5 text-center">Vencimento</th>
                            <th className="py-1 px-2.5 text-center">Tipo</th>
                            <th className="py-1 px-2.5 text-right">Valor (R$)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-[11px]">
                          {group.items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="py-1.5 px-2.5 text-center">
                                <div className="w-3.5 h-3.5 border border-slate-400 rounded inline-block">
                                  {item.status === 'PAGO' && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                                </div>
                              </td>
                              <td className="py-1.5 px-2.5 font-bold text-slate-900">{item.recipient}</td>
                              <td className="py-1.5 px-2.5 text-slate-600 text-[10px]">{item.description || '—'}</td>
                              <td className="py-1.5 px-2.5 text-center text-slate-700 font-mono text-[10px]">
                                {formatDate(item.dueDate)}
                              </td>
                              <td className="py-1.5 px-2.5 text-center">
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                                  {item.billType}
                                </span>
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-black font-mono text-slate-900">
                                {formatCurrency(item.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>

                {/* 4. Grand Total Banner */}
                <div className="mt-3.5 border-2 border-orange-500 rounded p-2.5 bg-orange-50/50 flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-slate-900">
                    💰 TOTAL GERAL DO BORDERÔ ({formatDate(currentBordero.startDate)} A {formatDate(currentBordero.endDate)}):
                  </span>
                  <span className="text-lg font-black font-mono text-orange-600">
                    {formatCurrency(kpis.totalAmount)}
                  </span>
                </div>

                {/* 5. Financial Notes Footer */}
                <div className="mt-3 text-[9px] text-slate-500 border-t border-slate-200 pt-2 space-y-1">
                  <p className="font-bold text-slate-700 uppercase">Orientações e Observações Financeiras da Semana:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Controle e liquidação através do portal bancário / aplicativo com visto manual ou digital.</li>
                    {currentBordero.notes && <li>{currentBordero.notes}</li>}
                    <li>Relatório gerado automaticamente pelo ERP Recepção Panobianco Boituva.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Print Media */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #panobianco-official-bordero, #panobianco-official-bordero * {
            visibility: visible;
          }
          #panobianco-official-bordero {
            position: fixed;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 5mm 6mm !important;
            border: none !important;
            box-shadow: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 5mm 6mm;
          }
        }
      `}</style>
    </div>
  );
};
