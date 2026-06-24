# Preorder Manager

A modern preorder management application built with Next.js 16, TypeScript, and Prisma with SQLite.

## Features

- **Preorder List**: View all preorders with filtering (All, Active, Inactive)
- **Sorting**: Sort by Name, Created At, Starts At, or Ends At in ascending/descending order
- **Pagination**: Navigate through preorders with 8 items per page
- **Create**: Add new preorders with validation
- **Update**: Edit existing preorder details
- **Status Toggle**: Quickly toggle preorder status (Active/Inactive)
- **Delete**: Remove preorders from the system
- **Selection**: Select individual rows or all rows (with checkboxes)

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **UI**: React Server and Client Components

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npm run db:push
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
preorder-manager/
├── app/
│   ├── api/preorders/          # API routes for preorder operations
│   ├── preorder/[id]/          # Create/Update preorder form page
│   ├── page.tsx                # Main preorder list page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── lib/
│   └── utils.ts                # Utility functions
├── prisma/
│   └── schema.prisma           # Database schema
└── package.json
```

## API Routes

### GET /api/preorders
Fetch all preorders with filtering, sorting, and pagination.

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 8)
- `filter`: 'all', 'active', or 'inactive' (default: 'all')
- `sortBy`: 'name', 'createdAt', 'startsAt', or 'endsAt' (default: 'createdAt')
- `sortOrder`: 'asc' or 'desc' (default: 'desc')

### POST /api/preorders
Create a new preorder.

### GET /api/preorders/[id]
Fetch a single preorder by ID.

### PUT /api/preorders/[id]
Update a preorder by ID.

### DELETE /api/preorders/[id]
Delete a preorder by ID.

### PATCH /api/preorders/[id]/toggle-status
Toggle the active status of a preorder.

## Database Schema

```prisma
model Preorder {
  id            Int       @id @default(autoincrement())
  name          String
  products      Int
  preorderWhen  String
  startsAt      DateTime
  endsAt        DateTime?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

## Development

### View Database in Prisma Studio
```bash
npm run db:studio
```

### Build for Production
```bash
npm run build
npm start
```

## UI/UX Features

- Clean, modern interface with Tailwind CSS
- Responsive design
- Loading states and feedback messages
- Confirmation dialogs for destructive actions
- Real-time status updates
- Empty state handling

## License

MIT
