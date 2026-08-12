import { NextRequest, NextResponse } from 'next/server';
import { and, eq, ne } from 'drizzle-orm';

import { auth } from '@/auth';
import db from '@/db/index';
import { users } from '@/db/schema';
import { hashPin } from '@/lib/auth/scrypt';
import { isAdminSession } from '@/lib/auth/sessionGuards';
import { ADMIN_ROLE, GUEST_ROLE, USER_ROLE } from '@/lib/auth/sessionUser';
import { pinSchema } from '@/lib/users/pinValidation';

function parsePositiveInteger(value: string) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  return Number.parseInt(value, 10);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const adminUserRouteErrors = {
  forbidden: 'Forbidden',
  invalidRequestBody: 'Invalid request body',
  invalidUserId: 'Invalid user ID',
  missingMutationField: 'Must provide role or pin',
  mutuallyExclusiveMutationField: 'Cannot set both role and pin',
  selfDemotion: 'Cannot demote yourself',
  userNotFound: 'User not found',
} as const;

const userMutationReturningShape = {
  id: users.id,
  username: users.username,
  role: users.role,
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: adminUserRouteErrors.forbidden }, { status: 403 });
  }

  const { id } = await params;
  const userId = parsePositiveInteger(id);
  if (!userId) {
    return NextResponse.json({ error: adminUserRouteErrors.invalidUserId }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: adminUserRouteErrors.invalidRequestBody }, { status: 400 });
  }

  if (!isPlainObject(body)) {
    return NextResponse.json({ error: adminUserRouteErrors.invalidRequestBody }, { status: 400 });
  }

  const hasRole = Object.prototype.hasOwnProperty.call(body, 'role');
  const hasPin = Object.prototype.hasOwnProperty.call(body, 'pin');

  if (hasRole && hasPin) {
    return NextResponse.json(
      { error: adminUserRouteErrors.mutuallyExclusiveMutationField },
      { status: 400 }
    );
  }

  if (!hasRole && !hasPin) {
    return NextResponse.json({ error: adminUserRouteErrors.missingMutationField }, { status: 400 });
  }

  if (hasRole) {
    if (body.role !== USER_ROLE && body.role !== ADMIN_ROLE) {
      return NextResponse.json({ error: adminUserRouteErrors.invalidRequestBody }, { status: 400 });
    }

    if (Number.parseInt(session.user.id, 10) === userId && body.role !== ADMIN_ROLE) {
      return NextResponse.json({ error: adminUserRouteErrors.selfDemotion }, { status: 400 });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ role: body.role })
      .where(and(eq(users.id, userId), ne(users.role, GUEST_ROLE)))
      .returning(userMutationReturningShape);

    if (!updatedUser) {
      return NextResponse.json({ error: adminUserRouteErrors.userNotFound }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  }

  const parsedPin = pinSchema.safeParse(body.pin);
  if (!parsedPin.success) {
    return NextResponse.json({ error: adminUserRouteErrors.invalidRequestBody }, { status: 400 });
  }

  const passwordHash = await hashPin(parsedPin.data);
  const [updatedUser] = await db
    .update(users)
    .set({ password: passwordHash })
    .where(and(eq(users.id, userId), ne(users.role, GUEST_ROLE)))
    .returning(userMutationReturningShape);

  if (!updatedUser) {
    return NextResponse.json({ error: adminUserRouteErrors.userNotFound }, { status: 404 });
  }

  return NextResponse.json(updatedUser);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: adminUserRouteErrors.forbidden }, { status: 403 });
  }

  const { id } = await params;
  const userId = parsePositiveInteger(id);
  if (!userId) {
    return NextResponse.json({ error: adminUserRouteErrors.invalidUserId }, { status: 400 });
  }

  if (Number.parseInt(session.user.id, 10) === userId) {
    return NextResponse.json({ error: adminUserRouteErrors.forbidden }, { status: 403 });
  }

  const [deletedUser] = await db
    .delete(users)
    .where(and(eq(users.id, userId), ne(users.role, GUEST_ROLE)))
    .returning(userMutationReturningShape);

  if (!deletedUser) {
    return NextResponse.json({ error: adminUserRouteErrors.userNotFound }, { status: 404 });
  }

  return NextResponse.json(deletedUser);
}
