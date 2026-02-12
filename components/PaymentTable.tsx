
import React, { useState, useMemo, useRef } from 'react';
import { Payment, Notary } from '../types';
import { Search, Filter, Plus, FileDown, Edit2, Trash2, ChevronLeft, ChevronRight, X, Upload, Loader2, CheckCircle, AlertOctagon, Clock, Copy, ChevronDown, ListFilter } from 'lucide-react';
import { formatCurrency, formatDate, generateId } from '../utils';
import NewPaymentModal from './NewPaymentModal';
import StatusAuditModal from './StatusAuditModal';
import { useToast } from './ui/ToastContext';

interface PaymentTableProps {
  payments: Payment[];
  notaries: Notary[];
  onAddPayment: (payment: Payment) => void;
  onUpdatePaymentStatus: (id: string, status: Payment['status'], reason?: string) => void;
}

type Genre = 'ATOS_GRATUITOS' | 'RENDA_MINIMA' | 'AJUDA_CUSTO';
type SubTab = 'REPASSE' | 'DEA' | 'MESES_ANTERIORES';

const PaymentTable: React.FC<PaymentTableProps> = ({ payments, notaries, onAddPayment, onUpdatePaymentStatus }) => {
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeGenre, setActiveGenre] = useState<Genre>('ATOS_GRATUITOS');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('REPASSE');
  
  // Filtros
  const [searchGlobal, setSearchGlobal] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState('');
  const [filterComarca, setFilterComarca] = useState('');
  const [filterCartorio, setFilterCartorio] = useState('');
  const [filterLote, setFilterLote] = useState('');

  // Estados de Auditoria e Duplicação
  const [paymentToDuplicate, setPaymentToDuplicate] = useState<Payment | null>(null);
  const [paymentToAudit, setPaymentToAudit] = useState<Payment | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Lógica de Filtragem
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Filtro de Gênero e Sub-aba (para Atos Gratuitos)
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
        p.responsibleName.toLowerCase().includes(globalLower) ||
        p.comarca.toLowerCase().includes(globalLower);

      const matchesYear = !filterYear || p.yearReference.toString() === filterYear;
      const matchesMonth = !filterMonth || p.monthReference === filterMonth;
      const matchesComarca = !filterComarca || p.comarca === filterComarca;
      const matchesCartorio = !filterCartorio || p.notaryName === filterCartorio;
      const matchesLote = !filterLote || p.loteType === filterLote;

      return matchesGlobal && matchesYear && matchesMonth && matchesComarca && matchesCartorio && matchesLote;
    });
  }, [payments, activeGenre, activeSubTab, searchGlobal, filterYear, filterMonth, filterComarca, filterCartorio, filterLote]);

  const handleAuditClick = (payment: Payment) => {
    setPaymentToAudit(payment);
    setIsAuditModalOpen(true);
  };

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'PAGO':
        return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase"><CheckCircle size={10} /> Pago</span>;
      case 'PENDENTE':
        return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase"><AlertOctagon size={10} /> Pendente</span>;
      default:
        return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase"><Clock size={10} /> Em Andamento</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <NewPaymentModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setPaymentToDuplicate(null); }} 
        onSave={onAddPayment}
        paymentToDuplicate={paymentToDuplicate}
        notaries={notaries}
      />

      <StatusAuditModal 
        isOpen={isAuditModalOpen}
        onClose={() => { setIsAuditModalOpen(false); setPaymentToAudit(null); }}
        onSave={(id, status, reason) => onUpdatePaymentStatus(id, status, reason)}
        payment={paymentToAudit}
      />

      {/* Título e Ação Primária */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Pagamentos</h2>
          <p className="text-sm text-slate-500">Controle e auditoria de ressarcimentos e repasses.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={18} />
          Novo Pagamento
        </button>
      </div>

      {/* Navegação por Gêneros */}
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

      {/* Sub-navegação interna (Apenas para Atos Gratuitos) */}
      {activeGenre === 'ATOS_GRATUITOS' && (
        <div className="flex gap-4 items-center">
          <SubTabItem 
            label="Repasse" 
            active={activeSubTab === 'REPASSE'} 
            onClick={() => setActiveSubTab('REPASSE')} 
          />
          <SubTabItem 
            label="DEA" 
            active={activeSubTab === 'DEA'} 
            onClick={() => setActiveSubTab('DEA')} 
          />
          <SubTabItem 
            label="Meses Anteriores" 
            active={activeSubTab === 'MESES_ANTERIORES'} 
            onClick={() => setActiveSubTab('MESES_ANTERIORES')} 
          />
        </div>
      )}

      {/* Área de Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Pesquisa</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Nome, Cartório, Comarca..." 
              value={searchGlobal}
              onChange={(e) => setSearchGlobal(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ano</label>
          <select 
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Mês</label>
          <select 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Todos</option>
            {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tipo Lote</label>
          <select 
            value={filterLote}
            onChange={(e) => setFilterLote(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Ambos</option>
            <option value="PRINCIPAL">Principal</option>
            <option value="COMPLEMENTAR">Complementar</option>
          </select>
        </div>
        <div className="flex items-end">
          <button 
            onClick={() => {
              setSearchGlobal('');
              setFilterMonth('');
              setFilterLote('');
              setFilterComarca('');
            }}
            className="w-full px-4 py-2 text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center justify-center gap-2"
          >
            <X size={16} /> Limpar
          </button>
        </div>
      </div>

      {/* Tabela Principal */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase border-r border-slate-200">Status</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase border-r border-slate-200">Cartório / Titular</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase border-r border-slate-200">Município</th>
                <th colSpan={2} className="px-4 py-2 font-bold text-slate-600 text-[11px] uppercase text-center border-b border-r border-slate-200">Atos 1ª Via</th>
                <th colSpan={2} className="px-4 py-2 font-bold text-slate-600 text-[11px] uppercase text-center border-b border-r border-slate-200">Atos 2ª Via</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase text-right border-r border-slate-200 bg-blue-50/30">Total Bruto</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-red-600 text-[11px] uppercase text-right border-r border-slate-200">IRPF</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-green-700 text-[11px] uppercase text-right border-r border-slate-200">Total Líquido</th>
                <th rowSpan={2} className="px-4 py-4 font-bold text-slate-600 text-[11px] uppercase text-center">Ações</th>
              </tr>
              <tr className="bg-slate-50/50">
                <th className="px-2 py-2 font-medium text-slate-500 text-[10px] text-center border-r border-slate-200">Qtd</th>
                <th className="px-2 py-2 font-medium text-slate-500 text-[10px] text-center border-r border-slate-200">R$ 65,00</th>
                <th className="px-2 py-2 font-medium text-slate-500 text-[10px] text-center border-r border-slate-200">Qtd</th>
                <th className="px-2 py-2 font-medium text-slate-500 text-[10px] text-center border-r border-slate-200">R$ 21,00</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length > 0 ? (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-4">{getStatusBadge(p.status)}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-800">{p.notaryName}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.cpf}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 font-medium">{p.municipality || p.comarca}</td>
                    
                    {/* Atos 1ª Via */}
                    <td className="px-2 py-4 text-center text-slate-700 font-mono">{p.qtdVia1 || 0}</td>
                    <td className="px-2 py-4 text-right text-slate-500 font-mono pr-4">{formatCurrency((p.qtdVia1 || 0) * 65)}</td>
                    
                    {/* Atos 2ª Via */}
                    <td className="px-2 py-4 text-center text-slate-700 font-mono">{p.qtdVia2 || 0}</td>
                    <td className="px-2 py-4 text-right text-slate-500 font-mono pr-4">{formatCurrency((p.qtdVia2 || 0) * 21)}</td>
                    
                    {/* Totais */}
                    <td className="px-4 py-4 text-right font-bold text-slate-800 bg-blue-50/10 border-l border-slate-100">{formatCurrency(p.grossValue)}</td>
                    <td className="px-4 py-4 text-right font-medium text-red-600">{formatCurrency(p.irrfValue)}</td>
                    <td className="px-4 py-4 text-right font-black text-green-700">{formatCurrency(p.netValue)}</td>
                    
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleAuditClick(p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition" 
                          title="Detalhes/Repasse"
                        >
                          <ListFilter size={16} />
                        </button>
                        <button 
                          onClick={() => { setPaymentToDuplicate(p); setIsModalOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertOctagon size={40} className="opacity-20" />
                      <p className="font-medium">Nenhum pagamento encontrado para este filtro.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Paginação Fictícia */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div>Página 1 de 1</div>
          <div className="flex gap-1">
            <button className="p-1 px-2 border border-slate-300 rounded hover:bg-white disabled:opacity-30" disabled><ChevronLeft size={14}/></button>
            <button className="p-1 px-2 border border-slate-300 rounded bg-white font-bold text-blue-600">1</button>
            <button className="p-1 px-2 border border-slate-300 rounded hover:bg-white disabled:opacity-30" disabled><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componentes Auxiliares
const GenreTab: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${
      active ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
    }`}
  >
    {label}
  </button>
);

const SubTabItem: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
      active ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
    }`}
  >
    {label}
  </button>
);

export default PaymentTable;
