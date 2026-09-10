import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Wallet, 
  QrCode, 
  Receipt,
  Award,
  ArrowUpRight,
  PieChart
} from 'lucide-react';
import { FinancialDRE, ReceptionistCashierSummary } from '../shared/types';

interface FinancialViewProps {
  dre: FinancialDRE | null;
  cashierSummaries: ReceptionistCashierSummary[];
}

export const FinancialView: React.FC<FinancialViewProps> = ({ dre, cashierSummaries }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCashiers = cashierSummaries.filter(c =>
    c.receptionistName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topSeller = cashierSummaries.length > 0 ? cashierSummaries[0] : null;

  return (
    <div className="space-y-6">
      {/* Executive DRE Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Bruto */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faturamento Bruto</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white">
              R$ {dre ? dre.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Total acumulado de vendas gravadas</p>
          </div>
        </div>

        {/* Custo de Mercadorias (CMV) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custo das Mercadorias (CMV)</span>
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-rose-400">
              R$ {dre ? dre.costOfGoodsSold.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Custo estimado de aquisição dos produtos</p>
          </div>
        </div>

        {/* Lucro Bruto */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lucro Bruto Gerado</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-indigo-400">
              R$ {dre ? dre.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </p>
            <p className="text-xs text-indigo-300 font-semibold mt-1">
              Margem Bruta Média: {dre ? dre.profitMarginPercent : 0}%
            </p>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket Médio por Venda</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-amber-400">
              R$ {dre ? dre.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Média em {dre ? dre.totalTransactions : 0} transações
            </p>
          </div>
        </div>
      </div>

      {/* Receptionist Cashier Performance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Fechamento de Caixa por Recepcionista / Funcionário
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Desdobramento financeiro individual de cada atendente com totais por forma de pagamento (Pix, Cartão, Dinheiro).
            </p>
          </div>

          {topSeller && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
              <Award className="w-4 h-4 text-amber-400" />
              Maior Faturamento: <strong>{topSeller.receptionistName}</strong> (R$ {topSeller.totalRevenue.toFixed(2)})
            </div>
          )}
        </div>

        {filteredCashiers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Nenhum registro de recepcionista encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Recepcionista / Atendente</th>
                  <th className="py-2.5 px-3 text-center">Vendas (Qtd)</th>
                  <th className="py-2.5 px-3 text-right">Faturamento Total</th>
                  <th className="py-2.5 px-3 text-right text-emerald-400">Pix (R$)</th>
                  <th className="py-2.5 px-3 text-right text-amber-400">Dinheiro (R$)</th>
                  <th className="py-2.5 px-3 text-right text-indigo-400">Débito (R$)</th>
                  <th className="py-2.5 px-3 text-right text-violet-400">Crédito (R$)</th>
                  <th className="py-2.5 px-3 text-right">Ticket Médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCashiers.map((cashier, idx) => (
                  <tr key={cashier.receptionistName} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white flex items-center gap-2">
                        {idx === 0 && <Award className="w-3.5 h-3.5 text-amber-400" />}
                        {cashier.receptionistName}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-300">{cashier.totalSalesCount}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-white font-mono">
                      R$ {cashier.totalRevenue.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                      R$ {cashier.pixTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-amber-400">
                      R$ {cashier.moneyTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      R$ {cashier.debitCardTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      R$ {cashier.creditCardTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-indigo-300">
                      R$ {cashier.averageTicket.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
