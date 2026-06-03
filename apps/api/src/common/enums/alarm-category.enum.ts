// Categoria de um despertador (M7 — despertador da mamada).
// Usada só pra agrupar/iconizar no mobile e, no futuro, escolher o som padrão
// por categoria. Não muda o comportamento do alarme em si.
//  - FEEDING: mamada
//  - DIAPER:  troca de fralda
//  - NAP:     soneca / hora de dormir
//  - CUSTOM:  qualquer outro lembrete do dia a dia
export enum AlarmCategory {
  FEEDING = 'feeding',
  DIAPER = 'diaper',
  NAP = 'nap',
  CUSTOM = 'custom',
}
