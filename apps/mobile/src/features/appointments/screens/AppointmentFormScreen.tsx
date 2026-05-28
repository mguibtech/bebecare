/**
 * Form de criar/editar consulta.
 *
 * Modo:
 *  - sem `route.params?.appointmentId` → CREATE
 *  - com appointmentId → EDIT (fetch via useAppointment, reset com defaults)
 */

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Snackbar,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  DateTimeField,
  FormInput,
  MutedText,
  SubmitButton,
} from '@/shared/components';
import { ApiError } from '@/shared/api/types';
import type { AppTheme } from '@/app/theme';
import type { AppScreenProps } from '@/app/navigation/types';

import { ReminderPicker } from '../components/ReminderPicker';
import { useAppointment } from '../hooks/useAppointment';
import { useCreateAppointment } from '../hooks/useCreateAppointment';
import { useUpdateAppointment } from '../hooks/useUpdateAppointment';
import {
  appointmentSchema,
  type AppointmentFormValues,
} from '../schemas/appointment.schema';
import type { CreateAppointmentBody, ReminderMinutes } from '../types';

/** Default scheduledAt: hoje + 1 hora arredondado pra hora cheia. */
function defaultScheduledAt(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d.toISOString();
}

export function AppointmentFormScreen({
  route,
  navigation,
}: AppScreenProps<'AppointmentForm'>) {
  const { babyId, appointmentId } = route.params;
  const isEdit = typeof appointmentId === 'string';
  const theme = useTheme<AppTheme>();
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const editingAppointment = useAppointment(babyId, appointmentId);
  const create = useCreateAppointment();
  const update = useUpdateAppointment();

  const { control, handleSubmit, formState, reset, setValue, watch } =
    useForm<AppointmentFormValues>({
      resolver: zodResolver(appointmentSchema),
      mode: 'onBlur',
      defaultValues: {
        title: '',
        doctorName: '',
        specialty: '',
        scheduledAt: defaultScheduledAt(),
        location: '',
        notes: '',
        reminderEnabled: true,
        reminderMinutesBefore: 1440,
      },
    });

  // Hidrata em modo edit.
  useEffect(() => {
    if (isEdit && editingAppointment.data) {
      const a = editingAppointment.data;
      reset({
        title: a.title,
        doctorName: a.doctorName ?? '',
        specialty: a.specialty ?? '',
        scheduledAt: a.scheduledAt,
        location: a.location ?? '',
        notes: a.notes ?? '',
        reminderEnabled: a.reminderEnabled,
        reminderMinutesBefore: a.reminderMinutesBefore as ReminderMinutes,
      });
    }
  }, [isEdit, editingAppointment.data, reset]);

  // Header title dinamico
  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Editar consulta' : 'Marcar consulta',
    });
  }, [navigation, isEdit]);

  const reminderEnabled = watch('reminderEnabled');

  const onSubmit = handleSubmit(async (values) => {
    setErrorBanner(null);
    try {
      const payload: CreateAppointmentBody = {
        title: values.title,
        doctorName: values.doctorName,
        specialty: values.specialty,
        scheduledAt: values.scheduledAt,
        location: values.location,
        notes: values.notes,
        reminderEnabled: values.reminderEnabled,
        reminderMinutesBefore:
          values.reminderMinutesBefore as ReminderMinutes,
      };

      if (isEdit) {
        await update.mutateAsync({
          babyId,
          id: appointmentId!,
          body: payload,
        });
      } else {
        await create.mutateAsync({ babyId, body: payload });
      }
      navigation.goBack();
    } catch (err) {
      setErrorBanner(
        err instanceof ApiError
          ? err.message
          : 'Erro inesperado. Tente de novo.',
      );
    }
  });

  if (isEdit && editingAppointment.isPending) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isSaving = create.isPending || update.isPending;

  return (
    <View
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="titleSmall" style={styles.sectionTitle}>
          Dados da consulta
        </Text>

        <FormInput
          control={control}
          name="title"
          label="Título"
          placeholder="ex: Puericultura"
          maxLength={120}
        />

        <FormInput
          control={control}
          name="doctorName"
          label="Médico (opcional)"
          placeholder="ex: Dra. Ana Souza"
          autoCapitalize="words"
          maxLength={120}
        />

        <FormInput
          control={control}
          name="specialty"
          label="Especialidade (opcional)"
          placeholder="ex: Pediatra"
          maxLength={80}
        />

        <DateTimeField
          control={control}
          name="scheduledAt"
          labelDate="Data"
          labelTime="Horário"
        />

        <FormInput
          control={control}
          name="location"
          label="Local (opcional)"
          placeholder="ex: Clínica Vida — Rua X, 123"
          maxLength={200}
        />

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Lembrete
        </Text>
        <MutedText variant="bodySmall" style={styles.sectionHint}>
          Receba uma notificação antes da consulta (push chega quando você
          tiver o app instalado e permissão concedida — disponível em breve).
        </MutedText>

        <View style={styles.switchRow}>
          <Text variant="bodyMedium">Ativar lembrete</Text>
          <Switch
            value={reminderEnabled}
            onValueChange={(v) => setValue('reminderEnabled', v)}
          />
        </View>

        {reminderEnabled && (
          <ReminderPicker
            control={control}
            name="reminderMinutesBefore"
          />
        )}

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Anotações (opcional)
        </Text>
        <MutedText variant="bodySmall" style={styles.sectionHint}>
          Sintomas, perguntas a fazer, observações…
        </MutedText>
        <FormInput
          control={control}
          name="notes"
          label="Anotações"
          multiline
          numberOfLines={3}
        />

        <SubmitButton
          onPress={onSubmit}
          loading={isSaving}
          disabled={!formState.isValid && formState.isSubmitted}
        >
          {isSaving
            ? 'Salvando...'
            : isEdit
              ? 'Salvar alterações'
              : 'Marcar consulta'}
        </SubmitButton>
      </ScrollView>

      <Snackbar
        visible={errorBanner !== null}
        onDismiss={() => setErrorBanner(null)}
        duration={4000}
        action={{ label: 'OK', onPress: () => setErrorBanner(null) }}
      >
        {errorBanner ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 4,
    fontWeight: '700',
    opacity: 0.8,
  },
  sectionHint: {
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
});
