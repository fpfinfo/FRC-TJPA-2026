import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, MapPin, Settings2, Table, Users, Copy } from 'lucide-react';
import { Notary } from '../types';
import NewNotaryModal from './NewNotaryModal';
import IrrfSettings from './IrrfSettings';
import ProfileAccessManager from './ProfileAccessManager';

interface NotarySettingsProps {
  notaries: Notary[];
  onAddNotary: (notary: Notary) => void;
  onUpdateNotary: (notary: Notary) => void;
  onDeleteNotary: (id: string) => void;
}

const NotarySettings: React.FC<NotarySettingsProps> = ({ notaries, onAddNotary, onUpdateNotary, onDeleteNotary }) => {
  const [activeTab, setActiveTab] = useState<'notaries' | 'irrf' | 'rbac'>('notaries');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for Edit/Duplicate
  const [notaryToEdit, setNotaryToEdit] = useState<Notary | undefined>(undefined);
  const [notaryToDuplicate, setNotaryToDuplicate] = useState<Notary | undefined>(undefined);
  
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotaries = notaries.filter(n => 
    n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.comarca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.responsibleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (notary: Notary) => {
    setNotaryToEdit(notary);
    setNotaryToDuplicate(undefined);
    setIsModalOpen(true);
  };

  const handleDuplicateClick = (notary: Notary) => {
    setNotaryToDuplicate(notary);
    setNotaryToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cartório? Essa ação não pode ser desfeita e pode afetar o histórico de pagamentos.")) {
      onDeleteNotary(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNotaryToEdit(undefined);
    setNotaryToDuplicate(undefined);
  };

  const handleSaveModal = (notary: Notary) => {
    if (notaryToEdit) {
      onUpdateNotary(notary);
    } else {
      // Handles both New and Duplicate (since Duplicate creates a new ID)
      onAddNotary(notary);
    }
  };

  return (
    <div className="space-y-6">
      <NewNotaryModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveModal}
        notaryToEdit={notaryToEdit}
        notaryToDuplicate={notaryToDuplicate}
      />

      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">Configurações do Sistema</h2>
        <p className="text-slate-500">Gerencie cadastros, tabelas de impostos e permissões de usuários.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-12">
          <button
            onClick={() => setActiveTab('notaries')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-4 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all
              ${activeTab === 'notaries'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'}
            `}
          >
            <Settings2 size={16} />
            Configuração de Bases
          </button>
          <button
            onClick={() => setActiveTab('irrf')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-4 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all
              ${activeTab === 'irrf'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'}
            `}
          >
            <Table size={16} />
            Tabela Progressiva IRRF
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-4 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all
              ${activeTab === 'rbac'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'}
            `}
          >
            <Users size={16} />
            Privilégios & Acessos
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="pt-2">
        {activeTab === 'notaries' && (
          /* Notary List Content */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-end">
                <button 
                  onClick={() => { setNotaryToEdit(undefined); setNotaryToDuplicate(undefined); setIsModalOpen(true); }}
                  className="btn-premium-gold flex items-center gap-2"
                >
                  <Plus size={16} />
                  Cadastrar Base
                </button>
             </div>

            <div className="bg-white border-l-4 border-amber-500 shadow-sm">
              {/* Filter Bar */}
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 bg-slate-50/50 group">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-3 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={16} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="FILTRAR POR NOME, COMARCA OU RESPONSÁVEL..." 
                      className="w-full pl-10 pr-4 py-2.5 border-b-2 border-slate-200 focus:border-amber-500 outline-none text-[10px] font-black placeholder:text-slate-300 uppercase tracking-tight transition-all"
                    />
                </div>
                <div className="text-[10px] text-amber-600 font-black uppercase tracking-widest bg-white px-4 py-2 border border-slate-100 shadow-sm w-fit self-start md:self-auto">
                    {filteredNotaries.length} Serventias
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-slate-100">
                {filteredNotaries.length > 0 ? (
                  filteredNotaries.map((notary) => (
                    <div key={notary.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                         <div className="flex items-start justify-between mb-1">
                          <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter text-base">
                            <Building2 size={18} className="text-amber-500" />
                            {notary.name}
                          </h3>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-none uppercase tracking-widest border ${
                            notary.status === 'ATIVO' 
                              ? 'bg-amber-100 text-amber-800 border-amber-200' 
                              : 'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                            {notary.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-600 mt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-500">Cód:</span> {notary.code}
                            <span className="mx-1 text-slate-300">|</span>
                            <span className="font-medium text-slate-500">CNS:</span> {notary.ensCode || '-'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-slate-400" />
                            {notary.comarca} {notary.state ? `- ${notary.state}` : ''}
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-medium text-slate-500">Resp:</span> {notary.responsibleName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 md:border-l md:border-slate-100 md:pl-5">
                        <button 
                          onClick={() => handleDuplicateClick(notary)}
                          className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all" 
                          title="Duplicar"
                        >
                          <Copy size={16} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(notary)}
                          className="p-2.5 text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all font-bold" 
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(notary.id)}
                          className="p-2.5 text-slate-300 hover:text-red-600 transition-all" 
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-500">
                    <Building2 size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Nenhum cartório encontrado.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'irrf' && <IrrfSettings />}
        
        {activeTab === 'rbac' && <ProfileAccessManager />}
      </div>
    </div>
  );
};

export default NotarySettings;