import Anthropic from '@anthropic-ai/sdk';
import { SerializableThemeSchema } from '@/schemas/theme';
import { toJSONSchema } from 'zod';
import { THEME_SYSTEM_PROMPT } from './theme-prompt';
import { validateThemeClasses } from '@/lib/templates/safelist';
import type { SerializableTheme } from '@/lib/templates/types';

let anthropic: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

/**
 * Claude API를 사용하여 사용자 프롬프트로부터 웨딩 테마를 생성
 *
 * tool_use 방식으로 JSON 구조를 강제하고,
 * Zod + safelist 이중 검증 후 반환
 */
export async function generateTheme(userPrompt: string): Promise<SerializableTheme> {
  const client = getClient();

  // Zod v4 → JSON Schema 변환 (tool input_schema용)
  const jsonSchema = toJSONSchema(SerializableThemeSchema);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    system: THEME_SYSTEM_PROMPT,
    tools: [{
      name: 'create_wedding_theme',
      description: 'Creates a complete wedding invitation theme with all styling configurations. Every field must use valid Tailwind CSS classes.',
      input_schema: jsonSchema as Anthropic.Tool.InputSchema,
    }],
    tool_choice: { type: 'tool', name: 'create_wedding_theme' },
    messages: [{
      role: 'user',
      content: `다음 컨셉으로 웨딩 청첩장 테마를 만들어주세요: ${userPrompt}`,
    }],
  });

  // tool_use 블록 추출
  const toolUse = response.content.find(
    (block): block is Anthropic.ContentBlock & { type: 'tool_use' } =>
      block.type === 'tool_use'
  );

  if (!toolUse) {
    throw new Error('AI가 테마를 생성하지 못했습니다');
  }

  // 1. Zod 구조 검증
  const parsed = SerializableThemeSchema.parse(toolUse.input);

  // 2. Tailwind safelist 클래스 검증
  validateThemeClasses(parsed as unknown as Record<string, unknown>);

  return parsed as unknown as SerializableTheme;
}
