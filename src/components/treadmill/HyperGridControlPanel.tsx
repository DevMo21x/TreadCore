'use client';

export interface NumericQuickOption<TValue extends number = number> {
  value: TValue;
  label: string;
}

export type HyperGridControlAccent = 'speed' | 'incline';

type HyperGridControlPanelProps = Readonly<{
  accent: HyperGridControlAccent;
  label: string;
  value: number;
  unit: string;
  quickOptions: ReadonlyArray<NumericQuickOption<number>>;
  activeOption: number;
  disabled?: boolean;
  className?: string;
  quickOptionsLayout?: 'below' | 'left' | 'right';
  quickOptionsGridClassName?: string;
  formatValue?: (value: number) => string;
  onIncrement: () => void | Promise<void>;
  onDecrement: () => void | Promise<void>;
  onQuickOption: (value: number) => void | Promise<void>;
}>;

function getPanelClassName(accent: HyperGridControlAccent): string {
  return accent === 'speed'
    ? 'border-[rgba(189,244,255,0.3)] shadow-[inset_0_0_10px_rgba(0,227,253,0.05)]'
    : 'border-[rgba(208,188,255,0.3)] shadow-[inset_0_0_10px_rgba(125,60,255,0.05)]';
}

function getControlButtonClassName(accent: HyperGridControlAccent): string {
  return accent === 'speed'
    ? 'border-[rgba(189,244,255,0.2)] bg-[rgba(189,244,255,0.1)] text-[var(--hg-secondary)] hover:border-[rgba(189,244,255,0.5)] hover:bg-[rgba(189,244,255,0.2)]'
    : 'border-[rgba(208,188,255,0.2)] bg-[rgba(208,188,255,0.1)] text-[var(--hg-primary)] hover:border-[rgba(208,188,255,0.5)] hover:bg-[rgba(208,188,255,0.2)]';
}

function getQuickButtonClassName(accent: HyperGridControlAccent): string {
  return accent === 'speed'
    ? 'border-[rgba(189,244,255,0.2)] text-[var(--hg-secondary)] hover:bg-[rgba(189,244,255,0.1)]'
    : 'border-[rgba(208,188,255,0.2)] text-[var(--hg-primary)] hover:bg-[rgba(208,188,255,0.1)]';
}

function getActiveQuickButtonClassName(accent: HyperGridControlAccent): string {
  return accent === 'speed'
    ? 'border-[rgba(189,244,255,0.5)] bg-[rgba(189,244,255,0.2)] text-[var(--hg-text)] shadow-[0_0_5px_rgba(0,227,253,0.3)]'
    : 'border-[rgba(208,188,255,0.5)] bg-[rgba(208,188,255,0.2)] text-[var(--hg-text)] shadow-[0_0_5px_rgba(125,60,255,0.3)]';
}

function getLabelColorClassName(accent: HyperGridControlAccent): string {
  return accent === 'speed' ? 'text-[var(--hg-secondary)]' : 'text-[var(--hg-primary)]';
}

function getValueColorClassName(accent: HyperGridControlAccent): string {
  return accent === 'speed' ? 'text-[var(--hg-secondary)]' : 'text-[var(--hg-text)]';
}

function ZapIcon({ className = 'h-3 w-3' }: Readonly<{ className?: string }>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function HyperGridControlPanel({
  accent,
  label,
  value,
  unit,
  quickOptions,
  activeOption,
  disabled = false,
  className = 'col-span-12 lg:col-span-4',
  quickOptionsLayout = 'below',
  quickOptionsGridClassName,
  formatValue = (currentValue) => String(currentValue),
  onIncrement,
  onDecrement,
  onQuickOption,
}: HyperGridControlPanelProps) {
  const panelClassName = getPanelClassName(accent);
  const controlButtonClassName = getControlButtonClassName(accent);
  const quickButtonClassName = getQuickButtonClassName(accent);
  const activeQuickButtonClassName = getActiveQuickButtonClassName(accent);
  const labelColorClassName = getLabelColorClassName(accent);
  const valueColorClassName = getValueColorClassName(accent);

  // Resolve grid class name based on layout
  const resolvedGridClassName =
    quickOptionsGridClassName ?? (quickOptionsLayout !== 'below' ? 'grid-cols-2' : 'grid-cols-6');

  // Enlarge preset buttons for side-by-side layouts
  const quickButtonSizeClassName =
    quickOptionsLayout !== 'below' ? 'py-3 text-sm' : 'py-1 text-[10px]';

  // Determine outer layout direction
  const outerLayoutClassName =
    quickOptionsLayout === 'below' ? 'flex-col' : 'flex-row items-stretch';

  // Build control section (with - / value / + buttons)
  const controlSection = (
    <div
      className={`flex flex-col items-center justify-start ${quickOptionsLayout === 'left' ? 'ml-4' : quickOptionsLayout === 'right' ? 'mr-4' : ''} ${quickOptionsLayout !== 'below' ? 'flex-1' : ''}`}
    >
      <span className={`text-xl font-bold tracking-widest ${labelColorClassName}`}>{label}</span>
      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={() => {
            void onDecrement();
          }}
          disabled={disabled}
          aria-label={`Decrease ${label}`}
          className={`flex h-32 w-32 items-center justify-center rounded-lg border text-3xl font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:border-[color:var(--hg-border-soft)] disabled:bg-[color:var(--hg-interactive-soft)] disabled:text-[color:var(--hg-disabled-text)] ${controlButtonClassName}`}
        >
          -
        </button>

        <div className="w-24 text-center">
          <div className={`text-4xl font-bold tracking-[-0.04em] ${valueColorClassName}`}>
            {formatValue(value)}
          </div>
          <div className="mt-1 text-xl font-bold tracking-widest text-(--hg-muted)">{unit}</div>
        </div>

        <button
          type="button"
          onClick={() => {
            void onIncrement();
          }}
          disabled={disabled}
          aria-label={`Increase ${label}`}
          className={`flex h-32 w-32 items-center justify-center rounded-lg border text-3xl font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:border-[color:var(--hg-border-soft)] disabled:bg-[color:var(--hg-interactive-soft)] disabled:text-[color:var(--hg-disabled-text)] ${controlButtonClassName}`}
        >
          +
        </button>
      </div>
    </div>
  );

  // Build preset buttons section
  const presetsSection = (
    <div className={`flex flex-col gap-1 ${quickOptionsLayout !== 'below' ? 'flex-1' : ''}`}>
      <div className={`flex items-center justify-center gap-1 px-1 ${labelColorClassName}`}>
        <ZapIcon className="h-3 w-3" />
        <span className="text-lg font-bold tracking-widest">{label} PRESETS</span>
      </div>
      <div className={`grid gap-3 ${resolvedGridClassName}`}>
        {quickOptions.map((option) => {
          const isActive = option.value === activeOption;

          return (
            <button
              key={`${label}-${option.value}`}
              type="button"
              onClick={() => {
                void onQuickOption(option.value);
              }}
              disabled={disabled}
              aria-pressed={isActive}
              className={`rounded-sm border transition-all disabled:cursor-not-allowed disabled:border-[color:var(--hg-border-soft)] disabled:bg-[color:var(--hg-interactive-soft)] disabled:text-[color:var(--hg-disabled-text)] ${quickButtonSizeClassName} ${
                isActive ? activeQuickButtonClassName : quickButtonClassName
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className={`flex rounded-xl border bg-[var(--hg-surface-panel)] p-2 ${className} ${panelClassName}`}
    >
      <div className={`flex w-full gap-3 ${outerLayoutClassName}`}>
        {quickOptionsLayout === 'left' && presetsSection}
        {controlSection}
        {quickOptionsLayout === 'right' && presetsSection}
        {quickOptionsLayout === 'below' && presetsSection}
      </div>
    </div>
  );
}
