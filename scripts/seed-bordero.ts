import { createBordero, addBorderoItem } from '../src/services/supabase';

async function seed() {
  console.log('Creating Bordero 21/09 a 27/09...');
  
  const bordero = await createBordero({
    title: 'Borderô Semanal - 21/09/2026 a 27/09/2026',
    startDate: '2026-09-21',
    endDate: '2026-09-27',
    notes: 'Criado via assistente'
  });

  console.log('Created Bordero:', bordero.id);

  const items = [
    {
      recipient: 'Sabesp (Conta de água)',
      amount: 2481.52,
      dueDate: '2026-09-21',
      billType: 'CONCESSIONARIA'
    },
    {
      recipient: 'CPFL',
      amount: 5005.90,
      dueDate: '2026-09-23',
      billType: 'CONCESSIONARIA'
    },
    {
      recipient: 'N2B',
      amount: 1400.00,
      dueDate: '2026-09-21',
      billType: 'BENEFICIOS_PARCERIA'
    },
    {
      recipient: 'IPTU',
      amount: 803.91,
      dueDate: '2026-09-25',
      billType: 'GUIA_BOLETO'
    },
    {
      recipient: 'Contabilidade Tegracon',
      amount: 1300.00,
      dueDate: '2026-09-21',
      billType: 'SISTEMA_BOLETO'
    },
    {
      recipient: 'Aluguel estacionamento',
      amount: 6000.00,
      dueDate: '2026-09-21',
      billType: 'ALUGUEL_IMOVEL'
    }
  ];

  for (const item of items) {
    console.log(`Adding ${item.recipient}...`);
    await addBorderoItem(bordero.id, {
      ...item,
      status: 'PENDENTE'
    });
  }

  console.log('Done!');
}

seed().catch(console.error);
