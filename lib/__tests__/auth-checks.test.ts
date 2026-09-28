/**
 * SIGN UP CHECKS TESTS – lib/__tests__/auth-checks.test.ts
 *
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { checkEmail, checkPassword, checkPasswordsMatch } from '../auth-checks';

describe('checkEmail', () => {
  it('should reject an empty or broken email and accept a real one', () => {
    assert.notStrictEqual(checkEmail(''), null);
    assert.notStrictEqual(checkEmail('abc'), null);
    assert.notStrictEqual(checkEmail('abc@'), null);
    assert.strictEqual(checkEmail('a@b.co'), null);
  });
});

describe('checkPassword', () => {
  it('should need at least 6 characters', () => {
    assert.notStrictEqual(checkPassword('12345'), null);
    assert.strictEqual(checkPassword('123456'), null);
  });
});

describe('checkPasswordsMatch', () => {
  it('should catch a mismatch and an empty confirm box', () => {
    assert.notStrictEqual(checkPasswordsMatch('secret1', 'secret2'), null);
    assert.notStrictEqual(checkPasswordsMatch('secret1', ''), null);
    assert.strictEqual(checkPasswordsMatch('secret1', 'secret1'), null);
  });
});
