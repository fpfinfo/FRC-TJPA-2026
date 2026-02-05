import { IRRFBracket, Notary, Payment } from './types';

// Updated to match the image provided: 2025 Base Year values
export const IRRF_TABLE_2025: IRRFBracket[] = [
  { id: '1', min: 0, max: 2259.20, rate: 0, deduction: 0 },
  { id: '2', min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44 }, 
  { id: '3', min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44 },
  { id: '4', min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77 },
  { id: '5', min: 4664.69, max: null, rate: 0.275, deduction: 896.00 },
];

export const MOCK_NOTARIES: Notary[] = [
  {
    id: '1',
    name: 'Cartório do 1º Ofício de Belém',
    responsibleName: 'Tayla Karine Veiga Guilhon',
    code: '750',
    ensCode: 'ENS-001',
    responsibleCpf: '123.456.789-00',
    comarca: 'Belém',
    status: 'ATIVO',
    address: 'Rua das Flores, 123',
    city: 'Belém',
    state: 'PA',
    cep: '66000-000',
    phone: '(91) 3222-0000',
    email: 'contato@cartorio1belem.com.br',
    latitude: -1.4557,
    longitude: -48.4902
  },
  {
    id: '2',
    name: 'Cartório de Registro Civil de Ananindeua',
    responsibleName: 'Rodrigo Silva Trigueiro',
    code: '1378',
    ensCode: 'ENS-002',
    responsibleCpf: '987.654.321-99',
    comarca: 'Ananindeua',
    status: 'ATIVO',
    address: 'Av. Principal, 500',
    city: 'Ananindeua',
    state: 'PA',
    cep: '67000-000',
    phone: '(91) 3255-0000',
    email: 'rc@ananindeua.PA.br',
    latitude: -1.3636,
    longitude: -48.3733
  },
  {
    id: '3',
    name: 'Único Ofício',
    responsibleName: 'Rogerio da Consolação Domingues',
    code: '563',
    ensCode: 'ENS-003',
    responsibleCpf: '753.380.096-68',
    comarca: 'Santa Luzia do Pará',
    status: 'ATIVO',
    address: 'Rua Principal, 10',
    city: 'Santa Luzia do Pará',
    state: 'PA',
    cep: '68000-000',
    phone: '(91) 3444-0000',
    email: 'oficio@santaluzia.com',
    latitude: -1.5283,
    longitude: -46.9036
  }
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: '101',
    notaryId: '1',
    notaryName: 'Cartório do 1º Ofício de Belém',
    code: '750',
    responsibleName: 'Tayla Karine Veiga Guilhon',
    cpf: '123.456.789-00',
    date: '2025-01-16',
    monthReference: '01',
    yearReference: 2025,
    comarca: 'Belém',
    grossValue: 1950.00,
    irrfValue: 0.00,
    netValue: 1950.00,
    historyType: 'REPASSE',
    status: 'PAGO'
  },
  {
    id: '102',
    notaryId: '2',
    notaryName: 'Cartório de Registro Civil de Ananindeua',
    code: '1378',
    responsibleName: 'Rodrigo Silva Trigueiro',
    cpf: '987.654.321-99',
    date: '2025-01-16',
    monthReference: '01',
    yearReference: 2025,
    comarca: 'Ananindeua',
    grossValue: 10070.00,
    irrfValue: 1717.00,
    netValue: 8352.00,
    historyType: 'REPASSE',
    status: 'PAGO'
  },
  {
    id: '103',
    notaryId: '3',
    notaryName: 'Único Ofício',
    code: '563',
    responsibleName: 'Rogerio da Consolação Domingues',
    cpf: '753.380.096-68',
    date: '2025-01-16',
    monthReference: '01',
    yearReference: 2025,
    comarca: 'Santa Luzia do Pará',
    grossValue: 1975.00,
    irrfValue: 0.00,
    netValue: 1975.00,
    historyType: 'REPASSE',
    status: 'PAGO'
  }
];