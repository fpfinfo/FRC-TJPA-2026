-- Atualiza o perfil do usuário para ADMIN
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'fabio.freitas@tjpa.jus.br';

-- Confirmação (Opcional - para visualizar o resultado)
-- SELECT email, role FROM public.profiles WHERE email = 'fabio.freitas@tjpa.jus.br';