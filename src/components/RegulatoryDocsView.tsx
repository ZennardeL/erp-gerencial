import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  AlertCircle, 
  Calendar, 
  Building2, 
  Download, 
  Eye, 
  Trash2, 
  Edit, 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  X, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink,
  Flame,
  Bug,
  Droplets,
  Shield,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { RegulatoryDocument, RegulatoryCategory, RegulatoryStatus } from '../shared/types';
import { formatDate } from '../shared/formatters';

interface RegulatoryDocsViewProps {
  documents: RegulatoryDocument[];
  onAddDocument: (doc: Partial<RegulatoryDocument>) => Promise<void>;
  onEditDocument: (id: string, doc: Partial<RegulatoryDocument>) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

export const RegulatoryDocsView: React.FC<RegulatoryDocsViewProps> = ({
  documents,
  onAddDocument,
  onEditDocument,
  onDeleteDocument,
  onRefresh
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // 1-Click Clipboard Copy Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar para a área de transferência:', err);
    }
  };

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<RegulatoryDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; fileName: string; fileDataUrl: string } | null>(null);

  // Form State
  const [form, setForm] = useState<{
    title: string;
    category: RegulatoryCategory;
    documentNumber: string;
    issuingBody: string;
    issueDate: string;
    expirationDate: string;
    status: RegulatoryStatus;
    fileName: string;
    fileDataUrl: string;
    fileSizeFormatted: string;
    notes: string;
  }>({
    title: '',
    category: 'AVCB',
    documentNumber: '',
    issuingBody: '',
    issueDate: '',
    expirationDate: '',
    status: 'REGULAR',
    fileName: '',
    fileDataUrl: '',
    fileSizeFormatted: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Badges Config
  const categoryConfig: Record<RegulatoryCategory, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
    AVCB: {
      label: 'AVCB / Bombeiros',
      icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20'
    },
    ALVARA: {
      label: 'Alvará de Funcionamento',
      icon: <Building2 className="w-3.5 h-3.5 text-sky-400" />,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20'
    },
    DEDETIZACAO: {
      label: 'Dedetização & Pragas',
      icon: <Bug className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    SANITARIA: {
      label: 'Vigilância Sanitária',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20'
    },
    AGUA: {
      label: 'Limpeza de Caixa / Água',
      icon: <Droplets className="w-3.5 h-3.5 text-cyan-400" />,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20'
    },
    SST: {
      label: 'SST / PGR / PCMSO',
      icon: <FileCheck className="w-3.5 h-3.5 text-violet-400" />,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20'
    },
    CREF: {
      label: 'CREF Pessoa Jurídica',
      icon: <Shield className="w-3.5 h-3.5 text-indigo-400" />,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20'
    },
    SEGURO: {
      label: 'Seguro Predial',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
    OUTRO: {
      label: 'Outros Documentos',
      icon: <FileText className="w-3.5 h-3.5 text-slate-400" />,
      color: 'text-slate-400',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20'
    }
  };

  // Expiration calculation helper
  const getDocComputedStatus = (doc: RegulatoryDocument) => {
    if (doc.status === 'EM_RENOVACAO') return 'EM_RENOVACAO';
    if (doc.status === 'ISENTO') return 'ISENTO';
    if (!doc.expirationDate) return 'REGULAR';

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(doc.expirationDate + 'T00:00:00');
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'VENCIDO';
    if (diffDays <= 45) return 'A_VENCER';
    return 'REGULAR';
  };

  const getDaysRemaining = (expirationDate?: string | null) => {
    if (!expirationDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(expirationDate + 'T00:00:00');
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // KPIs
  const kpis = useMemo(() => {
    let regular = 0;
    let aVencer = 0;
    let vencido = 0;
    let emRenovacao = 0;

    documents.forEach(doc => {
      const st = getDocComputedStatus(doc);
      if (st === 'VENCIDO') vencido++;
      else if (st === 'A_VENCER') aVencer++;
      else if (st === 'EM_RENOVACAO') emRenovacao++;
      else regular++;
    });

    return {
      total: documents.length,
      regular,
      aVencer,
      vencido,
      emRenovacao
    };
  }, [documents]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch = 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.documentNumber && doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.issuingBody && doc.issuingBody.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.notes && doc.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;

      const computedSt = getDocComputedStatus(doc);
      let matchStatus = true;
      if (statusFilter !== 'ALL') {
        matchStatus = computedSt === statusFilter;
      }

      return matchSearch && matchCategory && matchStatus;
    });
  }, [documents, searchTerm, categoryFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingDoc(null);
    setForm({
      title: '',
      category: 'AVCB',
      documentNumber: '',
      issuingBody: '',
      issueDate: '',
      expirationDate: '',
      status: 'REGULAR',
      fileName: '',
      fileDataUrl: '',
      fileSizeFormatted: '',
      notes: ''
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (doc: RegulatoryDocument) => {
    setEditingDoc(doc);
    setForm({
      title: doc.title,
      category: doc.category,
      documentNumber: doc.documentNumber || '',
      issuingBody: doc.issuingBody || '',
      issueDate: doc.issueDate || '',
      expirationDate: doc.expirationDate || '',
      status: doc.status || 'REGULAR',
      fileName: doc.fileName || '',
      fileDataUrl: doc.fileDataUrl || '',
      fileSizeFormatted: doc.fileSizeFormatted || '',
      notes: doc.notes || ''
    });
    setShowModal(true);
  };

  // Handle Preset Selection (1-Click Quick Fill)
  const applyPreset = (preset: {
    category: RegulatoryCategory;
    title: string;
    issuingBody: string;
    notes?: string;
  }) => {
    setForm(prev => ({
      ...prev,
      category: preset.category,
      title: preset.title,
      issuingBody: preset.issuingBody,
      notes: preset.notes || prev.notes
    }));
  };

  // File Upload Handler (Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('O arquivo selecionado deve ter no máximo 15MB.');
      return;
    }

    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({
        ...prev,
        fileName: file.name,
        fileSizeFormatted: sizeFormatted,
        fileDataUrl: event.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Por favor, informe o título ou nome do documento.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<RegulatoryDocument> = {
        title: form.title.trim(),
        category: form.category,
        documentNumber: form.documentNumber.trim() || undefined,
        issuingBody: form.issuingBody.trim() || undefined,
        issueDate: form.issueDate || undefined,
        expirationDate: form.expirationDate || null,
        status: form.status,
        fileName: form.fileName || undefined,
        fileDataUrl: form.fileDataUrl || undefined,
        fileSizeFormatted: form.fileSizeFormatted || undefined,
        notes: form.notes.trim() || undefined
      };

      if (editingDoc) {
        await onEditDocument(editingDoc.id, payload);
      } else {
        await onAddDocument(payload);
      }

      setShowModal(false);
    } catch (err) {
      console.error('Erro ao salvar documento regulatório:', err);
      alert('Erro ao salvar documento. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download & Blob Helpers
  const getBlobUrl = (dataUrl: string): string => {
    try {
      if (dataUrl.startsWith('blob:') || dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
        return dataUrl;
      }
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Erro ao converter arquivo:', e);
      return dataUrl;
    }
  };

  const handleDownload = (fileDataUrl: string, fileName: string) => {
    try {
      const blobUrl = getBlobUrl(fileDataUrl);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'documento-regulatorio.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Erro ao baixar documento:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Alvarás, Licenças & Conformidade Regulatória
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Panobianco Boituva
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestão preventiva de validades: AVCB, Alvará de Funcionamento, Dedetização, Laudos de Água e Seguros.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition"
              title="Atualizar Lista"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Cadastrar Novo Documento
          </button>
        </div>
      </div>

      {/* KPI Cards (Click to Filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total */}
        <div 
          onClick={() => { setStatusFilter('ALL'); setCategoryFilter('ALL'); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'ALL' && categoryFilter === 'ALL'
              ? 'bg-slate-800 border-indigo-500/50 shadow-md shadow-indigo-500/10'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Cadastrados</span>
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-white">{kpis.total}</div>
          <div className="text-[10px] text-slate-500 mt-1">Todos os documentos</div>
        </div>

        {/* Regulares / Em Dia */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'REGULAR' ? 'ALL' : 'REGULAR')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'REGULAR'
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-500/10'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span>Em Dia / Regulares</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{kpis.regular}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">Validade regular</div>
        </div>

        {/* A Vencer (Alerta) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'A_VENCER' ? 'ALL' : 'A_VENCER')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'A_VENCER'
              ? 'bg-amber-950/40 border-amber-500/60 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span>A Vencer (≤45 dias)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{kpis.aVencer}</div>
          <div className="text-[10px] text-amber-500/80 mt-1">Renovação próxima</div>
        </div>

        {/* Vencidos (Crítico) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'VENCIDO' ? 'ALL' : 'VENCIDO')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'VENCIDO'
              ? 'bg-rose-950/40 border-rose-500/60 shadow-md shadow-rose-500/10'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span>Vencidos</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{kpis.vencido}</div>
          <div className="text-[10px] text-rose-500/80 mt-1">Ação emergencial</div>
        </div>

        {/* Em Renovação */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'EM_RENOVACAO' ? 'ALL' : 'EM_RENOVACAO')}
          className={`p-4 rounded-xl border cursor-pointer transition-all col-span-2 sm:col-span-1 ${
            statusFilter === 'EM_RENOVACAO'
              ? 'bg-sky-950/40 border-sky-500/60 shadow-md shadow-sky-500/10'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-sky-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-sky-400 mb-1">
            <span>Em Renovação</span>
            <RefreshCw className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400">{kpis.emRenovacao}</div>
          <div className="text-[10px] text-sky-500/80 mt-1">Protocolo aberto</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por título, nº de registro, protocolo ou órgão emissor..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="AVCB">AVCB / Bombeiros</option>
            <option value="ALVARA">Alvará de Funcionamento</option>
            <option value="DEDETIZACAO">Dedetização & Pragas</option>
            <option value="SANITARIA">Vigilância Sanitária</option>
            <option value="AGUA">Limpeza de Caixa / Água</option>
            <option value="SST">SST / PGR / PCMSO</option>
            <option value="CREF">CREF Pessoa Jurídica</option>
            <option value="SEGURO">Seguro Predial</option>
            <option value="OUTRO">Outros</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="REGULAR">Em Dia / Regular</option>
            <option value="A_VENCER">A Vencer (≤45 dias)</option>
            <option value="VENCIDO">Vencido</option>
            <option value="EM_RENOVACAO">Em Renovação</option>
            <option value="ISENTO">Isento</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300 mb-1">
            Nenhum documento encontrado
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Tente ajustar os filtros ou o termo de busca para visualizar os registros.'
              : 'Comece cadastrando os alvarás, AVCB, laudos de dedetização e documentos obrigatórios da academia.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Cadastrar Primeiro Documento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const config = categoryConfig[doc.category] || categoryConfig.OUTRO;
            const computedStatus = getDocComputedStatus(doc);
            const daysRemaining = getDaysRemaining(doc.expirationDate);

            return (
              <div
                key={doc.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group hover:-translate-y-0.5"
              >
                <div>
                  {/* Top Category & Status Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${config.bg} ${config.color} border ${config.border}`}>
                      {config.icon}
                      {config.label}
                    </span>

                    {/* Status Badge */}
                    {computedStatus === 'VENCIDO' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                        <AlertCircle className="w-3 h-3" />
                        Vencido
                      </span>
                    )}
                    {computedStatus === 'A_VENCER' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Clock className="w-3 h-3" />
                        A Vencer
                      </span>
                    )}
                    {computedStatus === 'REGULAR' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Em Dia
                      </span>
                    )}
                    {computedStatus === 'EM_RENOVACAO' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <RefreshCw className="w-3 h-3" />
                        Em Renovação
                      </span>
                    )}
                    {computedStatus === 'ISENTO' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                        Isento
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors mb-2 line-clamp-2">
                    {doc.title}
                  </h3>

                  {/* Document Number / Protocol */}
                  {doc.documentNumber && (
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
                      <span className="text-[11px] text-slate-500 font-medium">Nº / Protocolo:</span>
                      <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-200">
                        <span>{doc.documentNumber}</span>
                        <button
                          onClick={(e) => handleCopy(doc.documentNumber!, `num_${doc.id}`, e)}
                          className="text-slate-500 hover:text-amber-400 transition p-0.5"
                          title="Copiar número de registro"
                        >
                          {copiedKey === `num_${doc.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Metadata: Órgão e Datas */}
                  <div className="space-y-1.5 text-xs text-slate-300 my-3">
                    {doc.issuingBody && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">Órgão: <strong className="text-slate-200 font-medium">{doc.issuingBody}</strong></span>
                      </div>
                    )}

                    {doc.issueDate && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span>Emissão: <span className="text-slate-200">{formatDate(doc.issueDate)}</span></span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-3.5 h-3.5 ${computedStatus === 'VENCIDO' ? 'text-rose-400' : computedStatus === 'A_VENCER' ? 'text-amber-400' : 'text-slate-500'}`} />
                        <span className="font-medium text-slate-300">Validade:</span>
                      </div>
                      <span className="font-semibold text-white">
                        {doc.expirationDate ? formatDate(doc.expirationDate) : 'Indeterminada / Permanente'}
                      </span>
                    </div>

                    {/* Expiration Countdown Callout */}
                    {daysRemaining !== null && (
                      <div className={`mt-2 p-2 rounded-lg text-center font-bold text-xs ${
                        daysRemaining < 0
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : daysRemaining <= 45
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10'
                      }`}>
                        {daysRemaining < 0 ? (
                          <span>Vencido há {Math.abs(daysRemaining)} {Math.abs(daysRemaining) === 1 ? 'dia' : 'dias'}</span>
                        ) : daysRemaining === 0 ? (
                          <span>Vence hoje!</span>
                        ) : (
                          <span>Vence em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {doc.notes && (
                    <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50 mb-3 italic">
                      "{doc.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Attachment & Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                  {/* File Attachment Pill */}
                  {doc.fileDataUrl ? (
                    <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">
                            {doc.fileName || 'documento_anexo.pdf'}
                          </p>
                          {doc.fileSizeFormatted && (
                            <span className="text-[10px] text-slate-500">{doc.fileSizeFormatted}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setPreviewDoc({
                            title: doc.title,
                            fileName: doc.fileName || 'documento.pdf',
                            fileDataUrl: doc.fileDataUrl!
                          })}
                          className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition"
                          title="Visualizar documento"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-300" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc.fileDataUrl!, doc.fileName || `${doc.title}.pdf`)}
                          className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition"
                          title="Baixar cópia digital"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-slate-950/40 px-3 py-1.5 rounded-xl border border-dashed border-slate-800 text-[11px] text-slate-500">
                      <span>Nenhum arquivo digital anexado</span>
                      <button
                        onClick={() => handleOpenEdit(doc)}
                        className="text-amber-400 hover:underline font-medium text-[11px]"
                      >
                        + Anexar PDF
                      </button>
                    </div>
                  )}

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <button
                      onClick={() => handleOpenEdit(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Tem certeza que deseja remover o documento "${doc.title}"?`)) {
                          await onDeleteDocument(doc.id);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CADASTRO / EDIÇÃO DE DOCUMENTO REGULATÓRIO */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {editingDoc ? 'Editar Documento Regulatório' : 'Novo Documento Regulatório & Alvará'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cadastre a licença, vistoria ou alvará e acompanhe as validades preventivas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Fill Presets */}
            {!editingDoc && (
              <div className="px-5 pt-4 pb-2 bg-slate-950/50 border-b border-slate-800/80">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  ⚡ Preenchimento Rápido com Modelos da Academia:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset({
                      category: 'AVCB',
                      title: 'Auto de Vistoria do Corpo de Bombeiros (AVCB)',
                      issuingBody: 'PMESP - Polícia Militar / Corpo de Bombeiros',
                      notes: 'Obrigatório para funcionamento seguro e alvará. Validade regular.'
                    })}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    AVCB (Bombeiros)
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset({
                      category: 'ALVARA',
                      title: 'Alvará de Localização e Funcionamento',
                      issuingBody: 'Prefeitura Municipal de Boituva',
                      notes: 'Alvará permanente de licença expedido pela Prefeitura de Boituva.'
                    })}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 transition"
                  >
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    Alvará Permanente
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset({
                      category: 'DEDETIZACAO',
                      title: 'Certificado de Desinsetização e Desratização',
                      issuingBody: 'Empresa Especializada de Controle de Pragas',
                      notes: 'Controle de pragas urbanas e vetores. Renovação semestral.'
                    })}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                  >
                    <Bug className="w-3.5 h-3.5 text-emerald-400" />
                    Dedetização Semestral
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset({
                      category: 'AGUA',
                      title: 'Certificado de Limpeza de Caixa d\'Água & Laudo de Potabilidade',
                      issuingBody: 'Laboratório e Higienização Técnica',
                      notes: 'Higienização semestral com laudo bacteriológico de potabilidade.'
                    })}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition"
                  >
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    Limpeza de Caixa d'Água
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset({
                      category: 'SANITARIA',
                      title: 'Licença da Vigilância Sanitária (VISA)',
                      issuingBody: 'Vigilância Sanitária Municipal de Boituva',
                      notes: 'Licença sanitária para estabelecimento esportivo e fitness.'
                    })}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20 hover:bg-teal-500/20 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    Vigilância Sanitária
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset({
                      category: 'SEGURO',
                      title: 'Apólice de Seguro Predial & Responsabilidade Civil',
                      issuingBody: 'Porto Seguro Cia de Seguros Gerais',
                      notes: 'Apólice anual cobrindo instalações físicas, maquinário e terceiros.'
                    })}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    Seguro Predial
                  </button>
                </div>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Categoria */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Categoria do Documento *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as RegulatoryCategory }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  >
                    <option value="AVCB">AVCB / Corpo de Bombeiros</option>
                    <option value="ALVARA">Alvará de Funcionamento / Localização</option>
                    <option value="DEDETIZACAO">Dedetização & Controle de Pragas</option>
                    <option value="SANITARIA">Vigilância Sanitária</option>
                    <option value="AGUA">Limpeza de Caixa d'Água / Potabilidade</option>
                    <option value="SST">SST / PGR / PCMSO / Laudos de Ruído</option>
                    <option value="CREF">CREF Pessoa Jurídica (Registro de Academia)</option>
                    <option value="SEGURO">Seguro Predial e Terceiros</option>
                    <option value="OUTRO">Outros Documentos Regulatórios</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Status Operacional *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as RegulatoryStatus }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  >
                    <option value="REGULAR">Regular / Em Dia</option>
                    <option value="A_VENCER">A Vencer (Atenção)</option>
                    <option value="VENCIDO">Vencido (Urgente)</option>
                    <option value="EM_RENOVACAO">Em Renovação / Protocolado</option>
                    <option value="ISENTO">Isento / Não Aplicável</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Título / Nome do Documento *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Auto de Vistoria do Corpo de Bombeiros (AVCB)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Número do Documento / Protocolo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nº do Documento / Protocolo / Certificado
                  </label>
                  <input
                    type="text"
                    value={form.documentNumber}
                    onChange={(e) => setForm(prev => ({ ...prev, documentNumber: e.target.value }))}
                    placeholder="Ex: 780892 ou SPP2530223888"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Órgão Emissor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Órgão Emissor / Empresa Responsável
                  </label>
                  <input
                    type="text"
                    value={form.issuingBody}
                    onChange={(e) => setForm(prev => ({ ...prev, issuingBody: e.target.value }))}
                    placeholder="Ex: PMESP, Prefeitura de Boituva, etc."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data de Emissão */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Data de Emissão / Vistoria
                  </label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm(prev => ({ ...prev, issueDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Data de Validade */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Data de Validade (Vencimento)
                  </label>
                  <input
                    type="date"
                    value={form.expirationDate}
                    onChange={(e) => setForm(prev => ({ ...prev, expirationDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Deixe em branco caso o documento seja permanente ou não possua validade definida.
                  </span>
                </div>
              </div>

              {/* Upload de Arquivo Digital (PDF ou Imagem) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Anexar Arquivo Digital (PDF, PNG ou JPG até 15MB)
                </label>
                
                {form.fileDataUrl ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/90 border border-amber-500/30">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {form.fileName || 'documento.pdf'}
                        </p>
                        {form.fileSizeFormatted && (
                          <span className="text-[10px] text-slate-400">{form.fileSizeFormatted}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc({
                          title: form.title || 'Documento',
                          fileName: form.fileName,
                          fileDataUrl: form.fileDataUrl
                        })}
                        className="px-2.5 py-1 rounded-lg bg-slate-700 text-amber-300 text-xs font-semibold hover:bg-slate-600 transition"
                      >
                        Visualizar
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, fileName: '', fileDataUrl: '', fileSizeFormatted: '' }))}
                        className="p-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                        title="Remover arquivo anexo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-4 text-center cursor-pointer transition bg-slate-950/30">
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-300">
                      Clique ou arraste um arquivo PDF / Imagem aqui
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Arquivos ficam salvos com segurança para visualização e download em 1 clique
                    </p>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Observações / Detalhes de Renovação
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informações adicionais, exigências técnicas, contatos do fornecedor..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : editingDoc ? 'Salvar Alterações' : 'Cadastrar Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW DE DOCUMENTO DIGITAL (PDF OU IMAGEM) */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {previewDoc.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    {previewDoc.fileName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDownload(previewDoc.fileDataUrl, previewDoc.fileName)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Arquivo
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-auto flex items-center justify-center">
              {previewDoc.fileDataUrl.startsWith('data:image/') ? (
                <img
                  src={previewDoc.fileDataUrl}
                  alt={previewDoc.title}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : previewDoc.fileDataUrl.startsWith('data:application/pdf') || previewDoc.fileDataUrl.startsWith('blob:') ? (
                <iframe
                  src={getBlobUrl(previewDoc.fileDataUrl)}
                  title={previewDoc.title}
                  className="w-full h-full rounded-lg border border-slate-800"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-300 font-semibold mb-2">
                    Pré-visualização direta não disponível para este formato.
                  </p>
                  <button
                    onClick={() => handleDownload(previewDoc.fileDataUrl, previewDoc.fileName)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Arquivo para Abrir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
