-- 1. Limpar dados de 2025 existentes para evitar duplicidade antes de inserir
DELETE FROM public.irrf_brackets WHERE year = 2025;

-- 2. Inserir Faixas de 2025 (Baseadas na Tabela Progressiva Mensal Vigente)
INSERT INTO public.irrf_brackets (year, min_value, max_value, rate, deduction) VALUES
(2025, 0.00, 2259.20, 0.000, 0.00),
(2025, 2259.21, 2826.65, 0.075, 169.44),
(2025, 2826.66, 3751.05, 0.150, 381.44),
(2025, 3751.06, 4664.68, 0.225, 662.77),
(2025, 4664.69, NULL, 0.275, 896.00);

-- Exemplo: Se quiser já deixar preparado 2026 (cópia de 2025 ou novos valores)
-- DELETE FROM public.irrf_brackets WHERE year = 2026;
-- INSERT INTO public.irrf_brackets (year, min_value, max_value, rate, deduction) VALUES ...
