import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import XLSX from 'xlsx';

const PORT = 3001;
const DB_PATH = path.join(process.cwd(), 'database_erp.json');
const DIST_PATH = fs.existsSync(path.join(process.cwd(), 'dist')) ? path.join(process.cwd(), 'dist') : process.cwd();

const DEFAULT_SETTINGS = {
  id: 'default',
  excelFilePath: '',
  syncIntervalSeconds: 0,
  autoSyncEnabled: false,
  lastSyncedAt: null,
  columnMapping: {}
};

let memoryDb = {
  settings: DEFAULT_SETTINGS,
  syncLogs: [],
  products: [],
  stockEntries: [],
  sales: [],
  anomalies: [],
  cleaningProducts: [],
  maintenanceRecords: [],
  uniformItems: [],
  uniformDeliveries: [],
  uniformDiscards: [],
  employees: [],
  tasks: []
};

function initDatabase() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      memoryDb = JSON.parse(data);
      if (!memoryDb.stockEntries) memoryDb.stockEntries = [];
      if (!memoryDb.cleaningProducts) memoryDb.cleaningProducts = [];
      if (!memoryDb.maintenanceRecords) memoryDb.maintenanceRecords = [];
      if (!memoryDb.uniformItems) memoryDb.uniformItems = [];
      if (!memoryDb.uniformDeliveries) memoryDb.uniformDeliveries = [];
      if (!memoryDb.uniformDiscards) memoryDb.uniformDiscards = [];
      if (!memoryDb.employees) memoryDb.employees = [];
      if (!memoryDb.tasks) memoryDb.tasks = [];
      if (!memoryDb.settings) memoryDb.settings = DEFAULT_SETTINGS;
      memoryDb.settings.autoSyncEnabled = false;
      memoryDb.settings.excelFilePath = '';
      memoryDb.syncLogs = [];
      console.log('✅ Banco de dados local do ERP Recepção carregado (Sincronização de planilha desativada).');
    } catch (e) {
      console.error('Erro ao ler DB:', e);
    }
  } else {
    saveDatabase();
    console.log('✨ Banco de dados local do ERP Recepção criado.');
  }
}

// --- SISTEMA DE PERSISTÊNCIA ATÔMICA COM BACKUP ---
let saveTimer = null;

function saveDatabase() {
  const tmpPath = DB_PATH + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(memoryDb, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

function saveDatabaseDebounced() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveDatabase();
    saveTimer = null;
  }, 500);
}

function createBackup() {
  if (fs.existsSync(DB_PATH)) {
    const backupDir = path.join(process.cwd(), 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `database_erp_${timestamp}.json`);
    fs.copyFileSync(DB_PATH, backupPath);
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('database_erp_'))
      .sort()
      .reverse();
    files.slice(10).forEach(f => fs.unlinkSync(path.join(backupDir, f)));
    console.log(`📦 Backup criado: ${backupPath}`);
  }
}

function getColumnValue(row, targetKeyName) {
  if (!row || !targetKeyName) return '';
  const cleanTarget = String(targetKeyName).trim().toLowerCase();
  for (const key of Object.keys(row)) {
    if (String(key).trim().toLowerCase() === cleanTarget) {
      return row[key];
    }
  }
  return '';
}

// --- FUNÇÕES UTILITÁRIAS CENTRALIZADAS ---
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

function normalizePaymentMethod(raw) {
  const upper = String(raw || '').toUpperCase().trim();
  if (upper.includes('PIX')) return 'PIX';
  if (upper.includes('DINHEIRO') || upper.includes('ESPECIE')) return 'DINHEIRO';
  if (upper.includes('CREDITO') || upper.includes('CRÉDITO')) return 'CARTAO_CREDITO';
  if (upper.includes('DEBITO') || upper.includes('DÉBITO')) return 'CARTAO_DEBITO';
  return 'OUTROS';
}

function extractBrandFromName(productName) {
  const name = productName.toUpperCase();
  if (name.includes('LINDOYA')) return 'Lindoya';
  if (name.includes('BIOLEVE')) return 'Bioleve';
  if (name.includes('CLARISSIMA') || name.includes('CLARÍSSIMA')) return 'Claríssima';
  if (name.includes('SHARKPRO') || name.includes('V9PUMP')) return 'SharkPro';
  if (name.includes('MONSTRER LABZ') || name.includes('MONSTER')) return 'Monster Labz';
  if (name.includes('NUTRATA') || name.includes('PROTOBAR')) return 'Nutrata';
  if (name.includes('OVOMALTINE') || name.includes('CRISP')) return 'Nutrata Crisp';
  if (name.includes('MAX TITANIUM') || name.includes('MAX')) return 'Max Titanium';
  if (name.includes('ADAPTOGEN') || name.includes('HITPROTEIN') || name.includes('PANIC')) return 'Adaptogen';
  if (name.includes('LAUTON')) return 'Lauton';
  if (name.includes('BLACK SKULL')) return 'Black Skull';
  if (name.includes('UNIVERSAL')) return 'Universal';
  if (name.includes('CANIBAL')) return 'Canibal';
  if (name.includes('RED BULL')) return 'Red Bull';
  if (name.includes('YOPRO')) return 'YoPro';
  if (name.includes('PANOBIANCO')) return 'Panobianco';
  return 'Marca Diversa';
}

function resolveExcelPath(rawPath) {
  if (!rawPath) return '';
  let cleaned = rawPath.trim();

  if (cleaned.toLowerCase().includes('d.docs.live.net') || cleaned.toLowerCase().includes('http://') || cleaned.toLowerCase().includes('https://')) {
    let decoded = decodeURIComponent(cleaned);
    let subPath = '';
    if (decoded.includes('live.net/')) {
      let parts = decoded.split('live.net/')[1] || '';
      subPath = parts.replace(/^[0-9a-fA-F]+\//, '');
    } else {
      subPath = decoded;
    }
    subPath = subPath.replace(/\//g, '\\');

    const userHome = process.env.USERPROFILE || 'C:\\Users\\User';
    const candidates = [
      path.join(userHome, subPath),
      path.join(userHome, 'OneDrive', subPath),
      path.join(userHome, 'OneDrive - DAVIANNY BRUNA SOUZA', subPath),
      path.join(userHome, 'Desktop', subPath),
      path.join('C:\\Users\\User', subPath)
    ];

    for (let c of candidates) {
      if (fs.existsSync(c)) return c;
    }
  }

  return cleaned;
}

let isSyncRunning = false;

function processExcelSync() {
  if (!memoryDb.settings || !memoryDb.settings.autoSyncEnabled || !memoryDb.settings.excelFilePath) {
    return { success: true, rowsProcessed: 0, rowsImported: 0, errorsCount: 0 };
  }
  if (isSyncRunning) {
    return { success: false, rowsProcessed: 0, rowsImported: 0, errorsCount: 0 };
  }
  isSyncRunning = true;

  const startTime = Date.now();
  const rawPath = memoryDb.settings.excelFilePath;
  const filePath = resolveExcelPath(rawPath);

  if (!fs.existsSync(filePath)) {
    isSyncRunning = false;
    return { success: false, rowsProcessed: 0, rowsImported: 0, errorsCount: 0 };
  }

  let rowsProcessed = 0;
  let rowsImported = 0;
  let errorsCount = 0;
  let tempCopy = null;

  try {
    createBackup();
    tempCopy = path.join(os.tmpdir(), `shadow_${Date.now()}_vendas.xlsx`);
    fs.copyFileSync(filePath, tempCopy);

    const workbook = XLSX.readFile(tempCopy, { cellDates: true });
    const map = memoryDb.settings.columnMapping;
    const sheetName = map.sheetName || 'VENDAS';
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) throw new Error(`Aba "${sheetName}" não encontrada no arquivo Excel.`);

    if (workbook.Sheets['ENTRADA DE PRODUTO']) {
      const entryRows = XLSX.utils.sheet_to_json(workbook.Sheets['ENTRADA DE PRODUTO'], { defval: '' });
      memoryDb.stockEntries = [];
      entryRows.forEach((eRow, idx) => {
        const pName = String(eRow['PRODUTO'] || '').trim();
        const code = String(eRow['COD (ÚNICO)'] || '').trim();
        const category = String(eRow['CATEGORIA'] || 'Geral').trim();
        const qty = parseFloat(eRow['QUANTIDADE']) || 0;
        const sPrice = parseFloat(eRow['PREÇO DE VENDA']) || 0;
        const rawDate = eRow['DATA'] ? new Date(eRow['DATA']).toISOString() : new Date().toISOString();

        if (pName) {
          memoryDb.stockEntries.push({
            id: `entry_${idx}_${code}`,
            date: rawDate,
            code,
            category,
            productName: pName,
            quantity: qty,
            salePrice: sPrice,
            estimatedCostPrice: Math.round(sPrice * 0.6 * 100) / 100
          });
        }
      });
    }

    if (workbook.Sheets['ESTOQUE']) {
      const stockRows = XLSX.utils.sheet_to_json(workbook.Sheets['ESTOQUE'], { defval: '' });
      stockRows.forEach(sRow => {
        const pName = String(sRow['PRODUTO'] || sRow['DESCRIÇÃO'] || '').trim();
        const code = String(sRow['COD (LOTE)'] || sRow['COD (ÚNICO)'] || '').trim();

        if (pName) {
          const category = String(sRow['CATEGORIA'] || 'Geral').trim();
          const salePrice = parseFloat(sRow['VENDA']) || 0;
          const currentStock = parseFloat(sRow['EM ESTOQUE']) || 0;
          const totalPurchased = parseFloat(sRow['COMPRA']) || 0;
          
          let prod = memoryDb.products.find(p => p.name.toLowerCase() === pName.toLowerCase());
          if (!prod) {
            prod = {
              id: generateId('prod'),
              code,
              name: pName,
              brand: extractBrandFromName(pName),
              category,
              costPrice: Math.round(salePrice * 0.6 * 100) / 100,
              salePrice,
              minStockLevel: 5,
              currentStock,
              totalPurchased,
              totalSold: 0,
              isArchived: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            memoryDb.products.push(prod);
          } else {
            if (!prod.lastPhysicalCountDate) {
              prod.currentStock = currentStock;
            }
            prod.totalPurchased = totalPurchased;
            if (code) prod.code = code;
          }
        }
      });
    }

    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    rowsProcessed = rawRows.length;

    // [FIX #5] Set O(1) para deduplicação — evita O(N) por linha
    const existingHashes = new Set(memoryDb.sales.map(s => s.hashSignature));

    rawRows.forEach((row, idx) => {
      const rowIndex = idx + 2;
      const rawProduct = String(getColumnValue(row, map.productColumn) || getColumnValue(row, 'PRODUTO') || '').trim();
      const rawUnitPrice = parseFloat(getColumnValue(row, map.unitPriceColumn));
      const rawQty = parseFloat(getColumnValue(row, map.quantityColumn));
      const rawDateVal = getColumnValue(row, map.dateColumn);
      const rawDate = rawDateVal ? new Date(rawDateVal).toISOString() : new Date().toISOString();
      const rawPayment = String(getColumnValue(row, map.paymentMethodColumn) || '').trim().toUpperCase();
      const receptionist = String(getColumnValue(row, map.receptionistColumn) || 'Recepção').trim().toUpperCase();
      const category = String(getColumnValue(row, map.categoryColumn) || 'Geral').trim();
      const customer = String(getColumnValue(row, map.customerColumn) || 'Não Informado').trim();
      const codeUnico = String(getColumnValue(row, map.codeColumn) || getColumnValue(row, 'COD (ÚNICO)') || '').trim();
      const codeVenda = String(getColumnValue(row, 'COD VENDA') || '').trim();

      if (!rawProduct) {
        memoryDb.anomalies.unshift({
          id: generateId('anom'),
          excelRowIndex: rowIndex,
          fieldName: 'Descrição do Produto',
          rawValue: '',
          issueDescription: 'Nome do produto em branco na linha da planilha',
          status: 'PENDING',
          createdAt: new Date().toISOString()
        });
        errorsCount++;
        return;
      }

      if (isNaN(rawUnitPrice) || rawUnitPrice <= 0) {
        memoryDb.anomalies.unshift({
          id: generateId('anom'),
          excelRowIndex: rowIndex,
          fieldName: 'Valor Unitário',
          rawValue: String(getColumnValue(row, map.unitPriceColumn)),
          issueDescription: `Preço zero ou inválido para "${rawProduct}"`,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        });
        errorsCount++;
        return;
      }

      const qty = isNaN(rawQty) || rawQty <= 0 ? 1 : rawQty;
      const totalPrice = parseFloat(getColumnValue(row, map.totalPriceColumn)) || (qty * rawUnitPrice);
      const paymentMethod = normalizePaymentMethod(rawPayment);

      let prod = memoryDb.products.find(p => p.name.toLowerCase() === rawProduct.toLowerCase());
      if (!prod) {
        prod = {
          id: generateId('prod'),
          code: codeUnico,
          name: rawProduct,
          brand: extractBrandFromName(rawProduct),
          category,
          costPrice: Math.round(rawUnitPrice * 0.6 * 100) / 100,
          salePrice: rawUnitPrice,
          minStockLevel: 5,
          currentStock: 0,
          totalPurchased: 0,
          totalSold: 0,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        memoryDb.products.push(prod);
      }

      const hashStr = `${codeVenda}_${rawDate}_${rawProduct}_${qty}_${rawUnitPrice}_${paymentMethod}_${receptionist}_${customer}`;
      const hashSignature = crypto.createHash('sha256').update(hashStr).digest('hex');

      // [FIX #1] totalSold só incrementa quando venda é NOVA (evita inflação a cada sync)
      const exists = existingHashes.has(hashSignature);
      if (!exists) {
        prod.totalSold = (prod.totalSold || 0) + qty;
        existingHashes.add(hashSignature);
        memoryDb.sales.unshift({
          id: generateId('sale'),
          excelRowIndex: rowIndex,
          rawProductName: rawProduct,
          productId: prod.id,
          quantity: qty,
          unitPrice: rawUnitPrice,
          totalPrice,
          paymentMethod,
          receptionistName: receptionist,
          customerName: customer,
          saleDatetime: rawDate,
          saleCode: codeVenda || '',
          hashSignature,
          createdAt: new Date().toISOString()
        });
        rowsImported++;
      }
    });

    const execTime = Date.now() - startTime;
    const syncLog = {
      id: `sync_${Date.now()}`,
      syncedAt: new Date().toISOString(),
      status: errorsCount > 0 ? 'WARNING' : 'SUCCESS',
      rowsProcessed,
      rowsImported,
      errorsFound: errorsCount,
      executionTimeMs: execTime,
      details: `Planilha VENDASPB sincronizada com sucesso! ${rowsImported} novas vendas importadas.`
    };

    memoryDb.syncLogs.unshift(syncLog);
    // [FIX #6] Limitar logs para evitar crescimento ilimitado de memória
    if (memoryDb.syncLogs.length > 500) memoryDb.syncLogs.length = 500;
    if (memoryDb.anomalies.length > 500) memoryDb.anomalies.length = 500;
    memoryDb.settings.lastSyncedAt = syncLog.syncedAt;
    saveDatabase();

    console.log(`✅ Sincronização concluída: ${rowsImported} novas vendas, ${memoryDb.products.length} produtos cadastrados.`);
    return { success: true, rowsProcessed, rowsImported, errorsCount };
  } catch (err) {
    console.error('❌ Erro na sincronização da planilha:', err);
    return { success: false, rowsProcessed: 0, rowsImported: 0, errorsCount: 1 };
  } finally {
    if (tempCopy && fs.existsSync(tempCopy)) {
      try { fs.unlinkSync(tempCopy); } catch (_) {}
    }
    isSyncRunning = false;
  }
}

function getProductMargins() {
  return memoryDb.products.filter(p => !p.isArchived).map(prod => {
    const prodSales = memoryDb.sales.filter(s => s.productId === prod.id || s.rawProductName.toLowerCase() === prod.name.toLowerCase());
    const totalSoldQty = prodSales.reduce((acc, s) => acc + s.quantity, 0);
    const totalRevenue = prodSales.reduce((acc, s) => acc + s.totalPrice, 0);
    const totalCost = totalSoldQty * prod.costPrice;
    const totalProfit = totalRevenue - totalCost;
    const marginAmount = prod.salePrice - prod.costPrice;
    const marginPercent = prod.salePrice > 0 ? (marginAmount / prod.salePrice) * 100 : 0;

    return {
      productId: prod.id,
      code: prod.code || '',
      name: prod.name,
      brand: prod.brand || extractBrandFromName(prod.name),
      category: prod.category,
      costPrice: prod.costPrice,
      salePrice: prod.salePrice,
      marginAmount: Math.round(marginAmount * 100) / 100,
      marginPercent: Math.round(marginPercent * 10) / 10,
      totalSoldQty,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100
    };
  });
}

function getInventoryIntelligence() {
  return memoryDb.products.filter(p => !p.isArchived).map(prod => {
    const prodSales = memoryDb.sales.filter(s => s.productId === prod.id || s.rawProductName.toLowerCase() === prod.name.toLowerCase());
    const totalSoldQty = prodSales.reduce((acc, s) => acc + s.quantity, 0);
    
    const dailySalesRate = Math.round((totalSoldQty / 30) * 100) / 100;
    
    let daysUntilStockout = 999;
    if (dailySalesRate > 0) {
      daysUntilStockout = Math.round((prod.currentStock / dailySalesRate) * 10) / 10;
    } else if (prod.currentStock <= 0) {
      daysUntilStockout = 0;
    }

    const targetStockLevel = (dailySalesRate * 15) + (prod.minStockLevel || 5);
    const suggestedReorderQty = Math.max(0, Math.ceil(targetStockLevel - prod.currentStock));

    let stockStatus = 'OPTIMAL';
    if (prod.currentStock <= 0) {
      stockStatus = 'OUT_OF_STOCK';
    } else if (prod.currentStock <= (prod.minStockLevel || 5)) {
      stockStatus = 'CRITICAL';
    } else if (daysUntilStockout <= 5) {
      stockStatus = 'LOW';
    } else if (daysUntilStockout > 60) {
      stockStatus = 'OVERSTOCKED';
    }

    let turnoverCategory = 'MEDIUM_TURNOVER';
    if (totalSoldQty >= 20) {
      turnoverCategory = 'HIGH_TURNOVER';
    } else if (totalSoldQty <= 3) {
      turnoverCategory = 'SLOW_MOVING';
    }

    return {
      productId: prod.id,
      code: prod.code || '',
      name: prod.name,
      brand: prod.brand || extractBrandFromName(prod.name),
      category: prod.category,
      currentStock: prod.currentStock,
      minStockLevel: prod.minStockLevel || 5,
      dailySalesRate,
      daysUntilStockout,
      suggestedReorderQty,
      stockStatus,
      turnoverCategory
    };
  });
}

function getReceptionistCashierSummary() {
  const receptionistMap = {};

  memoryDb.sales.forEach(sale => {
    const recName = sale.receptionistName || 'RECEPÇÃO';
    if (!receptionistMap[recName]) {
      receptionistMap[recName] = {
        receptionistName: recName,
        totalSalesCount: 0,
        totalRevenue: 0,
        pixTotal: 0,
        moneyTotal: 0,
        creditCardTotal: 0,
        debitCardTotal: 0,
        otherTotal: 0
      };
    }

    const rec = receptionistMap[recName];
    rec.totalSalesCount += 1;
    rec.totalRevenue += sale.totalPrice;

    if (sale.paymentMethod === 'PIX') rec.pixTotal += sale.totalPrice;
    else if (sale.paymentMethod === 'DINHEIRO') rec.moneyTotal += sale.totalPrice;
    else if (sale.paymentMethod === 'CARTAO_CREDITO') rec.creditCardTotal += sale.totalPrice;
    else if (sale.paymentMethod === 'CARTAO_DEBITO') rec.debitCardTotal += sale.totalPrice;
    else rec.otherTotal += sale.totalPrice;
  });

  return Object.values(receptionistMap).map(rec => ({
    ...rec,
    totalRevenue: Math.round(rec.totalRevenue * 100) / 100,
    pixTotal: Math.round(rec.pixTotal * 100) / 100,
    moneyTotal: Math.round(rec.moneyTotal * 100) / 100,
    creditCardTotal: Math.round(rec.creditCardTotal * 100) / 100,
    debitCardTotal: Math.round(rec.debitCardTotal * 100) / 100,
    otherTotal: Math.round(rec.otherTotal * 100) / 100,
    averageTicket: rec.totalSalesCount > 0 ? Math.round((rec.totalRevenue / rec.totalSalesCount) * 100) / 100 : 0
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

function getFinancialDRE() {
  const grossRevenue = memoryDb.sales.reduce((acc, s) => acc + s.totalPrice, 0);
  
  let costOfGoodsSold = 0;
  memoryDb.sales.forEach(sale => {
    const prod = memoryDb.products.find(p => p.id === sale.productId || p.name.toLowerCase() === sale.rawProductName.toLowerCase());
    const cost = prod ? prod.costPrice : (sale.unitPrice * 0.6);
    costOfGoodsSold += (cost * sale.quantity);
  });

  const grossProfit = grossRevenue - costOfGoodsSold;
  const profitMarginPercent = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
  const totalTransactions = memoryDb.sales.length;
  const averageTicket = totalTransactions > 0 ? (grossRevenue / totalTransactions) : 0;

  const paymentMap = { PIX: { total: 0, count: 0 }, DINHEIRO: { total: 0, count: 0 }, CARTAO_CREDITO: { total: 0, count: 0 }, CARTAO_DEBITO: { total: 0, count: 0 }, OUTROS: { total: 0, count: 0 } };
  memoryDb.sales.forEach(s => {
    const k = paymentMap[s.paymentMethod] ? s.paymentMethod : 'OUTROS';
    paymentMap[k].total += s.totalPrice;
    paymentMap[k].count += 1;
  });

  const salesByPaymentMethod = Object.entries(paymentMap).map(([method, d]) => ({ method, total: Math.round(d.total * 100) / 100, count: d.count }));

  return {
    period: 'Consolidado Geral VENDASPB',
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    costOfGoodsSold: Math.round(costOfGoodsSold * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
    totalTransactions,
    averageTicket: Math.round(averageTicket * 100) / 100,
    salesByPaymentMethod,
    receptionistPerformance: getReceptionistCashierSummary()
  };
}

function getMaintenanceSummary() {
  const records = memoryDb.maintenanceRecords || [];
  let predialSpent = 0;
  let equipmentsSpent = 0;
  let preventiveSpent = 0;
  let correctiveSpent = 0;
  let totalLaborCost = 0;
  let totalMaterialCost = 0;

  records.forEach(r => {
    const total = parseFloat(r.totalCost) || 0;
    const mat = parseFloat(r.materialCost) || 0;
    const lab = parseFloat(r.laborCost) || 0;

    totalMaterialCost += mat;
    totalLaborCost += lab;

    if (r.maintenanceType === 'PREDIAL') predialSpent += total;
    else if (r.maintenanceType === 'EQUIPAMENTOS') equipmentsSpent += total;

    if (r.category === 'PREVENTIVA') preventiveSpent += total;
    else if (r.category === 'CORRETIVA') correctiveSpent += total;
  });

  const totalSpentMonth = predialSpent + equipmentsSpent;

  return {
    totalSpentMonth: Math.round(totalSpentMonth * 100) / 100,
    predialSpent: Math.round(predialSpent * 100) / 100,
    equipmentsSpent: Math.round(equipmentsSpent * 100) / 100,
    preventiveSpent: Math.round(preventiveSpent * 100) / 100,
    correctiveSpent: Math.round(correctiveSpent * 100) / 100,
    totalLaborCost: Math.round(totalLaborCost * 100) / 100,
    totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
    totalRecordsCount: records.length
  };
}

function getUniformSummary() {
  const stock = memoryDb.uniformItems || [];
  const deliveries = memoryDb.uniformDeliveries || [];
  const discards = memoryDb.uniformDiscards || [];

  const totalStockItems = stock.reduce((sum, item) => sum + (parseFloat(item.currentQuantity) || 0), 0);
  const totalDeliveredItems = deliveries.reduce((sum, d) => sum + (parseFloat(d.quantity) || 0), 0);
  const totalDiscardedItems = discards.reduce((sum, d) => sum + (parseFloat(d.quantity) || 0), 0);
  const lowStockItemsCount = stock.filter(item => (parseFloat(item.currentQuantity) || 0) <= (parseFloat(item.minQuantity) || 2)).length;

  return {
    totalStockItems,
    totalDeliveredItems,
    totalDiscardedItems,
    lowStockItemsCount
  };
}

function getDashboardSummary() {
  const todayStr = new Date().toISOString().split('T')[0];
  const salesToday = memoryDb.sales.filter(s => s.saleDatetime.startsWith(todayStr));
  const revenueToday = salesToday.reduce((sum, s) => sum + s.totalPrice, 0);
  const revenueMonth = memoryDb.sales.reduce((sum, s) => sum + s.totalPrice, 0);

  const margins = getProductMargins();
  const totalProfitMonth = margins.reduce((acc, m) => acc + m.totalProfit, 0);

  const intelligence = getInventoryIntelligence();
  const criticalStockoutCount = intelligence.filter(i => i.stockStatus === 'OUT_OF_STOCK' || i.stockStatus === 'CRITICAL').length;

  const paymentMap = { PIX: { total: 0, count: 0 }, DINHEIRO: { total: 0, count: 0 }, CARTAO_CREDITO: { total: 0, count: 0 }, CARTAO_DEBITO: { total: 0, count: 0 }, OUTROS: { total: 0, count: 0 } };
  memoryDb.sales.forEach(s => {
    const k = paymentMap[s.paymentMethod] ? s.paymentMethod : 'OUTROS';
    paymentMap[k].total += s.totalPrice;
    paymentMap[k].count += 1;
  });

  const salesByPaymentMethod = Object.entries(paymentMap).map(([method, d]) => ({ method, total: Math.round(d.total * 100) / 100, count: d.count }));
  const activeProducts = memoryDb.products.filter(p => !p.isArchived);
  const lowStockAlerts = activeProducts.filter(p => p.currentStock <= p.minStockLevel).length;
  const pendingAnomalies = memoryDb.anomalies.filter(a => a.status === 'PENDING').length;

  return {
    kpis: {
      totalSalesToday: salesToday.length,
      revenueToday: Math.round(revenueToday * 100) / 100,
      revenueMonth: Math.round(revenueMonth * 100) / 100,
      totalProducts: activeProducts.length,
      lowStockAlerts,
      anomaliesCount: pendingAnomalies,
      totalProfitMonth: Math.round(totalProfitMonth * 100) / 100,
      criticalStockoutCount
    },
    salesByPaymentMethod,
    recentSales: memoryDb.sales.slice(0, 20),
    recentAnomalies: memoryDb.anomalies.slice(0, 10),
    latestSync: memoryDb.syncLogs[0] || null,
    syncStatus: isSyncRunning ? 'SYNCING' : 'IDLE'
  };
}

function getOperationalSummary() {
  const employees = memoryDb.employees || [];
  const activeEmployees = employees.filter(e => e.status === 'ATIVO');
  
  const now = new Date();
  const expiringDocumentsList = [];
  
  employees.forEach(emp => {
    (emp.documents || []).forEach(doc => {
      if (doc.expirationDate) {
        const exp = new Date(doc.expirationDate);
        const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
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
      }
    });
  });

  expiringDocumentsList.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);

  const tasks = memoryDb.tasks || [];
  const pendingTasks = tasks.filter(t => t.status !== 'CONCLUIDA');
  const completedTasks = tasks.filter(t => t.status === 'CONCLUIDA');

  const maintenanceSummary = getMaintenanceSummary();
  const uniformSummary = getUniformSummary();

  const cleaningProducts = memoryDb.cleaningProducts || [];
  const criticalCleaningProducts = cleaningProducts.filter(p => (parseFloat(p.currentQuantity) || 0) <= (parseFloat(p.minQuantity) || 0));

  const urgentTasks = pendingTasks
    .slice()
    .sort((a, b) => {
      const pOrder = { ALTA: 1, MEDIA: 2, BAIXA: 3 };
      return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
    })
    .slice(0, 8);

  return {
    kpis: {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      expiringDocsCount: expiringDocumentsList.length,
      totalTasks: tasks.length,
      pendingTasksCount: pendingTasks.length,
      completedTasksCount: completedTasks.length,
      maintenanceCostMonth: maintenanceSummary.totalSpentMonth,
      predialCostMonth: maintenanceSummary.predialSpent,
      equipmentsCostMonth: maintenanceSummary.equipmentsSpent,
      totalMaintenanceCount: maintenanceSummary.totalRecordsCount,
      lowStockCleaningCount: criticalCleaningProducts.length,
      totalCleaningProducts: cleaningProducts.length,
      lowStockUniformCount: uniformSummary.lowStockItemsCount,
      totalUniformStock: uniformSummary.totalStockItems
    },
    expiringDocumentsList: expiringDocumentsList.slice(0, 10),
    recentMaintenance: (memoryDb.maintenanceRecords || []).slice(0, 5),
    urgentTasks,
    criticalCleaningProducts: criticalCleaningProducts.slice(0, 6)
  };
}


function serveStaticFile(req, res) {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/') reqUrl = '/index.html';
  const filePath = path.join(DIST_PATH, reqUrl);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    let mimeType = 'text/html';
    if (ext === '.js') mimeType = 'text/javascript';
    else if (ext === '.css') mimeType = 'text/css';
    else if (ext === '.json') mimeType = 'application/json';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.jpg') mimeType = 'image/jpeg';
    else if (ext === '.svg') mimeType = 'image/svg+xml';

    res.writeHead(200, { 'Content-Type': mimeType });
    fs.createReadStream(filePath).pipe(res);
    return true;
  }

  const indexPath = path.join(DIST_PATH, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
    return true;
  }

  return false;
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

// --- AUTO-SYNC DESATIVADO ---
let autoSyncInterval = null;

function startAutoSync() {
  if (autoSyncInterval) { clearInterval(autoSyncInterval); autoSyncInterval = null; }
}

initDatabase();
// Sincronização de planilha 100% desativada. O ERP opera de forma independente e local.

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // [FIX #7] Sanitizar URL removendo query string para evitar 404 com parâmetros
  const url = req.url.split('?')[0];

  if (url === '/api/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ONLINE', system: 'ERP Recepção v1.6 Pro', timestamp: new Date().toISOString() }));
  } else if (url === '/api/settings' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memoryDb.settings));
  } else if (url === '/api/settings' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      if (data.syncIntervalSeconds !== undefined) memoryDb.settings.syncIntervalSeconds = data.syncIntervalSeconds;
      memoryDb.settings.autoSyncEnabled = false;
      memoryDb.settings.excelFilePath = '';
      saveDatabaseDebounced();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(memoryDb.settings));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao salvar configurações' }));
    }
  } else if (url === '/api/backup/create' && req.method === 'POST') {
    createBackup();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Backup criado com sucesso!' }));
  } else if (url === '/api/backup/download' && req.method === 'GET') {
    if (fs.existsSync(DB_PATH)) {
      res.setHeader('Content-Disposition', 'attachment; filename="backup_database_erp.json"');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      fs.createReadStream(DB_PATH).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Banco não encontrado' }));
    }
  } else if (url === '/api/dashboard/summary' && req.method === 'GET') {
    // [FIX #3] Try/catch em rotas GET que executam cálculos
    try {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getDashboardSummary()));
    } catch (e) {
      console.error('Erro ao calcular dashboard summary:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro interno ao calcular dashboard' }));
    }
  
  // --- CLEANING PRODUCTS ENDPOINTS ---
  } else if (url === '/api/cleaning/products' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memoryDb.cleaningProducts || []));
  } else if (url === '/api/cleaning/products' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const newProd = {
        id: `clean_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        arrivalDate: data.arrivalDate || new Date().toISOString().split('T')[0],
        name: data.name,
        category: data.category || 'DESINFETANTE',
        unit: data.unit || 'LITROS',
        currentQuantity: parseFloat(data.currentQuantity) || 0,
        minQuantity: parseFloat(data.minQuantity) || 5,
        unitCost: parseFloat(data.unitCost) || 0,
        totalValue: (parseFloat(data.currentQuantity) || 0) * (parseFloat(data.unitCost) || 0),
        supplier: data.supplier || 'Não informado',
        createdAt: new Date().toISOString()
      };
      if (!memoryDb.cleaningProducts) memoryDb.cleaningProducts = [];
      memoryDb.cleaningProducts.unshift(newProd);
      saveDatabaseDebounced();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newProd));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao cadastrar produto de limpeza' }));
    }
  } else if (url === '/api/cleaning/products/update' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const item = (memoryDb.cleaningProducts || []).find(p => p.id === data.id);
      if (item) {
        if (data.name !== undefined) item.name = data.name;
        if (data.category !== undefined) item.category = data.category;
        if (data.unit !== undefined) item.unit = data.unit;
        if (data.currentQuantity !== undefined) item.currentQuantity = parseFloat(data.currentQuantity) || 0;
        if (data.minQuantity !== undefined) item.minQuantity = parseFloat(data.minQuantity) || 0;
        if (data.unitCost !== undefined) item.unitCost = parseFloat(data.unitCost) || 0;
        item.totalValue = item.currentQuantity * item.unitCost;
        if (data.arrivalDate !== undefined) item.arrivalDate = data.arrivalDate;
        if (data.supplier !== undefined) item.supplier = data.supplier;
        saveDatabaseDebounced();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(item));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Produto de limpeza não encontrado' }));
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao atualizar produto de limpeza' }));
    }
  } else if (url.startsWith('/api/cleaning/products/') && req.method === 'DELETE') {
    const parts = url.split('/');
    const id = parts[4];
    memoryDb.cleaningProducts = (memoryDb.cleaningProducts || []).filter(p => p.id !== id);
    saveDatabaseDebounced();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  
  // --- MAINTENANCE ENDPOINTS ---
  } else if (url === '/api/maintenance' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memoryDb.maintenanceRecords || []));
  } else if (url === '/api/maintenance' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const matCost = parseFloat(data.materialCost) || 0;
      const labCost = parseFloat(data.laborCost) || 0;
      const newRecord = {
        id: `maint_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: data.title,
        maintenanceType: data.maintenanceType || 'PREDIAL',
        category: data.category || 'PREVENTIVA',
        executionDate: data.executionDate || new Date().toISOString().split('T')[0],
        executedBy: data.executedBy || 'Técnico / Prestador',
        materialCost: matCost,
        laborCost: labCost,
        totalCost: matCost + labCost,
        notes: data.notes || '',
        createdAt: new Date().toISOString()
      };
      if (!memoryDb.maintenanceRecords) memoryDb.maintenanceRecords = [];
      memoryDb.maintenanceRecords.unshift(newRecord);
      saveDatabaseDebounced();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newRecord));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao cadastrar manutenção' }));
    }
  } else if (url === '/api/maintenance/update' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const item = (memoryDb.maintenanceRecords || []).find(r => r.id === data.id);
      if (item) {
        if (data.title !== undefined) item.title = data.title;
        if (data.maintenanceType !== undefined) item.maintenanceType = data.maintenanceType;
        if (data.category !== undefined) item.category = data.category;
        if (data.executionDate !== undefined) item.executionDate = data.executionDate;
        if (data.executedBy !== undefined) item.executedBy = data.executedBy;
        if (data.materialCost !== undefined) item.materialCost = parseFloat(data.materialCost) || 0;
        if (data.laborCost !== undefined) item.laborCost = parseFloat(data.laborCost) || 0;
        item.totalCost = item.materialCost + item.laborCost;
        if (data.notes !== undefined) item.notes = data.notes;
        saveDatabaseDebounced();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(item));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Manutenção não encontrada' }));
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao atualizar manutenção' }));
    }
  // [FIX #2] Rota GET /summary ANTES do DELETE wildcard para evitar conflito
  } else if (url === '/api/maintenance/summary' && req.method === 'GET') {
    try {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getMaintenanceSummary()));
    } catch (e) {
      console.error('Erro ao calcular maintenance summary:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro interno ao calcular manutenções' }));
    }
  } else if (url.startsWith('/api/maintenance/') && req.method === 'DELETE') {
    const parts = url.split('/');
    const id = parts[3];
    memoryDb.maintenanceRecords = (memoryDb.maintenanceRecords || []).filter(r => r.id !== id);
    saveDatabaseDebounced();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));

  // --- UNIFORMS ENDPOINTS ---
  } else if ((url === '/api/uniforms' || url === '/api/uniforms/stock') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memoryDb.uniformItems || []));
  } else if ((url === '/api/uniforms' || url === '/api/uniforms/stock') && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const newItem = {
        id: `unif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: data.name,
        type: data.type || 'CAMISETA',
        size: data.size || 'M',
        currentQuantity: parseFloat(data.currentQuantity) || 0,
        minQuantity: parseFloat(data.minQuantity) || 2,
        unitCost: parseFloat(data.unitCost) || 0,
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (!memoryDb.uniformItems) memoryDb.uniformItems = [];
      memoryDb.uniformItems.unshift(newItem);
      saveDatabaseDebounced();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newItem));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao cadastrar uniforme' }));
    }
  } else if ((url === '/api/uniforms/update' || url === '/api/uniforms/stock/update') && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const item = (memoryDb.uniformItems || []).find(u => u.id === data.id);
      if (item) {
        if (data.name !== undefined) item.name = data.name;
        if (data.type !== undefined) item.type = data.type;
        if (data.size !== undefined) item.size = data.size;
        if (data.currentQuantity !== undefined) item.currentQuantity = parseFloat(data.currentQuantity) || 0;
        if (data.minQuantity !== undefined) item.minQuantity = parseFloat(data.minQuantity) || 0;
        if (data.unitCost !== undefined) item.unitCost = parseFloat(data.unitCost) || 0;
        if (data.notes !== undefined) item.notes = data.notes;
        item.updatedAt = new Date().toISOString();
        saveDatabaseDebounced();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(item));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Uniforme não encontrado' }));
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao atualizar uniforme' }));
    }
  } else if (req.method === 'DELETE' && (url.startsWith('/api/uniforms/stock/') || (url.startsWith('/api/uniforms/') && !url.includes('/deliveries/') && !url.includes('/discards/')))) {
    const parts = url.split('/');
    const id = parts[parts.length - 1];
    memoryDb.uniformItems = (memoryDb.uniformItems || []).filter(u => u.id !== id);
    saveDatabaseDebounced();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } else if (url === '/api/uniforms/deliveries' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memoryDb.uniformDeliveries || []));
  } else if (url === '/api/uniforms/deliveries' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      if (!memoryDb.uniformDeliveries) memoryDb.uniformDeliveries = [];
      const createdDeliveries = [];

      const itemsToProcess = Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : [{ uniformItemId: data.uniformItemId, uniformName: data.uniformName, size: data.size, quantity: data.quantity }];

      for (const itemData of itemsToProcess) {
        const qty = parseFloat(itemData.quantity) || 1;
        const newDeliv = {
          id: `unif_deliv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          employeeName: data.employeeName,
          employeeRole: data.employeeRole || 'Funcionário',
          uniformItemId: itemData.uniformItemId || '',
          uniformName: itemData.uniformName || 'Uniforme',
          size: itemData.size || 'M',
          quantity: qty,
          deliveryDate: data.deliveryDate || new Date().toISOString().split('T')[0],
          notes: data.notes || '',
          createdAt: new Date().toISOString()
        };

        memoryDb.uniformDeliveries.unshift(newDeliv);
        createdDeliveries.push(newDeliv);

        // Deduct from stock if item found
        if (itemData.uniformItemId) {
          const item = (memoryDb.uniformItems || []).find(u => u.id === itemData.uniformItemId);
          if (item) {
            item.currentQuantity = Math.max(0, item.currentQuantity - qty);
            item.updatedAt = new Date().toISOString();
          }
        }
      }

      saveDatabaseDebounced();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(createdDeliveries.length === 1 ? createdDeliveries[0] : createdDeliveries));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao registrar entrega de uniforme' }));
    }
  } else if (url === '/api/uniforms/deliveries/update' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const deliv = (memoryDb.uniformDeliveries || []).find(d => d.id === data.id);
      if (deliv) {
        if (data.employeeName !== undefined) deliv.employeeName = data.employeeName;
        if (data.employeeRole !== undefined) deliv.employeeRole = data.employeeRole;
        if (data.uniformName !== undefined) deliv.uniformName = data.uniformName;
        if (data.size !== undefined) deliv.size = data.size;
        if (data.quantity !== undefined) deliv.quantity = parseFloat(data.quantity) || 0;
        if (data.deliveryDate !== undefined) deliv.deliveryDate = data.deliveryDate;
        if (data.notes !== undefined) deliv.notes = data.notes;
        saveDatabaseDebounced();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(deliv));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Registro de entrega não encontrado' }));
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao atualizar entrega' }));
    }
  } else if (url.startsWith('/api/uniforms/deliveries/') && req.method === 'DELETE') {
    const parts = url.split('/');
    const id = parts[4];
    memoryDb.uniformDeliveries = (memoryDb.uniformDeliveries || []).filter(d => d.id !== id);
    saveDatabaseDebounced();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } else if (url === '/api/uniforms/discards' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memoryDb.uniformDiscards || []));
  } else if (url === '/api/uniforms/discards' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const qty = parseFloat(data.quantity) || 1;

      const newDiscard = {
        id: `unif_disc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        uniformItemId: data.uniformItemId || '',
        uniformName: data.uniformName,
        size: data.size || 'M',
        quantity: qty,
        reason: data.reason || 'USO_EXCESSO',
        discardDate: data.discardDate || new Date().toISOString().split('T')[0],
        notes: data.notes || '',
        createdAt: new Date().toISOString()
      };

      if (!memoryDb.uniformDiscards) memoryDb.uniformDiscards = [];
      memoryDb.uniformDiscards.unshift(newDiscard);

      // Deduct from stock if item specified
      if (data.uniformItemId) {
        const item = (memoryDb.uniformItems || []).find(u => u.id === data.uniformItemId);
        if (item) {
          item.currentQuantity = Math.max(0, item.currentQuantity - qty);
          item.updatedAt = new Date().toISOString();
        }
      }

      saveDatabaseDebounced();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newDiscard));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao registrar descarte de uniforme' }));
    }
  } else if (url.startsWith('/api/uniforms/discards/') && req.method === 'DELETE') {
    const parts = url.split('/');
    const id = parts[4];
    memoryDb.uniformDiscards = (memoryDb.uniformDiscards || []).filter(d => d.id !== id);
    saveDatabaseDebounced();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } else if (url === '/api/uniforms/summary' && req.method === 'GET') {
    try {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getUniformSummary()));
    } catch (e) {
      console.error('Erro ao calcular uniform summary:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro interno ao calcular uniformes' }));
    }

  // --- EMPLOYEES & DOCUMENTS ENDPOINTS ---
  } else if (url === '/api/employees' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memoryDb.employees || []));
  } else if (url === '/api/employees' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const newEmp = {
        id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: data.name || 'Funcionário Sem Nome',
        role: data.role || 'PROFESSOR',
        avatarUrl: data.avatarUrl || '',
        cpf: data.cpf || '',
        crefNumber: data.crefNumber || '',
        phone: data.phone || '',
        email: data.email || '',
        admissionDate: data.admissionDate || new Date().toISOString().split('T')[0],
        status: data.status || 'ATIVO',
        notes: data.notes || '',
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (!memoryDb.employees) memoryDb.employees = [];
      memoryDb.employees.unshift(newEmp);
      saveDatabaseDebounced();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newEmp));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao cadastrar funcionário' }));
    }
  } else if (url === '/api/employees/update' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const emp = (memoryDb.employees || []).find(e => e.id === data.id);
      if (emp) {
        if (data.name !== undefined) emp.name = data.name;
        if (data.role !== undefined) emp.role = data.role;
        if (data.avatarUrl !== undefined) emp.avatarUrl = data.avatarUrl;
        if (data.cpf !== undefined) emp.cpf = data.cpf;
        if (data.crefNumber !== undefined) emp.crefNumber = data.crefNumber;
        if (data.phone !== undefined) emp.phone = data.phone;
        if (data.email !== undefined) emp.email = data.email;
        if (data.admissionDate !== undefined) emp.admissionDate = data.admissionDate;
        if (data.status !== undefined) emp.status = data.status;
        if (data.notes !== undefined) emp.notes = data.notes;
        emp.updatedAt = new Date().toISOString();
        saveDatabaseDebounced();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(emp));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao atualizar funcionário' }));
    }
  } else if (url.startsWith('/api/employees/') && url.endsWith('/document') && req.method === 'POST') {
    try {
      const parts = url.split('/');
      const empId = parts[3];
      const data = await parseRequestBody(req);
      const emp = (memoryDb.employees || []).find(e => e.id === empId);
      if (emp) {
        if (!emp.documents) emp.documents = [];
        const newDoc = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          employeeId: empId,
          docType: data.docType || 'OUTRO',
          title: data.title || 'Documento Anexo',
          fileName: data.fileName || 'documento.pdf',
          fileDataUrl: data.fileDataUrl || '',
          fileSizeFormatted: data.fileSizeFormatted || '',
          issueDate: data.issueDate || '',
          expirationDate: data.expirationDate || null,
          notes: data.notes || '',
          createdAt: new Date().toISOString()
        };
        emp.documents.unshift(newDoc);
        emp.updatedAt = new Date().toISOString();
        saveDatabaseDebounced();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newDoc));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao anexar documento' }));
    }
  } else if (url.startsWith('/api/employees/documents/') && req.method === 'DELETE') {
    const parts = url.split('/');
    const docId = parts[4];
    let found = false;
    (memoryDb.employees || []).forEach(emp => {
      if (emp.documents) {
        const initialLen = emp.documents.length;
        emp.documents = emp.documents.filter(d => d.id !== docId);
        if (emp.documents.length < initialLen) found = true;
      }
    });
    if (found) saveDatabaseDebounced();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } else if (url.startsWith('/api/employees/') && req.method === 'DELETE') {
    const parts = url.split('/');
    const id = parts[3];
    memoryDb.employees = (memoryDb.employees || []).filter(e => e.id !== id);
    saveDatabaseDebounced();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));

  // --- TASKS & CHECKLIST ENDPOINTS ---
  } else if (url === '/api/tasks' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memoryDb.tasks || []));
  } else if (url === '/api/tasks' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const newTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: data.title || 'Nova Tarefa',
        description: data.description || '',
        category: data.category || 'GERAL',
        priority: data.priority || 'MEDIA',
        assignedTo: data.assignedTo || '',
        dueDate: data.dueDate || '',
        status: data.status || 'PENDENTE',
        completedAt: data.status === 'CONCLUIDA' ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (!memoryDb.tasks) memoryDb.tasks = [];
      memoryDb.tasks.unshift(newTask);
      saveDatabaseDebounced();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newTask));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao criar tarefa' }));
    }
  } else if (url === '/api/tasks/update' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const task = (memoryDb.tasks || []).find(t => t.id === data.id);
      if (task) {
        if (data.title !== undefined) task.title = data.title;
        if (data.description !== undefined) task.description = data.description;
        if (data.category !== undefined) task.category = data.category;
        if (data.priority !== undefined) task.priority = data.priority;
        if (data.assignedTo !== undefined) task.assignedTo = data.assignedTo;
        if (data.dueDate !== undefined) task.dueDate = data.dueDate;
        if (data.status !== undefined) {
          task.status = data.status;
          task.completedAt = data.status === 'CONCLUIDA' ? new Date().toISOString() : null;
        }
        task.updatedAt = new Date().toISOString();
        saveDatabaseDebounced();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(task));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Tarefa não encontrada' }));
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao atualizar tarefa' }));
    }
  } else if (url.startsWith('/api/tasks/') && url.endsWith('/toggle') && req.method === 'POST') {
    const parts = url.split('/');
    const id = parts[3];
    const task = (memoryDb.tasks || []).find(t => t.id === id);
    if (task) {
      task.status = task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
      task.completedAt = task.status === 'CONCLUIDA' ? new Date().toISOString() : null;
      task.updatedAt = new Date().toISOString();
      saveDatabaseDebounced();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(task));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Tarefa não encontrada' }));
    }
  } else if (url.startsWith('/api/tasks/') && req.method === 'DELETE') {
    const parts = url.split('/');
    const id = parts[3];
    memoryDb.tasks = (memoryDb.tasks || []).filter(t => t.id !== id);
    saveDatabaseDebounced();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } else if (url === '/api/dashboard/operational' && req.method === 'GET') {
    try {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getOperationalSummary()));
    } catch (e) {
      console.error('Erro ao gerar operational summary:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao calcular resumo operacional' }));
    }

  // --- PRODUCTS ENDPOINTS ---
  } else if (url === '/api/products/update' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const prod = memoryDb.products.find(p => p.id === data.id);
      if (prod) {
        if (data.name !== undefined) prod.name = data.name;
        if (data.brand !== undefined) prod.brand = data.brand;
        if (data.category !== undefined) prod.category = data.category;
        if (data.costPrice !== undefined) prod.costPrice = parseFloat(data.costPrice) || 0;
        if (data.salePrice !== undefined) prod.salePrice = parseFloat(data.salePrice) || 0;
        if (data.minStockLevel !== undefined) prod.minStockLevel = parseFloat(data.minStockLevel) || 0;
        if (data.code !== undefined) prod.code = data.code;
        prod.updatedAt = new Date().toISOString();
        saveDatabaseDebounced();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(prod));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Produto não encontrado' }));
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao atualizar produto' }));
    }
  } else if (url === '/api/products/update-stock' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const prod = memoryDb.products.find(p => p.id === data.productId);
      if (prod) {
        prod.currentStock = parseFloat(data.newStock) || 0;
        prod.lastPhysicalCountDate = new Date().toISOString();
        prod.updatedAt = new Date().toISOString();
        saveDatabaseDebounced();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, product: prod }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Produto não encontrado' }));
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao atualizar estoque físico' }));
    }
  } else if (url.startsWith('/api/products/') && url.endsWith('/toggle-archive') && req.method === 'POST') {
    const parts = url.split('/');
    const prodId = parts[3];
    const prod = memoryDb.products.find(p => p.id === prodId);
    if (prod) {
      prod.isArchived = !prod.isArchived;
      prod.updatedAt = new Date().toISOString();
      saveDatabaseDebounced();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, isArchived: prod.isArchived }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Produto não encontrado' }));
    }
  } else if (url === '/api/products' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const sPrice = parseFloat(data.salePrice) || 0;
      const cPrice = parseFloat(data.costPrice) || (sPrice * 0.6);
      const initStock = parseFloat(data.currentStock) || 0;
      
      const newProd = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        code: data.code || `INT-${Math.floor(100 + Math.random() * 900)}`,
        name: data.name,
        brand: data.brand || extractBrandFromName(data.name),
        category: data.category || 'Geral',
        costPrice: Math.round(cPrice * 100) / 100,
        salePrice: sPrice,
        minStockLevel: parseFloat(data.minStockLevel) || 5,
        currentStock: initStock,
        totalPurchased: initStock,
        totalSold: 0,
        isArchived: false,
        lastPhysicalCountDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      memoryDb.products.unshift(newProd);
      saveDatabaseDebounced();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newProd));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao criar produto' }));
    }
  } else if (url === '/api/products' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memoryDb.products));
  } else if (url === '/api/products/margins' && req.method === 'GET') {
    try {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getProductMargins()));
    } catch (e) {
      console.error('Erro ao calcular margens:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro interno ao calcular margens' }));
    }
  } else if (url === '/api/inventory/intelligence' && req.method === 'GET') {
    try {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getInventoryIntelligence()));
    } catch (e) {
      console.error('Erro ao calcular inteligência de estoque:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro interno ao calcular estoque inteligente' }));
    }
  } else if (url === '/api/sync/logs' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memoryDb.syncLogs));
  } else if (url === '/api/anomalies' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memoryDb.anomalies));
  } else if (url === '/api/financial/cashier-summary' && req.method === 'GET') {
    try {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getReceptionistCashierSummary()));
    } catch (e) {
      console.error('Erro ao calcular cashier summary:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro interno ao calcular resumo de caixa' }));
    }
  } else if (url === '/api/financial/dre' && req.method === 'GET') {
    try {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getFinancialDRE()));
    } catch (e) {
      console.error('Erro ao calcular DRE:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro interno ao calcular DRE' }));
    }
  } else if (url === '/api/stock/entries' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memoryDb.stockEntries));
  } else if (url === '/api/sales' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memoryDb.sales));
  } else if (url === '/api/sync/trigger' && req.method === 'POST') {
    const result = processExcelSync();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } else {
    const served = serveStaticFile(req, res);
    if (!served) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
    }
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('\n======================================================');
    console.log('💡 O ERP Recepção JÁ ESTÁ RODANDO e ativo no seu sistema!');
    console.log('👉 Abra o seu navegador e acesse: http://localhost:3001');
    console.log('======================================================\n');
  } else {
    console.error('Erro no servidor:', err);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 ERP Recepção Backend & Interface Web (v1.6) rodando na porta ${PORT}`);
});
