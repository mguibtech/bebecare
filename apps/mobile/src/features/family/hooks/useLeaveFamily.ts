/**
 * Sair da família atual. Backend cria uma nova família SOLO pro user.
 *
 * Falha com 400 se for o unico membro (usar exclusao de conta nesse caso).
 * Apos sucesso, inválida /auth/me (familyId mudou) e /family/me + /babies
 * (são da família antiga, agora vazios).
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
      // Bebês da família antiga não são mais visiveis — limpa selecao.
      setSelected(null);
      // Refetch tudo dependente de familyId.
      queryClient.invalidateQueries({ queryKey: qk.auth.me() });
      queryClient.invalidateQueries({ queryKey: qk.family.me() });
      queryClient.invalidateQueries({ queryKey: qk.babies.all });
    },
  });
}
