import React, { useState, useMemo } from 'react';
import { 
  Wrench, PlusCircle, Building2, Dumbbell, ShieldCheck, AlertOctagon, 
  DollarSign, Calendar, Search, UserCheck, Settings2, Trash2, Filter, Layers
} from 'lucide-react';
import { MaintenanceRecord, MaintenanceSummary } from '../shared/types';
import { formatDate, formatCurrency } from '../shared/formatters';

interface MaintenanceTrackerViewProps {
  records: MaintenanceRecord[];
  summary: MaintenanceSummary | null;
  onAddRecord: (record: Partial<MaintenanceRecord>) => Promise<void>;
  onEditRecord: (record: Partial<MaintenanceRecord>) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
}

export const MaintenanceTrackerView: React.FC<MaintenanceTrackerViewProps> = ({
  records,
  summary,
  onAddRecord,
  onEditRecord,
  onDeleteRecord
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MaintenanceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');

  const [form, setForm] = useState({
    title: '',
    maintenanceType: 'EQUIPAMENTOS' as MaintenanceRecord['maintenanceType'],
    category: 'CORRETIVA' as MaintenanceRecord['category'],
    executionDate: new Date().toISOString().split('T')[0],
    executedBy: 'Técnico Especializado',
    materialCost: 0,
    laborCost: 0,
    notes: ''
  });

  // Unique month list with calculated totals
  const monthList = useMemo(() => {
    const map: { [key: string]: { dateKey: string; label: string; total: number; count: number } } = {};

    records.forEach(r => {
      const dateKey = r.executionDate ? r.executionDate.substring(0, 7) : (r.createdAt ? r.createdAt.substring(0, 7) : '2026-07');
      const [year, month] = dateKey.split('-');
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const monthIndex = parseInt(month, 10) - 1;
      const formattedMonth = `${monthNames[monthIndex] || month} / ${year}`;
      const cost = r.totalCost || ((parseFloat(String(r.materialCost)) || 0) + (parseFloat(String(r.laborCost)) || 0));

      if (!map[dateKey]) {
        map[dateKey] = {
          dateKey,
          label: formattedMonth,
          total: 0,
          count: 0
        };
      }
      map[dateKey].total += cost;
      map[dateKey].count += 1;
    });

    return Object.values(map).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [records]);

  // Dynamic KPI values based on selected month filter
  const currentKPIs = useMemo(() => {
    const filteredRecords = records.filter(r => {
      if (selectedMonthFilter === 'ALL') return true;
      const rMonth = r.executionDate ? r.executionDate.substring(0, 7) : (r.createdAt ? r.createdAt.substring(0, 7) : '');
      return rMonth === selectedMonthFilter;
    });

    let total = 0;
    let predial = 0;
    let equip = 0;
    let prev = 0;
    let corr = 0;

    filteredRecords.forEach(r => {
      const cost = r.totalCost || ((parseFloat(String(r.materialCost)) || 0) + (parseFloat(String(r.laborCost)) || 0));
      total += cost;
      if (r.maintenanceType === 'PREDIAL') predial += cost;
      if (r.maintenanceType === 'EQUIPAMENTOS') equip += cost;
      if (r.category === 'PREVENTIVA') prev += cost;
      if (r.category === 'CORRETIVA') corr += cost;
    });

    return { total, predial, equip, prev, corr, count: filteredRecords.length };
  }, [records, selectedMonthFilter]);

  // Filtered maintenance list for the table
  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.executedBy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || r.maintenanceType === filterType || r.category === filterType;
      const rMonth = r.executionDate ? r.executionDate.substring(0, 7) : (r.createdAt ? r.createdAt.substring(0, 7) : '');
      const matchesMonth = selectedMonthFilter === 'ALL' || rMonth === selectedMonthFilter;

      return matchesSearch && matchesType && matchesMonth;
    }).sort((a, b) => {
      const dateA = new Date(a.executionDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.executionDate || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [records, searchTerm, filterType, selectedMonthFilter]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      title: '',
      maintenanceType: 'EQUIPAMENTOS',
      category: 'CORRETIVA',
      executionDate: new Date().toISOString().split('T')[0],
      executedBy: 'Técnico Especializado',
      materialCost: 0,
      laborCost: 0,
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: MaintenanceRecord) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      maintenanceType: item.maintenanceType,
      category: item.category,
      executionDate: item.executionDate ? item.executionDate.split('T')[0] : new Date().toISOString().split('T')[0],
      executedBy: item.executedBy,
      materialCost: item.materialCost,
      laborCost: item.laborCost,
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;

    if (editingItem) {
      await onEditRecord({
        id: editingItem.id,
        ...form
      });
    } else {
      await onAddRecord(form);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o registro de manutenção "${title}"?`)) {
      await onDeleteRecord(id);
    }
  };

  // Label for active month filter
  const activeMonthLabel = useMemo(() => {
    if (selectedMonthFilter === 'ALL') return 'Todos os Períodos';
    const found = monthList.find(m => m.dateKey === selectedMonthFilter);
    return found ? found.label : selectedMonthFilter;
  }, [selectedMonthFilter, monthList]);

  return (
    <div className="space-y-6">
      {/* Month Filter Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              Selecione o Mês da Manutenção
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Filtre os custos mensais de equipamentos e estrutura predial
            </p>
          </div>
        </div>

        {/* Quick Month Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
          <button
            onClick={() => setSelectedMonthFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border whitespace-nowrap flex-shrink-0 ${
              selectedMonthFilter === 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            🗓️ Todos ({records.length})
          </button>

          {monthList.map(m => (
            <button
              key={m.dateKey}
              onClick={() => setSelectedMonthFilter(m.dateKey)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                selectedMonthFilter === m.dateKey
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>📅 {m.label}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-emerald-400 font-bold border border-slate-800">
                {formatCurrency(m.total)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Top Banner KPI Cards (Dynamic based on selected month) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Gasto no Mês */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
              Total Mês
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 flex-shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-lg sm:text-2xl font-extrabold text-white">
              {formatCurrency(currentKPIs.total)}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
              {currentKPIs.count} manutenção(ões)
            </p>
          </div>
        </div>

        {/* Manutenção Predial */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Predial</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-lg sm:text-2xl font-extrabold text-amber-400">
              {formatCurrency(currentKPIs.predial)}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Estrutura e elétrica</p>
          </div>
        </div>

        {/* Manutenção de Equipamentos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Máquinas</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
              <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-lg sm:text-2xl font-extrabold text-indigo-400">
              {formatCurrency(currentKPIs.equip)}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Esteiras e musculação</p>
          </div>
        </div>

        {/* Preventiva vs Corretiva */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Tipo</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold text-emerald-400 flex justify-between">
              <span>Prev:</span>
              <span className="font-mono">{formatCurrency(currentKPIs.prev)}</span>
            </p>
            <p className="text-[11px] sm:text-xs font-bold text-rose-400 flex justify-between">
              <span>Corr:</span>
              <span className="font-mono">{formatCurrency(currentKPIs.corr)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800 pb-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-indigo-400" />
              Gestão de Manutenções ({activeMonthLabel})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Histórico detalhado e custos com manutenção predial e reparos de equipamentos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar manutenção ou técnico..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="PREDIAL">🏠 Apenas Prediais</option>
              <option value="EQUIPAMENTOS">🏋️ Apenas Equipamentos</option>
              <option value="PREVENTIVA">🛡️ Apenas Preventivas</option>
              <option value="CORRETIVA">⚠️ Apenas Corretivas</option>
            </select>

            {/* Add Record Button */}
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              Cadastrar Manutenção
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Nenhuma manutenção cadastrada no período selecionado ({activeMonthLabel}).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Descrição da Manutenção</th>
                  <th className="py-2.5 px-3 text-center">Tipo</th>
                  <th className="py-2.5 px-3 text-center">Intervenção</th>
                  <th className="py-2.5 px-3">Quem Fez (Técnico)</th>
                  <th className="py-2.5 px-3 text-right">Material</th>
                  <th className="py-2.5 px-3 text-right">Mão de Obra</th>
                  <th className="py-2.5 px-3 text-right">Custo Total</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono text-slate-300 font-bold whitespace-nowrap">
                      {formatDate(item.executionDate || (item.createdAt ? item.createdAt.split('T')[0] : ''))}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{item.title}</div>
                      {item.notes && <div className="text-[10px] text-slate-400 mt-0.5">{item.notes}</div>}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {item.maintenanceType === 'PREDIAL' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Building2 className="w-3 h-3" />
                          PREDIAL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <Dumbbell className="w-3 h-3" />
                          EQUIPAMENTO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {item.category === 'PREVENTIVA' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          PREVENTIVA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertOctagon className="w-3 h-3" />
                          CORRETIVA
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        {item.executedBy}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                      {formatCurrency(item.materialCost)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                      {formatCurrency(item.laborCost)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-rose-400 text-sm whitespace-nowrap">
                      {formatCurrency(item.totalCost)}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 transition text-[11px] font-semibold"
                        title="Editar manutenção"
                      >
                        <Settings2 className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition text-[11px] font-semibold"
                        title="Excluir manutenção"
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

      {/* Modal Form for Adding/Editing Maintenance Record */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-400" />
                {editingItem ? 'Editar Registro de Manutenção' : 'Cadastrar Nova Manutenção'}
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Instalação</label>
                  <select
                    value={form.maintenanceType}
                    onChange={e => setForm({ ...form, maintenanceType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="EQUIPAMENTOS">🏋️ EQUIPAMENTOS / MÁQUINAS</option>
                    <option value="PREDIAL">🏠 PREDIAL / ESTRUTURA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Intervenção</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CORRETIVA">⚠️ CORRETIVA (Conserto / Reparo)</option>
                    <option value="PREVENTIVA">🛡️ PREVENTIVA (Revisão / Troca)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Título / Descrição da Manutenção</label>
                <input
                  type="text"
                  placeholder="Ex: Troca de Lona da Esteira 02 ou Reparo Vazamento Banheiro"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Data de Realização</label>
                  <input
                    type="date"
                    value={form.executionDate}
                    onChange={e => setForm({ ...form, executionDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quem Fez (Técnico / Prestador)</label>
                  <input
                    type="text"
                    placeholder="Ex: Técnico Carlos ou Eletricista João"
                    value={form.executedBy}
                    onChange={e => setForm({ ...form, executedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Custo de Material (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.materialCost}
                    onChange={e => setForm({ ...form, materialCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Custo de Mão de Obra (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.laborCost}
                    onChange={e => setForm({ ...form, laborCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Custo Total Calculado:</span>
                <span className="text-base font-extrabold text-rose-400 font-mono">
                  {formatCurrency((parseFloat(String(form.materialCost)) || 0) + (parseFloat(String(form.laborCost)) || 0))}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Observações (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Garantia de 90 dias nas peças trocadas."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
                >
                  {editingItem ? 'Salvar Alterações' : 'Salvar Manutenção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
