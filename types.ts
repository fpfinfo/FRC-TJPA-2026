
export interface Payment {
  id: string;
  notaryId: string;
  notaryName: string;
  code: string; 
  responsibleName: string;
  cpf: string;
  date: string; 
  monthReference: string; 
  yearReference: number; 
  comarca: string;
  grossValue: number;
  irrfValue: number;
  netValue: number;
  historyType: 'AJUDA DE CUSTO' | 'DEA' | 'MESES ANTERIORES' | 'RENDA MINIMA' | 'REPASSE' | 'COMPLEMENTAÇÃO';
  status: 'PAGO' | 'PENDENTE' | 'EM ANDAMENTO';
  pendingReason?: string;
  
  // Conformidade Financeira (Triple Check NE/DL/OB)
  ne_empenho?: string;
  dl_liquidacao?: string;
  ob_ordem_bancaria?: string;
  
  // Campos de Negócio TJPA
  vinculo?: 'Titular' | 'Interino' | 'Interventor';
  loteType?: 'PRINCIPAL' | 'COMPLEMENTAR';
  actType?: 'NASCIMENTO' | 'CASAMENTO' | 'OBITO' | 'MULTIPLOS';
  qtdVia1?: number; // Total Via 1
  valVia1?: number;
  qtdVia2?: number; // Total Via 2
  valVia2?: number;
  
  // Detalhamento por Natureza
  qtdNascimentoVia1?: number;
  qtdNascimentoVia2?: number;
  qtdCasamentoVia1?: number;
  qtdCasamentoVia2?: number;
  qtdObitoVia1?: number;
  qtdObitoVia2?: number;
  genre?: 'ATOS_GRATUITOS' | 'RENDA_MINIMA' | 'AJUDA_CUSTO';
  municipality?: string;
  dataVinculo?: string;
}

export interface Notary {
  id: string;
  name: string;
  responsibleName: string;
  code: string;
  ensCode: string;
  responsibleCpf: string;
  comarca: string;
  status: 'ATIVO' | 'INATIVO';
  address: string;
  city?: string;
  state?: string;
  cep?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  vinculoPadrao?: 'Titular' | 'Interino' | 'Interventor';
  dataVinculo?: string;
}

export interface IRRFBracket {
  id: string;
  min: number;
  max: number | null; 
  rate: number; 
  deduction: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: 'admin' | 'user'; 
}
