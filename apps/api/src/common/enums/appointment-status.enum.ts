// Estado de uma consulta agendada.
//  - SCHEDULED: agendada, ainda não chegou (ou recém-passou mas user ainda não atualizou)
//  - COMPLETED: realizada (user marcou após a consulta)
//  - CANCELED: cancelada manualmente pelo user (com motivo opcional)
//  - MISSED: cron detectou que passou > 24h sem ser marcada como COMPLETED/CANCELED
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  MISSED = 'missed',
}
