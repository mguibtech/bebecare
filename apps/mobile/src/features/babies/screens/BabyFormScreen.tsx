/**
 * Form de criar/editar bebê.
 *
 * Modo:
 *  - sem `route.params?.babyId` → modo CREATE
 *  - com babyId → modo EDIT (fetch via useBaby, reset form com defaults)
 *
 * Sections (top-to-bottom):
 *  1. Avatar grande + AvatarStylePicker
 *  2. Dados basicos: nome, sexo, data nascimento (todos obrigatórios)
 *  3. Medidas ao nascer (opcionais)
 *  4. Info médica (opcionais): blood type, alergias, cor dos olhos
 *  5. Notas livres
 *  6. Botao Salvar
 *  7. Se EDIT: botao "Excluir" no fim
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  DateField,
  FormInput,
  SubmitButton,
} from '@/shared/components';
import { ApiError } from '@/shared/api/types';
import type { AppScreenProps } from '@/app/navigation/types';
import type { AppTheme } from '@/app/theme';

import {
  AvatarStylePicker,
  randomSeed,
} from '../components/AvatarStylePicker';
import { BabyAvatar } from '../components/BabyAvatar';
import { SexPicker } from '../components/SexPicker';
import { BloodTypePicker } from '../components/BloodTypePicker';
import { useBaby } from '../hooks/useBaby';
import { useCreateBaby } from '../hooks/useCreateBaby';
import { useUpdateBaby } from '../hooks/useUpdateBaby';
import { useDeleteBaby } from '../hooks/useDeleteBaby';
import {
  createBabySchema,
  type CreateBabyFormValues,
} from '../schemas/baby.schema';
import { AvatarStyle, type CreateBabyBody, type Sex } from '../types';

/** Default da seed do DiceBear: nome em lowercase com hifens. */
function defaultSeedFor(name: string | undefined): string {
  if (!name) return 'baby';
  return name.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 100) || 'baby';
}

export function BabyFormScreen({
  route,
  navigation,
}: AppScreenProps<'BabyForm'>) {
  const babyId = route.params?.babyId;
  const isEdit = typeof babyId === 'string';
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();

  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const editingBaby = useBaby(babyId);
  const create = useCreateBaby();
  const update = useUpdateBaby();
  const remove = useDeleteBaby();

  const { control, handleSubmit, formState, reset, setValue } =
    useForm<CreateBabyFormValues>({
      resolver: zodResolver(createBabySchema),
      mode: 'onBlur',
      defaultValues: {
        name: '',
        sex: undefined as unknown as Sex,
        birthDate: '',
        avatarStyle: AvatarStyle.LORELEI,
        avatarSeed: '',
      },
    });

  // Hidrata o form quando estiver editando.
  useEffect(() => {
    if (isEdit && editingBaby.data) {
      const b = editingBaby.data;
      reset({
        name: b.name,
        sex: b.sex,
        birthDate: b.birthDate,
        birthWeightGrams: b.birthWeightGrams ?? undefined,
        birthHeightCm: b.birthHeightCm
          ? (Number(b.birthHeightCm) as unknown as undefined)
          : undefined,
        bloodType: b.bloodType ?? undefined,
        allergies: b.allergies ?? '',
        eyeColor: b.eyeColor ?? '',
        notes: b.notes ?? '',
        avatarStyle: b.avatarStyle,
        avatarSeed: b.avatarSeed,
      });
    }
  }, [isEdit, editingBaby.data, reset]);

  // Header dinamico
  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? t('babies.editTitle') : t('babies.newTitle'),
    });
  }, [navigation, isEdit, t]);

  const name = useWatch({ control, name: 'name' });
  const avatarStyle = useWatch({ control, name: 'avatarStyle' });
  const avatarSeed = useWatch({ control, name: 'avatarSeed' });

  // Sincroniza seed default quando o nome muda em CREATE
  // e o user não customizou ainda.
  useEffect(() => {
    if (!isEdit && (!avatarSeed || avatarSeed === '' || avatarSeed === defaultSeedFor(undefined))) {
      setValue('avatarSeed', defaultSeedFor(name), { shouldValidate: false });
    }
  }, [name, isEdit, avatarSeed, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setErrorBanner(null);
    try {
      // Garante seed não-vazia.
      const seed = values.avatarSeed?.trim()
        ? values.avatarSeed.trim()
        : defaultSeedFor(values.name);

      const payload: CreateBabyBody = {
        name: values.name,
        sex: values.sex,
        birthDate: values.birthDate,
        birthWeightGrams: values.birthWeightGrams,
        birthHeightCm: values.birthHeightCm,
        bloodType: values.bloodType,
        allergies: values.allergies,
        eyeColor: values.eyeColor,
        notes: values.notes,
        avatarStyle: values.avatarStyle ?? AvatarStyle.LORELEI,
        avatarSeed: seed,
      };

      if (isEdit) {
        await update.mutateAsync({ id: babyId!, body: payload });
      } else {
        await create.mutateAsync(payload);
      }
      navigation.goBack();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t('common.unexpectedError');
      setErrorBanner(message);
    }
  });

  const onDelete = async () => {
    setDeleteDialogOpen(false);
    if (!babyId) return;
    try {
      await remove.mutateAsync(babyId);
      navigation.popToTop();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t('babies.deleteError');
      setErrorBanner(message);
    }
  };

  // Loading state em EDIT enquanto busca os dados originais
  if (isEdit && editingBaby.isPending) {
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
        {/* AVATAR PREVIEW */}
        <View style={styles.avatarPreview}>
          <BabyAvatar
            size={96}
            style={avatarStyle ?? AvatarStyle.LORELEI}
            seed={avatarSeed || defaultSeedFor(name)}
          />
          <Text variant="titleMedium" style={styles.previewName}>
            {name?.trim() || t('babies.previewName')}
          </Text>
        </View>

        <AvatarStylePicker
          value={avatarStyle ?? AvatarStyle.LORELEI}
          seed={avatarSeed || defaultSeedFor(name)}
          onChange={(s) => setValue('avatarStyle', s, { shouldDirty: true })}
          onRegenerateSeed={() =>
            setValue('avatarSeed', randomSeed(), { shouldDirty: true })
          }
        />

        {/* SECTION: Dados basicos */}
        <Text variant="titleSmall" style={styles.sectionTitle}>
          {t('babies.sectionBasics')}
        </Text>

        <FormInput
          control={control}
          name="name"
          label={t('babies.nameLabel')}
          autoCapitalize="words"
          autoComplete="given-name"
          maxLength={120}
        />

        <SexPicker control={control} name="sex" />

        <DateField
          control={control}
          name="birthDate"
          label={t('babies.birthDateLabel')}
          maximumDate={new Date()}
        />

        {/* SECTION: Medidas ao nascer */}
        <Text variant="titleSmall" style={styles.sectionTitle}>
          {t('babies.sectionMeasures')}
        </Text>
        <Text variant="bodySmall" style={styles.sectionHint}>
          {t('babies.measuresHint')}
        </Text>

        <FormInput
          control={control}
          name="birthWeightGrams"
          label={t('babies.weightLabel')}
          placeholder={t('babies.weightPlaceholder')}
          keyboardType="numeric"
        />

        <FormInput
          control={control}
          name="birthHeightCm"
          label={t('babies.heightLabel')}
          placeholder={t('babies.heightPlaceholder')}
          keyboardType="numeric"
        />

        {/* SECTION: Informacoes medicas */}
        <Text variant="titleSmall" style={styles.sectionTitle}>
          {t('babies.sectionMedical')}
        </Text>

        <BloodTypePicker control={control} name="bloodType" />

        <FormInput
          control={control}
          name="eyeColor"
          label={t('babies.eyeColorLabel')}
          autoCapitalize="none"
          maxLength={30}
        />

        <FormInput
          control={control}
          name="allergies"
          label={t('babies.allergiesLabel')}
          multiline
          numberOfLines={2}
          maxLength={500}
        />

        <FormInput
          control={control}
          name="notes"
          label={t('babies.notesLabel')}
          multiline
          numberOfLines={3}
        />

        {/* SAVE */}
        <SubmitButton
          onPress={onSubmit}
          loading={isSaving}
          disabled={!formState.isValid && formState.isSubmitted}
        >
          {isSaving
            ? t('common.saving')
            : isEdit
              ? t('common.saveChanges')
              : t('babies.create')}
        </SubmitButton>

        {/* DELETE (so em edit) */}
        {isEdit && (
          <Button
            mode="text"
            textColor={theme.colors.error}
            onPress={() => setDeleteDialogOpen(true)}
            style={styles.deleteButton}
            icon="trash-can-outline"
          >
            {t('babies.deleteBtn')}
          </Button>
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={deleteDialogOpen}
          onDismiss={() => setDeleteDialogOpen(false)}
        >
          <Dialog.Title>{t('babies.deleteTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t('babies.deleteBody')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onPress={onDelete}
              textColor={theme.colors.error}
              loading={remove.isPending}
            >
              {t('common.delete')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewName: {
    marginTop: 8,
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 4,
    fontWeight: '700',
    opacity: 0.8,
  },
  sectionHint: {
    opacity: 0.6,
    marginBottom: 12,
  },
  deleteButton: {
    marginTop: 24,
  },
});
