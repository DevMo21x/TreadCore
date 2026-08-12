export type Segment = {
  id?: number;
  name?: string | null;
  duration_seconds: number;
  speed: number;
  incline: number;
  position?: number;
};

export type Preset = {
  id: number;
  name: string;
  description?: string | null;
  tags?: string | null;
  difficulty?: string;
  totalDurationSeconds?: number;
  authorId?: number | null;
  visibility?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  segments?: Segment[];
};

/**
 * Shape returned by /api/presets and /api/presets/[id] endpoints.
 * Covers both success payloads and error responses.
 */
export type PresetApiResponse = {
  id?: number;
  name?: string;
  error?: string;
  message?: string;
  /** Preserved raw text when the response body is not valid JSON. */
  text?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
  segments?: Segment[];
};
