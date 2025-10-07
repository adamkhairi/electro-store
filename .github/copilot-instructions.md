# ElectroStock Pro - AI Coding Agent Instructions

## Project Architecture Overview

ElectroStock Pro is a **multi-tenant SaaS** electronics store management platform with a **monorepo workspace structure**:

- `backend/` - Node.js + Express + Prisma + PostgreSQL API
- `frontend/` - React + TypeScript + Vite + Tailwind CSS web app
- `mobile/` - React Native mobile app
- `shared/` - Workspace packages for types, utils, constants

**Multi-tenancy**: All data models include `tenantId` for data isolation. The `Tenant` model is the root of all relationships.

## Key Development Workflows

### Setup & Development

```bash
# Full workspace setup (always run first)
bun run setup

# Start all development servers
bun run dev           # Starts frontend (port 5173) + backend (port 3001)
bun run dev:frontend  # Frontend only
bun run dev:backend   # Backend only

# Database operations (backend context)
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:migrate    # Create new migrations
npm run db:seed       # Seed database
npm run db:reset      # Reset + seed database
```

### Testing & Quality

- **CRITICAL**: Always run `bun run lint` before committing - current project has linting errors that need resolution
- Use proper TypeScript types - avoid `any` (project currently has @typescript-eslint/no-explicit-any violations)
- Handle React Hook dependency warnings properly

## Database & API Patterns

### Prisma Schema Architecture

- **Multi-tenant isolation**: Every model has `tenantId` foreign key to `Tenant`
- **Soft relations**: Use optional relationships (`categoryId?`) with explicit foreign keys
- **Electronics-specific fields**: `specifications` (JSON), `serialNumbers` (String[]), `warranty` periods
- **Audit trails**: `StockMovement` tracks inventory changes with `beforeQuantity`/`afterQuantity`

### Controller Pattern (Backend)

```typescript
// Always use Zod schemas for validation
const createSchema = z.object({
  name: z.string().min(1).max(255),
  // ... validation rules
});

// Extract tenantId from authenticated request
const { tenantId } = req.user;

// Include tenantId in all Prisma operations
const product = await prisma.product.create({
  data: { ...validatedData, tenantId },
});
```

### API Response Format

All API responses follow this standardized structure:

```typescript
{
  success: boolean;
  data: T | null;
  message?: string;
  error?: string;
}
```

## Frontend Patterns

### Shared Types Usage

Import types from `@electrostock/types` workspace package:

```typescript
import { Product, Inventory, Category } from '@electrostock/types';
```

### API Service Pattern

- Centralized API service in `frontend/src/services/api.ts`
- Automatic JWT token management with refresh logic
- Multi-tenant baseURL configuration

### State Management

- Redux Toolkit with async thunks for API calls
- Auth state persisted to localStorage
- Error handling with consistent error states

### Component Architecture

- Radix UI primitives for accessibility
- Tailwind CSS for styling
- React Hook Form + Zod for form validation
- Hierarchical component structure in `components/` organized by feature

## Critical Business Logic

### Inventory Management

- **Stock movements**: Track all changes with `StockMovement` records
- **Multi-location**: Products can have different stock levels per `Location`
- **Reserved quantities**: Separate `reservedQuantity` from `availableQuantity`
- **Serial number tracking**: Electronics-specific individual item tracking

### Barcode & SKU System

- SKU generation utility in `backend/src/utils/barcodeUtils.ts`
- Barcode validation supports EAN-13, UPC-A formats
- Both SKU and barcode have unique constraints

### Category Hierarchy

- Self-referencing `Category` model supports unlimited nesting
- Use `parentId`/`children` relationships for tree structures

## Integration Points

### Authentication Flow

1. JWT access tokens (short-lived) + refresh tokens
2. Multi-tenant user isolation via `tenantId`
3. Role-based access control: admin, manager, cashier, staff

### POS System Design

- Separate `Sale` model optimized for point-of-sale transactions
- `SalePayment` supports split payments (cash + card)
- Real-time inventory deduction on sale completion

## Development Standards

### Git Workflow

- Follow GitHub Flow with feature branches
- Use Conventional Commits: `feat(inventory): add low stock alerts`
- Prefix branches: `feature/`, `bugfix/`, `hotfix/`

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier formatting
- Prefer explicit types over `any`
- Use Zod schemas for runtime validation

### Testing Approach

- Jest for backend unit tests
- React Testing Library for frontend
- Target 80%+ code coverage
- Integration tests for critical workflows

## Environment Configuration

### Required Environment Variables

```bash
# Backend (.env)
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
FRONTEND_URL="http://localhost:5173"

# Frontend (.env)
VITE_API_URL="http://localhost:3001/api"
```

### Multi-tenant Considerations

- Always include `tenantId` in database queries
- API endpoints: `/api/{resource}` (tenant extracted from JWT)
- Tenant isolation enforced at Prisma model level

## Common Troubleshooting

1. **Database Connection Issues**: Run `npm run db:generate` in backend after schema changes
2. **Build Failures**: Check TypeScript errors - avoid `any` types
3. **Linting Errors**: Current codebase has ESLint violations that need fixing
4. **Import Errors**: Verify workspace dependencies are built: `bun run build:shared`

Use this knowledge to maintain consistency with established patterns and architectural decisions.
