# CloudTech Monitoring System

Distributed monitoring system for cloud infrastructure with automated code quality analysis.

## 🚀 Features

- Authentication service with JWT
- Express.js REST API
- MongoDB integration
- Automated SonarQube code analysis
- Comprehensive test coverage
- CI/CD integration

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- SonarQube server (for code analysis)
- MongoDB (for database)

## 🔧 Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with appropriate values
```

## 🏃 Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔍 Code Quality

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### SonarQube Analysis

#### Local Analysis

1. Start your local SonarQube server:
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest
```

2. Run analysis:
```bash
# Run tests and SonarQube scan
npm run sonar:local

# Or with custom SonarQube server
npm run sonar
```

#### CI/CD Automatic Analysis

The project includes a GitHub Actions workflow that automatically:
- Runs on push to main/master/develop/feat branches
- Runs on pull requests
- Executes tests with coverage
- Runs ESLint
- Performs SonarQube analysis
- Checks quality gates

**Setup Required:**

1. Add GitHub Secrets:
   - `SONAR_TOKEN`: Your SonarQube authentication token
   - `SONAR_HOST_URL`: Your SonarQube server URL

2. The workflow will run automatically on every push and PR

### Quality Checks

Run all quality checks at once:
```bash
npm run quality:check
```

This will:
- Run ESLint
- Execute all tests with coverage
- Generate coverage reports

## 📊 SonarQube Configuration

The project is configured with:
- **Coverage threshold**: 80%
- **Automatic quality gate checks**
- **Code duplication detection**
- **Security vulnerability scanning**
- **Code smell detection**

Configuration files:
- `sonar-project.properties` - SonarQube settings
- `jest.config.js` - Test and coverage settings
- `.eslintrc.js` - Linting rules
- `.github/workflows/sonarqube.yml` - CI/CD pipeline

## 📁 Project Structure

```
cloudtech-monitoring/
├── src/
│   └── auth-service.js       # Authentication service
├── tests/                     # Test files
├── coverage/                  # Coverage reports (generated)
├── .github/
│   └── workflows/
│       └── sonarqube.yml     # CI/CD pipeline
├── jest.config.js            # Jest configuration
├── .eslintrc.js              # ESLint configuration
├── sonar-project.properties  # SonarQube configuration
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

- `NODE_ENV` - Application environment
- `PORT` - Server port
- `SONAR_HOST_URL` - SonarQube server URL
- `SONAR_TOKEN` - SonarQube authentication token
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- And more...

## 📈 Coverage Reports

After running tests with coverage:

```bash
npm run test:coverage
```

Reports are generated in:
- `coverage/lcov-report/index.html` - HTML report (open in browser)
- `coverage/lcov.info` - LCOV format (for SonarQube)
- Console output - Summary

## 🔄 CI/CD Workflow

The GitHub Actions workflow (`.github/workflows/sonarqube.yml`) includes:

1. **Code Checkout** - Fetches the repository
2. **Node.js Setup** - Installs Node.js 18
3. **Dependencies** - Installs npm packages
4. **Linting** - Runs ESLint
5. **Testing** - Executes tests with coverage
6. **SonarQube Scan** - Analyzes code quality
7. **Quality Gate** - Validates against quality standards
8. **Artifacts** - Uploads coverage reports

## 🛠️ Development

### Adding Tests

Create test files in the `tests/` directory:

```javascript
// tests/auth-service.test.js
const request = require('supertest');
const app = require('../src/auth-service');

describe('Auth Service', () => {
  it('should authenticate valid user', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'test', password: 'test123' });
    
    expect(response.status).toBe(200);
  });
});
```

### Viewing Local Coverage

```bash
# Generate coverage
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

## 🐛 Known Issues

See `CODE_QUALITY_ANALYSIS.md` for detailed analysis of current code issues and improvement recommendations.

## 📝 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run quality checks: `npm run quality:check`
5. Commit your changes
6. Push to your fork
7. Create a Pull Request

The CI/CD pipeline will automatically analyze your code!

## 📞 Support

For issues and questions, please open a GitHub issue.

