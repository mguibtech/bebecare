/**
 * Augmenta o tipo global do `console` com a propriedade `tron` adicionada em
 * dev pelo modulo reactotron.ts. Permite usar `console.tron.log/display/...`
 * em qualquer arquivo sem import.
 */

import type Reactotron from 'reactotron-react-native';

declare global {
  interface Console {
    /**
     * Disponivel APENAS em __DEV__ (modulo carregado via require condicional
     * em index.js). Em producao eh undefined.
     */
    tron: typeof Reactotron;
  }
}

export {};
