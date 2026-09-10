import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import chokidar from 'chokidar';
import XLSX from 'xlsx';
import { getSettings, addSyncLog, upsertProduct, addSaleRecord, addAnomaly } from './db.js';
import { generateSampleExcelFile } from './sample-generator.js';

let watcher: chokidar.FSWatcher | null = null;
let isSyncing = false;

function generateRowHash(row: Record<string, any>): string {
  const rawStr = `${row.date}_${row.product}_${row.quantity}_${row.unitPrice}_${row.paymentMethod}_${row.receptionist}`;
  return crypto.createHash('sha256').update(rawStr).digest('hex');
}

function normalizePaymentMethod(raw: string): 'PIX' | 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'OUTROS' {
  if (!raw) return 'OUTROS';
  const norm = raw.toString().toUpperCase().trim();
  if (norm.includes('PIX')) return 'PIX';
  if (norm.includes('DINHEIRO') || norm.includes('ESPÉCIE') || norm.includes('ESPECIE')) return 'DINHEIRO';
  if (norm.includes('CRÉDITO') || norm.includes('CREDITO')) return 'CARTAO_CREDITO';
  if (norm.includes('DÉBITO') || norm.includes('DEBITO') || norm.includes('CARTAO')) return 'CARTAO_DEBITO';
  return 'OUTROS';
}

export async function processExcelSync(): Promise<{ success: boolean; rowsProcessed: number; rowsImported: number; errorsCount: number }> {
  if (isSyncing) {
    return { success: false, rowsProcessed: 0, rowsImported: 0, errorsCount: 0 };
  }

  isSyncing = true;
  const startTime = Date.now();
  const settings = getSettings();
  const targetFile = settings.excelFilePath;

  // Garante que existe uma planilha de testes se o arquivo informado não existir ainda
  if (!fs.existsSync(targetFile)) {
    generateSampleExcelFile(targetFile);
  }

  let rowsProcessed = 0;
  let rowsImported = 0;
  let errorsCount = 0;

  try {
    // 1. Cópia Shadow Anti-Lock no temp do sistema
    const tempCopyPath = path.join(os.tmpdir(), `shadow_${Date.now()}_recepcao.xlsx`);
    fs.copyFileSync(targetFile, tempCopyPath);

    // 2. Leitura da Cópia Shadow
    const workbook = XLSX.readFile(tempCopyPath, { cellDates: true });
    const sheetName = settings.columnMapping.sheetName || workbook.SheetNames[0];
    
    if (!workbook.Sheets[sheetName]) {
      throw new Error(`Aba '${sheetName}' não encontrada na planilha.`);
    }

    const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    rowsProcessed = rawRows.length;

    const {
      dateColumn,
      productColumn,
      quantityColumn,
      unitPriceColumn,
      totalPriceColumn,
      paymentMethodColumn,
      receptionistColumn
    } = settings.columnMapping;

    // 3. Processamento e Normalização por Linha
    rawRows.forEach((row, idx) => {
      const rowIndex = idx + 2; // Cabeçalho é linha 1
      const rawProduct = String(row[productColumn] || '').trim();
      const rawQty = parseFloat(row[quantityColumn]);
      const rawUnitPrice = parseFloat(row[unitPriceColumn]);
      const rawDate = row[dateColumn] ? new Date(row[dateColumn]).toISOString() : new Date().toISOString();
      const rawPayment = String(row[paymentMethodColumn] || '').trim();
      const receptionist = String(row[receptionistColumn] || 'Recepção').trim();

      // Validação de Inconsistências (Data Health Check)
      if (!rawProduct) {
        addAnomaly({
          excelRowIndex: rowIndex,
          fieldName: 'Produto',
          rawValue: '',
          issueDescription: 'Nome do produto em branco na planilha'
        });
        errorsCount++;
        return;
      }

      if (isNaN(rawUnitPrice) || rawUnitPrice <= 0) {
        addAnomaly({
          excelRowIndex: rowIndex,
          fieldName: 'Valor Unitário',
          rawValue: String(row[unitPriceColumn]),
          issueDescription: `Preço zerado ou inválido para o produto "${rawProduct}"`
        });
        errorsCount++;
        return;
      }

      const qty = isNaN(rawQty) || rawQty <= 0 ? 1 : rawQty;
      const unitPrice = rawUnitPrice;
      const totalPrice = parseFloat(row[totalPriceColumn]) || (qty * unitPrice);

      // Garante que o produto existe no catálogo do ERP
      const product = upsertProduct(rawProduct, 'Geral', unitPrice);

      // Hash único da venda para desduplicação
      const rowHash = generateRowHash({
        date: rawDate,
        product: rawProduct,
        quantity: qty,
        unitPrice,
        paymentMethod: rawPayment,
        receptionist
      });

      const imported = addSaleRecord({
        excelRowIndex: rowIndex,
        rawProductName: rawProduct,
        productId: product.id,
        quantity: qty,
        unitPrice,
        totalPrice,
        paymentMethod: normalizePaymentMethod(rawPayment),
        receptionistName: receptionist,
        saleDatetime: rawDate,
        hashSignature: rowHash
      });

      if (imported) {
        rowsImported++;
      }
    });

    // Remove arquivo temporário shadow
    if (fs.existsSync(tempCopyPath)) {
      fs.unlinkSync(tempCopyPath);
    }

    const execTime = Date.now() - startTime;
    addSyncLog({
      status: errorsCount > 0 ? 'WARNING' : 'SUCCESS',
      rowsProcessed,
      rowsImported,
      errorsFound: errorsCount,
      executionTimeMs: execTime,
      details: `Importadas ${rowsImported} novas vendas de ${rowsProcessed} linhas.`
    });

    console.log(`✅ Sincronização OneDrive concluída: ${rowsImported} vendas importadas em ${execTime}ms.`);
    return { success: true, rowsProcessed, rowsImported, errorsCount };

  } catch (err: any) {
    const execTime = Date.now() - startTime;
    console.error('❌ Erro na sincronização do Excel:', err.message);

    addSyncLog({
      status: 'ERROR',
      rowsProcessed: 0,
      rowsImported: 0,
      errorsFound: 1,
      executionTimeMs: execTime,
      details: err.message
    });

    return { success: false, rowsProcessed: 0, rowsImported: 0, errorsCount: 1 };
  } finally {
    isSyncing = false;
  }
}

export function startFileWatcher(): void {
  const settings = getSettings();
  if (watcher) {
    watcher.close();
  }

  const filePath = settings.excelFilePath;
  console.log(`👀 Monitor de arquivo OneDrive ativado para: ${filePath}`);

  // Chokidar com debounce de 2 segundos para evitar disparos múltiplos durante gravação do Excel
  let debounceTimeout: NodeJS.Timeout | null = null;

  watcher = chokidar.watch(filePath, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 500
    }
  });

  watcher.on('change', () => {
    console.log('⚡ Alteração detectada na planilha da recepção! Sincronizando...');
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      processExcelSync();
    }, 1500);
  });

  watcher.on('error', (error) => {
    console.error('⚠️ Erro no File Watcher do OneDrive:', error);
  });

  // Executa primeira sincronização na inicialização
  processExcelSync();
}
