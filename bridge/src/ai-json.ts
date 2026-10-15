export class AiResponseError extends Error {
  readonly code = 'AI_RESPONSE_INVALID';

  constructor(message = 'AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.') {
    super(message);
    this.name = 'AiResponseError';
  }
}

export function parseAiJsonObject(value: string): Record<string, unknown> {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    const direct: unknown = JSON.parse(cleaned);
    if (!direct || typeof direct !== 'object' || Array.isArray(direct)) throw new AiResponseError();
    return direct as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AiResponseError) throw error;
  }
  const objects: unknown[] = [];
  let start = -1;
  let quoted = false;
  let escaped = false;
  const brackets: string[] = [];

  for (let index = 0; index < cleaned.length; index += 1) {
    const char = cleaned[index];
    if (start < 0) {
      if (char !== '{' && char !== '[') continue;
      start = index;
      brackets.push(char);
      continue;
    }
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === '{' || char === '[') brackets.push(char);
    else if (char === '}' || char === ']') {
      if (brackets.pop() !== (char === '}' ? '{' : '[')) throw new AiResponseError();
      if (!brackets.length) {
        const candidate = cleaned.slice(start, index + 1);
        try {
          objects.push(JSON.parse(candidate));
        } catch {
          if (/^\{\s*"/.test(candidate)) throw new AiResponseError();
          // Prose may contain braces, but never repair malformed model JSON.
        }
        start = -1;
      }
    }
  }

  if (start >= 0 || objects.length !== 1) throw new AiResponseError();
  const result = objects[0];
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new AiResponseError();
  return result as Record<string, unknown>;
}
