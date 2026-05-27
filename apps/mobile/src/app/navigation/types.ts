import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Tipos das rotas do app.
 * Convencao: cada navigator tem seu ParamList, e telas usam
 * NativeStackScreenProps<ParamList, 'Nome'> para tipar props.
 */

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  // Sera expandido com BabyProfile, VaccineCalendar, etc.
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;

/**
 * Augmenta os tipos do React Navigation para que useNavigation() infira
 * automaticamente as rotas disponiveis sem precisar passar generic toda vez.
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends AuthStackParamList, AppStackParamList {}
  }
}
