import React, { useState, useEffect } from 'react';
import { User, Shield, Search, Lock, Check, X, Building2, Save, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Notary } from '../types';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  avatar_url: string | null;
}

const ProfileAccessManager: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [notaries, setNotaries] = useState<Notary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for Manage Access Modal
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [userAccessList, setUserAccessList] = useState<string[]>([]); // IDs of notaries the user has access to
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (profilesError) throw profilesError;

      // 2. Fetch Notaries (for the access modal)
      const { data: notariesData, error: notariesError } = await supabase
        .from('notaries')
        .select('*')
        .order('name');
        
      if (notariesError) throw notariesError;

      setProfiles(profilesData || []);
      
      // Map notaries to match type
      const mappedNotaries = (notariesData || []).map((n: any) => ({
        id: n.id,
        name: n.name,
        code: n.code,
        ensCode: n.ens_code,
        responsibleName: n.responsible_name,
        responsibleCpf: n.responsible_cpf,
        comarca: n.comarca,
        status: n.status,
        address: n.address
      }));
      setNotaries(mappedNotaries);

    } catch (error) {
      console.error('Error fetching RBAC data:', error);
      alert('Erro ao carregar perfis.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (profileId: string, newRole: 'admin' | 'user') => {
    const originalProfiles = [...profiles];
    
    // Optimistic Update
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) {
        throw error;
      }
      
      // Success feedback (optional, usually silent is fine for toggles)
    } catch (error: any) {
      console.error('Error updating role:', error);
      // Revert optimistic update
      setProfiles(originalProfiles);
      alert(`Erro ao atualizar permissão: ${error.message || 'Verifique se você é administrador.'}`);
    }
  };

  const openAccessModal = async (profile: Profile) => {
    setSelectedProfile(profile);
    setSavingAccess(true); // Show loading while fetching current access
    setIsAccessModalOpen(true);
    setUserAccessList([]);

    try {
      const { data, error } = await supabase
        .from('notary_access')
        .select('notary_id')
        .eq('user_id', profile.id);

      if (error) throw error;

      if (data) {
        setUserAccessList(data.map((row: any) => row.notary_id));
      }
    } catch (error) {
      console.error('Error fetching access:', error);
    } finally {
      setSavingAccess(false);
    }
  };

  const toggleNotaryAccess = (notaryId: string) => {
    setUserAccessList(prev => {
      if (prev.includes(notaryId)) {
        return prev.filter(id => id !== notaryId);
      } else {
        return [...prev, notaryId];
      }
    });
  };

  const saveAccessChanges = async () => {
    if (!selectedProfile) return;
    setSavingAccess(true);

    try {
      // 1. Delete all existing access for this user
      const { error: deleteError } = await supabase
        .from('notary_access')
        .delete()
        .eq('user_id', selectedProfile.id);
      
      if (deleteError) throw deleteError;

      // 2. Insert new access list
      if (userAccessList.length > 0) {
        const rowsToInsert = userAccessList.map(nid => ({
          user_id: selectedProfile.id,
          notary_id: nid
        }));

        const { error: insertError } = await supabase
          .from('notary_access')
          .insert(rowsToInsert);
        
        if (insertError) throw insertError;
      }

      setIsAccessModalOpen(false);
      alert('Permissões de acesso atualizadas com sucesso!');
    } catch (error) {
      console.error('Error saving access:', error);
      alert('Erro ao salvar acessos.');
    } finally {
      setSavingAccess(false);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    (p.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3">
        <Shield className="text-indigo-600 mt-1" size={24} />
        <div>
          <h3 className="text-indigo-900 font-semibold text-sm">Controle de Acesso Baseado em Função (RBAC)</h3>
          <p className="text-slate-600 text-xs mt-1">
            Defina quem administra o sistema e quem opera como cartorário.
            <br/>
            <span className="font-semibold">Admin:</span> Acesso total. 
            <span className="font-semibold ml-2">User:</span> Acesso restrito aos cartórios vinculados.
          </p>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200">
           <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar usuário por nome ou email..." 
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              />
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Usuário</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Papel (Role)</th>
                <th className="px-6 py-3 font-medium">Escopo de Dados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <div className="flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
                  </td>
                </tr>
              ) : filteredProfiles.length > 0 ? (
                filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                           {profile.avatar_url ? (
                             <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                           ) : (
                             <User size={16} className="text-slate-500" />
                           )}
                        </div>
                        <span className="font-medium text-slate-900">{profile.full_name || 'Sem nome'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{profile.email}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                         <button
                           onClick={() => handleRoleChange(profile.id, 'user')}
                           className={`px-3 py-1 rounded-l-md text-xs font-bold border transition-colors ${
                             profile.role === 'user' 
                               ? 'bg-slate-700 text-white border-slate-700' 
                               : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                           }`}
                         >
                           USER
                         </button>
                         <button
                           onClick={() => handleRoleChange(profile.id, 'admin')}
                           className={`px-3 py-1 rounded-r-md -ml-2 text-xs font-bold border transition-colors ${
                             profile.role === 'admin' 
                               ? 'bg-blue-600 text-white border-blue-600' 
                               : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                           }`}
                         >
                           ADMIN
                         </button>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {profile.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                          <Lock size={12} /> Acesso Global
                        </span>
                      ) : (
                        <button 
                          onClick={() => openAccessModal(profile)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline flex items-center gap-1"
                        >
                          <Building2 size={14} />
                          Gerenciar Cartórios Vinculados
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                     Nenhum perfil encontrado.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Access Modal */}
      {isAccessModalOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <div>
                <h3 className="font-bold text-slate-800">Vincular Cartórios</h3>
                <p className="text-xs text-slate-500">Usuário: {selectedProfile.full_name}</p>
              </div>
              <button onClick={() => setIsAccessModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto bg-white">
               {savingAccess && !notaries.length ? (
                 <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
               ) : (
                 <div className="space-y-2">
                   {notaries.length > 0 ? (
                     notaries.map(notary => {
                       const hasAccess = userAccessList.includes(notary.id);
                       return (
                         <div 
                           key={notary.id}
                           onClick={() => toggleNotaryAccess(notary.id)}
                           className={`p-3 rounded border cursor-pointer flex items-center justify-between transition ${
                             hasAccess ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'
                           }`}
                         >
                           <div className="flex items-center gap-3">
                             <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                               hasAccess ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                             }`}>
                               {hasAccess && <Check size={14} className="text-white" />}
                             </div>
                             <div>
                               <p className="font-medium text-sm text-slate-800">{notary.name}</p>
                               <p className="text-xs text-slate-500">{notary.comarca} • Resp: {notary.responsibleName}</p>
                             </div>
                           </div>
                         </div>
                       );
                     })
                   ) : (
                     <p className="text-center text-slate-500 py-4">Nenhum cartório cadastrado no sistema.</p>
                   )}
                 </div>
               )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg flex justify-between items-center">
              <span className="text-xs text-slate-500">{userAccessList.length} cartórios selecionados</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsAccessModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-white rounded border border-transparent hover:border-slate-300"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveAccessChanges}
                  disabled={savingAccess}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm flex items-center gap-2 disabled:opacity-70"
                >
                  {savingAccess ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Permissões
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileAccessManager;