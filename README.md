# ERP Gerencial - Gestão & Operação Academia Pro v2.0

Sistema de gestão operacional, administrativa e controle interno de academia conectado à nuvem via **Supabase** e hospedado na **Vercel**.

---

## 🚀 Funcionalidades Principais

### 1. 👥 Ficha de Funcionários & Alerta de CREF
* Cadastro de colaboradores por cargo (*Professores, Recepção, Gerência, Limpeza, Manutenção, Estagiários*).
* Anexo e visualização de documentos em PDF (*Termos de estágio, Contratos de trabalho e Carteiras do CREF*).
* Monitoramento automático de prazos e alerta visual para documentos vencidos ou próximos da validade (<30 dias).

### 2. ✅ Lista de Tarefas & Checklist Operacional
* Checklists diários e rotinas para cada turno da academia (*Abertura, Troca de turno, Fechamento*).
* Atribuição de responsáveis diretos e controle de prioridade (*Alta, Média, Baixa*).
* Conclusão instantânea em 1 clique com registro de data e horário.

### 3. 👕 Controle de Estoque de Uniformes
* Controle de grade de tamanhos (*P, M, G, GG*) para camisetas, regatas, agasalhos e bermudas.
* Histórico de entregas para a equipe com assinatura de recibos.
* Controle de descarte e baixa automática de estoque.

### 4. 🧴 Estoque de Produtos de Limpeza
* Catálogo de insumos com custos unitários baseados nas notas fiscais.
* Alerta automático de nível crítico para itens abaixo do estoque mínimo.

### 5. 🔧 Manutenções & Controle de Custos
* Registro detalhado de intervenções preventivas e corretivas.
* Classificação dupla: Predial vs. Equipamentos de Musculação.
* Separação de custos entre peças/materiais e mão de obra contratada.

---

## 🛠️ Tecnologias Utilizadas
* **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons.
* **Backend & Banco de Dados**: Supabase (PostgreSQL relacional na nuvem).
* **Hospedagem**: Vercel (CI/CD contínuo via GitHub).

---

## 💻 Como Rodar Localmente

1. Clone o repositório:
```bash
git clone https://github.com/ZennardeL/erp-gerencial.git
cd erp-gerencial
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run vite
```

4. Para gerar a versão de produção:
```bash
npm run build:react
```
