import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertOctagon, Clock, Save } from 'lucide-react';
import { Payment } from '../types';

interface StatusAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentId: string, status: Payment['status'], reason?: string) => void;
  payment: Payment | null;
}

const StatusAuditModal: React.FC<StatusAuditModalProps> = ({ isOpen, onClose, onSave, payment }) => {
  const [selectedStatus, setSelectedStatus] = useState<Payment['status']>('EM ANDAMENTO');
  const [reason, setReason] = useState('');
  
  useEffect(() => {
    if (isOpen && payment) {
      setSelectedStatus(payment.status);
      setReason(payment.pendingReason || '');
    }
  }, [isOpen, payment]);

  if (!isOpen || !payment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus === 'PENDENTE' && !reason.trim()) {
      alert('Por favor, informe o motivo da pendência.');
      return;
    }
    onSave(payment.id, selectedStatus, selectedStatus === 'PENDENTE' ? reason : undefined);
    onClose();
  };

  const statusOptions: { value: Payment['status'], label: string, icon: any, color: string, desc: string }[] = [
    { 
      value: 'EM ANDAMENTO', 
      label: 'Em Andamento', 
      icon: Clock, 
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      desc: 'Fase 1: O pagamento foi registrado e aguarda análise.'
    },
    { 
      value: 'PENDENTE', 
      label: 'Pendente (Inconsistência)', 
      icon: AlertOctagon, 
      color: 'text-red-600 bg-red-50 border-red-200',
      desc: 'Fase 2: Identificada inconsistência. Requer ajuste.'
    },
    { 
      value: 'PAGO', 
      label: 'Pago (Concluído)', 
      icon: CheckCircle2, 
      color: 'text-green-600 bg-green-50 border-green-200',
      desc: 'Fase 3: Auditoria concluída. Dados validados.'
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95">
        
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <div>
             <h3 className="text-lg font-bold text-slate-800">Auditoria de Pagamento</h3>
             <p className="text-xs text-slate-500">Ref: {payment.monthReference}/{payment.yearReference} - {payment.responsibleName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 bg-slate-50 flex-1 overflow-y-auto">
           <p className="text-sm font-semibold text-slate-700 mb-3">Selecione o novo status:</p>
           
           <div className="space-y-3">
             {statusOptions.map((option) => {
               const Icon = option.icon;
               const isSelected = selectedStatus === option.value;
               return (
                 <label 
                   key={option.value}
                   className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                     isSelected ? `ring-2 ring-offset-1 ring-blue-500 ${option.color}` : 'bg-white border-slate-200 hover:border-slate-300'
                   }`}
                 >
                   <input 
                     type="radio" 
                     name="status" 
                     value={option.value} 
                     checked={isSelected}
                     onChange={() => setSelectedStatus(option.value)}
                     className="mt-1"
                   />
                   <div>
                     <div className="flex items-center gap-2 font-bold">
                        <Icon size={16} />
                        {option.label}
                     </div>
                     <p className="text-xs text-slate-500 mt-1">{option.desc}</p>
                   </div>
                 </label>
               );
             })}
           </div>

           {selectedStatus === 'PENDENTE' && (
             <div className="mt-4 animate-in slide-in-from-top-2">
               <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo da Pendência <span className="text-red-500">*</span></label>
               <textarea 
                 required
                 value={reason}
                 onChange={(e) => setReason(e.target.value)}
                 className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 outline-none text-sm min-h-[80px] bg-white text-slate-900 placeholder:text-slate-400"
                 placeholder="Descreva a inconsistência encontrada..."
               />
             </div>
           )}
        </form>

        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-md transition border border-slate-200"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 shadow-sm transition flex items-center gap-2"
          >
            <Save size={18} />
            Atualizar Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusAuditModal;