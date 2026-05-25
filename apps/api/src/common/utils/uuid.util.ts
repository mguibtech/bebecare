import { v7 as uuidV7 } from 'uuid';

// Gera um UUID v7. Vantagens sobre o v4:
//  - Inclui timestamp ms no prefixo → entradas ficam ordenadas cronologicamente
//  - Melhor performance de índice no Postgres (menos fragmentação)
//  - Continua sendo único e suficientemente aleatório
export function generateUuidV7(): string {
  return uuidV7();
}
