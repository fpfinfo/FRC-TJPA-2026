
import React, { useState, useEffect } from 'react';
import { X, Calculator, Save, Loader2, Info, Calendar, FileType } from 'lucide-react';
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
  const [monthRef, setMonthRef] = useState('01');
  const [yearRef, setYearRef] = useState(2025);
  const [loteType, setLoteType] = useState<'PRINCIPAL' | 'COMPLEMENTAR'>('PRINCIPAL');
  const [actType, setActType] = useState<Payment['actType']>('NASCIMENTO');
  const [vinculo, setVinculo] = useState<Payment['vinculo']>('Titular');
  const [dataVinculo, setDataVinculo] = useState(new Date().toISOString().split('T')[0]);
  const [qtdVia1, setQtdVia1] = useState(0);
  const [qtdVia2, setQtdVia2] = useState(0);

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
  }, [selectedNotaryId, notaries]);

  const fetchBrackets = async () => {
    const { data } = await supabase.from('irrf_brackets').select('*').eq('year', yearRef).order('min_value');
    if (data) setCurrentBrackets(data.map((b: any) => ({
      id: b.id, min: b.min_value, max: b.max_value, rate: b.rate, deduction: b.deduction
    })));
  };

  const grossValue = (qtdVia1 * VALOR_VIA_1) + (qtdVia2 * VALOR_VIA_2);
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
      actType,
      qtdVia1,
      qtdVia2
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Novo Lançamento de Atos</h3>
            <p className="text-xs text-slate-500 font-medium">Ressarcimento de Certidões de Nascimento, Casamento e Óbito.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8">
          <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cartório Solicitante</label>
                <select 
                  required
                  value={selectedNotaryId}
                  onChange={(e) => setSelectedNotaryId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Selecione o cartório...</option>
                  {notaries.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Natureza do Ato</label>
                <div className="relative">
                  <FileType className="absolute left-3 top-2.5 text-blue-500" size={16} />
                  <select 
                    required
                    value={actType}
                    onChange={(e) => setActType(e.target.value as any)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-blue-50/30 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  >
                    <option value="NASCIMENTO">NASCIMENTO</option>
                    <option value="CASAMENTO">CASAMENTO</option>
                    <option value="OBITO">ÓBITO</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lote / Período</label>
                <div className="flex gap-2">
                   <select 
                    value={monthRef}
                    onChange={(e) => setMonthRef(e.target.value)}
                    className="flex-1 px-2 py-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none"
                   >
                     {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                       <option key={m} value={m}>{m}</option>
                     ))}
                   </select>
                   <select 
                    value={yearRef}
                    onChange={(e) => setYearRef(parseInt(e.target.value))}
                    className="flex-1 px-2 py-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none"
                   >
                     <option value="2024">2024</option>
                     <option value="2025">2025</option>
                   </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Vínculo do Responsável</label>
                  <select 
                    value={vinculo}
                    onChange={(e) => setVinculo(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  >
                    <option value="Titular">Titular</option>
                    <option value="Interino">Interino</option>
                    <option value="Interventor">Interventor</option>
                  </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Data Início Vínculo</label>
                   <input 
                    type="date"
                    value={dataVinculo}
                    onChange={(e) => setDataVinculo(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Modalidade do Lote</label>
                  <select 
                    value={loteType}
                    onChange={(e) => setLoteType(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  >
                    <option value="PRINCIPAL">PRINCIPAL</option>
                    <option value="COMPLEMENTAR">COMPLEMENTAR</option>
                  </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2 border-b pb-2">
                   <Calculator size={14} className="text-blue-600" /> Detalhamento de Atos Gratuitos
                </h4>
                <div className="space-y-3">
                  <AtosInput label="Certidões 1ª Via (R$ 65,00)" value={qtdVia1} onChange={setQtdVia1} />
                  <AtosInput label="Certidões 2ª Via (R$ 21,00)" value={qtdVia2} onChange={setQtdVia2} />
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  * Os valores unitários são definidos por ato conforme a tabela de custas do Estado do Pará.
                </p>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Calculator size={120} />
                </div>
                <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-6 flex items-center gap-2"><Info size={12} /> Resumo de Liquidação</h4>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-sm text-slate-400">Total Bruto</span>
                    <span className="text-lg font-bold">{formatCurrency(grossValue)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/10 text-red-400">
                    <span className="text-sm">Retenção IRPF Est.</span>
                    <span className="text-lg font-bold">-{formatCurrency(irrfValue)}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1 tracking-tighter">Valor Líquido Estimado</span>
                    <span className="text-3xl font-black text-green-400 tracking-tight">{formatCurrency(netValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition">Cancelar</button>
          <button type="submit" form="payment-form" className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"><Save size={18} /> Confirmar Lançamento</button>
        </div>
      </div>
    </div>
  );
};

const AtosInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-colors">
    <span className="text-sm font-bold text-slate-700">{label}</span>
    <input 
      type="number" 
      min="0"
      value={value}
      onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
      className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
    />
  </div>
);

export default NewPaymentModal;
