import React, { useState } from 'react';
import { 
  BrainCircuit, 
  AlertTriangle, 
  ShoppingCart, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle,
  Package,
  TrendingUp,
  Download
} from 'lucide-react';
import { InventoryIntelligence } from '../shared/types';

interface SmartInventoryViewProps {
  intelligence: InventoryIntelligence[];
}

export const SmartInventoryView: React.FC<SmartInventoryViewProps> = ({ intelligence }) => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = intelligence.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code && item.code.toString().includes(searchTerm));
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ALERT' && (item.stockStatus === 'OUT_OF_STOCK' || item.stockStatus === 'CRITICAL' || item.stockStatus === 'LOW')) ||
      item.stockStatus === filterStatus ||
      item.turnoverCategory === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const criticalItems = intelligence.filter(i => i.stockStatus === 'OUT_OF_STOCK' || i.stockStatus === 'CRITICAL');
  const highTurnoverItems = intelligence.filter(i => i.turnoverCategory === 'HIGH_TURNOVER');
  const totalSuggestedReorder = intelligence.reduce((acc, curr) => acc + curr.suggestedReorderQty, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Ruptura / Alertas Críticos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alertas de Ruptura Crítica</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
              criticalItems.length > 0
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-2xl font-extrabold ${criticalItems.length > 0 ? 'text-rose-400' : 'text-white'}`}>
              {criticalItems.length} Marca(s)/SKU(s)
            </p>
            <p className="text-xs text-slate-400 mt-1">Produtos zerados ou com estoque crítico de reposição</p>
          </div>
        </div>

        {/* KPI 2: Sugestão Total de Recompra */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sugestão de Recompra Total</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-indigo-400">
              {totalSuggestedReorder} unidades
            </p>
            <p className="text-xs text-slate-400 mt-1">Quantidade ideal recomendada para 15 dias de vendas</p>
          </div>
        </div>

        {/* KPI 3: Marcas de Alto Giro */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Marcas de Alto Giro</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-emerald-400">
              {highTurnoverItems.length} Itens Campeões
            </p>
            <p className="text-xs text-slate-400 mt-1">Produtos com velocidade de vendas acima da média</p>
          </div>
        </div>
      </div>

      {/* Main Intelligence Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
              Inteligência de Estoque & Recompra por Marca
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cálculo automatizado do ritmo de consumo diário, autonomia estimada em dias e ponto de pedido recomendado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por produto ou marca..."
                className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Todos os Produtos</option>
              <option value="ALERT">🚨 Apenas Alertas de Ruptura (Críticos/Baixos)</option>
              <option value="HIGH_TURNOVER">🔥 Alto Giro (Mais Vendidos)</option>
              <option value="SLOW_MOVING">❄️ Baixo Giro (Parados)</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Nenhum item de estoque correspondente aos filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Cód. Único</th>
                  <th className="py-2.5 px-3">Marca / Descrição do Produto</th>
                  <th className="py-2.5 px-3 text-center">Estoque Atual</th>
                  <th className="py-2.5 px-3 text-center">Giro Diário (Média)</th>
                  <th className="py-2.5 px-3 text-center">Autonomia Estimada</th>
                  <th className="py-2.5 px-3 text-center">Sugestão Recompra</th>
                  <th className="py-2.5 px-3 text-center">Giro Marca</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item) => {
                  const isOutOfStock = item.stockStatus === 'OUT_OF_STOCK';
                  const isCritical = item.stockStatus === 'CRITICAL';
                  const isHighTurnover = item.turnoverCategory === 'HIGH_TURNOVER';

                  return (
                    <tr key={item.productId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-slate-500">#{item.code || '-'}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="text-[10px] text-indigo-400 font-medium">{item.brand} • {item.category}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-white text-sm">{item.currentStock}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">{item.dailySalesRate} un/dia</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          item.daysUntilStockout <= 3 ? 'text-rose-400' :
                          item.daysUntilStockout <= 7 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {item.daysUntilStockout > 100 ? '100+ dias' : `${item.daysUntilStockout} dias`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.suggestedReorderQty > 0 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm">
                            +{item.suggestedReorderQty} un.
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isHighTurnover ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ArrowUpRight className="w-3 h-3" />
                            Alto Giro
                          </span>
                        ) : item.turnoverCategory === 'SLOW_MOVING' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            <ArrowDownRight className="w-3 h-3" />
                            Baixo Giro
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                            Médio
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            ZERADO
                          </span>
                        ) : isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            CRÍTICO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" />
                            OK
                          </span>
                        )}
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
