import React from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, Info, FileSpreadsheet } from 'lucide-react';
import { DataAnomaly } from '../shared/types';

interface DataHealthViewProps {
  anomalies: DataAnomaly[];
  onResolve: (id: string) => void;
}

export const DataHealthView: React.FC<DataHealthViewProps> = ({ anomalies, onResolve }) => {
  const pendingList = anomalies.filter(a => a.status === 'PENDING');
  const resolvedList = anomalies.filter(a => a.status === 'RESOLVED');

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Auditoria de Digitação da Recepção (Data Health Check)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              O ERP analisa automaticamente a planilha do OneDrive em busca de inconsistências digitadas pelos recepcionistas sem interromper o fluxo de trabalho deles.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {pendingList.length} Inconsistência(s) Pendente(s)
          </span>
        </div>

        {pendingList.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">Nenhuma inconsistência encontrada na planilha!</h3>
            <p className="text-xs text-slate-400 mt-1">Todas as linhas digitadas pelos recepcionistas estão perfeitamente formatadas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Linha no Excel</th>
                  <th className="py-2.5 px-3">Campo</th>
                  <th className="py-2.5 px-3">Valor Digitado</th>
                  <th className="py-2.5 px-3">Descrição da Inconsistência</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingList.map((anom) => (
                  <tr key={anom.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                      Linha #{anom.excelRowIndex}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">{anom.fieldName}</td>
                    <td className="py-3 px-3 font-mono text-rose-300 bg-rose-950/30 rounded border border-rose-900/30 px-2 py-0.5">
                      {anom.rawValue || '(em branco)'}
                    </td>
                    <td className="py-3 px-3 text-slate-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {anom.issueDescription}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onResolve(anom.id)}
                        className="px-3 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                      >
                        Marcar Resolvido
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resolvedList.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Inconsistências Resolvidas / Arquivadas
          </h3>
          <div className="overflow-x-auto opacity-70">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Linha</th>
                  <th className="py-2 px-3">Campo</th>
                  <th className="py-2 px-3">Descrição</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {resolvedList.map((anom) => (
                  <tr key={anom.id}>
                    <td className="py-2 px-3 font-mono text-slate-400">Linha #{anom.excelRowIndex}</td>
                    <td className="py-2 px-3 text-slate-300">{anom.fieldName}</td>
                    <td className="py-2 px-3 text-slate-400">{anom.issueDescription}</td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">RESOLVIDO</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
