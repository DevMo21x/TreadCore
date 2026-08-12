import { KeyGrid } from './KeyGrid';

const PIN_KEYS: Array<string | null> = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  null,
  '0',
  null,
];

interface PinKeysProps {
  onKey: (key: string) => void;
  compact?: boolean;
}

export function PinKeys({ onKey, compact = false }: PinKeysProps) {
  return <KeyGrid keys={PIN_KEYS} prefix="pin" onKey={onKey} compact={compact} />;
}
