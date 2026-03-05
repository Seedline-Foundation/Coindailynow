/**
 * CodeReview Agent
 * Automated code review, security audit, and best-practice enforcement
 * 
 * Model: DeepSeek R1 8B (reasoning/analysis)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class CodeReviewAgent extends BaseAgent {
  constructor() {
    super({
      id: 'code-review-agent',
      name: 'CodeReview Agent',
      type: 'code_review',
      category: 'engineering',
      description: 'Automated code review agent that checks for bugs, security vulnerabilities, performance issues, coding standards, and best practices across the CoinDaily platform codebase.',
      capabilities: [
        'code_review',
        'security_audit',
        'performance_review',
        'style_check',
        'dependency_audit',
        'type_safety_check',
        'api_review',
        'database_review',
        'test_coverage_review',
        'refactor_suggestions',
      ],
      model: 'deepseek',
      timeoutMs: 120000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { reviewType, code, filePath, language, context } = task.input;

    switch (reviewType) {
      case 'full_review':
        return this.fullCodeReview(code, filePath, language);
      case 'security':
        return this.securityAudit(code, filePath, language);
      case 'performance':
        return this.performanceReview(code, filePath, language);
      case 'api':
        return this.apiReview(code, filePath);
      case 'database':
        return this.databaseReview(code, filePath);
      case 'typescript':
        return this.typescriptReview(code, filePath);
      case 'dependencies':
        return this.dependencyAudit(task.input.dependencies);
      case 'refactor':
        return this.suggestRefactoring(code, filePath, context);
      case 'pr_review':
        return this.pullRequestReview(task.input.diff, task.input.prDescription);
      default:
        return this.fullCodeReview(code, filePath, language);
    }
  }

  private async fullCodeReview(code: string, filePath?: string, language?: string): Promise<Record<string, any>> {
    const prompt = `Perform a comprehensive code review. Be thorough and precise.

File: ${filePath || 'unknown'}
Language: ${language || 'TypeScript'}
Code:
\`\`\`
${code}
\`\`\`

Return JSON:
{
  "review": {
    "file": "${filePath || 'unknown'}",
    "overallScore": number (1-10),
    "summary": string,
    "issues": [
      {
        "severity": "critical"|"high"|"medium"|"low"|"info",
        "category": "bug"|"security"|"performance"|"style"|"type"|"logic"|"maintainability",
        "line": number,
        "description": string,
        "suggestion": string,
        "fixCode": string
      }
    ],
    "positives": [string],
    "metrics": {
      "complexity": "low"|"medium"|"high",
      "readability": number (1-10),
      "testability": number (1-10),
      "maintainability": number (1-10)
    },
    "recommendations": [string],
    "estimatedTechDebt": "none"|"low"|"medium"|"high"
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 3000 });
  }

  private async securityAudit(code: string, filePath?: string, language?: string): Promise<Record<string, any>> {
    const prompt = `Perform a security audit of this code. Focus on vulnerabilities, injection risks, authentication issues, and data exposure.

File: ${filePath || 'unknown'}
Code:
\`\`\`
${code}
\`\`\`

Return JSON:
{
  "securityAudit": {
    "riskLevel": "safe"|"low"|"medium"|"high"|"critical",
    "vulnerabilities": [
      {
        "type": string,
        "severity": "critical"|"high"|"medium"|"low",
        "cwe": string,
        "line": number,
        "description": string,
        "impact": string,
        "remediation": string,
        "fixCode": string
      }
    ],
    "authChecks": {"present": boolean, "adequate": boolean, "issues": [string]},
    "inputValidation": {"present": boolean, "adequate": boolean, "issues": [string]},
    "dataExposure": {"risks": [string], "sensitiveFields": [string]},
    "sqlInjection": {"safe": boolean, "issues": [string]},
    "xss": {"safe": boolean, "issues": [string]},
    "recommendations": [string],
    "complianceNotes": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.1, maxTokens: 2500 });
  }

  private async performanceReview(code: string, filePath?: string, language?: string): Promise<Record<string, any>> {
    const prompt = `Analyze this code for performance issues. CoinDaily requires sub-500ms API responses and single I/O per request.

File: ${filePath || 'unknown'}
Code:
\`\`\`
${code}
\`\`\`

Return JSON:
{
  "performanceReview": {
    "score": number (1-10),
    "estimatedLatency": string,
    "issues": [
      {
        "severity": "critical"|"high"|"medium"|"low",
        "type": "n+1_query"|"missing_cache"|"blocking_io"|"memory_leak"|"unnecessary_computation"|"large_payload"|"missing_index",
        "line": number,
        "description": string,
        "impact": string,
        "optimization": string,
        "optimizedCode": string
      }
    ],
    "ioOperations": number,
    "cachingOpportunities": [{"data": string, "suggestedTtl": number, "reason": string}],
    "indexSuggestions": [string],
    "memoryConsiderations": [string],
    "recommendations": [string],
    "meetsRequirements": boolean
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2500 });
  }

  private async apiReview(code: string, filePath?: string): Promise<Record<string, any>> {
    const prompt = `Review this API endpoint code for best practices, error handling, and CoinDaily standards.

Code:
\`\`\`
${code}
\`\`\`

Return JSON:
{
  "apiReview": {
    "score": number (1-10),
    "endpoint": string,
    "method": string,
    "issues": [
      {"severity": string, "category": string, "description": string, "fix": string}
    ],
    "authCheck": boolean,
    "rateLimitCheck": boolean,
    "inputValidation": boolean,
    "errorHandling": {"adequate": boolean, "issues": [string]},
    "responseFormat": {"consistent": boolean, "issues": [string]},
    "caching": {"implemented": boolean, "suggestions": [string]},
    "documentation": {"adequate": boolean, "missing": [string]},
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async databaseReview(code: string, filePath?: string): Promise<Record<string, any>> {
    const prompt = `Review this database query/schema code for Prisma/PostgreSQL best practices.

Code:
\`\`\`
${code}
\`\`\`

Return JSON:
{
  "databaseReview": {
    "score": number (1-10),
    "issues": [
      {"severity": string, "type": string, "description": string, "fix": string}
    ],
    "indexSuggestions": [{"table": string, "columns": [string], "reason": string}],
    "queryOptimizations": [string],
    "n1Problems": [string],
    "transactionNeeds": [string],
    "migrationSafety": {"safe": boolean, "risks": [string]},
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async typescriptReview(code: string, filePath?: string): Promise<Record<string, any>> {
    const prompt = `Review TypeScript code for type safety, proper typing, and TS best practices.

Code:
\`\`\`
${code}
\`\`\`

Return JSON:
{
  "typescriptReview": {
    "score": number (1-10),
    "typeIssues": [
      {"line": number, "issue": string, "currentType": string, "suggestedType": string, "fix": string}
    ],
    "anyUsage": [{"line": number, "suggestion": string}],
    "missingTypes": [string],
    "strictModeIssues": [string],
    "genericsOpportunities": [string],
    "interfaceIssues": [string],
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async dependencyAudit(dependencies: Record<string, string>): Promise<Record<string, any>> {
    const prompt = `Audit these npm dependencies for security and best practices:

Dependencies: ${JSON.stringify(dependencies, null, 2)}

Return JSON:
{
  "dependencyAudit": {
    "totalPackages": number,
    "riskLevel": "safe"|"low"|"medium"|"high",
    "concerns": [
      {"package": string, "version": string, "issue": string, "recommendation": string}
    ],
    "outdated": [{"package": string, "current": string, "latest": string}],
    "duplicates": [string],
    "unusedSuggestions": [string],
    "alternatives": [{"current": string, "suggested": string, "reason": string}],
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async suggestRefactoring(code: string, filePath?: string, context?: string): Promise<Record<string, any>> {
    const prompt = `Suggest refactoring improvements for this code.

File: ${filePath || 'unknown'}
Context: ${context || 'CoinDaily platform code'}
Code:
\`\`\`
${code}
\`\`\`

Return JSON:
{
  "refactoring": {
    "currentState": string,
    "suggestions": [
      {
        "priority": "high"|"medium"|"low",
        "type": "extract_function"|"extract_class"|"simplify"|"decompose"|"design_pattern"|"naming"|"structure",
        "description": string,
        "before": string,
        "after": string,
        "benefit": string,
        "effort": "small"|"medium"|"large"
      }
    ],
    "designPatterns": [{"pattern": string, "applicability": string}],
    "estimatedImprovement": {"readability": string, "maintainability": string, "performance": string},
    "breakingChanges": boolean
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 3000 });
  }

  private async pullRequestReview(diff: string, description?: string): Promise<Record<string, any>> {
    const prompt = `Review this pull request diff:

PR Description: ${description || 'No description provided'}
Diff:
\`\`\`
${diff}
\`\`\`

Return JSON:
{
  "prReview": {
    "verdict": "approve"|"request_changes"|"comment",
    "summary": string,
    "score": number (1-10),
    "issues": [
      {"file": string, "line": number, "severity": string, "comment": string, "suggestion": string}
    ],
    "positives": [string],
    "testingNeeded": [string],
    "documentationNeeded": [string],
    "breakingChanges": boolean,
    "performanceImpact": string,
    "securityConcerns": [string],
    "overallComments": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 3000 });
  }
}

export default CodeReviewAgent;
