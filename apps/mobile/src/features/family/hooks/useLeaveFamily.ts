/**
 * Sair da familia atual. Backend cria uma nova familia SOLO pro user.
 *
 * Falha com 400 se for o unico membro (usar exclusao de conta nesse caso).
 * Apos sucesso, invalida /auth/me (familyId mudou) e /family/me + /babies
 * (sao da familia antiga, agora vazios).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { useBabySelectorStore } from '@/features/babies/store/baby-selector.store';

import { familyApi } from '../api/family.api';

export function useLeaveFamily() {
  const queryClient = useQueryClient();
  const setSelected = useBabySelectorStore((s) => s.setSelected);

  return useMutation<void, Error, void>({
    mutationFn: () => familyApi.leave(),
    onSuccess: () => {
      // Bebes da familia antiga nao sao mais visiveis — limpa selecao.
      setSelected(null);
      // Refetch tudo dependente de familyId.
      queryClient.invalidateQueries({ queryKey: qk.auth.me() });
      queryClient.invalidateQueries({ queryKey: qk.family.me() });
      queryClient.invalidateQueries({ queryKey: qk.babies.all });
    },
  });
}
