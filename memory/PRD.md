# ConnectMe — PRD

## Original problem statement
Build a landing page: Continuing from [Integrate React Component]: Build the ConnectMe React website in the existing codebase. First inspect the project structure and determine whether it uses shadcn/ui, Tailwind CSS, and TypeScript; if needed, provide/setup instructions via shadcn CLI and install missing dependencies. Integrate the supplied InteractiveHoverLinks component into /components/ui/interactive-hover-links.tsx, installing motion and lucide-react. Create a polished responsive ConnectMe multi-page/step registration experience: registration with person name and phone number, interest category selection (dancing, gaming, sports, writing, singing) with attractive image cards using known Unsplash images, department selection (B.Tech, BE, MBA, CDAC, pharmacy), then a home/directory showing people by category and department with search/filter UI and an explicit tracking/request-location flow. Important: do not implement covert tracking or GPS access merely from a phone number. Use a consent-based location-sharing/request model with clear permission UI; phone number should identify/contact a registered person, while browser/device geolocation requires that person's explicit permission. Use the supplied hover-links visual style where appropriate. Use lucide-react icons, Tailwind classes, TypeScript, and accessible responsive design. Ask no questions unless blocked; make sensible defaults and implement the complete UI. and make a 3D website and animation website thats looks cool

## Defaults chosen (user skipped questions)
- InteractiveHoverLinks code was not supplied → recreated (big editorial links + cursor-following image + rotating arrow)
- Registrations stored in MongoDB backend; 12 seeded demo people (is_demo)

## Architecture
- Frontend: CRA + craco, Tailwind, shadcn setup present; TypeScript added (tsconfig.json, typescript 5.4; jsconfig removed; TS files use relative imports). motion (motion/react), lenis smooth scroll, lucide-react, sonner, react-query.
- Pages: / (Landing), /register (4-step wizard), /directory (search + filters + grouped view), /requests (incoming/sent location requests)
- Backend FastAPI: /api/meta, /api/people (POST register, GET list w/ q/interest/department; full-phone search), /api/me, /api/location-requests (+ /respond, /revoke, /cancel). Per-person secret token (X-Person-Token, sha256 stored). Phone masked publicly.
- Consent model: target must opt in to receive requests; each request needs explicit approve + browser geolocation prompt; one-time snapshot rounded to 2 decimals (~1 km); expires in 60 min; revocable.
- Profiles stored per browser in localStorage (multi-profile switcher for testing both sides).

## Implemented (2026-10-07)
- Kinetic landing: masked line reveal hero, 3D rotating orbit of interest photos with mouse tilt + perspective grid floor, slow editorial marquee, InteractiveHoverLinks interests list, bento how-it-works, 3D tilt department tiles, word-stagger manifesto, scroll clip-path CTA, SVG logo + favicon
- Registration wizard with validation, image cards, department radio cards, consent toggle (off by default), review
- Directory with name/phone search, interest + department filters, grouped-by-department view, request-location modal
- Requests inbox: approve (consent modal → browser geolocation) / decline / revoke; sent requests show OSM map when shared
- Demo request auto-created for new users who opt in

## Implemented (2026-10-07, iteration 2)
- Phone OTP verification before registration (/api/otp/send, /api/otp/verify; registration requires verification_token). Twilio Verify used automatically when TWILIO_* env vars are set; otherwise DEMO mode returns code to UI (MOCKED SMS). 30s resend gap, 5 attempts, 10-min code TTL. 10-digit numbers default to +91.
- Meet-up pins: on a shared request either party taps a Leaflet map (OSM tiles, dark filter) to drop a named pin; other party accepts/declines; confirmed spot shows Directions link. Endpoints /api/location-requests/{id}/meetup and /meetup/respond; cleared on revoke/cancel.

## Implemented (2026-10-07, iteration 3)
- Meet-up countdown: accepting a spot stamps `accepted_at` + `meet_at` (15-min window) on the meetup. `MeetupCountdown.tsx` shows a walking-ETA nudge ("You're about N min away on foot" for the sharer; "{other} is about N min from the spot" for the requester, with an optional device-only "Check my distance" geolocation that is never sent to the server), a live mm:ss timer with progress bar and an "It's time" state.
- `/api/meta` exposes `otp_mode` ("sms" | "demo"); PhoneVerify shows whether codes arrive by SMS or on screen.
- Tests: /app/backend/tests/test_meetup_countdown.py

## Implemented (2026-10-07, iteration 4)
- Contact reveal: once a meet-up spot is accepted by both parties, `LocationRequestOut.contact_phone` carries the counterpart's full number (null otherwise — phone stays masked until mutual confirmation). `ContactReveal.tsx` shows the number with Call (`tel:`) and WhatsApp (`wa.me` prefilled message) buttons under the countdown.

## Implemented (2026-10-07, iteration 5)
- 7 trending-2026 interests added (12 total): ai-building "AI & Vibe Coding", content-creation, run-club, pickleball "Pickleball & Padel", anime "Anime & Cosplay", photography "Photography & Film", music-production. `Interest.trending` flag drives "Trending 2026" tags on landing + registration cards. Hero orbit shows 8 cards (trending first) with dynamic angles; registration grid is now 2/3/4 columns; marquee derives from data. Backend INTERESTS validation + /api/meta counts updated; 9 new demo members seeded idempotently (seed now upserts per demo phone).

## Implemented (2026-10-07, iteration 6)
- Brand refresh: user-supplied blue logo (public/logo-mark.png cropped w/ alpha, logo-full.png). Accent switched globally from lime #d7ff3a → electric blue #2fb8ff (CSS var --accent); Wordmark uses the mark + gradient "Me" + optional tagline "Find People • Build Connections" (footer); hero orbit has a floating logo hub in the centre; favicon = logo-mark.png.
- Private 1:1 messaging: backend `/app/backend/messages.py` (collection `messages`: id, pair (sorted ids), participants, sender_id, recipient_id, text, created_at, read_at). Endpoints GET /api/conversations (last msg + unread), GET /api/conversations/unread, GET /api/conversations/{other_id} (marks read), POST /api/conversations/{other_id}. Threads are only queryable by the two participants; demo members auto-reply. Frontend /messages and /messages/:personId (sidebar + thread, polling 3s/5s/8s), nav "Messages" link w/ unread badge, "Message privately" on member cards and request cards, read receipts (✓/✓✓), mobile back nav. Tests: backend/tests/test_messages.py; frontend verified by testing agent (test_reports/iteration_1.json).

## Implemented (2026-10-07, iteration 7)
- Theme: "aesthetic" palette — peach accent #ffb086 on deep plum ink (#0c0a12 / #15111d / #110e18), warm bone #f7f2ec, iris #8b91ff glow; logo stays blue. Fixed CSS var collision (--accent → --glow).
- Block & Report: /app/backend/blocks.py — POST/DELETE /api/blocks/{id}, GET /api/blocks; `blocks` + `reports` collections. Enforced on messages (403), location requests (403), directory (hidden both ways when viewer token sent), conversations/unread hidden; blocking revokes active shares and declines/cancels pending requests. UI: thread-block-btn + BlockReportModal (reasons, report checkbox), thread-blocked-notice w/ unblock, BlockedList in Messages sidebar, member-card-block-btn.
- Message alerts: MessageAlerts.tsx (mounted in App) — sonner toast with "Open" action + WebAudio chime for new incoming messages when not on that thread; title "(n)" badge; AlertSoundToggle persisted (connectme.alertSound.v1).
- Emergent Google sign-in: /app/backend/auth.py — POST /api/auth/google/session (server-side exchange, `user_sessions` {session_token,email,name,picture,person_id,expires_at}, httpOnly cookie), GET /api/auth/me (cookie or Bearer; 409 registration_required when unlinked), POST /api/auth/logout. People link by `google_email` (unique sparse). Session tokens also work as X-Person-Token. New Google users finish normal registration (phone OTP still required) with `google_session_token` in POST /api/people. Frontend: GoogleButton (register step 1, signed-out Messages/Requests, profile menu), /auth/callback + hash detection in App.tsx, Google picture avatars. Tests: backend/tests/test_auth.py, test_blocks.py; frontend test_reports/iteration_2.json all pass. Docs: /app/auth_testing.md.
- Deployment health check: PASS (no findings).

## Implemented (2026-10-07, iteration 8)
- Profile editing: PATCH /api/me (ProfileUpdate: name, picture, interests, department, accepts_location_requests; phone immutable). Picture = https URL (Google) or data:image/(jpeg|png|webp) base64 ≤400KB — stored on the person document (no object storage). Frontend /profile (Profile.tsx) reuses StepInterests/StepDepartment, PhotoPicker.tsx crops+resizes client-side to 256px JPEG, sticky save bar with dirty state; "Edit my profile" in the profile menu; Avatar shows pictures everywhere. Tests: backend/tests/test_profile.py (11 total passing); UI verified via screenshot flow.

## Implemented (2026-10-13, iteration 9)
- Real members only: demo seeding removed; startup purges `is_demo` people + their requests/messages/blocks; demo auto-replies and demo UI copy removed. Test accounts must be named `ZZTest …` (conftest purges them).
- Login for returning users: /login (phone + OTP, purpose="login") → POST /api/auth/login issues a 90-day device session (user_sessions, kind "phone"); Nav shows "Log in" when signed out. OTP send now takes purpose register|login with proper 409/404 messages.
- Profile: bio ("About you", ≤160) added to PATCH /api/me, Profile page and member cards; "Profile" nav link.
- Intro: IntroOverlay (once per session, letter-by-letter tagline, reduced-motion aware). Landing background: ScrollConstellation canvas (scroll-velocity-reactive node network, DPR-capped, pauses when hidden).
- Performance: images recompressed (2.5MB→1.1MB), lazy-loading, orbit will-change/contain, Lenis lerp tuned.
- Directory background: AuroraBackground (CSS aurora ribbons + drifting halftone). Fonts: Syne (display) + Manrope (body) + Instrument Serif italic accents (hero "love.", intro words); JetBrains Mono kept.
- Known: tests/test_login.py occasionally flaky when run in the parallel suite (passes alone) — investigate ordering if it recurs.

## Backlog
- P1: Connect real Twilio Verify keys — add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE to backend/.env and restart backend; code already switches to live SMS automatically (currently DEMO mode, MOCKED SMS)
- P2: notifications (push/email)

## Next tasks
- Phone OTP verification, contact reveal after accepted request
