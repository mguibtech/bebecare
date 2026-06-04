/**
 * Configuracao de deep links (React Navigation v7 linking API).
 *
 * Schemes suportados:
 *  - bebecare://invite/:inviteCode  → Register com código pre-preenchido
 *  - bebecare://família              → FamilyScreen (logado)
 *  - bebecare://bebê/novo            → BabyForm (logado)
 *  - bebecare://bebê/:babyId         → BabyDetail (logado)
 *  - bebecare://vacinas|saúde|mais  → Tab correspondente
 *
 * Quando o user toca um link `bebecare://invite/ABC123`:
 *  1. Android intent-filter (AndroidManifest.xml) captura o scheme.
 *  2. RN Navigation `linking` parseia o caminho.
 *  3. Se deslogado: AuthNavigator monta Register com inviteCode='ABC123'.
 *  4. Se logado: linking não tem efeito (Register não existe no AppStack).
 *     Edge case futuro: criar AcceptInviteScreen no AppStack pra "trocar de
 *     família" sem precisar deslogar.
 *
 * Por que `LinkingOptions<ReactNavigation.RootParamList>`: o tipo combina
 * AuthStack + AppStack + MainTabs (declaracao global no types.ts), permitindo
 * mapear screens de ambos navegadores num so config — o RN resolve dinamicamente
 * baseado em qual navegador esta montado.
 */

import type { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: ['bebecare://'],
  config: {
    screens: {
      // Auth stack (deslogado)
      Login: 'login',
      Register: 'invite/:inviteCode',

      // App stack (logado)
      MainTabs: {
        screens: {
          Home: '',
          Vaccines: 'vacinas',
          Health: 'saúde',
          More: 'mais',
        },
      },
      Family: 'família',
      BabyForm: 'bebê/novo',
      BabyDetail: 'bebê/:babyId',
    },
  },
};
