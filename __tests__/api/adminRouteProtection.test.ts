import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ADMIN_ROLE, USER_ROLE } from '@/lib/auth/sessionUser';
import { makeSelectChain } from './helpers/drizzleChains';

const {
  mockAuth,
  mockDbDelete,
  mockDbSelect,
  mockDbUpdate,
  mockGetCategories,
  mockAddCategory,
  mockUpdateCategory,
  mockDeleteCategory,
  mockGetAllVideos,
  mockUpdateVideo,
  mockDeleteVideo,
  mockAddVideo,
  mockGetCategoryByName,
  mockHashPin,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbDelete: vi.fn(),
  mockDbSelect: vi.fn(),
  mockDbUpdate: vi.fn(),
  mockGetCategories: vi.fn(),
  mockAddCategory: vi.fn(),
  mockUpdateCategory: vi.fn(),
  mockDeleteCategory: vi.fn(),
  mockGetAllVideos: vi.fn(),
  mockUpdateVideo: vi.fn(),
  mockDeleteVideo: vi.fn(),
  mockAddVideo: vi.fn(),
  mockGetCategoryByName: vi.fn(),
  mockHashPin: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/db/index', () => ({
  default: {
    delete: mockDbDelete,
    select: mockDbSelect,
    update: mockDbUpdate,
  },
}));

vi.mock('@/lib/auth/scrypt', () => ({
  hashPin: mockHashPin,
}));

vi.mock('@/lib/video', () => ({
  getCategories: mockGetCategories,
  addCategory: mockAddCategory,
  updateCategory: mockUpdateCategory,
  deleteCategory: mockDeleteCategory,
  getAllVideos: mockGetAllVideos,
  updateVideo: mockUpdateVideo,
  deleteVideo: mockDeleteVideo,
  addVideo: mockAddVideo,
  getCategoryByName: mockGetCategoryByName,
}));

import {
  GET as getCategoriesRoute,
  POST as postCategoriesRoute,
} from '@/app/api/admin/categories/route';
import {
  PATCH as patchCategoryRoute,
  DELETE as deleteCategoryRoute,
} from '@/app/api/admin/categories/[id]/route';
import { GET as getVideosRoute } from '@/app/api/admin/videos/route';
import {
  PATCH as patchVideoRoute,
  DELETE as deleteVideoRoute,
} from '@/app/api/admin/videos/[id]/route';
import { POST as uploadRoute } from '@/app/api/admin/upload/route';
import { GET as getUsersRoute } from '@/app/api/admin/users/route';
import {
  PATCH as patchUserRoute,
  DELETE as deleteUserRoute,
} from '@/app/api/admin/users/[id]/route';

function buildAdminSession(role: typeof ADMIN_ROLE | typeof USER_ROLE = ADMIN_ROLE) {
  return { user: { id: '1', role } };
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

function buildGetRequest(url: string) {
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(buildAdminSession());
  mockHashPin.mockResolvedValue('hashed-pin');
  mockGetCategories.mockResolvedValue([{ id: 1, name: 'Atlantic', thumbnailPath: '/thumb.jpg' }]);
  mockAddCategory.mockResolvedValue({ id: 2, name: 'Pacific', thumbnailPath: '/pacific.jpg' });
  mockUpdateCategory.mockResolvedValue({ id: 1, name: 'Updated', thumbnailPath: '/updated.jpg' });
  mockDeleteCategory.mockResolvedValue({ deleted: { id: 1, name: 'Atlantic', thumbnailPath: '' } });
  mockGetAllVideos.mockResolvedValue([
    {
      id: 10,
      filename: 'trail-run',
      title: 'Trail Run',
      categoryId: 1,
      categoryName: 'Atlantic',
      thumbnailPath: '/thumb.jpg',
      videoPath: '/video.mp4',
      isVisible: true,
      createdAt: '2026-05-06T00:00:00.000Z',
    },
  ]);
  mockUpdateVideo.mockResolvedValue({
    id: 10,
    filename: 'trail-run',
    title: 'Updated Trail Run',
    categoryId: 1,
    thumbnailPath: '/thumb.jpg',
    videoPath: '/video.mp4',
    isVisible: true,
    createdAt: '2026-05-06T00:00:00.000Z',
  });
  mockDeleteVideo.mockResolvedValue({
    id: 10,
    filename: 'trail-run',
    title: 'Trail Run',
    categoryId: 1,
    thumbnailPath: '/thumb.jpg',
    videoPath: '/video.mp4',
    isVisible: true,
    createdAt: '2026-05-06T00:00:00.000Z',
  });
  mockAddVideo.mockResolvedValue({
    id: 99,
    filename: 'cover',
    title: 'Cover',
    categoryId: 1,
    thumbnailPath: '/thumb.jpg',
    videoPath: '/video.mp4',
    isVisible: true,
    createdAt: '2026-05-06T00:00:00.000Z',
  });
  mockGetCategoryByName.mockResolvedValue({ id: 1, name: 'Atlantic', thumbnailPath: '/thumb.jpg' });
});

describe('admin API route protection', () => {
  it.each([
    {
      name: 'GET /api/admin/categories',
      invoke: () => getCategoriesRoute(),
    },
    {
      name: 'POST /api/admin/categories',
      invoke: () =>
        postCategoriesRoute(
          buildJsonRequest('http://localhost/api/admin/categories', 'POST', {
            name: 'New Region',
            thumbnailPath: '/new.jpg',
          })
        ),
    },
    {
      name: 'PATCH /api/admin/categories/[id]',
      invoke: () =>
        patchCategoryRoute(
          buildJsonRequest('http://localhost/api/admin/categories/1', 'PATCH', { name: 'Updated' }),
          buildRouteContext('1')
        ),
    },
    {
      name: 'DELETE /api/admin/categories/[id]',
      invoke: () =>
        deleteCategoryRoute(
          new NextRequest('http://localhost/api/admin/categories/1', { method: 'DELETE' }),
          buildRouteContext('1')
        ),
    },
    {
      name: 'GET /api/admin/videos',
      invoke: () => getVideosRoute(),
    },
    {
      name: 'PATCH /api/admin/videos/[id]',
      invoke: () =>
        patchVideoRoute(
          buildJsonRequest('http://localhost/api/admin/videos/10', 'PATCH', { title: 'Updated' }),
          buildRouteContext('10')
        ),
    },
    {
      name: 'DELETE /api/admin/videos/[id]',
      invoke: () =>
        deleteVideoRoute(
          new NextRequest('http://localhost/api/admin/videos/10', { method: 'DELETE' }),
          buildRouteContext('10')
        ),
    },
    {
      name: 'POST /api/admin/upload',
      invoke: () =>
        uploadRoute(new NextRequest('http://localhost/api/admin/upload', { method: 'POST' })),
    },
    {
      name: 'GET /api/admin/users',
      invoke: () => getUsersRoute(buildGetRequest('http://localhost/api/admin/users')),
    },
    {
      name: 'PATCH /api/admin/users/[id]',
      invoke: () =>
        patchUserRoute(
          buildJsonRequest('http://localhost/api/admin/users/2', 'PATCH', { role: USER_ROLE }),
          buildRouteContext('2')
        ),
    },
    {
      name: 'DELETE /api/admin/users/[id]',
      invoke: () =>
        deleteUserRoute(
          new NextRequest('http://localhost/api/admin/users/2', { method: 'DELETE' }),
          buildRouteContext('2')
        ),
    },
  ])('returns 403 when unauthenticated for $name', async ({ invoke }) => {
    mockAuth.mockResolvedValueOnce(null);

    const response = await invoke();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });
  });

  it('returns 403 for non-admin users on admin routes', async () => {
    mockAuth.mockResolvedValueOnce(buildAdminSession(USER_ROLE));

    const response = await getVideosRoute();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });
    expect(mockGetAllVideos).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin users on admin user routes', async () => {
    mockAuth.mockResolvedValueOnce(buildAdminSession(USER_ROLE));

    const response = await getUsersRoute(buildGetRequest('http://localhost/api/admin/users'));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });
    expect(mockDbSelect).not.toHaveBeenCalled();
  });

  it('allows admins to fetch categories', async () => {
    const response = await getCategoriesRoute();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetCategories).toHaveBeenCalledOnce();
    expect(body).toEqual([{ id: 1, name: 'Atlantic', thumbnailPath: '/thumb.jpg' }]);
  });

  it('allows admins to create categories', async () => {
    const response = await postCategoriesRoute(
      buildJsonRequest('http://localhost/api/admin/categories', 'POST', {
        name: 'Pacific',
        thumbnailPath: '/pacific.jpg',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockAddCategory).toHaveBeenCalledWith({
      name: 'Pacific',
      thumbnailPath: '/pacific.jpg',
    });
    expect(body).toEqual({ id: 2, name: 'Pacific', thumbnailPath: '/pacific.jpg' });
  });

  it('allows admins to update and delete categories', async () => {
    const patchResponse = await patchCategoryRoute(
      buildJsonRequest('http://localhost/api/admin/categories/1', 'PATCH', { name: 'Updated' }),
      buildRouteContext('1')
    );
    const deleteResponse = await deleteCategoryRoute(
      new NextRequest('http://localhost/api/admin/categories/1', { method: 'DELETE' }),
      buildRouteContext('1')
    );

    expect(patchResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(mockUpdateCategory).toHaveBeenCalledWith(1, { name: 'Updated' });
    expect(mockDeleteCategory).toHaveBeenCalledWith(1);
  });

  it('allows admins to fetch, update, and delete videos', async () => {
    const getResponse = await getVideosRoute();
    const patchResponse = await patchVideoRoute(
      buildJsonRequest('http://localhost/api/admin/videos/10', 'PATCH', { title: 'Updated' }),
      buildRouteContext('10')
    );
    const deleteResponse = await deleteVideoRoute(
      new NextRequest('http://localhost/api/admin/videos/10', { method: 'DELETE' }),
      buildRouteContext('10')
    );

    expect(getResponse.status).toBe(200);
    expect(patchResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(mockGetAllVideos).toHaveBeenCalledOnce();
    expect(mockUpdateVideo).toHaveBeenCalledWith(10, { title: 'Updated' });
    expect(mockDeleteVideo).toHaveBeenCalledWith(10);
  });

  it('allows admins through the upload guard and into route validation', async () => {
    const formData = new FormData();
    formData.set('categoryName', 'Atlantic');

    const response = await uploadRoute({
      formData: async () => formData,
    } as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'at least one file (video or thumbnail) is required' });
  });

  it('allows admins to fetch non-guest users', async () => {
    mockDbSelect
      .mockReturnValueOnce(makeSelectChain([{ value: 2 }]))
      .mockReturnValueOnce(makeSelectChain([{ value: 1 }]))
      .mockReturnValueOnce(
        makeSelectChain([
          { id: 1, username: 'admin-user', role: ADMIN_ROLE, createdAt: new Date('2026-05-06') },
          { id: 2, username: 'member-user', role: USER_ROLE, createdAt: new Date('2026-05-07') },
        ])
      );

    const response = await getUsersRoute(buildGetRequest('http://localhost/api/admin/users'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      items: [
        {
          id: 1,
          username: 'admin-user',
          role: ADMIN_ROLE,
          createdAt: '2026-05-06T00:00:00.000Z',
        },
        {
          id: 2,
          username: 'member-user',
          role: USER_ROLE,
          createdAt: '2026-05-07T00:00:00.000Z',
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
});
