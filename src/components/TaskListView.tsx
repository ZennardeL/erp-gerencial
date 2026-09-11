import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  AlertCircle, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Wrench,
  Users,
  ShieldAlert,
  ClipboardList
} from 'lucide-react';
import { TaskItem, Employee } from '../shared/types';

interface TaskListViewProps {
  tasks: TaskItem[];
  employees: Employee[];
  onAddTask: (task: Partial<TaskItem>) => Promise<void>;
  onToggleTask: (id: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateTask?: (task: TaskItem) => Promise<void>;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  employees,
  onAddTask,
  onToggleTask,
  onDeleteTask
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODAS' | 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA'>('TODAS');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODAS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskItem['category']>('RECEPCAO');
  const [priority, setPriority] = useState<TaskItem['priority']>('MEDIA');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.assignedTo && task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'TODAS' || task.status === statusFilter;
    const matchesCategory = categoryFilter === 'TODAS' || task.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === 'PENDENTE').length;
  const inProgressTasks = tasks.filter(t => t.status === 'EM_ANDAMENTO').length;
  const completedTasks = tasks.filter(t => t.status === 'CONCLUIDA').length;
  const overdueTasks = tasks.filter(t => t.status !== 'CONCLUIDA' && t.dueDate && t.dueDate < todayStr).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddTask({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        assignedTo: assignedTo.trim(),
        dueDate: dueDate || undefined,
        status: 'PENDENTE'
      });
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setDueDate('');
      setPriority('MEDIA');
      setCategory('RECEPCAO');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao adicionar tarefa:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (p: TaskItem['priority']) => {
    switch (p) {
      case 'ALTA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">ALTA</span>;
      case 'MEDIA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">MÉDIA</span>;
      case 'BAIXA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">BAIXA</span>;
    }
  };

  const getCategoryBadge = (cat: TaskItem['category']) => {
    switch (cat) {
      case 'RECEPCAO':
        return <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400"><Users className="w-3 h-3" /> Recepção</span>;
      case 'LIMPEZA':
        return <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-400"><Sparkles className="w-3 h-3" /> Limpeza</span>;
      case 'MANUTENCAO':
        return <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400"><Wrench className="w-3 h-3" /> Manutenção</span>;
      case 'GERENCIA':
        return <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-400"><ShieldAlert className="w-3 h-3" /> Gerência</span>;
      default:
        return <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400"><ClipboardList className="w-3 h-3" /> Geral</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs sm:text-sm tracking-wider uppercase">
            <CheckSquare className="w-4 h-4" />
            Operacional & Rotinas da Academia
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Lista de Tarefas & Checklist</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie rotinas diárias, checklists de turno, manutenções pendentes e tarefas da equipe.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Total</span>
          <p className="text-xl sm:text-2xl font-black text-white mt-1">{totalTasks}</p>
          <span className="text-[10px] text-slate-500">Cadastradas</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4">
          <span className="text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase">Pendentes</span>
          <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{pendingTasks}</p>
          <span className="text-[10px] text-slate-500">A fazer</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4">
          <span className="text-[10px] sm:text-[11px] font-bold text-sky-400 uppercase">Em Andamento</span>
          <p className="text-xl sm:text-2xl font-black text-sky-400 mt-1">{inProgressTasks}</p>
          <span className="text-[10px] text-slate-500">Em execução</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4">
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase">Concluídas</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{completedTasks}</p>
          <span className="text-[10px] text-slate-500">Finalizadas</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 col-span-2 sm:col-span-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-rose-400 uppercase">Em Atraso</span>
          <p className="text-xl sm:text-2xl font-black text-rose-400 mt-1">{overdueTasks}</p>
          <span className="text-[10px] text-slate-500">Prazo expirado</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por tarefa, descrição ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="TODAS">Todos os Status</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="CONCLUIDA">Concluídas</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="TODAS">Todas as Categorias</option>
            <option value="RECEPCAO">Recepção</option>
            <option value="LIMPEZA">Limpeza</option>
            <option value="MANUTENCAO">Manutenção</option>
            <option value="GERENCIA">Gerência</option>
            <option value="GERAL">Geral</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
            <CheckSquare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-300 font-bold text-sm">Nenhuma tarefa encontrada</p>
            <p className="text-slate-500 text-xs mt-1">
              {searchTerm || statusFilter !== 'TODAS' || categoryFilter !== 'TODAS'
                ? 'Tente ajustar os filtros de busca.'
                : 'Cadastre tarefas e checklists para organizar a rotina da academia.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
            >
              Criar Primeira Tarefa
            </button>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isCompleted = task.status === 'CONCLUIDA';
            const isOverdue = !isCompleted && task.dueDate && task.dueDate < todayStr;

            return (
              <div
                key={task.id}
                className={`flex items-start sm:items-center justify-between p-4 rounded-xl border transition ${
                  isCompleted
                    ? 'bg-slate-900/40 border-slate-850 opacity-60'
                    : isOverdue
                    ? 'bg-slate-900 border-rose-500/40 hover:border-rose-500'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Quick Toggle Checkbox */}
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={`mt-0.5 sm:mt-0 w-6 h-6 rounded-lg flex items-center justify-center border transition flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-slate-700 hover:border-indigo-500 bg-slate-950 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-bold text-sm ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                        {task.title}
                      </span>
                      {getPriorityBadge(task.priority)}
                      {getCategoryBadge(task.category)}
                      {isOverdue && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                          <AlertCircle className="w-3 h-3" /> Em Atraso
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className={`text-xs mt-1 ${isCompleted ? 'line-through text-slate-600' : 'text-slate-400'}`}>
                        {task.description}
                      </p>
                    )}

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                      {task.assignedTo && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <User className="w-3 h-3" />
                          {task.assignedTo}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                          <Calendar className="w-3 h-3" />
                          Prazo: {task.dueDate.split('-').reverse().join('/')}
                        </span>
                      )}
                      {isCompleted && task.completedAt && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Concluída em: {new Date(task.completedAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pl-2">
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Excluir tarefa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nova Tarefa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">Nova Tarefa ou Rotina</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reposição de sabonetes e papel nos vestiários"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição / Instruções Detalhadas
                </label>
                <textarea
                  rows={2}
                  placeholder="Observações ou instruções específicas para a equipe..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Setor / Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="RECEPCAO">Recepção</option>
                    <option value="LIMPEZA">Limpeza</option>
                    <option value="MANUTENCAO">Manutenção</option>
                    <option value="GERENCIA">Gerência</option>
                    <option value="GERAL">Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Responsável (Colaborador)
                  </label>
                  <div className="space-y-1">
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Selecione ou deixe aberto...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name} ({emp.role})
                        </option>
                      ))}
                      <option value="Equipe Recepção">Equipe Recepção</option>
                      <option value="Equipe Limpeza">Equipe Limpeza</option>
                      <option value="Equipe Manutenção">Equipe Manutenção</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data Limite (Prazo)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
