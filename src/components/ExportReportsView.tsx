import React from 'react';
import { Printer, Download, FileText, CheckCircle, AlertTriangle, DollarSign, Users } from 'lucide-react';
import { InventoryIntelligence, ProductMargin, ReceptionistCashierSummary, FinancialDRE } from '../shared/types';

interface ExportReportsViewProps {
  intelligence: InventoryIntelligence[];
  margins: ProductMargin[];
  cashierSummaries: ReceptionistCashierSummary[];
  dre: FinancialDRE | null;
}

export const ExportReportsView: React.FC<ExportReportsViewProps> = ({
  intelligence,
  margins,
  cashierSummaries,
  dre
}) => {
  const criticalItems = intelligence.filter(i => i.suggestedReorderQty > 0);

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = (filename: string, rows: string[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReorderCSV = () => {
    const headers = ['Cod Unico', 'Marca', 'Produto', 'Categoria', 'Estoque Atual', 'Consumo Diario', 'Autonomia (Dias)', 'Recompra Sugerida (Qtd)'];
    const rows = criticalItems.map(item => [
      item.code || '',
      item.brand,
      item.name,
      item.category,
      String(item.currentStock),
      String(item.dailySalesRate),
      String(item.daysUntilStockout),
      String(item.suggestedReorderQty)
    ]);
    exportCSV('Relatorio_Recompra_Estoque_Recepcao.csv', [headers, ...rows]);
  };

  const exportCashierCSV = () => {
    const headers = ['Recepcionista', 'Qtd Vendas', 'Faturamento Total', 'Pix', 'Dinheiro', 'Debito', 'Credito', 'Ticket Medio'];
    const rows = cashierSummaries.map(c => [
      c.receptionistName,
      String(c.totalSalesCount),
      c.totalRevenue.toFixed(2),
      c.pixTotal.toFixed(2),
      c.moneyTotal.toFixed(2),
      c.debitCardTotal.toFixed(2),
      c.creditCardTotal.toFixed(2),
      c.averageTicket.toFixed(2)
    ]);
    exportCSV('Fechamento_Caixa_Recepcionistas.csv', [headers, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Relatórios Gerenciais Executivos & Exportação
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gere relatórios formatados para impressão, envio por e-mail ou exportação CSV para planilhas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Printable Report Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-8">
        {/* Report 1: Reorder List */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Lista de Sugestão de Recompra (Estoque Crítico)
              </h3>
            </div>
            <button
              onClick={exportReorderCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Cód.</th>
                  <th className="py-2 px-3">Marca</th>
                  <th className="py-2 px-3">Produto</th>
                  <th className="py-2 px-3 text-center">Estoque Atual</th>
                  <th className="py-2 px-3 text-center">Autonomia</th>
                  <th className="py-2 px-3 text-center font-bold text-indigo-400">Sugestão Pedido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {criticalItems.slice(0, 15).map((item) => (
                  <tr key={item.productId}>
                    <td className="py-2 px-3 font-mono text-slate-400">#{item.code || '-'}</td>
                    <td className="py-2 px-3 font-semibold text-indigo-300">{item.brand}</td>
                    <td className="py-2 px-3 text-white">{item.name}</td>
                    <td className="py-2 px-3 text-center font-bold text-rose-400">{item.currentStock} un</td>
                    <td className="py-2 px-3 text-center text-slate-400">{item.daysUntilStockout} dias</td>
                    <td className="py-2 px-3 text-center font-extrabold text-indigo-400">+{item.suggestedReorderQty} un</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report 2: Cashier Summary */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Fechamento Financeiro por Recepcionista
              </h3>
            </div>
            <button
              onClick={exportCashierCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Recepcionista</th>
                  <th className="py-2 px-3 text-center">Vendas</th>
                  <th className="py-2 px-3 text-right">Faturamento Total</th>
                  <th className="py-2 px-3 text-right text-emerald-400">Pix</th>
                  <th className="py-2 px-3 text-right text-amber-400">Dinheiro</th>
                  <th className="py-2 px-3 text-right">Cartões</th>
                  <th className="py-2 px-3 text-right">Ticket Médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cashierSummaries.map((cashier) => (
                  <tr key={cashier.receptionistName}>
                    <td className="py-2 px-3 font-bold text-white">{cashier.receptionistName}</td>
                    <td className="py-2 px-3 text-center text-slate-300">{cashier.totalSalesCount}</td>
                    <td className="py-2 px-3 text-right font-extrabold text-white">R$ {cashier.totalRevenue.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400">R$ {cashier.pixTotal.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono text-amber-400">R$ {cashier.moneyTotal.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300">
                      R$ {(cashier.creditCardTotal + cashier.debitCardTotal).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-indigo-300">R$ {cashier.averageTicket.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
