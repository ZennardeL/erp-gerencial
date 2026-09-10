import React, { useState } from 'react';
import { ShoppingCart, Search, Filter, Calendar, UserCheck } from 'lucide-react';
import { SalesRecord } from '../shared/types';

interface SalesViewProps {
  sales: SalesRecord[];
}

export const SalesView: React.FC<SalesViewProps> = ({ sales }) => {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  const filtered = sales.filter(s => {
    const matchesSearch =
      s.rawProductName.toLowerCase().includes(search.toLowerCase()) ||
      s.receptionistName.toLowerCase().includes(search.toLowerCase());
    const matchesPayment = paymentFilter === 'ALL' || s.paymentMethod === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  const totalRevenue = filtered.reduce((acc, curr) => acc + curr.totalPrice, 0);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              Vendas Sincronizadas do Excel
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Registro histórico consolidado de todas as vendas lançadas pelos recepcionistas no OneDrive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto ou recepcionista..."
                className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Todos os Pagamentos</option>
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              <option value="CARTAO_DEBITO">Cartão de Débito</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-xs text-slate-400">
            Exibindo <strong className="text-white">{filtered.length}</strong> registro(s)
          </span>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
            Subtotal: R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Nenhuma venda correspondente aos filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Linha Excel</th>
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Produto Lançado</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Unitário (R$)</th>
                  <th className="py-2.5 px-3 text-right">Total (R$)</th>
                  <th className="py-2.5 px-3">Forma Pagamento</th>
                  <th className="py-2.5 px-3">Recepcionista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-500">#{sale.excelRowIndex}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {new Date(sale.saleDatetime).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">{sale.rawProductName}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-300">{sale.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">R$ {sale.unitPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-400">
                      R$ {sale.totalPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      {sale.receptionistName}
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
