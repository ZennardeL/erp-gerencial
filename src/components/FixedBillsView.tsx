import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Layers,
  Zap,
  Receipt,
  ArrowUpRight,
  X,
  Building2,
  RefreshCw,
  Filter,
  Power
} from 'lucide-react';
import { FixedBill, BorderoBillType, BorderoWeekly, ColetivasSummary } from '../shared/types';
import { formatCurrency } from '../shared/formatters';

interface FixedBillsViewProps {
  fixedBills: FixedBill[];
  borderos: BorderoWeekly[];
  coletivasSummary?: ColetivasSummary | null;
  onAddFixedBill: (bill: Partial<FixedBill>) => Promise<void>;
  onUpdateFixedBill: (id: string, bill: Partial<FixedBill>) => Promise<void>;
  onDeleteFixedBill: (id: string) => Promise<void>;
  onLaunchToBordero: (borderoId: string, bill: FixedBill, customAmount?: number, customDueDate?: string) => Promise<void>;
  onNavigateTab: (tab: string) => void;
}

const EVO_COST_CENTERS = [
  'Ocupação / Aluguel',
  'Ocupação / IPTU',
  'Despesas com Pessoal / Salários',
  'Despesas com Pessoal / Coletivas',
  'Despesas com Pessoal / FGTS',
  'Despesas com Pessoal / INSS',
  'Despesas com Pessoal / Benefícios',
  'Energia Elétrica',
  'Água',
  'Internet',
  'Sistemas e Softwares',
  'Simples Nacional (DAS)',
  'Impostos e Taxas',
  'Contabilidade',
  'Propaganda e Marketing',
  'Royalties e Franquia',
  'Encargos Sociais e Sindicais',
  'SST / Medicina Ocupacional',
  'ECAD',
  'Materiais de Limpeza',
  'Manutenção dos equipamentos',
  'Prestação de Serviços',
  'Empréstimos Bancários',
  'Outras despesas não operacionais (CAPEX)',
  'Operacional Geral'
];

export const FixedBillsView: React.FC<FixedBillsViewProps> = ({
  fixedBills,
  borderos,
  coletivasSummary,
  onAddFixedBill,
  onUpdateFixedBill,
  onDeleteFixedBill,
  onLaunchToBordero,
  onNavigateTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [weekFilter, setWeekFilter] = useState<'ALL' | 'W1' | 'W2' | 'W3' | 'W4'>('ALL');
  const [costCenterFilter, setCostCenterFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');

  // Create / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<FixedBill | null>(null);
  const [form, setForm] = useState({
    recipient: '',
    description: '',
    evoCostCenter: 'Sistemas e Softwares',
    billType: 'SISTEMA_BOLETO' as BorderoBillType,
    dueDay: '10',
    defaultAmount: '',
    amountType: 'FIXO' as 'FIXO' | 'VARIAVEL',
    paymentMethod: 'BOLETO' as FixedBill['paymentMethod'],
    active: true,
    endDate: '',
    notes: ''
  });

  // Quick Launch to Borderô Modal
  const [launchingBill, setLaunchingBill] = useState<FixedBill | null>(null);
  const [selectedBorderoId, setSelectedBorderoId] = useState<string>(() => borderos[0]?.id || '');
  const [launchAmount, setLaunchAmount] = useState<string>('');
  const [launchDueDate, setLaunchDueDate] = useState<string>('');
  const [isLaunching, setIsLaunching] = useState(false);

  const activeBills = useMemo(() => fixedBills.filter(b => b.active), [fixedBills]);

  // KPIs
  const kpis = useMemo(() => {
    const totalActive = activeBills.reduce((acc, b) => acc + (Number(b.defaultAmount) || 0), 0);
    const capexAndLoans = activeBills
      .filter(b => b.billType === 'EMPRESTIMO' || b.evoCostCenter.includes('CAPEX') || b.evoCostCenter.includes('Empréstimos'))
      .reduce((acc, b) => acc + (Number(b.defaultAmount) || 0), 0);
    const opexTotal = totalActive - capexAndLoans;

    const fixedTypeBills = activeBills.filter(b => b.amountType === 'FIXO');
    const variableTypeBills = activeBills.filter(b => b.amountType === 'VARIAVEL');

    const w1 = activeBills.filter(b => b.dueDay >= 1 && b.dueDay <= 7).reduce((s, b) => s + b.defaultAmount, 0);
    const w2 = activeBills.filter(b => b.dueDay >= 8 && b.dueDay <= 15).reduce((s, b) => s + b.defaultAmount, 0);
    const w3 = activeBills.filter(b => b.dueDay >= 16 && b.dueDay <= 22).reduce((s, b) => s + b.defaultAmount, 0);
    const w4 = activeBills.filter(b => b.dueDay >= 23 && b.dueDay <= 31).reduce((s, b) => s + b.defaultAmount, 0);

    return {
      totalActive,
      opexTotal,
      capexAndLoans,
      fixedCount: fixedTypeBills.length,
      variableCount: variableTypeBills.length,
      w1,
      w2,
      w3,
      w4
    };
  }, [activeBills]);

  const uniqueCostCenters = useMemo(() => {
    const set = new Set<string>(EVO_COST_CENTERS);
    fixedBills.forEach(b => {
      if (b.evoCostCenter) set.add(b.evoCostCenter);
    });
    return Array.from(set);
  }, [fixedBills]);

  const filteredBills = useMemo(() => {
    return fixedBills.filter(b => {
      if (statusFilter === 'ACTIVE' && !b.active) return false;
      if (statusFilter === 'INACTIVE' && b.active) return false;

      if (weekFilter === 'W1' && (b.dueDay < 1 || b.dueDay > 7)) return false;
      if (weekFilter === 'W2' && (b.dueDay < 8 || b.dueDay > 15)) return false;
      if (weekFilter === 'W3' && (b.dueDay < 16 || b.dueDay > 22)) return false;
      if (weekFilter === 'W4' && (b.dueDay < 23 || b.dueDay > 31)) return false;

      if (costCenterFilter !== 'ALL' && b.evoCostCenter !== costCenterFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchRec = b.recipient.toLowerCase().includes(q);
        const matchDesc = (b.description || '').toLowerCase().includes(q);
        const matchCc = (b.evoCostCenter || '').toLowerCase().includes(q);
        const matchNotes = (b.notes || '').toLowerCase().includes(q);
        if (!matchRec && !matchDesc && !matchCc && !matchNotes) return false;
      }

      return true;
    });
  }, [fixedBills, statusFilter, weekFilter, costCenterFilter, searchTerm]);

  const handleOpenCreate = () => {
    setEditingBill(null);
    setForm({
      recipient: '',
      description: '',
      evoCostCenter: 'Sistemas e Softwares',
      billType: 'SISTEMA_BOLETO',
      dueDay: '10',
      defaultAmount: '',
      amountType: 'FIXO',
      paymentMethod: 'BOLETO',
      active: true,
      endDate: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (bill: FixedBill) => {
    setEditingBill(bill);
    setForm({
      recipient: bill.recipient,
      description: bill.description || '',
      evoCostCenter: bill.evoCostCenter || 'Operacional Geral',
      billType: bill.billType,
      dueDay: String(bill.dueDay),
      defaultAmount: String(bill.defaultAmount),
      amountType: bill.amountType,
      paymentMethod: bill.paymentMethod,
      active: bill.active,
      endDate: bill.endDate || '',
      notes: bill.notes || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipient.trim()) {
      alert('Informe o favorecido / fornecedor.');
      return;
    }
    const amountNum = parseFloat(String(form.defaultAmount).replace(',', '.')) || 0;
    const dueDayNum = Math.min(31, Math.max(1, parseInt(form.dueDay, 10) || 10));

    const payload: Partial<FixedBill> = {
      recipient: form.recipient.trim(),
      description: form.description.trim(),
      evoCostCenter: form.evoCostCenter,
      billType: form.billType,
      dueDay: dueDayNum,
      defaultAmount: amountNum,
      amountType: form.amountType,
      paymentMethod: form.paymentMethod,
      active: form.active,
      endDate: form.endDate ? form.endDate : null,
      notes: form.notes.trim()
    };

    if (editingBill) {
      await onUpdateFixedBill(editingBill.id, payload);
    } else {
      await onAddFixedBill(payload);
    }
    setShowModal(false);
  };

  const handleOpenQuickLaunch = (bill: FixedBill) => {
    const targetBordero = borderos.find(b => b.id === selectedBorderoId) || borderos[0];
    if (!targetBordero) {
      alert('Crie uma semana no Borderô Semanal primeiro para lançar contas.');
      return;
    }
    setSelectedBorderoId(targetBordero.id);

    // Calculate due date inside the target bordero's month/year
    const [yearStr, monthStr] = targetBordero.startDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const maxDayInMonth = new Date(year, month, 0).getDate();
    const safeDay = Math.min(bill.dueDay, maxDayInMonth);
    const computedDate = `${yearStr}-${monthStr}-${String(safeDay).padStart(2, '0')}`;

    // If this is Folha Aulas Coletivas and we have live Coletivas Summary, suggest live value!
    let suggestedAmount = bill.defaultAmount;
    if (
      coletivasSummary &&
      coletivasSummary.totalPayrollMonth > 0 &&
      bill.recipient.toLowerCase().includes('coletivas')
    ) {
      suggestedAmount = coletivasSummary.totalPayrollMonth;
    }

    setLaunchingBill(bill);
    setLaunchAmount(String(suggestedAmount));
    setLaunchDueDate(computedDate);
  };

  const handleConfirmQuickLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!launchingBill || !selectedBorderoId) return;
    setIsLaunching(true);
    try {
      const amountNum = parseFloat(launchAmount.replace(',', '.')) || launchingBill.defaultAmount;
      await onLaunchToBordero(selectedBorderoId, launchingBill, amountNum, launchDueDate);
      setLaunchingBill(null);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleSyncColetivasAmount = async () => {
    if (!coletivasSummary || coletivasSummary.totalPayrollMonth <= 0) return;
    const coletivasBill = fixedBills.find(
      b => b.id === 'fixed_folha_coletivas' || b.recipient.toLowerCase().includes('coletivas')
    );
    if (!coletivasBill) return;

    const details = coletivasSummary.teachersSummary
      .map(t => `${t.shortName}: ${t.classesCount} aulas (R$ ${t.totalAmount.toFixed(2)})`)
      .join(' | ');

    await onUpdateFixedBill(coletivasBill.id, {
      defaultAmount: coletivasSummary.totalPayrollMonth,
      notes: `Sincronizado com App Coletivas (${coletivasSummary.monthRef}): ${coletivasSummary.totalClassesMonth} aulas • ${details}`
    });
  };

  const todayDay = new Date().getDate();

  return (
    <div className="space-y-6">
      {/* 1. Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-md">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Cadastro de Contas Fixas & Recorrentes (Padrão EVO)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                Contas a Pagar EVO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mapa completo de todas as obrigações mensais da Panobianco Boituva com Centro de Custo EVO, dia fixo de vencimento e envio em 1 clique para o Borderô Semanal.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('borderos')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-orange-600/15 hover:bg-orange-600/25 text-orange-400 border border-orange-500/30 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            Abrir Borderô Semanal
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Conta Fixa
          </button>
        </div>
      </div>

      {/* 2. KPI Cards (Visão Mensal EVO + Integração Coletivas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Mensal Recorrente */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Mensal Previsto</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-white">{formatCurrency(kpis.totalActive)}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              <span className="text-emerald-400 font-semibold">Operação: {formatCurrency(kpis.opexTotal)}</span>
              <span className="mx-1">•</span>
              <span className="text-amber-400 font-semibold">CAPEX/Bancos: {formatCurrency(kpis.capexAndLoans)}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Contas Fixas vs Variáveis */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Obrigações Ativas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-white">
              {activeBills.length} <span className="text-xs font-normal text-slate-400">contas/mês</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              <span className="text-indigo-400 font-semibold">{kpis.fixedCount} Valor Fixo</span>
              <span className="mx-1.5">•</span>
              <span className="text-amber-400 font-semibold">{kpis.variableCount} Valor Variável</span>
            </p>
          </div>
        </div>

        {/* Card 3: Cronograma por Semana do Mês */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Concentração no Mês</span>
          <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px]">
            <div className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 flex justify-between">
              <span className="text-slate-400">01–07:</span>
              <span className="font-bold text-white">{formatCurrency(kpis.w1)}</span>
            </div>
            <div className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 flex justify-between">
              <span className="text-slate-400">08–15:</span>
              <span className="font-bold text-white">{formatCurrency(kpis.w2)}</span>
            </div>
            <div className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 flex justify-between">
              <span className="text-slate-400">16–22:</span>
              <span className="font-bold text-white">{formatCurrency(kpis.w3)}</span>
            </div>
            <div className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 flex justify-between">
              <span className="text-slate-400">23–31:</span>
              <span className="font-bold text-white">{formatCurrency(kpis.w4)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Integração Automática Folha Coletivas */}
        <div className="bg-gradient-to-br from-slate-900 to-orange-950/20 border border-orange-500/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Folha Coletivas (App)</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-300">
              TEMPO REAL
            </span>
          </div>
          <div className="mt-1.5">
            <p className="text-xl font-black text-white">
              {formatCurrency(coletivasSummary?.totalPayrollMonth || 0)}
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">
              {coletivasSummary?.totalClassesMonth || 0} aulas confirmadas no mês ({coletivasSummary?.totalStudentsMonth || 0} alunos)
            </p>
            {coletivasSummary && coletivasSummary.totalPayrollMonth > 0 && (
              <button
                onClick={handleSyncColetivasAmount}
                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Atualizar Conta Fixa Coletivas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por favorecido (ex: CPFL, Sabesp, EVO, Tegracon, Kikos, INSS)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Cost Center Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={costCenterFilter}
              onChange={(e) => setCostCenterFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Todos os Centros de Custo EVO</option>
              {uniqueCostCenters.map(cc => (
                <option key={cc} value={cc}>{cc}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ACTIVE">Somente Ativas ({activeBills.length})</option>
              <option value="INACTIVE">Encerradas / Inativas ({fixedBills.length - activeBills.length})</option>
              <option value="ALL">Todas ({fixedBills.length})</option>
            </select>
          </div>
        </div>

        {/* Week Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Filtrar Semana do Mês:</span>
          {[
            { id: 'ALL', label: '📅 Mês Inteiro (Dias 01 a 31)' },
            { id: 'W1', label: '1ª Semana (Dias 01 a 07)' },
            { id: 'W2', label: '2ª Semana (Dias 08 a 15)' },
            { id: 'W3', label: '3ª Semana (Dias 16 a 22)' },
            { id: 'W4', label: '4ª Semana (Dias 23 a 31)' }
          ].map(w => (
            <button
              key={w.id}
              onClick={() => setWeekFilter(w.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                weekFilter === w.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Table of Fixed Bills */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-300">
            Exibindo <span className="text-white">{filteredBills.length}</span> contas cadastradas • Soma do filtro:{' '}
            <span className="text-emerald-400 font-black">
              {formatCurrency(filteredBills.reduce((s, b) => s + (Number(b.defaultAmount) || 0), 0))}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Dica: Use o botão <strong>"⚡ Lançar no Borderô"</strong> ou importe várias de uma vez na aba <strong>Borderô Semanal</strong>.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Dia Venc.</th>
                <th className="py-3 px-4">Favorecido / Descrição</th>
                <th className="py-3 px-4">Centro de Custo (EVO)</th>
                <th className="py-3 px-4">Tipo / Pagamento</th>
                <th className="py-3 px-4 text-right">Valor Base / Médio</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredBills.map(bill => {
                const isDueSoon = bill.active && bill.dueDay >= todayDay && bill.dueDay <= todayDay + 4;
                return (
                  <tr
                    key={bill.id}
                    className={`transition ${
                      !bill.active
                        ? 'opacity-50 bg-slate-950/40'
                        : isDueSoon
                        ? 'bg-amber-500/5 hover:bg-amber-500/10'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Dia Vencimento */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs border ${
                          isDueSoon
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-950 text-indigo-300 border-slate-800'
                        }`}>
                          {String(bill.dueDay).padStart(2, '0')}
                        </span>
                        <div>
                          <span className="font-bold text-slate-200 block">Todo dia {String(bill.dueDay).padStart(2, '0')}</span>
                          {isDueSoon && (
                            <span className="text-[10px] font-bold text-amber-400">Vence em breve</span>
                          )}
                          {!bill.active && (
                            <span className="text-[10px] font-bold text-rose-400">Encerrada</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Favorecido & Descrição */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs sm:text-sm">{bill.recipient}</div>
                      {bill.description && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{bill.description}</div>
                      )}
                      {bill.notes && (
                        <div className="text-[10px] text-indigo-300/90 mt-1 italic">{bill.notes}</div>
                      )}
                      {bill.endDate && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          Término previsto: {bill.endDate.split('-').reverse().join('/')}
                        </span>
                      )}
                    </td>

                    {/* Centro de Custo EVO */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950 text-slate-200 border border-slate-800">
                        <Building2 className="w-3 h-3 text-indigo-400" />
                        {bill.evoCostCenter}
                      </span>
                    </td>

                    {/* Tipo / Forma de Pagamento */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          bill.amountType === 'FIXO'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {bill.amountType === 'FIXO' ? '📌 VALOR FIXO' : '📊 VALOR VARIÁVEL'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Pgto: {bill.paymentMethod.replace('_', ' ')}
                        </span>
                      </div>
                    </td>

                    {/* Valor */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="text-sm font-black font-mono text-white">
                        {formatCurrency(bill.defaultAmount)}
                      </span>
                      {bill.amountType === 'VARIAVEL' && (
                        <span className="block text-[10px] text-slate-500">média estimada</span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {bill.active && (
                          <button
                            onClick={() => handleOpenQuickLaunch(bill)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-600/15 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 text-[11px] font-bold transition cursor-pointer"
                            title="Lançar esta conta diretamente em uma semana do Borderô"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Lançar no Borderô</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(bill)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Editar Conta Fixa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onUpdateFixedBill(bill.id, { active: !bill.active })}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            bill.active
                              ? 'bg-slate-800 hover:bg-amber-600/20 text-slate-400 hover:text-amber-300'
                              : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white'
                          }`}
                          title={bill.active ? 'Marcar como Encerrada / Inativa' : 'Reativar Conta Fixa'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir a conta fixa "${bill.recipient}"?`)) {
                              onDeleteFixedBill(bill.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Excluir Conta Fixa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create / Edit Fixed Bill */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingBill ? 'Editar Conta Fixa (Padrão EVO)' : 'Nova Conta Fixa Recorrente (EVO)'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Favorecido / Fornecedor *</label>
                <input
                  type="text"
                  required
                  value={form.recipient}
                  onChange={e => setForm(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder="Ex: CPFL PAULISTA, SABESP, CONTABILIDADE TEGRACON..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Descrição / Finalidade</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Consumo de Energia Elétrica • 1º Relógio"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Centro de Custo no EVO *</label>
                  <select
                    value={form.evoCostCenter}
                    onChange={e => setForm(prev => ({ ...prev, evoCostCenter: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {uniqueCostCenters.map(cc => (
                      <option key={cc} value={cc}>{cc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Categoria no Borderô *</label>
                  <select
                    value={form.billType}
                    onChange={e => setForm(prev => ({ ...prev, billType: e.target.value as BorderoBillType }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="ALUGUEL_IMOVEL">Aluguel / Locação</option>
                    <option value="CONCESSIONARIA">Concessionária (Luz/Água/Net)</option>
                    <option value="SISTEMA_BOLETO">Sistema / Boleto / Serviços</option>
                    <option value="FOLHA_SALARIO">Folha / Salários / Benefícios</option>
                    <option value="GUIA_BOLETO">Imposto / Guia / Sindicato</option>
                    <option value="MARKETING">Marketing / Publicidade</option>
                    <option value="LIMPEZA_INSUMOS">Insumos de Limpeza</option>
                    <option value="MANUTENCAO">Manutenção</option>
                    <option value="BENEFICIOS_PARCERIA">Benefício / Parceria</option>
                    <option value="EMPRESTIMO">Empréstimo / Equipamentos (CAPEX)</option>
                    <option value="PIX">PIX</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Dia do Vencimento (1-31) *</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={form.dueDay}
                    onChange={e => setForm(prev => ({ ...prev, dueDay: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Valor Base / Médio (R$) *</label>
                  <input
                    type="text"
                    required
                    value={form.defaultAmount}
                    onChange={e => setForm(prev => ({ ...prev, defaultAmount: e.target.value }))}
                    placeholder="Ex: 1300.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tipo de Valor</label>
                  <select
                    value={form.amountType}
                    onChange={e => setForm(prev => ({ ...prev, amountType: e.target.value as 'FIXO' | 'VARIAVEL' }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="FIXO">Valor Fixo Exato</option>
                    <option value="VARIAVEL">Valor Variável / Estimado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Forma de Pagamento</label>
                  <select
                    value={form.paymentMethod}
                    onChange={e => setForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="PIX">PIX</option>
                    <option value="GUIA_BOLETO">Guia / DARF / DAS</option>
                    <option value="DEBITO_AUTOMATICO">Débito Automático</option>
                    <option value="TRANSFERENCIA_FOLHA">Transferência / Folha</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Data Fim (Se for parcelamento)</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Observações (UC, CNPJ, nº parcelas)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ex: UC 2.333.837.036-54 • Enviado pela contabilidade..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  {editingBill ? 'Salvar Alterações' : 'Cadastrar Conta Fixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Quick Launch Single Fixed Bill to Borderô */}
      {launchingBill && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Lançar Conta Fixa no Borderô Semanal</h3>
              </div>
              <button onClick={() => setLaunchingBill(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmQuickLaunch} className="space-y-3.5 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <p className="font-bold text-white text-sm">{launchingBill.recipient}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{launchingBill.evoCostCenter}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Selecionar Semana do Borderô *</label>
                <select
                  value={selectedBorderoId}
                  onChange={e => setSelectedBorderoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                >
                  {borderos.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.startDate.split('-').reverse().join('/')} a {b.endDate.split('-').reverse().join('/')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={launchDueDate}
                    onChange={e => setLaunchDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Valor da Fatura (R$) *</label>
                  <input
                    type="text"
                    required
                    value={launchAmount}
                    onChange={e => setLaunchAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setLaunchingBill(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLaunching}
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {isLaunching ? 'Lançando...' : 'Confirmar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
