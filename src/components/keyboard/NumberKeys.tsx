import { KeyGrid } from './KeyGrid';

const NUMBER_KEYS: Array<string | null> = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '.',
  '0',
  null,
];

interface NumberKeysProps {
  onKey: (key: string) => void;
  compact?: boolean;
}

export function NumberKeys({ onKey, compact = false }: NumberKeysProps) {
  return <KeyGrid keys={NUMBER_KEYS} prefix="number" onKey={onKey} compact={compact} />;
}
