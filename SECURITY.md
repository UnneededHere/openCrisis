# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in OpenCrisis, please follow these steps:

1. **Do NOT** open a public issue on GitHub.

2. **Open a private advisory** on GitHub or contact the maintainers via private channels if available.

3. **Allow time for response**. We aim to respond within 48 hours and provide a fix within 7 days for critical issues.

4. **Coordinate disclosure**. We follow responsible disclosure practices and will credit reporters in our security advisories.

## Security Best Practices

When deploying OpenCrisis:

- **Change default secrets**: Update `JWT_SECRET` in production
- **Use HTTPS**: Always deploy behind a TLS-terminating proxy
- **Restrict CORS**: Set `CORS_ORIGIN` to your actual frontend domain
- **Update dependencies**: Regularly run `npm audit` and update packages
- **Monitor logs**: Watch for suspicious authentication patterns

## Known Security Measures

OpenCrisis implements:

- Password hashing with bcrypt
- JWT with short-lived access tokens + refresh token rotation
- Rate limiting on authentication endpoints
- Input validation with Zod
- HTTP security headers via Helmet
- CORS configuration
- MongoDB injection prevention via Mongoose

## Acknowledgments

We thank all security researchers who help keep OpenCrisis secure.
