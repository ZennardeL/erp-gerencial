import React from 'react';
import { 
  Dumbbell, 
  LayoutDashboard, 
  Settings, 
  Sparkles, 
  Wrench, 
  Shirt, 
  Users,
  CheckSquare,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  expiringDocsCount?: number;
  pendingTasksCount?: number;
  lowStockCleaningCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  expiringDocsCount = 0,
  pendingTasksCount = 0,
  lowStockCleaningCount = 0
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">ERP Gestão & Operação</h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Academia Pro v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Controle Operacional, Pessoal, Tarefas & Manutenção</p>
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Banco de Dados Ativo
            </span>

            <button
              onClick={() => setActiveTab('settings')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              Configurações & Backup
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-slate-800/60 pt-1 pb-1 overflow-x-auto scrollbar-thin">
          {/* 1. Dashboard Operacional */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard Operacional
          </button>

          {/* 2. Ficha de Funcionários & CREF */}
          <button
            onClick={() => setActiveTab('employees')}
            className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'employees'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Ficha de Funcionários & CREF
            {expiringDocsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                {expiringDocsCount}
              </span>
            )}
          </button>

          {/* 3. Lista de Tarefas & Checklist */}
          <button
            onClick={() => setActiveTab('tasks')}
            className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Lista de Tarefas
            {pendingTasksCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500 text-white">
                {pendingTasksCount}
              </span>
            )}
          </button>

          {/* 4. Controle de Uniformes */}
          <button
            onClick={() => setActiveTab('uniforms')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'uniforms'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shirt className="w-4 h-4" />
            Controle de Uniformes
          </button>

          {/* 5. Estoque de Limpeza */}
          <button
            onClick={() => setActiveTab('cleaning')}
            className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'cleaning'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Estoque de Limpeza
            {lowStockCleaningCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {lowStockCleaningCount}
              </span>
            )}
          </button>

          {/* 6. Manutenções & Custos */}
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'maintenance'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Manutenções & Custos
          </button>
        </div>
      </div>
    </header>
  );
};
