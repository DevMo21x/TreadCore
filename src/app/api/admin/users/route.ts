import { NextRequest, NextResponse } from 'next/server';
import { and, asc, count, eq, ne, sql } from 'drizzle-orm';

import { auth } from '@/auth';
import db from '@/db/index';
import { users } from '@/db/schema';
import { isAdminSession } from '@/lib/auth/sessionGuards';
import { ADMIN_ROLE, GUEST_ROLE } from '@/lib/auth/sessionUser';
import { normalizeUsername, USERNAME_MAX_LENGTH } from '@/lib/users/usernameValidation';

const DEFAULT_ADMIN_USERS_PAGE_SIZE = 8;
const MAX_ADMIN_USERS_PAGE_SIZE = 24;

function parsePositiveInteger(value: string | null) {
  if (!value) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return null;
  }

  return parsedValue;
}

function parseSearchQuery(value: string | null) {
  if (!value) {
    return '';
  }

  return normalizeUsername(value).slice(0, USERNAME_MAX_LENGTH);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const requestedPage = parsePositiveInteger(request.nextUrl.searchParams.get('page')) ?? 1;
  const requestedPageSize =
    parsePositiveInteger(request.nextUrl.searchParams.get('pageSize')) ??
    DEFAULT_ADMIN_USERS_PAGE_SIZE;
  const searchQuery = parseSearchQuery(request.nextUrl.searchParams.get('query'));
  const pageSize = Math.min(requestedPageSize, MAX_ADMIN_USERS_PAGE_SIZE);
  const searchFilter =
    searchQuery.length > 0
      ? sql`lower(${users.username}) like ${`%${searchQuery.toLowerCase()}%`}`
      : null;
  const visibleUsersFilter = searchFilter
    ? and(ne(users.role, GUEST_ROLE), searchFilter)
    : ne(users.role, GUEST_ROLE);
  const visibleAdminsFilter = searchFilter
    ? and(eq(users.role, ADMIN_ROLE), searchFilter)
    : eq(users.role, ADMIN_ROLE);

  // Summary counts and page rows are fetched separately to keep the paginated search query
  // straightforward. They can momentarily drift under concurrent writes, which is acceptable
  // for this admin-only view.
  const [totalUserRows, adminCountRows] = await Promise.all([
    db
      .select({ value: count(users.id) })
      .from(users)
      .where(visibleUsersFilter),
    db
      .select({ value: count(users.id) })
      .from(users)
      .where(visibleAdminsFilter),
  ]);

  const totalUsers = totalUserRows[0]?.value ?? 0;
  const adminCount = adminCountRows[0]?.value ?? 0;
  const memberCount = Math.max(totalUsers - adminCount, 0);
  const pageCount = totalUsers > 0 ? Math.ceil(totalUsers / pageSize) : 1;
  const currentPage = Math.min(requestedPage, pageCount);
  const offset = (currentPage - 1) * pageSize;

  const result = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(visibleUsersFilter)
    .orderBy(asc(users.id))
    .limit(pageSize)
    .offset(offset);

  return NextResponse.json({
    items: result,
    summary: {
      totalUsers,
      adminCount,
      memberCount,
    },
    pagination: {
      currentPage,
      pageSize,
      pageCount,
      hasNextPage: currentPage < pageCount,
      hasPreviousPage: currentPage > 1,
    },
  });
}
