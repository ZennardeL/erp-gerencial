import React, { useState, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Filter, ShieldCheck, AlertTriangle, AlertCircle, 
  FileText, Upload, Download, Eye, Trash2, Edit, Calendar, Phone, Mail, 
  GraduationCap, Briefcase, FileCheck, CheckCircle2, Clock, X, Camera,
  Copy, Check, Fingerprint, CreditCard
} from 'lucide-react';
import { Employee, EmployeeDocument } from '../shared/types';
import { formatDate } from '../shared/formatters';

interface EmployeeViewProps {
  employees: Employee[];
  onAddEmployee: (emp: Partial<Employee>) => Promise<void>;
  onEditEmployee: (emp: Partial<Employee>) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  onAddDocument: (empId: string, doc: Partial<EmployeeDocument>) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
}

export const EmployeeView: React.FC<EmployeeViewProps> = ({
  employees,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onAddDocument,
  onDeleteDocument
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [docAlertFilter, setDocAlertFilter] = useState('ALL'); // ALL, EXPIRING, EXPIRED

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
      console.error('Erro ao copiar para área de transferência:', err);
    }
  };

  // Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [selectedEmployeeForDocs, setSelectedEmployeeForDocs] = useState<Employee | null>(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; fileName: string; fileDataUrl: string } | null>(null);

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
      console.error('Erro ao converter para Blob:', e);
      return dataUrl;
    }
  };

  const handleOpenPreview = (doc: EmployeeDocument) => {
    if (!doc.fileDataUrl) return;
    setPreviewDoc({
      title: doc.title,
      fileName: doc.fileName,
      fileDataUrl: doc.fileDataUrl
    });
  };

  const handleDownloadDocument = (fileDataUrl: string, fileName: string) => {
    try {
      const blobUrl = getBlobUrl(fileDataUrl);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'documento.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Erro ao baixar documento:', e);
    }
  };

  // Form State for Employee
  const [empForm, setEmpForm] = useState({
    name: '',
    role: 'PROFESSOR' as Employee['role'],
    avatarUrl: '',
    cpf: '',
    rg: '',
    crefNumber: '',
    phone: '',
    email: '',
    admissionDate: new Date().toISOString().split('T')[0],
    status: 'ATIVO' as Employee['status'],
    notes: ''
  });

  // Form State for Document
  const [docForm, setDocForm] = useState({
    docType: 'CREF' as EmployeeDocument['docType'],
    title: '',
    file: null as File | null,
    issueDate: '',
    expirationDate: '',
    notes: ''
  });
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Expiration Logic Helpers
  const getDocumentStatus = (doc: EmployeeDocument) => {
    if (!doc.expirationDate) return 'VALID';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(doc.expirationDate);
    exp.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 30) return 'EXPIRING';
    return 'VALID';
  };

  const getEmployeeDocumentSummary = (emp: Employee) => {
    let expired = 0;
    let expiring = 0;
    let valid = 0;

    (emp.documents || []).forEach(d => {
      const st = getDocumentStatus(d);
      if (st === 'EXPIRED') expired++;
      else if (st === 'EXPIRING') expiring++;
      else valid++;
    });

    return { expired, expiring, valid, total: (emp.documents || []).length };
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'ATIVO').length;
    const professors = employees.filter(e => e.role === 'PROFESSOR').length;

    let totalExpiring = 0;
    let totalExpired = 0;

    employees.forEach(e => {
      const summary = getEmployeeDocumentSummary(e);
      totalExpiring += summary.expiring;
      totalExpired += summary.expired;
    });

    return { total, active, professors, totalExpiring, totalExpired };
  }, [employees]);

  // Filtered List
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = 
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.crefNumber && e.crefNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.cpf && e.cpf.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.rg && e.rg.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = roleFilter === 'ALL' || e.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;

      const docSummary = getEmployeeDocumentSummary(e);
      let matchDocAlert = true;
      if (docAlertFilter === 'EXPIRING') matchDocAlert = docSummary.expiring > 0;
      if (docAlertFilter === 'EXPIRED') matchDocAlert = docSummary.expired > 0;

      return matchSearch && matchRole && matchStatus && matchDocAlert;
    });
  }, [employees, searchTerm, roleFilter, statusFilter, docAlertFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setEmpForm({
      name: '',
      role: 'PROFESSOR',
      avatarUrl: '',
      cpf: '',
      rg: '',
      crefNumber: '',
      phone: '',
      email: '',
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'ATIVO',
      notes: ''
    });
    setShowEmployeeModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpForm({
      name: emp.name,
      role: emp.role,
      avatarUrl: emp.avatarUrl || '',
      cpf: emp.cpf || '',
      rg: emp.rg || '',
      crefNumber: emp.crefNumber || '',
      phone: emp.phone || '',
      email: emp.email || '',
      admissionDate: emp.admissionDate || new Date().toISOString().split('T')[0],
      status: emp.status,
      notes: emp.notes || ''
    });
    setShowEmployeeModal(true);
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('A foto deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setEmpForm(prev => ({ ...prev, avatarUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Save Employee
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name.trim()) {
      alert('Por favor, informe o nome do colaborador.');
      return;
    }

    if (editingEmployee) {
      await onEditEmployee({ id: editingEmployee.id, ...empForm });
      if (selectedEmployeeForDocs?.id === editingEmployee.id) {
        setSelectedEmployeeForDocs((prev: Employee | null) => prev ? { ...prev, ...empForm } : null);
      }
    } else {
      await onAddEmployee(empForm);
    }

    setShowEmployeeModal(false);
  };

  // Save Document
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForDocs) return;

    if (!docForm.title.trim()) {
      alert('Informe o título do documento.');
      return;
    }

    let fileDataUrl = '';
    let fileName = 'documento.pdf';
    let fileSizeFormatted = '';

    if (docForm.file) {
      fileName = docForm.file.name;
      const sizeKB = (docForm.file.size / 1024).toFixed(1);
      fileSizeFormatted = `${sizeKB} KB`;

      setIsUploadingDoc(true);
      fileDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(docForm.file!);
      });
      setIsUploadingDoc(false);
    }

    await onAddDocument(selectedEmployeeForDocs.id, {
      docType: docForm.docType,
      title: docForm.title,
      fileName,
      fileDataUrl,
      fileSizeFormatted,
      issueDate: docForm.issueDate || undefined,
      expirationDate: docForm.expirationDate || null,
      notes: docForm.notes
    });

    // Reset doc form
    setDocForm({
      docType: 'CREF',
      title: '',
      file: null,
      issueDate: '',
      expirationDate: '',
      notes: ''
    });
    setShowAddDocModal(false);

    // Refresh selected employee for modal
    const updated = employees.find(e => e.id === selectedEmployeeForDocs.id);
    if (updated) setSelectedEmployeeForDocs(updated);
  };

  // Role Badge Helper
  const getRoleBadge = (role: Employee['role']) => {
    switch (role) {
      case 'PROFESSOR':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Professor(a)</span>;
      case 'RECEPCAO':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Recepção</span>;
      case 'GERENTE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Gerente</span>;
      case 'LIMPEZA':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Limpeza</span>;
      case 'MANUTENCAO':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">Manutenção</span>;
      case 'ESTAGIARIO':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Estagiário(a)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">Outro</span>;
    }
  };

  // Initials Helper for Avatar fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur border border-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Ficha de Funcionários & CREF</h2>
              <p className="text-xs text-slate-400">Gestão de colaboradores, fotos de perfil, contratos e controle de validade de documentos</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
        >
          <UserPlus className="w-4 h-4" />
          Cadastrar Funcionário
        </button>
      </div>

      {/* KPI Alert Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Total Colaboradores</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">{kpis.total}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">{kpis.active} ativos</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Professores (CREF)</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">{kpis.professors}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Equipe técnica</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div 
          onClick={() => setDocAlertFilter(docAlertFilter === 'EXPIRING' ? 'ALL' : 'EXPIRING')}
          className={`bg-slate-900 border p-3 sm:p-4 rounded-xl flex items-center justify-between cursor-pointer transition ${
            docAlertFilter === 'EXPIRING' ? 'border-amber-500 shadow-lg shadow-amber-500/10' : 'border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">A Vencer (30d)</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">{kpis.totalExpiring}</p>
            <p className="text-[10px] sm:text-[11px] text-amber-500/80 mt-0.5">Renovação</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div 
          onClick={() => setDocAlertFilter(docAlertFilter === 'EXPIRED' ? 'ALL' : 'EXPIRED')}
          className={`bg-slate-900 border p-3 sm:p-4 rounded-xl flex items-center justify-between cursor-pointer transition ${
            docAlertFilter === 'EXPIRED' ? 'border-rose-500 shadow-lg shadow-rose-500/10' : 'border-slate-800 hover:border-rose-500/40'
          }`}
        >
          <div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Vencidos</p>
            <p className="text-xl sm:text-2xl font-bold text-rose-400 mt-1">{kpis.totalExpired}</p>
            <p className="text-[10px] sm:text-[11px] text-rose-500/80 mt-0.5">Ação urgente</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 p-3 sm:p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, RG ou número do CREF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Todos os Cargos</option>
            <option value="PROFESSOR">Professores</option>
            <option value="ESTAGIARIO">Estagiários</option>
            <option value="RECEPCAO">Recepção</option>
            <option value="GERENTE">Gerência</option>
            <option value="LIMPEZA">Limpeza</option>
            <option value="MANUTENCAO">Manutenção</option>
            <option value="OUTRO">Outros</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ATIVO">Ativos</option>
            <option value="FERIAS">Em Férias</option>
            <option value="AFASTADO">Afastado</option>
            <option value="INATIVO">Inativos</option>
          </select>
        </div>
      </div>

      {/* Employee List Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">Nenhum colaborador encontrado</h3>
            <p className="text-xs text-slate-500 mt-1">Tente ajustar a busca ou adicione um novo funcionário.</p>
          </div>
        ) : (
          filteredEmployees.map((emp) => {
            const docSummary = getEmployeeDocumentSummary(emp);
            return (
              <div 
                key={emp.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition shadow-lg flex flex-col justify-between"
              >
                {/* Employee Header Info & Photo */}
                <div className="flex items-start gap-3.5">
                  {/* Photo Avatar */}
                  <div className="relative flex-shrink-0">
                    {emp.avatarUrl ? (
                      <img 
                        src={emp.avatarUrl} 
                        alt={emp.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-bold text-lg shadow-md border border-indigo-500/30">
                        {getInitials(emp.name)}
                      </div>
                    )}
                    {emp.status === 'ATIVO' && (
                      <span className="w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full absolute -bottom-0.5 -right-0.5" title="Ativo" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-white truncate">{emp.name}</h3>
                      {getRoleBadge(emp.role)}
                    </div>

                    {emp.role === 'PROFESSOR' && emp.crefNumber && (
                      <p className="text-xs text-indigo-400 font-mono mt-0.5 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        CREF: {emp.crefNumber}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                      {emp.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {emp.phone}
                        </span>
                      )}
                      {emp.admissionDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Admitido em {formatDate(emp.admissionDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* CPF & RG Quick Access Bar */}
                <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs">
                  {/* CPF */}
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                        CPF
                      </span>
                      <p className="font-mono text-xs font-semibold text-slate-200 truncate mt-0.5" title={emp.cpf || 'Não cadastrado'}>
                        {emp.cpf || <span className="text-slate-500 font-normal italic">Não informado</span>}
                      </p>
                    </div>
                    {emp.cpf && (
                      <button
                        type="button"
                        onClick={(e) => handleCopy(emp.cpf!, `card-cpf-${emp.id}`, e)}
                        className={`p-1.5 rounded-lg transition flex-shrink-0 ${
                          copiedKey === `card-cpf-${emp.id}`
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                        title="Copiar CPF"
                      >
                        {copiedKey === `card-cpf-${emp.id}` ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* RG */}
                  <div className="flex items-center justify-between gap-1 min-w-0 border-l border-slate-800/80 pl-2.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <Fingerprint className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        RG
                      </span>
                      <p className="font-mono text-xs font-semibold text-slate-200 truncate mt-0.5" title={emp.rg || 'Não cadastrado'}>
                        {emp.rg || <span className="text-slate-500 font-normal italic">Não informado</span>}
                      </p>
                    </div>
                    {emp.rg && (
                      <button
                        type="button"
                        onClick={(e) => handleCopy(emp.rg!, `card-rg-${emp.id}`, e)}
                        className={`p-1.5 rounded-lg transition flex-shrink-0 ${
                          copiedKey === `card-rg-${emp.id}`
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                        title="Copiar RG"
                      >
                        {copiedKey === `card-rg-${emp.id}` ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Documents & Expiration Status Badge */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      Documentos Anexados ({docSummary.total})
                    </span>
                    
                    {docSummary.expired > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                        <AlertCircle className="w-3 h-3" />
                        {docSummary.expired} Vencido(s)
                      </span>
                    ) : docSummary.expiring > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3 h-3" />
                        {docSummary.expiring} Vence em breve
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" />
                        OK / Válidos
                      </span>
                    )}
                  </div>

                  {/* List preview of top 2 docs */}
                  {(emp.documents || []).length > 0 ? (
                    <div className="space-y-1 pt-1">
                      {emp.documents.slice(0, 2).map((d) => {
                        const st = getDocumentStatus(d);
                        return (
                          <div key={d.id} className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/40 px-2 py-1 rounded">
                            <span className="truncate max-w-[170px] font-medium text-slate-200">{d.title}</span>
                            {d.expirationDate ? (
                              <span className={st === 'EXPIRED' ? 'text-rose-400 font-semibold' : st === 'EXPIRING' ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                                Val: {formatDate(d.expirationDate)}
                              </span>
                            ) : (
                              <span className="text-slate-500">Sem vencimento</span>
                            )}
                          </div>
                        );
                      })}
                      {(emp.documents || []).length > 2 && (
                        <p className="text-[10px] text-slate-500 text-right">+ {(emp.documents || []).length - 2} outros documentos</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">Nenhum documento ou CREF anexado ainda.</p>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                  <button
                    onClick={() => setSelectedEmployeeForDocs(emp)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-lg transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Ver Ficha & Documentos
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="Editar Funcionário"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir o cadastro de ${emp.name}?`)) {
                          onDeleteEmployee(emp.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Excluir Colaborador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT EMPLOYEE MODAL */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                {editingEmployee ? 'Editar Ficha do Funcionário' : 'Novo Cadastro de Funcionário'}
              </h3>
              <button 
                onClick={() => setShowEmployeeModal(false)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-4 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Photo Upload Section */}
              <div className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <div className="relative">
                  {empForm.avatarUrl ? (
                    <img 
                      src={empForm.avatarUrl} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-400">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Foto de Perfil do Funcionário</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-300 hover:file:bg-indigo-600/30 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">Selecione uma imagem (PNG, JPG, WEBP) para fácil identificação.</p>
                </div>
              </div>

              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Prof. João Silva"
                    value={empForm.name}
                    onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cargo / Função *</label>
                  <select
                    value={empForm.role}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value as Employee['role'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PROFESSOR">Professor(a) / Instrutor</option>
                    <option value="ESTAGIARIO">Estagiário(a) (Contrato com término/vigência)</option>
                    <option value="RECEPCAO">Recepção / Atendimento</option>
                    <option value="GERENTE">Gerência / Coordenação</option>
                    <option value="LIMPEZA">Serviços Gerais / Limpeza</option>
                    <option value="MANUTENCAO">Manutenção Prévia</option>
                    <option value="OUTRO">Outro Cargo</option>
                  </select>
                </div>
              </div>

              {/* Documentos Pessoais: CPF e RG */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                    CPF (Cadastro de Pessoa Física)
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={empForm.cpf}
                    onChange={(e) => setEmpForm({ ...empForm, cpf: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                    RG (Registro Geral / Identidade)
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000-0"
                    value={empForm.rg}
                    onChange={(e) => setEmpForm({ ...empForm, rg: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* CREF (Professores) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  Número do CREF {empForm.role === 'PROFESSOR' && <span className="text-amber-400 font-bold">* (Obrigatório para Professores)</span>}
                </label>
                <input
                  type="text"
                  placeholder="Ex: 012345-G/SP"
                  value={empForm.crefNumber}
                  onChange={(e) => setEmpForm({ ...empForm, crefNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="funcionario@academia.com"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Admission Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data de Admissão</label>
                  <input
                    type="date"
                    value={empForm.admissionDate}
                    onChange={(e) => setEmpForm({ ...empForm, admissionDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={empForm.status}
                    onChange={(e) => setEmpForm({ ...empForm, status: e.target.value as Employee['status'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="FERIAS">Férias</option>
                    <option value="AFASTADO">Afastado</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  placeholder="Anotações gerais sobre o funcionário..."
                  value={empForm.notes}
                  onChange={(e) => setEmpForm({ ...empForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  {editingEmployee ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMPLOYEE DETAILS & DOCUMENT MANAGEMENT MODAL */}
      {selectedEmployeeForDocs && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-3 min-w-0">
                {selectedEmployeeForDocs.avatarUrl ? (
                  <img 
                    src={selectedEmployeeForDocs.avatarUrl} 
                    alt={selectedEmployeeForDocs.name} 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-indigo-500/40 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                    {getInitials(selectedEmployeeForDocs.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">{selectedEmployeeForDocs.name}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                    {getRoleBadge(selectedEmployeeForDocs.role)}
                    {selectedEmployeeForDocs.crefNumber && (
                      <span className="text-xs text-indigo-400 font-mono">CREF: {selectedEmployeeForDocs.crefNumber}</span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedEmployeeForDocs(null)}
                className="text-slate-400 hover:text-white transition p-1 ml-2 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
              {/* DADOS CADASTRAIS & DOCUMENTOS PESSOAIS (CPF, RG, CONTATO) */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Dados Cadastrais & Identificação</h4>
                      <p className="text-[11px] text-slate-400">CPF e RG para preenchimento de termos, contratos e relatórios</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const empToEdit = employees.find(e => e.id === selectedEmployeeForDocs.id) || selectedEmployeeForDocs;
                      handleOpenEdit(empToEdit);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700 shadow-sm"
                    title="Editar informações cadastrais"
                  >
                    <Edit className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Editar Cadastro</span>
                  </button>
                </div>

                {/* CPF and RG Cards - High Visibility */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* CPF Card */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-700 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CPF</p>
                        <p className="text-base sm:text-lg font-mono font-bold text-white tracking-wide truncate">
                          {selectedEmployeeForDocs.cpf || <span className="text-slate-500 font-normal italic text-sm">Não informado</span>}
                        </p>
                      </div>
                    </div>

                    {selectedEmployeeForDocs.cpf && (
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedEmployeeForDocs.cpf!, 'modal-cpf')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shadow-sm ${
                          copiedKey === 'modal-cpf'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {copiedKey === 'modal-cpf' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* RG Card */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-700 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RG (Identidade)</p>
                        <p className="text-base sm:text-lg font-mono font-bold text-white tracking-wide truncate">
                          {selectedEmployeeForDocs.rg || <span className="text-slate-500 font-normal italic text-sm">Não informado</span>}
                        </p>
                      </div>
                    </div>

                    {selectedEmployeeForDocs.rg ? (
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedEmployeeForDocs.rg!, 'modal-rg')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shadow-sm ${
                          copiedKey === 'modal-rg'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {copiedKey === 'modal-rg' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const empToEdit = employees.find(e => e.id === selectedEmployeeForDocs.id) || selectedEmployeeForDocs;
                          handleOpenEdit(empToEdit);
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                      >
                        + Cadastrar RG
                      </button>
                    )}
                  </div>
                </div>

                {/* Secondary details row (Phone, Email, Admission, Status) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                  <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-medium block">Telefone / WhatsApp</span>
                    {selectedEmployeeForDocs.phone ? (
                      <a 
                        href={`https://wa.me/55${selectedEmployeeForDocs.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-emerald-400 hover:underline flex items-center gap-1 mt-0.5 truncate"
                      >
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{selectedEmployeeForDocs.phone}</span>
                      </a>
                    ) : (
                      <span className="text-slate-500 italic mt-0.5 block">—</span>
                    )}
                  </div>

                  <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-medium block">Data de Admissão</span>
                    <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      {selectedEmployeeForDocs.admissionDate ? formatDate(selectedEmployeeForDocs.admissionDate) : '—'}
                    </span>
                  </div>

                  <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-medium block">E-mail</span>
                    <span className="font-medium text-slate-200 truncate block mt-0.5" title={selectedEmployeeForDocs.email || ''}>
                      {selectedEmployeeForDocs.email || '—'}
                    </span>
                  </div>

                  <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-medium block">Status no Sistema</span>
                    <span className="font-semibold text-emerald-400 mt-0.5 inline-block">
                      {selectedEmployeeForDocs.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Actions Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Documentos e Certificados
                  </h4>
                  <p className="text-xs text-slate-400">Controle de validade de CREF, contratos e atestados do colaborador</p>
                </div>

                <button
                  onClick={() => setShowAddDocModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md w-full sm:w-auto"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Anexar Novo Documento PDF
                </button>
              </div>

              {/* Document List */}
              {(selectedEmployeeForDocs.documents || []).length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-8 text-center space-y-2">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">Nenhum documento anexado a este colaborador.</p>
                  <p className="text-xs text-slate-500">Clique em "Anexar Novo Documento PDF" para adicionar a carteira do CREF ou contrato.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEmployeeForDocs.documents.map((doc) => {
                    const st = getDocumentStatus(doc);
                    return (
                      <div 
                        key={doc.id}
                        className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          st === 'EXPIRED' 
                            ? 'bg-rose-500/5 border-rose-500/30' 
                            : st === 'EXPIRING' 
                            ? 'bg-amber-500/5 border-amber-500/30' 
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            st === 'EXPIRED' ? 'bg-rose-500/10 text-rose-400' : st === 'EXPIRING' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            <FileText className="w-5 h-5" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-white">{doc.title}</h5>
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {doc.docType}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 mt-0.5">{doc.fileName} {doc.fileSizeFormatted && `(${doc.fileSizeFormatted})`}</p>

                            <div className="flex flex-wrap items-center gap-4 text-xs mt-2">
                              {doc.expirationDate ? (
                                <span className={`flex items-center gap-1 font-semibold ${
                                  st === 'EXPIRED' ? 'text-rose-400' : st === 'EXPIRING' ? 'text-amber-400' : 'text-emerald-400'
                                }`}>
                                  <Clock className="w-3.5 h-3.5" />
                                  Validade: {formatDate(doc.expirationDate)}
                                  {st === 'EXPIRED' && ' (VENCIDO)'}
                                  {st === 'EXPIRING' && ' (A VENCER EM BREVE)'}
                                </span>
                              ) : (
                                <span className="text-slate-500">Sem data de vencimento</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Document Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {doc.fileDataUrl && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenPreview(doc)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition border border-slate-700 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                                Visualizar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadDocument(doc.fileDataUrl, doc.fileName)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-lg transition border border-indigo-500/30 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Baixar
                              </button>
                            </>
                          )}

                          <button
                            onClick={async () => {
                              if (confirm(`Excluir o documento "${doc.title}"?`)) {
                                await onDeleteDocument(doc.id);
                                const updated = employees.find(e => e.id === selectedEmployeeForDocs.id);
                                if (updated) setSelectedEmployeeForDocs(updated);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Excluir Documento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {showAddDocModal && selectedEmployeeForDocs && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                Anexar Documento / PDF
              </h3>
              <button 
                onClick={() => setShowAddDocModal(false)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Documento *</label>
                <select
                  value={docForm.docType}
                  onChange={(e) => {
                    const dt = e.target.value as EmployeeDocument['docType'];
                    let defaultTitle = docForm.title;
                    if (dt === 'CREF') defaultTitle = `Carteira do CREF - ${selectedEmployeeForDocs.name}`;
                    if (dt === 'CONTRATO_ESTAGIO') defaultTitle = `Termo de Compromisso / Contrato de Estágio - ${selectedEmployeeForDocs.name}`;
                    setDocForm({ 
                      ...docForm, 
                      docType: dt,
                      title: defaultTitle
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="CREF">Carteira do CREF (Professores)</option>
                  <option value="CONTRATO_ESTAGIO">Contrato de Estágio (Período & Vigência)</option>
                  <option value="CONTRATO">Contrato CLT / Prestação de Serviço</option>
                  <option value="DOCUMENTO_PESSOAL">Documento Pessoal (RG / CNH / CPF)</option>
                  <option value="ATESTADO_MEDICO">Atestado Médico / Ocupacional</option>
                  <option value="CERTIFICADO">Certificado de Curso / Especialização</option>
                  <option value="OUTRO">Outro Documento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título do Documento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Registro CREF 2026 / Contrato de Trabalho"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Arquivo PDF ou Imagem *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/*"
                  onChange={(e) => setDocForm({ ...docForm, file: e.target.files?.[0] || null })}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-300 hover:file:bg-indigo-600/30 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Data de Vencimento / Validade <span className="text-amber-400 font-bold">(Alertará 30 dias antes)</span>
                </label>
                <input
                  type="date"
                  value={docForm.expirationDate}
                  onChange={(e) => setDocForm({ ...docForm, expirationDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Anotações / Observações</label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais sobre o documento..."
                  value={docForm.notes}
                  onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploadingDoc}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isUploadingDoc ? 'Anexando PDF...' : 'Anexar Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL (IN-APP PDF & IMAGE VIEWER) */}
      {previewDoc && (
        <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{previewDoc.title}</h3>
                  <p className="text-xs text-slate-400 truncate">{previewDoc.fileName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const blobUrl = getBlobUrl(previewDoc.fileDataUrl);
                    window.open(blobUrl, '_blank');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition border border-slate-700 cursor-pointer"
                  title="Abrir em nova aba do navegador"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Abrir em Nova Aba</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadDocument(previewDoc.fileDataUrl, previewDoc.fileName)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition shadow-md cursor-pointer"
                  title="Baixar arquivo"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Baixar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition ml-2 cursor-pointer"
                  title="Fechar visualização"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="flex-1 bg-slate-950 p-2 overflow-hidden flex items-center justify-center">
              {previewDoc.fileDataUrl.startsWith('data:image/') ? (
                <img
                  src={previewDoc.fileDataUrl}
                  alt={previewDoc.title}
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              ) : (
                <iframe
                  src={getBlobUrl(previewDoc.fileDataUrl)}
                  title={previewDoc.title}
                  className="w-full h-full rounded-lg border border-slate-800 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
