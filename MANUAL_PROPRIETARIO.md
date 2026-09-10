# Manual de Operação do Proprietário - ERP Recepção

**Projeto**: ERP Recepção (Academia)  
**Versão**: 1.4.0 Final Pro Desktop  
**Compatibilidade**: Windows 10 / Windows 11  

---

## 📌 1. Visão Geral do Sistema
O **ERP Recepção** foi desenvolvido exclusivamente para o **Proprietário da Academia** acompanhar em tempo real as vendas, o estoque por marca, o ritmo de consumo, os alertas de recompra e o fechamento de caixa das recepcionistas.

### 🛡️ Regra de Ouro (Fluxo das Recepcionistas Mantido)
- As **4 recepcionistas** continuam trabalhando normalmente na planilha compartilhada do Microsoft OneDrive (`VENDASPB_2026.xlsx`).
- O ERP Recepção lê a planilha via **Cópia Sombra (Shadow Copy)** em memória, sem travar o arquivo Excel em uso pelas recepcionistas (`EBUSY` resolvido).

---

## 🚀 2. Como Iniciar o ERP Recepção no Seu Windows

1. Baixe/abra a pasta do sistema em `C:\Users\User\.gemini\antigravity\scratch\erp-recepcao`.
2. Para iniciar o servidor de sincronização e a interface:
   - Execute o comando ou atalho do ERP.
   - O backend rodará na porta `http://localhost:3001`.

---

## ⚙️ 3. Configuração do OneDrive

No ERP, vá até a aba **"Configuração OneDrive"**:
- **Caminho da Planilha**: Defina o local onde o OneDrive sincroniza o arquivo no seu computador (Exemplo: `C:\Users\User\Desktop\VENDASPB_2026.xlsx` ou dentro da sua pasta do OneDrive).
- **Intervalo de Sincronização**: Padrão de 30 segundos (ou ajuste conforme sua preferência).
- **Sincronizar Agora**: Botão manual para forçar a atualização imediata.

---

## 📊 4. Módulos e Recursos Principais

### A. Dashboard Executivo
- Resumo do Faturamento Total acumulado (R$ 22.785,70).
- Gráfico de Vendas por Meio de Pagamento (Pix, Débito, Crédito, Dinheiro, Outros).
- Acesso rápido a alertas e saúde dos dados.

### B. Estoque Inteligente & Alertas de Ruptura
- **Autonomia em Dias**: Mostra quantos dias o estoque atual durará mantendo a velocidade atual de vendas na recepção.
- **Sugestão de Recompra**: Indica a quantidade exata recomendada para comprar no próximo pedido ao fornecedor.
- **Giro de Estoque**: Destaca os produtos de alta rotatividade.

### C. Margens & Lucro por Marca
- Exibe o lucro bruto gerado por cada marca (*Lindoya*, *Bioleve*, *SharkPro*, *Nutrata*, *Adaptogen*, *Lauton*, etc.) sem misturar nem agrupar produtos diferentes.

### D. Fechamento de Caixa por Recepcionista (DRE)
- Relatório individual de faturamento por funcionário (`MARIA`, `JULIA`, `LUAN`, `NICOLAS`, `LETICIA`, `GEOVANA`, `DAVIANNY`, `ALICE`).
- Desdobramento exato do quanto cada recepcionista recebeu em Pix, Dinheiro, Cartão de Crédito e Cartão de Débito.

### E. Relatórios Gerenciais & Exportação CSV
- Baixe a lista de recompra formatada em CSV para enviar diretamente ao seu fornecedor ou imprima em PDF.
