# Changelog

All notable changes to the CoinDaily platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Cookie consent banner (GDPR/CCPA/POPIA compliant) wired into root layout
- Root-level error pages (404 Not Found, 500 Server Error)
- Privacy Policy, Terms of Service, and Cookie Policy pages
- OG/Twitter/canonical metadata on article pages
- CSP and HSTS security headers in frontend
- Brotli compression support in nginx configuration
- Alertmanager service in monitoring stack
- `deleteUserData` GraphQL mutation resolver for GDPR compliance
- `npm audit` step in CI/CD pipeline
- Backend Jest coverage threshold (60%)
- browserconfig.xml for Microsoft tile support

### Fixed
- XSS vulnerability in ArticleContent: replaced regex sanitization with DOMPurify
- Playwright and Lighthouse CI port mismatch (3000 → 3001)
- CI test masking that hid real failures (`2>/dev/null || echo` removed)
- Accessibility test URLs aligned with actual app routes

### Changed
- Legal API routes now mounted on `/api/legal` in Express server
- Security headers module integrated into main server configuration
