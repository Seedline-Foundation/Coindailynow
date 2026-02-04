/**
 * AI Model Configuration
 * Open-source models for cost-effective, self-hosted AI system
 */

export const MODEL_CONFIG = {
  // Article Writing & Headline Optimization
  writer: {
    model: 'meta-llama/Llama-3.1-8B-Instruct',
    params: '8.4B',
    quantization: '4-bit',
    apiEndpoint: process.env.LLAMA_API_ENDPOINT || 'http://localhost:11434',
    apiType: 'ollama', // Can be 'ollama', 'vllm', 'text-generation-inference'
    contextLength: 128000, // 128k context window
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  },

  // SEO, Search Optimization, and Reasoning
  seo: {
    model: 'deepseek-ai/DeepSeek-R1-Distill-Llama-8B',
    params: '8B',
    apiEndpoint: process.env.DEEPSEEK_API_ENDPOINT || 'http://localhost:11434',
    apiType: 'ollama',
    contextLength: 128000,
    temperature: 0.3, // Lower for reasoning tasks
    maxTokens: 4096,
    topP: 0.9,
    // DeepSeek-R1 reasoning parameters
    useReasoningMode: true,
    maxReasoningTokens: 8192,
    reasoningEffort: 'high' // low, medium, high
  },

  // Review Agent (validation and quality control)
  review: {
    model: 'deepseek-ai/DeepSeek-R1-Distill-Llama-8B',
    params: '8B',
    apiEndpoint: process.env.DEEPSEEK_API_ENDPOINT || 'http://localhost:11434',
    apiType: 'ollama',
    contextLength: 128000,
    temperature: 0.2, // Very low for consistent validation
    maxTokens: 2048,
    useReasoningMode: true,
    reasoningEffort: 'medium'
  },

  // Translation
  translation: {
    model: 'facebook/nllb-200-distilled-600M',
    params: '600M',
    apiEndpoint: process.env.NLLB_API_ENDPOINT || 'http://localhost:8080',
    apiType: 'transformers', // HuggingFace Transformers
    batchSize: 8, // Translate multiple languages in parallel
    maxLength: 512,
    numBeams: 4,
    earlyStopping: true,
    // Supported language codes
    languages: {
      'Hausa': 'hau_Latn',
      'Yoruba': 'yor_Latn',
      'Igbo': 'ibo_Latn',
      'Swahili': 'swh_Latn',
      'Amharic': 'amh_Ethi',
      'Zulu': 'zul_Latn',
      'Shona': 'sna_Latn',
      'Afrikaans': 'afr_Latn',
      'Somali': 'som_Latn',
      'Oromo': 'orm_Latn',
      'Arabic': 'arb_Arab',
      'French': 'fra_Latn',
      'Portuguese': 'por_Latn',
      'Wolof': 'wol_Latn',
      'Kinyarwanda': 'kin_Latn'
    }
  },

  // Image Generation
  image: {
    model: 'stabilityai/stable-diffusion-xl-base-1.0',
    framework: 'openvino', // Intel OpenVINO for CPU optimization
    apiEndpoint: process.env.SDXL_API_ENDPOINT || 'http://localhost:7860',
    apiType: 'automatic1111', // Can be 'automatic1111', 'comfyui', 'diffusers'
    width: 1024,
    height: 1024,
    steps: 30,
    guidanceScale: 7.5,
    sampler: 'DPM++ 2M Karras',
    clipSkip: 2,
    // OpenVINO optimization
    device: 'CPU', // 'CPU', 'GPU', 'AUTO'
    precision: 'INT8', // INT8 for faster inference on CPU
    enableVaeSlicing: true,
    enableAttentionSlicing: true
  },

  // RAG (Retrieval Augmented Generation)
  rag: {
    embeddingModel: 'BAAI/bge-small-en-v1.5',
    params: '33M',
    apiEndpoint: process.env.EMBEDDING_API_ENDPOINT || 'http://localhost:8081',
    vectorDb: 'chromadb', // chromadb, qdrant, weaviate
    chunkSize: 512,
    chunkOverlap: 50,
    topK: 5, // Number of relevant chunks to retrieve
    similarityThreshold: 0.7
  }
};

/**
 * Model endpoints configuration
 * For self-hosted deployment on Contabo VPS
 */
export const DEPLOYMENT_CONFIG = {
  // Container orchestration
  orchestrator: 'docker-compose', // docker-compose, kubernetes
  
  // Resource allocation
  resources: {
    llama: {
      cpuCores: 4,
      ramGb: 8,
      gpu: false, // Set to true if GPU available
      port: 11434
    },
    deepseek: {
      cpuCores: 4,
      ramGb: 8,
      gpu: false,
      port: 11435
    },
    nllb: {
      cpuCores: 2,
      ramGb: 4,
      gpu: false,
      port: 8080
    },
    sdxl: {
      cpuCores: 6,
      ramGb: 12,
      gpu: false, // OpenVINO optimized for CPU
      port: 7860
    },
    embeddings: {
      cpuCores: 2,
      ramGb: 2,
      gpu: false,
      port: 8081
    }
  },

  // Monitoring
  monitoring: {
    prometheus: {
      enabled: true,
      port: 9090
    },
    grafana: {
      enabled: true,
      port: 3001
    }
  }
};

/**
 * Performance benchmarks (estimated on Contabo VPS)
 */
export const PERFORMANCE_BENCHMARKS = {
  llama: {
    tokensPerSecond: 15, // 4-bit quantization on CPU
    avgLatency: '2-4s for 1000 tokens',
    memoryUsage: '6GB'
  },
  deepseek: {
    tokensPerSecond: 12, // With reasoning
    avgLatency: '3-5s for 1000 tokens',
    memoryUsage: '6GB'
  },
  nllb: {
    tokensPerSecond: 50,
    avgLatency: '1-2s per translation',
    memoryUsage: '2GB'
  },
  sdxl: {
    secondsPerImage: 60, // OpenVINO INT8 on CPU
    avgLatency: '60-90s',
    memoryUsage: '8GB'
  }
};

/**
 * Fallback configuration
 * If self-hosted models are down, fallback to cloud APIs
 */
export const FALLBACK_CONFIG = {
  enabled: process.env.ENABLE_FALLBACK === 'true',
  
  writer: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    apiKey: process.env.OPENAI_API_KEY
  },
  
  image: {
    provider: 'openai',
    model: 'dall-e-3',
    apiKey: process.env.OPENAI_API_KEY
  },
  
  translation: {
    provider: 'huggingface',
    model: 'facebook/nllb-200-3.3B',
    apiKey: process.env.HUGGINGFACE_API_KEY
  }
};

export default MODEL_CONFIG;
