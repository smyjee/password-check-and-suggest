import type { PasswordFactor, PasswordSuggestion, StrengthLabel, RiskLevel } from "@shared/schema";

const COMMON_PASSWORDS = new Set([
  "password", "123456", "12345678", "qwerty", "abc123", "monkey", "1234567",
  "letmein", "trustno1", "dragon", "baseball", "iloveyou", "master", "sunshine",
  "ashley", "bailey", "passw0rd", "shadow", "123123", "654321", "superman",
  "qazwsx", "michael", "football", "password1", "password123", "welcome",
  "jesus", "ninja", "mustang", "password2", "amanda", "admin", "login",
  "princess", "qwerty123", "1234567890", "letmein123", "admin123", "password!",
  "changeme", "iloveyou1", "qwertyuiop", "asdfghjkl", "zxcvbnm", "1q2w3e4r",
]);

const COMMON_WORDS = new Set([
  "password", "love", "dragon", "master", "monkey", "shadow", "sunshine",
  "princess", "qwerty", "welcome", "ninja", "mustang", "football", "baseball",
  "soccer", "hockey", "batman", "superman", "spider", "michael", "jennifer",
  "jessica", "ashley", "amanda", "nicole", "daniel", "andrew", "joshua",
  "matthew", "summer", "winter", "spring", "autumn", "monday", "friday",
  "january", "february", "march", "april", "october", "november", "december",
]);

const KEYBOARD_PATTERNS = [
  "qwerty", "qwertz", "azerty", "asdfgh", "zxcvbn", "qazwsx", "123456",
  "234567", "345678", "456789", "567890", "098765", "987654", "876543",
  "765432", "654321", "1qaz2wsx", "!qaz@wsx", "qweasd", "asdzxc",
];

const LEET_MAP: Record<string, string> = {
  "4": "a", "@": "a", "8": "b", "(": "c", "3": "e", "6": "g", "9": "g",
  "#": "h", "1": "i", "!": "i", "7": "l", "0": "o", "5": "s", "$": "s",
  "+": "t", "2": "z",
};

const PASSPHRASE_WORDS = [
  "correct", "horse", "battery", "staple", "purple", "monkey", "dishwasher",
  "elephant", "umbrella", "keyboard", "mountain", "river", "forest", "ocean",
  "thunder", "crystal", "phoenix", "stellar", "quantum", "cosmic", "nebula",
  "aurora", "glacier", "voltage", "circuit", "photon", "matrix", "cipher",
  "beacon", "prism", "forge", "ember", "frost", "storm", "drift", "spark",
  "velvet", "marble", "silver", "golden", "copper", "bronze", "iron", "steel",
  "rocket", "planet", "comet", "meteor", "galaxy", "cosmic", "solar", "lunar",
  "meadow", "canyon", "desert", "tundra", "jungle", "savanna", "prairie", "delta",
];

function deleetspeakify(password: string): string {
  let result = password.toLowerCase();
  for (const [leet, letter] of Object.entries(LEET_MAP)) {
    result = result.split(leet).join(letter);
  }
  return result;
}

function hasRepeatingChars(password: string, minRepeat: number = 3): boolean {
  const regex = new RegExp(`(.)\\1{${minRepeat - 1},}`);
  return regex.test(password);
}

function hasSequentialChars(password: string, minSeq: number = 3): boolean {
  for (let i = 0; i <= password.length - minSeq; i++) {
    let isAscending = true;
    let isDescending = true;
    
    for (let j = 0; j < minSeq - 1; j++) {
      const curr = password.charCodeAt(i + j);
      const next = password.charCodeAt(i + j + 1);
      
      if (next !== curr + 1) isAscending = false;
      if (next !== curr - 1) isDescending = false;
    }
    
    if (isAscending || isDescending) return true;
  }
  return false;
}

function hasKeyboardPattern(password: string): boolean {
  const lower = password.toLowerCase();
  return KEYBOARD_PATTERNS.some(pattern => 
    lower.includes(pattern) || lower.includes(pattern.split("").reverse().join(""))
  );
}

function containsCommonWord(password: string): string | null {
  const deleet = deleetspeakify(password);
  const lower = password.toLowerCase();
  
  const words = Array.from(COMMON_WORDS);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (lower.includes(word) || deleet.includes(word)) {
      return word;
    }
  }
  return null;
}

function isCommonPassword(password: string): boolean {
  const lower = password.toLowerCase();
  const deleet = deleetspeakify(password);
  
  return COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(deleet);
}

function hasLeetSpeak(password: string): boolean {
  return Object.keys(LEET_MAP).some(char => password.includes(char));
}

function containsDatePattern(password: string): boolean {
  const datePatterns = [
    /\b(19|20)\d{2}\b/,
    /\b\d{2}[-/]\d{2}[-/]\d{2,4}\b/,
    /\b\d{4}[-/]\d{2}[-/]\d{2}\b/,
    /\b(0?[1-9]|1[0-2])(0?[1-9]|[12]\d|3[01])\d{2,4}\b/,
  ];
  return datePatterns.some(pattern => pattern.test(password));
}

function containsEmailPattern(password: string): boolean {
  return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(password);
}

function containsPhonePattern(password: string): boolean {
  const phonePatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
    /\b\d{10}\b/,
    /\b\(\d{3}\)\s?\d{3}[-.]?\d{4}\b/,
  ];
  return phonePatterns.some(pattern => pattern.test(password));
}

function calculateCharacterSetScore(password: string): { score: number; hasLower: boolean; hasUpper: boolean; hasDigit: boolean; hasSymbol: boolean } {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  
  let score = 0;
  if (hasLower) score += 1;
  if (hasUpper) score += 1;
  if (hasDigit) score += 1;
  if (hasSymbol) score += 1.5;
  
  return { score, hasLower, hasUpper, hasDigit, hasSymbol };
}

const RISK_THRESHOLDS: Record<RiskLevel, { minLength: number; minScore: number }> = {
  LOW: { minLength: 8, minScore: 40 },
  MEDIUM: { minLength: 12, minScore: 60 },
  HIGH: { minLength: 16, minScore: 80 },
};

export interface AnalysisResult {
  score: number;
  label: StrengthLabel;
  factors: PasswordFactor[];
  suggestions: PasswordSuggestion[];
  entropy: number;
}

export function analyzePassword(password: string, riskLevel: RiskLevel = "MEDIUM"): AnalysisResult {
  const factors: PasswordFactor[] = [];
  const suggestions: PasswordSuggestion[] = [];
  let score = 0;
  let suggestionId = 1;
  
  const thresholds = RISK_THRESHOLDS[riskLevel];
  const length = password.length;
  const charset = calculateCharacterSetScore(password);
  const isCommon = isCommonPassword(password);
  const commonWord = containsCommonWord(password);
  const hasRepeat = hasRepeatingChars(password);
  const hasSequence = hasSequentialChars(password);
  const hasKbPattern = hasKeyboardPattern(password);
  const usesLeet = hasLeetSpeak(password);
  const hasDate = containsDatePattern(password);
  const hasEmail = containsEmailPattern(password);
  const hasPhone = containsPhonePattern(password);
  
  let charsetSize = 0;
  if (charset.hasLower) charsetSize += 26;
  if (charset.hasUpper) charsetSize += 26;
  if (charset.hasDigit) charsetSize += 10;
  if (charset.hasSymbol) charsetSize += 32;
  const entropy = Math.log2(Math.pow(charsetSize || 1, length));
  
  if (length >= thresholds.minLength + 4) {
    score += 30;
    factors.push({ type: "positive", message: `Excellent length (${length} characters)` });
  } else if (length >= thresholds.minLength) {
    score += 20;
    factors.push({ type: "positive", message: `Good length (${length} characters)` });
  } else if (length >= thresholds.minLength - 4) {
    score += 10;
    factors.push({ type: "negative", message: `Password could be longer (${length} characters)` });
    suggestions.push({
      id: suggestionId++,
      title: "Make it longer",
      description: `For ${riskLevel.toLowerCase()}-risk accounts, aim for at least ${thresholds.minLength} characters.`,
    });
  } else {
    score += 0;
    factors.push({ type: "negative", message: `Too short (${length} characters)` });
    suggestions.push({
      id: suggestionId++,
      title: "Increase password length",
      description: `Your password is too short. Use at least ${thresholds.minLength} characters for ${riskLevel.toLowerCase()}-risk accounts.`,
    });
  }
  
  score += charset.score * 10;
  
  if (charset.score >= 3.5) {
    factors.push({ type: "positive", message: "Uses diverse character types" });
  } else if (charset.score >= 2) {
    factors.push({ type: "negative", message: "Limited character variety" });
    if (!charset.hasSymbol) {
      suggestions.push({
        id: suggestionId++,
        title: "Add special characters",
        description: "Include symbols like !@#$%^&* to significantly increase complexity.",
      });
    }
    if (!charset.hasDigit) {
      suggestions.push({
        id: suggestionId++,
        title: "Add numbers",
        description: "Mix in some digits throughout your password.",
      });
    }
  } else {
    factors.push({ type: "negative", message: "Very limited character types" });
    suggestions.push({
      id: suggestionId++,
      title: "Use mixed character types",
      description: "Combine lowercase, uppercase, numbers, and symbols for a stronger password.",
    });
  }
  
  if (isCommon) {
    score -= 40;
    factors.push({ type: "negative", message: "This is a commonly used password" });
    suggestions.push({
      id: suggestionId++,
      title: "Avoid common passwords",
      description: "This password appears in lists of commonly used passwords. Attackers try these first.",
    });
  }
  
  if (commonWord && !isCommon) {
    score -= 15;
    factors.push({ type: "negative", message: `Contains common word: "${commonWord}"` });
    suggestions.push({
      id: suggestionId++,
      title: "Avoid dictionary words",
      description: "Replace common words with random combinations or a passphrase of unrelated words.",
    });
  }
  
  if (hasRepeat) {
    score -= 10;
    factors.push({ type: "negative", message: "Contains repeating characters" });
    suggestions.push({
      id: suggestionId++,
      title: "Avoid character repetition",
      description: "Patterns like 'aaa' or '111' are easy to guess. Use varied characters instead.",
    });
  }
  
  if (hasSequence) {
    score -= 10;
    factors.push({ type: "negative", message: "Contains sequential characters" });
    suggestions.push({
      id: suggestionId++,
      title: "Avoid sequences",
      description: "Patterns like 'abc' or '123' reduce security. Use random arrangements instead.",
    });
  }
  
  if (hasKbPattern) {
    score -= 15;
    factors.push({ type: "negative", message: "Contains keyboard pattern" });
    suggestions.push({
      id: suggestionId++,
      title: "Avoid keyboard patterns",
      description: "Patterns like 'qwerty' or 'asdfgh' are among the first guesses attackers try.",
    });
  }
  
  if (hasDate) {
    score -= 10;
    factors.push({ type: "negative", message: "Contains date pattern" });
    suggestions.push({
      id: suggestionId++,
      title: "Avoid dates",
      description: "Dates like birthdays or anniversaries are easily guessable personal information.",
    });
  }
  
  if (hasEmail) {
    score -= 15;
    factors.push({ type: "negative", message: "Contains email address" });
    suggestions.push({
      id: suggestionId++,
      title: "Remove email addresses",
      description: "Never include your email in your password as it's public information.",
    });
  }
  
  if (hasPhone) {
    score -= 15;
    factors.push({ type: "negative", message: "Contains phone number pattern" });
    suggestions.push({
      id: suggestionId++,
      title: "Remove phone numbers",
      description: "Phone numbers are personal information that attackers can easily discover.",
    });
  }
  
  if (usesLeet && commonWord) {
    factors.push({ type: "negative", message: "Leet speak substitutions are easily cracked" });
    suggestions.push({
      id: suggestionId++,
      title: "Leet speak isn't secure",
      description: "Substitutions like @ for 'a' or 0 for 'o' are well-known to password crackers.",
    });
  } else if (!usesLeet && charset.hasSymbol) {
    factors.push({ type: "positive", message: "Uses special characters effectively" });
  }
  
  if (entropy > 60) {
    score += 15;
    factors.push({ type: "positive", message: "High entropy (complexity)" });
  } else if (entropy > 40) {
    score += 5;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let label: StrengthLabel;
  if (score >= thresholds.minScore) {
    if (score >= 80) label = "VERY_STRONG";
    else label = "STRONG";
  } else if (score >= thresholds.minScore - 20) {
    label = "MODERATE";
  } else if (score >= 20) {
    label = "WEAK";
  } else {
    label = "VERY_WEAK";
  }
  
  return {
    score,
    label,
    factors,
    suggestions: suggestions.slice(0, 5),
    entropy,
  };
}

export function generateStrongPasswords(basePattern: string, count: number = 3): string[] {
  const words = [
    "ocean", "mountain", "thunder", "crystal", "phoenix", "stellar", "quantum", "cosmic",
    "nebula", "aurora", "glacier", "voltage", "circuit", "photon", "matrix", "cipher",
    "beacon", "prism", "forge", "ember", "frost", "storm", "drift", "spark",
  ];
  
  const symbols = ["!", "@", "#", "$", "%", "^", "&", "*", "+", "=", "?"];
  const passwords: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    const sym = symbols[Math.floor(Math.random() * symbols.length)];
    
    const capitalizedWord1 = word1.charAt(0).toUpperCase() + word1.slice(1);
    const capitalizedWord2 = word2.charAt(0).toUpperCase() + word2.slice(1);
    
    const patterns = [
      `${capitalizedWord1}${sym}${capitalizedWord2}${num}`,
      `${capitalizedWord1}${num}${sym}${capitalizedWord2}`,
      `${sym}${capitalizedWord1}${capitalizedWord2}${num}${sym}`,
    ];
    
    passwords.push(patterns[i % patterns.length]);
  }
  
  return passwords;
}

export function generatePassphrases(count: number = 3): { passphrase: string; entropy: number }[] {
  const passphrases: { passphrase: string; entropy: number }[] = [];
  const wordCount = 4;
  const entropyPerWord = Math.log2(PASSPHRASE_WORDS.length);
  
  for (let i = 0; i < count; i++) {
    const selectedWords: string[] = [];
    for (let j = 0; j < wordCount; j++) {
      const word = PASSPHRASE_WORDS[Math.floor(Math.random() * PASSPHRASE_WORDS.length)];
      selectedWords.push(word.charAt(0).toUpperCase() + word.slice(1));
    }
    
    const separators = ["-", ".", "_", " "];
    const separator = separators[Math.floor(Math.random() * separators.length)];
    const num = Math.floor(Math.random() * 100);
    
    const passphrase = selectedWords.join(separator) + num;
    const entropy = Math.round(wordCount * entropyPerWord + Math.log2(100));
    
    passphrases.push({ passphrase, entropy });
  }
  
  return passphrases;
}
