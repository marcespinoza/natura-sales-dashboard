-- Seed sample Natura products
insert into public.products (name, description, price, category, points_value) values
  ('Perfume Luna', 'Fragancia floral con notas de jazmín y rosa', 4500.00, 'Perfumería', 45),
  ('Crema Hidratante Ekos', 'Crema corporal con manteca de cupuaçu', 2800.00, 'Cuidado Corporal', 28),
  ('Jabón Natura Tododia', 'Jabón líquido hidratante con fragancias naturales', 1200.00, 'Higiene', 12),
  ('Shampoo Plant', 'Shampoo para cabello normal con extractos vegetales', 1500.00, 'Cabello', 15),
  ('Desodorante Humor', 'Desodorante en spray protección 24h', 950.00, 'Higiene', 10),
  ('Aceite Corporal Ekos', 'Aceite nutritivo de maracuyá para piel sedosa', 3200.00, 'Cuidado Corporal', 32),
  ('Labial Una', 'Labial hidratante color rosa intenso', 1800.00, 'Maquillaje', 18),
  ('Colonia Infantil', 'Colonia suave y delicada para niños', 1100.00, 'Perfumería', 11),
  ('Crema Facial Chronos', 'Crema anti-edad con ácido hialurónico', 5200.00, 'Cuidado Facial', 52),
  ('Protector Solar Fotoequilibrio', 'Protector solar FPS 50 rostro y cuerpo', 3800.00, 'Cuidado Facial', 38),
  ('Máscara de Pestañas Una', 'Máscara voluminizadora color negro intenso', 2200.00, 'Maquillaje', 22),
  ('Perfume Essencial', 'Fragancia masculina con notas de madera', 4200.00, 'Perfumería', 42)
on conflict do nothing;
