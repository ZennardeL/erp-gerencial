import React, { useState } from 'react';
import { PackageCheck, Search, Calendar, Hash } from 'lucide-react';
import { StockEntry } from '../shared/types';

interface StockEntriesViewProps {
  entries: StockEntry[];
}

export const StockEntriesView: React.FC<StockEntriesViewProps> = ({ entries }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = entries.filter(e =>
    e.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.code && e.code.toString().includes(searchTerm))
  );

  const totalItemsPurchased = filtered.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-indigo-400" />
              Histórico de Entradas & Reposição de Estoque
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Registro das compras e entradas de mercadorias sincronizadas da aba <strong>ENTRADA DE PRODUTO</strong> do Excel.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produto ou lote..."
                className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-xs text-slate-400">
            Exibindo <strong className="text-white">{filtered.length}</strong> lote(s) de entrada
          </span>
          <span className="text-xs text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
            Total de Itens Comprados: {totalItemsPurchased} un.
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Nenhuma entrada de mercadoria encontrada no histórico.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Cód. Único</th>
                  <th className="py-2.5 px-3">Data Entr.</th>
                  <th className="py-2.5 px-3">Descrição do Produto</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-center">Qtd Entrada</th>
                  <th className="py-2.5 px-3 text-right">Preço Venda (R$)</th>
                  <th className="py-2.5 px-3 text-right">Custo Est. (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400">#{item.code || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {new Date(item.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">{item.productName}</td>
                    <td className="py-3 px-3 text-slate-400">{item.category}</td>
                    <td className="py-3 px-3 text-center font-extrabold text-emerald-400">+{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">R$ {item.salePrice.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">R$ {item.estimatedCostPrice.toFixed(2)}</td>
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
