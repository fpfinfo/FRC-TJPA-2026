-- Adicionar coluna para armazenar o motivo da pendência
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS pending_reason text;

-- Opcional: Atualizar status antigos para o novo padrão se necessário
-- UPDATE public.payments SET status = 'EM ANDAMENTO' WHERE status = 'PROCESSANDO';
