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
  DollarSign
} from 'lucide-react';
import { OperationalDashboardSummary } from '../shared/types';

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

  const { kpis, expiringDocumentsList, recentMaintenance, urgentTasks, criticalCleaningProducts } = summary;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <span className="text-indigo-400 font-bold text-xs uppercase tracking-wider">
            Visão Geral Operacional & Administrativa
          </span>
          <h1 className="text-2xl font-black text-white mt-1">Painel de Gestão da Academia</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoramento de equipe, alertas de CREF, checklist diário, manutenções e suprimentos.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar Dados
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Funcionários & CREF */}
        <div 
          onClick={() => onNavigateTab('employees')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Equipe & CREF</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-white">
              {kpis.activeEmployees} <span className="text-xs font-normal text-slate-400">ativos</span>
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {kpis.expiringDocsCount > 0 ? (
                <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[11px] animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  {kpis.expiringDocsCount} doc(s) a vencer
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" />
                  Documentos 100% regulares
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Checklist do Dia */}
        <div 
          onClick={() => onNavigateTab('tasks')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lista de Tarefas</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-amber-400">
              {kpis.pendingTasksCount} <span className="text-xs font-normal text-slate-400">pendente(s)</span>
            </p>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <span>{kpis.completedTasksCount} concluídas</span>
              <span className="text-slate-600">•</span>
              <span>{kpis.totalTasks} no total</span>
            </p>
          </div>
        </div>

        {/* KPI 3: Custos de Manutenção */}
        <div 
          onClick={() => onNavigateTab('maintenance')}
          className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-xl p-5 shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manutenções do Mês</span>
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-105 transition">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-white">
              R$ {kpis.maintenanceCostMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-2">
              <span className="text-sky-400 font-semibold">Predial: R$ {kpis.predialCostMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
              <span>•</span>
              <span className="text-purple-400 font-semibold">Equip: R$ {kpis.equipmentsCostMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Suprimentos & Limpeza */}
        <div 
          onClick={() => onNavigateTab('cleaning')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estoque de Limpeza</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-white">
              {kpis.totalCleaningProducts} <span className="text-xs font-normal text-slate-400">itens cadastrados</span>
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              {kpis.lowStockCleaningCount > 0 ? (
                <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[11px]">
                  {kpis.lowStockCleaningCount} item(s) abaixo do mínimo
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold text-[11px]">
                  Estoque de limpeza abastecido
                </span>
              )}
            </div>
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
