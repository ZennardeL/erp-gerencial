import { createClient } from '@supabase/supabase-js';
import { 
  Employee, 
  EmployeeDocument, 
  TaskItem, 
  UniformItem, 
  UniformDelivery, 
  UniformDiscard, 
  UniformSummary, 
  CleaningProduct, 
  MaintenanceRecord, 
  MaintenanceSummary, 
  OperationalDashboardSummary,
  AppSetting,
  BorderoWeekly,
  BorderoItem
} from '../shared/types';

// Supabase Credentials
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://jawrukqnncnjgzixjaqy.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphd3J1a3FubmNuamd6aXhqYXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODc1NDksImV4cCI6MjEwMzg2MzU0OX0.U8GsG32Msjeu3YZwFhOErFdS2qJ7maYcH4FF07bTHKw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 1. EMPLOYEES & DOCUMENTS ---
export async function getEmployees(): Promise<Employee[]> {
  const { data: emps, error: empErr } = await supabase
    .from('erp_employees')
    .select('*')
    .order('name', { ascending: true });

  if (empErr) {
    console.error('Erro ao buscar colaboradores:', empErr);
    return [];
  }

  const { data: docs, error: docErr } = await supabase
    .from('erp_employee_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (docErr) console.error('Erro ao buscar documentos:', docErr);

  const docsByEmp: Record<string, EmployeeDocument[]> = {};
  (docs || []).forEach(d => {
    if (!docsByEmp[d.employee_id]) docsByEmp[d.employee_id] = [];
    docsByEmp[d.employee_id].push({
      id: d.id,
      employeeId: d.employee_id,
      docType: d.doc_type,
      title: d.title,
      fileName: d.file_name,
      fileDataUrl: d.file_data_url || '',
      fileSizeFormatted: d.file_size_formatted || '',
      issueDate: d.issue_date || '',
      expirationDate: d.expiration_date || null,
      notes: d.notes || '',
      createdAt: d.created_at
    });
  });

  return (emps || []).map(e => ({
    id: e.id,
    name: e.name,
    role: e.role,
    avatarUrl: e.avatar_url || '',
    cpf: e.cpf || '',
    rg: e.rg || '',
    crefNumber: e.cref_number || '',
    phone: e.phone || '',
    email: e.email || '',
    admissionDate: e.admission_date || '',
    status: e.status || 'ATIVO',
    notes: e.notes || '',
    documents: docsByEmp[e.id] || [],
    createdAt: e.created_at,
    updatedAt: e.updated_at
  }));
}

export async function createEmployee(data: Partial<Employee>): Promise<Employee> {
  const id = `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record = {
    id,
    name: data.name || 'Novo Colaborador',
    role: data.role || 'RECEPCAO',
    avatar_url: data.avatarUrl || null,
    cpf: data.cpf || null,
    rg: data.rg || null,
    cref_number: data.crefNumber || null,
    phone: data.phone || null,
    email: data.email || null,
    admission_date: data.admissionDate || new Date().toISOString().split('T')[0],
    status: data.status || 'ATIVO',
    notes: data.notes || null
  };

  const { error } = await supabase.from('erp_employees').insert([record]);
  if (error) throw error;

  return {
    ...data,
    id,
    name: record.name,
    role: record.role as any,
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as Employee;
}

export async function updateEmployee(emp: Partial<Employee>): Promise<Employee> {
  const updateData: any = { updated_at: new Date().toISOString() };
  if (emp.name !== undefined) updateData.name = emp.name;
  if (emp.role !== undefined) updateData.role = emp.role;
  if (emp.avatarUrl !== undefined) updateData.avatar_url = emp.avatarUrl;
  if (emp.cpf !== undefined) updateData.cpf = emp.cpf;
  if (emp.rg !== undefined) updateData.rg = emp.rg;
  if (emp.crefNumber !== undefined) updateData.cref_number = emp.crefNumber;
  if (emp.phone !== undefined) updateData.phone = emp.phone;
  if (emp.email !== undefined) updateData.email = emp.email;
  if (emp.admissionDate !== undefined) updateData.admission_date = emp.admissionDate;
  if (emp.status !== undefined) updateData.status = emp.status;
  if (emp.notes !== undefined) updateData.notes = emp.notes;

  const { error } = await supabase
    .from('erp_employees')
    .update(updateData)
    .eq('id', emp.id);

  if (error) throw error;
  return emp as Employee;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('erp_employees').delete().eq('id', id);
  if (error) throw error;
}

export async function addEmployeeDocument(employeeId: string, doc: Partial<EmployeeDocument>): Promise<EmployeeDocument> {
  const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record = {
    id,
    employee_id: employeeId,
    doc_type: doc.docType || 'OUTRO',
    title: doc.title || 'Documento',
    file_name: doc.fileName || 'documento.pdf',
    file_data_url: doc.fileDataUrl || null,
    file_size_formatted: doc.fileSizeFormatted || null,
    issue_date: doc.issueDate || null,
    expiration_date: doc.expirationDate || null,
    notes: doc.notes || null
  };

  const { error } = await supabase.from('erp_employee_documents').insert([record]);
  if (error) throw error;

  return {
    id,
    employeeId,
    docType: record.doc_type as any,
    title: record.title,
    fileName: record.file_name,
    fileDataUrl: record.file_data_url || '',
    fileSizeFormatted: record.file_size_formatted || '',
    issueDate: record.issue_date || '',
    expirationDate: record.expiration_date || null,
    notes: record.notes || '',
    createdAt: new Date().toISOString()
  };
}

export async function deleteEmployeeDocument(docId: string): Promise<void> {
  const { error } = await supabase.from('erp_employee_documents').delete().eq('id', docId);
  if (error) throw error;
}

// --- 2. TASKS ---
export async function getTasks(): Promise<TaskItem[]> {
  const { data, error } = await supabase
    .from('erp_tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar tarefas:', error);
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    title: t.title,
    description: t.description || '',
    category: t.category,
    priority: t.priority,
    assignedTo: t.assigned_to || '',
    dueDate: t.due_date || '',
    status: t.status,
    completedAt: t.completed_at || null,
    createdAt: t.created_at,
    updatedAt: t.updated_at
  }));
}

export async function addTask(data: Partial<TaskItem>): Promise<TaskItem> {
  const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record = {
    id,
    title: data.title || 'Nova Tarefa',
    description: data.description || null,
    category: data.category || 'GERAL',
    priority: data.priority || 'MEDIA',
    assigned_to: data.assignedTo || null,
    due_date: data.dueDate || null,
    status: data.status || 'PENDENTE',
    completed_at: null
  };

  const { error } = await supabase.from('erp_tasks').insert([record]);
  if (error) throw error;

  return {
    ...data,
    id,
    title: record.title,
    category: record.category as any,
    priority: record.priority as any,
    status: record.status as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as TaskItem;
}

export async function toggleTask(id: string): Promise<TaskItem> {
  const { data: current } = await supabase.from('erp_tasks').select('*').eq('id', id).single();
  if (!current) throw new Error('Tarefa não encontrada');

  const nextStatus = current.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
  const completedAt = nextStatus === 'CONCLUIDA' ? new Date().toISOString() : null;

  const { data: updated, error } = await supabase
    .from('erp_tasks')
    .update({ status: nextStatus, completed_at: completedAt, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description || '',
    category: updated.category,
    priority: updated.priority,
    assignedTo: updated.assigned_to || '',
    dueDate: updated.due_date || '',
    status: updated.status,
    completedAt: updated.completed_at,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at
  };
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('erp_tasks').delete().eq('id', id);
  if (error) throw error;
}

// --- 3. UNIFORMS ---
export async function getUniformItems(): Promise<UniformItem[]> {
  const { data, error } = await supabase
    .from('erp_uniform_items')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar itens de uniforme:', error);
    return [];
  }

  return (data || []).map(u => ({
    id: u.id,
    name: u.name,
    type: u.type,
    size: u.size,
    currentQuantity: parseFloat(u.current_quantity) || 0,
    minQuantity: parseFloat(u.min_quantity) || 0,
    unitCost: parseFloat(u.unit_cost) || 0,
    notes: u.notes || '',
    createdAt: u.created_at,
    updatedAt: u.updated_at
  }));
}

export async function addUniformItem(item: Partial<UniformItem>): Promise<UniformItem> {
  const id = `unif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record = {
    id,
    name: item.name || 'Uniforme',
    type: item.type || 'CAMISETA',
    size: item.size || 'M',
    current_quantity: parseFloat(item.currentQuantity as any) || 0,
    min_quantity: parseFloat(item.minQuantity as any) || 2,
    unit_cost: parseFloat(item.unitCost as any) || 0,
    notes: item.notes || null
  };

  const { error } = await supabase.from('erp_uniform_items').insert([record]);
  if (error) throw error;

  return {
    ...item,
    id,
    name: record.name,
    type: record.type as any,
    size: record.size as any,
    currentQuantity: record.current_quantity,
    minQuantity: record.min_quantity,
    unitCost: record.unit_cost,
    notes: record.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as UniformItem;
}

export async function updateUniformItem(item: Partial<UniformItem>): Promise<UniformItem> {
  const updateData: any = { updated_at: new Date().toISOString() };
  if (item.name !== undefined) updateData.name = item.name;
  if (item.type !== undefined) updateData.type = item.type;
  if (item.size !== undefined) updateData.size = item.size;
  if (item.currentQuantity !== undefined) updateData.current_quantity = parseFloat(item.currentQuantity as any) || 0;
  if (item.minQuantity !== undefined) updateData.min_quantity = parseFloat(item.minQuantity as any) || 0;
  if (item.unitCost !== undefined) updateData.unit_cost = parseFloat(item.unitCost as any) || 0;
  if (item.notes !== undefined) updateData.notes = item.notes;

  const { error } = await supabase.from('erp_uniform_items').update(updateData).eq('id', item.id);
  if (error) throw error;
  return item as UniformItem;
}

export async function deleteUniformItem(id: string): Promise<void> {
  const { error } = await supabase.from('erp_uniform_items').delete().eq('id', id);
  if (error) throw error;
}

export async function getUniformDeliveries(): Promise<UniformDelivery[]> {
  const { data, error } = await supabase
    .from('erp_uniform_deliveries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar entregas de uniforme:', error);
    return [];
  }

  return (data || []).map(d => ({
    id: d.id,
    employeeName: d.employee_name,
    employeeRole: d.employee_role || '',
    uniformItemId: d.uniform_item_id || '',
    uniformName: d.uniform_name,
    size: d.size || 'M',
    quantity: parseFloat(d.quantity) || 1,
    deliveryDate: d.delivery_date || '',
    notes: d.notes || '',
    createdAt: d.created_at
  }));
}

export async function addUniformDelivery(data: any): Promise<UniformDelivery> {
  const itemsToProcess = Array.isArray(data.items) && data.items.length > 0
    ? data.items
    : [{ uniformItemId: data.uniformItemId, uniformName: data.uniformName, size: data.size, quantity: data.quantity }];

  let firstDeliv: any = null;

  for (const it of itemsToProcess) {
    const qty = parseFloat(it.quantity) || 1;
    const id = `unif_deliv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record = {
      id,
      employee_name: data.employeeName,
      employee_role: data.employeeRole || null,
      uniform_item_id: it.uniformItemId || null,
      uniform_name: it.uniformName || 'Uniforme',
      size: it.size || 'M',
      quantity: qty,
      delivery_date: data.deliveryDate || new Date().toISOString().split('T')[0],
      notes: data.notes || null
    };

    const { error } = await supabase.from('erp_uniform_deliveries').insert([record]);
    if (error) console.error('Erro ao salvar entrega:', error);

    // Abate do estoque
    if (it.uniformItemId) {
      const { data: item } = await supabase.from('erp_uniform_items').select('current_quantity').eq('id', it.uniformItemId).single();
      if (item) {
        const newQty = Math.max(0, (parseFloat(item.current_quantity) || 0) - qty);
        await supabase.from('erp_uniform_items').update({ current_quantity: newQty }).eq('id', it.uniformItemId);
      }
    }

    if (!firstDeliv) {
      firstDeliv = {
        id,
        employeeName: record.employee_name,
        employeeRole: record.employee_role || '',
        uniformItemId: record.uniform_item_id || '',
        uniformName: record.uniform_name,
        size: record.size,
        quantity: record.quantity,
        deliveryDate: record.delivery_date,
        notes: record.notes || '',
        createdAt: new Date().toISOString()
      };
    }
  }

  return firstDeliv;
}

export async function updateUniformDelivery(delivery: Partial<UniformDelivery>): Promise<UniformDelivery> {
  const updateData: any = {};
  if (delivery.employeeName !== undefined) updateData.employee_name = delivery.employeeName;
  if (delivery.employeeRole !== undefined) updateData.employee_role = delivery.employeeRole;
  if (delivery.uniformName !== undefined) updateData.uniform_name = delivery.uniformName;
  if (delivery.size !== undefined) updateData.size = delivery.size;
  if (delivery.quantity !== undefined) updateData.quantity = parseFloat(delivery.quantity as any) || 0;
  if (delivery.deliveryDate !== undefined) updateData.delivery_date = delivery.deliveryDate;
  if (delivery.notes !== undefined) updateData.notes = delivery.notes;

  const { error } = await supabase.from('erp_uniform_deliveries').update(updateData).eq('id', delivery.id);
  if (error) throw error;
  return delivery as UniformDelivery;
}

export async function deleteUniformDelivery(id: string): Promise<void> {
  const { error } = await supabase.from('erp_uniform_deliveries').delete().eq('id', id);
  if (error) throw error;
}

export async function getUniformDiscards(): Promise<UniformDiscard[]> {
  const { data, error } = await supabase
    .from('erp_uniform_discards')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar descartes:', error);
    return [];
  }

  return (data || []).map(d => ({
    id: d.id,
    uniformItemId: d.uniform_item_id || '',
    uniformName: d.uniform_name,
    size: d.size || 'M',
    quantity: parseFloat(d.quantity) || 1,
    reason: d.reason,
    discardDate: d.discard_date || '',
    notes: d.notes || '',
    createdAt: d.created_at
  }));
}

export async function addUniformDiscard(discard: Partial<UniformDiscard>): Promise<UniformDiscard> {
  const id = `unif_disc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const qty = parseFloat(discard.quantity as any) || 1;
  const record = {
    id,
    uniform_item_id: discard.uniformItemId || null,
    uniform_name: discard.uniformName || 'Uniforme',
    size: discard.size || 'M',
    quantity: qty,
    reason: discard.reason || 'USO_EXCESSO',
    discard_date: discard.discardDate || new Date().toISOString().split('T')[0],
    notes: discard.notes || null
  };

  const { error } = await supabase.from('erp_uniform_discards').insert([record]);
  if (error) throw error;

  // Abate do estoque
  if (discard.uniformItemId) {
    const { data: item } = await supabase.from('erp_uniform_items').select('current_quantity').eq('id', discard.uniformItemId).single();
    if (item) {
      const newQty = Math.max(0, (parseFloat(item.current_quantity) || 0) - qty);
      await supabase.from('erp_uniform_items').update({ current_quantity: newQty }).eq('id', discard.uniformItemId);
    }
  }

  return {
    ...discard,
    id,
    uniformItemId: record.uniform_item_id || '',
    uniformName: record.uniform_name,
    size: record.size,
    quantity: record.quantity,
    reason: record.reason as any,
    discardDate: record.discard_date,
    notes: record.notes || '',
    createdAt: new Date().toISOString()
  } as UniformDiscard;
}

export async function deleteUniformDiscard(id: string): Promise<void> {
  const { error } = await supabase.from('erp_uniform_discards').delete().eq('id', id);
  if (error) throw error;
}

export async function getUniformSummary(): Promise<UniformSummary> {
  const [items, deliveries, discards] = await Promise.all([
    getUniformItems(),
    getUniformDeliveries(),
    getUniformDiscards()
  ]);

  const totalStockItems = items.reduce((acc, i) => acc + i.currentQuantity, 0);
  const totalDeliveredItems = deliveries.reduce((acc, d) => acc + d.quantity, 0);
  const totalDiscardedItems = discards.reduce((acc, d) => acc + d.quantity, 0);
  const lowStockItemsCount = items.filter(i => i.currentQuantity <= i.minQuantity).length;

  return {
    totalStockItems,
    totalDeliveredItems,
    totalDiscardedItems,
    lowStockItemsCount
  };
}

// --- 4. CLEANING PRODUCTS ---
export async function getCleaningProducts(): Promise<CleaningProduct[]> {
  const { data, error } = await supabase
    .from('erp_cleaning_products')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar produtos de limpeza:', error);
    return [];
  }

  return (data || []).map(p => {
    const currentQuantity = parseFloat(p.current_quantity) || 0;
    const unitCost = parseFloat(p.unit_cost) || 0;
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      unit: p.unit,
      currentQuantity,
      minQuantity: parseFloat(p.min_quantity) || 0,
      unitCost,
      totalValue: currentQuantity * unitCost,
      arrivalDate: p.last_purchase_date || (p.created_at ? p.created_at.split('T')[0] : ''),
      supplier: p.supplier || '',
      createdAt: p.created_at
    };
  });
}

export async function addCleaningProduct(prod: Partial<CleaningProduct>): Promise<CleaningProduct> {
  const id = `clean_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const currentQuantity = parseFloat(prod.currentQuantity as any) || 0;
  const unitCost = parseFloat(prod.unitCost as any) || 0;

  const record = {
    id,
    name: prod.name || 'Novo Produto',
    category: prod.category || 'OUTROS',
    unit: prod.unit || 'UNIDADES',
    current_quantity: currentQuantity,
    min_quantity: parseFloat(prod.minQuantity as any) || 1,
    unit_cost: unitCost,
    supplier: prod.supplier || null,
    last_purchase_date: prod.arrivalDate || null
  };

  const { error } = await supabase.from('erp_cleaning_products').insert([record]);
  if (error) throw error;

  return {
    ...prod,
    id,
    name: record.name,
    category: record.category as any,
    unit: record.unit as any,
    currentQuantity,
    minQuantity: record.min_quantity,
    unitCost,
    totalValue: currentQuantity * unitCost,
    arrivalDate: record.last_purchase_date || '',
    createdAt: new Date().toISOString()
  } as CleaningProduct;
}

export async function updateCleaningProduct(prod: Partial<CleaningProduct>): Promise<CleaningProduct> {
  const updateData: any = { updated_at: new Date().toISOString() };
  if (prod.name !== undefined) updateData.name = prod.name;
  if (prod.category !== undefined) updateData.category = prod.category;
  if (prod.unit !== undefined) updateData.unit = prod.unit;
  if (prod.currentQuantity !== undefined) updateData.current_quantity = parseFloat(prod.currentQuantity as any) || 0;
  if (prod.minQuantity !== undefined) updateData.min_quantity = parseFloat(prod.minQuantity as any) || 0;
  if (prod.unitCost !== undefined) updateData.unit_cost = parseFloat(prod.unitCost as any) || 0;
  if (prod.supplier !== undefined) updateData.supplier = prod.supplier;
  if (prod.arrivalDate !== undefined) updateData.last_purchase_date = prod.arrivalDate;

  const { error } = await supabase.from('erp_cleaning_products').update(updateData).eq('id', prod.id);
  if (error) throw error;
  return prod as CleaningProduct;
}

export async function deleteCleaningProduct(idOrIds: string | string[]): Promise<void> {
  if (Array.isArray(idOrIds)) {
    const { error } = await supabase.from('erp_cleaning_products').delete().in('id', idOrIds);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('erp_cleaning_products').delete().eq('id', idOrIds);
    if (error) throw error;
  }
}

// --- 5. MAINTENANCE RECORDS ---
export async function getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  const { data, error } = await supabase
    .from('erp_maintenance_records')
    .select('*')
    .order('service_date', { ascending: false });

  if (error) {
    console.error('Erro ao buscar manutenções:', error);
    return [];
  }

  return (data || []).map(m => {
    const materialCost = parseFloat(m.cost_parts) || 0;
    const laborCost = parseFloat(m.cost_labor) || 0;
    const totalCost = parseFloat(m.total_cost) || (materialCost + laborCost);

    return {
      id: m.id,
      title: m.title,
      maintenanceType: (m.type === 'EQUIPAMENTO' ? 'EQUIPAMENTOS' : (m.type || 'PREDIAL')) as any,
      category: (m.nature === 'CORRETIVA' ? 'CORRETIVA' : 'PREVENTIVA') as any,
      executionDate: m.service_date || (m.created_at ? m.created_at.split('T')[0] : ''),
      executedBy: m.performed_by || '',
      materialCost,
      laborCost,
      totalCost,
      notes: m.notes || m.description || '',
      createdAt: m.created_at
    };
  });
}

export async function addMaintenanceRecord(rec: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
  const id = `maint_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const materialCost = parseFloat(rec.materialCost as any) || 0;
  const laborCost = parseFloat(rec.laborCost as any) || 0;
  const totalCost = rec.totalCost !== undefined ? parseFloat(rec.totalCost as any) : (materialCost + laborCost);

  const record = {
    id,
    title: rec.title || 'Manutenção',
    description: rec.notes || null,
    category: rec.category || 'OUTRO',
    type: rec.maintenanceType || 'PREDIAL',
    nature: rec.category || 'CORRETIVA',
    equipment_or_area: rec.title || null,
    cost_parts: materialCost,
    cost_labor: laborCost,
    total_cost: totalCost,
    performed_by: rec.executedBy || null,
    service_date: rec.executionDate || new Date().toISOString().split('T')[0],
    notes: rec.notes || null
  };

  const { error } = await supabase.from('erp_maintenance_records').insert([record]);
  if (error) throw error;

  return {
    ...rec,
    id,
    title: record.title,
    maintenanceType: record.type as any,
    category: record.nature as any,
    executionDate: record.service_date,
    executedBy: record.performed_by || '',
    materialCost,
    laborCost,
    totalCost,
    notes: record.notes || '',
    createdAt: new Date().toISOString()
  } as MaintenanceRecord;
}

export async function updateMaintenanceRecord(rec: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
  const updateData: any = { updated_at: new Date().toISOString() };
  if (rec.title !== undefined) updateData.title = rec.title;
  if (rec.maintenanceType !== undefined) updateData.type = rec.maintenanceType;
  if (rec.category !== undefined) updateData.nature = rec.category;
  if (rec.materialCost !== undefined) updateData.cost_parts = parseFloat(rec.materialCost as any) || 0;
  if (rec.laborCost !== undefined) updateData.cost_labor = parseFloat(rec.laborCost as any) || 0;
  if (rec.totalCost !== undefined) updateData.total_cost = parseFloat(rec.totalCost as any) || 0;
  if (rec.executedBy !== undefined) updateData.performed_by = rec.executedBy;
  if (rec.executionDate !== undefined) updateData.service_date = rec.executionDate;
  if (rec.notes !== undefined) updateData.notes = rec.notes;

  const { error } = await supabase.from('erp_maintenance_records').update(updateData).eq('id', rec.id);
  if (error) throw error;
  return rec as MaintenanceRecord;
}

export async function deleteMaintenanceRecord(id: string): Promise<void> {
  const { error } = await supabase.from('erp_maintenance_records').delete().eq('id', id);
  if (error) throw error;
}

export async function getMaintenanceSummary(): Promise<MaintenanceSummary> {
  const records = await getMaintenanceRecords();
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const monthRecords = records.filter(r => r.executionDate && r.executionDate.startsWith(currentMonthStr));

  const totalSpentMonth = monthRecords.reduce((acc, r) => acc + r.totalCost, 0);
  const predialSpent = monthRecords.filter(r => r.maintenanceType === 'PREDIAL').reduce((acc, r) => acc + r.totalCost, 0);
  const equipmentsSpent = monthRecords.filter(r => r.maintenanceType === 'EQUIPAMENTOS').reduce((acc, r) => acc + r.totalCost, 0);
  const preventiveSpent = monthRecords.filter(r => r.category === 'PREVENTIVA').reduce((acc, r) => acc + r.totalCost, 0);
  const correctiveSpent = monthRecords.filter(r => r.category === 'CORRETIVA').reduce((acc, r) => acc + r.totalCost, 0);
  const totalLaborCost = records.reduce((acc, r) => acc + r.laborCost, 0);
  const totalMaterialCost = records.reduce((acc, r) => acc + r.materialCost, 0);

  return {
    totalSpentMonth,
    predialSpent,
    equipmentsSpent,
    preventiveSpent,
    correctiveSpent,
    totalLaborCost,
    totalMaterialCost,
    totalRecordsCount: records.length
  };
}

// --- 6. OPERATIONAL DASHBOARD SUMMARY ---
export async function getOperationalDashboardSummary(): Promise<OperationalDashboardSummary> {
  const [employees, tasks, cleaning, maintenance, uniforms] = await Promise.all([
    getEmployees(),
    getTasks(),
    getCleaningProducts(),
    getMaintenanceRecords(),
    getUniformItems()
  ]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Expiring documents
  const expiringDocumentsList: any[] = [];
  employees.forEach(emp => {
    (emp.documents || []).forEach(doc => {
      if (!doc.expirationDate) return;
      const exp = new Date(doc.expirationDate);
      exp.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        expiringDocumentsList.push({
          employeeName: emp.name,
          employeeRole: emp.role,
          docTitle: doc.title,
          expirationDate: doc.expirationDate,
          daysUntilExpiration: diffDays,
          isExpired: diffDays < 0
        });
      }
    });
  });

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const monthMaintenance = maintenance.filter(m => m.executionDate && m.executionDate.startsWith(currentMonthStr));
  const maintenanceCostMonth = monthMaintenance.reduce((acc, m) => acc + m.totalCost, 0);
  const predialCostMonth = monthMaintenance.filter(m => m.maintenanceType === 'PREDIAL').reduce((acc, m) => acc + m.totalCost, 0);
  const equipmentsCostMonth = monthMaintenance.filter(m => m.maintenanceType === 'EQUIPAMENTOS').reduce((acc, m) => acc + m.totalCost, 0);

  const pendingTasks = tasks.filter(t => t.status !== 'CONCLUIDA');
  const criticalCleaning = cleaning.filter(c => c.currentQuantity <= c.minQuantity);
  const totalUniformStock = uniforms.reduce((acc, u) => acc + u.currentQuantity, 0);
  const lowStockUniformCount = uniforms.filter(u => u.currentQuantity <= u.minQuantity).length;

  return {
    kpis: {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'ATIVO').length,
      expiringDocsCount: expiringDocumentsList.length,
      totalTasks: tasks.length,
      pendingTasksCount: pendingTasks.length,
      completedTasksCount: tasks.filter(t => t.status === 'CONCLUIDA').length,
      maintenanceCostMonth,
      predialCostMonth,
      equipmentsCostMonth,
      totalMaintenanceCount: maintenance.length,
      lowStockCleaningCount: criticalCleaning.length,
      totalCleaningProducts: cleaning.length,
      lowStockUniformCount,
      totalUniformStock
    },
    expiringDocumentsList,
    recentMaintenance: maintenance.slice(0, 5),
    urgentTasks: pendingTasks.slice(0, 5),
    criticalCleaningProducts: criticalCleaning.slice(0, 5)
  };
}

// --- 7. SETTINGS ---
export async function getSettings(): Promise<AppSetting> {
  const { data } = await supabase.from('erp_settings').select('*').eq('id', 'default').single();
  return {
    id: data?.id || 'default',
    excelFilePath: '',
    syncIntervalSeconds: 0,
    autoSyncEnabled: false,
    lastSyncedAt: null,
    columnMapping: {} as any
  };
}

export async function saveSettings(settings: Partial<AppSetting>): Promise<AppSetting> {
  await supabase.from('erp_settings').upsert({
    id: 'default',
    system_name: 'ERP Recepção Pro v2.0',
    gym_name: 'Panobianco Boituva',
    auto_sync_enabled: false,
    updated_at: new Date().toISOString()
  });
  return {
    id: 'default',
    excelFilePath: '',
    syncIntervalSeconds: 0,
    autoSyncEnabled: false,
    lastSyncedAt: null,
    columnMapping: {} as any
  };
}

// --- 8. BORDERÔS SEMANAIS & CONTAS A PAGAR ---
export async function getBorderos(): Promise<BorderoWeekly[]> {
  const { data: borderos, error: bErr } = await supabase
    .from('erp_borderos')
    .select('*')
    .order('start_date', { ascending: false });

  if (bErr) {
    console.error('Erro ao buscar borderôs:', bErr);
    return [];
  }

  const { data: items, error: iErr } = await supabase
    .from('erp_bordero_items')
    .select('*')
    .order('due_date', { ascending: true })
    .order('amount', { ascending: false });

  if (iErr) {
    console.error('Erro ao buscar itens de borderô:', iErr);
  }

  const itemsByBordero: Record<string, BorderoItem[]> = {};
  (items || []).forEach(item => {
    if (!itemsByBordero[item.bordero_id]) itemsByBordero[item.bordero_id] = [];
    itemsByBordero[item.bordero_id].push({
      id: item.id,
      borderoId: item.bordero_id,
      recipient: item.recipient,
      description: item.description || '',
      dueDate: item.due_date,
      amount: Number(item.amount) || 0,
      billType: item.bill_type || 'OUTRO',
      barcode: item.barcode || '',
      status: item.status || 'PENDENTE',
      paidAt: item.paid_at || null,
      notes: item.notes || '',
      createdAt: item.created_at,
      updatedAt: item.updated_at
    });
  });

  return (borderos || []).map(b => ({
    id: b.id,
    title: b.title,
    startDate: b.start_date,
    endDate: b.end_date,
    notes: b.notes || '',
    items: itemsByBordero[b.id] || [],
    createdAt: b.created_at,
    updatedAt: b.updated_at
  }));
}

export async function createBordero(data: Partial<BorderoWeekly>): Promise<BorderoWeekly> {
  const id = `bordero_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record = {
    id,
    title: data.title || `Borderô Semanal (${data.startDate || ''} a ${data.endDate || ''})`,
    start_date: data.startDate || new Date().toISOString().split('T')[0],
    end_date: data.endDate || new Date().toISOString().split('T')[0],
    notes: data.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('erp_borderos').insert([record]);
  if (error) throw error;

  return {
    id,
    title: record.title,
    startDate: record.start_date,
    endDate: record.end_date,
    notes: record.notes || '',
    items: [],
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export async function updateBordero(id: string, data: Partial<BorderoWeekly>): Promise<void> {
  const updateData: any = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.startDate !== undefined) updateData.start_date = data.startDate;
  if (data.endDate !== undefined) updateData.end_date = data.endDate;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { error } = await supabase.from('erp_borderos').update(updateData).eq('id', id);
  if (error) throw error;
}

export async function deleteBordero(id: string): Promise<void> {
  const { error } = await supabase.from('erp_borderos').delete().eq('id', id);
  if (error) throw error;
}

export async function addBorderoItem(borderoId: string, item: Partial<BorderoItem>): Promise<BorderoItem> {
  const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record = {
    id,
    bordero_id: borderoId,
    recipient: item.recipient || 'Nova Conta',
    description: item.description || null,
    due_date: item.dueDate || new Date().toISOString().split('T')[0],
    amount: item.amount !== undefined ? Number(item.amount) : 0,
    bill_type: item.billType || 'OUTRO',
    barcode: item.barcode || null,
    status: item.status || 'PENDENTE',
    paid_at: item.status === 'PAGO' ? new Date().toISOString() : null,
    notes: item.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('erp_bordero_items').insert([record]);
  if (error) throw error;

  return {
    id,
    borderoId,
    recipient: record.recipient,
    description: record.description || '',
    dueDate: record.due_date,
    amount: record.amount,
    billType: record.bill_type as any,
    barcode: record.barcode || '',
    status: record.status as any,
    paidAt: record.paid_at,
    notes: record.notes || '',
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export async function updateBorderoItem(itemId: string, item: Partial<BorderoItem>): Promise<void> {
  const updateData: any = { updated_at: new Date().toISOString() };
  if (item.recipient !== undefined) updateData.recipient = item.recipient;
  if (item.description !== undefined) updateData.description = item.description;
  if (item.dueDate !== undefined) updateData.due_date = item.dueDate;
  if (item.amount !== undefined) updateData.amount = Number(item.amount);
  if (item.billType !== undefined) updateData.bill_type = item.billType;
  if (item.barcode !== undefined) updateData.barcode = item.barcode;
  if (item.notes !== undefined) updateData.notes = item.notes;
  if (item.status !== undefined) {
    updateData.status = item.status;
    updateData.paid_at = item.status === 'PAGO' ? (item.paidAt || new Date().toISOString()) : null;
  }

  const { error } = await supabase.from('erp_bordero_items').update(updateData).eq('id', itemId);
  if (error) throw error;
}

export async function deleteBorderoItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('erp_bordero_items').delete().eq('id', itemId);
  if (error) throw error;
}

export async function toggleBorderoItemStatus(itemId: string, nextStatus: 'PENDENTE' | 'PAGO'): Promise<void> {
  const { error } = await supabase
    .from('erp_bordero_items')
    .update({
      status: nextStatus,
      paid_at: nextStatus === 'PAGO' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId);

  if (error) throw error;
}
