declare module 'bad-words' {
  export class Filter {
    list: string[];
    constructor(options?: unknown);
    addWords(...words: string[]): void;
    removeWords(...words: string[]): void;
    clean(text: string): string;
    isProfane(text: string): boolean;
    replaceWord(word: string): string;
  }

  export default Filter;
}
