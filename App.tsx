import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, FileText, Settings, LogOut, Menu, User, Loader2, ShieldCheck } from 'lucide-react';
import Dashboard from './components/Dashboard';
import PaymentTable from './components/PaymentTable';
import CedulaCReport from './components/CedulaCReport';
import NotarySettings from './components/NotarySettings';
import AuthPage from './components/AuthPage';
import UserProfileModal from './components/UserProfileModal'; 
import { Notary, Payment, UserProfile } from './types';
import { MOCK_PAYMENTS, MOCK_NOTARIES } from './constants';
import { supabase } from './supabaseClient';
import { ToastProvider, useToast } from './components/ui/ToastContext';

// Inner App Component to use Toast Hook
const InnerApp = () => {
  const { addToast } = useToast();
  
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [currentView, setCurrentView] = useState<'dashboard' | 'payments' | 'cedulac' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Data State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notaries, setNotaries] = useState<Notary[]>([]);

  const isAdmin = userProfile?.role === 'admin';

  // Initialize Auth & Data
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('Error checking session:', error);
      setSession(session);
      setIsLoadingAuth(false);
      if (session) {
        fetchUserProfile(session.user.id);
      }
    }).catch(err => {
      console.error('Unexpected auth error:', err);
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setUserProfile(data as UserProfile);
        fetchData();
      } else if (!error) {
         fetchData();
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      fetchData();
    }
  };

  const loadMockData = () => {
    setPayments(MOCK_PAYMENTS);
    setNotaries(MOCK_NOTARIES);
  };

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const { data: notariesData, error: notaryError } = await supabase
        .from('notaries')
        .select('*')
        .order('name', { ascending: true });
      
      if (notaryError) throw notaryError;

      const mappedNotaries: Notary[] = (notariesData || []).map((n: any) => ({
        id: n.id,
        name: n.name,
        code: n.code,
        ensCode: n.ens_code,
        responsibleName: n.responsible_name,
        responsibleCpf: n.responsible_cpf,
        comarca: n.comarca,
        status: n.status,
        address: n.address,
        city: n.city,
        state: n.state,
        cep: n.cep,
        phone: n.phone,
        email: n.email,
        latitude: n.latitude, 
        longitude: n.longitude,
        vinculoPadrao: n.vinculo_padrao,
        dataVinculo: n.data_vinculo
      }));
      setNotaries(mappedNotaries);

      const { data: paymentsData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false });

      if (paymentError) throw paymentError;

      const mappedPayments: Payment[] = (paymentsData || []).map((p: any) => ({
        id: p.id,
        notaryId: p.notary_id,
        notaryName: p.notary_name,
        code: p.code,
        responsibleName: p.responsible_name,
        cpf: p.cpf,
        date: p.date,
        monthReference: p.month_reference,
        yearReference: p.year_reference,
        comarca: p.comarca,
        grossValue: p.gross_value,
        irrfValue: p.irrf_value,
        netValue: p.net_value,
        historyType: p.history_type,
        status: p.status,
        pendingReason: p.pending_reason
      }));
      setPayments(mappedPayments);

    } catch (error) {
      console.error("Error fetching data:", error);
      // Silent fallback to mocks only if completely empty to avoid broken UI
      if (notaries.length === 0) loadMockData();
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAddPayment = async (newPayment: Payment) => {
    try {
      // Optimistic update
      setPayments([newPayment, ...payments]);
      const dbPayment = {
        notary_id: newPayment.notaryId,
        notary_name: newPayment.notaryName,
        code: newPayment.code,
        responsible_name: newPayment.responsibleName,
        cpf: newPayment.cpf,
        date: newPayment.date,
        month_reference: newPayment.monthReference,
        year_reference: newPayment.yearReference,
        comarca: newPayment.comarca,
        gross_value: newPayment.grossValue,
        irrf_value: newPayment.irrfValue,
         net_value: newPayment.netValue,
        history_type: newPayment.historyType,
        status: newPayment.status,
        ne_empenho: newPayment.ne_empenho,
        dl_liquidacao: newPayment.dl_liquidacao,
        ob_ordem_bancaria: newPayment.ob_ordem_bancaria
      };

      const { data, error } = await supabase.from('payments').insert(dbPayment).select().single();
      if (error) throw error;
      
      if (data) {
        setPayments(prev => prev.map(p => p.id === newPayment.id ? { ...p, id: data.id } : p));
      }
      addToast('Pagamento registrado com sucesso!', 'success');
    } catch (error) {
      console.error("Error saving payment:", error);
      addToast('Erro ao salvar pagamento.', 'error');
      fetchData(); // Revert
    }
  };

  const handleUpdatePaymentStatus = async (id: string, status: Payment['status'], reason?: string) => {
    try {
      // Optimistic Update
      setPayments(prev => prev.map(p => 
        p.id === id ? { ...p, status: status, pendingReason: reason } : p
      ));

      const updatePayload: any = { status };
      updatePayload.pending_reason = status === 'PENDENTE' ? reason : null;

      const { error } = await supabase
        .from('payments')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;
      
      addToast('Status atualizado com sucesso!', 'success');
    } catch (error) {
      console.error("Error updating status:", error);
      addToast('Erro ao atualizar status.', 'error');
      fetchData(); // Revert
    }
  };

  const handleAddNotary = async (newNotary: Notary) => {
    try {
      setNotaries([...notaries, newNotary]);
      const dbNotary = {
        name: newNotary.name,
        code: newNotary.code,
        ens_code: newNotary.ensCode,
        responsible_name: newNotary.responsibleName,
        responsible_cpf: newNotary.responsibleCpf,
        comarca: newNotary.comarca,
        status: newNotary.status,
        address: newNotary.address,
        city: newNotary.city,
        state: newNotary.state,
        cep: newNotary.cep,
        phone: newNotary.phone,
        email: newNotary.email,
        latitude: newNotary.latitude,
        longitude: newNotary.longitude,
        vinculo_padrao: newNotary.vinculoPadrao,
        data_vinculo: newNotary.dataVinculo
      };

      const { data, error } = await supabase.from('notaries').insert(dbNotary).select().single();
      if (error) throw error;

      if (data) {
        setNotaries(prev => prev.map(n => n.id === newNotary.id ? { ...n, id: data.id } : n));
      }
      addToast('Cartório cadastrado com sucesso!', 'success');
    } catch (error) {
       console.error("Error saving notary:", error);
       addToast('Erro ao cadastrar cartório.', 'error');
       fetchData(); // Revert on error
    }
  };

  const handleUpdateNotary = async (updatedNotary: Notary) => {
    try {
      setNotaries(prev => prev.map(n => n.id === updatedNotary.id ? updatedNotary : n));
      const dbNotary = {
        name: updatedNotary.name,
        code: updatedNotary.code,
        ens_code: updatedNotary.ensCode,
        responsible_name: updatedNotary.responsibleName,
        responsible_cpf: updatedNotary.responsibleCpf,
        comarca: updatedNotary.comarca,
        status: updatedNotary.status,
        address: updatedNotary.address,
        city: updatedNotary.city,
        state: updatedNotary.state,
        cep: updatedNotary.cep,
        phone: updatedNotary.phone,
        email: updatedNotary.email,
        latitude: updatedNotary.latitude,
        longitude: updatedNotary.longitude,
        vinculo_padrao: updatedNotary.vinculoPadrao,
        data_vinculo: updatedNotary.dataVinculo
      };

      const { error } = await supabase.from('notaries').update(dbNotary).eq('id', updatedNotary.id);
      if (error) throw error;
      addToast('Dados do cartório atualizados!', 'success');
    } catch (error) {
      console.error("Error updating notary:", error);
      addToast('Erro ao atualizar. Recarregue a página.', 'error');
      fetchData();
    }
  };

  const handleDeleteNotary = async (id: string) => {
    try {
      setNotaries(prev => prev.filter(n => n.id !== id));
      const { error } = await supabase.from('notaries').delete().eq('id', id);
      if (error) throw error;
      addToast('Cartório removido.', 'info');
    } catch (error) {
      console.error("Error deleting notary:", error);
      addToast('Erro ao excluir. Verifique vínculos.', 'error');
      fetchData();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('dashboard');
    setSession(null);
    setUserProfile(null);
    addToast('Sessão encerrada.', 'info');
  };

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-100">
        <Loader2 size={40} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage onLogin={() => {}} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        session={session}
        onProfileUpdate={() => fetchUserProfile(session.user.id)}
      />

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside 
        className={`
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'}
          bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl 
          fixed lg:relative inset-y-0 left-0 z-50 print:hidden overflow-hidden
        `}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-700 relative">
          <div className="flex items-center space-x-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png" 
                alt="Brasão TJPA" 
                className="w-10 h-10 object-contain drop-shadow-md"
                onError={(e) => {
                   (e.target as HTMLImageElement).style.display = 'none'; 
                }}
              />
            {isSidebarOpen && <span className="font-bold text-lg tracking-wide animate-in fade-in">TJPA-FRC</span>}
          </div>
        </div>

        <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto custom-scrollbar-dark">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} isOpen={isSidebarOpen || window.innerWidth < 1024} />
          <SidebarItem icon={<Wallet size={20} />} label="Pagamentos" active={currentView === 'payments'} onClick={() => { setCurrentView('payments'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} isOpen={isSidebarOpen || window.innerWidth < 1024} />
          <SidebarItem icon={<FileText size={20} />} label="Cédula C" active={currentView === 'cedulac'} onClick={() => { setCurrentView('cedulac'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} isOpen={isSidebarOpen || window.innerWidth < 1024} />
          
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-700">
               <SidebarItem icon={<Settings size={20} />} label="Configurações" active={currentView === 'settings'} onClick={() => { setCurrentView('settings'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} isOpen={isSidebarOpen || window.innerWidth < 1024} />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700 mt-auto">
          <button 
            onClick={() => { setIsProfileModalOpen(true); if(window.innerWidth < 1024) setIsSidebarOpen(false); }}
            className="flex items-center space-x-3 w-full hover:bg-slate-800 rounded-none p-2 transition text-left group"
          >
            <div className="w-10 h-10 min-w-[40px] rounded-none bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 group-hover:border-amber-500 transition-colors">
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-slate-500 group-hover:text-amber-500 transition-colors" />
              )}
            </div>
            {(isSidebarOpen || window.innerWidth < 1024) && (
              <div className="overflow-hidden animate-in slide-in-from-left-2">
                <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">
                   {userProfile?.full_name || session.user.user_metadata.full_name || 'Usuário'}
                </p>
                <div className="flex items-center gap-2">
                   <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-none uppercase tracking-widest ${isAdmin ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                      {isAdmin ? 'Auditador' : 'Serventia'}
                   </span>
                </div>
              </div>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
        <header className="h-16 bg-white border-b-2 border-amber-500/10 flex items-center justify-between px-6 shadow-sm z-10 print:hidden overflow-hidden">
          <div className="flex items-center flex-1 overflow-hidden">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all rounded-none shrink-0"
            >
              <Menu size={22} />
            </button>
            <div className="ml-3 sm:ml-5 overflow-hidden">
              <h1 className="text-sm sm:text-lg lg:text-xl font-black text-slate-900 tracking-tighter uppercase leading-none truncate outline-none">
                {currentView === 'dashboard' && 'Monitoramento Global'}
                {currentView === 'payments' && 'Conformidade de Atos'}
                {currentView === 'cedulac' && 'Cédula C Digital'}
                {currentView === 'settings' && 'Segurança & Parâmetros'}
              </h1>
              <p className="text-[8px] sm:text-[10px] text-amber-600 font-bold tracking-widest uppercase mt-0.5 truncate outline-none">TJPA | FRC 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 border-l-2 ${isLoadingData ? 'border-blue-500' : 'border-amber-500'} bg-slate-50 transition-all`}>
              <span className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest hidden md:inline-block">
                {isLoadingData ? 'Sincronizando' : 'Operacional'}
              </span>
              <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${isLoadingData ? 'bg-blue-500 animate-spin' : 'bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-pulse'}`}></div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center text-[10px] sm:text-xs font-black text-red-600 hover:text-red-700 hover:bg-red-50 px-2 sm:px-3 py-1 sm:py-1.5 transition uppercase tracking-widest"
            >
              <LogOut size={14} className="mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Sair</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 p-3 sm:p-6 print:p-0 print:bg-white print:overflow-visible custom-scrollbar">
          <div className={`mx-auto transition-all duration-300 print:max-w-none print:mx-0 ${isSidebarOpen ? 'max-w-[1600px]' : 'w-full'}`}>
            {currentView === 'dashboard' && <Dashboard payments={payments} notaries={notaries} />}
            {currentView === 'payments' && (
              <PaymentTable 
                payments={payments} 
                notaries={notaries} 
                onAddPayment={handleAddPayment} 
                onUpdatePaymentStatus={handleUpdatePaymentStatus}
              />
            )}
            {currentView === 'cedulac' && <CedulaCReport payments={payments} notaries={notaries} />}
            {currentView === 'settings' && isAdmin && (
              <NotarySettings 
                notaries={notaries} 
                onAddNotary={handleAddNotary} 
                onUpdateNotary={handleUpdateNotary}
                onDeleteNotary={handleDeleteNotary}
              />
            )}
            {currentView === 'settings' && !isAdmin && (
              <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
                 <ShieldCheck size={48} className="mb-4 text-amber-500" />
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Acesso Restrito</h3>
                 <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-2">Privilégios de Auditoria Necessários</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// Main Export wrapping the Context Provider
export default function App() {
  return (
    <ToastProvider>
      <InnerApp />
    </ToastProvider>
  );
}

const SidebarItem = ({ icon, label, active, onClick, isOpen }: any) => (
  <button
    onClick={onClick}
     className={`w-full flex items-center px-3 py-2.5 rounded-none border-l-4 transition-all duration-200 group relative
      ${active 
        ? 'bg-slate-800 border-amber-500 text-amber-500 shadow-sm' 
        : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
  >
    <span className={`${active ? 'text-amber-500' : 'text-slate-500 group-hover:text-white'}`}>
      {icon}
    </span>
    {isOpen && (
      <span className="ml-3 font-medium text-sm animate-in fade-in slide-in-from-left-2 duration-200">{label}</span>
    )}
    {!isOpen && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>
    )}
  </button>
);