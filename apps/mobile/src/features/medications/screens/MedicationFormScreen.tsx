/**
 * Form de criar/editar medicamento (campos basicos).
 *
 * Schedules NAO são gerenciados aqui — depois de criar, o user vai
 * pro MedicationDetailScreen e adiciona horários via ScheduleEditorSheet.
 * Mantem o form simples e isola o fluxo "adicionar horário" num bottom sheet.
 *
 * Modo:
 *  - sem `route.params?.medicationId` → CREATE
 *  - com medicationId → EDIT
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  DateField,
  FormInput,
  MutedText,
  SubmitButton,
} from '@/shared/components';
import { ApiError } from '@/shared/api/types';
import type { AppTheme } from '@/app/theme';
import type { AppScreenProps } from '@/app/navigation/types';

import { DoseUnitPicker } from '../components/DoseUnitPicker';
import { useCreateMedication } from '../hooks/useCreateMedication';
import { useMedication } from '../hooks/useMedication';
import { useUpdateMedication } from '../hooks/useUpdateMedication';
import {
  medicationSchema,
  type MedicationFormValues,
} from '../schemas/medication.schema';
import { DoseUnit, type CreateMedicationBody } from '../types';

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function MedicationFormScreen({
  route,
  navigation,
}: AppScreenProps<'MedicationForm'>) {
  const { babyId, medicationId } = route.params;
  const isEdit = typeof medicationId === 'string';
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const editing = useMedication(babyId, medicationId);
  const create = useCreateMedication();
  const update = useUpdateMedication();

  const { control, handleSubmit, formState, reset, setValue, watch } =
    useForm<MedicationFormValues>({
      resolver: zodResolver(medicationSchema),
      mode: 'onBlur',
      defaultValues: {
        name: '',
        dose: undefined as unknown as number,
        doseUnit: undefined as unknown as DoseUnit,
        instructions: '',
        startDate: todayYmd(),
        endDate: '',
        isActive: true,
      },
    });

  useEffect(() => {
    if (isEdit && editing.data) {
      const m = editing.data;
      reset({
        name: m.name,
        dose: Number(m.dose) as unknown as number,
        doseUnit: m.doseUnit,
        instructions: m.instructions ?? '',
        startDate: m.startDate,
        endDate: m.endDate ?? '',
        isActive: m.isActive,
      });
    }
  }, [isEdit, editing.data, reset]);

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? t('meds.titleEdit') : t('meds.titleNew'),
    });
  }, [navigation, isEdit, t]);

  const isActive = watch('isActive');

  const onSubmit = handleSubmit(async (values) => {
    setErrorBanner(null);
    try {
      const payload: CreateMedicationBody = {
        name: values.name,
        dose: values.dose,
        doseUnit: values.doseUnit,
        instructions: values.instructions,
        startDate: values.startDate,
        endDate: values.endDate,
        isActive: values.isActive,
      };

      if (isEdit) {
        await update.mutateAsync({
          babyId,
          id: medicationId!,
          body: payload,
        });
        navigation.goBack();
      } else {
        const created = await create.mutateAsync({ babyId, body: payload });
        // Vai pro detail pra o user adicionar horários
        navigation.replace('MedicationDetail', {
          babyId,
          medicationId: created.id,
        });
      }
    } catch (err) {
      setErrorBanner(
        err instanceof ApiError ? err.message : t('meds.saveError'),
      );
    }
  });

  if (isEdit && editing.isPending) {
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
          {t('meds.sectionData')}
        </Text>

        <FormInput
          control={control}
          name="name"
          label={t('meds.nameLabel')}
          placeholder={t('meds.namePlaceholder')}
          maxLength={120}
          autoCapitalize="words"
        />

        <View style={styles.doseRow}>
          <View style={styles.doseAmount}>
            <FormInput
              control={control}
              name="dose"
              label={t('meds.doseLabel')}
              placeholder={t('meds.dosePlaceholder')}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.doseUnitCol}>
            <DoseUnitPicker control={control} name="doseUnit" />
          </View>
        </View>

        <FormInput
          control={control}
          name="instructions"
          label={t('meds.instructionsLabel')}
          placeholder={t('meds.instructionsPlaceholder')}
          multiline
          numberOfLines={2}
        />

        <Text variant="titleSmall" style={styles.sectionTitle}>
          {t('meds.sectionPeriod')}
        </Text>

        <DateField
          control={control}
          name="startDate"
          label={t('meds.startField')}
        />

        <DateField
          control={control}
          name="endDate"
          label={t('meds.endLabel')}
        />

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text variant="bodyMedium">{t('meds.activeSwitch')}</Text>
            <MutedText variant="bodySmall">
              {t('meds.activeSwitchSub')}
            </MutedText>
          </View>
          <Switch
            value={isActive}
            onValueChange={(v) => setValue('isActive', v)}
          />
        </View>

        {!isEdit && (
          <MutedText variant="bodySmall" style={styles.hintAfterSave}>
            {t('meds.hintAfterSave')}
          </MutedText>
        )}

        <SubmitButton
          onPress={onSubmit}
          loading={isSaving}
          disabled={!formState.isValid && formState.isSubmitted}
        >
          {isSaving
            ? t('meds.saving')
            : isEdit
              ? t('meds.saveChanges')
              : t('meds.createContinue')}
        </SubmitButton>
      </ScrollView>

      <Snackbar
        visible={errorBanner !== null}
        onDismiss={() => setErrorBanner(null)}
        duration={4000}
        action={{ label: t('common.ok'), onPress: () => setErrorBanner(null) }}
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
    marginBottom: 8,
    fontWeight: '700',
    opacity: 0.8,
  },
  doseRow: {
    flexDirection: 'row',
    gap: 8,
  },
  doseAmount: {
    flex: 1,
  },
  doseUnitCol: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
    gap: 16,
  },
  switchText: {
    flex: 1,
  },
  hintAfterSave: {
    marginTop: 8,
    textAlign: 'center',
  },
});
