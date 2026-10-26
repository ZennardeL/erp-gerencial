import React from 'react';
import { 
  Users, 
  CheckSquare, 
  Wrench, 
  Sparkles, 
  Shirt, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ArrowUpRight, 
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Dumbbell,
  ShoppingCart,
  CalendarClock,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { OperationalDashboardSummary } from '../shared/types';
import { formatCurrency } from '../shared/formatters';

interface DashboardViewProps {
  summary: OperationalDashboardSummary | null;
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  summary, 
  onNavigateTab, 
  onRefresh 
}) => {
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Carregando dados operacionais da academia...
      </div>
    );
  }

  const { kpis, expiringDocumentsList, recentMaintenance, urgentTasks, criticalCleaningProducts, coletivasSummary, pdvSummary, fixedBillsSummary } = summary;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div>
          <span className="text-indigo-400 font-bold text-[11px] sm:text-xs uppercase tracking-wider">
            Visão Geral Operacional & Administrativa
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5 sm:mt-1">Painel de Gestão da Academia</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoramento integrado de equipe, CREF, Coletivas, PDV Recepção, Contas Fixas EVO e manutenção.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onNavigateTab('fixed_bills')}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-indigo-600/20 flex-1 sm:flex-initial cursor-pointer"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            📅 Calendário de Contas (Patrão)
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition border border-slate-700 flex-1 sm:flex-initial cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar Dados
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (2-column on mobile, 4-column on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: Funcionários & CREF */}
        <div 
          onClick={() => onNavigateTab('employees')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3.5 sm:p-5 shadow-sm transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Equipe & CREF</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-xl sm:text-2xl font-black text-white">
              {kpis.activeEmployees} <span className="text-xs font-normal text-slate-400">ativos</span>
            </p>
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1 text-[11px]">
              {kpis.expiringDocsCount > 0 ? (
                <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  {kpis.expiringDocsCount} a vencer
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[10px] sm:text-[11px]">
                  <CheckCircle2 className="w-3 h-3" />
                  100% regulares
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Checklist do Dia */}
        <div 
          onClick={() => onNavigateTab('tasks')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-3.5 sm:p-5 shadow-sm transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Checklist</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition flex-shrink-0">
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-xl sm:text-2xl font-black text-amber-400">
              {kpis.pendingTasksCount} <span className="text-xs font-normal text-slate-400">pendentes</span>
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 truncate">
              {kpis.completedTasksCount}/{kpis.totalTasks} concluídas
            </p>
          </div>
        </div>

        {/* KPI 3: Custos de Manutenção */}
        <div 
          onClick={() => onNavigateTab('maintenance')}
          className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-xl p-3.5 sm:p-5 shadow-sm transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Manutenção Mês</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-105 transition flex-shrink-0">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-lg sm:text-2xl font-black text-white truncate">
              R$ {kpis.maintenanceCostMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 sm:mt-2 truncate">
              <span className="text-sky-400 font-semibold">P: {kpis.predialCostMonth.toFixed(0)}</span>
              <span className="mx-1">•</span>
              <span className="text-purple-400 font-semibold">E: {kpis.equipmentsCostMonth.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Suprimentos & Limpeza */}
        <div 
          onClick={() => onNavigateTab('cleaning')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3.5 sm:p-5 shadow-sm transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Estoque Limpeza</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-xl sm:text-2xl font-black text-white">
              {kpis.totalCleaningProducts} <span className="text-xs font-normal text-slate-400">itens</span>
            </p>
            <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] truncate">
              {kpis.lowStockCleaningCount > 0 ? (
                <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                  {kpis.lowStockCleaningCount} repor
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold">Abastecido</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          ECOSSISTEMA INTEGRADO PANOBIANCO: COLETIVAS + PDV RECEPÇÃO + CONTAS FIXAS
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Integração App de Coletivas */}
        <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                    App Integrado • Mês Atual
                  </span>
                  <h3 className="text-sm font-black text-white">Aulas Coletivas & Frequência</h3>
                </div>
              </div>
              <a
                href="https://panobianco-coletivas.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600/15 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 text-[11px] font-bold transition"
              >
                Abrir App <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Aulas no Mês</span>
                <span className="text-base font-black text-white">{coletivasSummary?.totalClassesMonth || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Presenças</span>
                <span className="text-base font-black text-orange-400">{coletivasSummary?.totalStudentsMonth || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Média/Aula</span>
                <span className="text-base font-black text-emerald-400">{coletivasSummary?.avgStudentsPerClass || 0}</span>
              </div>
            </div>

            <div className="mt-3 bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Folha Acumulada (Mês):</span>
                <span className="font-black text-white">{formatCurrency(coletivasSummary?.totalPayrollMonth || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Holerite: <strong className="text-slate-200">{formatCurrency(coletivasSummary?.totalHoleriteMonth || 0)}</strong></span>
                <span>Recibo/PJ: <strong className="text-slate-200">{formatCurrency(coletivasSummary?.totalReciboMonth || 0)}</strong></span>
              </div>
              {coletivasSummary?.topModality && coletivasSummary.topModality !== '—' && (
                <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">🏆 Aula Mais Popular:</span>
                  <span className="font-bold text-emerald-400">
                    {coletivasSummary.topModality} ({coletivasSummary.topModalityAvg} alunos/aula)
                  </span>
                </div>
              )}
            </div>

            {coletivasSummary && coletivasSummary.teachersSummary.length > 0 && (
              <div className="mt-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Resumo por Professor (Mês):</span>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {coletivasSummary.teachersSummary.map(t => (
                    <div key={t.id} className="flex items-center justify-between text-[11px] bg-slate-950/40 px-2.5 py-1 rounded border border-slate-800/60">
                      <span className="text-slate-200 font-medium truncate">
                        {t.shortName} <span className="text-slate-500">({t.classesCount} aulas • {t.studentsCount} al.)</span>
                      </span>
                      <span className="font-bold text-orange-400 ml-2">{formatCurrency(t.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('fixed_bills')}
            className="mt-3 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Ver Folha Coletivas nas Contas Fixas →
          </button>
        </div>

        {/* Card 2: Integração PDV Recepção & Consumo de Professores */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    App Integrado • Lojinha & Geladeira
                  </span>
                  <h3 className="text-sm font-black text-white">PDV Recepção & Vales</h3>
                </div>
              </div>
              <a
                href="https://panobianco-pdv-erp.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-[11px] font-bold transition"
              >
                Abrir PDV <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Vendas Hoje ({pdvSummary?.salesCountToday || 0})</span>
                <span className="text-base font-black text-emerald-400">{formatCurrency(pdvSummary?.revenueToday || 0)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Acumulado Mês ({pdvSummary?.salesCountMonth || 0})</span>
                <span className="text-base font-black text-white">{formatCurrency(pdvSummary?.revenueMonth || 0)}</span>
              </div>
            </div>

            {/* Vales / Consumo de Professores */}
            <div className="mt-3 bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Vales de Professores em Aberto:</span>
                {pdvSummary && pdvSummary.pendingValesAmount > 0 ? (
                  <span className="font-black text-amber-400">
                    {formatCurrency(pdvSummary.pendingValesAmount)} ({pdvSummary.pendingValesCount})
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold text-[11px]">✅ Tudo Quitado (R$ 0,00)</span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Vales já pagos no mês:</span>
                <span className="font-bold text-slate-200">{formatCurrency(pdvSummary?.paidValesMonthAmount || 0)}</span>
              </div>
              {pdvSummary?.activeShiftOperator && (
                <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">🟢 Turno Aberto no PDV:</span>
                  <span className="font-bold text-emerald-300 truncate max-w-[160px]">{pdvSummary.activeShiftOperator}</span>
                </div>
              )}
            </div>

            {/* Estoque Crítico Geladeira PDV */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                <span>Alertas de Estoque PDV (Bebidas/Supl.):</span>
                <span className="text-rose-400">{pdvSummary?.outOfStockProductsCount || 0} esgotados</span>
              </div>
              {pdvSummary && pdvSummary.criticalProducts.length > 0 ? (
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {pdvSummary.criticalProducts.slice(0, 4).map(p => (
                    <div key={p.id} className="flex items-center justify-between text-[11px] bg-slate-950/40 px-2.5 py-1 rounded border border-slate-800/60">
                      <span className="text-slate-200 truncate">{p.name}</span>
                      <span className={`font-bold ml-2 whitespace-nowrap ${p.stock <= 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                        {p.stock <= 0 ? 'ESGOTADO' : `${p.stock} un`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-400">Estoque do PDV abastecido.</p>
              )}
            </div>
          </div>

          <a
            href="https://panobianco-pdv-erp.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition text-center block"
          >
            Gerenciar Estoque e Vales no PDV ↗
          </a>
        </div>

        {/* Card 3: Resumo Contas Fixas EVO & Borderô */}
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                    Financeiro • Padrão EVO
                  </span>
                  <h3 className="text-sm font-black text-white">Contas Fixas & Borderô</h3>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('fixed_bills')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 text-[11px] font-bold transition cursor-pointer"
              >
                Ver Todas <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase block">Obrigações Recorrentes Cadastradas</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black text-white">
                  {formatCurrency(fixedBillsSummary?.totalActiveMonthly || 0)}
                </span>
                <span className="text-xs font-bold text-indigo-400">
                  {fixedBillsSummary?.activeCount || 0} contas ativas
                </span>
              </div>
            </div>

            <div className="mt-3 bg-amber-950/20 border border-amber-500/30 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">Vencendo nos Próximos 7 Dias:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300">
                  {fixedBillsSummary?.dueNext7DaysCount || 0} conta(s)
                </span>
              </div>
              <p className="text-lg font-black text-amber-400 mt-1">
                {formatCurrency(fixedBillsSummary?.dueNext7DaysAmount || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Importe essas contas para o Borderô Semanal com 1 clique.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => onNavigateTab('fixed_bills')}
              className="py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
            >
              📌 Contas Fixas
            </button>
            <button
              onClick={() => onNavigateTab('borderos')}
              className="py-1.5 px-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
            >
              <Receipt className="w-3.5 h-3.5" />
              Borderô Semanal
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Urgent Alerts & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Expiring Documents / CREF Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                Documentos & CREF Próximos do Vencimento
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('employees')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {expiringDocumentsList.length === 0 ? (
            <div className="py-8 text-center bg-slate-950/40 rounded-lg border border-slate-800/60">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-slate-300 text-xs font-semibold">Nenhum documento vencendo nos próximos 30 dias</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Todos os CREFs e contratos estão em dia.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {expiringDocumentsList.map((doc, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                      {doc.employeeName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{doc.employeeName}</p>
                      <p className="text-[11px] text-slate-400">{doc.docTitle} ({doc.employeeRole})</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      doc.isExpired
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {doc.isExpired ? 'Expirado' : `Vence em ${doc.daysUntilExpiration} dia(s)`}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {doc.expirationDate.split('-').reverse().join('/')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Urgent Operational Tasks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                Tarefas e Rotinas Prioritárias
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Abrir Checklist <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {urgentTasks.length === 0 ? (
            <div className="py-8 text-center bg-slate-950/40 rounded-lg border border-slate-800/60">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-slate-300 text-xs font-semibold">Tudo em dia!</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Nenhuma tarefa prioritária pendente no momento.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {urgentTasks.map(task => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">{task.title}</p>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        task.priority === 'ALTA'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                      {task.assignedTo && <span>Resp: {task.assignedTo}</span>}
                      {task.dueDate && <span>Prazo: {task.dueDate.split('-').reverse().join('/')}</span>}
                    </div>
                  </div>

                  <span className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                    {task.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Maintenance & Critical Cleaning Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Maintenance Records */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                Últimas Manutenções Realizadas
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('maintenance')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Ver Manutenções <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentMaintenance.map(rec => (
              <div 
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-800/80"
              >
                <div>
                  <p className="text-xs font-bold text-white">{rec.title}</p>
                  <p className="text-[11px] text-slate-400">
                    {rec.maintenanceType} • {rec.category} • {rec.executedBy}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-400">
                    R$ {rec.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {rec.executionDate ? rec.executionDate.split('-').reverse().join('/') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Cleaning Inventory */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                Reposição de Limpeza Necessária
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('cleaning')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Estoque Completo <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {criticalCleaningProducts.length === 0 ? (
            <div className="py-8 text-center bg-slate-950/40 rounded-lg border border-slate-800/60">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-slate-300 text-xs font-semibold">Estoque de limpeza em ordem</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Nenhum produto abaixo do limite mínimo.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {criticalCleaningProducts.map(p => (
                <div 
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-rose-500/20"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{p.name}</p>
                    <p className="text-[11px] text-slate-400">Categoria: {p.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-400">
                      {p.currentQuantity} {p.unit}
                    </span>
                    <p className="text-[10px] text-slate-500">Mínimo: {p.minQuantity} {p.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
