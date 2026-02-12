
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
  
  // Novos campos para refatoração
  qtdVia1?: number;
  valVia1?: number;
  qtdVia2?: number;
  valVia2?: number;
  loteType?: 'PRINCIPAL' | 'COMPLEMENTAR';
  genre?: 'ATOS_GRATUITOS' | 'RENDA_MINIMA' | 'AJUDA_CUSTO';
  municipality?: string;
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
