-- Seed data for local development.
-- Admin credentials: admin@bwow.com.au / password123

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
  'admin@bwow.com.au',
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
  'admin@bwow.com.au',
  'email',
  '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@bwow.com.au"}',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Ensure the admin profile exists with role='admin' regardless of trigger ordering
INSERT INTO public.users (id, name, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name;
