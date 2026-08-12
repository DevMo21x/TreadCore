'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyboardContainer } from '@/components/keyboard/KeyboardContainer';
import {
  MAX_AGE_YEARS,
  MAX_WEIGHT_KG,
  MIN_AGE_YEARS,
  MIN_WEIGHT_KG,
} from '@/lib/users/profileMetricsValidation';
import {
  type UpdateCurrentProfileMetricsFormState,
  updateCurrentProfileMetricsFormAction,
} from '@/lib/actions/user';

const initialUpdateCurrentProfileMetricsFormState: UpdateCurrentProfileMetricsFormState = {
  status: 'idle',
  message: '',
};

const DIGIT_PATTERN = /^[0-9]$/;

const numberFormatter = new Intl.NumberFormat('en-CA', {
  maximumFractionDigits: 1,
});

function formatWeight(weightKg: number | null) {
  if (weightKg === null) return 'Not set';
  return `${numberFormatter.format(weightKg)} kg`;
}

function formatAge(ageYears: number | null) {
  if (ageYears === null) return 'Not set';
  return `${ageYears} years`;
}

function toInputValue(value: number | null) {
  return value === null ? '' : String(value);
}

function appendWeightCharacter(value: string, key: string) {
  if (DIGIT_PATTERN.test(key)) return value + key;
  if (key === '.' && !value.includes('.')) return value.length === 0 ? '0.' : value + key;
  return value;
}

type MetricsField = 'weightKg' | 'ageYears';

const CARD_CLASSES =
  'rounded-3xl border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-panel)] shadow-lg backdrop-blur-sm';

export function EditProfileMetricsSection({
  weightKg,
  ageYears,
  onMetricsUpdated,
}: Readonly<{
  weightKg: number | null;
  ageYears: number | null;
  onMetricsUpdated?: (updatedWeightKg: number | null, updatedAgeYears: number | null) => void;
}>) {
  const router = useRouter();
  const [currentWeightKg, setCurrentWeightKg] = useState(weightKg);
  const [currentAgeYears, setCurrentAgeYears] = useState(ageYears);
  const [isEditing, setIsEditing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [draftWeightKg, setDraftWeightKg] = useState(toInputValue(weightKg));
  const [draftAgeYears, setDraftAgeYears] = useState(toInputValue(ageYears));
  const [activeField, setActiveField] = useState<MetricsField>('weightKg');
  const [isPending, setIsPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleReveal() {
    setSuccessMessage('');
    setDraftWeightKg(toInputValue(currentWeightKg));
    setDraftAgeYears(toInputValue(currentAgeYears));
    setActiveField('weightKg');
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setFormKey((k) => k + 1);
  }

  function handleSuccess(
    updatedWeightKg: number | null,
    updatedAgeYears: number | null,
    message: string
  ) {
    setCurrentWeightKg(updatedWeightKg);
    setCurrentAgeYears(updatedAgeYears);
    setSuccessMessage(message);
    setIsEditing(false);
    setFormKey((k) => k + 1);
    onMetricsUpdated?.(updatedWeightKg, updatedAgeYears);
    router.refresh();
  }

  function handleKey(key: string) {
    if (isPending) return;

    if (activeField === 'weightKg') {
      setDraftWeightKg((value) => appendWeightCharacter(value, key));
      return;
    }

    if (DIGIT_PATTERN.test(key)) {
      setDraftAgeYears((value) => value + key);
    }
  }

  function handleBackspace() {
    if (isPending) return;

    if (activeField === 'weightKg') {
      setDraftWeightKg((value) => value.slice(0, -1));
    } else {
      setDraftAgeYears((value) => value.slice(0, -1));
    }
  }

  function handleEnter() {
    if (isPending) return;

    if (activeField === 'weightKg') {
      setActiveField('ageYears');
      return;
    }

    formRef.current?.requestSubmit();
  }

  if (isEditing) {
    return (
      <div className="flex h-full gap-4">
        <section className={`flex flex-1 flex-col max-h-[640px] p-5 ${CARD_CLASSES}`}>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hg-muted)]">
              Personal Metrics
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--hg-text)]">Weight And Age</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--hg-muted)]">
              Add your weight and age so the treadmill can use them for more accurate calorie
              estimates.
            </p>
          </div>

          <div className="mt-4 grid gap-4 rounded-3xl border border-[color:var(--hg-border-soft)] bg-[color:var(--hg-interactive-soft)] p-4 backdrop-blur-sm sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-[var(--hg-muted)]">Weight</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--hg-text)]">
                {formatWeight(currentWeightKg)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--hg-muted)]">Age</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--hg-text)]">
                {formatAge(currentAgeYears)}
              </p>
            </div>
          </div>

          <EditProfileMetricsForm
            key={formKey}
            formRef={formRef}
            draftWeightKg={draftWeightKg}
            draftAgeYears={draftAgeYears}
            activeField={activeField}
            onFocusWeight={() => setActiveField('weightKg')}
            onFocusAge={() => setActiveField('ageYears')}
            onPendingChange={setIsPending}
            onSuccess={handleSuccess}
          />
        </section>

        <div className={`w-[640px] h-[640px] shrink-0 p-4 ${CARD_CLASSES}`}>
          <KeyboardContainer
            mode="number"
            onKey={handleKey}
            onBackspace={handleBackspace}
            onCancel={handleCancel}
            onEnter={handleEnter}
            disabled={isPending}
            compact
          />
        </div>
      </div>
    );
  }

  return (
    <section className={`flex flex-col p-5 ${CARD_CLASSES}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--hg-muted)]">
            Personal Metrics
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[var(--hg-text)]">Weight And Age</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--hg-muted)]">
            Add your weight and age now so the treadmill can use them for more accurate calorie
            estimates in a follow-up update.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReveal}
          className="inline-flex items-center justify-center rounded-full bg-[var(--hg-primary-strong)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[rgba(125,60,255,0.8)]"
        >
          Edit Metrics
        </button>
      </div>

      <div className="mt-4 grid gap-4 rounded-3xl border border-[color:var(--hg-border-soft)] bg-[color:var(--hg-interactive-soft)] p-4 backdrop-blur-sm sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-[var(--hg-muted)]">Weight</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--hg-text)]">
            {formatWeight(currentWeightKg)}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-[var(--hg-muted)]">Age</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--hg-text)]">
            {formatAge(currentAgeYears)}
          </p>
        </div>

        {successMessage ? (
          <p className="rounded-2xl border border-[color:var(--hg-success-border)] bg-[color:var(--hg-success-bg)] px-4 py-2 text-sm font-medium text-[color:var(--hg-success-text)] sm:col-span-2">
            {successMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function EditProfileMetricsForm({
  formRef,
  draftWeightKg,
  draftAgeYears,
  activeField,
  onFocusWeight,
  onFocusAge,
  onPendingChange,
  onSuccess,
}: Readonly<{
  formRef: React.RefObject<HTMLFormElement | null>;
  draftWeightKg: string;
  draftAgeYears: string;
  activeField: MetricsField;
  onFocusWeight: () => void;
  onFocusAge: () => void;
  onPendingChange: (pending: boolean) => void;
  onSuccess: (
    updatedWeightKg: number | null,
    updatedAgeYears: number | null,
    message: string
  ) => void;
}>) {
  const [state, formAction, pending] = useActionState(
    updateCurrentProfileMetricsFormAction,
    initialUpdateCurrentProfileMetricsFormState
  );
  const handledSuccessRef = useRef(false);

  useEffect(() => {
    onPendingChange(pending);
  }, [onPendingChange, pending]);

  useEffect(() => {
    if (state.status !== 'success' || handledSuccessRef.current) return;
    handledSuccessRef.current = true;
    onSuccess(state.updatedWeightKg ?? null, state.updatedAgeYears ?? null, state.message);
  }, [onSuccess, state.message, state.status, state.updatedAgeYears, state.updatedWeightKg]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-4 flex-1 rounded-3xl border border-slate-200 bg-white p-5"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="profile-weight-kg" className="block text-sm font-medium text-slate-900">
            Weight (kg)
          </label>
          <input
            id="profile-weight-kg"
            name="weightKg"
            type="text"
            value={draftWeightKg}
            inputMode="none"
            readOnly
            onFocus={onFocusWeight}
            className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 ${
              activeField === 'weightKg'
                ? 'border-slate-500 ring-2 ring-slate-200'
                : 'border-slate-200'
            }`}
            placeholder="Optional"
          />
          <p className="mt-2 text-sm text-slate-500">
            Optional. {MIN_WEIGHT_KG}–{MAX_WEIGHT_KG} kg.
          </p>
        </div>

        <div>
          <label htmlFor="profile-age-years" className="block text-sm font-medium text-slate-900">
            Age (years)
          </label>
          <input
            id="profile-age-years"
            name="ageYears"
            type="text"
            value={draftAgeYears}
            inputMode="none"
            readOnly
            onFocus={onFocusAge}
            className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 ${
              activeField === 'ageYears'
                ? 'border-slate-500 ring-2 ring-slate-200'
                : 'border-slate-200'
            }`}
            placeholder="Optional"
          />
          <p className="mt-2 text-sm text-slate-500">
            Optional. Whole number {MIN_AGE_YEARS}–{MAX_AGE_YEARS}.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          Press Enter to move from weight to age, then Enter again to save.
        </p>

        {state.status === 'error' ? (
          <p
            aria-live="polite"
            className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700"
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
