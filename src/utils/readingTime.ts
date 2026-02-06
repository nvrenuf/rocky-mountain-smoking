const WORDS_PER_MINUTE = 220;

export type ReadingTimeResult = {
  minutes: number;
  words: number;
};

export function readingTime(content: string, wordsPerMinute = WORDS_PER_MINUTE): ReadingTimeResult {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = words === 0 ? 0 : words / Math.max(wordsPerMinute, 1);

  return {
    minutes,
    words,
  };
}
