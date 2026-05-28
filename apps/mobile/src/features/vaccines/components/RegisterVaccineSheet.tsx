/**
 * Bottom sheet pra registrar aplicacao de uma dose.
 *
 * Aberto pelo botao "✓" no VaccineEntryCard ou pelo VaccineDetailScreen.
 *
 * Form:
 *  - Data (default hoje, nao pode ser futuro)
 *  - Lote (opcional, ate 50 chars)
 *  - Local (opcional, ate 200 chars)
 *  - Notas (opcional, multiline)
 *
 * onSuccess invalida schedule + records do bebe (hook useCreateVaccineRecord).
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Modal,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { DateField, FormInput } from '@/shared/components';
import { ApiError } from '@/shared/api/types';
import type { AppTheme } from '@/app/theme';

import { useCreateVaccineRecord } from '../hooks/useCreateVaccineRecord';
import type { Vaccine } from '../types';

const registerSchema = z.object({
  appliedAt: z
    .string({ required_error: 'Data obrigatoria' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida'),
  lotNumber: z
    .string()
    .trim()
    .max(50, 'Maximo 50 caracteres')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  location: z
    .string()
    .trim()
    .max(200, 'Maximo 200 caracteres')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type RegisterVaccineSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  babyId: string;
  vaccine: Vaccine | null;
};

/** YYYY-MM-DD de hoje (sem fuso). */
function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function RegisterVaccineSheet({
  visible,
  onDismiss,
  babyId,
  vaccine,
}: RegisterVaccineSheetProps) {
  const theme = useTheme<AppTheme>();
  const createRecord = useCreateVaccineRecord();
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const { control, handleSubmit, formState, reset } =
    useForm<RegisterFormValues>({
      resolver: zodResolver(registerSchema),
      mode: 'onBlur',
      defaultValues: {
        appliedAt: todayYmd(),
        lotNumber: '',
        location: '',
        notes: '',
      },
    });

  const onSubmit = handleSubmit(async (values) => {
    if (!vaccine) return;
    try {
      await createRecord.mutateAsync({
        babyId,
        body: {
          vaccineId: vaccine.id,
          appliedAt: values.appliedAt,
          lotNumber: values.lotNumber,
          location: values.location,
          notes: values.notes,
        },
      });
      reset();
      onDismiss();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Nao foi possivel registrar. Tente de novo.';
      setSnackbar(message);
    }
  });

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          reset();
          onDismiss();
        }}
        contentContainerStyle={[
          styles.sheet,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.handle} />
        <Text variant="titleMedium" style={styles.title}>
          Registrar aplicação
        </Text>
        {vaccine && (
          <Text variant="bodyMedium" style={styles.subtitle}>
            {vaccine.name} • {vaccine.doseLabel}
          </Text>
        )}

        <View style={styles.form}>
          <DateField
            control={control}
            name="appliedAt"
            label="Data da aplicação"
          />

          <FormInput
            control={control}
            name="lotNumber"
            label="Lote (opcional)"
            placeholder="ex: ABC1234"
            autoCapitalize="characters"
            maxLength={50}
          />

          <FormInput
            control={control}
            name="location"
            label="Local (opcional)"
            placeholder="ex: UBS Centro"
            maxLength={200}
          />

          <FormInput
            control={control}
            name="notes"
            label="Observacoes (opcional)"
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.actions}>
          <Button onPress={onDismiss}>Cancelar</Button>
          <Button
            mode="contained"
            onPress={onSubmit}
            loading={createRecord.isPending}
            disabled={!formState.isValid && formState.isSubmitted}
          >
            Confirmar aplicação
          </Button>
        </View>
      </Modal>

      <Snackbar
        visible={snackbar !== null}
        onDismiss={() => setSnackbar(null)}
        duration={4000}
        action={{ label: 'OK', onPress: () => setSnackbar(null) }}
      >
        {snackbar ?? ''}
      </Snackbar>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    borderRadius: 16,
    maxHeight: '90%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  form: {
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
});
