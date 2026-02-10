/**
 * Anthropic 테마 프로바이더 (Claude tool_use)
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ThemeProvider, ThemeProviderResult } from './types';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const anthropicThemeProvider: ThemeProvider = {
  providerType: 'anthropic',

  async generateTheme({ systemPrompt, userPrompt, jsonSchema, model }): Promise<ThemeProviderResult> {
    const response = await getClient().messages.create({
      model: model.providerModel,
      max_tokens: 8192,
      system: systemPrompt,
      tools: [{
        name: 'create_wedding_theme',
        description: 'Creates a complete wedding invitation theme with all styling configurations.',
        input_schema: jsonSchema as Anthropic.Tool.InputSchema,
      }],
      tool_choice: { type: 'tool', name: 'create_wedding_theme' },
      messages: [{
        role: 'user',
        content: userPrompt,
      }],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ContentBlock & { type: 'tool_use' } =>
        block.type === 'tool_use'
    );

    if (!toolUse) {
      throw new Error('Anthropic: AI가 테마를 생성하지 못했습니다');
    }

    return {
      rawJson: toolUse.input,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  },
};
