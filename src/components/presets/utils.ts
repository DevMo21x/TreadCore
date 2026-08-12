export function generateAutoName(
  totalSeconds: number,
  difficulty: 'easy' | 'moderate' | 'hard' | string
) {
  const mins = Math.round(totalSeconds / 60);
  const label = mins <= 0 ? `${totalSeconds}s` : `${mins}min`;
  const cap = difficulty
    ? String(difficulty)[0].toUpperCase() + String(difficulty).slice(1)
    : 'Easy';
  return `${label} at ${cap}`;
}

export default generateAutoName;
