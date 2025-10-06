# Contributing to NULL POINT

Thank you for your interest in contributing to the NULL POINT NASA TEMPO Air Quality Intelligence System! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:
- Check if the issue already exists in our [issue tracker](https://github.com/yourusername/null-point/issues)
- Provide a clear and descriptive title
- Include steps to reproduce the issue
- Add relevant logs, screenshots, or error messages
- Specify your environment (OS, Python version, Node.js version, etc.)

### Suggesting Features

We welcome feature suggestions! Please:
- Check if the feature has already been suggested
- Provide a clear description of the feature
- Explain the use case and benefits
- Consider the scope and complexity of the implementation

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the development setup** instructions in the README
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Ensure all tests pass**
7. **Submit a pull request** with a clear description

## 🛠️ Development Setup

### Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB 7.0+
- Redis 7.0+
- Git

### Backend Development

```bash
cd Backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Set up pre-commit hooks
pre-commit install

# Run tests
python -m pytest tests/ -v
```

### Frontend Development

```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

## 📝 Coding Standards

### Python (Backend)

- **Follow PEP 8** style guidelines
- **Use type hints** for all function parameters and return values
- **Write docstrings** for all public functions and classes
- **Maintain 80%+ test coverage**
- **Use meaningful variable and function names**

Example:
```python
def get_fused_air_quality_data(
    lat: float, 
    lon: float, 
    pollutants: List[str] = None,
    radius_km: float = 50.0
) -> Dict[str, Any]:
    """
    Get fused air quality data combining satellite and ground sensor data.
    
    Args:
        lat: Target latitude (-90 to 90)
        lon: Target longitude (-180 to 180)
        pollutants: List of pollutants to analyze
        radius_km: Search radius for ground sensors
        
    Returns:
        Dictionary containing fused data with quality metrics
        
    Raises:
        ValueError: If coordinates are invalid
        APIError: If external services are unavailable
    """
```

### TypeScript (Frontend)

- **Use strict TypeScript** configuration
- **Follow ESLint** and Prettier rules
- **Use meaningful component and variable names**
- **Write JSDoc comments** for complex functions
- **Prefer functional components** with hooks

Example:
```typescript
interface AirQualityData {
  pollutant: string;
  value: number;
  unit: string;
  timestamp: string;
  uncertainty?: number;
}

/**
 * Fetches real-time air quality data for a specific location
 */
const useAirQualityData = (lat: number, lon: number): {
  data: AirQualityData[] | null;
  loading: boolean;
  error: Error | null;
} => {
  // Implementation
};
```

### Git Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(api): add NASA TEMPO data fusion endpoint

fix(frontend): resolve chart rendering issue on mobile devices

docs(readme): update installation instructions

test(backend): add unit tests for forecast service
```

## 🧪 Testing Guidelines

### Backend Testing

- **Unit tests**: Test individual functions and classes
- **Integration tests**: Test API endpoints and database interactions
- **Performance tests**: Test response times and throughput
- **Coverage**: Maintain 80%+ test coverage

```bash
# Run all tests
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=app --cov-report=html

# Run specific test file
python -m pytest tests/test_forecast_service.py -v
```

### Frontend Testing

- **Component tests**: Test React components in isolation
- **Integration tests**: Test user interactions and data flow
- **E2E tests**: Test complete user workflows
- **Accessibility tests**: Ensure WCAG compliance

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y
```

## 📚 Documentation

### Code Documentation

- **Docstrings**: All public functions must have comprehensive docstrings
- **Type hints**: Use type hints for all Python functions
- **Comments**: Explain complex logic and algorithms
- **README updates**: Update relevant documentation for new features

### API Documentation

- **OpenAPI/Swagger**: Update API specifications for new endpoints
- **Examples**: Provide request/response examples
- **Error codes**: Document all possible error responses
- **Rate limits**: Document any rate limiting or usage constraints

## 🔍 Code Review Process

### For Contributors

1. **Self-review**: Review your own code before submitting
2. **Test thoroughly**: Ensure all tests pass and add new tests
3. **Update docs**: Update relevant documentation
4. **Small PRs**: Keep pull requests focused and reasonably sized
5. **Respond promptly**: Address review feedback in a timely manner

### For Reviewers

1. **Be constructive**: Provide helpful and actionable feedback
2. **Check functionality**: Verify the code works as intended
3. **Review tests**: Ensure adequate test coverage
4. **Consider performance**: Look for potential performance issues
5. **Approve promptly**: Don't delay approval for minor issues

## 🚀 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation is updated
- [ ] CHANGELOG is updated
- [ ] Version numbers are bumped
- [ ] Security vulnerabilities are addressed
- [ ] Performance impact is assessed

## 🛡️ Security

### Reporting Security Issues

Please **DO NOT** create public issues for security vulnerabilities. Instead:
1. Email us at security@yourdomain.com
2. Provide detailed information about the vulnerability
3. Allow reasonable time for us to address the issue
4. We will acknowledge receipt within 48 hours

### Security Best Practices

- **Never commit secrets**: Use environment variables for sensitive data
- **Validate inputs**: Sanitize and validate all user inputs
- **Use HTTPS**: Always use secure connections in production
- **Update dependencies**: Keep all dependencies up to date
- **Follow OWASP**: Follow OWASP security guidelines

## 🌟 Recognition

Contributors will be recognized in:
- **README.md**: Contributors section
- **CHANGELOG.md**: Release notes
- **GitHub**: Contributor graphs and statistics
- **Social media**: Acknowledgments for significant contributions

## 📞 Getting Help

- **GitHub Discussions**: For general questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Email**: contact@imraunak.dev for direct communication
- **Discord/Slack**: Join our community chat (link in README)

## 📄 License

By contributing to NULL POINT, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to NULL POINT! Together, we're building better air quality monitoring for everyone. 🌍✨
