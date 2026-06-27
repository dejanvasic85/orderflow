ALTER TABLE template_items RENAME COLUMN bottle_count TO unit_count;
ALTER TABLE order_request_items RENAME COLUMN extra_bottles TO extra_units;
