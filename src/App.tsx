import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TaskListView } from './components/TaskListView';
import { EmployeeView } from './components/EmployeeView';
import { UniformsView } from './components/UniformsView';
import { CleaningInventoryView } from './components/CleaningInventoryView';
import { MaintenanceTrackerView } from './components/MaintenanceTrackerView';
import { SyncSettingsView } from './components/SyncSettingsView';
import { 
  AppSetting, 
  CleaningProduct, 
  MaintenanceRecord, 
  MaintenanceSummary, 
  UniformItem, 
  UniformDelivery, 
  UniformDiscard, 
  UniformSummary, 
  Employee, 
  EmployeeDocument, 
  TaskItem, 
  OperationalDashboardSummary 
} from './shared/types';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  addEmployeeDocument,
  deleteEmployeeDocument,
  getTasks,
  addTask,
  toggleTask,
  deleteTask,
  getUniformItems,
  addUniformItem,
  updateUniformItem,
  deleteUniformItem,
  getUniformDeliveries,
  addUniformDelivery,
  updateUniformDelivery,
  deleteUniformDelivery,
  getUniformDiscards,
  addUniformDiscard,
  deleteUniformDiscard,
  getUniformSummary,
  getCleaningProducts,
  addCleaningProduct,
  updateCleaningProduct,
  deleteCleaningProduct,
  getMaintenanceRecords,
  addMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getMaintenanceSummary,
  getOperationalDashboardSummary,
  getSettings,
  saveSettings
} from './services/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settings, setSettings] = useState<AppSetting | null>(null);

  // Operational Dashboard State
  const [operationalSummary, setOperationalSummary] = useState<OperationalDashboardSummary | null>(null);

  // Core Modules States
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cleaningProducts, setCleaningProducts] = useState<CleaningProduct[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [maintenanceSummary, setMaintenanceSummary] = useState<MaintenanceSummary | null>(null);

  // Uniforms State
  const [uniformItems, setUniformItems] = useState<UniformItem[]>([]);
  const [uniformDeliveries, setUniformDeliveries] = useState<UniformDelivery[]>([]);
  const [uniformDiscards, setUniformDiscards] = useState<UniformDiscard[]>([]);
  const [uniformSummary, setUniformSummary] = useState<UniformSummary | null>(null);

  // Calculated Badges
  const expiringDocsCount = employees.reduce((acc, emp) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const count = (emp.documents || []).filter(doc => {
      if (!doc.expirationDate) return false;
      const exp = new Date(doc.expirationDate);
      exp.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).length;
    return acc + count;
  }, 0);

  const pendingTasksCount = tasks.filter(t => t.status !== 'CONCLUIDA').length;

  const lowStockCleaningCount = cleaningProducts.filter(
    p => (parseFloat(p.currentQuantity as any) || 0) <= (parseFloat(p.minQuantity as any) || 0)
  ).length;

  // --- SELETIVE DATA FETCHING VIA SUPABASE ---
  const fetchForTab = async (tab: string) => {
    try {
      switch (tab) {
        case 'dashboard': {
          const res = await getOperationalDashboardSummary();
          setOperationalSummary(res);
          break;
        }
        case 'tasks': {
          const [resTasks, resEmps] = await Promise.all([getTasks(), getEmployees()]);
          setTasks(resTasks);
          setEmployees(resEmps);
          break;
        }
        case 'employees': {
          const res = await getEmployees();
          setEmployees(res);
          break;
        }
        case 'cleaning': {
          const res = await getCleaningProducts();
          setCleaningProducts(res);
          break;
        }
        case 'maintenance': {
          const [resMaint, resSum] = await Promise.all([getMaintenanceRecords(), getMaintenanceSummary()]);
          setMaintenanceRecords(resMaint);
          setMaintenanceSummary(resSum);
          break;
        }
        case 'uniforms': {
          const [resItems, resDeliv, resDisc, resSum] = await Promise.all([
            getUniformItems(),
            getUniformDeliveries(),
            getUniformDiscards(),
            getUniformSummary()
          ]);
          setUniformItems(resItems);
          setUniformDeliveries(resDeliv);
          setUniformDiscards(resDisc);
          setUniformSummary(resSum);
          break;
        }
        case 'settings': {
          const resSet = await getSettings();
          setSettings(resSet);
          break;
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados do Supabase:', err);
    }
  };

  useEffect(() => {
    fetchForTab(activeTab);
    getEmployees().then(setEmployees).catch(() => {});
    getTasks().then(setTasks).catch(() => {});
    getCleaningProducts().then(setCleaningProducts).catch(() => {});
    getSettings().then(setSettings).catch(() => {});

    // Polling a cada 15 segundos para manter os dados atualizados entre múltiplos usuários
    const interval = setInterval(() => {
      fetchForTab(activeTab);
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // --- HANDLERS: TAREFAS ---
  const handleAddTask = async (taskData: Partial<TaskItem>) => {
    try {
      const newTask = await addTask(taskData);
      setTasks(prev => [newTask, ...prev]);
    } catch (e) {
      console.error(e);
      alert('Erro ao cadastrar tarefa');
    }
  };

  const handleToggleTask = async (id: string) => {
    try {
      const updated = await toggleTask(id);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir tarefa');
    }
  };

  // --- HANDLERS: FUNCIONÁRIOS & DOCUMENTOS ---
  const handleAddEmployee = async (empData: Partial<Employee>) => {
    try {
      const newEmp = await createEmployee(empData);
      setEmployees(prev => [newEmp, ...prev]);
    } catch (e) {
      console.error(e);
      alert('Erro ao cadastrar funcionário');
    }
  };

  const handleEditEmployee = async (emp: Partial<Employee>) => {
    try {
      const updated = await updateEmployee(emp);
      setEmployees(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e));
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar funcionário');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este funcionário?')) return;
    try {
      await deleteEmployee(id);
      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir funcionário');
    }
  };

  const handleAddEmployeeDocument = async (employeeId: string, docData: Partial<EmployeeDocument>) => {
    try {
      const newDoc = await addEmployeeDocument(employeeId, docData);
      setEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
          return { ...emp, documents: [newDoc, ...(emp.documents || [])] };
        }
        return emp;
      }));
    } catch (e) {
      console.error(e);
      alert('Erro ao anexar documento');
    }
  };

  const handleDeleteEmployeeDocument = async (docId: string) => {
    if (!window.confirm('Excluir este documento anexo?')) return;
    try {
      await deleteEmployeeDocument(docId);
      setEmployees(prev => prev.map(emp => ({
        ...emp,
        documents: (emp.documents || []).filter(d => d.id !== docId)
      })));
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir documento');
    }
  };

  // --- HANDLERS: LIMPEZA ---
  const handleAddCleaningProduct = async (productData: Partial<CleaningProduct>) => {
    try {
      const newProd = await addCleaningProduct(productData);
      setCleaningProducts(prev => [newProd, ...prev]);
    } catch (e) {
      console.error(e);
      alert('Erro ao cadastrar produto de limpeza');
    }
  };

  const handleEditCleaningProduct = async (product: Partial<CleaningProduct>) => {
    try {
      const updated = await updateCleaningProduct(product);
      setCleaningProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar produto de limpeza');
    }
  };

  const handleDeleteCleaningProduct = async (idOrIds: string | string[]) => {
    try {
      await deleteCleaningProduct(idOrIds);
      const idsToDelete = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      setCleaningProducts(prev => prev.filter(p => !idsToDelete.includes(p.id)));
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir produto');
    }
  };

  // --- HANDLERS: MANUTENÇÃO ---
  const handleAddMaintenanceRecord = async (recordData: Partial<MaintenanceRecord>) => {
    try {
      const newRec = await addMaintenanceRecord(recordData);
      setMaintenanceRecords(prev => [newRec, ...prev]);
      getMaintenanceSummary().then(setMaintenanceSummary);
    } catch (e) {
      console.error(e);
      alert('Erro ao registrar manutenção');
    }
  };

  const handleEditMaintenanceRecord = async (record: Partial<MaintenanceRecord>) => {
    try {
      const updated = await updateMaintenanceRecord(record);
      setMaintenanceRecords(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
      getMaintenanceSummary().then(setMaintenanceSummary);
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar manutenção');
    }
  };

  const handleDeleteMaintenanceRecord = async (id: string) => {
    if (!window.confirm('Excluir este registro de manutenção?')) return;
    try {
      await deleteMaintenanceRecord(id);
      setMaintenanceRecords(prev => prev.filter(r => r.id !== id));
      getMaintenanceSummary().then(setMaintenanceSummary);
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir manutenção');
    }
  };

  // --- HANDLERS: UNIFORMES ---
  const handleAddUniformStockItem = async (data: Partial<UniformItem>) => {
    try {
      const newItem = await addUniformItem(data);
      setUniformItems(prev => [newItem, ...prev]);
      getUniformSummary().then(setUniformSummary);
    } catch (e) {
      console.error(e);
      alert('Erro ao cadastrar item de uniforme');
    }
  };

  const handleEditUniformStockItem = async (item: Partial<UniformItem>) => {
    try {
      const updated = await updateUniformItem(item);
      setUniformItems(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
      getUniformSummary().then(setUniformSummary);
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar item de uniforme');
    }
  };

  const handleDeleteUniformStockItem = async (id: string) => {
    if (!window.confirm('Excluir este item de uniforme?')) return;
    try {
      await deleteUniformItem(id);
      setUniformItems(prev => prev.filter(i => i.id !== id));
      getUniformSummary().then(setUniformSummary);
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir uniforme');
    }
  };

  const handleAddUniformDelivery = async (data: any) => {
    try {
      const newDeliv = await addUniformDelivery(data);
      if (newDeliv) setUniformDeliveries(prev => [newDeliv, ...prev]);
      getUniformItems().then(setUniformItems);
      getUniformSummary().then(setUniformSummary);
    } catch (e) {
      console.error(e);
      alert('Erro ao registrar entrega de uniforme');
    }
  };

  const handleEditUniformDelivery = async (delivery: Partial<UniformDelivery>) => {
    try {
      const updated = await updateUniformDelivery(delivery);
      setUniformDeliveries(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
      getUniformItems().then(setUniformItems);
      getUniformSummary().then(setUniformSummary);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUniformDelivery = async (id: string) => {
    if (!window.confirm('Excluir este registro de entrega?')) return;
    try {
      await deleteUniformDelivery(id);
      setUniformDeliveries(prev => prev.filter(d => d.id !== id));
      getUniformItems().then(setUniformItems);
      getUniformSummary().then(setUniformSummary);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddUniformDiscard = async (data: Partial<UniformDiscard>) => {
    try {
      const newDisc = await addUniformDiscard(data);
      setUniformDiscards(prev => [newDisc, ...prev]);
      getUniformItems().then(setUniformItems);
      getUniformSummary().then(setUniformSummary);
    } catch (e) {
      console.error(e);
      alert('Erro ao registrar descarte de uniforme');
    }
  };

  const handleDeleteUniformDiscard = async (id: string) => {
    if (!window.confirm('Excluir este registro de descarte?')) return;
    try {
      await deleteUniformDiscard(id);
      setUniformDiscards(prev => prev.filter(d => d.id !== id));
      getUniformItems().then(setUniformItems);
      getUniformSummary().then(setUniformSummary);
    } catch (e) {
      console.error(e);
    }
  };

  // --- HANDLERS: CONFIGURAÇÕES ---
  const handleSaveSettings = async (newSettings: Partial<AppSetting>) => {
    try {
      const updated = await saveSettings(newSettings);
      setSettings(updated);
      alert('Configurações salvas no Supabase!');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        expiringDocsCount={expiringDocsCount}
        pendingTasksCount={pendingTasksCount}
        lowStockCleaningCount={lowStockCleaningCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 1. Dashboard Operacional */}
        {activeTab === 'dashboard' && (
          <DashboardView 
            summary={operationalSummary} 
            onNavigateTab={setActiveTab}
            onRefresh={() => fetchForTab('dashboard')} 
          />
        )}

        {/* 2. Ficha de Funcionários & CREF */}
        {activeTab === 'employees' && (
          <EmployeeView
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onEditEmployee={handleEditEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onAddDocument={handleAddEmployeeDocument}
            onDeleteDocument={handleDeleteEmployeeDocument}
          />
        )}

        {/* 3. Lista de Tarefas */}
        {activeTab === 'tasks' && (
          <TaskListView
            tasks={tasks}
            employees={employees}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {/* 4. Controle de Uniformes */}
        {activeTab === 'uniforms' && (
          <UniformsView
            items={uniformItems}
            deliveries={uniformDeliveries}
            discards={uniformDiscards}
            summary={uniformSummary}
            onAddStockItem={handleAddUniformStockItem}
            onEditStockItem={handleEditUniformStockItem}
            onDeleteStockItem={handleDeleteUniformStockItem}
            onAddDelivery={handleAddUniformDelivery}
            onEditDelivery={handleEditUniformDelivery}
            onDeleteDelivery={handleDeleteUniformDelivery}
            onAddDiscard={handleAddUniformDiscard}
            onDeleteDiscard={handleDeleteUniformDiscard}
          />
        )}

        {/* 5. Estoque de Limpeza */}
        {activeTab === 'cleaning' && (
          <CleaningInventoryView
            products={cleaningProducts}
            onAddProduct={handleAddCleaningProduct}
            onEditProduct={handleEditCleaningProduct}
            onDeleteProduct={handleDeleteCleaningProduct}
          />
        )}

        {/* 6. Manutenções & Custos */}
        {activeTab === 'maintenance' && (
          <MaintenanceTrackerView
            records={maintenanceRecords}
            summary={maintenanceSummary}
            onAddRecord={handleAddMaintenanceRecord}
            onEditRecord={handleEditMaintenanceRecord}
            onDeleteRecord={handleDeleteMaintenanceRecord}
          />
        )}

        {/* 7. Configurações & Backup */}
        {activeTab === 'settings' && (
          <SyncSettingsView
            settings={settings || ({ id: 'default', excelFilePath: '', syncIntervalSeconds: 0, autoSyncEnabled: false, lastSyncedAt: null, columnMapping: {} as any })}
          />
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        ERP Gestão & Operação Academia Pro v2.0 • Conectado à Nuvem Supabase
      </footer>
    </div>
  );
}
