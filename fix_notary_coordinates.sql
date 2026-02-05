-- Adicionar colunas de geolocalização à tabela notaries
ALTER TABLE public.notaries 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Garantir que a política de atualização permita alterar essas colunas
-- (As políticas existentes "for all" ou "for update" já devem cobrir, 
-- mas isso garante que a estrutura esteja correta).
