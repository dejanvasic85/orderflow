-- Seed data for local development.
-- Admin credentials:      admin@bwow.com.au   / password123
-- Staff credentials:      sarah@bwow.com.au   / password123
--                         marcus@bwow.com.au  / password123
-- User credentials:       tom@bwow.com.au     / password123
--                         priya@bwow.com.au   / password123
--                         olivia@bwow.com.au  / password123

-- ============================================================
-- AUTH USERS
-- ============================================================

INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@bwow.com.au',
    crypt('password123', gen_salt('bf')),
    now(), '', '', '', '', now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Jane Doe"}'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'sarah@bwow.com.au',
    crypt('password123', gen_salt('bf')),
    now(), '', '', '', '', now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Sarah Mitchell"}'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'tom@bwow.com.au',
    crypt('password123', gen_salt('bf')),
    now(), '', '', '', '', now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Tom Reynolds"}'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'priya@bwow.com.au',
    crypt('password123', gen_salt('bf')),
    now(), '', '', '', '', now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Priya Nair"}'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'marcus@bwow.com.au',
    crypt('password123', gen_salt('bf')),
    now(), '', '', '', '', now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Marcus Bell"}'
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'olivia@bwow.com.au',
    crypt('password123', gen_salt('bf')),
    now(), '', '', '', '', now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Olivia Chen"}'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- AUTH IDENTITIES
-- ============================================================

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  created_at, updated_at, last_sign_in_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@bwow.com.au', 'email',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@bwow.com.au"}',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'sarah@bwow.com.au', 'email',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"sarah@bwow.com.au"}',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'tom@bwow.com.au', 'email',
    '{"sub":"00000000-0000-0000-0000-000000000003","email":"tom@bwow.com.au"}',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    'priya@bwow.com.au', 'email',
    '{"sub":"00000000-0000-0000-0000-000000000004","email":"priya@bwow.com.au"}',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000005',
    'marcus@bwow.com.au', 'email',
    '{"sub":"00000000-0000-0000-0000-000000000005","email":"marcus@bwow.com.au"}',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000006',
    'olivia@bwow.com.au', 'email',
    '{"sub":"00000000-0000-0000-0000-000000000006","email":"olivia@bwow.com.au"}',
    now(), now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- USER PROFILES
-- ============================================================

INSERT INTO public.users (id, name, role, notification_preferences) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Jane Doe', 'admin',
    '{"email": true, "sms": false}'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Sarah Mitchell', 'staff',
    '{"email": true, "sms": true}'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Tom Reynolds', 'user',
    '{"email": false, "sms": false}'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Priya Nair', 'user',
    '{"email": true, "sms": false}'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Marcus Bell', 'staff',
    '{"email": true, "sms": true}'
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'Olivia Chen', 'user',
    '{"email": false, "sms": false}'
  )
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  notification_preferences = EXCLUDED.notification_preferences;

-- ============================================================
-- ACCOUNTS
-- ============================================================

INSERT INTO public.accounts (id, name) VALUES
  ('00000000-0000-0000-0000-000000000a01', 'The Winery Bistro'),
  ('00000000-0000-0000-0000-000000000a02', 'Cellar Door Co.'),
  ('00000000-0000-0000-0000-000000000a03', 'Harvest Table'),
  ('00000000-0000-0000-0000-000000000a04', 'Vine & Barrel'),
  ('00000000-0000-0000-0000-000000000a05', 'The Cork Room')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ACCOUNT ASSIGNMENTS (matching mock data)
-- Sarah Mitchell → The Winery Bistro, Cellar Door Co.
-- Tom Reynolds   → Harvest Table
-- Marcus Bell    → Vine & Barrel, The Cork Room
-- ============================================================

INSERT INTO public.account_users (account_id, user_id) VALUES
  ('00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000a04', '00000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000a05', '00000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;
