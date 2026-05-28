-- =============================================
-- FASE DE GRUPOS - MUNDIAL 2026
-- 72 partidos (12 grupos × 6 partidos)
-- Pega esto en el SQL Editor de Supabase
-- =============================================

INSERT INTO public.matches (home_team, away_team, phase, group_name, match_date, status) VALUES

-- GRUPO A: México, Sudáfrica, Corea del Sur, República Checa
('México', 'Sudáfrica', 'groups', 'A', '2026-06-11 17:00:00-05', 'pending'),
('Corea del Sur', 'República Checa', 'groups', 'A', '2026-06-11 20:00:00-05', 'pending'),
('México', 'Corea del Sur', 'groups', 'A', '2026-06-15 17:00:00-05', 'pending'),
('Sudáfrica', 'República Checa', 'groups', 'A', '2026-06-15 20:00:00-05', 'pending'),
('México', 'República Checa', 'groups', 'A', '2026-06-26 17:00:00-05', 'pending'),
('Sudáfrica', 'Corea del Sur', 'groups', 'A', '2026-06-26 17:00:00-05', 'pending'),

-- GRUPO B: Canadá, Bosnia y Herzegovina, Catar, Suiza
('Canadá', 'Bosnia y Herzegovina', 'groups', 'B', '2026-06-12 14:00:00-05', 'pending'),
('Catar', 'Suiza', 'groups', 'B', '2026-06-12 17:00:00-05', 'pending'),
('Canadá', 'Catar', 'groups', 'B', '2026-06-16 14:00:00-05', 'pending'),
('Bosnia y Herzegovina', 'Suiza', 'groups', 'B', '2026-06-16 17:00:00-05', 'pending'),
('Canadá', 'Suiza', 'groups', 'B', '2026-06-27 14:00:00-05', 'pending'),
('Bosnia y Herzegovina', 'Catar', 'groups', 'B', '2026-06-27 14:00:00-05', 'pending'),

-- GRUPO C: Brasil, Marruecos, Haití, Escocia
('Brasil', 'Marruecos', 'groups', 'C', '2026-06-12 20:00:00-05', 'pending'),
('Haití', 'Escocia', 'groups', 'C', '2026-06-12 23:00:00-05', 'pending'),
('Brasil', 'Haití', 'groups', 'C', '2026-06-17 17:00:00-05', 'pending'),
('Marruecos', 'Escocia', 'groups', 'C', '2026-06-17 20:00:00-05', 'pending'),
('Brasil', 'Escocia', 'groups', 'C', '2026-06-27 17:00:00-05', 'pending'),
('Marruecos', 'Haití', 'groups', 'C', '2026-06-27 17:00:00-05', 'pending'),

-- GRUPO D: Estados Unidos, Paraguay, Australia, Turquía
('Estados Unidos', 'Paraguay', 'groups', 'D', '2026-06-13 14:00:00-05', 'pending'),
('Australia', 'Turquía', 'groups', 'D', '2026-06-13 17:00:00-05', 'pending'),
('Estados Unidos', 'Australia', 'groups', 'D', '2026-06-18 17:00:00-05', 'pending'),
('Paraguay', 'Turquía', 'groups', 'D', '2026-06-18 20:00:00-05', 'pending'),
('Estados Unidos', 'Turquía', 'groups', 'D', '2026-06-28 14:00:00-05', 'pending'),
('Paraguay', 'Australia', 'groups', 'D', '2026-06-28 14:00:00-05', 'pending'),

-- GRUPO E: Alemania, Curazao, Costa de Marfil, Ecuador
('Alemania', 'Curazao', 'groups', 'E', '2026-06-13 20:00:00-05', 'pending'),
('Costa de Marfil', 'Ecuador', 'groups', 'E', '2026-06-13 23:00:00-05', 'pending'),
('Alemania', 'Costa de Marfil', 'groups', 'E', '2026-06-18 14:00:00-05', 'pending'),
('Curazao', 'Ecuador', 'groups', 'E', '2026-06-18 17:00:00-05', 'pending'),
('Alemania', 'Ecuador', 'groups', 'E', '2026-06-28 17:00:00-05', 'pending'),
('Curazao', 'Costa de Marfil', 'groups', 'E', '2026-06-28 17:00:00-05', 'pending'),

-- GRUPO F: Países Bajos, Japón, Suecia, Túnez
('Países Bajos', 'Japón', 'groups', 'F', '2026-06-14 14:00:00-05', 'pending'),
('Suecia', 'Túnez', 'groups', 'F', '2026-06-14 17:00:00-05', 'pending'),
('Países Bajos', 'Suecia', 'groups', 'F', '2026-06-19 17:00:00-05', 'pending'),
('Japón', 'Túnez', 'groups', 'F', '2026-06-19 20:00:00-05', 'pending'),
('Países Bajos', 'Túnez', 'groups', 'F', '2026-06-29 14:00:00-05', 'pending'),
('Japón', 'Suecia', 'groups', 'F', '2026-06-29 14:00:00-05', 'pending'),

-- GRUPO G: Bélgica, Egipto, Irán, Nueva Zelanda
('Bélgica', 'Egipto', 'groups', 'G', '2026-06-14 20:00:00-05', 'pending'),
('Irán', 'Nueva Zelanda', 'groups', 'G', '2026-06-14 23:00:00-05', 'pending'),
('Bélgica', 'Irán', 'groups', 'G', '2026-06-19 14:00:00-05', 'pending'),
('Egipto', 'Nueva Zelanda', 'groups', 'G', '2026-06-19 17:00:00-05', 'pending'),
('Bélgica', 'Nueva Zelanda', 'groups', 'G', '2026-06-29 17:00:00-05', 'pending'),
('Egipto', 'Irán', 'groups', 'G', '2026-06-29 17:00:00-05', 'pending'),

-- GRUPO H: España, Cabo Verde, Arabia Saudita, Uruguay
('España', 'Cabo Verde', 'groups', 'H', '2026-06-15 14:00:00-05', 'pending'),
('Arabia Saudita', 'Uruguay', 'groups', 'H', '2026-06-15 17:00:00-05', 'pending'),
('España', 'Arabia Saudita', 'groups', 'H', '2026-06-20 17:00:00-05', 'pending'),
('Cabo Verde', 'Uruguay', 'groups', 'H', '2026-06-20 20:00:00-05', 'pending'),
('España', 'Uruguay', 'groups', 'H', '2026-06-30 14:00:00-05', 'pending'),
('Cabo Verde', 'Arabia Saudita', 'groups', 'H', '2026-06-30 14:00:00-05', 'pending'),

-- GRUPO I: Francia, Senegal, Irak, Noruega
('Francia', 'Senegal', 'groups', 'I', '2026-06-15 20:00:00-05', 'pending'),
('Irak', 'Noruega', 'groups', 'I', '2026-06-15 23:00:00-05', 'pending'),
('Francia', 'Irak', 'groups', 'I', '2026-06-20 14:00:00-05', 'pending'),
('Senegal', 'Noruega', 'groups', 'I', '2026-06-20 17:00:00-05', 'pending'),
('Francia', 'Noruega', 'groups', 'I', '2026-06-30 17:00:00-05', 'pending'),
('Senegal', 'Irak', 'groups', 'I', '2026-06-30 17:00:00-05', 'pending'),

-- GRUPO J: Argentina, Argelia, Austria, Jordania
('Argentina', 'Argelia', 'groups', 'J', '2026-06-16 14:00:00-05', 'pending'),
('Austria', 'Jordania', 'groups', 'J', '2026-06-16 17:00:00-05', 'pending'),
('Argentina', 'Austria', 'groups', 'J', '2026-06-21 17:00:00-05', 'pending'),
('Argelia', 'Jordania', 'groups', 'J', '2026-06-21 20:00:00-05', 'pending'),
('Argentina', 'Jordania', 'groups', 'J', '2026-07-01 14:00:00-05', 'pending'),
('Argelia', 'Austria', 'groups', 'J', '2026-07-01 14:00:00-05', 'pending'),

-- GRUPO K: Portugal, RD Congo, Uzbekistán, Colombia
('Portugal', 'RD Congo', 'groups', 'K', '2026-06-16 20:00:00-05', 'pending'),
('Uzbekistán', 'Colombia', 'groups', 'K', '2026-06-16 23:00:00-05', 'pending'),
('Portugal', 'Uzbekistán', 'groups', 'K', '2026-06-21 14:00:00-05', 'pending'),
('RD Congo', 'Colombia', 'groups', 'K', '2026-06-21 17:00:00-05', 'pending'),
('Portugal', 'Colombia', 'groups', 'K', '2026-07-01 17:00:00-05', 'pending'),
('RD Congo', 'Uzbekistán', 'groups', 'K', '2026-07-01 17:00:00-05', 'pending'),

-- GRUPO L: Inglaterra, Croacia, Ghana, Panamá
('Inglaterra', 'Croacia', 'groups', 'L', '2026-06-17 14:00:00-05', 'pending'),
('Ghana', 'Panamá', 'groups', 'L', '2026-06-17 17:00:00-05', 'pending'),
('Inglaterra', 'Ghana', 'groups', 'L', '2026-06-22 17:00:00-05', 'pending'),
('Croacia', 'Panamá', 'groups', 'L', '2026-06-22 20:00:00-05', 'pending'),
('Inglaterra', 'Panamá', 'groups', 'L', '2026-07-02 14:00:00-05', 'pending'),
('Croacia', 'Ghana', 'groups', 'L', '2026-07-02 14:00:00-05', 'pending');
