// Status calculado de uma dose de vacina para um bebê.
//  - APPLIED: já tomou (existe VaccineRecord)
//  - OVERDUE: passou da idade recomendada + tolerância (6m) e ainda não tomou
//  - DUE: está no prazo recomendado agora
//  - UPCOMING: ainda não atingiu a idade mínima
export enum VaccineStatus {
  APPLIED = 'applied',
  OVERDUE = 'overdue',
  DUE = 'due',
  UPCOMING = 'upcoming',
}
