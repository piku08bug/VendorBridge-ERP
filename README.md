# VendorBridge - Procurement & Vendor Management ERP (Week 1)

## Tech Stack
Node.js, Express, SQLite (better-sqlite3), Bootstrap 5, JWT in httpOnly cookie, bcrypt

## Setup
1. Install Node.js LTS
2. npm install
3. Copy .env.example to .env and fill values
4. node server.js
5. Open http://localhost:3000

## Environment Variables
PORT, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, NODE_ENV

## Roles (enforced on backend)
| Role | Dashboard | View vendors | Create/Edit | Delete |
|---|---|---|---|---|
| Admin | Yes | Yes | Yes | Yes |
| Procurement Officer | Yes | Yes | Yes | No |
| Manager/Approver | Yes | Yes | No | No |
| Vendor | Yes | No | No | No |

## Implemented
Registration, login, logout, password reset, protected pages and APIs, role-based
authorization, dashboard with cards, quick actions and empty states, vendor
create/list/view/update/delete, GSTIN/email/phone validation, search, status tabs, badges,
SQLite persistence. UI follows the Excalidraw mockup for screens 1 to 4.

## Deviations from design
- Registration has a Password field (design had none)
- Admin role cannot be selected at registration; Admin is seeded
- Login "Username" is the email
- Dashboard has an extra "Total vendors" card

## Known Limitations
- Password reset link is shown on page/console; no real email is sent
- Users choose their own role at registration
- Screens 5 to 11 (RFQ, Quotations, Approvals, PO, Invoices, Reports, Activity) are empty-state placeholders (later weeks)
- No automated tests, manual testing only
- No rate limiting
- Free hosting with SQLite loses data on restart; local setup persists data

## Screenshots
See the screenshots folder.
