# Security Policy

## Reporting Security Issues

🔒 **Please do NOT open public GitHub issues for security vulnerabilities.**

If you discover a security vulnerability in this project, please email the maintainer immediately:

**Email:** asim@smokeandpepper.co.uk  
**Subject:** [SECURITY] Vulnerability Report - Rota Manager

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

## Security Measures in Place

- ✅ Firebase Authentication: All sensitive operations require user authentication
- ✅ Firestore Security Rules: Role-based access control (manager vs staff)
- ✅ API Restrictions: Firebase API key limited to essential services only
- ✅ Security Headers: CSP, X-Frame-Options, HSTS enabled
- ✅ HTTPS Only: All connections encrypted in transit
- ✅ Dependencies: Regular npm audit checks and updates

## Supported Versions

Only the latest version of this application receives security updates.

- **Latest**: Actively supported ✅
- **Older versions**: No security patches

Please keep your installation up to date by deploying the latest code from main branch.

## Known Issues & Mitigations

### Firebase API Key in Public Code
The Firebase API key appears in `src/firebase.js` because web applications cannot truly hide client-side secrets. The key is mitigated by:
1. API Restrictions configured in Firebase Console (only Firestore & Auth APIs enabled)
2. Firestore Security Rules enforcing authentication for all operations
3. Real-time monitoring of Firebase for suspicious activity

See the Security Audit Report for full details: `/SECURITY_AUDIT_REPORT.md`

## Security Audit Results

A comprehensive security audit is maintained in `SECURITY_AUDIT_REPORT.md` detailing:
- OWASP Top 10 analysis
- Dependency vulnerability assessment
- Recommended fixes and timelines
- Attack scenarios
- Production readiness checklist

## Contact

For security questions or concerns, contact the maintainer directly.

---

**Last Updated:** June 24, 2026  
**Next Audit:** December 24, 2026
