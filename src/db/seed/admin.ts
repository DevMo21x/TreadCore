import db from '../index';
import { users } from '../schema/users';
import { eq } from 'drizzle-orm';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

async function hashPin(pin: string): Promise<string> {
  const normalizedPin = pin.normalize('NFKC');
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(normalizedPin, salt, KEY_LENGTH)) as Buffer;

  return `${salt}:${derivedKey.toString('hex')}`;
}

async function seedAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists. Skipping seed.');
      return;
    }

    // Hash the password using your scrypt utility
    const hashedPassword = await hashPin('1234');

    // Insert admin user
    const result = await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      weightKg: null,
      ageYears: null,
    });

    console.log('✓ Admin user created successfully');
  } catch (error) {
    console.error('✗ Failed to seed admin user:', error);
    process.exit(1);
  }
}

seedAdminUser();
