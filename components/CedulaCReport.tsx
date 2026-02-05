import React, { useState, useMemo } from 'react';
import { Payment, Notary } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Printer, Download, Search, CheckSquare, Square, ArrowLeft, Users, Filter, Loader2 } from 'lucide-react';

// Declare html2pdf for TypeScript since we are loading it from CDN in index.html
declare var html2pdf: any;

interface CedulaCProps {
  payments: Payment[];
  notaries: Notary[];
}

// Sub-component for a single report page
const SingleReportPage: React.FC<{ notary: Notary; payments: Payment[]; year: number }> = ({ notary, payments, year }) => {
  const myPayments = payments.filter(p => p.notaryId === notary.id);
  const totalGross = myPayments.reduce((acc, curr) => acc + curr.grossValue, 0);
  const totalIRRF = myPayments.reduce((acc, curr) => acc + curr.irrfValue, 0);
  const totalNet = myPayments.reduce((acc, curr) => acc + curr.netValue, 0);

  return (
    <div className="cedula-page bg-white shadow-lg mx-auto max-w-[210mm] min-h-[297mm] p-[10mm] md:p-[15mm] border border-slate-200 text-slate-900 print:shadow-none print:border-none print:w-full print:max-w-none print:min-h-0 print:p-0 print:m-0 break-after-page mb-8 last:mb-0">
      
      {/* Header */}
      <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
         <div className="flex justify-center mb-3">
           <img 
             src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png" 
             alt="Brasão TJPA" 
             className="w-20 opacity-90"
           />
         </div>
         <h1 className="font-serif text-lg font-bold uppercase tracking-wide">Tribunal de Justiça do Estado do Pará</h1>
         <h2 className="font-serif text-base font-semibold mt-1">Fundo de Apoio ao Registro Civil - FRC</h2>
         <p className="text-xs mt-2 uppercase font-medium">Comprovante de Rendimentos Pagos e de Retenção de Imposto de Renda na Fonte</p>
         <p className="text-xs mt-1">Ano Calendário: <strong>{year}</strong></p>
      </div>

      {/* Section 1: Beneficiary */}
      <div className="mb-6">
        <h3 className="bg-slate-100 border border-slate-300 px-3 py-1 font-bold text-xs uppercase mb-2">1. Dados do Beneficiário</h3>
        <div className="grid grid-cols-3 gap-3 border border-slate-300 p-3 text-xs">
           <div className="col-span-2">
             <label className="block text-[10px] text-slate-500 uppercase">Nome Completo / Razão Social</label>
             <span className="font-semibold block truncate">{notary.name}</span>
           </div>
           <div>
             <label className="block text-[10px] text-slate-500 uppercase">Responsável</label>
             <span className="font-semibold block truncate">{notary.responsibleName}</span>
           </div>
           <div>
             <label className="block text-[10px] text-slate-500 uppercase">CPF</label>
             <span className="font-semibold block">{notary.responsibleCpf}</span>
           </div>
           <div className="col-span-1">
             <label className="block text-[10px] text-slate-500 uppercase">Código CNS</label>
             <span className="block">{notary.ensCode}</span>
           </div>
             <div className="col-span-1">
             <label className="block text-[10px] text-slate-500 uppercase">Comarca</label>
             <span className="block">{notary.comarca}</span>
           </div>
        </div>
      </div>

      {/* Section 2: Financial Summary */}
      <div className="mb-6">
        <h3 className="bg-slate-100 border border-slate-300 px-3 py-1 font-bold text-xs uppercase mb-2">2. Resumo Financeiro</h3>
        <div className="border border-slate-300">
           <div className="grid grid-cols-3 divide-x divide-slate-300">
              <div className="p-3 text-center">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Total Bruto</p>
                <p className="text-base font-bold">{formatCurrency(totalGross)}</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Total IRRF</p>
                <p className="text-base font-bold text-red-700">{formatCurrency(totalIRRF)}</p>
              </div>
              <div className="p-3 text-center bg-slate-50">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Líquido</p>
                <p className="text-base font-bold text-green-700">{formatCurrency(totalNet)}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Section 3: Details */}
      <div className="mb-6">
        <h3 className="bg-slate-100 border border-slate-300 px-3 py-1 font-bold text-xs uppercase mb-2">3. Discriminação dos Pagamentos</h3>
        <table className="w-full text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-50">
              <th className="border border-slate-300 px-2 py-1.5 text-left w-16">Ref.</th>
              <th className="border border-slate-300 px-2 py-1.5 text-left w-24">Data</th>
              <th className="border border-slate-300 px-2 py-1.5 text-left">Histórico</th>
              <th className="border border-slate-300 px-2 py-1.5 text-right w-24">Bruto</th>
              <th className="border border-slate-300 px-2 py-1.5 text-right w-20">IRRF</th>
              <th className="border border-slate-300 px-2 py-1.5 text-right w-24">Líquido</th>
            </tr>
          </thead>
          <tbody>
            {myPayments.map((p) => (
              <tr key={p.id}>
                <td className="border border-slate-300 px-2 py-1.5 text-center">{p.monthReference}</td>
                <td className="border border-slate-300 px-2 py-1.5">{formatDate(p.date)}</td>
                <td className="border border-slate-300 px-2 py-1.5 truncate max-w-[150px]">{p.historyType}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right">{formatCurrency(p.grossValue)}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right">{formatCurrency(p.irrfValue)}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right font-medium">{formatCurrency(p.netValue)}</td>
              </tr>
            ))}
            {myPayments.length === 0 && (
              <tr>
                 <td colSpan={6} className="border border-slate-300 px-3 py-6 text-center text-slate-500 italic">
                    Nenhum registro encontrado para este período.
                 </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[10px] text-slate-500">
         <p>Este documento foi gerado eletronicamente pelo Sistema FRC-TJPA.</p>
         <p>Data de Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
         <p className="mt-1 font-mono">HASH: {Math.random().toString(36).substr(2, 16).toUpperCase()}</p>
      </div>
    </div>
  );
};

const CedulaCReport: React.FC<CedulaCProps> = ({ payments, notaries }) => {
  const [viewMode, setViewMode] = useState<'selection' | 'preview'>('selection');
  const [selectedNotaryIds, setSelectedNotaryIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const currentYear = new Date().getFullYear();

  // Filter logic for selection list
  const filteredNotaries = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return notaries.filter(n => 
      n.name.toLowerCase().includes(lowerSearch) || 
      n.responsibleName.toLowerCase().includes(lowerSearch) ||
      n.responsibleCpf.includes(searchTerm)
    );
  }, [notaries, searchTerm]);

  // Selection Handlers
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedNotaryIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedNotaryIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedNotaryIds.size === filteredNotaries.length && filteredNotaries.length > 0) {
      setSelectedNotaryIds(new Set());
    } else {
      setSelectedNotaryIds(new Set(filteredNotaries.map(n => n.id)));
    }
  };

  const isAllSelected = filteredNotaries.length > 0 && selectedNotaryIds.size === filteredNotaries.length;

  // Get selected notary objects for preview
  const selectedNotariesList = notaries.filter(n => selectedNotaryIds.has(n.id));

  // Handle PDF Download using html2pdf.js
  const handleDownloadPdf = async () => {
    const element = document.getElementById('cedulas-container');
    if (!element || typeof html2pdf === 'undefined') {
      alert('Biblioteca de PDF não carregada ou elemento não encontrado.');
      return;
    }

    setIsGeneratingPdf(true);

    const opt = {
      margin: 0,
      filename: `Cedulas_C_${currentYear}_TJPA.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Houve um erro ao gerar o PDF. Tente novamente ou use a opção de Impressão.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SELECTION VIEW */}
      {viewMode === 'selection' && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Cédula C</h2>
              <p className="text-slate-500 mt-1">Selecione os beneficiários para gerar os comprovantes de rendimentos.</p>
            </div>
            {selectedNotaryIds.size > 0 && (
              <button 
                onClick={() => setViewMode('preview')}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition font-medium animate-in zoom-in"
              >
                <Printer size={18} />
                Gerar {selectedNotaryIds.size} Relatórios
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, responsável ou CPF..." 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3 py-1.5 rounded-md border border-slate-200">
                <Filter size={14} />
                <span>Mostrando {filteredNotaries.length} de {notaries.length}</span>
              </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">
                      <button onClick={toggleSelectAll} className="text-slate-500 hover:text-blue-600">
                        {isAllSelected ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                      </button>
                    </th>
                    <th className="px-4 py-3">Cartório / Razão Social</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">CPF</th>
                    <th className="px-4 py-3">Comarca</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNotaries.length > 0 ? (
                    filteredNotaries.map((notary) => {
                      const isSelected = selectedNotaryIds.has(notary.id);
                      return (
                        <tr 
                          key={notary.id} 
                          onClick={() => toggleSelection(notary.id)}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center text-slate-400">
                               {isSelected ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">{notary.name}</td>
                          <td className="px-4 py-3 text-slate-600">{notary.responsibleName}</td>
                          <td className="px-4 py-3 font-mono text-slate-500 text-xs">{notary.responsibleCpf}</td>
                          <td className="px-4 py-3 text-slate-600">{notary.comarca}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${
                              notary.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {notary.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <Users size={32} className="mx-auto mb-2 opacity-30" />
                        <p>Nenhum beneficiário encontrado.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer Stats */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
               <span className="text-sm text-slate-500">{selectedNotaryIds.size} selecionados</span>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW VIEW */}
      {viewMode === 'preview' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* Action Bar (Hidden on Print) */}
          <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 py-4 mb-6 print:hidden">
            <div className="max-w-5xl mx-auto flex justify-between items-center px-4">
              <button 
                onClick={() => setViewMode('selection')}
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition"
              >
                <ArrowLeft size={20} />
                Voltar para Seleção
              </button>
              
              <div className="flex items-center gap-3">
                 <span className="text-sm text-slate-500 hidden sm:inline">
                    {selectedNotariesList.length} documentos gerados
                 </span>
                 <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>
                 
                 <button 
                  onClick={() => window.print()} 
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition font-medium"
                >
                  <Printer size={18} />
                  Imprimir Todos
                </button>
                
                <button 
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  {isGeneratingPdf ? 'Gerando...' : 'PDF'}
                </button>
              </div>
            </div>
          </div>

          {/* Report Content Loop - Wrapped for PDF Generation */}
          <div id="cedulas-container" className="print:w-full">
            <style>
              {`
                @media print {
                  @page { margin: 0; size: A4; }
                  body { background: white; -webkit-print-color-adjust: exact; }
                  .break-after-page { page-break-after: always; }
                }
              `}
            </style>
            
            {selectedNotariesList.map(notary => (
              <SingleReportPage 
                key={notary.id} 
                notary={notary} 
                payments={payments}
                year={currentYear} 
              />
            ))}
          </div>

        </div>
      )}

    </div>
  );
};

export default CedulaCReport;