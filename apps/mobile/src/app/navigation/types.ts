import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Tipos das rotas do app.
 * Convencao: cada navigator tem seu ParamList, e telas usam
 * NativeStackScreenProps<ParamList, 'Nome'> para tipar props.
 *
 * Topologia atual:
 *   RootNavigator (decide auth/app status)
 *     ├─ AuthStack       (Login, Register)              quando deslogado
 *     └─ AppStack        (MainTabs, BabyForm, BabyDetail) quando logado
 *           └─ MainTabs   (Home, Vaccines, Health, More)
 *
 * BabyForm e BabyDetail vivem no AppStack (sobre as tabs) pra abrir como
 * push full-screen sem o footer de tabs atrapalhar.
 */

export type AuthStackParamList = {
  Login: undefined;
  /**
   * Register aceita inviteCode via deep link (bebecare://invite/:code).
   * Sem param = cadastro normal (cria familia solo).
   */
  Register: { inviteCode?: string } | undefined;
};

/** Tabs principais quando o usuario esta autenticado. */
export type MainTabsParamList = {
  Home: undefined;
  Vaccines: undefined;
  Health: undefined;
  More: undefined;
};

export type AppStackParamList = {
  /** Container das 4 tabs. Aninhado no stack. */
  MainTabs: NavigatorScreenParams<MainTabsParamList> | undefined;
  /**
   * Form de bebe — cria (sem babyId) ou edita (com babyId).
   * Mesmo screen, modo controlado por param.
   */
  BabyForm: { babyId?: string } | undefined;
  /** Detalhe/visualizacao de um bebe especifico. */
  BabyDetail: { babyId: string };
  /** Tela de familia (membros + convites + sair). */
  Family: undefined;
  /** Detalhe de uma vacina especifica do bebe (info + historico). */
  VaccineDetail: { babyId: string; vaccineId: string };
  /** Form de consulta — cria (sem appointmentId) ou edita (com appointmentId). */
  AppointmentForm: { babyId: string; appointmentId?: string };
  /** Detalhe de consulta — info + acoes (Completar/Cancelar/Apagar). */
  AppointmentDetail: { babyId: string; appointmentId: string };
  /** Form de medicamento — cria (sem medicationId) ou edita (com medicationId). */
  MedicationForm: { babyId: string; medicationId?: string };
  /** Detalhe de medicamento — info + schedules + apagar. */
  MedicationDetail: { babyId: string; medicationId: string };
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;

/**
 * Screen props pras telas dentro do MainTabs.
 * CompositeScreenProps permite navegar tanto entre tabs quanto pro stack pai
 * (ex.: de Home pra BabyForm).
 */
export type MainTabScreenProps<T extends keyof MainTabsParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabsParamList, T>,
    NativeStackScreenProps<AppStackParamList>
  >;

/**
 * Augmenta os tipos do React Navigation para que useNavigation() infira
 * automaticamente as rotas disponiveis sem precisar passar generic toda vez.
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList
      extends AuthStackParamList,
        AppStackParamList,
        MainTabsParamList {}
  }
}
