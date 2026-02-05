import React, { useState, useEffect } from 'react';
import { Calculator, Trash2, Plus, Info, Edit2, Save, X, CalendarPlus, Loader2 } from 'lucide-react';
import { IRRFBracket } from '../types';
import { generateId, formatCurrency } from '../utils';
import { supabase } from '../supabaseClient';

const IrrfSettings: React.FC = () => {
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [brackets, setBrackets] = useState<IRRFBracket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    min: '',
    max: '',
    rate: '',
    deduction: ''
  });

  // Fetch Data on Load or Year Change
  useEffect(() => {
    fetchBrackets();
  }, [activeYear]);

  const fetchBrackets = async () => {
    setIsLoading(true);
    try {
      // Fetch years first to populate tabs
      const { data: yearsData } = await supabase
        .from('irrf_brackets')
        .select('year');
      
      if (yearsData) {
        const uniqueYears = Array.from(new Set(yearsData.map((item: any) => item.year))).sort((a: number, b: number) => a - b);
        if (uniqueYears.length > 0) {
          setAvailableYears(uniqueYears as number[]);
        }
      }

      // Fetch brackets for active year
      const { data, error } = await supabase
        .from('irrf_brackets')
        .select('*')
        .eq('year', activeYear)
        .order('min_value', { ascending: true });

      if (error) throw error;

      // Map DB snake_case to Frontend camelCase
      const mappedBrackets: IRRFBracket[] = (data || []).map((b: any) => ({
        id: b.id,
        min: b.min_value,
        max: b.max_value,
        rate: b.rate,
        deduction: b.deduction
      }));

      setBrackets(mappedBrackets);
    } catch (error) {
      console.error('Error fetching IRRF brackets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddYear = () => {
    const maxYear = Math.max(...availableYears, new Date().getFullYear());
    const nextYear = maxYear + 1;
    setAvailableYears(prev => [...prev, nextYear].sort((a, b) => a - b));
    setActiveYear(nextYear);
    setBrackets([]); // Empty for new year
    handleCancelEdit();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta faixa?')) {
      try {
        const { error } = await supabase.from('irrf_brackets').delete().eq('id', id);
        if (error) throw error;
        
        // Update UI
        setBrackets(prev => prev.filter(b => b.id !== id));
        if (editingId === id) handleCancelEdit();
      } catch (error) {
        console.error('Error deleting bracket:', error);
        alert('Erro ao excluir faixa.');
      }
    }
  };

  const handleEdit = (bracket: IRRFBracket) => {
    setEditingId(bracket.id);
    setFormData({
      min: bracket.min.toString(),
      max: bracket.max !== null ? bracket.max.toString() : '',
      rate: (bracket.rate * 100).toString(),
      deduction: bracket.deduction.toString()
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ min: '', max: '', rate: '', deduction: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const min = parseFloat(formData.min);
    const max = formData.max ? parseFloat(formData.max) : null;
    const rate = parseFloat(formData.rate) / 100;
    const deduction = parseFloat(formData.deduction);

    if (isNaN(min) || isNaN(rate) || isNaN(deduction)) {
      alert('Por favor, preencha os campos numéricos corretamente.');
      return;
    }

    const dbPayload = {
      year: activeYear,
      min_value: min,
      max_value: max,
      rate: rate,
      deduction: deduction
    };

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('irrf_brackets')
          .update(dbPayload)
          .eq('id', editingId);

        if (error) throw error;

        setBrackets(prev => prev.map(b => 
          b.id === editingId 
            ? { ...b, min, max, rate, deduction } 
            : b
        ).sort((a, b) => a.min - b.min));

      } else {
        // Create
        const { data, error } = await supabase
          .from('irrf_brackets')
          .insert(dbPayload)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const newBracket: IRRFBracket = {
            id: data.id,
            min: data.min_value,
            max: data.max_value,
            rate: data.rate,
            deduction: data.deduction
          };
          setBrackets(prev => [...prev, newBracket].sort((a, b) => a.min - b.min));
        }
      }
      handleCancelEdit();
    } catch (error) {
      console.error('Error saving bracket:', error);
      alert('Erro ao salvar dados no banco.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
        <Calculator className="text-blue-600 mt-1" size={20} />
        <div>
          <h3 className="text-blue-800 font-semibold text-sm">Tabela Progressiva Online</h3>
          <p className="text-blue-600 text-xs mt-1">
            Estas configurações são salvas no banco de dados. Novos pagamentos usarão automaticamente a tabela do ano correspondente se disponível.
            <br/><strong>Fórmula: (Base × Alíquota) - Dedução</strong>
          </p>
        </div>
      </div>

      {/* Year Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {availableYears.map(year => (
          <button 
            key={year}
            onClick={() => { setActiveYear(year); handleCancelEdit(); }}
            className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition flex-shrink-0 ${
              activeYear === year 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {year}
          </button>
        ))}
        
        <button
          onClick={handleAddYear}
          className="flex items-center gap-1 whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-600 border border-dashed border-blue-300 hover:bg-blue-100 transition flex-shrink-0"
          title="Criar tabela para o próximo ano"
        >
          <CalendarPlus size={16} /> 
          <span className="hidden sm:inline">Novo Ano</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden relative min-h-[200px]">
        
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        )}

        <div className="px-6 py-4 border-b border-slate-200 bg-white">
          <h3 className="font-bold text-slate-800">Faixas de Cálculo - Ano Base {activeYear}</h3>
          <p className="text-slate-500 text-xs mt-1">{brackets.length} faixas cadastradas</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Base de Cálculo (R$)</th>
                <th className="px-6 py-3 font-medium">Alíquota</th>
                <th className="px-6 py-3 font-medium">Dedução (R$)</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {brackets.length > 0 ? (
                brackets.map((bracket) => (
                  <tr key={bracket.id} className={`hover:bg-slate-50 transition ${editingId === bracket.id ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-3 text-slate-700">
                      {bracket.max 
                        ? `${formatCurrency(bracket.min)} até ${formatCurrency(bracket.max)}`
                        : `Acima de ${formatCurrency(bracket.min)}`
                      }
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {bracket.rate === 0 ? <span className="text-green-600 font-bold">Isento</span> : `${(bracket.rate * 100).toFixed(1)}%`}
                    </td>
                    <td className="px-6 py-3 text-slate-700 font-medium">
                      {formatCurrency(bracket.deduction)}
                    </td>
                    <td className="px-6 py-3 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button 
                          onClick={() => handleEdit(bracket)}
                          className={`p-1 transition rounded ${editingId === bracket.id ? 'text-blue-600 bg-blue-100' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'}`}
                          title="Editar"
                         >
                           <Edit2 size={16} />
                         </button>
                         <button 
                          onClick={() => handleDelete(bracket.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition p-1 rounded"
                          title="Excluir"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Info size={32} className="opacity-20" />
                      <p className="italic">Nenhuma faixa encontrada para {activeYear}.</p>
                      <p className="text-xs">Utilize o formulário abaixo para começar.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className={`bg-white rounded-lg border shadow-sm p-6 transition-colors duration-300 ${editingId ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-bold flex items-center gap-2 ${editingId ? 'text-blue-700' : 'text-slate-800'}`}>
            {editingId ? (
              <>
                <Edit2 size={18} />
                Editar Faixa Selecionada
              </>
            ) : (
              <>
                <Plus size={18} />
                Adicionar Nova Faixa ({activeYear})
              </>
            )}
          </h3>
          {editingId && (
            <button 
              onClick={handleCancelEdit}
              className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded hover:bg-red-50 transition"
            >
              <X size={14} /> Cancelar Edição
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-1">
             <label className="block text-xs font-semibold text-slate-500 mb-1">Ano</label>
             <input 
               type="text" 
               value={activeYear} 
               disabled 
               className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-md text-slate-500 text-sm font-medium"
             />
          </div>

          <div className="md:col-span-3">
             <label className="block text-xs font-semibold text-slate-500 mb-1">Valor Inicial (R$)</label>
             <input 
               type="number" 
               step="0.01"
               required
               value={formData.min}
               onChange={e => setFormData({...formData, min: e.target.value})}
               placeholder="0,00"
               className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-slate-900"
             />
          </div>

          <div className="md:col-span-3">
             <label className="block text-xs font-semibold text-slate-500 mb-1">Valor Final (R$)</label>
             <input 
               type="number" 
               step="0.01"
               value={formData.max}
               onChange={e => setFormData({...formData, max: e.target.value})}
               placeholder="999999,99 (Vazio se for teto)"
               className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-slate-900"
             />
          </div>

          <div className="md:col-span-2">
             <label className="block text-xs font-semibold text-slate-500 mb-1">Alíquota (%)</label>
             <input 
               type="number" 
               step="0.1"
               required
               value={formData.rate}
               onChange={e => setFormData({...formData, rate: e.target.value})}
               placeholder="0 para isento"
               className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-slate-900"
             />
          </div>

          <div className="md:col-span-2">
             <label className="block text-xs font-semibold text-slate-500 mb-1">Dedução (R$)</label>
             <input 
               type="number" 
               step="0.01"
               required
               value={formData.deduction}
               onChange={e => setFormData({...formData, deduction: e.target.value})}
               placeholder="0,00"
               className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-slate-900"
             />
          </div>

          <div className="md:col-span-1">
             <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 text-white rounded-md transition flex items-center justify-center shadow-sm ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
              title={editingId ? "Salvar Alterações" : "Adicionar Faixa"}
             >
               {editingId ? <Save size={20} /> : <Plus size={20} />}
             </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default IrrfSettings;