/**
 * Catalogo pt-BR — fonte-de-verdade das chaves. en.ts espelha estas chaves.
 * Pluralizacao via i18next: sufixos _one / _other com {{count}}.
 */
export const pt = {
  common: {
    retry: 'Tentar de novo',
    cancel: 'Cancelar',
    save: 'Salvar',
    delete: 'Excluir',
    loadErrorProfile: 'Erro ao carregar perfil',
    checkConnection: 'Verifique sua conexão e tente de novo.',
    signOut: 'Sair',
  },
  nav: {
    home: 'Início',
    today: 'Hoje',
    vaccines: 'Vacinas',
    health: 'Saúde',
    more: 'Mais',
  },
  home: {
    greetingMorning: 'Bom dia',
    greetingAfternoon: 'Boa tarde',
    greetingEvening: 'Boa noite',
    summaryToday: 'Aqui está o resumo do dia.',
    summaryStart: 'Vamos começar cadastrando seu bebê.',
    switchBaby: 'trocar',
    ageDays_one: '{{count}} dia',
    ageDays_other: '{{count}} dias',
    ageMonths_one: '{{count}} mês',
    ageMonths_other: '{{count}} meses',
    quickAppointment: 'Consulta',
    quickMedication: 'Remédio',
    quickSleep: 'Soninho',
    quickAlarm: 'Despertar',
    upcomingActivities: 'Próximas atividades',
    overdueVaccines_one: '{{count}} vacina atrasada',
    overdueVaccines_other: '{{count}} vacinas atrasadas',
    seeCalendar: 'Toque pra ver o calendário',
    appointmentSub: 'Consulta • {{when}}',
    pendingDoses_one: '{{count}} dose de remédio hoje',
    pendingDoses_other: '{{count}} doses de remédio hoje',
    seeDoses: 'Toque pra ver as doses',
    allClear: 'Está tudo em dia por aqui! 🎉',
    registerBabyTitle: 'Cadastre seu bebê',
    registerBabyBody: 'Vacinas, consultas, marcos e mais — tudo num lugar só.',
    registerBabyCta: 'Cadastrar bebê',
  },
  health: {
    appointments: 'Consultas',
    medications: 'Remédios',
  },
  appointments: {
    scopeUpcoming: 'Próximas',
    scopePast: 'Passadas',
    scopeCanceled: 'Canceladas',
    loadError: 'Erro ao carregar consultas',
    emptyUpcoming: 'Nenhuma consulta agendada. Use o + pra marcar a primeira.',
    emptyPast: 'Sem consultas realizadas ainda.',
    emptyCanceled: 'Nenhuma consulta cancelada.',
    fabAdd: 'Marcar consulta',
  },
};

export type TranslationCatalog = typeof pt;
