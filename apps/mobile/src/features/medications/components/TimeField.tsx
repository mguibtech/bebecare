/**
 * Campo de hora HH:mm — abre TimePicker nativo do Android via API imperativa.
 *
 * Valor: string "HH:mm" (formato que o backend espera em
 * CreateMedScheduleDto.time).
 *
 * Visual: Paper TextInput readonly com ícone de relogio.
 */

import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

type TimeFieldProps = {
  value: string; // "HH:mm"
  onChange: (next: string) => void;
  label?: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseHm(s: string): Date {
  const match = /^(\d{2}):(\d{2})$/.exec(s);
  const d = new Date();
  if (match) {
    d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  }
  return d;
}

function formatHm(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function TimeField({
  value,
  onChange,
  label = 'Horário',
}: TimeFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);

  const handleChange = (
    event: DateTimePickerEvent,
    selected: Date | undefined,
  ) => {
    if (event.type === 'set' && selected) {
      onChange(formatHm(selected));
    }
  };

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseHm(value),
        mode: 'time',
        is24Hour: true,
        onChange: handleChange,
      });
    } else {
      setIosOpen(true);
    }
  };

  return (
    <View>
      <Pressable onPress={openPicker}>
        <View pointerEvents="box-only">
          <TextInput
            mode="outlined"
            label={label}
            value={value}
            placeholder="HH:MM"
            editable={false}
            right={
              <TextInput.Icon
                icon="clock-outline"
                forceTextInputFocus={false}
                onPress={openPicker}
              />
            }
          />
        </View>
      </Pressable>

      {Platform.OS === 'ios' && iosOpen && (
        <DateTimePicker
          value={parseHm(value)}
          mode="time"
          display="spinner"
          is24Hour={true}
          onChange={(event, selected) => {
            handleChange(event, selected);
            if (event.type === 'set' || event.type === 'dismissed') {
              setIosOpen(false);
            }
          }}
        />
      )}
    </View>
  );
}
