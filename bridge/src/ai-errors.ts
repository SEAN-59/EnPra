import { AiResponseError } from './ai-json.js';
import { CodexRequestError } from './codex.js';

const categories = [
  'ContextWindowExceeded', 'UsageLimitExceeded', 'HttpConnectionFailed',
  'ResponseStreamConnectionFailed', 'ResponseStreamDisconnected',
  'ResponseTooManyFailedAttempts', 'BadRequest', 'Unauthorized',
  'SandboxError', 'InternalServerError', 'Other',
] as const;

export function describeAiFailure(error: unknown) {
  const codex = error instanceof CodexRequestError ? error : null;
  const value = codex?.codexErrorInfo;
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : null;
  const category = categories.find(name => {
    const wireName = name[0].toLowerCase() + name.slice(1);
    return value === name || value === wireName || Boolean(record && (Object.hasOwn(record, name) || Object.hasOwn(record, wireName)));
  }) ?? null;
  const details = record && category
    ? record[category] ?? record[category[0].toLowerCase() + category.slice(1)]
    : record;
  const statusValue = details && typeof details === 'object'
    ? (details as Record<string, unknown>).httpStatusCode
    : null;
  const httpStatusCode = typeof statusValue === 'number' && Number.isInteger(statusValue) && statusValue >= 100 && statusValue <= 599 ? statusValue : null;
  const localCode = ['CODEX_SERVER_STOPPED', 'CODEX_REQUEST_TIMEOUT', 'CODEX_TURN_TIMEOUT', 'CODEX_STRUCTURED_OUTPUT_AMBIGUOUS'].includes(String(codex?.code)) ? String(codex?.code) : null;
  const invalidOutput = error instanceof AiResponseError;
  const metadata = {
    errorType: codex ? 'codex' : invalidOutput ? 'ai_response' : 'internal',
    rpcCode: typeof codex?.code === 'number' ? codex.code : null,
    localCode,
    codexErrorCategory: category,
    httpStatusCode,
    additionalDetailsPresent: Boolean(codex?.additionalDetails),
  };

  if (category === 'Unauthorized' || httpStatusCode === 401)
    return { status: 409 as const, message: 'ChatGPT 연결을 다시 확인해 주세요.', metadata };
  if (category === 'UsageLimitExceeded' || httpStatusCode === 429)
    return { status: 429 as const, message: 'AI 사용량 제한에 도달했습니다. 잠시 후 다시 시도해 주세요.', metadata };
  if (localCode === 'CODEX_REQUEST_TIMEOUT' || localCode === 'CODEX_TURN_TIMEOUT')
    return { status: 504 as const, message: 'AI 응답 시간이 초과되었습니다. 다시 시도해 주세요.', metadata };
  if (localCode === 'CODEX_SERVER_STOPPED')
    return { status: 503 as const, message: 'AI 연결이 중단되었습니다. 다시 시도해 주세요.', metadata };
  if (localCode === 'CODEX_STRUCTURED_OUTPUT_AMBIGUOUS')
    return { status: 502 as const, message: 'AI 최종 응답 형식을 확인하지 못했습니다. 다시 시도해 주세요.', metadata };
  if (invalidOutput)
    return { status: 502 as const, message: 'AI 응답 형식을 확인하지 못했습니다. 다시 시도해 주세요.', metadata };
  return { status: codex ? 502 as const : 500 as const, message: '요청을 처리하지 못했습니다. 다시 시도해 주세요.', metadata };
}
