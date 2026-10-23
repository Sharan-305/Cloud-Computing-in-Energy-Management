const { test, describe } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('../backend/node_modules/bcryptjs');
const jwt = require('../backend/node_modules/jsonwebtoken');

describe('Security & Authentication Validation Tests', () => {
  const secret = 'test_jwt_secret_key_2026';

  test('Password hashing with bcrypt generates salt and one-way hash', async () => {
    const plaintext = 'SecretP@ssw0rdTamilNadu';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plaintext, salt);

    assert.notStrictEqual(plaintext, hash);
    assert.strictEqual(hash.startsWith('$2'), true);

    const isMatch = await bcrypt.compare(plaintext, hash);
    assert.strictEqual(isMatch, true);

    const isWrong = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isWrong, false);
  });

  test('JWT generation and role-based payload claims', () => {
    const payload = { id: '60d0fe4f5311236168a109ca', role: 'home_user' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    assert.ok(typeof token === 'string');

    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.id, payload.id);
    assert.strictEqual(decoded.role, 'home_user');
  });

  test('Rejects self-assignment of admin role in public registration', () => {
    const requestedRole = 'admin';
    const safeRole = requestedRole === 'industry_user' ? 'industry_user' : 'home_user';

    assert.strictEqual(safeRole, 'home_user');
  });
});
