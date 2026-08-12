import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ADMIN_ROLE, USER_ROLE } from '@/lib/auth/sessionUser';
import { makeDeleteChain, makeSelectChain, makeUpdateChain } from './helpers/drizzleChains';

const { mockAuth, mockDelete, mockHashPin, mockSelect, mockUpdate } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDelete: vi.fn(),
  mockHashPin: vi.fn(),
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/db/index', () => ({
  default: {
    delete: mockDelete,
    select: mockSelect,
    update: mockUpdate,
  },
}));

vi.mock('@/lib/auth/scrypt', () => ({
  hashPin: mockHashPin,
}));

import { DELETE, PATCH } from '@/app/api/admin/users/[id]/route';
import { GET } from '@/app/api/admin/users/route';

function buildAdminSession(role: typeof ADMIN_ROLE | typeof USER_ROLE = ADMIN_ROLE, id = '1') {
  return { user: { id, role } };
}

function buildRouteContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function buildJsonRequest(url: string, method: string, body: unknown = {}) {
  return new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

function buildGetRequest(search = '') {
  return new NextRequest(`http://localhost/api/admin/users${search}`);
}

function mockPaginatedUserQueries(options: {
  adminCount: number;
  rows: Array<{
    createdAt: Date;
    id: number;
    role: typeof ADMIN_ROLE | typeof USER_ROLE;
    username: string;
  }>;
  totalUsers: number;
}) {
  const listChain = makeSelectChain(options.rows);

  mockSelect
    .mockReturnValueOnce(makeSelectChain([{ value: options.totalUsers }]))
    .mockReturnValueOnce(makeSelectChain([{ value: options.adminCount }]))
    .mockReturnValueOnce(listChain);

  return listChain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(buildAdminSession());
  mockHashPin.mockResolvedValue('hashed-pin');
});

describe('GET /api/admin/users', () => {
  it('returns 403 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const response = await GET(buildGetRequest());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin users', async () => {
    mockAuth.mockResolvedValueOnce(buildAdminSession(USER_ROLE));

    const response = await GET(buildGetRequest());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('returns non-guest users and keeps admins in the result set', async () => {
    const rows = [
      { id: 1, username: 'admin-user', role: ADMIN_ROLE, createdAt: new Date('2026-01-01') },
      { id: 2, username: 'member-user', role: USER_ROLE, createdAt: new Date('2026-01-02') },
    ];
    mockPaginatedUserQueries({ adminCount: 1, rows, totalUsers: 2 });

    const response = await GET(buildGetRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      items: [
        {
          id: 1,
          username: 'admin-user',
          role: ADMIN_ROLE,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          username: 'member-user',
          role: USER_ROLE,
          createdAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      summary: {
        totalUsers: 2,
        adminCount: 1,
        memberCount: 1,
      },
      pagination: {
        currentPage: 1,
        pageSize: 8,
        pageCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });

  it('returns an empty list when there are no non-guest users to show', async () => {
    mockPaginatedUserQueries({ adminCount: 0, rows: [], totalUsers: 0 });

    const response = await GET(buildGetRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: [],
      summary: {
        totalUsers: 0,
        adminCount: 0,
        memberCount: 0,
      },
      pagination: {
        currentPage: 1,
        pageSize: 8,
        pageCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });

  it('applies page and pageSize parameters when fetching later pages', async () => {
    const rows = [
      { id: 9, username: 'member-nine', role: USER_ROLE, createdAt: new Date('2026-01-09') },
    ];
    const listChain = mockPaginatedUserQueries({ adminCount: 1, rows, totalUsers: 9 });

    const response = await GET(buildGetRequest('?page=2&pageSize=8'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pagination).toEqual({
      currentPage: 2,
      pageSize: 8,
      pageCount: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
    expect(listChain.orderBy).toHaveBeenCalledTimes(1);
    expect(listChain.limit).toHaveBeenCalledWith(8);
    expect(listChain.offset).toHaveBeenCalledWith(8);
  });

  it('filters users by the query string when searching usernames', async () => {
    const rows = [
      { id: 9, username: 'member-nine', role: USER_ROLE, createdAt: new Date('2026-01-09') },
    ];
    const listChain = mockPaginatedUserQueries({ adminCount: 0, rows, totalUsers: 1 });

    const response = await GET(buildGetRequest('?query=member-9&page=1&pageSize=8'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toEqual({
      totalUsers: 1,
      adminCount: 0,
      memberCount: 1,
    });
    expect(body.items).toEqual([
      {
        id: 9,
        username: 'member-nine',
        role: USER_ROLE,
        createdAt: '2026-01-09T00:00:00.000Z',
      },
    ]);
    expect(listChain.orderBy).toHaveBeenCalledTimes(1);
    expect(listChain.limit).toHaveBeenCalledWith(8);
    expect(listChain.offset).toHaveBeenCalledWith(0);
  });
});

describe('PATCH /api/admin/users/[id]', () => {
  it('returns 400 for a non-integer user id', async () => {
    const response = await PATCH(
      buildJsonRequest('http://localhost/api/admin/users/2.9', 'PATCH', {
        role: USER_ROLE,
      }),
      buildRouteContext('2.9')
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid user ID' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/admin/users/[id]', () => {
  it('returns 400 for an invalid user id', async () => {
    const response = await PATCH(
      buildJsonRequest('http://localhost/api/admin/users/not-a-number', 'PATCH', {
        role: USER_ROLE,
      }),
      buildRouteContext('not-a-number')
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid user ID' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 when both role and pin are provided', async () => {
    const response = await PATCH(
      buildJsonRequest('http://localhost/api/admin/users/2', 'PATCH', {
        role: USER_ROLE,
        pin: '1234',
      }),
      buildRouteContext('2')
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Cannot set both role and pin' });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockHashPin).not.toHaveBeenCalled();
  });

  it('returns 400 when neither role nor pin is provided', async () => {
    const response = await PATCH(
      buildJsonRequest('http://localhost/api/admin/users/2', 'PATCH', {}),
      buildRouteContext('2')
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Must provide role or pin' });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockHashPin).not.toHaveBeenCalled();
  });

  it('updates a non-guest user role', async () => {
    const chain = makeUpdateChain([{ id: 2, username: 'member-user', role: ADMIN_ROLE }]);
    mockUpdate.mockReturnValue(chain);

    const response = await PATCH(
      buildJsonRequest('http://localhost/api/admin/users/2', 'PATCH', { role: ADMIN_ROLE }),
      buildRouteContext('2')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ id: 2, username: 'member-user', role: ADMIN_ROLE });
    expect(chain.set).toHaveBeenCalledWith({ role: ADMIN_ROLE });
  });

  it('blocks self-demotion', async () => {
    mockAuth.mockResolvedValueOnce(buildAdminSession(ADMIN_ROLE, '3'));

    const response = await PATCH(
      buildJsonRequest('http://localhost/api/admin/users/3', 'PATCH', { role: USER_ROLE }),
      buildRouteContext('3')
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Cannot demote yourself' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('validates and hashes a new pin before updating the user password', async () => {
    const chain = makeUpdateChain([{ id: 2, username: 'member-user', role: USER_ROLE }]);
    mockUpdate.mockReturnValue(chain);

    const response = await PATCH(
      buildJsonRequest('http://localhost/api/admin/users/2', 'PATCH', { pin: '1234' }),
      buildRouteContext('2')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ id: 2, username: 'member-user', role: USER_ROLE });
    expect(mockHashPin).toHaveBeenCalledWith('1234');
    expect(chain.set).toHaveBeenCalledWith({ password: 'hashed-pin' });
  });

  it('returns 400 when the replacement pin is invalid', async () => {
    const response = await PATCH(
      buildJsonRequest('http://localhost/api/admin/users/2', 'PATCH', { pin: '12ab' }),
      buildRouteContext('2')
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid request body' });
    expect(mockHashPin).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 404 when a guest user is targeted for a role update', async () => {
    mockUpdate.mockReturnValue(makeUpdateChain([]));

    const response = await PATCH(
      buildJsonRequest('http://localhost/api/admin/users/2', 'PATCH', { role: USER_ROLE }),
      buildRouteContext('2')
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'User not found' });
  });

  it('returns 404 when a guest user is targeted for a pin reset', async () => {
    mockUpdate.mockReturnValue(makeUpdateChain([]));

    const response = await PATCH(
      buildJsonRequest('http://localhost/api/admin/users/2', 'PATCH', { pin: '1234' }),
      buildRouteContext('2')
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'User not found' });
  });
});

describe('DELETE /api/admin/users/[id]', () => {
  it('returns 400 for an invalid user id', async () => {
    const response = await DELETE(
      new NextRequest('http://localhost/api/admin/users/0', { method: 'DELETE' }),
      buildRouteContext('0')
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid user ID' });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('blocks self-deletion', async () => {
    mockAuth.mockResolvedValueOnce(buildAdminSession(ADMIN_ROLE, '4'));

    const response = await DELETE(
      new NextRequest('http://localhost/api/admin/users/4', { method: 'DELETE' }),
      buildRouteContext('4')
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('deletes a non-guest user and returns the deleted record', async () => {
    const chain = makeDeleteChain([{ id: 2, username: 'member-user', role: USER_ROLE }]);
    mockDelete.mockReturnValue(chain);

    const response = await DELETE(
      new NextRequest('http://localhost/api/admin/users/2', { method: 'DELETE' }),
      buildRouteContext('2')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ id: 2, username: 'member-user', role: USER_ROLE });
  });

  it('returns 404 when a guest user is targeted for deletion', async () => {
    mockDelete.mockReturnValue(makeDeleteChain([]));

    const response = await DELETE(
      new NextRequest('http://localhost/api/admin/users/2', { method: 'DELETE' }),
      buildRouteContext('2')
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'User not found' });
  });
});
