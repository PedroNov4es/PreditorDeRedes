export type ApiErrorKind = 'network' | 'timeout' | 'http';

/** Erro da camada de API com mensagem já em linguagem simples (RNF07 / RNF11). */
export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    readonly status?: number,
    readonly code?: string,
    technical?: string,
  ) {
    super(technical ?? kind);
    this.name = 'ApiError';
  }

  get userMessage(): string {
    if (this.kind === 'timeout') {
      return 'O serviço de previsão demorou para responder. Verifique sua internet e tente novamente.';
    }
    if (this.kind === 'network') {
      return 'Não foi possível conectar ao serviço de previsão. Verifique sua internet e tente novamente.';
    }
    if (this.status === 404) {
      return 'Ainda não há previsão disponível para esta escolha. Tente outra região ou outro horário.';
    }
    if (this.status === 422 || this.status === 400) {
      return 'Não foi possível consultar com os dados escolhidos. Volte e escolha novamente.';
    }
    return 'O serviço de previsão está com problemas no momento. Tente novamente em instantes.';
  }
}

export function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError('network', undefined, undefined, String(error));
}
