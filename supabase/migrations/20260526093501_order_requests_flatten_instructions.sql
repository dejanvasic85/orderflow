alter table public.order_requests
  add column delivery_instructions text,
  drop column note,
  drop column delivery_note;
