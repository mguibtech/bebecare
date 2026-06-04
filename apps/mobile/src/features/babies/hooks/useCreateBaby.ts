/**
 * Cadastrar bebê. Em sucesso:
 *  - inválida lista pra refetch
 *  - popula cache do detalhe (poupa request)
 *  - auto-seleciona o novo bebê (afinal o user acabou de criar)
 *  - mostra snackbar de sucesso; se o sex do bebê não bate com a paleta
 *    atual, sugere trocar via acao opt-in no snackbar (NAO automatico).
 *
 * Por que opt-in via snackbar: respeita usuarios que já escolheram paleta
 * explicitamente OU que não querem associacao genero=cor automatica.
 * Quem quiser, toca em "Trocar tema" e o tema muda na hora.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';
import { useThemeStore } from '@/app/theme/store';
import { PALETTE_LABELS, type PaletteName } from '@/app/theme/tokens';

import { babiesApi } from '../api/babies.api';
import { useBabySelectorStore } from '../store/baby-selector.store';
import { Sex, type Baby, type CreateBabyBody } from '../types';

/** Paleta "esperada" pra cada sexo. Convencional, não impositivo. */
function suggestedPaletteFor(sex: Sex): PaletteName {
  return sex === Sex.FEMALE ? 'rosa' : 'azul';
}

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
      // Auto-seleciona o novo bebê.
      setSelected(baby.id);

      // Sugere trocar tema SOMENTE se não bate com a paleta atual.
      const currentPalette = useThemeStore.getState().palette;
      const suggested = suggestedPaletteFor(baby.sex);

      if (currentPalette !== suggested) {
        snackbar.showSuccess(
          `${baby.name} foi cadastrado!`,
          {
            label: `Trocar pra ${PALETTE_LABELS[suggested]}`,
            onPress: () => {
              useThemeStore.getState().setPalette(suggested);
            },
          },
        );
      } else {
        snackbar.showSuccess(`${baby.name} foi cadastrado!`);
      }
    },
  });
}
