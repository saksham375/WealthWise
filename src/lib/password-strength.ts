export function scorePassword(password: string): number {
  let score = 0;

  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
  if (/\d/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  return Math.min(score, 100);
}

export function getPasswordStrengthLabel(score: number): string {
  if (score < 25) return "Weak";
  if (score < 50) return "Fair";
  if (score < 75) return "Good";
  return "Very Strong";
}
