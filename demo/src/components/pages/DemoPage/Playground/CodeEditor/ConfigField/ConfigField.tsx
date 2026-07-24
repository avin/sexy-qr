import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { Slider } from '@/components/ui/slider';
import styles from './ConfigField.module.scss';

type ConfigFieldProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function ConfigField({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: ConfigFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialValue = useRef(value);

  useEffect(() => {
    if (!isEditing && inputRef.current) {
      inputRef.current.value = String(value);
    }
  }, [isEditing, value]);

  const updateValue = (nextValue: number) => {
    const decimalPlaces = step.toString().split('.')[1]?.length ?? 0;
    const normalizedValue = Number(clamp(nextValue, min, max).toFixed(decimalPlaces));
    if (inputRef.current) {
      inputRef.current.value = String(normalizedValue);
    }
    onChange(normalizedValue);
  };

  return (
    <Field className={styles.field}>
      <FieldLabel className={styles.srOnly} htmlFor={id}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        className={styles.input}
        type="number"
        min={min}
        max={max}
        step={step}
        defaultValue={initialValue.current}
        ref={inputRef}
        onFocus={(event) => {
          setIsEditing(true);
          event.currentTarget.select();
        }}
        onChange={(event) => {
          const nextDraft = event.target.value;
          const nextValue = Number(nextDraft);

          if (
            nextDraft !== '' &&
            Number.isFinite(nextValue) &&
            nextValue >= min &&
            nextValue <= max
          ) {
            onChange(nextValue);
          }
        }}
        onBlur={() => {
          setIsEditing(false);
          const draft = inputRef.current?.value ?? '';
          const nextValue = Number(draft);
          updateValue(draft === '' || !Number.isFinite(nextValue) ? value : nextValue);
        }}
      />
      <Slider
        className={styles.slider}
        aria-label={`${label} slider`}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(values) =>
          updateValue(typeof values === 'number' ? values : (values[0] ?? min))
        }
      />
      <output className={styles.readout} htmlFor={id}>
        {value}
      </output>
    </Field>
  );
}
