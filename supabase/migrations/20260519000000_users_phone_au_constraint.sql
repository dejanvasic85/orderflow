alter table public.users
  add constraint users_phone_au_format
  check (phone is null or phone ~ '^04[0-9]{8}$');
