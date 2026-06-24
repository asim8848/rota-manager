# Firebase Configuration & Security Setup Guide

## 🔒 API Restrictions (CRITICAL - Must Configure)

### What is This?
Firebase API keys are PUBLIC in web applications by design. The Firebase API key in `src/firebase.js` cannot be hidden or revoked. However, you can restrict what APIs this key can access through Firebase Console.

### Why It Matters
Without API restrictions, an attacker with your API key could:
- Access your entire Firestore database
- Create/modify user accounts
- Access Cloud Storage buckets
- Call any enabled API

With API restrictions, your key can ONLY be used for the specific APIs your app needs.

### Step-by-Step Setup

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com
   - Select your project: "rota-manager-5a47"

2. **Navigate to Project Settings**
   - Click on ⚙️ Project Settings (top left, near project name)

3. **Go to API Keys Tab**
   - In Project Settings, click: **API keys** (left sidebar)

4. **Find Your Web API Key**
   - You should see multiple API keys
   - Find the one that matches: `AIzaSyAGKcZJ8wJQTmKB7wKa0jpGHQPOSxcmGhM`
   - Click on it to edit

5. **Set Restriction Type**
   - Look for: **"Restrict the APIs this key can call"**
   - Select: **API restrictions**

6. **Enable Required APIs Only**
   - Click: **Select APIs**
   - Check ONLY these:
     - ✅ Cloud Firestore API
     - ✅ Firebase Authentication API
     - ✅ Cloud Storage for Firebase API (if you plan to use file uploads)
   - Uncheck all others

   **IMPORTANT:** Make sure these are UNCHECKED:
   - ❌ Cloud Functions API
   - ❌ Cloud Logging API
   - ❌ Cloud Pub/Sub API
   - ❌ Cloud Tasks API
   - ❌ Any other APIs

7. **Save Changes**
   - Click: **Save**
   - Wait for changes to propagate (usually 1-2 minutes)

### Verification

After saving, try to verify the restrictions work:

```bash
# This should FAIL with permission denied
curl -X POST https://identitytoolkit.googleapis.com/v1/accounts:signUp \
  -d '{"email":"test@example.com","password":"test123"}' \
  -H "Content-Type: application/json" \
  -d "key=AIzaSyAGKcZJ8wJQTmKB7wKa0jpGHQPOSxcmGhM"

# Response should be something like:
# "error": "Access denied. Please go to https://console.developers.google.com to enable the Firebase Authentication API for your project."
```

---

## 🔐 User Roles Setup (Required for New Firestore Rules)

The new Firestore rules require a `/users/{email}` collection with role information.

### Steps to Set Up:

1. **Open Firebase Console**
   - Select your project

2. **Go to Cloud Firestore**
   - Click: **Cloud Firestore** (left sidebar)

3. **Create Collection**
   - Click: **Start collection**
   - Collection ID: `users`
   - Click: **Continue**

4. **Create First Document**
   - Document ID: Use the Firebase Auth email address exactly, for example `asim@smokeandpepper.co.uk`

5. **Add Fields**
   - Field: `role` | Type: `string` | Value: `manager`
   - Field: `email` | Type: `string` | Value: your-email@example.com
   - Field: `createdAt` | Type: `timestamp` | Value: (auto-fill now)

6. **Save**
   - Click: **Save**

### Document Structure
```json
{
  "role": "manager",
  "email": "manager@smokeandpepper.co.uk",
  "createdAt": "2026-06-24T15:00:00Z"
}
```

---

## 🛡️ Security Headers Applied

The following security headers are now configured in `firebase.json` and automatically applied to all requests:

### Content-Security-Policy (CSP)
- Prevents unauthorized scripts from executing
- Only allows scripts from your domain
- Restricts font loading to Google Fonts

### X-Frame-Options: DENY
- Prevents your app from being embedded in malicious iframes
- Protects against clickjacking attacks

### X-Content-Type-Options: nosniff
- Prevents browsers from guessing file types
- Protects against MIME-type confusion attacks

### Strict-Transport-Security (HSTS)
- Forces all future connections to use HTTPS
- Prevents SSL downgrade attacks
- Valid for 1 year (31536000 seconds)

### Referrer-Policy
- Controls what information is sent when following links
- Set to `strict-origin-when-cross-origin`

### Permissions-Policy
- Disables access to:
  - Geolocation
  - Microphone
  - Camera

---

## ✅ Firestore Rules Updated

The security rules have been enhanced with:

1. **Role-Based Access Control**
   - Only managers can read/write rotas
   - Managers defined by `/users/{email}` collection

2. **Input Bounds**
   - Employee list size is limited
   - Station list size is limited
   - Week data is limited to 7 days
   - Suggestion arrays are capped to reduce abuse

3. **Client-Side Rendering Safety**
   - React escapes displayed text by default
   - No raw HTML rendering is used in the app
   - Firestore rules enforce coarse data shape and size limits

4. **Audit Logging**
   - New `/auditLog` collection for tracking changes
   - Immutable append-only logs
   - Tracks user ID, action, timestamp

---

## 🧪 Testing Security Rules

### Test as Authenticated Manager
```javascript
// Should work: Manager reading rotas
const rotas = await getDocs(query(collection(db, 'rotas'), where(...)));
// ✅ Success

// Should fail: Staff member trying to write rotas
const docRef = doc(db, 'rotas', 'week_2026-W26');
await setDoc(docRef, {...});
// ❌ Error: Missing or insufficient permissions
```

### Test as Staff Member
```javascript
// Should fail: Reading rotas (staff don't have manager role)
const rotas = await getDocs(collection(db, 'rotas'));
// ❌ Error: Missing or insufficient permissions
```

---

## 📋 Checklist Before Production

- [ ] API restrictions configured in Firebase Console
- [ ] User roles created in `/users` collection
- [ ] New Firestore rules deployed
- [ ] Security headers active on Firebase Hosting
- [ ] index.html updated with crossorigin attribute
- [ ] Test with manager account (should work)
- [ ] Test with staff account (should be restricted)
- [ ] SECURITY.md created in `.github` folder
- [ ] Reviewed and updated any relevant documentation

---

## 🚀 Deploy Changes

Once you've completed the setup:

```bash
# Test locally (if running emulator)
firebase emulators:start

# Deploy rules to production
firebase deploy --only firestore:rules

# Deploy hosting (includes new headers)
firebase deploy --only hosting
```

---

## ❓ Troubleshooting

### "Missing or insufficient permissions"
**Cause:** User doesn't have manager role in `/users` collection
**Fix:** Verify the user document exists and has `role: "manager"`

### "API restriction error" when signing in
**Cause:** API restrictions are too restrictive
**Fix:** Make sure "Firebase Authentication API" is ENABLED in API restrictions

### Security headers not appearing
**Cause:** firebase.json not deployed or changes not propagated
**Fix:** Run `firebase deploy --only hosting` and wait 1-2 minutes

---

## 📖 Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Google Cloud API Restrictions](https://cloud.google.com/docs/authentication/api-keys)
- [Security Headers Reference](https://securityheaders.com)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Last Updated:** June 24, 2026  
**Status:** Security hardening verified locally; Firebase Console API restrictions still need manual confirmation.
