/**
 * Generates a password an admin can read out over the phone: no characters that
 * look alike (0/O, 1/l/I) and no symbols that are awkward to dictate.
 */
const passwordAlphabetValue = {
  lowercase: "abcdefghijkmnpqrstuvwxyz",
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789",
} as const;

const generatedPasswordLength = 14;

const allCharacters =
  passwordAlphabetValue.lowercase + passwordAlphabetValue.uppercase + passwordAlphabetValue.digits;

function randomIndex(max: number): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % max;
}

function pick(characters: string): string {
  return characters[randomIndex(characters.length)];
}

function shuffle(characters: string[]): string[] {
  const shuffled = [...characters];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generatePassword(): string {
  const guaranteed = [
    pick(passwordAlphabetValue.lowercase),
    pick(passwordAlphabetValue.uppercase),
    pick(passwordAlphabetValue.digits),
  ];
  const remaining = Array.from({ length: generatedPasswordLength - guaranteed.length }, () =>
    pick(allCharacters),
  );

  return shuffle([...guaranteed, ...remaining]).join("");
}
