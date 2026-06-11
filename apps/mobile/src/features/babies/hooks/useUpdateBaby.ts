/**
 * Atualizar bebê (PATCH parcial).
 *
 * onSuccess atualiza ambos caches: detalhe (setQueryData) e lista
 * (invalidate, mais conservador — o backend pode mudar ageMonths/ageDays
 * recalculados, melhor pegar fresh).
 *
 * Se o sex foi alterado e a paleta atual não bate com a sugerida pra esse
 * sex, oferece troca via snackbar com acao (mesma logica do useCreateBaby).
 * Opt-in respeitoso: não troca sozinho, soh oferece.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';
import i18n from '@/shared/i18n';
import { useThemeStore } from '@/app/theme/store';
import { type PaletteName } from '@/app/theme/tokens';

import { babiesApi } from '../api/babies.api';
import { Sex, type Baby, type UpdateBabyBody } from '../types';

type UpdateBabyArgs = {
  id: string;
  body: UpdateBabyBody;
};

/** Paleta convencional pra cada sexo (mesma logica do useCreateBaby). */
function suggestedPaletteFor(sex: Sex): PaletteName {
  return sex === Sex.FEMALE ? 'rosa' : 'azul';
}

export function useUpdateBaby() {
  const queryClient = useQueryClient();

  return useMutation<Baby, Error, UpdateBabyArgs>({
    mutationFn: ({ id, body }) => babiesApi.update(id, body),
    onSuccess: (baby, { body }) => {
      queryClient.setQueryData(qk.babies.detail(baby.id), baby);
      queryClient.invalidateQueries({ queryKey: qk.babies.list() });

      // Se sex foi alterado e a paleta não bate, sugere troca.
      const sexChanged = body.sex !== undefined;
      const currentPalette = useThemeStore.getState().palette;
      const suggested = suggestedPaletteFor(baby.sex);

      const saved = i18n.t('feedback.babyUpdated');
      if (sexChanged && currentPalette !== suggested) {
        snackbar.showSuccess(saved, {
          label: i18n.t('feedback.switchPalette', {
            palette: i18n.t(
              suggested === 'rosa'
                ? 'appearance.paletteRosa'
                : 'appearance.paletteAzul',
            ),
          }),
          onPress: () => {
            useThemeStore.getState().setPalette(suggested);
          },
        });
      } else {
        snackbar.showSuccess(saved);
      }
    },
  });
}
