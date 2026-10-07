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

## Backlog
- P1: Connect real Twilio Verify keys — add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE to backend/.env and restart backend; code already switches to live SMS automatically (currently DEMO mode, MOCKED SMS)
- P1: Contact action (call/WhatsApp) after mutual consent
- P2: Profile editing, avatar upload, notifications

## Next tasks
- Phone OTP verification, contact reveal after accepted request
