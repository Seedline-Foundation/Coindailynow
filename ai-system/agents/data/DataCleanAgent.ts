/**
 * DataClean Agent
 * Ensures data quality: anomaly detection, deduplication, standardization, validation
 * 
 * Model: DeepSeek R1 8B (reasoning for anomaly detection)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class DataCleanAgent extends BaseAgent {
  constructor() {
    super({
      id: 'data-clean-agent',
      name: 'DataClean Agent',
      type: 'data_clean',
      category: 'data',
      description: 'Ensures data quality across the platform through anomaly detection, deduplication, standardization, validation, and data enrichment. Critical for maintaining reliable market data and content.',
      capabilities: [
        'anomaly_detection',
        'deduplication',
        'data_standardization',
        'schema_validation',
        'data_enrichment',
        'quality_scoring',
        'missing_data_imputation',
        'format_normalization',
        'outlier_detection',
        'data_lineage_tracking',
      ],
      model: 'deepseek',
      timeoutMs: 90000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { taskType, data, schema, rules } = task.input;

    switch (taskType) {
      case 'validate':
        return this.validateData(data, schema);
      case 'deduplicate':
        return this.deduplicateData(data);
      case 'standardize':
        return this.standardizeData(data, rules);
      case 'detect_anomalies':
        return this.detectAnomalies(data);
      case 'enrich':
        return this.enrichData(data);
      case 'quality_report':
        return this.generateQualityReport(data);
      case 'clean_pipeline':
        return this.runCleanPipeline(data, schema, rules);
      default:
        return this.runCleanPipeline(data, schema, rules);
    }
  }

  private async validateData(data: any[], schema?: any): Promise<Record<string, any>> {
    const prompt = `Validate the following dataset against quality standards:

Data sample (${Array.isArray(data) ? data.length : 1} records):
${JSON.stringify(Array.isArray(data) ? data.slice(0, 10) : data, null, 2)}

Schema: ${JSON.stringify(schema || 'auto-detect')}

Return JSON:
{
  "totalRecords": number,
  "validRecords": number,
  "invalidRecords": number,
  "validationResults": [
    {
      "field": string,
      "type": "missing"|"invalid_type"|"out_of_range"|"format_error"|"duplicate",
      "count": number,
      "severity": "error"|"warning"|"info",
      "sample": string,
      "fix": string
    }
  ],
  "dataCompleteness": number (0-100),
  "dataAccuracy": number (0-100),
  "detectedSchema": object,
  "recommendations": [string],
  "overallQuality": "excellent"|"good"|"fair"|"poor"
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2500 });
  }

  private async deduplicateData(data: any[]): Promise<Record<string, any>> {
    const prompt = `Identify and remove duplicate records from this dataset:

Data (${Array.isArray(data) ? data.length : 1} records):
${JSON.stringify(Array.isArray(data) ? data.slice(0, 20) : data, null, 2)}

Return JSON:
{
  "totalRecords": number,
  "uniqueRecords": number,
  "duplicatesFound": number,
  "duplicateGroups": [
    {
      "groupId": number,
      "records": [number],
      "matchType": "exact"|"fuzzy"|"semantic",
      "similarity": number,
      "keepIndex": number,
      "reason": string
    }
  ],
  "deduplicationRate": number (percentage),
  "cleanedData": "ready for processing",
  "strategy": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.1, maxTokens: 2000 });
  }

  private async standardizeData(data: any[], rules?: any): Promise<Record<string, any>> {
    const prompt = `Standardize and normalize the following dataset:

Data: ${JSON.stringify(Array.isArray(data) ? data.slice(0, 10) : data, null, 2)}
Rules: ${JSON.stringify(rules || 'auto-detect best format')}

Return JSON:
{
  "totalRecords": number,
  "transformations": [
    {
      "field": string,
      "from": string,
      "to": string,
      "type": "format"|"case"|"unit"|"encoding"|"date"|"currency",
      "recordsAffected": number
    }
  ],
  "standardizedSchema": {
    "fields": [{"name": string, "type": string, "format": string}]
  },
  "dateFormat": string,
  "currencyFormat": string,
  "textNormalization": {"lowered": number, "trimmed": number, "encoded": number},
  "status": "complete"
}`;

    return this.callModelJSON(prompt, { temperature: 0.1, maxTokens: 2000 });
  }

  private async detectAnomalies(data: any[]): Promise<Record<string, any>> {
    const prompt = `Detect anomalies and outliers in this dataset:

Data: ${JSON.stringify(Array.isArray(data) ? data.slice(0, 20) : data, null, 2)}

Return JSON:
{
  "totalRecords": number,
  "anomaliesDetected": number,
  "anomalies": [
    {
      "recordIndex": number,
      "field": string,
      "value": any,
      "expectedRange": string,
      "anomalyType": "outlier"|"impossible"|"inconsistent"|"suspicious"|"drift",
      "confidence": number (0-1),
      "severity": "low"|"medium"|"high"|"critical",
      "suggestedAction": "review"|"correct"|"remove"|"flag"
    }
  ],
  "statisticalSummary": {
    "mean": object,
    "stdDev": object,
    "outlierThreshold": number
  },
  "dataQualityImpact": string,
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async enrichData(data: any[]): Promise<Record<string, any>> {
    const prompt = `Enrich this dataset with additional derived fields and context:

Data: ${JSON.stringify(Array.isArray(data) ? data.slice(0, 10) : data, null, 2)}

Return JSON:
{
  "totalRecords": number,
  "enrichments": [
    {
      "field": string,
      "type": "derived"|"categorized"|"geo"|"temporal"|"sentiment"|"entity",
      "description": string,
      "coverage": number (percentage of records enriched)
    }
  ],
  "newFields": [{"name": string, "type": string, "source": string}],
  "categories": [{"field": string, "categories": [string]}],
  "geoEnrichment": {"field": string, "regions": [string]},
  "temporalEnrichment": {"patterns": [string]},
  "enrichmentRate": number (0-100),
  "status": "complete"
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2000 });
  }

  private async generateQualityReport(data: any[]): Promise<Record<string, any>> {
    const prompt = `Generate a comprehensive data quality report:

Data sample: ${JSON.stringify(Array.isArray(data) ? data.slice(0, 10) : data, null, 2)}
Total records: ${Array.isArray(data) ? data.length : 1}

Return JSON:
{
  "report": {
    "generatedAt": "${new Date().toISOString()}",
    "totalRecords": number,
    "overallScore": number (0-100),
    "grade": "A"|"B"|"C"|"D"|"F",
    "dimensions": {
      "completeness": {"score": number, "details": string},
      "accuracy": {"score": number, "details": string},
      "consistency": {"score": number, "details": string},
      "timeliness": {"score": number, "details": string},
      "uniqueness": {"score": number, "details": string},
      "validity": {"score": number, "details": string}
    },
    "issues": [{"severity": "critical"|"high"|"medium"|"low", "description": string, "affectedRecords": number, "fix": string}],
    "trends": {"improving": [string], "degrading": [string]},
    "recommendations": [{"priority": number, "action": string, "expectedImprovement": string}]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2500 });
  }

  private async runCleanPipeline(data: any[], schema?: any, rules?: any): Promise<Record<string, any>> {
    const prompt = `Run a full data cleaning pipeline on this dataset:

Data: ${JSON.stringify(Array.isArray(data) ? data.slice(0, 10) : data, null, 2)}
Schema: ${JSON.stringify(schema || 'auto')}
Rules: ${JSON.stringify(rules || 'standard')}

Execute these steps: 1) Validate 2) Deduplicate 3) Standardize 4) Detect anomalies 5) Enrich

Return JSON:
{
  "pipeline": {
    "startedAt": "${new Date().toISOString()}",
    "steps": [
      {"step": "validate", "status": "complete", "recordsProcessed": number, "issuesFound": number},
      {"step": "deduplicate", "status": "complete", "duplicatesRemoved": number},
      {"step": "standardize", "status": "complete", "transformations": number},
      {"step": "anomaly_detection", "status": "complete", "anomaliesFound": number},
      {"step": "enrich", "status": "complete", "fieldsAdded": number}
    ],
    "inputRecords": number,
    "outputRecords": number,
    "qualityBefore": number,
    "qualityAfter": number,
    "improvement": number,
    "completedAt": "${new Date().toISOString()}"
  },
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }
}

export default DataCleanAgent;
