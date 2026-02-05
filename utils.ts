import { IRRFBracket } from './types';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  // Handle YYYY-MM-DD (standard HTML date input)
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  return new Date(dateString).toLocaleDateString('pt-BR');
};

/**
 * Calcula o IRRF baseado em uma lista de faixas dinâmica.
 * Fórmula Padrão: (Base de Cálculo * Alíquota) - Dedução
 * 
 * @param valorBruto Valor total do repasse
 * @param brackets Lista de faixas (IRRFBracket) correspondente ao ano de referência
 */
export const calculateIRRF = (valorBruto: number, brackets: IRRFBracket[]): number => {
  if (!valorBruto || valorBruto <= 0 || !brackets || brackets.length === 0) {
    return 0;
  }

  // 1. Encontrar a faixa correta
  // A lógica assume que a tabela vem ordenada do menor min_value para o maior.
  // Procuramos a faixa onde: valorBruto >= min E (max é null OU valorBruto <= max)
  const bracket = brackets.find(b => 
    valorBruto >= b.min && (b.max === null || valorBruto <= b.max)
  );

  if (!bracket) {
    // Se por algum motivo não cair em nenhuma faixa (ex: valor negativo ou furo na tabela), retorna 0
    return 0;
  }

  // 2. Aplicar fórmula: (Valor * Alíquota) - Dedução
  const impostoCalculado = (valorBruto * bracket.rate) - bracket.deduction;

  // O imposto não pode ser negativo
  return Math.max(0, parseFloat(impostoCalculado.toFixed(2)));
};

export const generateId = () => Math.random().toString(36).substr(2, 9);