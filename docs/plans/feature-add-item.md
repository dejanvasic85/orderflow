# Feature: Add catalog items to an order via a picker drawer

**Context:** Order screen shows template items (locked) plus user-added items. Users add non-template products through a drawer that surfaces the product catalog. This is the customer-facing mobile PWA flow.

## Build

1. **`+ Add Item` button** on the order screen opens a shadcn `Drawer` (sheet) containing the product catalog as a picker.

2. **Picker drawer:**
   - Reuse the catalog grid/list; add a search input filtering by product name.
   - Each product card has a trailing action reflecting one of three states:
     - **In the current template** → no button; static text "In your template" (muted).
     - **Not yet added** → button labelled "Add".
     - **Already added to this order (non-template)** → button labelled "Added" in a distinct colour (e.g. success/green variant); tapping it removes the item from the order.
   - Adding/removing updates order state immediately. **The drawer stays open** after each action — do not close on add.
   - The drawer is dismissed only by the user (close button / overlay tap / drag-down).

3. **Order state & persistence:**
   - User-added (non-template) items persist to `localStorage`, keyed per account: `draft:{accountId}`.
   - Template items are NOT stored in localStorage — they derive from the account's assigned template.
   - On returning to the order screen, rehydrate user-added items from localStorage and render them below template items.
   - On successful order submission, clear `draft:{accountId}`.

4. **Template items on the order screen are read-only** — render quantities as static values, no steppers, no remove action. (Quantity editing for template items is out of scope pending confirmation.)

5. **User-added items on the order screen** keep the existing box/bottle steppers and a remove action.

## Out of scope (do not build)

- Editing template item quantities
- Adding items to the template
- Cross-device draft sync
- Submission/backend wiring beyond clearing the draft on submit

## Acceptance

- Adding an item from the drawer appends it to the order and toggles its card to "Added"; drawer remains open.
- Tapping "Added" removes the item and reverts the card to "Add".
- Template products show "In your template" with no actionable button.
- Refreshing or navigating away and returning preserves user-added items for that account.
- Submitting clears the draft for that account only.
