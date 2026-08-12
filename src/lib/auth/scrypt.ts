// This file is used as a helper module to Hash and verify PIN numbers
import 'server-only';

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPin(pin: string): Promise<string> {
  const normalizedPin = pin.normalize('NFKC');
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(normalizedPin, salt, KEY_LENGTH)) as Buffer;

  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const [salt, storedKeyHex] = storedHash.split(':');

  if (!salt || !storedKeyHex) {
    return false;
  }

  const normalizedPin = pin.normalize('NFKC');
  const derivedKey = (await scrypt(normalizedPin, salt, KEY_LENGTH)) as Buffer;
  const storedKey = Buffer.from(storedKeyHex, 'hex');

  if (derivedKey.length !== storedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedKey);
}
