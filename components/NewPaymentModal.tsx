import React, { useState, useEffect } from 'react';
import { X, Calculator, Calendar, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { Payment, Notary, IRRFBracket } from '../types';
import { calculateIRRF, formatCurrency, generateId } from '../utils';
import { supabase } from '../supabaseClient';

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Payment) => void;
  paymentToDuplicate?: Payment | null; // Added prop for duplication
  notaries: Notary[];
}

const NewPaymentModal: React.FC<NewPaymentModalProps> = ({ isOpen, onClose, onSave, paymentToDuplicate, notaries }) => {
  // Form State
  const [selectedNotaryId, setSelectedNotaryId] = useState<string>('');
  const [monthRef, setMonthRef] = useState<string>('01');
  const [yearRef, setYearRef] = useState<number>(new Date().getFullYear());
  const [date, setDate] = useState<string>('');
  const [grossValue, setGrossValue] = useState<string>(''); // String for input handling
  const [historyType, setHistoryType] = useState<Payment['historyType']>('REPASSE');

  // Derived/Read-only State
  const [notaryData, setNotaryData] = useState<Notary | null>(null);
  const [irrf, setIrrf] = useState<number>(0);
  const [net, setNet] = useState<number>(0);

  // Dynamic IRRF Data
  const [currentBrackets, setCurrentBrackets] = useState<IRRFBracket[]>([]);
  const [isLoadingBrackets, setIsLoadingBrackets] = useState(false);
  const [bracketsError, setBracketsError] = useState(false);

  // Initialize
  useEffect(() => {
    if (isOpen) {
      if (paymentToDuplicate) {
        // Pre-fill data from duplicate source
        setSelectedNotaryId(paymentToDuplicate.notaryId);
        setMonthRef(paymentToDuplicate.monthReference);
        setYearRef(paymentToDuplicate.yearReference);
        setDate(paymentToDuplicate.date); // Keep original date, user can change
        setGrossValue(paymentToDuplicate.grossValue.toFixed(2).replace('.', ','));
        setHistoryType(paymentToDuplicate.historyType);
        
        // Trigger bracket fetch for that year
        fetchBracketsForYear(paymentToDuplicate.yearReference);
      } else {
        // Reset to defaults
        setGrossValue('');
        setIrrf(0);
        setNet(0);
        setDate(new Date().toISOString().split('T')[0]);
        
        const currentY = new Date().getFullYear();
        setYearRef(currentY);
        setMonthRef(String(new Date().getMonth() + 1).padStart(2, '0'));
        
        setSelectedNotaryId('');
        setNotaryData(null);
        setHistoryType('REPASSE');
        
        // Load initial brackets for current year
        fetchBracketsForYear(currentY);
      }
    }
  }, [isOpen, paymentToDuplicate]);

  // Handle Notary Selection & Auto-fill
  useEffect(() => {
    const notary = notaries.find(n => n.id === selectedNotaryId);
    setNotaryData(notary || null);
  }, [selectedNotaryId, notaries]);

  // Fetch Brackets when Year Changes
  useEffect(() => {
    if (isOpen && yearRef > 2000) {
      const debounceTimer = setTimeout(() => {
        fetchBracketsForYear(yearRef);
      }, 500); // Small delay to avoid fetching while typing
      return () => clearTimeout(debounceTimer);
    }
  }, [yearRef, isOpen]);

  const fetchBracketsForYear = async (year: number) => {
    setIsLoadingBrackets(true);
    setBracketsError(false);
    try {
      const { data, error } = await supabase
        .from('irrf_brackets')
        .select('*')
        .eq('year', year)
        .order('min_value', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: IRRFBracket[] = data.map((b: any) => ({
          id: b.id,
          min: b.min_value,
          max: b.max_value,
          rate: b.rate,
          deduction: b.deduction
        }));
        setCurrentBrackets(mapped);
      } else {
        setCurrentBrackets([]);
        setBracketsError(true);
      }
    } catch (err) {
      console.error("Error fetching brackets:", err);
      setCurrentBrackets([]);
      setBracketsError(true);
    } finally {
      setIsLoadingBrackets(false);
    }
  };

  // Real-time calculation
  useEffect(() => {
    const gross = parseFloat(grossValue.replace(',', '.')) || 0;
    
    // Use the dynamic brackets fetched from DB
    const calcIrrf = calculateIRRF(gross, currentBrackets);
    
    setIrrf(calcIrrf);
    setNet(gross - calcIrrf);
  }, [grossValue, currentBrackets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaryData) return;

    const newPayment: Payment = {
      id: generateId(),
      notaryId: notaryData.id,
      notaryName: notaryData.name,
      responsibleName: notaryData.responsibleName,
      code: notaryData.code,
      cpf: notaryData.responsibleCpf,
      comarca: notaryData.comarca,
      date: date,
      monthReference: monthRef,
      yearReference: yearRef,
      grossValue: parseFloat(grossValue.replace(',', '.')) || 0,
      irrfValue: irrf,
      netValue: net,
      historyType: historyType,
      status: 'PAGO'
    };

    onSave(newPayment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
             <h3 className="text-xl font-bold text-slate-800">
               {paymentToDuplicate ? 'Duplicar Pagamento' : 'Novo Pagamento'}
             </h3>
             <p className="text-sm text-slate-500">
               {paymentToDuplicate 
                 ? 'Revise os dados duplicados e ajuste a competência se necessário.' 
                 : 'Preencha os dados abaixo para lançar um novo repasse.'}
             </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 bg-slate-50">
          <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
               <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Ano Ref.</label>
                  <input 
                    type="number" 
                    min="2000"
                    max="2099"
                    value={yearRef}
                    onChange={(e) => setYearRef(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-white"
                  />
               </div>
               
               <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Mês Ref.</label>
                  <input 
                    type="text" 
                    maxLength={2}
                    value={monthRef}
                    onChange={(e) => setMonthRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-white"
                    placeholder="01"
                  />
               </div>

               <div className="md:col-span-8 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Responsável <span className="text-red-500">*</span></label>
                  <select 
                    required
                    value={selectedNotaryId}
                    onChange={(e) => setSelectedNotaryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-800"
                  >
                    <option value="">Selecione o cartorário...</option>
                    {notaries.map(notary => (
                      <option key={notary.id} value={notary.id}>
                        {notary.responsibleName} - {notary.name}
                      </option>
                    ))}
                  </select>
               </div>
            </div>

            {/* Section 2: Details (Auto-filled) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">CPF <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    readOnly
                    value={notaryData?.responsibleCpf || ''}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-slate-500 cursor-not-allowed"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Cartório <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    readOnly
                    value={notaryData?.name || ''}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-slate-500 cursor-not-allowed"
                  />
                </div>
            </div>

            {/* Section 3: Calculation Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 transition-colors">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2 text-blue-800">
                    <Calculator size={20} />
                    <h4 className="font-bold text-base">Cálculo de IRRF ({yearRef})</h4>
                 </div>
                 <div className="text-xs">
                    {isLoadingBrackets ? (
                      <span className="flex items-center gap-1 text-blue-600"><Loader2 size={12} className="animate-spin"/> Buscando tabela...</span>
                    ) : bracketsError ? (
                      <span className="flex items-center gap-1 text-red-600 font-bold bg-red-100 px-2 py-1 rounded"><AlertTriangle size={12}/> Tabela {yearRef} não encontrada!</span>
                    ) : (
                      <span className="text-green-700 font-medium bg-green-100 px-2 py-1 rounded">Tabela Vigente Carregada</span>
                    )}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                   <label className="text-sm font-medium text-slate-700">Valor Repassado (R$)</label>
                   <input 
                    type="number"
                    step="0.01"
                    required
                    value={grossValue}
                    onChange={(e) => setGrossValue(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium bg-white"
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="text-sm font-medium text-slate-700">IRRF Retido (R$)</label>
                   <input 
                    type="text"
                    readOnly
                    value={grossValue ? formatCurrency(irrf).replace('R$', '').trim() : '0,00'}
                    className={`w-full px-3 py-2 border rounded-md text-slate-600 bg-red-50 border-red-100 font-medium ${irrf > 0 ? 'text-red-600' : ''}`}
                   />
                </div>

                 <div className="space-y-1.5">
                   <label className="text-sm font-medium text-slate-700">Valor Líquido (R$)</label>
                   <input 
                    type="text"
                    readOnly
                    value={grossValue ? formatCurrency(net).replace('R$', '').trim() : '0,00'}
                    className="w-full px-3 py-2 border rounded-md bg-green-50 border-green-100 font-bold text-green-700"
                   />
                </div>
              </div>
              
              {bracketsError && (
                 <p className="mt-2 text-xs text-red-600">
                   Atenção: Não há faixas de IRRF cadastradas para {yearRef}. O imposto será calculado como R$ 0,00. Vá em Configurações para adicionar.
                 </p>
              )}
            </div>

            {/* Section 4: History and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Histórico</label>
                  <select 
                    value={historyType}
                    onChange={(e) => setHistoryType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
                  >
                    <option value="AJUDA DE CUSTO">AJUDA DE CUSTO</option>
                    <option value="DEA">DEA</option>
                    <option value="MESES ANTERIORES">MESES ANTERIORES</option>
                    <option value="RENDA MINIMA">RENDA MINIMA</option>
                    <option value="REPASSE">REPASSE</option>
                    <option value="COMPLEMENTAÇÃO">COMPLEMENTAÇÃO</option>
                  </select>
               </div>

               <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Data de Pagamento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
                    />
                  </div>
               </div>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3 sticky bottom-0 z-10">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-md transition border border-slate-200"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="payment-form"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 shadow-sm transition flex items-center gap-2"
          >
            <Save size={18} />
            {paymentToDuplicate ? 'Salvar Novo' : 'Salvar'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewPaymentModal;