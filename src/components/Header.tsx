import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Dumbbell, 
  LayoutDashboard, 
  Settings, 
  Sparkles, 
  Wrench, 
  Shirt, 
  Users,
  CheckSquare,
  ShieldCheck,
  Receipt,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  expiringDocsCount?: number;
  expiringRegulatoryCount?: number;
  pendingTasksCount?: number;
  lowStockCleaningCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  expiringDocsCount = 0,
  expiringRegulatoryCount = 0,
  pendingTasksCount = 0,
  lowStockCleaningCount = 0
}) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mouse Drag state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Check scroll bounds
  const updateScrollIndicators = useCallback(() => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
    }
  }, []);

  useEffect(() => {
    updateScrollIndicators();
    window.addEventListener('resize', updateScrollIndicators);
    return () => window.removeEventListener('resize', updateScrollIndicators);
  }, [updateScrollIndicators]);

  // Translate vertical wheel scroll to horizontal scroll
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.2;
        updateScrollIndicators();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [updateScrollIndicators]);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (!tabsRef.current) return;
    const activeEl = tabsRef.current.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    const timer = setTimeout(updateScrollIndicators, 350);
    return () => clearTimeout(timer);
  }, [activeTab, updateScrollIndicators]);

  // Click arrow scroll
  const scroll = (direction: 'left' | 'right') => {
    if (!tabsRef.current) return;
    const scrollAmount = 260;
    tabsRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(updateScrollIndicators, 350);
  };

  // Drag to scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tabsRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - tabsRef.current.offsetLeft;
    scrollStartRef.current = tabsRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !tabsRef.current) return;
    const x = e.pageX - tabsRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.3;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    tabsRef.current.scrollLeft = scrollStartRef.current - walk;
    updateScrollIndicators();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTabClick = (tabKey: string) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    setActiveTab(tabKey);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0 overflow-hidden">
              <img 
                src="/favicon.png" 
                alt="Logo" 
                className="w-full h-full object-cover" 
                onError={(e) => { 
                  e.currentTarget.style.display = 'none'; 
                }} 
              />
              <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight truncate">
                  ERP Gestão & Operação
                </h1>
                <span className="hidden md:inline-flex text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                  Academia Pro v2.0
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 truncate">
                Controle Operacional, Pessoal, Tarefas & Manutenção
              </p>
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            <div 
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap"
              title="Banco de Dados Supabase Ativo e Sincronizado"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline">Nuvem Ativa</span>
            </div>

            <button
              onClick={() => setActiveTab('settings')}
              className={`inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
              title="Configurações & Backup"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Configurações</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs with Smooth Mouse Wheel Scroll, Left/Right Scroll Buttons & Drag-to-Scroll */}
        <div className="relative border-t border-slate-800/60 flex items-center group/nav">
          {/* Left Arrow Button with Gradient Fade */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-3 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="w-7 h-7 rounded-full bg-slate-800/95 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                title="Rolar abas para a esquerda"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Scrollable Tabs Track */}
          <div 
            ref={tabsRef}
            onScroll={updateScrollIndicators}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="flex items-center gap-1.5 py-1.5 overflow-x-auto scroll-smooth cursor-grab active:cursor-grabbing w-full header-scrollbar"
            style={{ 
              scrollbarWidth: 'thin', 
              scrollbarColor: '#475569 transparent',
              WebkitOverflowScrolling: 'touch' 
            }}
          >
            {/* 1. Dashboard Operacional */}
            <button
              data-tab="dashboard"
              onClick={() => handleTabClick('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex-shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard Operacional
            </button>

            {/* 2. Ficha de Funcionários & CREF */}
            <button
              data-tab="employees"
              onClick={() => handleTabClick('employees')}
              className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex-shrink-0 ${
                activeTab === 'employees'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
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

            {/* 3. Alvarás & Licenças Regulatória */}
            <button
              data-tab="regulatory"
              onClick={() => handleTabClick('regulatory')}
              className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex-shrink-0 ${
                activeTab === 'regulatory'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${activeTab === 'regulatory' ? 'text-slate-950' : 'text-amber-400'}`} />
              Alvarás & Licenças
              {expiringRegulatoryCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {expiringRegulatoryCount}
                </span>
              )}
            </button>

            {/* 4. Lista de Tarefas & Checklist */}
            <button
              data-tab="tasks"
              onClick={() => handleTabClick('tasks')}
              className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex-shrink-0 ${
                activeTab === 'tasks'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
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

            {/* 5. Controle de Uniformes */}
            <button
              data-tab="uniforms"
              onClick={() => handleTabClick('uniforms')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex-shrink-0 ${
                activeTab === 'uniforms'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Shirt className="w-4 h-4" />
              Controle de Uniformes
            </button>

            {/* 6. Estoque de Limpeza */}
            <button
              data-tab="cleaning"
              onClick={() => handleTabClick('cleaning')}
              className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex-shrink-0 ${
                activeTab === 'cleaning'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
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

            {/* 7. Manutenções & Custos */}
            <button
              data-tab="maintenance"
              onClick={() => handleTabClick('maintenance')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex-shrink-0 ${
                activeTab === 'maintenance'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Manutenções & Custos
            </button>

            {/* 8. Borderô Semanal */}
            <button
              data-tab="borderos"
              onClick={() => handleTabClick('borderos')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex-shrink-0 ${
                activeTab === 'borderos'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Receipt className="w-4 h-4 text-orange-400" />
              Borderô Semanal
            </button>
          </div>

          {/* Right Arrow Button with Gradient Fade */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-3 bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent">
              <button
                type="button"
                onClick={() => scroll('right')}
                className="w-7 h-7 rounded-full bg-slate-800/95 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                title="Rolar abas para a direita"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
