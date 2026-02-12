
import React, { useState, useEffect } from 'react';
import { X, Calculator, Save, Loader2, Info, Calendar, FileType, CheckCircle } from 'lucide-react';
import { Payment, Notary, IRRFBracket } from '../types';
import { calculateIRRF, formatCurrency, generateId } from '../utils';
import { supabase } from '../supabaseClient';

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Payment) => void;
  notaries: Notary[];
}

const VALOR_VIA_1 = 65.00;
const VALOR_VIA_2 = 21.00;

const NewPaymentModal: React.FC<NewPaymentModalProps> = ({ isOpen, onClose, onSave, notaries }) => {
  const [selectedNotaryId, setSelectedNotaryId] = useState('');
  const [monthRef, setMonthRef] = useState(new Date().getMonth().toString().padStart(2, '0'));
  const [yearRef, setYearRef] = useState(2026);
  const [loteType, setLoteType] = useState<'PRINCIPAL' | 'COMPLEMENTAR'>('PRINCIPAL');
  const [vinculo, setVinculo] = useState<Payment['vinculo']>('Titular');
  const [dataVinculo, setDataVinculo] = useState(new Date().toISOString().split('T')[0]);
  
  // Quantidades por natureza
  const [qtdNascVia1, setQtdNascVia1] = useState(0);
  const [qtdNascVia2, setQtdNascVia2] = useState(0);
  const [qtdCasVia1, setQtdCasVia1] = useState(0);
  const [qtdCasVia2, setQtdCasVia2] = useState(0);
  const [qtdObitoVia1, setQtdObitoVia1] = useState(0);
  const [qtdObitoVia2, setQtdObitoVia2] = useState(0);

  const [notaryData, setNotaryData] = useState<Notary | null>(null);
  const [currentBrackets, setCurrentBrackets] = useState<IRRFBracket[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchBrackets();
  }, [isOpen]);

  useEffect(() => {
    const notary = notaries.find(n => n.id === selectedNotaryId);
    setNotaryData(notary || null);
    if (notary?.vinculoPadrao) setVinculo(notary.vinculoPadrao);
    if (notary?.dataVinculo) setDataVinculo(notary.dataVinculo.split('T')[0]);
  }, [selectedNotaryId, notaries]);

  const fetchBrackets = async () => {
    const { data } = await supabase.from('irrf_brackets').select('*').eq('year', yearRef).order('min_value');
    if (data) setCurrentBrackets(data.map((b: any) => ({
      id: b.id, min: b.min_value, max: b.max_value, rate: b.rate, deduction: b.deduction
    })));
  };

  const totalVia1 = qtdNascVia1 + qtdCasVia1 + qtdObitoVia1;
  const totalVia2 = qtdNascVia2 + qtdCasVia2 + qtdObitoVia2;

  const grossValue = (totalVia1 * VALOR_VIA_1) + (totalVia2 * VALOR_VIA_2);
  const irrfValue = calculateIRRF(grossValue, currentBrackets);
  const netValue = grossValue - irrfValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaryData) return;

    onSave({
      id: generateId(),
      notaryId: notaryData.id,
      notaryName: notaryData.name,
      responsibleName: notaryData.responsibleName,
      code: notaryData.code,
      cpf: notaryData.responsibleCpf,
      comarca: notaryData.comarca,
      municipality: notaryData.city,
      date: new Date().toISOString().split('T')[0],
      monthReference: monthRef,
      yearReference: yearRef,
      grossValue,
      irrfValue,
      netValue,
      historyType: 'REPASSE',
      status: 'EM ANDAMENTO',
      vinculo,
      dataVinculo,
      loteType,
      actType: 'MULTIPLOS',
      qtdVia1: totalVia1,
      qtdVia2: totalVia2,
      // Detalhamento
      qtdNascimentoVia1: qtdNascVia1,
      qtdNascimentoVia2: qtdNascVia2,
      qtdCasamentoVia1: qtdCasVia1,
      qtdCasamentoVia2: qtdCasVia2,
      qtdObitoVia1: qtdObitoVia1,
      qtdObitoVia2: qtdObitoVia2
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">LANÇAMENTO CONSOLIDADO DE ATOS</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Apurado por montante bruto para incidência de IRPF.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition"><X size={24} /></button>
        </div>

        <div className="overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/50">
          <form id="payment-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Top Selection Box */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Cartório */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Cartório / Ofício</label>
                <select 
                  required
                  value={selectedNotaryId}
                  onChange={(e) => setSelectedNotaryId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50/50 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Selecione...</option>
                  {notaries.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>

              {/* Vínculo & Data */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Vínculo & Data</label>
                <div className="flex gap-3">
                  <select 
                    value={vinculo}
                    onChange={(e) => setVinculo(e.target.value as any)}
                    className="w-1/2 px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50/50 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="Titular">Titular</option>
                    <option value="Interino">Interino</option>
                    <option value="Interventor">Interventor</option>
                  </select>
                  <input 
                    type="date"
                    value={dataVinculo}
                    onChange={(e) => setDataVinculo(e.target.value)}
                    className="w-1/2 px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50/50 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Período */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Período de Referência</label>
                <div className="flex gap-3">
                  <select 
                    value={monthRef}
                    onChange={(e) => setMonthRef(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50/50 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                   >
                     {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                       <option key={m} value={m}>{m}</option>
                     ))}
                   </select>
                    <select 
                     value={yearRef}
                     onChange={(e) => setYearRef(parseInt(e.target.value))}
                     className="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50/50 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                </div>
              </div>

            </div>

            {/* Matrix Section */}
            <div>
               <h4 className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase mb-4">
                  <FileType size={16} className="text-blue-600" /> Matriz de Quantidades de Atos
               </h4>
               
               <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="px-6 py-4 text-left font-black uppercase text-xs tracking-wider w-1/3">Natureza do Ato</th>
                        <th className="px-6 py-4 text-center font-black uppercase text-xs tracking-wider w-1/3 text-blue-200">1ª Via (R$ 65,00)</th>
                        <th className="px-6 py-4 text-center font-black uppercase text-xs tracking-wider w-1/3 text-blue-200">2ª Via (R$ 21,00)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-6 py-4 font-bold text-slate-700 uppercase text-xs">Nascimento</td>
                        <td className="px-6 py-2">
                           <input type="number" min="0" className="w-full text-center font-bold text-blue-600 outline-none py-2 hover:bg-slate-50 rounded transition focus:bg-blue-50 focus:ring-1 focus:ring-blue-200" value={qtdNascVia1 || ''} onChange={e => setQtdNascVia1(Number(e.target.value))} placeholder="0" />
                        </td>
                        <td className="px-6 py-2 border-l border-slate-100">
                           <input type="number" min="0" className="w-full text-center font-bold text-blue-600 outline-none py-2 hover:bg-slate-50 rounded transition focus:bg-blue-50 focus:ring-1 focus:ring-blue-200" value={qtdNascVia2 || ''} onChange={e => setQtdNascVia2(Number(e.target.value))} placeholder="0" />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-bold text-slate-700 uppercase text-xs">Casamento</td>
                        <td className="px-6 py-2">
                           <input type="number" min="0" className="w-full text-center font-bold text-blue-600 outline-none py-2 hover:bg-slate-50 rounded transition focus:bg-blue-50 focus:ring-1 focus:ring-blue-200" value={qtdCasVia1 || ''} onChange={e => setQtdCasVia1(Number(e.target.value))} placeholder="0" />
                        </td>
                        <td className="px-6 py-2 border-l border-slate-100">
                           <input type="number" min="0" className="w-full text-center font-bold text-blue-600 outline-none py-2 hover:bg-slate-50 rounded transition focus:bg-blue-50 focus:ring-1 focus:ring-blue-200" value={qtdCasVia2 || ''} onChange={e => setQtdCasVia2(Number(e.target.value))} placeholder="0" />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-bold text-slate-700 uppercase text-xs">Óbito</td>
                        <td className="px-6 py-2">
                           <input type="number" min="0" className="w-full text-center font-bold text-blue-600 outline-none py-2 hover:bg-slate-50 rounded transition focus:bg-blue-50 focus:ring-1 focus:ring-blue-200" value={qtdObitoVia1 || ''} onChange={e => setQtdObitoVia1(Number(e.target.value))} placeholder="0" />
                        </td>
                        <td className="px-6 py-2 border-l border-slate-100">
                           <input type="number" min="0" className="w-full text-center font-bold text-blue-600 outline-none py-2 hover:bg-slate-50 rounded transition focus:bg-blue-50 focus:ring-1 focus:ring-blue-200" value={qtdObitoVia2 || ''} onChange={e => setQtdObitoVia2(Number(e.target.value))} placeholder="0" />
                        </td>
                      </tr>
                      <tr className="bg-blue-50/30">
                        <td className="px-6 py-4 font-black text-slate-800 uppercase text-xs">Totais Unitários</td>
                        <td className="px-6 py-4 text-center font-black text-blue-700 text-sm">
                           {totalVia1} <span className="text-[10px] text-blue-400 ml-1">atos</span>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-blue-700 text-sm border-l border-blue-100">
                           {totalVia2} <span className="text-[10px] text-blue-400 ml-1">atos</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
               </div>
            </div>

            {/* Bottom Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               {/* Left Card: Info */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
                  <div>
                    <h4 className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase mb-6 tracking-widest">
                        <Info size={14} /> Informações Técnicas
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm font-medium text-slate-600 pb-2 border-b border-slate-100">
                         <span>Subtotal 1ª Vias:</span>
                         <span className="font-bold text-slate-800">{formatCurrency(totalVia1 * VALOR_VIA_1)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium text-slate-600 pb-2 border-b border-slate-100">
                         <span>Subtotal 2ª Vias:</span>
                         <span className="font-bold text-slate-800">{formatCurrency(totalVia2 * VALOR_VIA_2)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic mt-6 leading-relaxed">
                     * O IRPF é calculado automaticamente com base na Tabela Progressiva Federal vigente para o montante bruto total do período.
                  </p>
               </div>

               {/* Right Card: Values */}
               <div className="bg-slate-900 p-8 rounded-xl shadow-xl text-white relative overflow-hidden">
                   <div className="relative z-10">
                      <h4 className="flex items-center gap-2 text-[11px] font-black text-blue-400 uppercase mb-8 tracking-widest">
                          <Calculator size={14} /> Liquidação Financeira
                      </h4>
                      
                      <div className="space-y-4 mb-8">
                         <div className="flex justify-between items-end">
                            <span className="text-slate-400 text-sm font-medium">Total Bruto Consolidado</span>
                            <span className="text-xl font-bold tracking-tight">{formatCurrency(grossValue)}</span>
                         </div>
                         <div className="flex justify-between items-end text-red-400">
                            <span className="text-sm font-medium">Retenção IRPF (Tabela Federal)</span>
                            <span className="text-xl font-bold tracking-tight">-{formatCurrency(irrfValue)}</span>
                         </div>
                      </div>

                      <div className="pt-6 border-t border-white/10">
                         <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Valor Líquido para Repasse</span>
                         <span className="text-4xl font-black text-green-400 tracking-tighter">{formatCurrency(netValue)}</span>
                      </div>
                   </div>
               </div>

            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-end items-center gap-4">
           <button 
             onClick={onClose}
             className="px-6 py-3 text-slate-600 font-bold hover:text-slate-800 transition"
           >
             Cancelar
           </button>
           <button 
             onClick={handleSubmit}
             className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
           >
             <CheckCircle size={18} /> Confirmar Lançamento
           </button>
        </div>

      </div>
    </div>
  );
};

const AtosInput = ({ label, value, onChange, theme }: { label: string, value: number, onChange: (v: number) => void, theme: 'sky' | 'rose' | 'slate' }) => {
  const borderColors = {
    sky: 'focus:ring-sky-500 text-sky-700',
    rose: 'focus:ring-rose-500 text-rose-700',
    slate: 'focus:ring-slate-500 text-slate-700'
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <input 
        type="number" 
        min="0"
        value={value || ''}
        placeholder="0"
        onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className={`w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-black outline-none focus:ring-2 bg-white ${borderColors[theme]}`}
      />
    </div>
  );
};

export default NewPaymentModal;
