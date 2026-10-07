# Auth-Gated App Testing Playbook (Emergent Google Auth) — ConnectMe

ConnectMe maps a Google identity to a `people` document. Sessions live in `user_sessions`:
{ session_token, email, name, picture, person_id (nullable until registration completes), expires_at, created_at }

## Step 1: Create a test person + Google session (mongosh)
Use DB_NAME from /app/backend/.env.
```
mongosh --eval "
use('<DB_NAME>');
var personId = 'test-person-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.people.insertOne({ id: personId, name: 'Test Google User', phone: '+9100009' + String(Date.now()).slice(-6), interests: ['gaming'], department: 'MBA', accepts_location_requests: true, is_demo: false, created_at: new Date().toISOString(), token_hash: 'none', google_email: 'test.user@example.com', picture: '' });
db.user_sessions.insertOne({ session_token: sessionToken, email: 'test.user@example.com', name: 'Test Google User', picture: '', person_id: personId, expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(), created_at: new Date().toISOString() });
print('Session token: ' + sessionToken); print('Person ID: ' + personId);
"
```

## Step 2: Backend API
```
curl "$API/api/auth/me" -H "Authorization: Bearer $SESSION_TOKEN"      # -> person JSON
curl "$API/api/auth/me" -H "Cookie: session_token=$SESSION_TOKEN"      # cookie path
curl "$API/api/me" -H "X-Person-Token: $SESSION_TOKEN"                 # session token also works as X-Person-Token
curl -X POST "$API/api/auth/logout" -H "Authorization: Bearer $SESSION_TOKEN"
```
A session without `person_id` (Google user who hasn't finished registration) returns 409 from /api/auth/me with detail "registration_required".

## Step 3: Browser
Preferred: inject a profile in localStorage (works for session tokens too):
`connectme.profiles.v1` = `[{"id":"<personId>","name":"Test Google User","token":"<sessionToken>"}]`, `connectme.active.v1` = `<personId>`.
Or set the httpOnly cookie `session_token` (domain = app host, path "/", secure, sameSite None) and load `/auth/callback` — the app will call /api/auth/me and adopt the profile.

The real Google round-trip (auth.emergentagent.com) cannot be automated; the callback handler is testable by loading `/auth/callback#session_id=<fake>` and expecting a graceful error toast + redirect to /register.

## Checklist
- user_sessions.person_id matches people.id
- All queries use {"_id": 0}
- /api/auth/me returns person data; expired session -> 401
- Nav shows the Google profile after callback; Messages/Requests load
