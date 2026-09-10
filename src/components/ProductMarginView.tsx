import React, { useState } from 'react';
import { Percent, TrendingUp, DollarSign, Search, Filter, Award, Tag } from 'lucide-react';
import { ProductMargin } from '../shared/types';

interface ProductMarginViewProps {
  margins: ProductMargin[];
}

export const ProductMarginView: React.FC<ProductMarginViewProps> = ({ margins }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filtered = margins.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.brand && m.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.code && m.code.toString().includes(searchTerm));
    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalRevenueAll = filtered.reduce((acc, m) => acc + m.totalRevenue, 0);
  const totalProfitAll = filtered.reduce((acc, m) => acc + m.totalProfit, 0);
  const categories = Array.from(new Set(margins.map(m => m.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faturamento Total Filtrado</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white">
              R$ {totalRevenueAll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">Soma das vendas brutas dos produtos filtrados</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lucro Bruto Estimado</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-indigo-400">
              R$ {totalProfitAll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">Retorno financeiro líquido projetado</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SKUs Únicos Mapeados</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white">
              {filtered.length} Marca(s)/Item(ns)
            </p>
            <p className="text-xs text-slate-400 mt-1">Cada produto e marca possui controle individualizado</p>
          </div>
        </div>
      </div>

      {/* Main Margins Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-indigo-400" />
              Margens de Lucro & Rentabilidade por Marca/Produto
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Controle individual por marca mantendo cada produto (ex: Lindoya, Bioleve, Monster, Nutrata, Adaptogen) separado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por marca ou SKU..."
                className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Nenhum produto correspondente aos filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Cód. Único</th>
                  <th className="py-2.5 px-3">Marca / Descrição do Produto</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-right">Custo Est. (R$)</th>
                  <th className="py-2.5 px-3 text-right">Preço Venda (R$)</th>
                  <th className="py-2.5 px-3 text-center">Margem %</th>
                  <th className="py-2.5 px-3 text-center">Unid. Vendidas</th>
                  <th className="py-2.5 px-3 text-right">Faturamento Total (R$)</th>
                  <th className="py-2.5 px-3 text-right">Lucro Bruto (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item) => {
                  const isHighMargin = item.marginPercent >= 35;
                  return (
                    <tr key={item.productId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono text-slate-500 font-bold">#{item.code || '-'}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="text-[10px] text-indigo-400 font-medium">{item.brand}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{item.category}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">R$ {item.costPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">R$ {item.salePrice.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                          isHighMargin
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                        }`}>
                          {item.marginPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-slate-300">{item.totalSoldQty}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        R$ {item.totalRevenue.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-400">
                        R$ {item.totalProfit.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
