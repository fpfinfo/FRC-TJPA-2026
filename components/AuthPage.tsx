import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
        // onLogin is handled by auth state listener
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
      setErrorMsg(error.message || 'Ocorreu um erro na autenticação.');
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-blue-900 z-0"></div>
      <div className="absolute top-40 left-0 w-full h-24 bg-gradient-to-b from-blue-900 to-slate-100 z-0 opacity-50"></div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex overflow-hidden z-10 animate-in zoom-in-95 duration-500">
        
        {/* Left Side - Visual */}
        <div className="hidden md:flex w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-900/80 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
               <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png" 
                alt="Brasão TJPA" 
                className="w-12 h-auto object-contain"
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
              <span className="font-bold text-xl tracking-wide">FRC-TJPA</span>
            </div>
            <h2 className="text-3xl font-bold mb-4 leading-tight">
              Gestão Financeira e <br/>
              Controle de Repasses
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              Sistema oficial do Fundo de Apoio ao Registro Civil do Tribunal de Justiça do Estado do Pará.
            </p>
          </div>

          <div className="relative z-10 text-xs text-slate-400">
            © {new Date().getFullYear()} Tribunal de Justiça do Pará
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            
            <div className="md:hidden flex justify-center mb-8">
               <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png" 
                alt="Brasão TJPA" 
                className="w-16 h-auto object-contain"
              />
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-800">
                {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
              </h3>
              <p className="text-slate-500 text-sm mt-2">
                {isLogin 
                  ? 'Insira suas credenciais para acessar o painel.' 
                  : 'Preencha os dados abaixo para solicitar acesso.'}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@tjpa.jus.br"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Senha</label>
                  {isLogin && <a href="#" className="text-xs text-blue-600 hover:text-blue-800 font-medium">Esqueceu a senha?</a>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-sm"
                  />
                </div>
              </div>

              {!isLogin && (
                 <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Confirmar Senha</label>
                  <div className="relative">
                    <CheckCircle className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      required={!isLogin}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Entrar no Sistema' : 'Criar Conta'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm">
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                <button 
                  onClick={toggleMode}
                  className="ml-2 text-blue-600 font-bold hover:underline focus:outline-none"
                >
                  {isLogin ? 'Cadastre-se' : 'Faça Login'}
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