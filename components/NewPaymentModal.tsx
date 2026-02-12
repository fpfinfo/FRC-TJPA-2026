
import React, { useState, useEffect } from 'react';
import { X, Calculator, Calendar, AlertTriangle, Save, Loader2, Info } from 'lucide-react';
import { Payment, Notary, IRRFBracket } from '../types';
import { calculateIRRF, formatCurrency, generateId } from '../utils';
import { supabase } from '../supabaseClient';

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Payment) => void;
  paymentToDuplicate?: Payment | null;
  notaries: Notary[];
}

const VALOR_VIA_1 = 65.00;
const VALOR_VIA_2 = 21.00;

const NewPaymentModal: React.FC<NewPaymentModalProps> = ({ isOpen, onClose, onSave, paymentToDuplicate, notaries }) => {
  // Form State
  const [selectedNotaryId, setSelectedNotaryId] = useState<string>('');
  const [monthRef, setMonthRef] = useState<string>('01');
  const [yearRef, setYearRef] = useState<number>(new Date().getFullYear());
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loteType, setLoteType] = useState<'PRINCIPAL' | 'COMPLEMENTAR'>('PRINCIPAL');
  const [genre, setGenre] = useState<Payment['genre']>('ATOS_GRATUITOS');
  
  // Quantidades de Vias
  const [qtdVia1, setQtdVia1] = useState<number>(0);
  const [qtdVia2, setQtdVia2] = useState<number>(0);

  // Derived State
  const [notaryData, setNotaryData] = useState<Notary | null>(null);
  const [gross, setGross] = useState<number>(0);
  const [irpf, setIrpf] = useState<number>(0);
  const [net, setNet] = useState<number>(0);

  // Dynamic IRRF Data
  const [currentBrackets, setCurrentBrackets] = useState<IRRFBracket[]>([]);
  const [isLoadingBrackets, setIsLoadingBrackets] = useState(false);

  // Initialize
  useEffect(() => {
    if (isOpen) {
      if (paymentToDuplicate) {
        setSelectedNotaryId(paymentToDuplicate.notaryId);
        setMonthRef(paymentToDuplicate.monthReference);
        setYearRef(paymentToDuplicate.yearReference);
        setLoteType(paymentToDuplicate.loteType || 'PRINCIPAL');
        setGenre(paymentToDuplicate.genre || 'ATOS_GRATUITOS');
        setQtdVia1(paymentToDuplicate.qtdVia1 || 0);
        setQtdVia2(paymentToDuplicate.qtdVia2 || 0);
      } else {
        setQtdVia1(0);
        setQtdVia2(0);
        setSelectedNotaryId('');
      }
    }
  }, [isOpen, paymentToDuplicate]);

  // Sync Notary Data
  useEffect(() => {
    const notary = notaries.find(n => n.id === selectedNotaryId);
    setNotaryData(notary || null);
  }, [selectedNotaryId, notaries]);

  // Fetch Brackets for current year
  useEffect(() => {
    if (isOpen) fetchBracketsForYear(yearRef);
  }, [yearRef, isOpen]);

  const fetchBracketsForYear = async (year: number) => {
    setIsLoadingBrackets(true);
    try {
      const { data } = await supabase
        .from('irrf_brackets')
        .select('*')
        .eq('year', year)
        .order('min_value', { ascending: true });

      if (data && data.length > 0) {
        setCurrentBrackets(data.map((b: any) => ({
          id: b.id, min: b.min_value, max: b.max_value, rate: b.rate, deduction: b.deduction
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingBrackets(false);
    }
  };

  // Real-time calculation
  useEffect(() => {
    const totalBruto = (qtdVia1 * VALOR_VIA_1) + (qtdVia2 * VALOR_VIA_2);
    setGross(totalBruto);
    
    const calcIrpf = calculateIRRF(totalBruto, currentBrackets);
    setIrpf(calcIrpf);
    setNet(totalBruto - calcIrpf);
  }, [qtdVia1, qtdVia2, currentBrackets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaryData) return;

    const historyTypeMap: Record<string, Payment['historyType']> = {
      'ATOS_GRATUITOS': 'REPASSE',
      'RENDA_MINIMA': 'RENDA MINIMA',
      'AJUDA_CUSTO': 'AJUDA DE CUSTO'
    };

    const newPayment: Payment = {
      id: generateId(),
      notaryId: notaryData.id,
      notaryName: notaryData.name,
      responsibleName: notaryData.responsibleName,
      code: notaryData.code,
      cpf: notaryData.responsibleCpf,
      comarca: notaryData.comarca,
      municipality: notaryData.city,
      date: date,
      monthReference: monthRef,
      yearReference: yearRef,
      grossValue: gross,
      irrfValue: irpf,
      netValue: net,
      historyType: historyTypeMap[genre || 'ATOS_GRATUITOS'],
      status: 'EM ANDAMENTO',
      qtdVia1,
      valVia1: VALOR_VIA_1,
      qtdVia2,
      valVia2: VALOR_VIA_2,
      loteType,
      genre
    };

    onSave(newPayment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
             <h3 className="text-xl font-black text-slate-800 tracking-tight">Novo Pagamento de Atos</h3>
             <p className="text-xs text-slate-500 font-medium">Preencha as quantidades para o cálculo automático do repasse.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 bg-white space-y-6">
          <form id="payment-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Contexto do Lote */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tipo de Lote</label>
                <select 
                  value={loteType}
                  onChange={(e) => setLoteType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="PRINCIPAL">Principal</option>
                  <option value="COMPLEMENTAR">Complementar</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Gênero</label>
                <select 
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                >
                  <option value="ATOS_GRATUITOS">Atos Gratuitos</option>
                  <option value="RENDA_MINIMA">Renda Mínima</option>
                  <option value="AJUDA_CUSTO">Ajuda de Custos</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Mês/Ano</label>
                <div className="flex gap-2">
                  <input type="text" value={monthRef} onChange={e => setMonthRef(e.target.value)} maxLength={2} className="w-12 text-center px-2 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="number" value={yearRef} onChange={e => setYearRef(parseInt(e.target.value))} className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Data Lançamento</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            {/* Identificação do Cartório */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Cartório / Responsável</label>
                <select 
                  required
                  value={selectedNotaryId}
                  onChange={(e) => setSelectedNotaryId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Selecione o cartório...</option>
                  {notaries.map(n => <option key={n.id} value={n.id}>{n.name} ({n.responsibleName})</option>)}
                </select>
              </div>
              {notaryData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in slide-in-from-top-2">
                  <div className="flex gap-2 p-2 bg-white rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400">CPF:</span>
                    <span className="text-slate-700 font-mono">{notaryData.responsibleCpf}</span>
                  </div>
                  <div className="flex gap-2 p-2 bg-white rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400">CNS:</span>
                    <span className="text-slate-700 font-mono">{notaryData.ensCode}</span>
                  </div>
                  <div className="flex gap-2 p-2 bg-white rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400">Município:</span>
                    <span className="text-slate-700">{notaryData.city}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Planilha de Atos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2">
                  <Calculator size={14} className="text-blue-600" />
                  Discriminação de Atos
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Atos 1ª Via</p>
                      <p className="text-[10px] text-slate-500">Valor Unit: R$ 65,00</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="0"
                        value={qtdVia1}
                        onChange={e => setQtdVia1(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Atos 2ª Via</p>
                      <p className="text-[10px] text-slate-500">Valor Unit: R$ 21,00</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="0"
                        value={qtdVia2}
                        onChange={e => setQtdVia2(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quadro de Resumo Financeiro */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-6 flex items-center gap-2">
                  <Info size={12} />
                  Resumo de Valores
                </h4>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <span className="text-sm text-slate-400">Total Bruto</span>
                    <span className="text-lg font-bold">{formatCurrency(gross)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">Imposto (IRPF)</span>
                      {isLoadingBrackets && <Loader2 size={12} className="animate-spin text-slate-500" />}
                    </div>
                    <span className="text-lg font-bold text-red-400">-{formatCurrency(irpf)}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Total Líquido</span>
                    <span className="text-3xl font-black text-green-400 tracking-tight">{formatCurrency(net)}</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition">Cancelar</button>
          <button 
            type="submit" 
            form="payment-form"
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <Save size={18} />
            Lançar Pagamento
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewPaymentModal;
