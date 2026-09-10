import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

export function generateSampleExcelFile(targetPath: string): void {
  const data = [
    ['Data', 'Produto', 'Qtd', 'Valor Unitário', 'Total', 'Forma Pagamento', 'Recepcionista'],
    ['2026-07-22 07:15', 'Água Mineral 500ml', 2, 4.00, 8.00, 'PIX', 'Ana Silva'],
    ['2026-07-22 08:30', 'Whey Protein Dose 30g', 1, 15.00, 15.00, 'Cartão de Crédito', 'Ana Silva'],
    ['2026-07-22 09:10', 'Gatorade 500ml - Limão', 1, 9.00, 9.00, 'Dinheiro', 'Carlos Rocha'],
    ['2026-07-22 10:45', 'Barra de Proteína Nutry', 3, 7.50, 22.50, 'PIX', 'Carlos Rocha'],
    ['2026-07-22 11:20', 'Passaporte Diária Treino', 1, 35.00, 35.00, 'Cartão de Débito', 'Carlos Rocha'],
    ['2026-07-22 14:00', 'Água Mineral 500ml', 1, 4.00, 4.00, 'Dinheiro', 'Julia Costa'],
    ['2026-07-22 15:30', 'Pré-Treino C4 Dose', 1, 12.00, 12.00, 'PIX', 'Julia Costa'],
    ['2026-07-22 17:00', 'Toalha de Treino Academia', 1, 25.00, 25.00, 'Cartão de Crédito', 'Lucas Lima'],
    ['2026-07-22 18:20', 'Whey Protein Dose 30g', 2, 15.00, 30.00, 'PIX', 'Lucas Lima'],
    ['2026-07-22 19:40', 'Água Mineral 500ml', 4, 4.00, 16.00, 'Dinheiro', 'Lucas Lima'],
    // Linha com anomalia de teste (Preço zerado / texto em branco) para testar o Data Health
    ['2026-07-22 20:00', 'Creatina 300g Pote', 1, 0, 0, 'PIX', 'Lucas Lima'],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');

  // Adiciona segunda aba com Cadastro de Estoque Inicial
  const estoqueData = [
    ['Produto', 'Categoria', 'Preço Venda', 'Estoque Inicial', 'Estoque Mínimo'],
    ['Água Mineral 500ml', 'Bebidas', 4.00, 100, 20],
    ['Whey Protein Dose 30g', 'Suplementos', 15.00, 50, 10],
    ['Gatorade 500ml - Limão', 'Bebidas', 9.00, 40, 8],
    ['Barra de Proteína Nutry', 'Alimentação', 7.50, 60, 15],
    ['Passaporte Diária Treino', 'Serviços', 35.00, 999, 5],
    ['Pré-Treino C4 Dose', 'Suplementos', 12.00, 30, 5],
    ['Toalha de Treino Academia', 'Acessórios', 25.00, 15, 3],
    ['Creatina 300g Pote', 'Suplementos', 120.00, 10, 2],
  ];
  const stockWorksheet = XLSX.utils.aoa_to_sheet(estoqueData);
  XLSX.utils.book_append_sheet(workbook, stockWorksheet, 'Estoque');

  XLSX.writeFile(workbook, targetPath);
  console.log(`📄 Planilha de testes gerada em: ${targetPath}`);
}
