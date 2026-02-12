
import { IRRFBracket } from './types';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const formatLote = (month: string, year: number) => {
  return `${month.padStart(2, '0')}/${year}`;
};

export const calculateIRRF = (valorBruto: number, brackets: IRRFBracket[]): number => {
  if (!valorBruto || valorBruto <= 0 || !brackets || brackets.length === 0) {
    return 0;
  }
  const bracket = brackets.find(b => 
    valorBruto >= b.min && (b.max === null || valorBruto <= b.max)
  );
  if (!bracket) return 0;
  const impostoCalculado = (valorBruto * bracket.rate) - bracket.deduction;
  return Math.max(0, parseFloat(impostoCalculado.toFixed(2)));
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
