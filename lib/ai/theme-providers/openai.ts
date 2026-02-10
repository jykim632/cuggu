/**
 * OpenAI 테마 프로바이더 (function calling)
 */

import OpenAI from 'openai';
import type { ThemeProvider, ThemeProviderResult } from './types';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is required for OpenAI theme generation');
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const openaiThemeProvider: ThemeProvider = {
  providerType: 'openai',

  async generateTheme({ systemPrompt, userPrompt, jsonSchema, model }): Promise<ThemeProviderResult> {
    const response = await getClient().chat.completions.create({
      model: model.providerModel,
      max_tokens: 8192,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'create_wedding_theme',
          description: 'Creates a complete wedding invitation theme with all styling configurations.',
          parameters: jsonSchema,
        },
      }],
      tool_choice: { type: 'function', function: { name: 'create_wedding_theme' } },
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== 'function') {
      throw new Error('OpenAI: AI가 테마를 생성하지 못했습니다');
    }

    const rawJson = JSON.parse(toolCall.function.arguments);

    return {
      rawJson,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    };
  },
};
