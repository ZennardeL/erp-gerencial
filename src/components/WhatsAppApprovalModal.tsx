import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  X, 
  UserCheck, 
  Phone, 
  Edit3, 
  ShieldAlert, 
  Sparkles,
  ExternalLink,
  FileText,
  Download,
  Share2
} from 'lucide-react';
import { WhatsAppMessagePayload } from '../shared/types';

interface WhatsAppApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: WhatsAppMessagePayload | null;
  ownerPhone?: string;
  managerPhone?: string;
  onUpdatePhoneSettings?: (role: 'owner' | 'manager', newPhone: string) => void;
}

export const WhatsAppApprovalModal: React.FC<WhatsAppApprovalModalProps> = ({
  isOpen,
  onClose,
  payload,
  ownerPhone = '',
  managerPhone = '',
  onUpdatePhoneSettings
}) => {
  if (!isOpen || !payload) return null;

  const [recipientType, setRecipientType] = useState<'OWNER' | 'MANAGER' | 'OTHER'>(payload.recipientType || 'OWNER');
  const [customPhone, setCustomPhone] = useState(payload.recipientPhone || '');
  const [messageText, setMessageText] = useState(payload.content || '');
  const [copied, setCopied] = useState(false);
  const [savePhoneAsDefault, setSavePhoneAsDefault] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Sync state when payload changes
  useEffect(() => {
    if (payload) {
      setRecipientType(payload.recipientType || 'OWNER');
      setCustomPhone(payload.recipientPhone || '');
      setMessageText(payload.content || '');
      setCopied(false);
      setDownloaded(false);
    }
  }, [payload]);

  // Determine current active phone number based on recipient
  const getActivePhone = (): string => {
    if (recipientType === 'OWNER') return ownerPhone || customPhone;
    if (recipientType === 'MANAGER') return managerPhone || customPhone;
    return customPhone;
  };

  // Format phone to clean numbers
  const cleanPhoneForWhatsApp = (raw: string): string => {
    let clean = raw.replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length === 10 || clean.length === 11) {
      clean = '55' + clean;
    }
    return clean;
  };

  const currentPhone = getActivePhone();
  const phoneClean = cleanPhoneForWhatsApp(currentPhone);
  const hasValidPhone = phoneClean.length >= 10;

  // Copy message to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  // Download PDF file locally
  const handleDownloadPdf = () => {
    if (!payload?.pdfBlob) return;
    const url = URL.createObjectURL(payload.pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = payload.pdfFileName || 'BORDERO_PAGAMENTOS_PANOBIANCO.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  // Native File Share via Web Share API (opens WhatsApp with attached PDF on Mobile)
  const canShareFiles = typeof navigator !== 'undefined' && !!navigator.canShare && !!payload?.pdfBlob;

  const handleNativeSharePdf = async () => {
    if (!payload?.pdfBlob) return;
    try {
      const file = new File(
        [payload.pdfBlob], 
        payload.pdfFileName || 'BORDERO_PANOBIANCO.pdf', 
        { type: 'application/pdf' }
      );
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: payload.title || 'Borderô Semanal Panobianco',
          text: messageText
        });
        onClose();
        return;
      }
    } catch (e) {
      console.warn('Compartilhamento nativo não completado:', e);
    }
    // Fallback: download and open wa.me
    handleDownloadPdf();
    handleApproveAndSend();
  };

  // Approve and dispatch to WhatsApp Web / Mobile
  const handleApproveAndSend = () => {
    if (!hasValidPhone) {
      alert('Por favor, informe um número de telefone com DDD para enviar a mensagem.');
      return;
    }

    if (savePhoneAsDefault && onUpdatePhoneSettings) {
      if (recipientType === 'OWNER') onUpdatePhoneSettings('owner', currentPhone);
      if (recipientType === 'MANAGER') onUpdatePhoneSettings('manager', currentPhone);
    }

    // If PDF blob exists, trigger download so user has it ready in downloads
    if (payload?.pdfBlob) {
      handleDownloadPdf();
    }

    const encodedText = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/${phoneClean}?text=${encodedText}`;
    
    // Open WhatsApp in new tab/app
    window.open(waUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Aprovação de Envio no WhatsApp
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {payload.pdfBlob || payload.pdfUrl ? 'PDF Anexo + Link' : 'Revisão Prévia'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {payload.title || 'Revise o PDF e o texto da mensagem antes de autorizar o envio'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          
          {/* PDF Attachment Banner */}
          {(payload.pdfBlob || payload.pdfUrl) && (
            <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-slate-950 border-2 border-orange-500/40 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 flex-shrink-0 shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Documento PDF Oficial Panobianco Gerado
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-500 text-white uppercase">
                      A4 Pronto
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono mt-0.5 truncate">
                    {payload.pdfFileName || 'BORDERO_PANOBIANCO.pdf'}
                  </p>
                  <p className="text-[10px] text-orange-400/90 mt-0.5">
                    ✓ Contém todas as contas, valores por dia e campos de assinatura oficial.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                {payload.pdfUrl && (
                  <a
                    href={payload.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition"
                    title="Visualizar o PDF oficial em nova aba"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                    Ver PDF
                  </a>
                )}

                {payload.pdfBlob && (
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                    title="Baixar arquivo PDF no seu aparelho"
                  >
                    {downloaded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Baixado!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Baixar PDF</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Destinatário Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              1. Selecionar Destinatário
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecipientType('OWNER')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  recipientType === 'OWNER'
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/10'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="font-semibold text-xs text-indigo-400 flex items-center justify-between">
                  <span>👑 Patrão / Diretoria</span>
                  {recipientType === 'OWNER' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <div className="text-[11px] truncate mt-1 text-slate-300 font-mono">
                  {ownerPhone || 'Não configurado'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRecipientType('MANAGER')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  recipientType === 'MANAGER'
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/10'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="font-semibold text-xs text-indigo-400 flex items-center justify-between">
                  <span>👔 Gerência</span>
                  {recipientType === 'MANAGER' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <div className="text-[11px] truncate mt-1 text-slate-300 font-mono">
                  {managerPhone || 'Não configurado'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRecipientType('OTHER')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  recipientType === 'OTHER'
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/10'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="font-semibold text-xs text-indigo-400 flex items-center justify-between">
                  <span>🏋️ Outro / Colaborador</span>
                  {recipientType === 'OTHER' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <div className="text-[11px] truncate mt-1 text-slate-300 font-mono">
                  {payload.recipientLabel || 'Número manual'}
                </div>
              </button>
            </div>

            {/* Input to insert/edit phone */}
            {(!currentPhone || recipientType === 'OTHER') && (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 space-y-2">
                <label className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Informe o número de WhatsApp (DDD + Número):
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="Ex: (15) 99876-5432"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  {recipientType !== 'OTHER' && (
                    <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={savePhoneAsDefault} 
                        onChange={(e) => setSavePhoneAsDefault(e.target.checked)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500" 
                      />
                      Salvar como padrão
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Message Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                2. Revisar e Personalizar Texto da Mensagem
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {messageText.length} caracteres
              </span>
            </div>

            <div className="relative">
              <textarea
                rows={9}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-emerald-500/80 transition resize-y"
                placeholder="Digite ou edite a mensagem..."
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                O patrão pode tocar no link do PDF para abrir o documento oficial no celular.
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado para área de transferência!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar texto</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Security / Approval Notice */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-0.5">
              <p className="font-semibold text-emerald-300">
                Aprovação Prévia Segura
              </p>
              <p className="text-slate-400 text-[11px]">
                Ao aprovar, o arquivo PDF é baixado e a conversa do WhatsApp é aberta com o link de acesso direto para o patrão conferir o relatório oficial.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2 w-full sm:w-auto">
            <span>Destino:</span>
            <span className="font-mono text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {currentPhone || 'Telefone não informado'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancelar
            </button>

            {/* If Mobile Web Share API with Files is Supported */}
            {canShareFiles && (
              <button
                type="button"
                onClick={handleNativeSharePdf}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                title="Compartilhar o arquivo PDF anexado diretamente no aplicativo do WhatsApp"
              >
                <Share2 className="w-4 h-4" />
                <span>Anexar PDF no WhatsApp</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleApproveAndSend}
              disabled={!hasValidPhone}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg ${
                hasValidPhone
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Aprovar & Abrir no WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
