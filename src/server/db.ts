import fs from 'fs';
import path from 'path';
import { AppSetting, SyncLog, Product, SalesRecord, DataAnomaly, DashboardSummary } from '../shared/types.js';

interface DatabaseSchema {
  settings: AppSetting;
  syncLogs: SyncLog[];
  products: Product[];
  sales: SalesRecord[];
  anomalies: DataAnomaly[];
}

const DB_PATH = path.join(process.cwd(), 'database_erp.json');

const DEFAULT_SETTINGS: AppSetting = {
  id: 'default',
  excelFilePath: path.join(process.cwd(), 'recepcao_vendas_academia.xlsx'),
  syncIntervalSeconds: 30,
  autoSyncEnabled: true,
  lastSyncedAt: null,
  columnMapping: {
    sheetName: 'Vendas',
    dateColumn: 'Data',
    productColumn: 'Produto',
    quantityColumn: 'Qtd',
    unitPriceColumn: 'Valor Unitário',
    totalPriceColumn: 'Total',
    paymentMethodColumn: 'Forma Pagamento',
    receptionistColumn: 'Recepcionista'
  }
};

let memoryDb: DatabaseSchema = {
  settings: DEFAULT_SETTINGS,
  syncLogs: [],
  products: [],
  sales: [],
  anomalies: []
};

export function initDatabase(): void {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      memoryDb = JSON.parse(data);
      console.log('✅ Banco de dados local carregado com sucesso.');
    } else {
      saveDatabase();
      console.log('✨ Novo banco de dados local inicializado.');
    }
  } catch (err) {
    console.error('❌ Erro ao inicializar banco de dados local:', err);
  }
}

export function saveDatabase(): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Erro ao salvar banco de dados local:', err);
  }
}

export function getSettings(): AppSetting {
  return memoryDb.settings;
}

export function updateSettings(newSettings: Partial<AppSetting>): AppSetting {
  memoryDb.settings = {
    ...memoryDb.settings,
    ...newSettings,
    columnMapping: {
      ...memoryDb.settings.columnMapping,
      ...(newSettings.columnMapping || {})
    }
  };
  saveDatabase();
  return memoryDb.settings;
}

export function addSyncLog(log: Omit<SyncLog, 'id' | 'syncedAt'>): SyncLog {
  const newLog: SyncLog = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    syncedAt: new Date().toISOString(),
    ...log
  };
  memoryDb.syncLogs.unshift(newLog);
  // Mantém apenas os últimos 100 logs
  if (memoryDb.syncLogs.length > 100) {
    memoryDb.syncLogs = memoryDb.syncLogs.slice(0, 100);
  }
  memoryDb.settings.lastSyncedAt = newLog.syncedAt;
  saveDatabase();
  return newLog;
}

export function getSyncLogs(): SyncLog[] {
  return memoryDb.syncLogs;
}

export function getProducts(): Product[] {
  return memoryDb.products;
}

export function upsertProduct(name: string, category: string = 'Geral', salePrice: number = 0): Product {
  const existing = memoryDb.products.find(p => p.name.toLowerCase() === name.toLowerCase());
  const now = new Date().toISOString();
  if (existing) {
    if (salePrice > 0 && existing.salePrice !== salePrice) {
      existing.salePrice = salePrice;
      existing.updatedAt = now;
    }
    return existing;
  }
  const newProduct: Product = {
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    code: `COD-${Date.now().toString().slice(-4)}`,
    name,
    brand: category || 'Geral',
    category,
    costPrice: Math.round(salePrice * 0.6 * 100) / 100, // Custo estimado para margem
    salePrice,
    minStockLevel: 5,
    currentStock: 0,
    totalPurchased: 0,
    totalSold: 0,
    createdAt: now,
    updatedAt: now
  };
  memoryDb.products.push(newProduct);
  saveDatabase();
  return newProduct;
}

export function addSaleRecord(sale: Omit<SalesRecord, 'id' | 'createdAt'>): boolean {
  // Evita duplicatas usando hashSignature
  const exists = memoryDb.sales.some(s => s.hashSignature === sale.hashSignature);
  if (exists) {
    return false; // Já importado anteriormente
  }

  const newSale: SalesRecord = {
    id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    ...sale
  };

  memoryDb.sales.unshift(newSale);

  // Atualiza estoque do produto se associado
  if (sale.productId) {
    const prod = memoryDb.products.find(p => p.id === sale.productId);
    if (prod) {
      prod.currentStock = Math.max(0, prod.currentStock - sale.quantity);
      prod.updatedAt = new Date().toISOString();
    }
  }

  saveDatabase();
  return true;
}

export function getSales(): SalesRecord[] {
  return memoryDb.sales;
}

export function addAnomaly(anomaly: Omit<DataAnomaly, 'id' | 'createdAt' | 'status'>): DataAnomaly {
  const newAnomaly: DataAnomaly = {
    id: `anom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    ...anomaly
  };
  memoryDb.anomalies.unshift(newAnomaly);
  saveDatabase();
  return newAnomaly;
}

export function getAnomalies(): DataAnomaly[] {
  return memoryDb.anomalies;
}

export function resolveAnomaly(id: string): boolean {
  const item = memoryDb.anomalies.find(a => a.id === id);
  if (item) {
    item.status = 'RESOLVED';
    saveDatabase();
    return true;
  }
  return false;
}

export function getDashboardSummary(): DashboardSummary {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const salesToday = memoryDb.sales.filter(s => s.saleDatetime.startsWith(todayStr));
  const revenueToday = salesToday.reduce((sum, s) => sum + s.totalPrice, 0);
  const revenueMonth = memoryDb.sales.reduce((sum, s) => sum + s.totalPrice, 0);

  // Agrupamento por Meio de Pagamento
  const paymentMap: Record<string, { total: number; count: number }> = {
    PIX: { total: 0, count: 0 },
    DINHEIRO: { total: 0, count: 0 },
    CARTAO_CREDITO: { total: 0, count: 0 },
    CARTAO_DEBITO: { total: 0, count: 0 },
    OUTROS: { total: 0, count: 0 }
  };

  memoryDb.sales.forEach(s => {
    const key = s.paymentMethod || 'OUTROS';
    if (!paymentMap[key]) {
      paymentMap[key] = { total: 0, count: 0 };
    }
    paymentMap[key].total += s.totalPrice;
    paymentMap[key].count += 1;
  });

  const salesByPaymentMethod = Object.entries(paymentMap).map(([method, data]) => ({
    method,
    total: Math.round(data.total * 100) / 100,
    count: data.count
  }));

  const lowStockAlerts = memoryDb.products.filter(p => p.currentStock <= p.minStockLevel).length;
  const pendingAnomalies = memoryDb.anomalies.filter(a => a.status === 'PENDING').length;

  return {
    kpis: {
      totalSalesToday: salesToday.length,
      revenueToday: Math.round(revenueToday * 100) / 100,
      revenueMonth: Math.round(revenueMonth * 100) / 100,
      totalProducts: memoryDb.products.length,
      lowStockAlerts,
      anomaliesCount: pendingAnomalies
    },
    salesByPaymentMethod,
    recentSales: memoryDb.sales.slice(0, 15),
    recentAnomalies: memoryDb.anomalies.slice(0, 10),
    latestSync: memoryDb.syncLogs[0] || null,
    syncStatus: 'IDLE'
  };
}
