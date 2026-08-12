// =============================================================================
// VITEST SETUP
// =============================================================================
// This file runs before every test suite and sets up the testing environment.
// It imports jest-dom matchers which add custom assertions like:
//   - toBeInTheDocument()
//   - toHaveTextContent()
//   - toBeVisible()
//   - toBeDisabled()
//   and many more.
//
// See: https://github.com/testing-library/jest-dom
// =============================================================================

import '@testing-library/jest-dom';

// Keep this file minimal: global test helpers and matchers only.
// Tests that need to mock `node-cron` should call `vi.mock('node-cron', ...)`
// inside the individual test files so hoisted mocks take effect per-suite.
