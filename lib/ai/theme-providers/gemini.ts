/**
 * Google Gemini 테마 프로바이더 (functionDeclarations)
 */

import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';
import type { ThemeProvider, ThemeProviderResult } from './types';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is required for Gemini theme generation');
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/**
 * Gemini가 처리 못하는 JSON Schema 키워드 제거
 * (toJSONSchema가 draft-2020-12 생성 → $schema 등 strip)
 */
function stripUnsupportedKeys(schema: Record<string, unknown>): Record<string, unknown> {
  const stripped = { ...schema };
  delete stripped.$schema;
  delete stripped.$id;
  delete stripped.propertyNames;

  // 재귀적으로 properties 내부도 정리
  if (stripped.properties && typeof stripped.properties === 'object') {
    const props: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(stripped.properties as Record<string, unknown>)) {
      if (value && typeof value === 'object') {
        props[key] = stripUnsupportedKeys(value as Record<string, unknown>);
      } else {
        props[key] = value;
      }
    }
    stripped.properties = props;
  }

  if (stripped.items && typeof stripped.items === 'object') {
    stripped.items = stripUnsupportedKeys(stripped.items as Record<string, unknown>);
  }

  // anyOf, oneOf 내부도 정리
  for (const keyword of ['anyOf', 'oneOf', 'allOf'] as const) {
    if (Array.isArray(stripped[keyword])) {
      stripped[keyword] = (stripped[keyword] as Record<string, unknown>[]).map(
        (item) => stripUnsupportedKeys(item)
      );
    }
  }

  return stripped;
}

export const geminiThemeProvider: ThemeProvider = {
  providerType: 'gemini',

  async generateTheme({ systemPrompt, userPrompt, jsonSchema, model }): Promise<ThemeProviderResult> {
    const ai = getClient();
    const cleanSchema = stripUnsupportedKeys(jsonSchema);

    const response = await ai.models.generateContent({
      model: model.providerModel,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        tools: [{
          functionDeclarations: [{
            name: 'create_wedding_theme',
            description: 'Creates a complete wedding invitation theme with all styling configurations.',
            parameters: cleanSchema,
          }],
        }],
        toolConfig: {
          functionCallingConfig: { mode: FunctionCallingConfigMode.ANY, allowedFunctionNames: ['create_wedding_theme'] },
        },
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('Gemini: 응답 후보가 없습니다');
    }

    const parts = candidates[0].content?.parts;
    const functionCall = parts?.find((p: any) => p.functionCall);
    if (!functionCall?.functionCall?.args) {
      throw new Error('Gemini: AI가 테마를 생성하지 못했습니다');
    }

    return {
      rawJson: functionCall.functionCall.args,
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    };
  },
};
