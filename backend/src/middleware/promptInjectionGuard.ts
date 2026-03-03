/**
 * AI Prompt Injection Guard Middleware
 *
 * Protects all AI-facing endpoints (content generation, translation, search,
 * moderation, summariser, etc.) against prompt injection, jailbreak attempts,
 * data exfiltration via prompts, and other LLM-specific threats.
 *
 * Layers of defence:
 *   1. Static pattern matching (fast, regex-based)
 *   2. Input length & entropy analysis
 *   3. Structural analysis (instruction-override detection)
 *   4. DeepSeek R1 real-time analysis (optional, for high-risk inputs)
 *
 * Usage:
 *   app.use('/api/ai', promptInjectionGuard());
 *   app.use('/graphql', promptInjectionGuard({ strictMode: false }));
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// ─── Configuration ────────────────────────────────────────────────────────

export interface PromptInjectionGuardConfig {
  /** Enable the guard (default: true) */
  enabled: boolean;
  /** Block the request on detection (true) or just log a warning (false) */
  strictMode: boolean;
  /** Max allowed input length for AI-related fields (default: 50_000 chars) */
  maxInputLength: number;
  /** Entropy threshold — inputs with extremely high Shannon entropy may be obfuscated payloads */
  maxEntropyThreshold: number;
  /** Use DeepSeek R1 for real-time deep analysis (only for flagged borderline inputs) */
  enableDeepAnalysis: boolean;
  /** Paths to exclude from scanning (health checks, etc.) */
  excludedPaths: string[];
  /** Custom forbidden patterns (in addition to built-in ones) */
  customPatterns: RegExp[];
  /** Log blocked attempts to DB for security monitoring agent */
  logToDatabase: boolean;
}

const DEFAULT_CONFIG: PromptInjectionGuardConfig = {
  enabled: true,
  strictMode: true,
  maxInputLength: 50_000,
  maxEntropyThreshold: 5.5,
  enableDeepAnalysis: false,
  excludedPaths: ['/health', '/metrics'],
  customPatterns: [],
  logToDatabase: true,
};

// ─── Threat Patterns ─────────────────────────────────────────────────────

/**
 * Static patterns that indicate prompt injection / jailbreak attempts.
 * Each has a severity (1-5) and category.
 */
interface ThreatPattern {
  pattern: RegExp;
  severity: number;   // 1 = low, 5 = critical
  category: string;
  description: string;
}

const THREAT_PATTERNS: ThreatPattern[] = [
  // ─── Instruction Override ──────────────────────────────────
  {
    pattern: /ignore\s+(all\s+)?(previous|prior|above|earlier|preceding)\s+(instructions?|prompts?|rules?|context)/i,
    severity: 5,
    category: 'instruction_override',
    description: 'Attempts to override system instructions',
  },
  {
    pattern: /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|directions?)/i,
    severity: 5,
    category: 'instruction_override',
    description: 'Disregard instruction pattern',
  },
  {
    pattern: /forget\s+(everything|all|what)\s+(you|i)\s+(know|said|told|were\s+told)/i,
    severity: 5,
    category: 'instruction_override',
    description: 'Memory erasure attempt',
  },
  {
    pattern: /you\s+are\s+now\s+(a|an|the)\s+/i,
    severity: 4,
    category: 'role_hijack',
    description: 'Role reassignment attempt',
  },
  {
    pattern: /act\s+as\s+(if\s+you\s+are|a|an|the)\s+/i,
    severity: 3,
    category: 'role_hijack',
    description: 'Role impersonation attempt',
  },
  {
    pattern: /pretend\s+(you\s+are|to\s+be|you're)\s+/i,
    severity: 4,
    category: 'role_hijack',
    description: 'Pretend-to-be role hijack',
  },
  {
    pattern: /new\s+(system\s+)?instructions?:\s*/i,
    severity: 5,
    category: 'instruction_override',
    description: 'New system instructions injection',
  },
  {
    pattern: /\[SYSTEM\]|\[INST\]|<<SYS>>|<\|im_start\|>system/i,
    severity: 5,
    category: 'prompt_format_exploit',
    description: 'Prompt format token injection (Llama/ChatML markers)',
  },
  {
    pattern: /<\|endoftext\|>|<\|end\|>|<\/s>|<s>/i,
    severity: 5,
    category: 'prompt_format_exploit',
    description: 'Special token injection',
  },

  // ─── Jailbreak ──────────────────────────────────────────────
  {
    pattern: /\bDAN\b.*mode|do\s+anything\s+now/i,
    severity: 5,
    category: 'jailbreak',
    description: 'DAN (Do Anything Now) jailbreak attempt',
  },
  {
    pattern: /developer\s+mode|god\s+mode|sudo\s+mode|admin\s+mode|unrestricted\s+mode/i,
    severity: 5,
    category: 'jailbreak',
    description: 'Privileged mode escalation jailbreak',
  },
  {
    pattern: /bypass\s+(content\s+)?filters?|bypass\s+(safety|security|moderation)/i,
    severity: 5,
    category: 'jailbreak',
    description: 'Filter bypass attempt',
  },
  {
    pattern: /jailbreak|jail\s*break|escape\s+prompt/i,
    severity: 5,
    category: 'jailbreak',
    description: 'Explicit jailbreak keyword',
  },
  {
    pattern: /enable\s+(unrestricted|uncensored|unfiltered)\s+(mode|output|access)/i,
    severity: 5,
    category: 'jailbreak',
    description: 'Unrestricted mode enablement',
  },

  // ─── Data Exfiltration ──────────────────────────────────────
  {
    pattern: /reveal\s+(your|the|system|internal)\s+(prompt|instructions?|configuration|settings|secrets?|api\s*keys?)/i,
    severity: 5,
    category: 'data_exfiltration',
    description: 'System prompt / secrets extraction',
  },
  {
    pattern: /show\s+me\s+(your|the)\s+(system\s+)?(prompt|instructions?|rules?|config)/i,
    severity: 4,
    category: 'data_exfiltration',
    description: 'Prompt reveal request',
  },
  {
    pattern: /what\s+(is|are)\s+(your|the)\s+(system\s+)?(prompt|instructions?|rules?)/i,
    severity: 3,
    category: 'data_exfiltration',
    description: 'Prompt enquiry',
  },
  {
    pattern: /print\s+(your|the)\s+(initial|system|original)\s+(prompt|instructions?|message)/i,
    severity: 4,
    category: 'data_exfiltration',
    description: 'Prompt print request',
  },
  {
    pattern: /output\s+(the|your)\s+(entire|full|complete)\s+(prompt|context|instructions?)/i,
    severity: 5,
    category: 'data_exfiltration',
    description: 'Full prompt output request',
  },
  {
    pattern: /\b(api[_\s-]?key|secret[_\s-]?key|password|token|credential|private[_\s-]?key)\b/i,
    severity: 3,
    category: 'data_exfiltration',
    description: 'Sensitive data reference in prompt',
  },

  // ─── Indirect Injection ────────────────────────────────────
  {
    pattern: /fetch\s+(this\s+)?url|visit\s+(this\s+)?url|open\s+(this\s+)?link|go\s+to\s+(this\s+)?url/i,
    severity: 3,
    category: 'indirect_injection',
    description: 'URL fetch instruction (SSRF via prompt)',
  },
  {
    pattern: /execute\s+(this\s+)?(code|command|script|shell|bash|python)/i,
    severity: 5,
    category: 'code_execution',
    description: 'Code / command execution attempt',
  },
  {
    pattern: /\beval\s*\(|exec\s*\(|system\s*\(|__import__/i,
    severity: 5,
    category: 'code_execution',
    description: 'Direct code execution function call',
  },

  // ─── Encoding Evasion ──────────────────────────────────────
  {
    pattern: /base64[:\s]+[A-Za-z0-9+\/=]{20,}/i,
    severity: 3,
    category: 'encoding_evasion',
    description: 'Base64-encoded payload',
  },
  {
    pattern: /\\u[0-9a-fA-F]{4}.*\\u[0-9a-fA-F]{4}.*\\u[0-9a-fA-F]{4}/,
    severity: 3,
    category: 'encoding_evasion',
    description: 'Unicode escape sequence evasion',
  },
  {
    pattern: /&#x?[0-9a-fA-F]+;.*&#x?[0-9a-fA-F]+;/,
    severity: 3,
    category: 'encoding_evasion',
    description: 'HTML entity encoding evasion',
  },

  // ─── Prompt Leaking ────────────────────────────────────────
  {
    pattern: /repeat\s+(the\s+)?(text|words?|instructions?)\s+(above|before|prior)/i,
    severity: 4,
    category: 'prompt_leak',
    description: 'Prompt repetition / leak attempt',
  },
  {
    pattern: /translate\s+(the\s+)?(above|previous|system)\s+(text|message|prompt)\s+to/i,
    severity: 3,
    category: 'prompt_leak',
    description: 'Translate-prompt-to-reveal technique',
  },
  {
    pattern: /summarize\s+(everything|all)\s+(above|before|prior|you\s+were\s+told)/i,
    severity: 3,
    category: 'prompt_leak',
    description: 'Summarize-context-leak technique',
  },

  // ─── Multi-turn Manipulation ───────────────────────────────
  {
    pattern: /in\s+our\s+previous\s+conversation|as\s+we\s+discussed\s+before|remember\s+when\s+you\s+said/i,
    severity: 3,
    category: 'context_manipulation',
    description: 'False conversation history fabrication',
  },
];

// ─── Utility Functions ───────────────────────────────────────────────────

/**
 * Calculate Shannon entropy of a string.
 * Very high entropy can indicate obfuscated payloads or encoded attacks.
 */
function shannonEntropy(input: string): number {
  if (!input || input.length === 0) return 0;

  const freq: Record<string, number> = {};
  for (const ch of input) {
    freq[ch] = (freq[ch] || 0) + 1;
  }

  const len = input.length;
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

/**
 * Detect structural prompt injection markers.
 * Returns severity 0-5.
 */
function detectStructuralInjection(input: string): { severity: number; details: string } {
  let severity = 0;
  const details: string[] = [];

  // Multiple newlines followed by instruction-like text
  const doubleNewlineInstructions = input.match(/\n{2,}\s*(you\s+(must|should|will|are)|instruction|system|prompt|rule)/gi);
  if (doubleNewlineInstructions && doubleNewlineInstructions.length > 0) {
    severity = Math.max(severity, 3);
    details.push(`Double-newline instruction pattern (${doubleNewlineInstructions.length} occurrences)`);
  }

  // Markdown-style "---" separator used to visually separate injected instructions
  const separatorCount = (input.match(/^-{3,}$/gm) || []).length;
  if (separatorCount >= 2) {
    severity = Math.max(severity, 3);
    details.push(`Markdown separator injection (${separatorCount} separators)`);
  }

  // XML/HTML tag injection that looks like prompt structure
  const xmlTagCount = (input.match(/<\/?(?:system|user|assistant|prompt|instruction|role|context)\b[^>]*>/gi) || []).length;
  if (xmlTagCount > 0) {
    severity = Math.max(severity, 4);
    details.push(`XML prompt-structure tags detected (${xmlTagCount} tags)`);
  }

  // Excessive use of control characters
  const controlCharCount = (input.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g) || []).length;
  if (controlCharCount > 3) {
    severity = Math.max(severity, 3);
    details.push(`Control characters detected (${controlCharCount})`);
  }

  // Zero-width characters (used to hide text)
  const zeroWidthCount = (input.match(/[\u200B\u200C\u200D\uFEFF\u2060\u2061\u2062\u2063\u2064]/g) || []).length;
  if (zeroWidthCount > 2) {
    severity = Math.max(severity, 4);
    details.push(`Zero-width characters detected (${zeroWidthCount}) — possible hidden text`);
  }

  return { severity, details: details.join('; ') };
}

// ─── Analysis Result ─────────────────────────────────────────────────────

export interface PromptInjectionResult {
  isInjection: boolean;
  overallSeverity: number;       // 0-5
  threats: {
    category: string;
    severity: number;
    description: string;
    matchedText?: string;
  }[];
  inputStats: {
    length: number;
    entropy: number;
    structuralSeverity: number;
  };
}

/**
 * Analyse a single text input for prompt injection threats.
 */
export function analyseForPromptInjection(
  input: string,
  config: PromptInjectionGuardConfig = DEFAULT_CONFIG,
): PromptInjectionResult {
  const threats: PromptInjectionResult['threats'] = [];
  let overallSeverity = 0;

  // 1. Length check
  if (input.length > config.maxInputLength) {
    threats.push({
      category: 'input_overflow',
      severity: 3,
      description: `Input length ${input.length} exceeds max ${config.maxInputLength}`,
    });
    overallSeverity = Math.max(overallSeverity, 3);
  }

  // 2. Entropy check
  const entropy = shannonEntropy(input);
  if (entropy > config.maxEntropyThreshold) {
    threats.push({
      category: 'encoding_evasion',
      severity: 2,
      description: `High entropy (${entropy.toFixed(2)}) may indicate obfuscated payload`,
    });
    overallSeverity = Math.max(overallSeverity, 2);
  }

  // 3. Static pattern matching
  const allPatterns = [...THREAT_PATTERNS, ...config.customPatterns.map(p => ({
    pattern: p, severity: 4, category: 'custom', description: 'Custom pattern match',
  }))];

  for (const threat of allPatterns) {
    const match = input.match(threat.pattern);
    if (match) {
      threats.push({
        category: threat.category,
        severity: threat.severity,
        description: threat.description,
        matchedText: match[0].substring(0, 80),
      });
      overallSeverity = Math.max(overallSeverity, threat.severity);
    }
  }

  // 4. Structural analysis
  const structural = detectStructuralInjection(input);
  if (structural.severity > 0) {
    threats.push({
      category: 'structural_injection',
      severity: structural.severity,
      description: structural.details,
    });
    overallSeverity = Math.max(overallSeverity, structural.severity);
  }

  return {
    isInjection: overallSeverity >= 3,
    overallSeverity,
    threats,
    inputStats: {
      length: input.length,
      entropy,
      structuralSeverity: structural.severity,
    },
  };
}

// ─── Extract All Prompt-Relevant Fields ──────────────────────────────────

/**
 * Recursively extract all string values from an object that could contain
 * prompt injection payloads. Focuses on common AI-related field names.
 */
function extractAIFields(obj: any, prefix = ''): { path: string; value: string }[] {
  const results: { path: string; value: string }[] = [];
  if (!obj || typeof obj !== 'object') return results;

  const AI_FIELD_NAMES = new Set([
    'prompt', 'query', 'question', 'message', 'content', 'text', 'input',
    'instruction', 'context', 'system', 'description', 'body', 'title',
    'comment', 'feedback', 'review', 'summary', 'translation', 'article',
    'searchQuery', 'search', 'userMessage', 'aiInput', 'chatMessage',
    'variables', // GraphQL variables can carry payloads
  ]);

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string' && value.length > 0) {
      // Check all string fields but flag AI-relevant names with higher priority
      if (AI_FIELD_NAMES.has(key) || value.length > 200) {
        results.push({ path, value });
      }
    } else if (typeof value === 'object' && value !== null) {
      results.push(...extractAIFields(value, path));
    }
  }

  return results;
}

// ─── Middleware ───────────────────────────────────────────────────────────

/**
 * Express middleware that scans request body, query, and params for
 * prompt injection attacks before they reach AI services.
 */
export function promptInjectionGuard(
  configOverrides: Partial<PromptInjectionGuardConfig> = {},
) {
  const config: PromptInjectionGuardConfig = { ...DEFAULT_CONFIG, ...configOverrides };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!config.enabled) {
      next();
      return;
    }

    // Skip excluded paths
    if (config.excludedPaths.some(p => req.path.startsWith(p))) {
      next();
      return;
    }

    // Only scan POST/PUT/PATCH (GET queries are usually short)
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      next();
      return;
    }

    try {
      // Collect all fields to analyse
      const fields = [
        ...extractAIFields(req.body),
        ...extractAIFields(req.query),
        ...extractAIFields(req.params),
      ];

      if (fields.length === 0) {
        next();
        return;
      }

      let highestSeverity = 0;
      const allThreats: PromptInjectionResult['threats'] = [];
      let flaggedField = '';

      for (const field of fields) {
        const result = analyseForPromptInjection(field.value, config);
        if (result.isInjection) {
          allThreats.push(...result.threats);
          if (result.overallSeverity > highestSeverity) {
            highestSeverity = result.overallSeverity;
            flaggedField = field.path;
          }
        }
      }

      if (highestSeverity >= 3) {
        const requestId = req.headers['x-request-id'] || `pij-${Date.now()}`;
        const userId = (req as any).user?.id || 'anonymous';
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';

        logger.warn('[PromptInjectionGuard] Threat detected', {
          requestId,
          userId,
          ip,
          path: req.path,
          method: req.method,
          severity: highestSeverity,
          flaggedField,
          threatCount: allThreats.length,
          categories: [...new Set(allThreats.map(t => t.category))],
        });

        // Log to database for security monitoring agent
        if (config.logToDatabase) {
          logThreatToDatabase({
            requestId: requestId as string,
            userId,
            ip,
            path: req.path,
            method: req.method,
            severity: highestSeverity,
            threats: allThreats,
            timestamp: new Date(),
          }).catch(err => {
            logger.error('[PromptInjectionGuard] Failed to log threat to DB:', err);
          });
        }

        if (config.strictMode && highestSeverity >= 4) {
          res.status(403).json({
            error: {
              code: 'PROMPT_INJECTION_BLOCKED',
              message: 'Your input was blocked by our security system. Please rephrase your request.',
              requestId,
            },
          });
          return;
        }

        // For severity 3 warnings or non-strict mode: attach context and continue
        (req as any).promptInjectionWarning = {
          severity: highestSeverity,
          threats: allThreats.length,
          categories: [...new Set(allThreats.map(t => t.category))],
        };
      }

      next();
    } catch (error) {
      // Never block requests due to guard errors — fail open and log
      logger.error('[PromptInjectionGuard] Internal error — failing open:', error);
      next();
    }
  };
}

// ─── DB Logging ──────────────────────────────────────────────────────────

interface ThreatLogEntry {
  requestId: string;
  userId: string;
  ip: string;
  path: string;
  method: string;
  severity: number;
  threats: PromptInjectionResult['threats'];
  timestamp: Date;
}

async function logThreatToDatabase(entry: ThreatLogEntry): Promise<void> {
  try {
    // Dynamic import to avoid circular dependencies
    const prisma = (await import('../lib/prisma')).default;

    await prisma.analyticsEvent.create({
      data: {
        id: entry.requestId,
        sessionId: entry.ip,
        eventType: 'PROMPT_INJECTION_ATTEMPT',
        userId: entry.userId === 'anonymous' ? null : entry.userId,
        resourceType: 'security',
        resourceId: entry.path,
        properties: JSON.stringify({
          method: entry.method,
          severity: entry.severity,
          threatCount: entry.threats.length,
          categories: [...new Set(entry.threats.map(t => t.category))],
        }),
        metadata: JSON.stringify({
          threats: entry.threats.map(t => ({
            category: t.category,
            severity: t.severity,
            description: t.description,
            // Do NOT log matched text — it may itself be an attack vector
          })),
        }),
        timestamp: entry.timestamp,
      },
    });
  } catch {
    // Silently fail — security logging should not break the app
  }
}

// ─── GraphQL-Specific Guard ──────────────────────────────────────────────

/**
 * A lighter guard specifically for GraphQL variables.
 * Can be used as an Apollo Server plugin or inline in resolvers.
 */
export function scanGraphQLVariables(
  variables: Record<string, any>,
): PromptInjectionResult | null {
  const fields = extractAIFields(variables);

  let worstResult: PromptInjectionResult | null = null;

  for (const field of fields) {
    const result = analyseForPromptInjection(field.value);
    if (result.isInjection) {
      if (!worstResult || result.overallSeverity > worstResult.overallSeverity) {
        worstResult = result;
      }
    }
  }

  return worstResult;
}

/**
 * Sanitise a prompt string before sending it to an LLM.
 * Removes or escapes known injection markers while preserving
 * the original intent of legitimate user content.
 */
export function sanitisePromptInput(input: string): string {
  let sanitised = input;

  // Remove special LLM tokens
  sanitised = sanitised.replace(/<\|im_start\|>|<\|im_end\|>|<\|endoftext\|>|<<SYS>>|<<\/SYS>>|\[INST\]|\[\/INST\]/gi, '');

  // Remove zero-width characters
  sanitised = sanitised.replace(/[\u200B\u200C\u200D\uFEFF\u2060-\u2064]/g, '');

  // Remove control characters (but keep newlines and tabs)
  sanitised = sanitised.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Collapse excessive newlines (>3 → 2)
  sanitised = sanitised.replace(/\n{4,}/g, '\n\n');

  return sanitised.trim();
}

export default promptInjectionGuard;
