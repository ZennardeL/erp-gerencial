import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Landmark,
  Calculator,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Award,
  Layers,
  Target,
  Clock,
  Receipt,
  Building2,
  Wrench,
  PiggyBank,
  HelpCircle,
  Sliders
} from 'lucide-react';

export const OwnerDiagnosisView: React.FC = () => {
  // Active filter tab inside the Diagnosis module
  const [activeSection, setActiveSection] = useState<'all' | 'patrao' | 'custo_aluno' | 'dre_4meses' | 'simulador' | 'bancos_evo'>('all');

  // Interactive Simulator States
  const [simStudents, setSimStudents] = useState<number>(884);
  const [simScenario, setSimScenario] = useState<'nov26' | 'mar27' | 'pos_kikos'>('nov26');
  const [simKikosInstallment, setSimKikosInstallment] = useState<number>(30000);
  const [simAvgTicket, setSimAvgTicket] = useState<number>(120.25);

  // Simulator Calculations
  const baseOperatingCostWithWrp = 84900; // Custo operacional recorrente com WRP
  const wrpMonthlyCost = 3135.92;
  const anilhasMonthlyCost = 3368.83;
  const bankLoansMonthly = 4928.00; // Votorantim (3175) + Alfa (1753)

  // Custo operacional limpo sem WRP = R$ 81.764,08 (ou ~R$ 83.465 considerando pequena variação de DAS sobre novos alunos)
  const extraStudents = simStudents - 884;
  const estimatedGrossRevenue = Math.round(simStudents * simAvgTicket);
  const variableTaxAdjustment = extraStudents * simAvgTicket * 0.06; // ~6% Simples Nacional marginal
  const cleanOperatingCost = Math.round((baseOperatingCostWithWrp - wrpMonthlyCost) + variableTaxAdjustment);
  const cleanOperatingProfit = estimatedGrossRevenue - cleanOperatingCost;
  const cashAfterBanks = cleanOperatingProfit - bankLoansMonthly;

  const activeAnilhasCost = simScenario === 'nov26' ? anilhasMonthlyCost : 0;
  const activeKikosCost = simScenario === 'pos_kikos' ? 0 : simKikosInstallment;
  const totalCapexMonthly = activeKikosCost + activeAnilhasCost;
  const finalFreeCash = Math.round(cashAfterBanks - totalCapexMonthly);

  const realCostPerStudentSim = cleanOperatingCost / simStudents;
  const realProfitPerStudentSim = simAvgTicket - realCostPerStudentSim;

  const formatBRL = (val: number, decimals = 0) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Top Executive Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Unidade Panobianco Boituva (#328) • Auditoria Oficial Jul–Out/2026
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              Diagnóstico Financeiro, Custo por Aluno & Painel do Patrão
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Visão gerencial consolidada cruzando <strong>EVO (DRE v2 + Resumo Gerencial)</strong>, <strong>Extrato Bradesco</strong>, <strong>Extrato Stone</strong> e <strong>Contas a Pagar</strong>, já considerando o fim da despesa da <strong>WRP (Outubro)</strong> e da <strong>Nacional Anilhas (Fevereiro)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Saldo Bancário Consolidado</span>
              <span className="text-lg font-black text-emerald-400">R$ 90.300,15</span>
              <span className="text-[10px] text-slate-400 block">Bradesco + Stone (30/09)</span>
            </div>
          </div>
        </div>

        {/* 4 Hero Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* Card 1: Lucro Operacional Limpo */}
          <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Lucro da Operação (Sem WRP)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">+R$ 24.536<span className="text-xs font-normal text-slate-400">/mês</span></p>
            <p className="text-[11px] text-emerald-300 mt-1 font-medium">
              Sobe de R$ 21.400 p/ R$ 24.536 já em Nov/26 (Margem 23,1%)
            </p>
          </div>

          {/* Card 2: Custo Real por Aluno vs EVO */}
          <div className="bg-slate-950/70 border border-sky-500/30 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Custo Real por Aluno</span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-black text-white">R$ 94,40</p>
              <span className="text-xs line-through text-rose-400 font-semibold">EVO: R$ 159,73</span>
            </div>
            <p className="text-[11px] text-sky-300 mt-1 font-medium">
              Cada aluno paga R$ 120,25 e deixa <strong>+R$ 25,85</strong> de lucro/mês
            </p>
          </div>

          {/* Card 3: Alívio WRP + Anilhas */}
          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Economia WRP + Anilhas</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-400 mt-2">+R$ 6.504,75<span className="text-xs font-normal text-slate-400">/mês</span></p>
            <p className="text-[11px] text-slate-300 mt-1">
              <strong>+R$ 78.057/ano</strong> a mais no caixa (WRP Out + Anilhas Fev)
            </p>
          </div>

          {/* Card 4: Base Total Frequentadora */}
          <div className="bg-slate-950/70 border border-indigo-500/30 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Comunidade Ativa (Out/26)</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">1.544 <span className="text-xs font-normal text-slate-400">alunos</span></p>
            <p className="text-[11px] text-indigo-300 mt-1">
              881 Contratos Diretos + 663 Wellhub/TotalPass (Custo R$ 54,40/pessoa)
            </p>
          </div>
        </div>

        {/* Sub-navigation Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800/80">
          {[
            { id: 'all', label: '🌟 Visão Completa (Tudo)' },
            { id: 'patrao', label: '👑 Explicação Simples & Alívio de Caixa' },
            { id: 'custo_aluno', label: '🧮 Custo por Aluno (Real vs EVO)' },
            { id: 'simulador', label: '🚀 Simulador Interativo do Patrão' },
            { id: 'dre_4meses', label: '📊 DRE & Indicadores (Jul a Out)' },
            { id: 'bancos_evo', label: '🏦 Bancos, Auditoria EVO & Plano de Ação' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSection === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================================
          SEÇÃO 1: EXPLICAÇÃO SIMPLES ("COMO SE FOSSE PARA UMA CRIANÇA") + ALÍVIO
         ===================================================================== */}
      {(activeSection === 'all' || activeSection === 'patrao') && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Explicação Direta e Visual • Sem "Economês"
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                  🍋 A Regra da Barraca de Limonada: Quanto Sobra Todo Mês para o Patrão?
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-center">
                A Academia dá +R$ 24.536/mês de Lucro Operacional!
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed">
              Imagine que a <strong>Panobianco Boituva</strong> é uma barraca de limonada gigante. Todo mês os alunos compram limonada, nós pagamos os ingredientes e os funcionários, e <strong>sobra uma pilha de dinheiro limpo em cima da mesa</strong>. Mas, em vez de colocar tudo no bolso agora, o patrão está usando essa sobra para pagar as parcelas das máquinas novas que montaram a academia (<strong>Kikos</strong> e <strong>Anilhas</strong>). Veja a conta exata de <strong>Novembro em diante (já sem a WRP)</strong>:
            </p>

            {/* 4 Step Visual Flow */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
              {/* Passo 1 */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  1. Entra no Caixa
                </span>
                <p className="text-xl font-black text-sky-400 mt-2">+R$ 106.300</p>
                <p className="text-xs font-semibold text-white mt-1">Receita Mensal Recebida</p>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Mensalidades dos <strong>884 alunos ativos</strong> + repasses de <strong>651 alunos Wellhub/TotalPass</strong> + vendas da Lojinha.
                </p>
              </div>

              {/* Passo 2 */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  2. Contas da Academia
                </span>
                <p className="text-xl font-black text-rose-400 mt-2">-R$ 81.764</p>
                <p className="text-xs font-semibold text-white mt-1">Custo p/ Funcionar (Sem WRP)</p>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Folha normal (R$ 38,2k), Aluguel + Estac. (R$ 28k), 2 Relógios CPFL + Sabesp (R$ 12,1k), Imposto DAS (R$ 5,3k) e Manutenção.
                </p>
              </div>

              {/* Passo 3 */}
              <div className="bg-emerald-950/20 border-2 border-emerald-500/40 rounded-xl p-4 relative">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  3. Lucro da Operação
                </span>
                <p className="text-xl font-black text-emerald-400 mt-2">+R$ 24.536</p>
                <p className="text-xs font-semibold text-emerald-200 mt-1">Sobra Limpa da Academia</p>
                <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                  É o que a academia gera sozinha todo mês! Tirando os 2 bancos (<strong>-R$ 4.928</strong> Votorantim/Alfa), sobram <strong>+R$ 19.608 livres</strong>!
                </p>
              </div>

              {/* Passo 4 */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 relative">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  4. Pagamento das Máquinas
                </span>
                <p className="text-xl font-black text-amber-400 mt-2">-R$ 27.369 a -R$ 33.369</p>
                <p className="text-xs font-semibold text-amber-200 mt-1">Investimento (Kikos + Anilhas)</p>
                <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                  Os <strong>+R$ 19.608</strong> que sobraram pagam quase toda a parcela das máquinas (que não é gasto, é patrimônio do patrão!).
                </p>
              </div>
            </div>

            {/* Linha do Tempo das 2 Despesas que Acabam + Kikos */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Linha do Tempo do Alívio Financeiro: O que muda com o fim da WRP e da Nacional Anilhas?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Etapa A: Novembro 2026 */}
                <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-emerald-400">1º Alívio • Novembro/2026</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      IMEDIATO
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white mt-2">Fim da WRP Terceirizada</h4>
                  <p className="text-xl font-black text-emerald-400 mt-1">+R$ 3.135,92 / mês no bolso</p>
                  <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Economia anual de <strong>R$ 37.631,04</strong> em despesa fixa.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Além disso, no Contas a Pagar do EVO, os boletos agendados da <strong>Kikos caem de R$ 30.000 para R$ 24.000/mês</strong> em Nov/26 (<strong>+R$ 6.000/mês</strong> de fôlego extra!).</span>
                    </li>
                  </ul>
                </div>

                {/* Etapa B: Março 2027 */}
                <div className="bg-slate-950 border border-sky-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-sky-400">2º Alívio • Pós-Fevereiro/2027</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      EM 4 MESES
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white mt-2">Fim da Nacional Anilhas</h4>
                  <p className="text-xl font-black text-sky-400 mt-1">+R$ 3.368,83 / mês livres</p>
                  <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
                      <span>Última parcela de R$ 3.368,83 vence em <strong>Fevereiro/2027</strong>.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
                      <span>Somando <strong>WRP + Anilhas</strong>, a academia ganha <strong>+R$ 6.504,75 todo mês</strong> (<strong>+R$ 78.057,00 por ano</strong> de sobra limpa!).</span>
                    </li>
                  </ul>
                </div>

                {/* Etapa C: Pós-Kikos */}
                <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-amber-400">3º Alívio • Quitação Kikos</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      MINA DE OURO
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white mt-2">Máquinas 100% Quitadas</h4>
                  <p className="text-xl font-black text-amber-400 mt-1">+R$ 24.000 a +R$ 30.000 / mês</p>
                  <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>Assim que o parcelamento da Kikos terminar, o lucro líquido que vai direto para o bolso dos sócios salta para <strong>R$ 20.000 a R$ 30.000/mês</strong>.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SEÇÃO 2: CUSTO POR ALUNO (R$ 94,40 REAL VS R$ 159,73 DO EVO)
         ===================================================================== */}
      {(activeSection === 'all' || activeSection === 'custo_aluno') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                Matemática Unitária Auditada • Por que o Relatório do EVO Assustava?
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                🧮 Quanto Custa e Quanto Vale Cada Aluno de Verdade?
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
              Lucro Real por Aluno Ativo: +R$ 25,85 / mês
            </div>
          </div>

          {/* Comparativo Lado a Lado: O que o EVO dizia vs A Verdade */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Lado Esquerdo: O Erro do EVO */}
            <div className="bg-rose-950/15 border border-rose-500/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  ❌ O Que o "Resumo Gerencial" do EVO Mostrava
                </span>
                <span className="text-xs font-bold text-rose-400">Set/26 e Out/26</span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3.5 rounded-xl border border-rose-500/20 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Receita / Aluno</span>
                  <span className="text-base sm:text-lg font-black text-white">R$ 120,25</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-400 uppercase font-bold block">Despesa / Aluno EVO</span>
                  <span className="text-base sm:text-lg font-black text-rose-400">R$ 159,73</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Falso Resultado</span>
                  <span className="text-base sm:text-lg font-black text-rose-500">-R$ 39,48</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold text-rose-200 uppercase tracking-wider">
                  Por que esse número de R$ 159,73 (e R$ 169,00 em Out) estava ERRADO?
                </p>

                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-rose-300">
                    <span>1. Misturou Compra de Máquinas (CAPEX) com Gasto Mensal</span>
                    <span>+R$ 40,49 / aluno</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    O EVO pegou R$ 30.000 da Kikos + R$ 3.368,83 das Anilhas + R$ 2.422,77 de equipamentos (<strong>R$ 35.791,60</strong>) e jogou nas costas do custo mensal do aluno. Máquina é patrimônio da academia, não custo de manter o aluno treinando!
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-rose-300">
                    <span>2. Jogou Empréstimo Bancário na Conta do Aluno</span>
                    <span>+R$ 5,57 / aluno</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Somou R$ 3.175 (Banco Votorantim) + R$ 1.753 (Banco Alfa) = <strong>R$ 4.928,00/mês</strong> de dívida financeira dentro da despesa operacional.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-rose-300">
                    <span>3. Incluiu Rescisão Única + WRP que já Acabou</span>
                    <span>+R$ 9,84 / aluno</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Em setembro teve <strong>R$ 5.566,04</strong> de rescisão trabalhista (+R$ 6,30/aluno) e <strong>R$ 3.135,92</strong> da WRP (+R$ 3,54/aluno) que se encerra agora em outubro.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-rose-300">
                    <span>4. Esqueceu 651 Alunos de Wellhub/TotalPass na Divisão</span>
                    <span>Dividiu só por 884</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    A academia atende <strong>1.535 pessoas ativas</strong> (884 contratos + 651 Wellhub), mas o EVO dividiu a conta inteira apenas pelos 884!
                  </p>
                </div>
              </div>
            </div>

            {/* Lado Direito: A Verdade Real Auditada */}
            <div className="bg-emerald-950/15 border border-emerald-500/30 rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✅ A Realidade Auditada (Sem Distorções)
                  </span>
                  <span className="text-xs font-bold text-emerald-400">Novembro/2026 (Sem WRP)</span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/20 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Receita / Aluno</span>
                    <span className="text-base sm:text-lg font-black text-white">R$ 120,25</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">Custo Real / Aluno</span>
                    <span className="text-base sm:text-lg font-black text-emerald-400">R$ 94,40</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-300 uppercase font-bold block">Lucro / Aluno</span>
                    <span className="text-base sm:text-lg font-black text-emerald-400">+R$ 25,85</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                    De onde vêm exatamente os R$ 94,40 de custo de cada aluno?
                  </p>

                  {[
                    {
                      label: '👨‍🏫 Professores, Recepção e Limpeza (Folha Normal R$ 38.266)',
                      val: 'R$ 43,28 / aluno',
                      pct: '45,8%'
                    },
                    {
                      label: '🏢 Aluguel do Prédio (R$ 22k) + Estacionamento (R$ 6k)',
                      val: 'R$ 31,67 / aluno',
                      pct: '33,5%'
                    },
                    {
                      label: '⚡ Luz (2 Relógios CPFL R$ 9,6k) + Água Sabesp (R$ 2,5k)',
                      val: 'R$ 13,70 / aluno',
                      pct: '14,5%'
                    },
                    {
                      label: '🧾 Imposto Simples Nacional (DAS), Sistemas EVO e Manutenção',
                      val: 'R$ 5,75 / aluno',
                      pct: '6,2%'
                    }
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium">{item.label}</span>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="font-black text-emerald-400 block">{item.val}</span>
                        <span className="text-[10px] text-slate-500">{item.pct} do custo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destaque Wellhub + Novos Contratos Outubro */}
              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-300">💡 Custo Contando Todos os 1.535 Frequentadores (c/ Wellhub):</span>
                  <span className="font-black text-white text-sm">R$ 54,40 / pessoa</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300">🚀 Ticket Médio das Vendas Novas de Outubro (R$ 148,31):</span>
                  <span className="font-black text-emerald-400 text-sm">+R$ 53,91 lucro/aluno novo!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SEÇÃO 3: SIMULADOR INTERATIVO DO PATRÃO
         ===================================================================== */}
      {(activeSection === 'all' || activeSection === 'simulador') && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Simulador Interativo em Tempo Real
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                🚀 Simule Quantos Alunos Precisamos e Quanto Sobra no Bolso do Patrão
              </h2>
            </div>

            {/* Botões de Atalho Rápido de Alunos */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Atual (884)', val: 884 },
                { label: 'Empate Kikos 30k (950)', val: 950 },
                { label: 'Meta 1.000 Alunos', val: 1000 },
                { label: 'Expansão (1.100)', val: 1100 }
              ].map(preset => (
                <button
                  key={preset.val}
                  onClick={() => setSimStudents(preset.val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    simStudents === preset.val
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controles do Simulador */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Controle 1: Quantidade de Alunos */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">1. Alunos Ativos Pagantes:</span>
                <span className="text-xl font-black text-indigo-400">{simStudents} alunos</span>
              </div>
              <input
                type="range"
                min={800}
                max={1200}
                step={5}
                value={simStudents}
                onChange={e => setSimStudents(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>800 alunos</span>
                <span>Atual: 884</span>
                <span>Meta: 1.000</span>
                <span>1.200 alunos</span>
              </div>
            </div>

            {/* Controle 2: Momento das Despesas (WRP / Anilhas / Kikos) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <span className="text-xs font-bold text-slate-300 block">2. Fase das Despesas:</span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => setSimScenario('nov26')}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-bold border transition flex items-center justify-between ${
                    simScenario === 'nov26'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Nov/26 a Fev/27 (Sem WRP, Com Anilhas)</span>
                  <span className="text-emerald-400">+R$ 3.136/mês</span>
                </button>
                <button
                  onClick={() => setSimScenario('mar27')}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-bold border transition flex items-center justify-between ${
                    simScenario === 'mar27'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Mar/27+ (Sem WRP e Sem Anilhas)</span>
                  <span className="text-emerald-400">+R$ 6.505/mês</span>
                </button>
                <button
                  onClick={() => setSimScenario('pos_kikos')}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-bold border transition flex items-center justify-between ${
                    simScenario === 'pos_kikos'
                      ? 'bg-amber-500/20 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Pós-Quitação Kikos (Sem Máquinas)</span>
                  <span className="text-amber-400">Livre Total</span>
                </button>
              </div>
            </div>

            {/* Controle 3: Parcela Kikos & Ticket Médio */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-1.5">3. Valor da Parcela Kikos no Mês:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSimKikosInstallment(30000)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                      simKikosInstallment === 30000
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    R$ 30.000 (Set/Out)
                  </button>
                  <button
                    onClick={() => setSimKikosInstallment(24000)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                      simKikosInstallment === 24000
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    R$ 24.000 (EVO Nov+)
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-300 block mb-1.5">Ticket Receita / Aluno:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSimAvgTicket(120.25)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                      simAvgTicket === 120.25
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    R$ 120,25 (Média Base)
                  </button>
                  <button
                    onClick={() => setSimAvgTicket(130.00)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                      simAvgTicket === 130.00
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    R$ 130,00 (Com Reajuste)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Resultados do Simulador */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Receita Estimada</span>
              <span className="text-lg sm:text-xl font-black text-white mt-1 block">{formatBRL(estimatedGrossRevenue)}</span>
              <span className="text-[10px] text-slate-500">Custo/Aluno: {formatBRL(realCostPerStudentSim, 2)}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase text-emerald-400 block">Lucro da Operação</span>
              <span className="text-lg sm:text-xl font-black text-emerald-400 mt-1 block">+{formatBRL(cleanOperatingProfit)}</span>
              <span className="text-[10px] text-emerald-300/80">Lucro/Aluno: +{formatBRL(realProfitPerStudentSim, 2)}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase text-sky-400 block">Sobra Após Bancos</span>
              <span className="text-lg sm:text-xl font-black text-sky-400 mt-1 block">+{formatBRL(cashAfterBanks)}</span>
              <span className="text-[10px] text-slate-500">Já descontando -R$ 4.928</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase text-amber-400 block">Parcelas Máquinas</span>
              <span className="text-lg sm:text-xl font-black text-amber-400 mt-1 block">-{formatBRL(totalCapexMonthly)}</span>
              <span className="text-[10px] text-slate-500">
                {simScenario === 'pos_kikos' ? 'Máquinas Quitadas!' : simScenario === 'mar27' ? 'Só Kikos (Sem Anilhas)' : 'Kikos + Anilhas'}
              </span>
            </div>

            <div className={`rounded-xl p-3.5 border-2 col-span-2 sm:col-span-1 ${
              finalFreeCash >= 0
                ? 'bg-emerald-950/30 border-emerald-500/50'
                : 'bg-rose-950/30 border-rose-500/50'
            }`}>
              <span className="text-[10px] font-bold uppercase text-white block">Caixa Livre p/ Sócios</span>
              <span className={`text-lg sm:text-xl font-black mt-1 block ${
                finalFreeCash >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {finalFreeCash >= 0 ? `+${formatBRL(finalFreeCash)}` : formatBRL(finalFreeCash)}
              </span>
              <span className="text-[10px] text-slate-300">
                {finalFreeCash >= 0 ? 'Sobra limpa após pagar TUDO!' : 'Coberto pelo caixa atual (R$ 90k)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SEÇÃO 4: TABELA COMPARATIVA 4 MESES (JULHO, AGOSTO, SETEMBRO E OUTUBRO)
         ===================================================================== */}
      {(activeSection === 'all' || activeSection === 'dre_4meses') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                Histórico Auditado Mês a Mês • Julho, Agosto, Setembro e Outubro/2026
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                📊 Evolução Completa da Academia (DRE Reconciliado + Comercial)
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              *Outubro com vendas até 16/10 e despesas de todo o mês agendadas no EVO
            </span>
          </div>

          {/* Tabela 1: Indicadores Comerciais e Operacionais */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              1. Indicadores de Alunos, Vendas, Conversão e Catraca (Jul a Out/2026)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Indicador Operacional / Comercial</th>
                    <th className="py-3 px-4 text-right">Julho/2026</th>
                    <th className="py-3 px-4 text-right">Agosto/2026</th>
                    <th className="py-3 px-4 text-right bg-indigo-950/20 text-indigo-300">Setembro/2026 (Fechado)</th>
                    <th className="py-3 px-4 text-right bg-emerald-950/20 text-emerald-300">Outubro/2026 (até 16/10)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-bold text-white">Alunos Ativos (Contratos Regulares)</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">795</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">863 (+8,5%)</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-indigo-300 bg-indigo-950/10">884 (+2,4%)</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-300 bg-emerald-950/10">881 (804 adimp. / 77 inad.)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-bold text-white">Alunos Agregadores (Wellhub / TotalPass)</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">N/D</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">519</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-indigo-300 bg-indigo-950/10">651 (+25,4%)</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-300 bg-emerald-950/10">663 (+1,8%)</td>
                  </tr>
                  <tr className="bg-slate-950/50 font-bold">
                    <td className="py-2.5 px-4 text-sky-300">População Total Frequentadora (Ativos + Wellhub)</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">~1.250</td>
                    <td className="py-2.5 px-4 text-right font-mono text-white">1.382</td>
                    <td className="py-2.5 px-4 text-right font-mono text-sky-400 bg-indigo-950/10">1.535 pessoas</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400 bg-emerald-950/10">1.544 pessoas</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-slate-300">Visitas Recebidas / Novos Convertidos</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">369 vis / 242 conv</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">466 vis / 329 conv</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-200 bg-indigo-950/10">377 vis / 243 conv</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-200 bg-emerald-950/10">86 vis / 20 conv (parcial)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-slate-300">Taxa de Conversão (ICV1 / ICV2)</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">45% / 72%</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400 font-bold">56% / 70%</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-200 bg-indigo-950/10">52% / 58%</td>
                    <td className="py-2.5 px-4 text-right font-mono text-amber-400 bg-emerald-950/10">23,3% (16 dias)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-slate-300">Renovações vs. Cancelamentos</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">651 ren / 59 canc</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">675 ren / 66 canc</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-300 bg-indigo-950/10">750 ren / 57 canc</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-200 bg-emerald-950/10">23 canc (LTV 9,1 meses)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-bold text-white">Ticket Médio dos Novos Contratos</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">R$ 129,16</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">R$ 122,41</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-200 bg-indigo-950/10">R$ 122,53</td>
                    <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-400 bg-emerald-950/10">R$ 148,31 (+21%)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela 2: DRE Gerencial Reconciliado (4 Meses) */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              2. DRE Gerencial Reconciliado — Separação Real entre Operação (OPEX), Bancos e Máquinas (CAPEX)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Linha do DRE Reconciliado</th>
                    <th className="py-3 px-4 text-right">Julho/2026</th>
                    <th className="py-3 px-4 text-right">Agosto/2026</th>
                    <th className="py-3 px-4 text-right bg-indigo-950/20 text-indigo-300">Setembro/2026</th>
                    <th className="py-3 px-4 text-right bg-emerald-950/20 text-emerald-300">Outubro/2026 (Proj/Agend)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  <tr className="bg-emerald-950/10 font-bold">
                    <td className="py-2.5 px-4 text-emerald-300">(+) Receita Bruta de Contratos / Mensalidades</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400">R$ 102.769,48</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400">R$ 110.509,52</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400 bg-indigo-950/10">R$ 108.191,71</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400 bg-emerald-950/10">R$ 71.361,64 (16 dias)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-4 text-slate-300">(-) Impostos s/ Faturamento (DAS Simples Nacional)</td>
                    <td className="py-2 px-4 text-right font-mono text-rose-300">-R$ 4.850,00*</td>
                    <td className="py-2 px-4 text-right font-mono text-rose-300">-R$ 5.120,00*</td>
                    <td className="py-2 px-4 text-right font-mono text-rose-400 bg-indigo-950/10">-R$ 5.306,62</td>
                    <td className="py-2 px-4 text-right font-mono text-rose-300 bg-emerald-950/10">-R$ 5.300,00 (est.)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-4 text-slate-300">(-) Despesas com Pessoal (Salários, FGTS, INSS, Vale, Freelancers)</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-300">-R$ 31.811,19</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-300">-R$ 38.347,45</td>
                    <td className="py-2 px-4 text-right font-mono text-amber-300 bg-indigo-950/10">-R$ 43.832,27 (c/ rescisão)</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-300 bg-emerald-950/10">-R$ 37.660,15</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-4 text-slate-300">(-) Ocupação Fixa (Aluguel R$ 22.000 + Estacionamento R$ 6.000)</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-300">-R$ 28.000,00</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-300">-R$ 28.000,00</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-300 bg-indigo-950/10">-R$ 28.000,00</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-300 bg-emerald-950/10">-R$ 28.000,00</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-4 text-slate-300">(-) Energia Elétrica (2 Relógios CPFL) + Água (Sabesp)</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-300">-R$ 7.943,08</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-300">-R$ 8.454,15</td>
                    <td className="py-2 px-4 text-right font-mono text-rose-300 bg-indigo-950/10">-R$ 12.109,98 (2 CPFL + Água)</td>
                    <td className="py-2 px-4 text-right font-mono text-rose-300 bg-emerald-950/10">-R$ 11.210,22</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-4 text-slate-300">(-) WRP Limpeza Terceirizada (Encerra em Outubro/2026!)</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-400">Incluído</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-400">Incluído</td>
                    <td className="py-2 px-4 text-right font-mono text-amber-400 bg-indigo-950/10">-R$ 3.135,92</td>
                    <td className="py-2 px-4 text-right font-mono text-emerald-400 font-bold bg-emerald-950/10">R$ 0,00 em Nov!</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-4 text-slate-300">(-) Sistemas EVO, Contabilidade, Marketing, Limpeza & Manutenção</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-300">-R$ 6.405,40</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-300">-R$ 7.645,50</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-300 bg-indigo-950/10">-R$ 4.690,83</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-300 bg-emerald-950/10">-R$ 6.769,55</td>
                  </tr>
                  <tr className="bg-emerald-950/25 font-black border-t-2 border-emerald-500/30">
                    <td className="py-3 px-4 text-emerald-300">(=) LUCRO OPERACIONAL RECORRENTE (EBITDA DA ACADEMIA)</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">+R$ 23.759,81</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">+R$ 22.942,42</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 bg-indigo-950/10">+R$ 21.400,00 (s/ rescisão)</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 bg-emerald-950/10">+R$ 24.536,00 (Ritmo Nov)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-4 text-amber-300">(-) Empréstimos Bancários (Votorantim R$ 3.175 + Alfa R$ 1.753)</td>
                    <td className="py-2 px-4 text-right font-mono text-amber-300">-R$ 4.928,00</td>
                    <td className="py-2 px-4 text-right font-mono text-amber-300">-R$ 4.928,00</td>
                    <td className="py-2 px-4 text-right font-mono text-amber-300 bg-indigo-950/10">-R$ 4.928,00</td>
                    <td className="py-2 px-4 text-right font-mono text-amber-300 bg-emerald-950/10">-R$ 4.928,00</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-4 text-sky-300">(-) Investimento CAPEX: Máquinas Kikos + Nacional Anilhas + Equip.</td>
                    <td className="py-2 px-4 text-right font-mono text-sky-300">-R$ 30.094,90</td>
                    <td className="py-2 px-4 text-right font-mono text-sky-300">-R$ 30.000,00</td>
                    <td className="py-2 px-4 text-right font-mono text-sky-300 bg-indigo-950/10">-R$ 35.791,60</td>
                    <td className="py-2 px-4 text-right font-mono text-sky-300 bg-emerald-950/10">-R$ 34.768,83 (Cai em Nov!)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2 px-4 text-violet-300">(-) Retirada de Sócios / Pró-Labore (Juliano R$ 7,5k + Lucianna R$ 7,5k)</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-400">R$ 0,00</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-400">R$ 0,00</td>
                    <td className="py-2 px-4 text-right font-mono text-violet-300 bg-indigo-950/10">-R$ 15.000,00 (30/09)</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-400 bg-emerald-950/10">A definir</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SEÇÃO 5: CONCILIAÇÃO BANCÁRIA (BRADESCO + STONE) E PLANO DE AÇÃO
         ===================================================================== */}
      {(activeSection === 'all' || activeSection === 'bancos_evo') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Posição de Caixa Real (Bradesco + Stone) & Saneamento EVO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Prova Real dos Extratos • Setembro/2026
              </span>
              <h3 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-400" />
                Posição Bancária Consolidada (Bradesco + Stone)
              </h3>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Conta Bancária</th>
                    <th className="py-2.5 px-3 text-right">Saldo 31/08</th>
                    <th className="py-2.5 px-3 text-right">Saldo 30/09</th>
                    <th className="py-2.5 px-3 text-right">Variação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Bradesco (CC 0061309-6 + Invest Fácil)</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">R$ 87.242,15</td>
                    <td className="py-2.5 px-3 text-right font-mono text-white font-bold">R$ 57.389,37</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-400">-R$ 29.852,78</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Stone Pagamentos (Livre)</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">R$ 11.465,23</td>
                    <td className="py-2.5 px-3 text-right font-mono text-white font-bold">R$ 22.910,78</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">+R$ 11.445,55</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Stone (Reserva Investimento 14/09)</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">R$ 0,00</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">R$ 10.000,00</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">+R$ 10.000,00</td>
                  </tr>
                  <tr className="bg-slate-950 font-black">
                    <td className="py-3 px-3 text-emerald-300">CAIXA TOTAL DISPONÍVEL</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-200">R$ 98.707,38</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">R$ 90.300,15</td>
                    <td className="py-3 px-3 text-right font-mono text-amber-400">-R$ 8.407,23</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                ✅ Saneamento Já Executado Direto no Seu Sistema EVO:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li>• Criados os centros <strong>Simples Nacional (DAS)</strong>, <strong>Sistemas e Softwares</strong> e <strong>ECAD</strong>.</li>
                <li>• Reclassificados <strong>KIKOS</strong>, <strong>Anilhas Nacional</strong> e <strong>Equipamentos</strong> para <em>Outras despesas não operacionais</em> (para limpar o DRE).</li>
                <li>• Vinculados todos os <strong>21 contratos/planos</strong> em Mensalidades e <strong>19 produtos</strong> em Lojinha no DRE v2.</li>
                <li>• Lançada a 2ª conta de luz CPFL de Setembro (<strong>ID 1224031 • R$ 5.005,90</strong> paga em 23/09) e corrigidos os lançamentos de Setembro e Outubro.</li>
              </ul>
            </div>
          </div>

          {/* Coluna 2: Plano de Ação Ideal em 4 Passos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Roteiro Prático para o Patrão e Gerência
              </span>
              <h3 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Plano Ideal de 4 Passos para Continuarmos Crescendo
              </h3>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 uppercase">Passo 1 • Meta Comercial (+55 Alunos)</span>
                  <span className="text-xs font-bold text-white">Rumo aos 940 a 1.000 Alunos</span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Com o fim da WRP e das Anilhas, ao chegar em <strong>940 a 950 alunos ativos</strong> a academia passa a pagar <strong>100% de todas as contas + bancos + Kikos sozinha</strong>, sem tirar 1 centavo da reserva de R$ 90 mil do banco!
                </p>
              </div>

              <div className="bg-slate-950 border border-sky-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-sky-400 uppercase">Passo 2 • Resgate de Inadimplentes</span>
                  <span className="text-xs font-bold text-sky-300">+R$ 9.250 Potenciais</span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Temos <strong>77 alunos inadimplentes</strong> em outubro (8,7% da base). Recuperar metade desses alunos na recepção/WhatsApp já coloca <strong>+R$ 4.600/mês</strong> imediatos no caixa sem gastar nada com anúncio.
                </p>
              </div>

              <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 uppercase">Passo 3 • Eficiência nos 2 Relógios CPFL</span>
                  <span className="text-xs font-bold text-amber-300">Economia de R$ 1.500/mês</span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  A energia subiu de R$ 6.594 (Jul) para R$ 9.873 (Out). Como <strong>42,3% dos treinos ocorrem de manhã (05h–12h)</strong> e a tarde (12h–17h) tem menor fluxo, escalonar a climatização entre 12h e 16h30 reduz a fatura sem afetar o conforto no horário de pico.
                </p>
              </div>

              <div className="bg-slate-950 border border-violet-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-violet-400 uppercase">Passo 4 • Regra de Ouro das Retiradas</span>
                  <span className="text-xs font-bold text-violet-300">Proteger o Colchão de R$ 90k</span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Segurar retiradas extras de sócios até <strong>Fevereiro/2027</strong> (quando acaba a Nacional Anilhas) ou limitar retiradas ao fôlego gerado pela queda da parcela Kikos (de R$ 30k para R$ 24k), mantendo os <strong>R$ 90 mil de saldo bancário</strong> intactos como reserva de segurança.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
