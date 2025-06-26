# Dynamic Data Table Manager

A comprehensive, feature-rich data table management application built using **Next.js 14**, **Redux Toolkit**, and **Material-UI**. This project showcases advanced frontend development patterns, state management, and an interactive UI tailored for real-world use cases like admin dashboards and CRM tools.

---

## 🌐 Live Demo

👉 **[View Live App](https://your-live-site-link.com)**  
*(Replace with your deployed Vercel or Netlify link)*

---

## ✨ Features

### 🧩 Core Features
- 🔍 **Dynamic Table View** — Sortable columns: Name, Email, Age, Role, Department, Location
- 🔎 **Global Search** — Real-time filtering across visible fields
- 🔄 **Client-side Pagination** — Adjustable rows per page
- 🧱 **Column Management** — Show/hide dynamically
- 📤📥 **CSV Import/Export** — With error handling
- 💾 **Redux Persist** — Local data persistence

### 🎁 Advanced Features
- ✏️ **Inline Row Editing** — Double-click to edit, with Save/Cancel
- 🗑 **Row Actions** — Edit/Delete with confirmation
- 🌗 **Dark/Light Theme Toggle**
- ➕ **Add New Rows** — Validated using React Hook Form
- 🧩 **Add Custom Columns** — Supports multiple data types
- 🔀 **Column Reordering** — Via drag-and-drop
- 📱 **Responsive Design** — Mobile, tablet, desktop
- 📈 **Real-time Statistics** and Loading States

---

## 🛠 Tech Stack

| Category      | Tech                        |
| ------------- | --------------------------- |
| Framework     | **Next.js 14 (App Router)** |
| State Mgmt    | **Redux Toolkit**, **Persist** |
| UI Components | **Material-UI v5+ (MUI)**   |
| Forms         | **React Hook Form**         |
| CSV Handling  | **PapaParse**, **FileSaver.js** |
| Language      | **TypeScript**              |

---

## 🚀 Getting Started

### ✅ Prerequisites
- Node.js v18+
- npm or yarn

### 📦 Installation

```bash
npx create-next-app@latest dynamic-data-table --typescript
cd dynamic-data-table
