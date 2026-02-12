
import React, { useState, useMemo } from 'react';
import { Payment, Notary } from '../types';
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Copy, ListFilter, CheckCircle, AlertOctagon, Clock, Calendar, ChevronDown, FileType, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatCPF, formatDate, formatLote } from '../utils';
import NewPaymentModal from './NewPaymentModal';
import StatusAuditModal from './StatusAuditModal';

interface PaymentTableProps {
  payments: Payment[];
  notaries: Notary[];
  onAddPayment: (payment: Payment) => void;
  onUpdatePaymentStatus: (id: string, status: Payment['status'], reason?: string) => void;
  onUpdatePaymentField?: (id: string, field: string, value: any) => void;
}

type Genre = 'ATOS_GRATUITOS' | 'RENDA_MINIMA' | 'AJUDA_CUSTO';
type SubTab = 'REPASSE' | 'DEA' | 'MESES_ANTERIORES';

const PaymentTable: React.FC<PaymentTableProps> = ({ payments, notaries, onAddPayment, onUpdatePaymentStatus, onUpdatePaymentField }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeGenre, setActiveGenre] = useState<Genre>('ATOS_GRATUITOS');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('REPASSE');
  
  // Filtros
  const [searchGlobal, setSearchGlobal] = useState('');
  const [filterYear, setFilterYear] = useState('2026');
  const [filterLoteType, setFilterLoteType] = useState('');

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [paymentToAudit, setPaymentToAudit] = useState<Payment | null>(null);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (activeGenre === 'ATOS_GRATUITOS') {
        const historyMatch = 
          (activeSubTab === 'REPASSE' && p.historyType === 'REPASSE') ||
          (activeSubTab === 'DEA' && p.historyType === 'DEA') ||
          (activeSubTab === 'MESES_ANTERIORES' && p.historyType === 'MESES ANTERIORES');
        if (!historyMatch) return false;
      } else if (activeGenre === 'RENDA_MINIMA') {
        if (p.historyType !== 'RENDA MINIMA') return false;
      } else if (activeGenre === 'AJUDA_CUSTO') {
        if (p.historyType !== 'AJUDA DE CUSTO') return false;
      }

      const globalLower = searchGlobal.toLowerCase();
      const matchesGlobal = !searchGlobal || 
        p.notaryName.toLowerCase().includes(globalLower) || 
        p.responsibleName.toLowerCase().includes(globalLower);

      const matchesYear = !filterYear || p.yearReference.toString() === filterYear;
      const matchesLote = !filterLoteType || p.loteType === filterLoteType;

      return matchesGlobal && matchesYear && matchesLote;
    });
  }, [payments, activeGenre, activeSubTab, searchGlobal, filterYear, filterLoteType]);

  const getStatusBadge = (status: Payment['status']) => {
    const styles = {
      'PAGO': 'bg-green-100 text-green-700 border-green-200',
      'PENDENTE': 'bg-red-100 text-red-700 border-red-200',
      'EM ANDAMENTO': 'bg-blue-100 text-blue-700 border-blue-200'
    };
    const icons = {
      'PAGO': <CheckCircle size={10} />,
      'PENDENTE': <AlertOctagon size={10} />,
      'EM ANDAMENTO': <Clock size={10} />
    };
    return (
      <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${styles[status]}`}>
        {icons[status]} {status}
      </span>
    );
  };

  const getActTypeBadge = (act?: Payment['actType']) => {
    if (!act) return null;
    const colors: Record<string, string> = {
      'NASCIMENTO': 'bg-sky-100 text-sky-700 border-sky-200',
      'CASAMENTO': 'bg-rose-100 text-rose-700 border-rose-200',
      'OBITO': 'bg-slate-200 text-slate-700 border-slate-300',
      'MULTIPLOS': 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return (
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border leading-none ${colors[act] || 'bg-slate-100 text-slate-600'}`}>
        {act}
      </span>
    );
  };

  return (
    <div className="space-y-6 reveal-stagger">
      <NewPaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={onAddPayment}
        notaries={notaries}
      />

      <StatusAuditModal 
        isOpen={isAuditModalOpen}
        onClose={() => { setIsAuditModalOpen(false); setPaymentToAudit(null); }}
        onSave={(id, status, reason) => onUpdatePaymentStatus(id, status, reason)}
        payment={paymentToAudit}
      />

      {/* Header e Ação */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Pagamentos</h2>
          <p className="text-sm text-slate-500">Análise técnica e financeira de repasses ao registro civil.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-premium-gold flex items-center gap-2"
        >
          <Plus size={18} /> Novo Lançamento
        </button>
      </div>

      {/* Navegação de Gêneros (Tabs) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <GenreTab 
            label="Atos Gratuitos" 
            active={activeGenre === 'ATOS_GRATUITOS'} 
            onClick={() => setActiveGenre('ATOS_GRATUITOS')} 
          />
          <GenreTab 
            label="Renda Mínima" 
            active={activeGenre === 'RENDA_MINIMA'} 
            onClick={() => setActiveGenre('RENDA_MINIMA')} 
          />
          <GenreTab 
            label="Ajuda de Custos" 
            active={activeGenre === 'AJUDA_CUSTO'} 
            onClick={() => setActiveGenre('AJUDA_CUSTO')} 
          />
        </div>

        {/* Sub-navegação e Filtros */}
        <div className="p-4 space-y-4 bg-slate-50/50">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {activeGenre === 'ATOS_GRATUITOS' && (
              <div className="flex gap-2">
                <SubTabItem label="Repasse" active={activeSubTab === 'REPASSE'} onClick={() => setActiveSubTab('REPASSE')} />
                <SubTabItem label="DEA" active={activeSubTab === 'DEA'} onClick={() => setActiveSubTab('DEA')} />
                <SubTabItem label="Meses Anteriores" active={activeSubTab === 'MESES_ANTERIORES'} onClick={() => setActiveSubTab('MESES_ANTERIORES')} />
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-3 ml-auto w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="PESQUISAR..." 
                  value={searchGlobal}
                  onChange={(e) => setSearchGlobal(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border-2 border-slate-200 focus:border-amber-500 rounded-none text-[10px] font-black placeholder:text-slate-300 uppercase tracking-tight outline-none w-full transition-all"
                />
              </div>
              <select 
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-3 py-2 bg-white border-2 border-slate-200 rounded-none text-[10px] font-black uppercase tracking-widest outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
              <select 
                value={filterLoteType}
                onChange={(e) => setFilterLoteType(e.target.value)}
                className="px-3 py-2 bg-white border-2 border-slate-200 rounded-none text-[10px] font-black uppercase tracking-widest outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="">Lote: Todos</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="COMPLEMENTAR">Complementar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela Complexa */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm border-collapse min-w-[1500px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase border-r border-slate-200 sticky left-0 bg-slate-50 z-10">Status</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase border-r border-slate-200">Município</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase border-r border-slate-200 min-w-[300px]">Cartório / Titular / CPF</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase border-r border-slate-200 w-36">Vínculo</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase border-r border-slate-200 w-32">Data Vínculo</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase border-r border-slate-200">Lote</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase border-r border-slate-200">Natureza / Lote</th>
                <th colSpan={3} className="px-4 py-2 font-bold text-amber-500 text-[11px] uppercase text-center border-b border-r border-slate-200 bg-amber-50/20 tracking-[0.2em]">Conformidade Financeira (TRIPLE CHECK)</th>
                <th colSpan={2} className="px-4 py-2 font-bold text-slate-600 text-[11px] uppercase text-center border-b border-r border-slate-200 bg-slate-100/50">Certidões 1ª Via (N/C/Ó)</th>
                <th colSpan={2} className="px-4 py-2 font-bold text-slate-600 text-[11px] uppercase text-center border-b border-r border-slate-200 bg-slate-100/50">Certidões 2ª Via (N/C/Ó)</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-800 text-[11px] uppercase text-right border-r border-slate-200 bg-blue-50/50">Total Bruto</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-red-600 text-[11px] uppercase text-right border-r border-slate-200">IRPF</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-green-700 text-[11px] uppercase text-right border-r border-slate-200">Total Líquido</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase text-center">Ações</th>
              </tr>
              <tr className="bg-slate-50/50">
                <th className="px-2 py-2 font-bold text-amber-700 text-[10px] text-center border-r border-slate-200 bg-amber-50/30">N.E.</th>
                <th className="px-2 py-2 font-bold text-amber-700 text-[10px] text-center border-r border-slate-200 bg-amber-50/30">D.L.</th>
                <th className="px-2 py-2 font-bold text-amber-700 text-[10px] text-center border-r border-slate-200 bg-amber-50/30">O.B.</th>
                <th className="px-2 py-2 font-medium text-slate-500 text-[10px] text-center border-r border-slate-200">Qtd</th>
                <th className="px-2 py-2 font-medium text-slate-500 text-[10px] text-center border-r border-slate-200">R$ 65,00</th>
                <th className="px-2 py-2 font-medium text-slate-500 text-[10px] text-center border-r border-slate-200">Qtd</th>
                <th className="px-2 py-2 font-medium text-slate-500 text-[10px] text-center border-r border-slate-200">R$ 21,00</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group text-[11px]">
                  <td className="px-4 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">{getStatusBadge(p.status)}</td>
                  <td className="px-4 py-4 text-slate-600 font-medium uppercase">{p.municipality || p.comarca}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="font-bold text-slate-800 text-[11px] uppercase leading-tight tracking-tight">{p.notaryName}</div>
                      <div className="text-[11px] font-semibold text-blue-700 italic opacity-90">{p.responsibleName}</div>
                      <div className="text-[10px] text-slate-400 font-mono tracking-tighter mt-0.5">{formatCPF(p.cpf)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative group/select">
                      <select 
                        value={p.vinculo || 'Titular'}
                        onChange={(e) => onUpdatePaymentField?.(p.id, 'vinculo', e.target.value)}
                        className="w-full text-[10px] font-black text-slate-800 bg-white border-2 border-slate-200 rounded-none px-2.5 py-2 outline-none focus:border-amber-500 focus:ring-0 cursor-pointer appearance-none uppercase transition-all hover:bg-slate-50"
                      >
                        <option value="Titular">Titular</option>
                        <option value="Interino">Interino</option>
                        <option value="Interventor">Interventor</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-amber-500">
                         <ChevronDown size={14} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700 font-semibold">{p.dataVinculo ? formatDate(p.dataVinculo) : '---'}</td>
                  <td className="px-4 py-4 text-slate-600 font-mono text-[10px]">{formatLote(p.monthReference, p.yearReference)}</td>
                  <td className="px-4 py-4">
                     <div className="flex flex-col gap-1">
                        {getActTypeBadge(p.actType)}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border w-fit ${p.loteType === 'PRINCIPAL' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                           {p.loteType || 'PRINCIPAL'}
                        </span>
                     </div>
                  </td>
                   {/* Triple Check Status Stamps */}
                  <td className="px-2 py-4 text-center border-r border-slate-100">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${p.ne_empenho ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                      {p.ne_empenho || 'PEND.'}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-center border-r border-slate-100">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${p.dl_liquidacao ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                      {p.dl_liquidacao || 'PEND.'}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-center border-r border-slate-100">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${p.ob_ordem_bancaria ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                      {p.ob_ordem_bancaria || 'PEND.'}
                    </span>
                  </td>

                  {/* Atos 1ª Via */}
                  <td className="px-2 py-4 text-center font-mono font-bold text-slate-700">{p.qtdVia1 || 0}</td>
                  <td className="px-2 py-4 text-right text-slate-500 font-mono text-[10px] pr-4">{formatCurrency((p.qtdVia1 || 0) * 65)}</td>
                  
                  {/* Atos 2ª Via */}
                  <td className="px-2 py-4 text-center font-mono font-bold text-slate-700">{p.qtdVia2 || 0}</td>
                  <td className="px-2 py-4 text-right text-slate-500 font-mono text-[10px] pr-4">{formatCurrency((p.qtdVia2 || 0) * 21)}</td>
                  
                  {/* Totais Fin */}
                  <td className="px-4 py-4 text-right font-bold text-slate-800 bg-blue-50/30 border-l border-slate-100">{formatCurrency(p.grossValue)}</td>
                  <td className="px-4 py-4 text-right font-medium text-red-600">{formatCurrency(p.irrfValue)}</td>
                  <td className="px-4 py-4 text-right font-black text-green-700">{formatCurrency(p.netValue)}</td>
                  
                  <td className="px-4 py-4 border-l border-slate-100">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => { setPaymentToAudit(p); setIsAuditModalOpen(true); }}
                        className="p-2 text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all" 
                        title="Conformidade Financeira"
                      >
                        <ShieldCheck size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all">
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer Paginação */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div>Exibindo {filteredPayments.length} registros de {payments.length}</div>
            <button className="p-1 px-2 border border-slate-300 rounded hover:bg-white disabled:opacity-30" disabled><ChevronLeft size={14}/></button>
            <button className="p-1 px-2 border-2 border-amber-500 bg-amber-50 font-black text-amber-600 shadow-sm text-[10px]">1</button>
            <button className="p-1 px-2 border border-slate-300 rounded hover:bg-white disabled:opacity-30" disabled><ChevronRight size={14}/></button>
        </div>
      </div>
    </div>
  );
};

const GenreTab = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`px-6 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-b-4 relative ${
      active ? 'border-amber-500 text-slate-900 bg-amber-50/20' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    }`}
  >
    {label}
  </button>
);

const SubTabItem = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`px-3 sm:px-4 py-1.5 rounded-none text-[9px] font-black uppercase tracking-widest transition-all ${
      active ? 'bg-slate-900 text-amber-500 shadow-lg' : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-slate-200'
    }`}
  >
    {label}
  </button>
);

export default PaymentTable;
