import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Save, Loader2, User, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onProfileUpdate: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, session, onProfileUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && session) {
      setErrorMsg(null);
      getProfile();
    }
  }, [isOpen, session]);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { user } = session;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url);
      } else {
        // Fallback to metadata if profile doesn't exist yet
        setFullName(user.user_metadata.full_name || '');
      }
    } catch (error: any) {
      console.error('Error loading user data!', error);
      setErrorMsg('Falha ao carregar dados do perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const { user } = session;

      // 1. Update Database Profile
      const updates = {
        id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
        email: user.email // Ensure email is synced
      };

      // Using upsert to handle both insert (if missing) and update
      const { error: dbError } = await supabase.from('profiles').upsert(updates);

      if (dbError) {
        console.error('Database Error:', dbError);
        throw new Error(`Erro ao salvar no banco: ${dbError.message}`);
      }
      
      // 2. Update Auth Metadata (optional but good for sync)
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (authError) {
        console.warn('Auth Metadata Update Warning:', authError);
      }

      onProfileUpdate(); // Notify parent to refresh
      onClose();
    } catch (error: any) {
      setErrorMsg(error.message || 'Erro desconhecido ao atualizar perfil.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setErrorMsg(null);
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Generate a unique path every time to avoid cache issues
      const timestamp = Date.now();
      const fileName = `${session.user.id}-${timestamp}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Upload Error Details:', uploadError);
        throw new Error(`Erro no upload da imagem: ${uploadError.message}`);
      }

      // Get Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      if (!data || !data.publicUrl) {
         throw new Error('Não foi possível gerar a URL pública da imagem.');
      }

      setAvatarUrl(data.publicUrl);

    } catch (error: any) {
      setErrorMsg(error.message);
      console.error('Avatar upload failed:', error);
    } finally {
      setUploading(false);
      // Reset input value to allow selecting the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h3 className="text-xl font-bold text-slate-800">Meu Perfil</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 rounded-full hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full border-4 border-slate-100 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                    key={avatarUrl} // Force re-render on url change
                  />
                ) : (
                  <User size={48} className="text-slate-400" />
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <Loader2 size={32} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition ring-2 ring-white z-20"
                title="Alterar foto"
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                hidden 
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
              />
            </div>
            <p className="text-xs text-slate-500">Clique no ícone da câmera para alterar sua foto.</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input 
                type="text" 
                value={session?.user?.email}
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-500 cursor-not-allowed text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Nome Completo</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-700 font-medium hover:bg-white border border-transparent hover:border-slate-300 hover:shadow-sm rounded-md transition"
          >
            Cancelar
          </button>
          <button 
            onClick={updateProfile}
            disabled={loading || uploading}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 shadow-sm transition flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Alterações
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserProfileModal;