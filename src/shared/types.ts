export interface ColumnMapping {
  dateColumn: string;
  productColumn: string;
  quantityColumn: string;
  unitPriceColumn: string;
  totalPriceColumn: string;
  paymentMethodColumn: string;
  receptionistColumn: string;
  customerColumn?: string;
  categoryColumn?: string;
  codeColumn?: string;
  sheetName: string;
}

export interface AppSetting {
  id: string;
  excelFilePath: string;
  syncIntervalSeconds: number;
  autoSyncEnabled: boolean;
  lastSyncedAt: string | null;
  columnMapping: ColumnMapping;
}

export interface SyncLog {
  id: string;
  syncedAt: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  rowsProcessed: number;
  rowsImported: number;
  errorsFound: number;
  executionTimeMs: number;
  details?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  costPrice: number;
  salePrice: number;
  minStockLevel: number;
  currentStock: number;
  totalPurchased: number;
  totalSold: number;
  isArchived?: boolean;
  lastPhysicalCountDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockEntry {
  id: string;
  date: string;
  code: string;
  category: string;
  productName: string;
  quantity: number;
  salePrice: number;
  estimatedCostPrice: number;
}

export interface ProductMargin {
  productId: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  costPrice: number;
  salePrice: number;
  marginAmount: number;
  marginPercent: number;
  totalSoldQty: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface InventoryIntelligence {
  productId: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  dailySalesRate: number;
  daysUntilStockout: number;
  suggestedReorderQty: number;
  stockStatus: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW' | 'OPTIMAL' | 'OVERSTOCKED';
  turnoverCategory: 'HIGH_TURNOVER' | 'MEDIUM_TURNOVER' | 'SLOW_MOVING';
}

export interface ReceptionistCashierSummary {
  receptionistName: string;
  totalSalesCount: number;
  totalRevenue: number;
  pixTotal: number;
  moneyTotal: number;
  creditCardTotal: number;
  debitCardTotal: number;
  otherTotal: number;
  averageTicket: number;
}

export interface FinancialDRE {
  period: string;
  grossRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  profitMarginPercent: number;
  totalTransactions: number;
  averageTicket: number;
  salesByPaymentMethod: {
    method: string;
    total: number;
    count: number;
  }[];
  receptionistPerformance: ReceptionistCashierSummary[];
}

export interface CleaningProduct {
  id: string;
  arrivalDate: string;
  name: string;
  category: 'DESINFETANTE' | 'DETERGENTE' | 'PAPEL' | 'PANOS_FLANELAS' | 'SABONETE' | 'OUTROS';
  unit: 'LITROS' | 'UNIDADES' | 'ROULOS' | 'CAIXAS' | 'KG';
  currentQuantity: number;
  minQuantity: number;
  unitCost: number;
  totalValue: number;
  supplier?: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  title: string;
  maintenanceType: 'PREDIAL' | 'EQUIPAMENTOS';
  category: 'PREVENTIVA' | 'CORRETIVA';
  executionDate: string;
  executedBy: string;
  materialCost: number;
  laborCost: number;
  totalCost: number;
  notes?: string;
  createdAt: string;
}

export interface MaintenanceSummary {
  totalSpentMonth: number;
  predialSpent: number;
  equipmentsSpent: number;
  preventiveSpent: number;
  correctiveSpent: number;
  totalLaborCost: number;
  totalMaterialCost: number;
  totalRecordsCount: number;
}

export interface UniformItem {
  id: string;
  name: string;
  type: 'CAMISETA' | 'CALCA' | 'BERMUDA' | 'AGASALHO' | 'REGATA' | 'AVENTAL' | 'OUTROS';
  size: 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XGG' | 'UNICO';
  currentQuantity: number;
  minQuantity: number;
  unitCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UniformDelivery {
  id: string;
  employeeName: string;
  employeeRole: string;
  uniformItemId: string;
  uniformName: string;
  size: string;
  quantity: number;
  deliveryDate: string;
  notes?: string;
  createdAt: string;
}

export interface UniformDiscard {
  id: string;
  uniformItemId: string;
  uniformName: string;
  size: string;
  quantity: number;
  reason: 'USO_EXCESSO' | 'DANIFICADO' | 'PERDA' | 'OUTRO';
  discardDate: string;
  notes?: string;
  createdAt: string;
}

export interface UniformSummary {
  totalStockItems: number;
  totalDeliveredItems: number;
  totalDiscardedItems: number;
  lowStockItemsCount: number;
}

export interface SalesRecord {
  id: string;
  excelRowIndex: number;
  rawProductName: string;
  productId: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: 'PIX' | 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'OUTROS';
  receptionistName: string;
  customerName?: string;
  saleDatetime: string;
  hashSignature: string;
  createdAt: string;
}

export interface DataAnomaly {
  id: string;
  excelRowIndex: number;
  fieldName: string;
  rawValue: string;
  issueDescription: string;
  status: 'PENDING' | 'RESOLVED' | 'IGNORED';
  createdAt: string;
}

export interface DashboardSummary {
  kpis: {
    totalSalesToday: number;
    revenueToday: number;
    revenueMonth: number;
    totalProducts: number;
    lowStockAlerts: number;
    anomaliesCount: number;
    totalProfitMonth?: number;
    criticalStockoutCount?: number;
  };
  salesByPaymentMethod: {
    method: string;
    total: number;
    count: number;
  }[];
  recentSales: SalesRecord[];
  recentAnomalies: DataAnomaly[];
  latestSync: SyncLog | null;
  syncStatus: 'IDLE' | 'SYNCING' | 'ERROR' | 'SUCCESS';
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  docType: 'CREF' | 'CONTRATO' | 'CONTRATO_ESTAGIO' | 'DOCUMENTO_PESSOAL' | 'ATESTADO_MEDICO' | 'CERTIFICADO' | 'OUTRO';
  title: string;
  fileName: string;
  fileDataUrl: string; // Base64 or Data URL for preview & download
  fileSizeFormatted?: string;
  issueDate?: string;
  expirationDate?: string | null;
  notes?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: 'PROFESSOR' | 'RECEPCAO' | 'GERENTE' | 'LIMPEZA' | 'MANUTENCAO' | 'ESTAGIARIO' | 'OUTRO';
  avatarUrl?: string;
  cpf?: string;
  rg?: string;
  crefNumber?: string;
  phone?: string;
  email?: string;
  admissionDate?: string;
  status: 'ATIVO' | 'INATIVO' | 'FERIAS' | 'AFASTADO';
  notes?: string;
  documents: EmployeeDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  category: 'RECEPCAO' | 'LIMPEZA' | 'MANUTENCAO' | 'GERENCIA' | 'GERAL';
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
  assignedTo?: string;
  dueDate?: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface OperationalDashboardSummary {
  kpis: {
    totalEmployees: number;
    activeEmployees: number;
    expiringDocsCount: number;
    totalTasks: number;
    pendingTasksCount: number;
    completedTasksCount: number;
    maintenanceCostMonth: number;
    predialCostMonth: number;
    equipmentsCostMonth: number;
    totalMaintenanceCount: number;
    lowStockCleaningCount: number;
    totalCleaningProducts: number;
    lowStockUniformCount: number;
    totalUniformStock: number;
  };
  expiringDocumentsList: {
    employeeName: string;
    employeeRole: string;
    docTitle: string;
    expirationDate: string;
    daysUntilExpiration: number;
    isExpired: boolean;
  }[];
  recentMaintenance: MaintenanceRecord[];
  urgentTasks: TaskItem[];
  criticalCleaningProducts: CleaningProduct[];
}

export type BorderoBillType = 
  | 'CONCESSIONARIA'
  | 'SISTEMA_BOLETO'
  | 'MARKETING'
  | 'GUIA_BOLETO'
  | 'PIX'
  | 'FOLHA_SALARIO'
  | 'OUTRO';

export interface BorderoItem {
  id: string;
  borderoId: string;
  recipient: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  billType: BorderoBillType;
  barcode?: string;
  status: 'PENDENTE' | 'PAGO';
  paidAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BorderoWeekly {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  notes?: string;
  items: BorderoItem[];
  createdAt: string;
  updatedAt?: string;
}

