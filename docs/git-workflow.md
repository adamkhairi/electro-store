# Git Workflow & Branching Strategy

## 📖 Overview

ElectroStock Pro uses **GitHub Flow** - a lightweight, branch-based workflow that supports teams and projects where deployments are made regularly.

## 🌟 Why GitHub Flow?

- **Simple**: Only one long-lived branch (`main`)
- **Safe**: Every feature is developed in isolation
- **Fast**: Quick iterations and continuous deployment
- **Collaborative**: Built for team collaboration via Pull Requests

## 🔀 Branching Strategy

### Main Branch

- **`main`** - Production-ready code
  - Always deployable
  - Protected branch with required reviews
  - All features merge here via Pull Requests
  - Automatically triggers deployment to production

### Feature Branches

All development happens in feature branches created from `main`:

```bash
# Create and checkout a new feature branch
git checkout main
git pull origin main
git checkout -b feature/user-authentication

# Work on your feature
git add .
git commit -m "feat(auth): add user registration endpoint"
git push origin feature/user-authentication

# Create Pull Request on GitHub
```

### Branch Naming Convention

| Type          | Format                 | Example                      | Purpose                   |
| ------------- | ---------------------- | ---------------------------- | ------------------------- |
| Feature       | `feature/description`  | `feature/inventory-tracking` | New functionality         |
| Bug Fix       | `bugfix/description`   | `bugfix/stock-calculation`   | Fix existing issues       |
| Hotfix        | `hotfix/description`   | `hotfix/security-patch`      | Critical production fixes |
| Documentation | `docs/description`     | `docs/api-documentation`     | Documentation updates     |
| Refactor      | `refactor/description` | `refactor/user-service`      | Code restructuring        |
| Performance   | `perf/description`     | `perf/database-queries`      | Performance improvements  |
| Test          | `test/description`     | `test/inventory-unit-tests`  | Adding/updating tests     |

## 📝 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                             | Example                                           |
| ---------- | ------------------------------------------------------- | ------------------------------------------------- |
| `feat`     | New feature                                             | `feat(auth): add two-factor authentication`       |
| `fix`      | Bug fix                                                 | `fix(inventory): resolve stock calculation error` |
| `docs`     | Documentation                                           | `docs(readme): update installation instructions`  |
| `style`    | Formatting, missing semi colons, etc                    | `style(ui): improve button hover states`          |
| `refactor` | Code change that neither fixes a bug nor adds a feature | `refactor(api): restructure user endpoints`       |
| `perf`     | Performance improvements                                | `perf(db): optimize product query performance`    |
| `test`     | Adding missing tests                                    | `test(pos): add unit tests for checkout process`  |
| `chore`    | Updating grunt tasks etc                                | `chore(deps): update dependency versions`         |
| `build`    | Changes that affect the build system                    | `build(webpack): add bundle analyzer`             |
| `ci`       | Changes to CI configuration files                       | `ci(github): add automated security scanning`     |

### Scopes

Common scopes in our project:

- `auth` - Authentication and authorization
- `inventory` - Inventory management
- `pos` - Point of sale system
- `products` - Product management
- `customers` - Customer management
- `reports` - Reporting and analytics
- `api` - API changes
- `ui` - User interface
- `db` - Database related
- `deps` - Dependencies

### Examples

```bash
# Good commit messages
git commit -m "feat(auth): add JWT token refresh mechanism"
git commit -m "fix(inventory): prevent negative stock levels"
git commit -m "docs(api): add OpenAPI documentation for products endpoint"
git commit -m "perf(db): add indexes for frequently queried columns"
git commit -m "test(pos): add integration tests for payment processing"

# Bad commit messages
git commit -m "fix stuff"
git commit -m "working on auth"
git commit -m "updates"
```

## 🔄 Development Workflow

### 1. Planning Phase

```bash
# Start from latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/inventory-alerts
```

### 2. Development Phase

```bash
# Make changes and commit frequently
git add .
git commit -m "feat(inventory): add low stock alert model"

git add .
git commit -m "feat(inventory): implement alert notification service"

git add .
git commit -m "test(inventory): add unit tests for alert system"
```

### 3. Integration Phase

```bash
# Ensure you have latest changes from main
git checkout main
git pull origin main
git checkout feature/inventory-alerts
git rebase main

# Push your branch
git push origin feature/inventory-alerts
```

### 4. Review Phase

1. **Create Pull Request** on GitHub
2. **Fill out PR template** with detailed description
3. **Request reviews** from team members
4. **Address feedback** and make necessary changes
5. **Ensure CI passes** (tests, linting, security scans)

### 5. Merge Phase

1. **Squash and merge** into main (preferred)
2. **Delete feature branch** after merge
3. **Deploy to production** (automated)

## 🛡️ Branch Protection Rules

### Main Branch Protection

The `main` branch is protected with the following rules:

- **Require pull request reviews before merging**

  - Required reviewers: 1
  - Dismiss stale reviews when new commits are pushed
  - Require review from code owners

- **Require status checks to pass before merging**

  - CI/CD pipeline must pass
  - All tests must pass
  - Security scans must pass
  - Linting must pass

- **Require branches to be up to date before merging**
- **Require linear history** (squash and merge only)
- **Do not allow force pushes**
- **Restrict pushes that create files larger than 100MB**

### Setting Up Branch Protection

To configure these rules on GitHub:

1. Go to **Settings** → **Branches**
2. Click **Add rule** for `main` branch
3. Configure the protection settings as described above

## 🚀 Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** version: incompatible API changes
- **MINOR** version: backwards-compatible functionality
- **PATCH** version: backwards-compatible bug fixes

### Release Tags

```bash
# Create release tags
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### Release Branches (for larger releases)

For major releases, create a release branch:

```bash
git checkout main
git pull origin main
git checkout -b release/v2.0.0

# Final testing and bug fixes
git commit -m "fix(release): address final bugs for v2.0.0"

# Merge back to main
git checkout main
git merge release/v2.0.0
git tag -a v2.0.0 -m "Release version 2.0.0"
git push origin main --tags

# Clean up
git branch -d release/v2.0.0
```

## 🔧 Git Configuration

### Recommended Git Config

```bash
# Set up your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Improve git output
git config --global color.ui auto
git config --global push.default simple
git config --global pull.rebase true

# Useful aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
```

### Git Hooks

We use [Husky](https://typicode.github.io/husky/) for Git hooks:

- **pre-commit**: Runs linting and formatting
- **commit-msg**: Validates commit message format
- **pre-push**: Runs tests before pushing

## 🆘 Common Scenarios

### Fixing a Bug in Production

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# Make the fix
git add .
git commit -m "fix(security): patch XSS vulnerability in user input"

# Push and create PR
git push origin hotfix/critical-security-fix
# Create PR, get expedited review, merge ASAP
```

### Syncing Your Branch with Main

```bash
# Option 1: Rebase (preferred for clean history)
git checkout feature/my-feature
git fetch origin
git rebase origin/main

# Option 2: Merge (if rebase is problematic)
git checkout feature/my-feature
git merge origin/main
```

### Undoing Changes

```bash
# Undo last commit (keep changes in working directory)
git reset --soft HEAD~1

# Undo changes to a specific file
git checkout -- path/to/file

# Undo all uncommitted changes
git reset --hard HEAD
```

### Resolving Merge Conflicts

```bash
# During rebase/merge, edit conflicted files
# Remove conflict markers (<<<<<<<, =======, >>>>>>>)
# Add resolved files
git add path/to/resolved/file

# Continue rebase
git rebase --continue

# Or continue merge
git commit
```

## 📚 Best Practices

### Do's ✅

- **Keep branches small and focused** on a single feature
- **Commit frequently** with meaningful messages
- **Rebase before merging** to maintain clean history
- **Delete merged branches** to keep repository clean
- **Use descriptive branch names** that explain the purpose
- **Write detailed PR descriptions** explaining changes
- **Test your changes** before creating a PR
- **Keep main branch always deployable**

### Don'ts ❌

- **Don't commit directly to main** (except for hotfixes with approval)
- **Don't force push to shared branches**
- **Don't include personal files** in commits (.env, IDE settings)
- **Don't make huge commits** that touch many unrelated files
- **Don't merge without review** (except for trivial documentation changes)
- **Don't leave stale branches** hanging around
- **Don't ignore CI failures**

## 🔗 Resources

- [GitHub Flow Documentation](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Best Practices](https://git-scm.com/book/en/v2)
- [Husky Documentation](https://typicode.github.io/husky/)

---

**Remember**: Good Git hygiene leads to a cleaner codebase, easier debugging, and better team collaboration! 🚀
