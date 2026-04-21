export interface PIIDetectionResult {
  detected: boolean;
  types: string[];
  details: string;
}

const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/g;
const PHONE_PATTERN = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const CREDIT_CARD_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const ZIP_CODE_PATTERN = /\b\d{5}(-\d{4})?\b/g;
const ADDRESS_PATTERN = /\b\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way|Place|Pl)\b/gi;

const HATEFUL_KEYWORDS = [
  'hate', 'kill', 'murder', 'terrorist', 'bomb', 'attack', 'violent', 'assault',
  'racist', 'sexist', 'discriminate', 'harass', 'threat', 'abuse'
];

const HARMFUL_PATTERNS = [
  /how to (make|build|create) (a )?(bomb|weapon|explosive)/gi,
  /how to (harm|hurt|kill|murder)/gi,
  /suicide (method|way|how)/gi,
  /self[- ]harm/gi
];

export function detectPII(text: string): PIIDetectionResult {
  const detectedTypes: string[] = [];
  const detectedDetails: string[] = [];

  if (SSN_PATTERN.test(text)) {
    detectedTypes.push('ssn');
    detectedDetails.push('Social Security Number');
  }

  if (PHONE_PATTERN.test(text)) {
    detectedTypes.push('phone');
    detectedDetails.push('Phone Number');
  }

  if (EMAIL_PATTERN.test(text)) {
    detectedTypes.push('email');
    detectedDetails.push('Email Address');
  }

  if (CREDIT_CARD_PATTERN.test(text)) {
    detectedTypes.push('credit_card');
    detectedDetails.push('Credit Card Number');
  }

  if (ADDRESS_PATTERN.test(text)) {
    detectedTypes.push('address');
    detectedDetails.push('Physical Address');
  }

  const lowerText = text.toLowerCase();
  const foundHatefulWords = HATEFUL_KEYWORDS.filter(keyword =>
    lowerText.includes(keyword)
  );

  if (foundHatefulWords.length > 0) {
    detectedTypes.push('hateful');
    detectedDetails.push('Potentially Hateful/Harmful Content');
  }

  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(text)) {
      if (!detectedTypes.includes('harmful')) {
        detectedTypes.push('harmful');
        detectedDetails.push('Potentially Harmful Content');
      }
      break;
    }
  }

  return {
    detected: detectedTypes.length > 0,
    types: detectedTypes,
    details: detectedDetails.join(', ')
  };
}

export function getPIIWarningMessage(result: PIIDetectionResult): string {
  if (!result.detected) return '';

  return `⚠️ PRIVACY WARNING: Your prompt contains potentially sensitive information (${result.details}).

For your privacy and security:
• Please do not include personal information such as SSNs, phone numbers, addresses, or credit card numbers
• Avoid hateful, harmful, or threatening content
• Remove any sensitive data before submitting

This prompt has been flagged and logged for compliance monitoring.`;
}
