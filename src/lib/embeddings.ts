const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ CRITICAL: Missing Supabase configuration!');
} else {
  console.log('✓ Supabase configuration detected');
}

async function callOpenAI(endpoint: string, body: any): Promise<any> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/openai-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      endpoint,
      method: 'POST',
      body,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = typeof errorData.error === 'string'
      ? errorData.error
      : errorData.error?.message || `Request failed: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function validateOpenAIKey(): Promise<{ valid: boolean; error?: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { valid: false, error: 'Supabase configuration is missing.' };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/openai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        endpoint: '/v1/models',
        method: 'GET',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = typeof errorData.error === 'string'
        ? errorData.error
        : errorData.error?.message || 'OpenAI API key is invalid or not configured';
      return { valid: false, error: errorMessage };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Failed to reach OpenAI proxy' };
  }
}

export function getAPIKeyStatus(): string {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return 'missing';
  }
  return 'configured';
}

export interface PersonaRole {
  name: string;
  prompt: string;
}

let dynamicRolePrompts: Record<string, string> = {};

export function setDynamicRoles(roles: PersonaRole[]) {
  dynamicRolePrompts = {};
  roles.forEach(role => {
    dynamicRolePrompts[role.name] = role.prompt;
  });
}

export async function analyzeDocumentsForPersonas(documentContents: string[], signal?: AbortSignal): Promise<PersonaRole[]> {
  const firstDocumentContent = documentContents[0]?.slice(0, 2000) || '';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  const combinedSignal = signal || controller.signal;

  try {
    const data = await callOpenAI('/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI that analyzes documents and creates appropriate persona roles for a chatbot. Based ONLY on the document content provided, suggest exactly 3 simple persona names that would be most helpful for answering questions about this document.

For each persona, provide:
1. A simple, clear name based on key categories/themes (e.g., "Technical Expert", "Business Analyst", "Compliance Officer")
2. A brief prompt describing how this persona should respond

IMPORTANT:
- Generate exactly 3 personas, no more, no less
- Scan for key categories and themes in the document
- Base personas ONLY on the actual content present
- Use simple, professional role names
- Keep it concise and fast

Return your response as a JSON array with this structure:
[
  {
    "name": "Persona Name",
    "prompt": "You are a [role]. Focus on [key aspects]."
  }
]`,
        },
        {
          role: 'user',
          content: `Analyze this document excerpt and suggest 3 key personas:\n\n${firstDocumentContent}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    clearTimeout(timeoutId);

    const content = data.choices[0].message.content;

    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      let personas: PersonaRole[] = [];

      if (jsonMatch) {
        personas = JSON.parse(jsonMatch[0]);
      } else {
        personas = JSON.parse(content);
      }

      return personas.slice(0, 3);
    } catch (error) {
      console.error('Failed to parse personas:', error);
      return [{
        name: 'General Assistant',
        prompt: 'You are a helpful assistant. Analyze the provided documents and answer questions based on their content.'
      }];
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Persona generation cancelled or timed out');
    }
    throw error;
  }
}

export async function generateEmbedding(text: string, retries = 3): Promise<number[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing.');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  const truncatedText = text.slice(0, 8000);
  console.log(`Generating embedding for text (${truncatedText.length} chars)...`);

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const data = await callOpenAI('/v1/embeddings', {
        input: truncatedText,
        model: 'text-embedding-3-small',
      });

      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('Invalid response from OpenAI API - missing embedding data');
      }

      console.log(`Successfully generated embedding with ${data.data[0].embedding.length} dimensions`);
      return data.data[0].embedding;
    } catch (error: any) {
      console.error(`Attempt ${attempt + 1}/${retries} failed:`, error.message);

      if (attempt === retries - 1) {
        throw new Error(`Failed to generate embedding after ${retries} attempts: ${error.message}`);
      }

      const waitTime = Math.pow(2, attempt) * 1000;
      console.warn(`Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('Failed to generate embedding after all retries');
}

export const EXACT_MATCH_THRESHOLD = 0.95;

export function isExactMatchScore(similarityScores: number[]): boolean {
  if (similarityScores.length === 0) return false;
  return Math.max(...similarityScores) >= EXACT_MATCH_THRESHOLD;
}

export async function getLLMResponse(
  prompt: string,
  role: string,
  context: string = '',
  similarityScores: number[] = []
): Promise<{ response: string; confidence: number; exactMatch: boolean }> {
  const roleInstruction = dynamicRolePrompts[role] || 'You are a helpful assistant analyzing documents. Provide clear and accurate responses based on the provided information.';

  const systemPrompt = `${roleInstruction}

IMPORTANT: You must ONLY use information from the provided context below. This context comes from uploaded documents that have been processed and retrieved based on relevance to the user's question.

Rules:
- Base your answer EXCLUSIVELY on the provided context
- If the context doesn't contain enough information to answer the question, clearly state this
- Do not use external knowledge or make assumptions beyond what's in the context
- Cite specific parts of the context when making claims`;

  const userPrompt = context
    ? `Context from uploaded documents:\n${context}\n\nQuestion: ${prompt}`
    : `No uploaded documents available.\n\nQuestion: ${prompt}`;

  const data = await callOpenAI('/v1/chat/completions', {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    temperature: 0.7,
  });

  const llmResponse = data.choices[0].message.content;

  const exactMatch = isExactMatchScore(similarityScores);

  if (exactMatch) {
    return {
      response: llmResponse,
      confidence: 1.0,
      exactMatch: true,
    };
  }

  const transformSimilarityToConfidence = (similarity: number): number => {
    const scaled = Math.pow(similarity, 0.5);
    const boosted = scaled + (similarity - 0.3) * 0.3;
    return Math.max(0.5, Math.min(0.98, boosted));
  };

  const confidence = similarityScores.length > 0
    ? similarityScores.reduce((sum, score) => sum + transformSimilarityToConfidence(score), 0) / similarityScores.length
    : 0.5;

  return {
    response: llmResponse,
    confidence,
    exactMatch: false,
  };
}

export function calculateSimilarity(
  embedding1: number[],
  embedding2: number[]
): number {
  const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
  const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
  const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

export function formatAccuracy(accuracy: number): string {
  const percentage = accuracy * 100;

  if (percentage >= 90) {
    return `High Confidence (${percentage.toFixed(1)}%)`;
  } else if (percentage >= 70) {
    return `Medium Confidence (${percentage.toFixed(1)}%)`;
  } else {
    return `Low Confidence (${percentage.toFixed(1)}%)`;
  }
}

export function getAccuracyColor(accuracy: number): string {
  const percentage = accuracy * 100;

  if (percentage >= 90) {
    return 'text-green-600 bg-green-50';
  } else if (percentage >= 70) {
    return 'text-orange-600 bg-orange-50';
  } else {
    return 'text-red-600 bg-red-50';
  }
}

export interface BiasHallucinationAnalysis {
  biasScore: number;
  hallucinationScore: number;
  driftScore: number;
  biasAnalysis: string;
  hallucinationAnalysis: string;
  driftAnalysis: string;
}

export async function analyzeBiasAndHallucination(
  prompt: string,
  response: string,
  context: string,
  exactMatch: boolean = false
): Promise<BiasHallucinationAnalysis> {
  if (exactMatch) {
    return {
      biasScore: 0,
      hallucinationScore: 0,
      driftScore: 0,
      biasAnalysis: 'Exact match detected — response is directly grounded in retrieved content. No bias present.',
      hallucinationAnalysis: 'Exact match detected — all response content is fully supported by the source documents. No hallucination.',
      driftAnalysis: 'Exact match detected — response perfectly aligns with retrieved context. No drift.',
    };
  }

  const analysisPrompt = `You are an AI quality evaluator. Analyze the following LLM response for bias, hallucination, and drift.

USER QUESTION: ${prompt}

CONTEXT PROVIDED TO LLM:
${context || 'No context was provided'}

LLM RESPONSE:
${response}

Evaluate the response and provide:
1. BIAS SCORE (0.0-1.0): Measure bias in terms of unfair favoritism, stereotyping, or subjective language
   - 0.0-0.3: Minimal bias, neutral and objective
   - 0.3-0.6: Moderate bias, some subjective elements
   - 0.6-1.0: High bias, clear favoritism or stereotypes

2. HALLUCINATION SCORE (0.0-1.0): Measure if the response contains information NOT in the provided context
   - 0.0-0.3: Minimal hallucination, stays within context
   - 0.3-0.6: Moderate hallucination, some unsupported claims
   - 0.6-1.0: High hallucination, significant invented information

3. DRIFT SCORE (0.0-1.0): Measure response pattern deviation and consistency
   - 0.0-0.3: Consistent, predictable responses aligned with context
   - 0.3-0.6: Moderate variation, some unexpected elements
   - 0.6-1.0: High drift, significant deviation from expected patterns

4. BIAS ANALYSIS: Brief explanation of bias findings (2-3 sentences)

5. HALLUCINATION ANALYSIS: Brief explanation of hallucination findings (2-3 sentences)

6. DRIFT ANALYSIS: Brief explanation of drift findings (2-3 sentences)

Return your response as JSON:
{
  "biasScore": 0.0,
  "hallucinationScore": 0.0,
  "driftScore": 0.0,
  "biasAnalysis": "explanation",
  "hallucinationAnalysis": "explanation",
  "driftAnalysis": "explanation"
}`;

  try {
    const data = await callOpenAI('/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an objective AI quality evaluator. Provide accurate bias and hallucination assessments.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = data.choices[0].message.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        biasScore: Math.min(1, Math.max(0, parsed.biasScore || 0)),
        hallucinationScore: Math.min(1, Math.max(0, parsed.hallucinationScore || 0)),
        driftScore: Math.min(1, Math.max(0, parsed.driftScore || 0)),
        biasAnalysis: parsed.biasAnalysis || 'No bias analysis available',
        hallucinationAnalysis: parsed.hallucinationAnalysis || 'No hallucination analysis available',
        driftAnalysis: parsed.driftAnalysis || 'No drift analysis available',
      };
    }

    throw new Error('Invalid response format');
  } catch (error: any) {
    console.error('Error analyzing bias and hallucination:', error);
    return {
      biasScore: 0,
      hallucinationScore: 0,
      driftScore: 0,
      biasAnalysis: 'Analysis failed: ' + error.message,
      hallucinationAnalysis: 'Analysis failed: ' + error.message,
      driftAnalysis: 'Analysis failed: ' + error.message,
    };
  }
}
