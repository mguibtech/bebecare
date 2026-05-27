/**
 * Lista de bebes da familia.
 *
 * Side-effect via useEffect: auto-seleciona o primeiro bebe se a familia
 * tem APENAS UM e nada esta selecionado. Familias com 2+ bebes precisam
 * o usuario escolher explicitamente (sheet abre quando ele toca no avatar).
 *
 * Soh roda quando autenticado (auth status). Se o usuario tem 0 bebes,
 * data === []. UI deve mostrar empty state com CTA "Cadastrar bebe".
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { useAuthStore } from '@/features/auth/store/auth.store';

import { babiesApi } from '../api/babies.api';
import { useBabySelectorStore } from '../store/baby-selector.store';
import type { Baby } from '../types';

export function useBabies() {
  const status = useAuthStore((s) => s.status);
  const selectedBabyId = useBabySelectorStore((s) => s.selectedBabyId);
  const setSelected = useBabySelectorStore((s) => s.setSelected);

  const query = useQuery<Baby[]>({
    queryKey: qk.babies.list(),
    queryFn: () => babiesApi.list(),
    enabled: status === 'authenticated',
  });

  // Auto-select quando: 1 bebe na lista + nada selecionado ainda
  // (ou selecionado nao existe mais na lista atual).
  useEffect(() => {
    if (!query.data) {
      return;
    }
    const exists = selectedBabyId
      ? query.data.some((b) => b.id === selectedBabyId)
      : false;

    const first = query.data[0];
    if (!exists && query.data.length === 1 && first) {
      setSelected(first.id);
    } else if (!exists && selectedBabyId !== null) {
      // Selecionado nao existe mais (foi deletado, ou usuario trocou de familia).
      setSelected(null);
    }
  }, [query.data, selectedBabyId, setSelected]);

  return query;
}
