import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Database, 
  Users, 
  CheckSquare, 
  Shirt, 
  Sparkles, 
  Wrench, 
  CheckCircle2, 
  HardDrive,
  RefreshCw,
  FolderLock
} from 'lucide-react';
import { AppSetting, SyncLog } from '../shared/types';

interface SyncSettingsViewProps {
  settings: AppSetting;
  syncLogs?: SyncLog[];
  onSaveSettings?: (newSettings: Partial<AppSetting>) => void;
  onTriggerSync?: () => void;
}

export const SyncSettingsView: React.FC<SyncSettingsViewProps> = () => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const handleCreateLocalBackup = async () => {
    setIsCreatingBackup(true);
    setBackupMessage(null);
    try {
      const res = await fetch('/api/backup/create', { method: 'POST' });
      if (res.ok) {
        setBackupMessage('✅ Ponto de restauração salvo com sucesso na pasta backups!');
      } else {
        setBackupMessage('❌ Erro ao gerar backup local.');
      }
    } catch (e) {
      setBackupMessage('❌ Erro na comunicação com o servidor.');
    } finally {
      setIsCreatingBackup(false);
      setTimeout(() => setBackupMessage(null), 5000);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup/download';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Segurança & Armazenamento Local
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Configurações & Backup do Sistema</h1>
            <p className="text-xs text-slate-400 mt-1">
              O ERP opera de forma 100% autônoma e local no seu computador, com banco de dados dedicado e sem dependência de planilhas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
              Operação 100% Offline
            </span>
          </div>
        </div>

        {/* Notice: Planilhas Desativadas */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
            <FolderLock className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-white text-sm">Sincronização de Planilha Desativada</p>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              Como as vendas da recepção agora são operadas diretamente pelo novo sistema de PDV, nenhuma leitura automática de planilha Excel é mais executada no ERP. O sistema roda silenciosamente, sem travamentos e com máxima velocidade.
            </p>
          </div>
        </div>
      </div>

      {/* Backup Actions Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-indigo-400" />
          Ferramentas de Cópia de Segurança (Backup)
        </h2>
        <p className="text-xs text-slate-400">
          Você pode baixar o arquivo completo do banco de dados a qualquer momento ou salvar um ponto de restauração instantâneo.
        </p>

        {backupMessage && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {backupMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Action 1: Download JSON */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 flex items-center justify-center mb-3">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Download do Banco de Dados</h3>
              <p className="text-xs text-slate-400 mt-1">
                Baixa o arquivo <code className="text-indigo-300">database_erp.json</code> com todas as fichas, fotos, tarefas, uniformes e manutenções direto no seu computador.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="mt-4 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" />
              Baixar Backup JSON Agora
            </button>
          </div>

          {/* Action 2: Create Local Restore Point */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 flex items-center justify-center mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Criar Ponto de Restauração</h3>
              <p className="text-xs text-slate-400 mt-1">
                Gera uma cópia de segurança na pasta <code className="text-emerald-300">backups/</code> da aplicação para proteção contra alterações indesejadas.
              </p>
            </div>
            <button
              onClick={handleCreateLocalBackup}
              disabled={isCreatingBackup}
              className="mt-4 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-lg transition border border-slate-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCreatingBackup ? 'animate-spin' : ''}`} />
              {isCreatingBackup ? 'Criando Cópia...' : 'Salvar Ponto de Restauração'}
            </button>
          </div>
        </div>
      </div>

      {/* Modules Health Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-indigo-400" />
          Módulos Integrados no Banco Local
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase">Funcionários</span>
            </div>
            <p className="text-xs text-slate-400">Fichas, fotos de perfil e documentos em PDF (CREF/TCE) salvos.</p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <CheckSquare className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase">Tarefas</span>
            </div>
            <p className="text-xs text-slate-400">Checklists diários e rotinas da equipe com status e prioridades.</p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-sky-400 mb-1">
              <Shirt className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase">Uniformes</span>
            </div>
            <p className="text-xs text-slate-400">Estoque por tamanho, histórico de entregas nominais e descartes.</p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase">Limpeza</span>
            </div>
            <p className="text-xs text-slate-400">183 produtos com custos unitários e alerta de estoque mínimo.</p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Wrench className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase">Manutenções</span>
            </div>
            <p className="text-xs text-slate-400">19 registros prediais e de equipamentos com custos de peças e mão de obra.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
