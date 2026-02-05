# AGENTS.md - Guidelines for Agentic Coding

## Project Overview
This is a full-stack expiry tracking application with a Node.js/Express backend and Next.js TypeScript frontend. The app helps users track product expiry dates with OCR capabilities and notifications.

## Repository Structure
```
expirytracker/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express route handlers
│   │   ├── middleware/     # Auth, error handling
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   └── uploads/            # File upload storage
└── frontend/               # Next.js TypeScript app
    ├── app/
    │   ├── (auth)/         # Authentication pages
    │   ├── dashboard/      # Main dashboard
    │   ├── types/          # TypeScript type definitions
    │   └── lib/            # Utility functions
    └── components/         # React components
```

## Build & Development Commands

### Backend (Node.js/Express)
```bash
cd backend
npm run dev          # Start development server with nodemon
npm start            # Start production server
```

### Frontend (Next.js/TypeScript)
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Testing
No test framework is currently configured. When adding tests:
- Use Jest for backend unit/integration tests
- Use Jest + React Testing Library for frontend
- Run single tests: `npm test -- --testNamePattern="test name"`

## Code Style Guidelines

### Backend (JavaScript ES6+)

#### Imports & Module Structure
- Use ES6 imports/exports (`import/export`, not CommonJS)
- Import external packages first, then internal modules
- Use file extensions `.js` for all imports
- Use absolute paths with proper relative imports (`../models/Product.js`)

```javascript
import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.middleware.js";
```

#### Naming Conventions
- **Files**: kebab-case for routes (`product.routes.js`), camelCase for others (`expiryChecker.js`)
- **Variables**: camelCase (`productName`, `expiryDate`)
- **Functions**: camelCase (`startExpiryChecker`, `protect`)
- **Classes**: PascalCase (rare in this codebase)
- **Constants**: UPPER_SNAKE_CASE (`PORT`, `MONGO_URI`)

#### Database & Models
- Use Mongoose with TypeScript-style schemas
- Always include `timestamps: true` in schema options
- Use required validation for essential fields
- Reference users with `ObjectId` ref patterns
- Export models as default exports

```javascript
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);
```

#### API Routes & Controllers
- Use Express Router for route organization
- Apply authentication middleware (`protect`) to protected routes
- Use async/await with try-catch blocks
- Return consistent JSON responses with status codes
- Include ownership checks for user-specific resources

```javascript
router.post("/add", protect, async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      user: req.userId, // Attach logged-in user
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
```

#### Error Handling
- Use try-catch blocks for async operations
- Return meaningful error messages with appropriate status codes
- Log errors to console for debugging
- Use consistent error response format: `{ message: error.message }`

#### Middleware
- Authentication: Use JWT in cookies, not Authorization headers
- Always validate token existence before verification
- Attach `req.userId` from decoded JWT
- Use consistent error responses for auth failures

### Frontend (Next.js/TypeScript)

#### Imports & Module Structure
- Use absolute imports with `@/` prefix for internal modules
- Group imports: React/Next.js first, then external libraries, then internal
- Use `.tsx` for components with JSX, `.ts` for utilities/types

```typescript
"use client";

import Link from "next/link";
import { Product } from "@/app/types/product";
```

#### Type Definitions
- Define interfaces in `/app/types/` directory
- Use PascalCase for interface names
- Make optional properties explicit with `?`
- Export types for reuse across components

```typescript
export interface Product {
  _id?: string;
  name: string;
  expiryDate: string;
  category?: string;
  imageUrl?: string;
  createdAt?: string;
}
```

#### Components
- Use `"use client";` directive for interactive components
- Define props as interfaces or inline types
- Use functional components with hooks
- Follow React naming conventions (PascalCase)

```typescript
export default function ProductCard({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (id: string) => void;
}) {
  // Component logic
}
```

#### Styling
- Use Tailwind CSS classes
- Follow consistent spacing and color patterns
- Use semantic color classes (`text-gray-600`, `bg-blue-600`)
- Apply responsive design patterns where needed

#### API Integration
- Use Next.js cookies for auth token management
- Implement proper error handling for API calls
- Use async/await for data fetching
- Handle loading and error states appropriately

#### TypeScript Configuration
- Strict mode enabled
- Path aliasing: `@/*` maps to `./*`
- JSX transform: `react-jsx`
- Target: ES2017 for modern browser support

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default: 5000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)

## Database Schema
- **Users**: Authentication and user management
- **Products**: Product tracking with expiry dates
- **Notifications**: System-generated notifications for expiring products

## Key Features & Patterns
- **Authentication**: JWT-based with httpOnly cookies
- **File Uploads**: Multer with Sharp for image processing
- **OCR**: Tesseract.js for text extraction from images
- **Notifications**: Automated expiry checking with node-cron
- **Authorization**: User-scoped resource access with ownership validation

## Development Workflow
1. Backend runs on port 5000, frontend on port 3000
2. Use nodemon for backend hot reloading
3. Use Next.js dev server for frontend hot reloading
4. Database: MongoDB (connection via MONGO_URI)
5. File uploads stored in `/backend/uploads/`

## Security Considerations
- Always validate user ownership before resource access
- Use environment variables for sensitive configuration
- Implement proper CORS settings for frontend-backend communication
- Validate and sanitize all user inputs
- Use httpOnly cookies for JWT tokens to prevent XSS