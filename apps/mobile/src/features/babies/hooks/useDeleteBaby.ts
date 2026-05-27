/**
 * Deletar bebe (soft-delete no backend, recuperavel 30 dias).
 *
 * onSuccess:
 *  - remove cache do detalhe
 *  - invalida lista
 *  - se o bebe deletado era o selecionado, limpa selecao (useBabies vai
 *    auto-selecionar outro se restou apenas 1)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { babiesApi } from '../api/babies.api';
import { useBabySelectorStore } from '../store/baby-selector.store';

export function useDeleteBaby() {
  const queryClient = useQueryClient();
  const selectedBabyId = useBabySelectorStore((s) => s.selectedBabyId);
  const setSelected = useBabySelectorStore((s) => s.setSelected);

  return useMutation<void, Error, string>({
    mutationFn: (id) => babiesApi.remove(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: qk.babies.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: qk.babies.list() });
      if (selectedBabyId === deletedId) {
        setSelected(null);
      }
    },
  });
}
