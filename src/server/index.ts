import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase, getSettings, updateSettings, getSyncLogs, getAnomalies, resolveAnomaly, getDashboardSummary, getProducts, upsertProduct, getSales } from './db.js';
import { processExcelSync, startFileWatcher } from './excel-engine.js';
import { generateSampleExcelFile } from './sample-generator.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Inicializa banco de dados e motor de sincronização
initDatabase();
startFileWatcher();

// Status da API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'ERP Recepção',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Configurações e Mapeamento de Colunas
app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.post('/api/settings', (req, res) => {
  const updated = updateSettings(req.body);
  startFileWatcher(); // Reinicia o watcher se o caminho do arquivo mudou
  res.json(updated);
});

// Acionamento Manual de Sincronização
app.post('/api/sync/trigger', async (req, res) => {
  const result = await processExcelSync();
  res.json(result);
});

// Histórico de Logs de Sincronização
app.get('/api/sync/logs', (req, res) => {
  res.json(getSyncLogs());
});

// Auditoria de Dados (Data Health Check Anomalies)
app.get('/api/anomalies', (req, res) => {
  res.json(getAnomalies());
});

app.post('/api/anomalies/:id/resolve', (req, res) => {
  const success = resolveAnomaly(req.params.id);
  res.json({ success });
});

// Resumo para Dashboard Executivo
app.get('/api/dashboard/summary', (req, res) => {
  res.json(getDashboardSummary());
});

// Produtos
app.get('/api/products', (req, res) => {
  res.json(getProducts());
});

app.post('/api/products', (req, res) => {
  const { name, category, salePrice } = req.body;
  const prod = upsertProduct(name, category, salePrice);
  res.json(prod);
});

// Vendas
app.get('/api/sales', (req, res) => {
  res.json(getSales());
});

// Gerar Planilha de Exemplo no OneDrive
app.post('/api/sample/generate', (req, res) => {
  const settings = getSettings();
  generateSampleExcelFile(settings.excelFilePath);
  processExcelSync();
  res.json({ success: true, path: settings.excelFilePath });
});

app.listen(PORT, () => {
  console.log(`🚀 ERP Recepção Backend rodando na porta ${PORT}`);
});
