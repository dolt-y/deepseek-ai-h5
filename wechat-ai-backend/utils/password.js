import crypto from 'crypto';

const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEYLEN = 64;
const PASSWORD_DIGEST = 'sha512';

export function createPasswordHash(password) {
  const passwordText = String(password);
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(passwordText, salt, PASSWORD_ITERATIONS, PASSWORD_KEYLEN, PASSWORD_DIGEST)
    .toString('hex');
  return `pbkdf2$${PASSWORD_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password, storedHash) {
  const passwordText = String(password);
  if (!storedHash || typeof storedHash !== 'string') return false;
  const [algo, iterStr, salt, hash] = storedHash.split('$');
  if (algo !== 'pbkdf2' || !iterStr || !salt || !hash) return false;
  const iterations = Number(iterStr);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;
  const derived = crypto
    .pbkdf2Sync(passwordText, salt, iterations, PASSWORD_KEYLEN, PASSWORD_DIGEST)
    .toString('hex');
  const derivedBuf = Buffer.from(derived, 'hex');
  const hashBuf = Buffer.from(hash, 'hex');
  if (derivedBuf.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(derivedBuf, hashBuf);
}
