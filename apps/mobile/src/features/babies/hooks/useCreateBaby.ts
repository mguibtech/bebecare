/**
 * Cadastrar bebe. Em sucesso:
 *  - invalida lista pra refetch
 *  - popula cache do detalhe (poupa request)
 *  - auto-seleciona o novo bebe (afinal o user acabou de criar)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { babiesApi } from '../api/babies.api';
import { useBabySelectorStore } from '../store/baby-selector.store';
import type { Baby, CreateBabyBody } from '../types';

export function useCreateBaby() {
  const queryClient = useQueryClient();
  const setSelected = useBabySelectorStore((s) => s.setSelected);

  return useMutation<Baby, Error, CreateBabyBody>({
    mutationFn: (body) => babiesApi.create(body),
    onSuccess: (baby) => {
      // Atualiza cache do detalhe (next read do useBaby pega instantaneo).
      queryClient.setQueryData(qk.babies.detail(baby.id), baby);
      // Re-fetch lista (servidor pode ordenar diferente, mais simples invalidar).
      queryClient.invalidateQueries({ queryKey: qk.babies.list() });
      // Auto-seleciona o novo bebe.
      setSelected(baby.id);
      snackbar.showSuccess(`${baby.name} foi cadastrado!`);
    },
  });
}
