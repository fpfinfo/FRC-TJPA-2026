import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuthPageProps {
  onLogin: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        if (password !== confirmPassword) {
          throw new Error("As senhas não coincidem.");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu email ou faça login se o auto-confirm estiver ativado.');
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      let msg = error.message || 'Ocorreu um erro na autenticação.';
      
      // Tradução de erros comuns do Supabase
      if (msg.includes('User already registered')) {
        msg = 'Este e-mail já está cadastrado. Por favor, faça login.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'E-mail ou senha incorretos.';
      }

      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg(null);
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-judiciary-slate flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor - Abstract Geometry */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>

      <div className="bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-4xl flex overflow-hidden z-10 animate-in zoom-in-95 duration-700 rounded-none border-t-8 border-amber-500">
        
        {/* Left Side - Visual */}
        <div className="hidden md:flex w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden border-r border-slate-800">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-900 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
               <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png" 
                alt="Brasão TJPA" 
                className="w-14 h-auto object-contain drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
              <div className="h-10 w-px bg-amber-500/50"></div>
              <div>
                <span className="font-black text-2xl tracking-tighter uppercase block leading-none">FRC TJPA</span>
                <span className="text-[10px] text-amber-500 font-bold tracking-[0.3em] uppercase">Gestão FRC 2026</span>
              </div>
            </div>
            
            <h2 className="text-4xl font-black mb-6 leading-none uppercase tracking-tighter italic">
              Conformidade Civil <br/>
              e Fiscal Digital
            </h2>
            
            <div className="space-y-6">
                <div className="flex gap-4 items-start group">
                    <div className="p-2 bg-slate-800 border-l-2 border-amber-500 mt-1">
                        <Shield size={16} className="text-amber-500" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-amber-500">Acesso Restrito</h4>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">Ambiente monitorado e protegido por criptografia de nível governamental.</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="p-2 bg-slate-800 border-l-2 border-slate-500 mt-1">
                        <Loader2 size={16} className="text-slate-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-slate-300">Tempo Real</h4>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">Sincronização imediata com os sistemas da Corregedoria e SEFIN.</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="relative z-10 text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-between border-t border-slate-800 pt-6">
            <span>Tribunal de Justiça do Pará</span>
            <span>2026</span>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 bg-white flex flex-col justify-center">
          <div className="w-full">
            
            <div className="md:hidden flex justify-center mb-10">
               <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png" 
                alt="Brasão TJPA" 
                className="w-16 h-auto object-contain"
              />
            </div>

            <div className="mb-10">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                {isLogin ? 'Autenticação' : 'Credencial'}
              </h3>
              <p className="text-amber-600 text-xs font-black uppercase tracking-widest mt-2">
                {isLogin 
                  ? 'Acesso ao Painel FRC' 
                  : 'Solicitação de Acesso'}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700 text-xs font-bold uppercase animate-in shake-1">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-1 group animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={16} />
                    <input 
                      type="text" 
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="SEU NOME COMPLETO"
                      className="w-full pl-10 pr-4 py-3 border-b-2 border-slate-100 focus:border-amber-500 outline-none transition-all text-sm font-bold placeholder:text-slate-200 uppercase tracking-tight"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">E-mail Institucional</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={16} />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="EXEMPLO@TJPA.JUS.BR"
                    className="w-full pl-10 pr-4 py-3 border-b-2 border-slate-100 focus:border-amber-500 outline-none transition-all text-sm font-bold placeholder:text-slate-200 uppercase tracking-tight"
                  />
                </div>
              </div>

              <div className="space-y-1 group">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">Senha de Acesso</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={16} />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border-b-2 border-slate-100 focus:border-amber-500 outline-none transition-all text-sm font-bold placeholder:text-slate-200 uppercase tracking-tight"
                  />
                </div>
              </div>

              {!isLogin && (
                 <div className="space-y-1 group animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">Confirmar Senha</label>
                  <div className="relative">
                    <CheckCircle className="absolute left-3 top-3.5 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={16} />
                    <input 
                      type="password" 
                      required={!isLogin}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border-b-2 border-slate-100 focus:border-amber-500 outline-none transition-all text-sm font-bold placeholder:text-slate-200 uppercase tracking-tight"
                    />
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="text-right">
                    <a href="#" className="text-[10px] text-slate-400 hover:text-amber-600 font-black uppercase tracking-widest transition-colors">Recuperar Acesso?</a>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full btn-premium-gold flex items-center justify-center gap-3 mt-8 group"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin text-slate-900" />
                ) : (
                  <>
                    <span className="tracking-[0.2em]">{isLogin ? 'Entrar no Sistema' : 'Validar Cadastro'}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-10 border-t border-slate-50 text-center">
              <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest underline-offset-4 decoration-amber-500/30">
                {isLogin ? 'Ainda não possui acesso?' : 'Já possui credenciais?'}
                <button 
                  onClick={toggleMode}
                  className="ml-2 text-slate-900 hover:text-amber-500 transition-colors decoration-2"
                >
                  {isLogin ? 'Cadastre-se Aqui' : 'Voltar ao Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
