---
"e2e": patch
"@e2e-dev/core": patch
---

A target takes `provide`, JSON values its tests read with `inject()` from
`e2e`, as in Vitest. Two targets on one platform, such as the arms of an A/B
experiment, can now tell which one a test runs on. `inject()` returns
`undefined` for a key nobody provided and throws `INVALID_ARGUMENT` while a
test file is collected.
