# Contributing to ElectroStock Pro

## 🤝 Welcome Contributors!

Thank you for your interest in contributing to ElectroStock Pro! This document provides guidelines and information for developers working on this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 🔑 Code of Conduct

### Our Standards

- **Be Respectful**: Treat all team members with respect and professionalism
- **Be Collaborative**: Work together to achieve common goals
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Inclusive**: Welcome diverse perspectives and experiences

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Git knowledge
- TypeScript/JavaScript experience
- React.js familiarity

### Initial Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd electrostock-pro
   ```

2. **Install dependencies:**

   ```bash
   npm run setup
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### Branch Strategy (GitHub Flow)

1. **main** - Production-ready code (protected)
2. **feature branches** - New features
3. **bugfix branches** - Bug fixes
4. **hotfix branches** - Critical production fixes

### Branch Naming Convention

```
feature/auth-system
feature/inventory-management
bugfix/stock-calculation
hotfix/security-vulnerability
docs/api-documentation
refactor/user-service
```

### Workflow Steps

1. **Create a new branch:**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**

   - Write code following our standards
   - Add/update tests
   - Update documentation

3. **Commit your changes:**

   ```bash
   git add .
   git commit -m "feat(auth): add two-factor authentication"
   ```

4. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

## 📝 Coding Standards

### TypeScript Guidelines

- **Use TypeScript strict mode**
- **Prefer interfaces over types for object shapes**
- **Use meaningful variable and function names**
- **Add JSDoc comments for public APIs**

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

/**
 * Creates a new user account
 * @param userData - User registration data
 * @returns Promise resolving to created user
 */
async function createUser(userData: CreateUserRequest): Promise<User> {
  // Implementation
}

// ❌ Bad
type u = {
  i: string;
  e: string;
  r: string;
};

function addU(d: any): any {
  // Implementation
}
```

### React Guidelines

- **Use functional components with hooks**
- **Extract custom hooks for reusable logic**
- **Keep components small and focused**
- **Use proper prop types and interfaces**

```tsx
// ✅ Good
interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  const handleEdit = useCallback(() => {
    onEdit(product);
  }, [product, onEdit]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{product.name}</Typography>
        <Typography variant="body2">{product.description}</Typography>
      </CardContent>
      <CardActions>
        <Button onClick={handleEdit}>Edit</Button>
        <Button onClick={() => onDelete(product.id)}>Delete</Button>
      </CardActions>
    </Card>
  );
};
```

### Backend Guidelines

- **Use dependency injection**
- **Implement proper error handling**
- **Add input validation**
- **Use transactions for database operations**

```typescript
// ✅ Good
@Controller('/api/v1/:tenantId/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async createProduct(
    @Param('tenantId') tenantId: string,
    @Body() createProductDto: CreateProductDto
  ): Promise<Product> {
    try {
      return await this.productService.createProduct(tenantId, createProductDto);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Failed to create product');
    }
  }
}
```

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   └── domain/         # Domain-specific components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API services
├── stores/             # Redux stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── constants/          # Application constants
```

## 🧪 Testing Guidelines

### Testing Strategy

- **Unit Tests**: 80%+ coverage for business logic
- **Integration Tests**: API endpoints and database operations
- **Component Tests**: React component behavior
- **E2E Tests**: Critical user workflows

### Testing Frameworks

- **Frontend**: Jest + React Testing Library
- **Backend**: Jest + Supertest
- **E2E**: Playwright

### Test Examples

```typescript
// Unit Test
describe('calculateTotalPrice', () => {
  it('should calculate total price with tax', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 },
    ];
    const taxRate = 0.1;

    const result = calculateTotalPrice(items, taxRate);

    expect(result).toBe(275); // (200 + 50) * 1.1
  });
});

// Component Test
describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
  };

  it('should render product information', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });
});
```

## 🔍 Pull Request Process

### PR Checklist

Before submitting a PR, ensure:

- [ ] Code follows our coding standards
- [ ] All tests pass locally
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] PR description is clear and detailed
- [ ] No merge conflicts with main branch

### PR Template

```markdown
## Description

Brief description of changes made.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

Add screenshots to show the changes.

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: At least one team member reviews the code
3. **Testing**: QA team tests new features if applicable
4. **Approval**: Code owner approves the changes
5. **Merge**: Changes are merged into main branch

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Bug Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment**

- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional Context**
Add any other context about the problem here.
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

## 📚 Resources

- [Technical Specifications](./specs.md)
- [Development Roadmap](./roadmap.md)
- [API Documentation](./docs/api.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)

## 🆘 Getting Help

- **Slack**: #electrostock-dev channel
- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bugs and feature requests
- **Code Reviews**: Ask specific questions in PR comments

---

Thank you for contributing to ElectroStock Pro! 🚀
