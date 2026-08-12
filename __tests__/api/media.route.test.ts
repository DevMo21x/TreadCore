import { beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';
import { NextRequest } from 'next/server';
import { Readable } from 'stream';

const { mockStat, mockCreateReadStream } = vi.hoisted(() => ({
  mockStat: vi.fn(),
  mockCreateReadStream: vi.fn(),
}));

vi.mock('@/lib/media/paths', () => ({
  MEDIA_DIR: '/media',
}));

vi.mock('fs', () => ({
  default: {
    promises: {
      stat: mockStat,
    },
    createReadStream: mockCreateReadStream,
  },
}));

import { GET } from '@/app/api/media/[...path]/route';

const EXPECTED_FILE_PATH = path.resolve('/media', 'videos', 'scenic', 'sample.mp4');

function buildMediaRequest(headers?: HeadersInit) {
  return new NextRequest('http://localhost/api/media/videos/scenic/sample.mp4', {
    headers,
  });
}

function buildRouteContext() {
  return {
    params: Promise.resolve({
      path: ['videos', 'scenic', 'sample.mp4'],
    }),
  };
}

describe('media route range requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStat.mockResolvedValue({
      size: 4096,
      isFile: () => true,
    });
    mockCreateReadStream.mockImplementation(
      (_fullPath: string, options?: { start?: number; end?: number }) => {
        const length =
          typeof options?.start === 'number' && typeof options?.end === 'number'
            ? options.end - options.start + 1
            : 4096;

        return Readable.from([Buffer.alloc(length)]);
      }
    );
  });

  it('returns partial content for valid byte ranges', async () => {
    const response = await GET(buildMediaRequest({ range: 'bytes=0-1023' }), buildRouteContext());

    expect(response.status).toBe(206);
    expect(response.headers.get('Content-Type')).toBe('video/mp4');
    expect(response.headers.get('Accept-Ranges')).toBe('bytes');
    expect(response.headers.get('Content-Range')).toBe('bytes 0-1023/4096');
    expect(response.headers.get('Content-Length')).toBe('1024');
    expect(mockCreateReadStream).toHaveBeenCalledTimes(1);
    expect(mockCreateReadStream).toHaveBeenCalledWith(EXPECTED_FILE_PATH, {
      start: 0,
      end: 1023,
    });
  });

  it('clamps oversized range ends to the file size', async () => {
    const response = await GET(
      buildMediaRequest({ range: 'bytes=1024-999999' }),
      buildRouteContext()
    );

    expect(response.status).toBe(206);
    expect(response.headers.get('Content-Range')).toBe('bytes 1024-4095/4096');
    expect(response.headers.get('Content-Length')).toBe('3072');
    expect(mockCreateReadStream).toHaveBeenCalledWith(EXPECTED_FILE_PATH, {
      start: 1024,
      end: 4095,
    });
  });

  it('returns the full file when no range header is provided', async () => {
    const response = await GET(buildMediaRequest(), buildRouteContext());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('video/mp4');
    expect(response.headers.get('Accept-Ranges')).toBe('bytes');
    expect(response.headers.get('Content-Range')).toBeNull();
    expect(response.headers.get('Content-Length')).toBe('4096');
    expect(mockCreateReadStream).toHaveBeenCalledTimes(1);
    expect(mockCreateReadStream).toHaveBeenCalledWith(EXPECTED_FILE_PATH);
  });

  it('returns 416 for unsatisfiable ranges without streaming the full file', async () => {
    const response = await GET(
      buildMediaRequest({ range: 'bytes=5000-6000' }),
      buildRouteContext()
    );

    expect(response.status).toBe(416);
    await expect(response.json()).resolves.toEqual({ error: 'Range Not Satisfiable' });
    expect(mockCreateReadStream).not.toHaveBeenCalled();
  });
});
