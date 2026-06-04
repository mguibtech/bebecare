/**
 * Lista de bebês da família.
 *
 * Side-effect via useEffect: auto-seleciona o primeiro bebê se a família
 * tem APENAS UM e nada esta selecionado. Familias com 2+ bebês precisam
 * o usuário escolher explicitamente (sheet abre quando ele toca no avatar).
 *
 * Soh roda quando autenticado (auth status). Se o usuário tem 0 bebês,
 * data === []. UI deve mostrar empty state com CTA "Cadastrar bebê".
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

  // Auto-select quando: 1 bebê na lista + nada selecionado ainda
  // (ou selecionado não existe mais na lista atual).
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
      // Selecionado não existe mais (foi deletado, ou usuário trocou de família).
      setSelected(null);
    }
  }, [query.data, selectedBabyId, setSelected]);

  return query;
}
