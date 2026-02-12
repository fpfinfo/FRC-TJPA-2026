import React, { useState, useEffect } from 'react';
import { X, Save, MapPin } from 'lucide-react';
import { Notary } from '../types';
import { generateId } from '../utils';

interface NewNotaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notary: Notary) => void;
  notaryToEdit?: Notary; // Optional prop for editing mode
  notaryToDuplicate?: Notary; // Optional prop for duplication mode
}

const NewNotaryModal: React.FC<NewNotaryModalProps> = ({ isOpen, onClose, onSave, notaryToEdit, notaryToDuplicate }) => {
  const initialFormState: Partial<Notary> = {
    name: '',
    code: '',
    ensCode: '',
    comarca: '',
    status: 'ATIVO',
    address: '',
    city: '',
    state: 'PA',
    cep: '',
    phone: '',
    email: '',
    responsibleName: '',
    responsibleCpf: '',
    latitude: undefined,
    longitude: undefined,
  };

  const [formData, setFormData] = useState<Partial<Notary>>(initialFormState);

  // Populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (notaryToEdit) {
        // Editing: Exact copy
        setFormData({ ...notaryToEdit });
      } else if (notaryToDuplicate) {
        // Duplicating: Copy data, but append "Cópia" to name to distinguish
        setFormData({ 
          ...notaryToDuplicate,
          name: `${notaryToDuplicate.name} (Cópia)`,
          // We keep codes/CPFs but user likely needs to change them, manual change required
        });
      } else {
        // New: Reset
        setFormData(initialFormState);
      }
    }
  }, [isOpen, notaryToEdit, notaryToDuplicate]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Notary, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof Notary, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value ? parseFloat(value) : undefined }));
  };

  const toggleStatus = () => {
    setFormData(prev => ({ 
      ...prev, 
      status: prev.status === 'ATIVO' ? 'INATIVO' : 'ATIVO' 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      // If editing, use existing ID. If duplicating OR new, generate NEW ID.
      id: notaryToEdit?.id || generateId(),
      ...formData as Notary
    });
    onClose();
  };

  const getTitle = () => {
    if (notaryToEdit) return 'Editar Cartório';
    if (notaryToDuplicate) return 'Duplicar Cartório';
    return 'Novo Cartório';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {getTitle()}
            </h3>
            {notaryToDuplicate && (
              <p className="text-xs text-slate-500 mt-1">Revise os dados antes de salvar o novo registro.</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 bg-white custom-scrollbar">
          <form id="notary-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Informações Básicas */}
            <div>
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">
                Informações Básicas
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Cartório *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Código</label>
                    <input 
                      type="text" 
                      value={formData.code || ''}
                      onChange={(e) => handleChange('code', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Código CNS</label>
                    <input 
                      type="text" 
                      value={formData.ensCode || ''}
                      onChange={(e) => handleChange('ensCode', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Comarca *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.comarca}
                      onChange={(e) => handleChange('comarca', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    />
                  </div>
                  <div className="flex items-center pb-2">
                    <button 
                      type="button" 
                      onClick={toggleStatus}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.status === 'ATIVO' ? 'bg-slate-900' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status === 'ATIVO' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="ml-3 text-sm font-medium text-slate-900">Cartório Ativo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1 pt-2">
                Endereço & Localização
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Endereço Completo</label>
                  <input 
                    type="text" 
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cidade</label>
                    <input 
                      type="text" 
                      value={formData.city || ''}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Estado</label>
                    <input 
                      type="text" 
                      value={formData.state || ''}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">CEP</label>
                    <input 
                      type="text" 
                      placeholder="00000-000"
                      value={formData.cep || ''}
                      onChange={(e) => handleChange('cep', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    />
                  </div>
                </div>

                {/* Geolocalização */}
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                   <div className="flex items-center gap-2 mb-3 text-slate-700">
                     <MapPin size={18} />
                     <h5 className="text-sm font-bold">Coordenadas Geográficas</h5>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 mb-1">Latitude</label>
                       <input 
                         type="number" 
                         step="any"
                         placeholder="-1.4557"
                         value={formData.latitude || ''}
                         onChange={(e) => handleNumberChange('latitude', e.target.value)}
                         className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 text-sm"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 mb-1">Longitude</label>
                       <input 
                         type="number" 
                         step="any"
                         placeholder="-48.4902"
                         value={formData.longitude || ''}
                         onChange={(e) => handleNumberChange('longitude', e.target.value)}
                         className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 text-sm"
                       />
                     </div>
                   </div>
                   <p className="text-[10px] text-slate-500 mt-2">
                     * Utilize coordenadas decimais. Você pode obtê-las no Google Maps clicando com o botão direito no local.
                   </p>
                </div>
              </div>
            </div>

            {/* Contato */}
            <div>
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1 pt-2">
                Contato
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone</label>
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Responsável */}
            <div>
               <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1 pt-2">
                Responsável
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Responsável</label>
                  <input 
                    type="text" 
                    value={formData.responsibleName}
                    onChange={(e) => handleChange('responsibleName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">CPF do Responsável</label>
                  <input 
                    type="text" 
                    placeholder="000.000.000-00"
                    value={formData.responsibleCpf}
                    onChange={(e) => handleChange('responsibleCpf', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                  />
                </div>
                <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1">Vínculo do Responsável</label>
                   <select 
                     value={formData.vinculoPadrao || 'Titular'} 
                     onChange={(e) => handleChange('vinculoPadrao', e.target.value)}
                     className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                   >
                     <option value="Titular">Titular</option>
                     <option value="Interino">Interino</option>
                     <option value="Interventor">Interventor</option>
                   </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data Início Vínculo</label>
                  <input 
                    type="date"
                    value={formData.dataVinculo || ''}
                    onChange={(e) => handleChange('dataVinculo', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                   />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="notary-form"
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Save size={16} />
            {notaryToDuplicate ? 'Criar Cópia' : 'Salvar'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewNotaryModal;