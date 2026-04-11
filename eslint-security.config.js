// eslint-security.config.js
//
// ESLint flat-config fragment for security rules. Imported into the project's
// main eslint.config.mjs so editor / `bun run lint` runs see security findings.
//
// For the standalone SAST workflow run (no main lint config loaded), see
// eslint-security.standalone.config.js — it wraps these rules with a
// TypeScript parser and the linter options needed to run in isolation.
//
// Plugin reference: https://github.com/eslint-community/eslint-plugin-security

import securityPlugin from 'eslint-plugin-security'

/** @type {import('eslint').Linter.Config[]} */
const securityConfig = [
  {
    // Apply to all JS/TS source files. Adjust globs to match your project layout.
    files: ['src/**/*.{ts,tsx,js,jsx}', 'app/**/*.{ts,tsx,js,jsx}', 'pages/**/*.{ts,tsx,js,jsx}'],

    plugins: {
      security: securityPlugin,
    },

    rules: {
      // CI runs the standalone variant of this config with --max-warnings 0,
      // so every enabled rule below is set to 'error'. High-FP rules that
      // produce noise without catching real vulnerabilities (the
      // object-injection family in particular) are turned 'off' rather than
      // left at 'warn' — leaving them at 'warn' just breaks CI without giving
      // anyone a signal to act on.

      // ── Injection ─────────────────────────────────────────────────────────

      // Disallow eval() and implied eval (setTimeout/setInterval with string args).
      // eval() on any user-controlled input is a code injection vulnerability.
      'security/detect-eval-with-expression': 'error',

      // Reject require() called with a non-literal path (e.g. require(userInput)).
      // An attacker who controls this value can load arbitrary modules.
      'security/detect-non-literal-require': 'error',

      // Reject RegExp() constructed with a non-literal pattern.
      // User-supplied regex patterns can trigger ReDoS (catastrophic backtracking).
      'security/detect-non-literal-regexp': 'error',

      // Reject fs module calls with non-literal path arguments.
      // Path traversal attacks become possible when file paths are user-controlled.
      'security/detect-non-literal-fs-filename': 'error',

      // ── Timing ────────────────────────────────────────────────────────────

      // Detect string comparisons that may be vulnerable to timing attacks.
      // Use crypto.timingSafeEqual() for secrets, tokens, and HMAC comparisons.
      'security/detect-possible-timing-attacks': 'error',

      // ── Injection (object/prototype) ──────────────────────────────────────

      // Disabled: this rule fires on every typed object access with a variable
      // key (e.g. `obj[someEnumValue]`) and has a famously high false-positive
      // rate in TypeScript codebases. Prototype pollution is mitigated by
      // Object.create(null), Map, or runtime key validation — none of which
      // this rule understands. Re-enable only if a real prototype pollution
      // bug ships.
      'security/detect-object-injection': 'off',

      // ── Middleware ordering ───────────────────────────────────────────────

      // CSRF protection middleware must be applied before method-override.
      // Method override bypasses CSRF checks if applied in the wrong order.
      'security/detect-no-csrf-before-method-override': 'error',

      // ── Miscellaneous ─────────────────────────────────────────────────────

      // Disallow use of new Buffer() — it does not zero memory and can expose
      // prior heap contents. Use Buffer.alloc() or Buffer.from() instead.
      'security/detect-new-buffer': 'error',

      // Reject child_process.exec() / spawn() called with a variable argument.
      // Shell injection is possible if the argument is user-controlled.
      'security/detect-child-process': 'error',

      // Reject pseudoRandom number generators (Math.random) for security use.
      // Crypto operations require crypto.getRandomValues() or crypto.randomBytes().
      'security/detect-pseudoRandomBytes': 'error',

      // Reject unsafe regular expressions that could match unexpected input
      // due to the absence of anchors or overly broad character classes.
      'security/detect-unsafe-regex': 'error',
    },
  },
]

export default securityConfig
