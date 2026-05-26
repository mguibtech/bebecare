import { Injectable, Logger } from '@nestjs/common';
import { PushPayload } from '../interfaces/push-payload.interface';
import { PushSender, PushSendResult } from './push-sender';

// Implementação fake usada em 2 situações:
//
// 1) DEV/CI sem credenciais Firebase configuradas — backend sobe e loga
//    o que ENVIARIA, sem quebrar fluxos que dependem do NotificationsService.
//
// 2) Testes e2e — substituído via .overrideProvider(PUSH_SENDER) pra
//    capturar as chamadas e fazer asserts (quem recebeu o quê).
//
// Mantém estado público (`sent`) acessível pelos testes — em runtime real
// (cenário 1) é ignorado.
@Injectable()
export class StubSender implements PushSender {
  private readonly logger = new Logger(StubSender.name);

  // Histórico in-memory. Testes leem isto para verificar envios.
  // Cuidado: zera a cada boot do módulo, não persiste.
  public readonly sent: Array<{ tokens: string[]; payload: PushPayload }> = [];

  sendToTokens(tokens: string[], payload: PushPayload): Promise<PushSendResult[]> {
    this.sent.push({ tokens, payload });

    if (tokens.length > 0) {
      this.logger.warn(
        `[STUB] enviaria push "${payload.title}" para ${tokens.length} token(s) — ` +
          `Firebase não configurado ou modo teste`,
      );
    }

    // Todos "sucesso" — no stub assumimos que os tokens são válidos.
    return Promise.resolve(tokens.map((token) => ({ token, success: true })));
  }

  // Helper pros testes: limpar histórico entre specs.
  reset(): void {
    this.sent.length = 0;
  }
}
