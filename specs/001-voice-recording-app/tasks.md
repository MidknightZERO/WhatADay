# Tasks: Voice Recording App

**Input**: Design documents from `/specs/001-voice-recording-app/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → SUCCESS: Implementation plan loaded
   → Extract: TypeScript 5.0+, Node.js 18+, React 18+, Next.js, Supabase, Stripe, Google AI/Gemini API
2. Load optional design documents:
   → data-model.md: 6 entities (User, Recording, Transcription, Export, Subscription, Usage)
   → contracts/: 15+ API endpoints for auth, recordings, transcriptions, exports, subscriptions
   → research.md: Google AI/Gemini API, Supabase, Stripe integration decisions
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, API endpoints
   → Integration: DB, middleware, real-time features
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests: ✅
   → All entities have models: ✅
   → All endpoints implemented: ✅
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `backend/src/`, `frontend/src/` (per plan.md structure)
- Backend: Node.js + Express + TypeScript
- Frontend: Next.js + React + TypeScript

## Phase 3.1: Setup
- [ ] T001 Create project structure (backend/ and frontend/ directories)
- [ ] T002 Initialize backend Node.js project with Express, TypeScript, Supabase, Stripe dependencies
- [ ] T003 Initialize frontend Next.js project with React, TypeScript, Tailwind CSS dependencies
- [ ] T004 [P] Configure ESLint and Prettier for backend in backend/.eslintrc.js
- [ ] T005 [P] Configure ESLint and Prettier for frontend in frontend/.eslintrc.js
- [ ] T006 [P] Setup Vitest testing framework for backend in backend/vitest.config.ts
- [ ] T007 [P] Setup Vitest and React Testing Library for frontend in frontend/vitest.config.ts
- [ ] T008 [P] Setup Playwright E2E testing in frontend/playwright.config.ts
- [ ] T009 Configure Supabase project and environment variables
- [ ] T010 Configure Stripe project and environment variables
- [ ] T011 Configure Google AI/Gemini API credentials

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)
- [ ] T012 [P] Contract test POST /api/auth/google in backend/tests/contract/test_auth_google.ts
- [ ] T013 [P] Contract test POST /api/auth/refresh in backend/tests/contract/test_auth_refresh.ts
- [ ] T014 [P] Contract test POST /api/recordings in backend/tests/contract/test_recordings_post.ts
- [ ] T015 [P] Contract test GET /api/recordings in backend/tests/contract/test_recordings_get.ts
- [ ] T016 [P] Contract test GET /api/recordings/{id} in backend/tests/contract/test_recordings_get_id.ts
- [ ] T017 [P] Contract test DELETE /api/recordings/{id} in backend/tests/contract/test_recordings_delete.ts
- [ ] T018 [P] Contract test POST /api/recordings/{id}/transcribe in backend/tests/contract/test_transcribe.ts
- [ ] T019 [P] Contract test GET /api/transcriptions/{id} in backend/tests/contract/test_transcriptions_get.ts
- [ ] T020 [P] Contract test POST /api/exports in backend/tests/contract/test_exports_post.ts
- [ ] T021 [P] Contract test GET /api/exports in backend/tests/contract/test_exports_get.ts
- [ ] T022 [P] Contract test GET /api/subscriptions in backend/tests/contract/test_subscriptions_get.ts
- [ ] T023 [P] Contract test POST /api/subscriptions in backend/tests/contract/test_subscriptions_post.ts
- [ ] T024 [P] Contract test DELETE /api/subscriptions in backend/tests/contract/test_subscriptions_delete.ts
- [ ] T025 [P] Contract test GET /api/usage in backend/tests/contract/test_usage_get.ts

### Integration Tests (User Stories)
- [ ] T026 [P] Integration test Google OAuth flow in backend/tests/integration/test_google_auth.ts
- [ ] T027 [P] Integration test recording upload and transcription in backend/tests/integration/test_recording_flow.ts
- [ ] T028 [P] Integration test content export generation in backend/tests/integration/test_export_generation.ts
- [ ] T029 [P] Integration test subscription management in backend/tests/integration/test_subscription_flow.ts
- [ ] T030 [P] Integration test usage limit enforcement in backend/tests/integration/test_usage_limits.ts
- [ ] T031 [P] E2E test complete user journey in frontend/tests/e2e/test_user_journey.spec.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Models
- [ ] T032 [P] User model in backend/src/models/user.ts
- [ ] T033 [P] Recording model in backend/src/models/recording.ts
- [ ] T034 [P] Transcription model in backend/src/models/transcription.ts
- [ ] T035 [P] Export model in backend/src/models/export.ts
- [ ] T036 [P] Subscription model in backend/src/models/subscription.ts
- [ ] T037 [P] Usage model in backend/src/models/usage.ts

### Services Layer
- [ ] T038 [P] AuthService for Google OAuth in backend/src/services/auth_service.ts
- [ ] T039 [P] RecordingService for audio file management in backend/src/services/recording_service.ts
- [ ] T040 [P] TranscriptionService for AI integration in backend/src/services/transcription_service.ts
- [ ] T041 [P] ExportService for content generation in backend/src/services/export_service.ts
- [ ] T042 [P] SubscriptionService for Stripe integration in backend/src/services/subscription_service.ts
- [ ] T043 [P] UsageService for limit tracking in backend/src/services/usage_service.ts

### API Endpoints
- [ ] T044 POST /api/auth/google endpoint in backend/src/api/auth.ts
- [ ] T045 POST /api/auth/refresh endpoint in backend/src/api/auth.ts
- [ ] T046 POST /api/recordings endpoint in backend/src/api/recordings.ts
- [ ] T047 GET /api/recordings endpoint in backend/src/api/recordings.ts
- [ ] T048 GET /api/recordings/{id} endpoint in backend/src/api/recordings.ts
- [ ] T049 DELETE /api/recordings/{id} endpoint in backend/src/api/recordings.ts
- [ ] T050 POST /api/recordings/{id}/transcribe endpoint in backend/src/api/transcriptions.ts
- [ ] T051 GET /api/transcriptions/{id} endpoint in backend/src/api/transcriptions.ts
- [ ] T052 POST /api/exports endpoint in backend/src/api/exports.ts
- [ ] T053 GET /api/exports endpoint in backend/src/api/exports.ts
- [ ] T054 GET /api/subscriptions endpoint in backend/src/api/subscriptions.ts
- [ ] T055 POST /api/subscriptions endpoint in backend/src/api/subscriptions.ts
- [ ] T056 DELETE /api/subscriptions endpoint in backend/src/api/subscriptions.ts
- [ ] T057 GET /api/usage endpoint in backend/src/api/usage.ts

### Frontend Components
- [ ] T058 [P] AuthProvider context in frontend/src/contexts/auth_context.tsx
- [ ] T059 [P] RecordingProvider context in frontend/src/contexts/recording_context.tsx
- [ ] T060 [P] Login page component in frontend/src/pages/login.tsx
- [ ] T061 [P] Dashboard page component in frontend/src/pages/dashboard.tsx
- [ ] T062 [P] Recording page component in frontend/src/pages/recordings/new.tsx
- [ ] T063 [P] Recordings list component in frontend/src/components/recordings_list.tsx
- [ ] T064 [P] Recording player component in frontend/src/components/recording_player.tsx
- [ ] T065 [P] Transcription display component in frontend/src/components/transcription_display.tsx
- [ ] T066 [P] Export options component in frontend/src/components/export_options.tsx
- [ ] T067 [P] Subscription management component in frontend/src/components/subscription_manager.tsx

## Phase 3.4: Integration
- [ ] T068 Connect Supabase database with models
- [ ] T069 Implement Supabase Storage for audio files
- [ ] T070 Integrate Google AI/Gemini API for transcription
- [ ] T071 Integrate Stripe for subscription payments
- [ ] T072 Implement Supabase Realtime for live updates
- [ ] T073 Add authentication middleware
- [ ] T074 Add request/response logging
- [ ] T075 Add CORS and security headers
- [ ] T076 Implement WebSocket for real-time transcription updates
- [ ] T077 Add input validation and sanitization
- [ ] T078 Implement error handling and logging
- [ ] T079 Add rate limiting for API endpoints

## Phase 3.5: Polish
- [ ] T080 [P] Unit tests for User model validation in backend/tests/unit/test_user_model.ts
- [ ] T081 [P] Unit tests for Recording model validation in backend/tests/unit/test_recording_model.ts
- [ ] T082 [P] Unit tests for Transcription model validation in backend/tests/unit/test_transcription_model.ts
- [ ] T083 [P] Unit tests for Export model validation in backend/tests/unit/test_export_model.ts
- [ ] T084 [P] Unit tests for AuthService in backend/tests/unit/test_auth_service.ts
- [ ] T085 [P] Unit tests for TranscriptionService in backend/tests/unit/test_transcription_service.ts
- [ ] T086 [P] Unit tests for ExportService in backend/tests/unit/test_export_service.ts
- [ ] T087 [P] Unit tests for React components in frontend/tests/unit/test_components.tsx
- [ ] T088 Performance tests for API endpoints (<200ms response time)
- [ ] T089 Performance tests for Core Web Vitals (<3s load, <1.5s interaction)
- [ ] T090 [P] Update API documentation in docs/api.md
- [ ] T091 [P] Update README with setup instructions
- [ ] T092 [P] Add component documentation with Storybook
- [ ] T093 Remove code duplication and refactor
- [ ] T094 Run quickstart.md validation tests
- [ ] T095 Accessibility testing (WCAG 2.1 AA compliance)
- [ ] T096 Security audit and penetration testing

## Dependencies
- Tests (T012-T031) before implementation (T032-T067)
- Models (T032-T037) before services (T038-T043)
- Services (T038-T043) before API endpoints (T044-T057)
- API endpoints before frontend components (T058-T067)
- Core implementation before integration (T068-T079)
- Integration before polish (T080-T096)

## Parallel Execution Examples

### Phase 3.1 Setup (T004-T008)
```
Task: "Configure ESLint and Prettier for backend in backend/.eslintrc.js"
Task: "Configure ESLint and Prettier for frontend in frontend/.eslintrc.js"
Task: "Setup Vitest testing framework for backend in backend/vitest.config.ts"
Task: "Setup Vitest and React Testing Library for frontend in frontend/vitest.config.ts"
Task: "Setup Playwright E2E testing in frontend/playwright.config.ts"
```

### Phase 3.2 Contract Tests (T012-T025)
```
Task: "Contract test POST /api/auth/google in backend/tests/contract/test_auth_google.ts"
Task: "Contract test POST /api/auth/refresh in backend/tests/contract/test_auth_refresh.ts"
Task: "Contract test POST /api/recordings in backend/tests/contract/test_recordings_post.ts"
Task: "Contract test GET /api/recordings in backend/tests/contract/test_recordings_get.ts"
Task: "Contract test GET /api/recordings/{id} in backend/tests/contract/test_recordings_get_id.ts"
```

### Phase 3.3 Models (T032-T037)
```
Task: "User model in backend/src/models/user.ts"
Task: "Recording model in backend/src/models/recording.ts"
Task: "Transcription model in backend/src/models/transcription.ts"
Task: "Export model in backend/src/models/export.ts"
Task: "Subscription model in backend/src/models/subscription.ts"
Task: "Usage model in backend/src/models/usage.ts"
```

### Phase 3.3 Services (T038-T043)
```
Task: "AuthService for Google OAuth in backend/src/services/auth_service.ts"
Task: "RecordingService for audio file management in backend/src/services/recording_service.ts"
Task: "TranscriptionService for AI integration in backend/src/services/transcription_service.ts"
Task: "ExportService for content generation in backend/src/services/export_service.ts"
Task: "SubscriptionService for Stripe integration in backend/src/services/subscription_service.ts"
Task: "UsageService for limit tracking in backend/src/services/usage_service.ts"
```

### Phase 3.5 Unit Tests (T080-T087)
```
Task: "Unit tests for User model validation in backend/tests/unit/test_user_model.ts"
Task: "Unit tests for Recording model validation in backend/tests/unit/test_recording_model.ts"
Task: "Unit tests for Transcription model validation in backend/tests/unit/test_transcription_model.ts"
Task: "Unit tests for Export model validation in backend/tests/unit/test_export_model.ts"
Task: "Unit tests for AuthService in backend/tests/unit/test_auth_service.ts"
Task: "Unit tests for TranscriptionService in backend/tests/unit/test_transcription_service.ts"
Task: "Unit tests for ExportService in backend/tests/unit/test_export_service.ts"
Task: "Unit tests for React components in frontend/tests/unit/test_components.tsx"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts
- Follow TDD: Red → Green → Refactor cycle
- Each task must be specific enough for LLM execution

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**: ✅
   - 15 contract files → 15 contract test tasks [P]
   - 15 endpoints → 15 implementation tasks
   
2. **From Data Model**: ✅
   - 6 entities → 6 model creation tasks [P]
   - Relationships → 6 service layer tasks [P]
   
3. **From User Stories**: ✅
   - 5 stories → 5 integration tests [P]
   - Quickstart scenarios → 1 E2E test [P]

4. **Ordering**: ✅
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (15/15)
- [x] All entities have model tasks (6/6)
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task

---

**Tasks Status**: ✅ Complete (96 tasks generated)  
**Next Phase**: Implementation Execution

