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
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@bwow.com.au',
    crypt('password123', gen_salt('bf')),
    now(), '', '', '', '', now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Jane Doe"}'
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'sarah@bwow.com.au',
    crypt('password123', gen_salt('bf')),
    now(), '', '', '', '', now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Sarah Mitchell"}'
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'tom@bwow.com.au',
    crypt('password123', gen_salt('bf')),
    now(), '', '', '', '', now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Tom Reynolds"}'
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'priya@bwow.com.au',
    crypt('password123', gen_salt('bf')),
    now(), '', '', '', '', now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Priya Nair"}'
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'marcus@bwow.com.au',
    crypt('password123', gen_salt('bf')),
    now(), '', '', '', '', now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Marcus Bell"}'
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000006',
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
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000001',
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000001',
    'admin@bwow.com.au', 'email',
    '{"sub":"a1b2c3d4-e5f6-4a7b-8c9d-000000000001","email":"admin@bwow.com.au"}',
    now(), now(), now()
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000002',
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000002',
    'sarah@bwow.com.au', 'email',
    '{"sub":"a1b2c3d4-e5f6-4a7b-8c9d-000000000002","email":"sarah@bwow.com.au"}',
    now(), now(), now()
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000003',
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000003',
    'tom@bwow.com.au', 'email',
    '{"sub":"a1b2c3d4-e5f6-4a7b-8c9d-000000000003","email":"tom@bwow.com.au"}',
    now(), now(), now()
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000004',
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000004',
    'priya@bwow.com.au', 'email',
    '{"sub":"a1b2c3d4-e5f6-4a7b-8c9d-000000000004","email":"priya@bwow.com.au"}',
    now(), now(), now()
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000005',
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000005',
    'marcus@bwow.com.au', 'email',
    '{"sub":"a1b2c3d4-e5f6-4a7b-8c9d-000000000005","email":"marcus@bwow.com.au"}',
    now(), now(), now()
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000006',
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000006',
    'olivia@bwow.com.au', 'email',
    '{"sub":"a1b2c3d4-e5f6-4a7b-8c9d-000000000006","email":"olivia@bwow.com.au"}',
    now(), now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- USER PROFILES
-- ============================================================

INSERT INTO public.users (id, name, role, notification_preferences) VALUES
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000001',
    'Jane Doe', 'admin',
    '{"email": true, "sms": false}'
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000002',
    'Sarah Mitchell', 'staff',
    '{"email": true, "sms": true}'
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000003',
    'Tom Reynolds', 'user',
    '{"email": false, "sms": false}'
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000004',
    'Priya Nair', 'user',
    '{"email": true, "sms": false}'
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000005',
    'Marcus Bell', 'staff',
    '{"email": true, "sms": true}'
  ),
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-000000000006',
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

INSERT INTO public.accounts (id, name, contact_name, contact_email, contact_phone, delivery_address, delivery_instructions) VALUES
  ('b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'The Winery Bistro', 'Emma Laurent',   'emma@winerybistro.com.au',  '0412345601', '12 Vineyard Lane, McLaren Vale SA 5171',  'Deliver to cellar door. Ring bell on arrival.'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-000000000a02', 'Cellar Door Co.',   'James Whitfield','james@cellardoor.com.au',   '0412345602', '88 Barossa Valley Way, Tanunda SA 5352',  'Leave at rear loading dock if unattended.'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-000000000a03', 'Harvest Table',     'Sophie Nguyen',  'sophie@harvesttable.com.au','0412345603', '4 Orchard Rd, Yarra Glen VIC 3775',       null),
  ('b2c3d4e5-f6a7-4b8c-9d0e-000000000a04', 'Vine & Barrel',     'Luca Moretti',   'luca@vineandbarrel.com.au', '0412345604', '210 Hunter Valley Rd, Pokolbin NSW 2320', 'Call ahead 30 mins before delivery.'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-000000000a05', 'The Cork Room',     null,             null,                        null,         '5 Flinders St, Adelaide SA 5000',         null)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PRODUCTS
-- ============================================================

INSERT INTO public.products (id, name, description, qty_per_box, image_url) VALUES
  ('c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 'Rosé — Provence',               'Dry, pale rosé from southern France',                 6,  'https://pub-8ed295401d494d38a2bf577dd8b8d502.r2.dev/rose.jpg'),
  ('c3d4e5f6-a7b8-4c9d-8e1f-000000000002', 'Pinot Noir — Central Otago',    'Medium-bodied, cherry and plum notes',                12, 'https://pub-8ed295401d494d38a2bf577dd8b8d502.r2.dev/pinot-noir.jpg'),
  ('c3d4e5f6-a7b8-4c9d-8e1f-000000000003', 'Chardonnay — Margaret River',   'Unoaked, crisp and citrusy',                          12, 'https://pub-8ed295401d494d38a2bf577dd8b8d502.r2.dev/chardonnay.jpg'),
  ('c3d4e5f6-a7b8-4c9d-8e1f-000000000004', 'Sauvignon Blanc — Marlborough', 'Classic New Zealand style, passionfruit and citrus',  12, 'https://pub-8ed295401d494d38a2bf577dd8b8d502.r2.dev/sauvignon-blanc.jpg'),
  ('c3d4e5f6-a7b8-4c9d-8e1f-000000000005', 'Shiraz — Barossa Valley',       'Full-bodied, dark fruit and cracked pepper',          6,  'https://pub-8ed295401d494d38a2bf577dd8b8d502.r2.dev/shiraz.jpg'),
  ('c3d4e5f6-a7b8-4c9d-8e1f-000000000006', 'Prosecco — Veneto DOC',         'Light, fresh Italian sparkling wine',                 6,  'https://pub-8ed295401d494d38a2bf577dd8b8d502.r2.dev/prosecco.jpg'),
  ('c3d4e5f6-a7b8-4c9d-8e1f-000000000007', 'Gin — Australian Botanical',    'Small-batch, native Australian botanicals',           6,  'https://pub-8ed295401d494d38a2bf577dd8b8d502.r2.dev/gin.jpg'),
  ('c3d4e5f6-a7b8-4c9d-8e1f-000000000008', 'Vodka — Premium Triple Distilled', 'Clean and neutral, triple distilled',              6,  'https://pub-8ed295401d494d38a2bf577dd8b8d502.r2.dev/vodka.jpg'),
  ('c3d4e5f6-a7b8-4c9d-8e1f-000000000009', 'Dark Rum — Caribbean Aged',     '5-year aged, notes of caramel and vanilla',           6,  'https://pub-8ed295401d494d38a2bf577dd8b8d502.r2.dev/rum.jpg'),
  ('c3d4e5f6-a7b8-4c9d-8e1f-000000000010', 'Lager — Craft Pilsner',         'Clean, crisp session lager',                          24, 'https://pub-8ed295401d494d38a2bf577dd8b8d502.r2.dev/lager.jpg'),
  ('c3d4e5f6-a7b8-4c9d-8e1f-000000000011', 'Pale Ale — Hazy IPA',           'Tropical hops, low bitterness',                       24, 'https://pub-8ed295401d494d38a2bf577dd8b8d502.r2.dev/pale-ale.jpg'),
  ('c3d4e5f6-a7b8-4c9d-8e1f-000000000012', 'Sparkling Water — Premium',     '750ml glass bottles',                                 12, null)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TEMPLATE  (The Winery Bistro — Weekly Wine Pack)
-- ============================================================

INSERT INTO public.templates (id, account_id, name, created_by) VALUES
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000001', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'Weekly Wine Pack',  'a1b2c3d4-e5f6-4a7b-8c9d-000000000001'),
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000002', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a02', 'Cellar Selection',  'a1b2c3d4-e5f6-4a7b-8c9d-000000000001'),
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000003', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a03', 'Seasonal Harvest',  'a1b2c3d4-e5f6-4a7b-8c9d-000000000001'),
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000004', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a04', 'Spirits Top-Up',    'a1b2c3d4-e5f6-4a7b-8c9d-000000000001')
  -- The Cork Room (a05) intentionally has no template
ON CONFLICT DO NOTHING;

INSERT INTO public.template_items (template_id, product_id, box_count, bottle_count) VALUES
  -- Weekly Wine Pack (The Winery Bistro)
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000001', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 2, 0),  -- Rosé
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000001', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000002', 1, 0),  -- Pinot Noir
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000001', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000003', 1, 0),  -- Chardonnay
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000001', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000004', 1, 0),  -- Sauvignon Blanc
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000001', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000006', 1, 6),  -- Prosecco + 6 extra
  -- Cellar Selection (Cellar Door Co.)
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000002', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000002', 2, 0),  -- Pinot Noir
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000002', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000005', 1, 0),  -- Shiraz
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000002', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000006', 2, 0),  -- Prosecco
  -- Seasonal Harvest (Harvest Table)
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000003', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 1, 0),  -- Rosé
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000003', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000003', 2, 0),  -- Chardonnay
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000003', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000004', 1, 0),  -- Sauvignon Blanc
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000003', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000012', 1, 0),  -- Sparkling Water
  -- Spirits Top-Up (Vine & Barrel)
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000004', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000007', 2, 0),  -- Gin
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000004', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000008', 1, 0),  -- Vodka
  ('d4e5f6a7-b8c9-4d0e-9f2a-000000000004', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000009', 1, 0)   -- Rum
ON CONFLICT DO NOTHING;

-- ============================================================
-- ACCOUNT ASSIGNMENTS (user role only — admin and staff have no assigned accounts)
-- Tom Reynolds → The Winery Bistro, Cellar Door Co., Vine & Barrel  (multiple)
-- Priya Nair   → Harvest Table                                        (single)
-- Olivia Chen  → (none)
-- ============================================================

INSERT INTO public.account_users (account_id, user_id) VALUES
  ('b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-000000000a02', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-000000000a04', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-000000000a03', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000004'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-000000000a05', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000006')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ORDER REQUESTS  (The Winery Bistro — 25 orders)
-- account:    b2c3d4e5-f6a7-4b8c-9d0e-000000000a01  (The Winery Bistro)
-- placed by:  a1b2c3d4-e5f6-4a7b-8c9d-000000000003  (Tom Reynolds, user)
--             a1b2c3d4-e5f6-4a7b-8c9d-000000000001  (admin placing on behalf)
-- products:   001 Rosé, 002 Pinot Noir, 003 Chardonnay, 004 Sauv Blanc,
--             005 Shiraz, 006 Prosecco, 012 Sparkling Water
-- ============================================================

INSERT INTO public.order_requests (id, account_id, placed_by, delivery_address, created_at) VALUES
  ('e5f6a7b8-0001-4c9d-8e1f-000000000001', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '180 days'),
  ('e5f6a7b8-0002-4c9d-8e1f-000000000002', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '173 days'),
  ('e5f6a7b8-0003-4c9d-8e1f-000000000003', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000001', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '166 days'),
  ('e5f6a7b8-0004-4c9d-8e1f-000000000004', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '159 days'),
  ('e5f6a7b8-0005-4c9d-8e1f-000000000005', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '152 days'),
  ('e5f6a7b8-0006-4c9d-8e1f-000000000006', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000001', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '145 days'),
  ('e5f6a7b8-0007-4c9d-8e1f-000000000007', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '138 days'),
  ('e5f6a7b8-0008-4c9d-8e1f-000000000008', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '131 days'),
  ('e5f6a7b8-0009-4c9d-8e1f-000000000009', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000001', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '124 days'),
  ('e5f6a7b8-0010-4c9d-8e1f-000000000010', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '117 days'),
  ('e5f6a7b8-0011-4c9d-8e1f-000000000011', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '110 days'),
  ('e5f6a7b8-0012-4c9d-8e1f-000000000012', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000001', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '103 days'),
  ('e5f6a7b8-0013-4c9d-8e1f-000000000013', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '96 days'),
  ('e5f6a7b8-0014-4c9d-8e1f-000000000014', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '89 days'),
  ('e5f6a7b8-0015-4c9d-8e1f-000000000015', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000001', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '82 days'),
  ('e5f6a7b8-0016-4c9d-8e1f-000000000016', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '75 days'),
  ('e5f6a7b8-0017-4c9d-8e1f-000000000017', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '68 days'),
  ('e5f6a7b8-0018-4c9d-8e1f-000000000018', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000001', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '61 days'),
  ('e5f6a7b8-0019-4c9d-8e1f-000000000019', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '54 days'),
  ('e5f6a7b8-0020-4c9d-8e1f-000000000020', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '47 days'),
  ('e5f6a7b8-0021-4c9d-8e1f-000000000021', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000001', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '40 days'),
  ('e5f6a7b8-0022-4c9d-8e1f-000000000022', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '33 days'),
  ('e5f6a7b8-0023-4c9d-8e1f-000000000023', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '26 days'),
  ('e5f6a7b8-0024-4c9d-8e1f-000000000024', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000001', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '19 days'),
  ('e5f6a7b8-0025-4c9d-8e1f-000000000025', 'b2c3d4e5-f6a7-4b8c-9d0e-000000000a01', 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003', '12 Vineyard Lane, McLaren Vale SA 5171', now() - interval '12 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_request_items (order_request_id, product_id, boxes, extra_bottles) VALUES
  -- order 1: Rosé x2, Pinot Noir x1
  ('e5f6a7b8-0001-4c9d-8e1f-000000000001', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 2, 0),
  ('e5f6a7b8-0001-4c9d-8e1f-000000000001', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000002', 1, 0),
  -- order 2: Chardonnay x2, Sauv Blanc x1, Sparkling Water x1
  ('e5f6a7b8-0002-4c9d-8e1f-000000000002', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000003', 2, 0),
  ('e5f6a7b8-0002-4c9d-8e1f-000000000002', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000004', 1, 0),
  ('e5f6a7b8-0002-4c9d-8e1f-000000000002', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000012', 1, 0),
  -- order 3: Rosé x3, Prosecco x1, extra 6 bottles
  ('e5f6a7b8-0003-4c9d-8e1f-000000000003', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 3, 0),
  ('e5f6a7b8-0003-4c9d-8e1f-000000000003', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000006', 1, 6),
  -- order 4: Pinot Noir x2, Shiraz x1
  ('e5f6a7b8-0004-4c9d-8e1f-000000000004', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000002', 2, 0),
  ('e5f6a7b8-0004-4c9d-8e1f-000000000004', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000005', 1, 0),
  -- order 5: Sauv Blanc x2, Sparkling Water x2
  ('e5f6a7b8-0005-4c9d-8e1f-000000000005', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000004', 2, 0),
  ('e5f6a7b8-0005-4c9d-8e1f-000000000005', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000012', 2, 0),
  -- order 6: Rosé x2, Chardonnay x2, Pinot Noir x1
  ('e5f6a7b8-0006-4c9d-8e1f-000000000006', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 2, 0),
  ('e5f6a7b8-0006-4c9d-8e1f-000000000006', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000003', 2, 0),
  ('e5f6a7b8-0006-4c9d-8e1f-000000000006', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000002', 1, 0),
  -- order 7: Prosecco x2, Sauv Blanc x1, extra 12 bottles
  ('e5f6a7b8-0007-4c9d-8e1f-000000000007', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000006', 2, 12),
  ('e5f6a7b8-0007-4c9d-8e1f-000000000007', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000004', 1, 0),
  -- order 8: Shiraz x2, Pinot Noir x2
  ('e5f6a7b8-0008-4c9d-8e1f-000000000008', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000005', 2, 0),
  ('e5f6a7b8-0008-4c9d-8e1f-000000000008', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000002', 2, 0),
  -- order 9: Rosé x1, Chardonnay x1, Sauv Blanc x1, Sparkling Water x1
  ('e5f6a7b8-0009-4c9d-8e1f-000000000009', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 1, 0),
  ('e5f6a7b8-0009-4c9d-8e1f-000000000009', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000003', 1, 0),
  ('e5f6a7b8-0009-4c9d-8e1f-000000000009', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000004', 1, 0),
  ('e5f6a7b8-0009-4c9d-8e1f-000000000009', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000012', 1, 0),
  -- order 10: Rosé x4
  ('e5f6a7b8-0010-4c9d-8e1f-000000000010', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 4, 0),
  -- order 11: Pinot Noir x3, Prosecco x1
  ('e5f6a7b8-0011-4c9d-8e1f-000000000011', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000002', 3, 0),
  ('e5f6a7b8-0011-4c9d-8e1f-000000000011', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000006', 1, 0),
  -- order 12: Chardonnay x3, Shiraz x1
  ('e5f6a7b8-0012-4c9d-8e1f-000000000012', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000003', 3, 0),
  ('e5f6a7b8-0012-4c9d-8e1f-000000000012', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000005', 1, 0),
  -- order 13: Sauv Blanc x2, Rosé x2
  ('e5f6a7b8-0013-4c9d-8e1f-000000000013', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000004', 2, 0),
  ('e5f6a7b8-0013-4c9d-8e1f-000000000013', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 2, 0),
  -- order 14: Prosecco x3, extra 6 bottles
  ('e5f6a7b8-0014-4c9d-8e1f-000000000014', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000006', 3, 6),
  -- order 15: Pinot Noir x2, Chardonnay x1, Sparkling Water x2
  ('e5f6a7b8-0015-4c9d-8e1f-000000000015', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000002', 2, 0),
  ('e5f6a7b8-0015-4c9d-8e1f-000000000015', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000003', 1, 0),
  ('e5f6a7b8-0015-4c9d-8e1f-000000000015', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000012', 2, 0),
  -- order 16: Shiraz x3, Rosé x1
  ('e5f6a7b8-0016-4c9d-8e1f-000000000016', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000005', 3, 0),
  ('e5f6a7b8-0016-4c9d-8e1f-000000000016', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 1, 0),
  -- order 17: Sauv Blanc x1, Chardonnay x2, Prosecco x1
  ('e5f6a7b8-0017-4c9d-8e1f-000000000017', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000004', 1, 0),
  ('e5f6a7b8-0017-4c9d-8e1f-000000000017', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000003', 2, 0),
  ('e5f6a7b8-0017-4c9d-8e1f-000000000017', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000006', 1, 0),
  -- order 18: Rosé x2, Pinot Noir x2, Sparkling Water x1
  ('e5f6a7b8-0018-4c9d-8e1f-000000000018', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 2, 0),
  ('e5f6a7b8-0018-4c9d-8e1f-000000000018', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000002', 2, 0),
  ('e5f6a7b8-0018-4c9d-8e1f-000000000018', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000012', 1, 0),
  -- order 19: Shiraz x2, Prosecco x2
  ('e5f6a7b8-0019-4c9d-8e1f-000000000019', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000005', 2, 0),
  ('e5f6a7b8-0019-4c9d-8e1f-000000000019', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000006', 2, 0),
  -- order 20: Rosé x3, Chardonnay x1, Sauv Blanc x1
  ('e5f6a7b8-0020-4c9d-8e1f-000000000020', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 3, 0),
  ('e5f6a7b8-0020-4c9d-8e1f-000000000020', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000003', 1, 0),
  ('e5f6a7b8-0020-4c9d-8e1f-000000000020', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000004', 1, 0),
  -- order 21: Pinot Noir x4
  ('e5f6a7b8-0021-4c9d-8e1f-000000000021', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000002', 4, 0),
  -- order 22: Chardonnay x2, Rosé x1, Sparkling Water x2
  ('e5f6a7b8-0022-4c9d-8e1f-000000000022', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000003', 2, 0),
  ('e5f6a7b8-0022-4c9d-8e1f-000000000022', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 1, 0),
  ('e5f6a7b8-0022-4c9d-8e1f-000000000022', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000012', 2, 0),
  -- order 23: Shiraz x1, Pinot Noir x2, Prosecco x1
  ('e5f6a7b8-0023-4c9d-8e1f-000000000023', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000005', 1, 0),
  ('e5f6a7b8-0023-4c9d-8e1f-000000000023', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000002', 2, 0),
  ('e5f6a7b8-0023-4c9d-8e1f-000000000023', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000006', 1, 0),
  -- order 24: Rosé x2, Sauv Blanc x2, Chardonnay x1
  ('e5f6a7b8-0024-4c9d-8e1f-000000000024', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000001', 2, 0),
  ('e5f6a7b8-0024-4c9d-8e1f-000000000024', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000004', 2, 0),
  ('e5f6a7b8-0024-4c9d-8e1f-000000000024', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000003', 1, 0),
  -- order 25: Prosecco x2, Shiraz x1, Sparkling Water x1
  ('e5f6a7b8-0025-4c9d-8e1f-000000000025', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000006', 2, 0),
  ('e5f6a7b8-0025-4c9d-8e1f-000000000025', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000005', 1, 0),
  ('e5f6a7b8-0025-4c9d-8e1f-000000000025', 'c3d4e5f6-a7b8-4c9d-8e1f-000000000012', 1, 0)
ON CONFLICT DO NOTHING;
