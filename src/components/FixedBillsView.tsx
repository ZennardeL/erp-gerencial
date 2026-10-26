import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Calendar as CalendarIcon,
  ListFilter,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  Zap,
  Receipt,
  ArrowUpRight,
  X,
  Building2,
  RefreshCw,
  Filter,
  Power,
  ChevronLeft,
  ChevronRight,
  MousePointerClick
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
  'Aluguel',
  'Salários',
  'KIKOS',
  'Anilhas Nacional',
  'Empréstimo Banco Votorantim',
  'Empréstimo Banco Alfa',
  'CPFL 4003724058',
  'CPFL 4004141934',
  'Água',
  'Internet',
  'Sistemas e Softwares',
  'Contabilidade',
  'Simples Nacional (DAS)',
  'FGTS',
  'INSS',
  'IPTU',
  'Vale Refeição',
  'Vale Transporte',
  'Materiais de Limpeza',
  'Manutenção dos equipamentos',
  'Equipamentos',
  'Propaganda e Marketing',
  'Sindicato',
  'Medicina Ocupacional',
  'Seguros',
  'ECAD',
  'Gastos Extras'
];

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAY_FULL_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
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
  // Default view mode is 'CALENDAR' so the Patrão immediately sees the visual interactive calendar
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'LIST'>('CALENDAR');

  // Calendar Month/Year & Selected Day State
  const now = new Date();
  const [calendarYear, setCalendarYear] = useState<number>(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(now.getMonth()); // 0-indexed (9 = Outubro)
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = now.getDate();
    const dueDays = [1, 5, 6, 10, 11, 13, 14, 15, 16, 20, 21, 23, 30];
    const nextOrToday = dueDays.find(d => d >= today);
    return nextOrToday || 5;
  });
  const [day6SubFilter, setDay6SubFilter] = useState<'ALL' | 'SALARIOS' | 'COLETIVAS' | 'OUTROS'>('ALL');

  // Table Filters
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

  // Group active bills by dueDay (1..31)
  const billsByDay = useMemo(() => {
    const map: Record<number, FixedBill[]> = {};
    for (let d = 1; d <= 31; d++) {
      map[d] = [];
    }
    activeBills.forEach(bill => {
      const d = Math.min(31, Math.max(1, Number(bill.dueDay) || 1));
      if (!map[d]) map[d] = [];
      map[d].push(bill);
    });
    return map;
  }, [activeBills]);

  // Days that have at least 1 active bill
  const daysWithBills = useMemo(() => {
    const daysInCurrentMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    return Object.keys(billsByDay)
      .map(Number)
      .filter(d => d <= daysInCurrentMonth && (billsByDay[d]?.length || 0) > 0)
      .sort((a, b) => a - b);
  }, [billsByDay, calendarYear, calendarMonth]);

  // Check if a FixedBill is already launched in Borderô for the selected calendarMonth & calendarYear
  const getBorderoStatusForBill = (bill: FixedBill, day: number): { status: 'PAGO' | 'PENDENTE' | 'NAO_LANCADO'; borderoTitle?: string; paidAmount?: number } => {
    const monthPrefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`;
    const targetDate = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    const normRecipient = bill.recipient.toLowerCase().trim();

    for (const b of borderos) {
      for (const item of b.items || []) {
        if (!item.dueDate.startsWith(monthPrefix)) continue;
        const itemRec = (item.recipient || '').toLowerCase().trim();
        const itemDesc = (item.description || '').toLowerCase().trim();

        const isSameBill =
          itemRec === normRecipient ||
          itemRec.includes(normRecipient) ||
          normRecipient.includes(itemRec) ||
          (normRecipient.includes('kikos') && itemRec.includes('kikos')) ||
          (normRecipient.includes('tegracon') && itemRec.includes('tegracon')) ||
          (normRecipient.includes('anilhas') && itemRec.includes('anilhas')) ||
          (normRecipient.includes('sabesp') && itemRec.includes('sabesp')) ||
          (normRecipient.includes('água') && itemRec.includes('sabesp')) ||
          (normRecipient.includes('ponto eletrônico') && itemRec.includes('vr')) ||
          (item.dueDate === targetDate && Math.abs((Number(item.amount) || 0) - (Number(bill.defaultAmount) || 0)) < 0.05);

        if (isSameBill) {
          return {
            status: item.status === 'PAGO' ? 'PAGO' : 'PENDENTE',
            borderoTitle: b.title,
            paidAmount: Number(item.amount) || bill.defaultAmount
          };
        }
      }
    }
    return { status: 'NAO_LANCADO' };
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalActive = activeBills.reduce((acc, b) => acc + (Number(b.defaultAmount) || 0), 0);
    const capexAndLoans = activeBills
      .filter(
        b =>
          b.billType === 'EMPRESTIMO' ||
          b.evoCostCenter.includes('KIKOS') ||
          b.evoCostCenter.includes('Anilhas') ||
          b.evoCostCenter.includes('Empréstimo')
      )
      .reduce((acc, b) => acc + (Number(b.defaultAmount) || 0), 0);
    const opexTotal = totalActive - capexAndLoans;

    const fixedTypeBills = activeBills.filter(b => b.amountType === 'FIXO');
    const variableTypeBills = activeBills.filter(b => b.amountType === 'VARIAVEL');

    const w1 = activeBills.filter(b => b.dueDay >= 1 && b.dueDay <= 7).reduce((s, b) => s + (Number(b.defaultAmount) || 0), 0);
    const w2 = activeBills.filter(b => b.dueDay >= 8 && b.dueDay <= 15).reduce((s, b) => s + (Number(b.defaultAmount) || 0), 0);
    const w3 = activeBills.filter(b => b.dueDay >= 16 && b.dueDay <= 22).reduce((s, b) => s + (Number(b.defaultAmount) || 0), 0);
    const w4 = activeBills.filter(b => b.dueDay >= 23 && b.dueDay <= 31).reduce((s, b) => s + (Number(b.defaultAmount) || 0), 0);

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

  // Calendar Grid Computation
  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; bills: FixedBill[]; totalAmount: number }> = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ day: null, bills: [], totalAmount: 0 });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayBills = billsByDay[d] || [];
      const totalAmount = dayBills.reduce((acc, b) => acc + (Number(b.defaultAmount) || 0), 0);
      cells.push({ day: d, bills: dayBills, totalAmount });
    }

    return cells;
  }, [calendarYear, calendarMonth, billsByDay]);

  const selectedDayBills = useMemo(() => {
    const list = billsByDay[selectedDay] || [];
    if (selectedDay !== 6 || day6SubFilter === 'ALL') return list;

    return list.filter(b => {
      const recUp = b.recipient.toUpperCase();
      const isColetiva = recUp.includes('AULAS COLETIVAS');
      const isSalarioOrEstagio = recUp.includes('SALÁRIO') || recUp.includes('BOLSA ESTÁGIO');
      if (day6SubFilter === 'COLETIVAS') return isColetiva;
      if (day6SubFilter === 'SALARIOS') return isSalarioOrEstagio;
      return !isColetiva && !isSalarioOrEstagio;
    });
  }, [billsByDay, selectedDay, day6SubFilter]);

  const selectedDayAllBills = useMemo(() => billsByDay[selectedDay] || [], [billsByDay, selectedDay]);
  const selectedDayTotal = useMemo(
    () => selectedDayBills.reduce((acc, b) => acc + (Number(b.defaultAmount) || 0), 0),
    [selectedDayBills]
  );

  const selectedDateWeekday = useMemo(() => {
    const dt = new Date(calendarYear, calendarMonth, selectedDay);
    return WEEKDAY_FULL_NAMES[dt.getDay()] || '';
  }, [calendarYear, calendarMonth, selectedDay]);

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonth(m => m + 1);
    }
  };

  const handleJumpPrevDueDay = () => {
    if (daysWithBills.length === 0) return;
    const prevDays = daysWithBills.filter(d => d < selectedDay);
    if (prevDays.length > 0) {
      setSelectedDay(prevDays[prevDays.length - 1]);
    } else {
      setSelectedDay(daysWithBills[daysWithBills.length - 1]);
    }
  };

  const handleJumpNextDueDay = () => {
    if (daysWithBills.length === 0) return;
    const nextDays = daysWithBills.filter(d => d > selectedDay);
    if (nextDays.length > 0) {
      setSelectedDay(nextDays[0]);
    } else {
      setSelectedDay(daysWithBills[0]);
    }
  };

  const handleOpenCreate = (defaultDay?: number) => {
    setEditingBill(null);
    setForm({
      recipient: '',
      description: '',
      evoCostCenter: 'Sistemas e Softwares',
      billType: 'SISTEMA_BOLETO',
      dueDay: String(defaultDay || selectedDay || 10),
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
      evoCostCenter: bill.evoCostCenter || 'Sistemas e Softwares',
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

    const maxDayInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const safeDay = Math.min(bill.dueDay, maxDayInMonth);
    const computedDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;

    setLaunchingBill(bill);
    setLaunchAmount(String(bill.defaultAmount));
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

  const todayDay = now.getDate();
  const isCurrentMonthYear = calendarYear === now.getFullYear() && calendarMonth === now.getMonth();

  return (
    <div className="space-y-6">
      {/* 1. Top Header with Easy View Switcher for the Patrão */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-md">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Calendário de Contas & Despesas Fixas (EVO)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                Visão Simplificada do Patrão
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Clique em qualquer dia do calendário abaixo para ver exatamente quais contas vencem naquele dia e seus respectivos valores.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Big Toggle: Calendário Visual vs Lista Completa */}
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('CALENDAR')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'CALENDAR'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              📅 Calendário Interativo
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              📋 Lista Completa ({activeBills.length})
            </button>
          </div>

          <button
            onClick={() => onNavigateTab('borderos')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-orange-600/15 hover:bg-orange-600/25 text-orange-400 border border-orange-500/30 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            Borderô Semanal
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleOpenCreate(selectedDay)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Conta Fixa
          </button>
        </div>
      </div>

      {/* 2. KPI Cards (Visão Geral Mensal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Mensal das Contas</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-white">{formatCurrency(kpis.totalActive)}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              <span className="text-emerald-400 font-semibold">Operação: {formatCurrency(kpis.opexTotal)}</span>
              <span className="mx-1">•</span>
              <span className="text-amber-400 font-semibold">Equip./Bancos: {formatCurrency(kpis.capexAndLoans)}</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contas Ativas no Mês</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-white">
              {activeBills.length} <span className="text-xs font-normal text-slate-400">lançamentos</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Distribuídos em <strong className="text-white">{daysWithBills.length} dias</strong> de pagamento no mês
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total por Semana do Mês</span>
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

        <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              Dia Selecionado: Dia {String(selectedDay).padStart(2, '0')}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
              {selectedDayAllBills.length} {selectedDayAllBills.length === 1 ? 'conta' : 'contas'}
            </span>
          </div>
          <div className="mt-1.5">
            <p className="text-xl sm:text-2xl font-black text-white">
              {formatCurrency(selectedDayAllBills.reduce((s, b) => s + (Number(b.defaultAmount) || 0), 0))}
            </p>
            <p className="text-[11px] text-indigo-200/80 mt-1">
              {selectedDateWeekday} • Clique em outro dia para alternar
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODO 1: CALENDÁRIO INTERATIVO DO PATRÃO (GRANDE, VISUAL E INTUITIVO)  */}
      {/* ===================================================================== */}
      {viewMode === 'CALENDAR' && (
        <div className="space-y-5">
          {/* Quick Bar: Atalhos Diretos para os Dias que Têm Conta no Mês */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-indigo-400" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  Atalho Rápido — Dias com Contas para Pagar no Mês (Clique no dia desejado):
                </span>
              </div>
              <span className="hidden sm:inline text-[11px] text-slate-400">
                {daysWithBills.length} dias com vencimento
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
              {daysWithBills.map(day => {
                const bills = billsByDay[day] || [];
                const sum = bills.reduce((acc, b) => acc + (Number(b.defaultAmount) || 0), 0);
                const isSelected = selectedDay === day;
                const isToday = isCurrentMonthYear && day === todayDay;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setSelectedDay(day);
                      setDay6SubFilter('ALL');
                    }}
                    className={`flex flex-col items-start px-3.5 py-2 rounded-xl border transition flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-[1.03]'
                        : isToday
                        ? 'bg-amber-500/15 text-amber-200 border-amber-500/40 hover:bg-amber-500/25'
                        : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full justify-between">
                      <span className="text-xs font-black tracking-tight">
                        DIA {String(day).padStart(2, '0')}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-500/15 text-indigo-300'
                        }`}
                      >
                        {bills.length} {bills.length === 1 ? 'conta' : 'contas'}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold mt-1 ${
                        isSelected ? 'text-white' : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(sum)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Interactive Calendar Grid + Selected Day Details Panel */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* LEFT/CENTER: Big Monthly Calendar Grid (7 columns) */}
            <div className="xl:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              {/* Calendar Header (Month/Year Navigation) */}
              <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 transition cursor-pointer"
                    title="Mês Anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-center min-w-[170px]">
                    <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                      {MONTH_NAMES[calendarMonth]} {calendarYear}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Clique em um dia para abrir as contas
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 transition cursor-pointer"
                    title="Próximo Mês"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarYear(now.getFullYear());
                      setCalendarMonth(now.getMonth());
                      setSelectedDay(now.getDate());
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
                  >
                    Ir para Hoje (Dia {String(todayDay).padStart(2, '0')})
                  </button>
                </div>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 bg-slate-950/50 border-b border-slate-800 text-center">
                {WEEKDAY_NAMES.map(dayName => (
                  <div
                    key={dayName}
                    className="py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-400"
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 p-2.5 sm:p-4 bg-slate-900">
                {calendarCells.map((cell, idx) => {
                  if (cell.day === null) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-[82px] sm:min-h-[104px] rounded-xl bg-slate-950/20 border border-slate-800/30"
                      />
                    );
                  }

                  const hasBills = cell.bills.length > 0;
                  const isSelected = selectedDay === cell.day;
                  const isToday = isCurrentMonthYear && cell.day === todayDay;

                  // Determine if all bills on this day are paid in Borderô for this month
                  const statuses = cell.bills.map(b => getBorderoStatusForBill(b, cell.day!).status);
                  const allPaid = hasBills && statuses.every(s => s === 'PAGO');

                  return (
                    <button
                      key={`day-${cell.day}`}
                      type="button"
                      onClick={() => {
                        setSelectedDay(cell.day!);
                        setDay6SubFilter('ALL');
                      }}
                      className={`min-h-[82px] sm:min-h-[104px] p-2 rounded-xl border text-left flex flex-col justify-between transition relative cursor-pointer group ${
                        isSelected
                          ? 'bg-indigo-600/25 border-indigo-400 ring-2 ring-indigo-500/70 shadow-lg shadow-indigo-500/20'
                          : hasBills
                          ? allPaid
                            ? 'bg-emerald-950/30 border-emerald-500/40 hover:bg-emerald-950/50 hover:border-emerald-400'
                            : 'bg-slate-950 border-slate-700 hover:border-indigo-400 hover:bg-slate-800/80 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-900 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {/* Top Row: Day Number + Badge */}
                      <div className="flex items-center justify-between w-full gap-1">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-black ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow'
                              : isToday
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : hasBills
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-500'
                          }`}
                        >
                          {String(cell.day).padStart(2, '0')}
                        </span>

                        {isToday && (
                          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            HOJE
                          </span>
                        )}

                        {hasBills && !isToday && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold ${
                              allPaid
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isSelected
                                ? 'bg-indigo-500 text-white'
                                : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {cell.bills.length} {cell.bills.length === 1 ? 'conta' : 'contas'}
                          </span>
                        )}
                      </div>

                      {/* Middle Preview: First 1-2 bill names on larger screens */}
                      {hasBills ? (
                        <div className="my-1 space-y-0.5 overflow-hidden w-full">
                          {cell.day === 6 ? (
                            <div className="text-[9px] sm:text-[10px] font-bold text-amber-300 truncate">
                              Folha + Coletivas + Ponto
                            </div>
                          ) : (
                            cell.bills.slice(0, 2).map(b => (
                              <div
                                key={b.id}
                                className="text-[9px] sm:text-[10px] text-slate-300 font-medium truncate leading-tight"
                              >
                                • {b.recipient}
                              </div>
                            ))
                          )}
                          {cell.day !== 6 && cell.bills.length > 2 && (
                            <div className="text-[9px] text-indigo-300 font-bold">
                              +{cell.bills.length - 2} mais...
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="my-auto text-[10px] text-slate-600 hidden sm:block">
                          Sem contas
                        </div>
                      )}

                      {/* Bottom Row: Total R$ on that Day */}
                      {hasBills && (
                        <div className="w-full pt-1 border-t border-slate-800/80 flex items-center justify-between">
                          <span
                            className={`text-[10px] sm:text-xs font-mono font-black truncate ${
                              allPaid
                                ? 'text-emerald-400'
                                : isSelected
                                ? 'text-white'
                                : 'text-emerald-400'
                            }`}
                          >
                            {formatCurrency(cell.totalAmount)}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend Footer */}
              <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-indigo-600 inline-block"></span>
                    Dia Selecionado
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-800 border border-indigo-400 inline-block"></span>
                    Dia com Contas a Pagar
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
                    Hoje (Dia {String(todayDay).padStart(2, '0')})
                  </span>
                </div>
                <span className="font-semibold text-slate-300">
                  Toque em qualquer quadrado para ver os detalhes ao lado 👉
                </span>
              </div>
            </div>

            {/* RIGHT: Detailed Panel for the Clicked Day */}
            <div className="xl:col-span-5 bg-slate-900 border-2 border-indigo-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              {/* Day Panel Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border-b border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <button
                    type="button"
                    onClick={handleJumpPrevDueDay}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
                    title="Ir para o dia anterior que possui contas"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Dia Anterior c/ Conta
                  </button>

                  <button
                    type="button"
                    onClick={handleJumpNextDueDay}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
                    title="Ir para o próximo dia que possui contas"
                  >
                    Próximo Dia c/ Conta
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {selectedDateWeekday}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Dia {String(selectedDay).padStart(2, '0')} de {MONTH_NAMES[calendarMonth]}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {selectedDayAllBills.length === 0
                        ? 'Nenhuma conta fixa cadastrada para este dia'
                        : `${selectedDayAllBills.length} ${
                            selectedDayAllBills.length === 1 ? 'conta programada' : 'contas programadas'
                          } para o dia ${String(selectedDay).padStart(2, '0')}`}
                    </p>
                  </div>

                  <div className="text-right bg-slate-950/90 border border-slate-800 px-3.5 py-2.5 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Total do Dia {String(selectedDay).padStart(2, '0')}
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono text-emerald-400">
                      {formatCurrency(selectedDayTotal)}
                    </span>
                  </div>
                </div>

                {/* Special Quick Sub-Filters when Day 06 is selected (Salários vs Coletivas vs Ponto) */}
                {selectedDay === 6 && selectedDayAllBills.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-300 block mb-2">
                      Separar contas do Dia 06 por grupo:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: 'ALL', label: `Todas (${selectedDayAllBills.length})` },
                        {
                          id: 'SALARIOS',
                          label: `Salários/Estágio (${
                            selectedDayAllBills.filter(
                              b =>
                                b.recipient.toUpperCase().includes('SALÁRIO') ||
                                b.recipient.toUpperCase().includes('BOLSA ESTÁGIO')
                            ).length
                          })`
                        },
                        {
                          id: 'COLETIVAS',
                          label: `Coletivas (${
                            selectedDayAllBills.filter(b =>
                              b.recipient.toUpperCase().includes('AULAS COLETIVAS')
                            ).length
                          })`
                        },
                        { id: 'OUTROS', label: 'Ponto / Outros (1)' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setDay6SubFilter(tab.id as any)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            day6SubFilter === tab.id
                              ? 'bg-indigo-600 text-white shadow'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bills List for the Selected Day */}
              <div className="p-4 sm:p-5 space-y-3 max-h-[620px] overflow-y-auto divide-y divide-slate-800/50">
                {selectedDayBills.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Nenhuma conta para pagar no dia {String(selectedDay).padStart(2, '0')}!
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Clique nos dias destacados em azul no calendário ou adicione uma nova conta abaixo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenCreate(selectedDay)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Cadastrar Conta para o Dia {String(selectedDay).padStart(2, '0')}
                    </button>
                  </div>
                ) : (
                  selectedDayBills.map(bill => {
                    const borderoInfo = getBorderoStatusForBill(bill, selectedDay);

                    return (
                      <div
                        key={bill.id}
                        className="pt-3 first:pt-0 bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 hover:border-indigo-500/40 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                <Building2 className="w-3 h-3" />
                                {bill.evoCostCenter}
                              </span>

                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  bill.amountType === 'FIXO'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {bill.amountType === 'FIXO' ? '📌 Valor Fixo' : '📊 Variável'}
                              </span>

                              {borderoInfo.status === 'PAGO' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Paga
                                </span>
                              )}

                              {borderoInfo.status === 'PENDENTE' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  <Clock className="w-3 h-3" />
                                  No Borderô
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm sm:text-base font-black text-white leading-snug">
                              {bill.recipient}
                            </h4>

                            {bill.description && (
                              <p className="text-xs text-slate-400 mt-0.5">{bill.description}</p>
                            )}
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-base sm:text-lg font-black font-mono text-white block">
                              {formatCurrency(bill.defaultAmount)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Dia {String(bill.dueDay).padStart(2, '0')}
                            </span>
                          </div>
                        </div>

                        {/* Action Bar inside Card */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">
                            Forma: <strong className="text-slate-200">{bill.paymentMethod.replace('_', ' ')}</strong>
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenQuickLaunch(bill)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600/15 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 text-[11px] font-bold transition cursor-pointer"
                            >
                              <Zap className="w-3 h-3" />
                              Lançar no Borderô
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(bill)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition cursor-pointer"
                            >
                              <Edit className="w-3 h-3" />
                              Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer inside Right Panel */}
              <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenCreate(selectedDay)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Conta no Dia {String(selectedDay).padStart(2, '0')}
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('LIST')}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Ver Tabela Completa →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODO 2: LISTA COMPLETA E TABELA DE CADASTRO                           */}
      {/* ===================================================================== */}
      {viewMode === 'LIST' && (
        <>
          {/* Filter & Search Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar por favorecido (ex: Kikos, Tegracon, Anilhas Nacional, CPFL, Aluguel)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
                <select
                  value={costCenterFilter}
                  onChange={e => setCostCenterFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">Todos os Centros de Custo EVO</option>
                  {uniqueCostCenters.map(cc => (
                    <option key={cc} value={cc}>
                      {cc}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ACTIVE">Somente Ativas ({activeBills.length})</option>
                  <option value="INACTIVE">
                    Encerradas / Inativas ({fixedBills.length - activeBills.length})
                  </option>
                  <option value="ALL">Todas ({fixedBills.length})</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">
                Filtrar Semana do Mês:
              </span>
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

          {/* Table of Fixed Bills */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-300">
                Exibindo <span className="text-white">{filteredBills.length}</span> contas cadastradas •
                Soma do filtro:{' '}
                <span className="text-emerald-400 font-black">
                  {formatCurrency(
                    filteredBills.reduce((s, b) => s + (Number(b.defaultAmount) || 0), 0)
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('CALENDAR')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                ← Voltar para o Calendário Interativo do Patrão
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Dia Venc.</th>
                    <th className="py-3 px-4">Favorecido / Descrição</th>
                    <th className="py-3 px-4">Centro de Custo (EVO)</th>
                    <th className="py-3 px-4">Tipo / Pagamento</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredBills.map(bill => {
                    const isDueSoon =
                      bill.active && bill.dueDay >= todayDay && bill.dueDay <= todayDay + 4;
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
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs border ${
                                isDueSoon
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-slate-950 text-indigo-300 border-slate-800'
                              }`}
                            >
                              {String(bill.dueDay).padStart(2, '0')}
                            </span>
                            <div>
                              <span className="font-bold text-slate-200 block">
                                Dia {String(bill.dueDay).padStart(2, '0')}
                              </span>
                              {!bill.active && (
                                <span className="text-[10px] font-bold text-rose-400">
                                  Encerrada
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-xs sm:text-sm">
                            {bill.recipient}
                          </div>
                          {bill.description && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {bill.description}
                            </div>
                          )}
                          {bill.notes && (
                            <div className="text-[10px] text-indigo-300/90 mt-1 italic">
                              {bill.notes}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950 text-slate-200 border border-slate-800">
                            <Building2 className="w-3 h-3 text-indigo-400" />
                            {bill.evoCostCenter}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                bill.amountType === 'FIXO'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {bill.amountType === 'FIXO' ? '📌 VALOR FIXO' : '📊 VALOR VARIÁVEL'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Pgto: {bill.paymentMethod.replace('_', ' ')}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="text-sm font-black font-mono text-white">
                            {formatCurrency(bill.defaultAmount)}
                          </span>
                        </td>

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
                              title={
                                bill.active
                                  ? 'Marcar como Encerrada / Inativa'
                                  : 'Reativar Conta Fixa'
                              }
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
        </>
      )}

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
                <label className="block font-bold text-slate-300 mb-1">Favorecido / Descrição Principal *</label>
                <input
                  type="text"
                  required
                  value={form.recipient}
                  onChange={e => setForm(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder="Ex: KIKOS APARELHOS DE MUSCULAÇÃO, TEGRACON CONTABILIDADE..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Beneficiário / Detalhes</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Beneficiário: Fornecedores • Honorários Contábeis"
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
                      <option key={cc} value={cc}>
                        {cc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Categoria no Borderô *</label>
                  <select
                    value={form.billType}
                    onChange={e =>
                      setForm(prev => ({ ...prev, billType: e.target.value as BorderoBillType }))
                    }
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
                    <option value="EMPRESTIMO">Empréstimo / Equipamentos</option>
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
                  <label className="block font-bold text-slate-300 mb-1">Valor (R$) *</label>
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
                    onChange={e =>
                      setForm(prev => ({ ...prev, amountType: e.target.value as 'FIXO' | 'VARIAVEL' }))
                    }
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
                  <label className="block font-bold text-slate-300 mb-1">Data Fim (Se encerrada)</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Observações</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações adicionais..."
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
                      {b.title} ({b.startDate.split('-').reverse().join('/')} a{' '}
                      {b.endDate.split('-').reverse().join('/')})
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
