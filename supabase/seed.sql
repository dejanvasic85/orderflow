-- Seed data for local development.
-- Admin credentials: admin@bww.com.au / password123

INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@bww.com.au',
  crypt('password123', gen_salt('bf')),
  now(),
  '', '', '', '',
  now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin"}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  created_at, updated_at, last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'admin@bww.com.au',
  'email',
  '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@bww.com.au"}',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;
