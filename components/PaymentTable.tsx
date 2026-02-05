import React, { useState, useMemo, useRef } from 'react';
import { Payment, Notary } from '../types';
import { Search, Filter, Plus, FileDown, Edit2, Trash2, ChevronLeft, ChevronRight, X, Upload, Loader2, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { formatCurrency, formatDate, generateId } from '../utils';
import NewPaymentModal from './NewPaymentModal';

// Declare html2pdf for TypeScript
declare var html2pdf: any;

interface PaymentTableProps {
  payments: Payment[];
  notaries: Notary[];
  onAddPayment: (payment: Payment) => void;
}

const PaymentTable: React.FC<PaymentTableProps> = ({ payments, notaries, onAddPayment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for duplication
  const [paymentToDuplicate, setPaymentToDuplicate] = useState<Payment | null>(null);
  
  // Advanced Filter States
  const [searchGlobal, setSearchGlobal] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterComarca, setFilterComarca] = useState('');
  const [filterCartorio, setFilterCartorio] = useState('');
  const [filterHistory, setFilterHistory] = useState('');
  const [filterCpf, setFilterCpf] = useState('');
  
  // Data for Selects
  const months = useMemo(() => Array.from(new Set(payments.map(p => p.monthReference))).sort(), [payments]);
  const comarcas = useMemo(() => Array.from(new Set(payments.map(p => p.comarca))).sort(), [payments]);
  const cartorios = useMemo(() => Array.from(new Set(payments.map(p => p.notaryName))).sort(), [payments]);
  const historyTypes = ['AJUDA DE CUSTO', 'DEA', 'MESES ANTERIORES', 'RENDA MINIMA', 'REPASSE', 'COMPLEMENTAÇÃO'];

  // Filter Logic
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const globalLower = searchGlobal.toLowerCase();
      const matchesGlobal = 
        !searchGlobal || 
        p.notaryName.toLowerCase().includes(globalLower) || 
        p.comarca.toLowerCase().includes(globalLower) ||
        p.responsibleName.toLowerCase().includes(globalLower);

      const matchesMonth = !filterMonth || p.monthReference === filterMonth;
      const matchesComarca = !filterComarca || p.comarca === filterComarca;
      const matchesCartorio = !filterCartorio || p.notaryName === filterCartorio;
      const matchesHistory = !filterHistory || p.historyType === filterHistory;
      const matchesCpf = !filterCpf || p.cpf.includes(filterCpf);

      return matchesGlobal && matchesMonth && matchesComarca && matchesCartorio && matchesHistory && matchesCpf;
    });
  }, [payments, searchGlobal, filterMonth, filterComarca, filterCartorio, filterHistory, filterCpf]);

  const clearFilters = () => {
    setSearchGlobal('');
    setFilterMonth('');
    setFilterComarca('');
    setFilterCartorio('');
    setFilterHistory('');
    setFilterCpf('');
  };

  // --- DUPLICATE FUNCTIONALITY ---
  const handleDuplicateClick = (payment: Payment) => {
    setPaymentToDuplicate(payment);
    setIsModalOpen(true);
  };

  // --- EXPORT CSV FUNCTIONALITY ---
  const handleExportCSV = () => {
    // Headers matching the Payment interface + display names
    const headers = [
      "ID", "Mês Ref", "Ano Ref", "Data Pagamento", "Responsável", "CPF", 
      "Cartório", "Cód", "Comarca", "Histórico", 
      "Valor Bruto", "IRRF", "Valor Líquido", "Status"
    ];

    // Map data to rows
    const rows = filteredPayments.map(p => [
      p.id,
      p.monthReference,
      p.yearReference,
      p.date,
      `"${p.responsibleName}"`, // Quote strings that might contain commas
      p.cpf,
      `"${p.notaryName}"`,
      p.code,
      p.comarca,
      p.historyType,
      p.grossValue.toFixed(2),
      p.irrfValue.toFixed(2),
      p.netValue.toFixed(2),
      p.status
    ]);

    // Construct CSV String with BOM for Excel compatibility
    const csvContent = [
      headers.join(';'), 
      ...rows.map(row => row.join(';'))
    ].join('\n');
    
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TJPA-FRC_Pagamentos_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- EXPORT PDF FUNCTIONALITY ---
  const handleExportPDF = async () => {
    const element = document.getElementById('printable-table-container');
    if (!element || typeof html2pdf === 'undefined') {
      alert('Erro ao gerar PDF: Elemento não encontrado ou biblioteca ausente.');
      return;
    }

    setIsExportingPdf(true);

    const opt = {
      margin: 10,
      filename: `Relatorio_Pagamentos_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
      // Temporarily show the full table container for capture if it was hidden or constrained
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error(error);
      alert('Erro ao exportar PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // --- IMPORT FUNCTIONALITY ---
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset
      fileInputRef.current.click();
    }
  };

  const processImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        
        // Remove headers and empty lines
        const dataLines = lines.slice(1).filter(line => line.trim() !== '');
        
        let successCount = 0;

        dataLines.forEach(line => {
          // Simple CSV parser assuming semi-colon delimiter (matching our export)
          // Removing quotes if present
          const cols = line.split(';').map(c => c.trim().replace(/^"|"$/g, ''));
          
          if (cols.length >= 13) {
             // Create Payment Object
             const newPayment: Payment = {
               id: generateId(),
               monthReference: cols[1] || '01',
               yearReference: parseInt(cols[2]) || new Date().getFullYear(),
               date: cols[3] || new Date().toISOString().split('T')[0],
               responsibleName: cols[4] || 'Importado',
               cpf: cols[5] || '',
               notaryName: cols[6] || 'Cartório Importado',
               code: cols[7] || '',
               comarca: cols[8] || '',
               historyType: (cols[9] as any) || 'REPASSE',
               grossValue: parseFloat(cols[10]) || 0,
               irrfValue: parseFloat(cols[11]) || 0,
               netValue: parseFloat(cols[12]) || 0,
               status: 'PAGO',
               notaryId: 'imported-' + generateId() // Placeholder logic
             };
             
             onAddPayment(newPayment);
             successCount++;
          }
        });

        alert(`${successCount} registros importados com sucesso!`);

      } catch (error) {
        console.error('Erro na importação:', error);
        alert('Erro ao processar arquivo. Verifique se o formato é CSV separado por ponto e vírgula.');
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <NewPaymentModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setPaymentToDuplicate(null); }} 
        onSave={onAddPayment}
        paymentToDuplicate={paymentToDuplicate}
        notaries={notaries}
      />
      
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={processImportFile} 
        accept=".csv" 
        className="hidden" 
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pagamentos</h2>
          <p className="text-slate-500 mt-1">{filteredPayments.length} registros encontrados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
           <button 
             onClick={handleExportCSV}
             className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 shadow-sm transition text-sm font-medium"
           >
            <FileDown size={16} />
            Exportar CSV
          </button>
           <button 
             onClick={handleExportPDF}
             disabled={isExportingPdf}
             className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 shadow-sm transition text-sm font-medium disabled:opacity-50"
           >
            {isExportingPdf ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16} />}
            Exportar PDF
          </button>
           <button 
             onClick={handleImportClick}
             disabled={isImporting}
             className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 shadow-sm transition text-sm font-medium disabled:opacity-50"
           >
            {isImporting ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16} />}
            Importar
          </button>
          <button 
            onClick={() => { setPaymentToDuplicate(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition text-sm font-medium ml-2"
          >
            <Plus size={16} />
            Novo Pagamento
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
          <Filter size={18} />
          <h3>Filtros de Pesquisa</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Row 1 */}
          <div className="md:col-span-6">
            <label className="block text-xs font-medium text-slate-500 mb-1">Pesquisa Global</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                value={searchGlobal}
                onChange={(e) => setSearchGlobal(e.target.value)}
                placeholder="Buscar por nome, cartório, comarca..." 
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-900"
              />
            </div>
          </div>
          <div className="md:col-span-3">
             <label className="block text-xs font-medium text-slate-500 mb-1">Mês</label>
             <select 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-900"
            >
              <option value="">Todos os meses</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
           <div className="md:col-span-3">
             <label className="block text-xs font-medium text-slate-500 mb-1">Comarca</label>
             <select 
              value={filterComarca}
              onChange={(e) => setFilterComarca(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-900"
            >
              <option value="">Todas as comarcas</option>
              {comarcas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Row 2 */}
          <div className="md:col-span-4">
             <label className="block text-xs font-medium text-slate-500 mb-1">Cartório</label>
             <select 
              value={filterCartorio}
              onChange={(e) => setFilterCartorio(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-900"
            >
              <option value="">Todos os cartórios</option>
              {cartorios.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-4">
             <label className="block text-xs font-medium text-slate-500 mb-1">Histórico (múltipla seleção)</label>
             <select 
              value={filterHistory}
              onChange={(e) => setFilterHistory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-900"
            >
              <option value="">Todos os tipos</option>
              {historyTypes.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">CPF</label>
            <input 
                type="text" 
                value={filterCpf}
                onChange={(e) => setFilterCpf(e.target.value)}
                placeholder="000.000.000-00" 
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-900"
              />
          </div>

          {/* Row 3 - Dates and Buttons */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Data Inicial</label>
            <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-500 bg-white" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Data Final</label>
            <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-500 bg-white" />
          </div>
           <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Valor Mínimo</label>
            <input type="text" placeholder="R$ 0,00" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-900" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Valor Máximo</label>
            <input type="text" placeholder="R$ 999.999,99" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-900" />
          </div>
          
          <div className="md:col-span-4 flex items-end justify-end gap-2">
             <button 
              onClick={clearFilters}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium flex items-center gap-1 hover:bg-slate-100 rounded-md transition"
             >
               <X size={16} /> Limpar Todos
             </button>
             <button className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition">
               Aplicar Filtros
             </button>
          </div>
        </div>
      </div>

      {/* Table - ID added for PDF generation */}
      <div id="printable-table-container" className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {/* Print Header - Visible only in PDF via logic or print media query */}
        <div className="hidden print:block p-4 border-b border-slate-200 text-center">
           <h1 className="text-xl font-bold">Relatório de Pagamentos TJPA-FRC</h1>
           <p className="text-sm text-slate-500">Gerado em {new Date().toLocaleDateString()}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Mês</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Responsável</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">CPF</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Cartório</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Cód</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Comarca</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-right">Valor Repassado</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-right">IRRF</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-right">Valor Líquido</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Histórico</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Pagamento</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-center print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{payment.monthReference}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={payment.responsibleName}>{payment.responsibleName}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{payment.cpf}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={payment.notaryName}>{payment.notaryName}</td>
                    <td className="px-4 py-3 text-slate-600">{payment.code}</td>
                    <td className="px-4 py-3 text-slate-600">{payment.comarca}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {formatCurrency(payment.grossValue)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 text-xs">
                      {formatCurrency(payment.irrfValue)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">
                      {formatCurrency(payment.netValue)}
                    </td>
                    <td className="px-4 py-3">
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                         {payment.historyType}
                       </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(payment.date)}</td>
                    <td className="px-4 py-3 text-center print:hidden">
                       <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleDuplicateClick(payment)}
                            className="text-slate-400 hover:text-green-600 transition" 
                            title="Duplicar"
                          >
                            <Copy size={16} />
                          </button>
                          <button className="text-slate-400 hover:text-blue-600 transition" title="Editar"><Edit2 size={16} /></button>
                          <button className="text-slate-400 hover:text-red-600 transition" title="Excluir"><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search size={32} className="mb-2 opacity-50" />
                      <p>Nenhum registro encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer/Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex gap-2">
             <button className="text-xs text-slate-500 hover:text-blue-600 flex items-center">
               <ChevronLeft size={14} /> Recolher
             </button>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-slate-500">
             <span>© 2026 TJPA - Fundo de Apoio ao Registro Civil By fpf.info</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTable;