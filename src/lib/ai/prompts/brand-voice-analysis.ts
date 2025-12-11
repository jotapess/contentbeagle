/**
 * Brand Voice Analysis Prompts
 *
 * AI prompts for extracting brand voice, tone, and style from crawled content.
 * Returns structured JSON for populating brand_profiles table.
 */

export interface BrandVoiceAnalysisResult {
  // Voice characteristics
  voiceDescription: string;
  voiceAdjectives: string[];

  // Tone scales (1-10)
  toneFormality: number;
  toneEnthusiasm: number;
  toneHumor: number;
  toneConfidence: number;
  toneEmpathy: number;

  // Style characteristics
  sentenceStructure: 'simple' | 'complex' | 'mixed' | 'varied';
  paragraphLength: 'short' | 'medium' | 'long' | 'varied';
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced' | 'technical';
  preferredPov: 'first_singular' | 'first_plural' | 'second' | 'third' | 'mixed';

  // Terms and phrases
  powerWords: string[];
  avoidWords: string[];
  keyTerminology: Array<{ term: string; definition?: string }>;
  brandedPhrases: Array<{ phrase: string; context?: string }>;

  // Content themes
  coreThemes: string[];
  valuePropositions: string[];
  painPointsAddressed: string[];

  // Sample sentences that exemplify the brand voice
  sampleSentences: Array<{ sentence: string; characteristic: string }>;

  // Guidelines
  doList: string[];
  dontList: string[];

  // Confidence in the analysis (0-1)
  confidenceScore: number;
}

/**
 * System prompt for brand voice analysis
 */
export function buildBrandVoiceSystemPrompt(): string {
  return `You are an expert brand strategist and copywriter specializing in analyzing brand voice and communication style.

Your task is to analyze content from a company's website and extract their brand voice, tone, and style guidelines.

## Analysis Framework

### Voice Analysis
- Identify the overall voice personality (e.g., friendly, authoritative, innovative, caring)
- Extract adjectives that describe how the brand sounds
- Note the consistent characteristics across all content

### Tone Analysis (Scale 1-10)
- Formality: 1 = very casual/slang, 10 = very formal/corporate
- Enthusiasm: 1 = reserved/neutral, 10 = highly energetic/passionate
- Humor: 1 = serious/straightforward, 10 = playful/witty
- Confidence: 1 = humble/uncertain, 10 = bold/assertive
- Empathy: 1 = impersonal/factual, 10 = highly empathetic/emotional

### Style Analysis
- Sentence structure: simple, complex, mixed, or varied
- Paragraph length: short (1-2 sentences), medium (3-4), long (5+), or varied
- Vocabulary level: basic, intermediate, advanced, or technical
- Point of view: first person singular (I), first person plural (we), second person (you), third person, or mixed

### Terminology
- Power words: Impactful words the brand frequently uses
- Avoid words: Terms never or rarely used (competitors' names, negative terms)
- Key terminology: Industry or brand-specific terms with definitions
- Branded phrases: Unique expressions or taglines the brand uses

### Content Themes
- Core themes: Main topics and subjects the brand discusses
- Value propositions: Key benefits and promises made
- Pain points addressed: Problems the brand helps solve

### Guidelines
- Do's: Writing practices the brand follows
- Don'ts: Practices the brand avoids

## Output Format
Return your analysis as a valid JSON object matching the specified schema.
Be specific and provide concrete examples from the analyzed content.
Base your scores and findings only on evidence from the content provided.`;
}

/**
 * User prompt for brand voice analysis
 */
export function buildBrandVoiceUserPrompt(params: {
  brandName: string;
  industry?: string;
  pageContents: Array<{ url: string; title: string; content: string }>;
}): string {
  const { brandName, industry, pageContents } = params;

  let prompt = `Analyze the following website content for ${brandName}`;
  if (industry) {
    prompt += ` (${industry} industry)`;
  }
  prompt += ` and extract their brand voice, tone, and style guidelines.

## Website Content to Analyze

`;

  // Add each page's content
  pageContents.forEach((page, index) => {
    prompt += `### Page ${index + 1}: ${page.title || page.url}
URL: ${page.url}

${page.content.slice(0, 3000)}${page.content.length > 3000 ? '\n\n[Content truncated...]' : ''}

---

`;
  });

  prompt += `## Required Output

Return a JSON object with the following structure:

\`\`\`json
{
  "voiceDescription": "A 2-3 sentence description of the brand's overall voice",
  "voiceAdjectives": ["adjective1", "adjective2", "adjective3", "adjective4", "adjective5"],
  "toneFormality": 7,
  "toneEnthusiasm": 6,
  "toneHumor": 3,
  "toneConfidence": 8,
  "toneEmpathy": 5,
  "sentenceStructure": "mixed",
  "paragraphLength": "medium",
  "vocabularyLevel": "intermediate",
  "preferredPov": "first_plural",
  "powerWords": ["transform", "innovative", "seamless"],
  "avoidWords": ["cheap", "basic", "competitor_name"],
  "keyTerminology": [
    {"term": "term1", "definition": "what it means in brand context"},
    {"term": "term2", "definition": "what it means"}
  ],
  "brandedPhrases": [
    {"phrase": "tagline or unique phrase", "context": "how/where used"}
  ],
  "coreThemes": ["theme1", "theme2", "theme3"],
  "valuePropositions": ["value1", "value2"],
  "painPointsAddressed": ["pain1", "pain2"],
  "sampleSentences": [
    {"sentence": "An actual sentence from the content", "characteristic": "what it demonstrates"},
    {"sentence": "Another example sentence", "characteristic": "what it shows"}
  ],
  "doList": ["Use active voice", "Include specific examples", "Address the reader directly"],
  "dontList": ["Never use jargon without explanation", "Avoid passive voice", "Don't make claims without evidence"],
  "confidenceScore": 0.85
}
\`\`\`

Important:
- All tone scores must be integers from 1-10
- Provide at least 5 voice adjectives
- Provide at least 3 power words and avoid words
- Include at least 3 sample sentences from the actual content
- Confidence score should reflect how much content was available for analysis
- Base everything on actual evidence from the content, not assumptions`;

  return prompt;
}

/**
 * Parse the AI response into a structured result
 */
export function parseBrandVoiceResponse(response: string): BrandVoiceAnalysisResult | null {
  try {
    // Extract JSON from the response (might be wrapped in markdown code blocks)
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : response.trim();

    const parsed = JSON.parse(jsonStr);

    // Validate and provide defaults
    return {
      voiceDescription: parsed.voiceDescription || '',
      voiceAdjectives: Array.isArray(parsed.voiceAdjectives) ? parsed.voiceAdjectives : [],
      toneFormality: clampScore(parsed.toneFormality),
      toneEnthusiasm: clampScore(parsed.toneEnthusiasm),
      toneHumor: clampScore(parsed.toneHumor),
      toneConfidence: clampScore(parsed.toneConfidence),
      toneEmpathy: clampScore(parsed.toneEmpathy),
      sentenceStructure: validateEnum(parsed.sentenceStructure, ['simple', 'complex', 'mixed', 'varied'], 'mixed'),
      paragraphLength: validateEnum(parsed.paragraphLength, ['short', 'medium', 'long', 'varied'], 'medium'),
      vocabularyLevel: validateEnum(parsed.vocabularyLevel, ['basic', 'intermediate', 'advanced', 'technical'], 'intermediate'),
      preferredPov: validateEnum(parsed.preferredPov, ['first_singular', 'first_plural', 'second', 'third', 'mixed'], 'mixed'),
      powerWords: Array.isArray(parsed.powerWords) ? parsed.powerWords : [],
      avoidWords: Array.isArray(parsed.avoidWords) ? parsed.avoidWords : [],
      keyTerminology: Array.isArray(parsed.keyTerminology) ? parsed.keyTerminology : [],
      brandedPhrases: Array.isArray(parsed.brandedPhrases) ? parsed.brandedPhrases : [],
      coreThemes: Array.isArray(parsed.coreThemes) ? parsed.coreThemes : [],
      valuePropositions: Array.isArray(parsed.valuePropositions) ? parsed.valuePropositions : [],
      painPointsAddressed: Array.isArray(parsed.painPointsAddressed) ? parsed.painPointsAddressed : [],
      sampleSentences: Array.isArray(parsed.sampleSentences) ? parsed.sampleSentences : [],
      doList: Array.isArray(parsed.doList) ? parsed.doList : [],
      dontList: Array.isArray(parsed.dontList) ? parsed.dontList : [],
      confidenceScore: typeof parsed.confidenceScore === 'number'
        ? Math.max(0, Math.min(1, parsed.confidenceScore))
        : 0.5,
    };
  } catch (error) {
    console.error('Failed to parse brand voice response:', error);
    return null;
  }
}

/**
 * Clamp a score to 1-10 range
 */
function clampScore(value: unknown): number {
  if (typeof value !== 'number') return 5;
  return Math.max(1, Math.min(10, Math.round(value)));
}

/**
 * Validate enum value with fallback
 */
function validateEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T;
  }
  return fallback;
}
