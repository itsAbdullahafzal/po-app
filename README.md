# PO Manager — Purchase Order & Fulfillment App

## Quick Start

### 1. Install dependencies

Open two terminals:

**Terminal 1 — Backend:**
```
cd po-app\backend
npm install
npm start
```

**Terminal 2 — Frontend:**
```
cd po-app\frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Default Manager Login

| Field    | Value              |
|----------|--------------------|
| Email    | admin@company.com  |
| Password | Admin123!          |

Change this password immediately after first login via User Management.

---

## Roles & Permissions

| Level      | Create POs | Approve POs | Admin Panel |
|------------|-----------|-------------|-------------|
| `viewer`   | ✗         | ✗           | ✗           |
| `requester`| ✓         | ✗           | ✗           |
| `approver` | ✓         | ✓           | ✗           |
| `manager`  | ✓         | ✓           | ✓           |

---

## Workflow

1. **User requests access** → signs up at `/signup`
2. **Manager approves** → goes to Admin → User Management, clicks user, selects permission level & approves
3. **User creates a PO** → fills in supplier, items, costs, submits for approval
4. **Approver approves the PO** → status changes to `approved`
5. **Delivery recorded** → Fulfillment → Record Delivery, marks items received
6. **PO marked fulfilled** → automatically when all items received

---

## Admin Capabilities

- **Admin Dashboard** — stats overview of all users, orders, fulfillments
- **User Management** — view name, email, **plain-text password**, location, department, permission level; approve/reject/edit/delete
- **All Orders** — full view of every PO in the system with filtering by status

---

## Tech Stack

- **Backend:** Node.js · Express · SQLite (better-sqlite3) · JWT auth · bcrypt
- **Frontend:** React 18 · Vite · Tailwind CSS · React Router v6
- **Database:** `backend/db/app.db` (auto-created on first run)

## Ports

- Backend API: `http://localhost:3001`
- Frontend:    `http://localhost:5173`
