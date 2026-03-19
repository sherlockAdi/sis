import { useEffect, useState } from "react";
import { Box, Slider, Stack, Typography } from "@mui/material";
import type { SliderProps } from "@mui/material/Slider";

export type AdSliderProps = Omit<SliderProps, "value" | "defaultValue" | "onChange"> & {
  label?: string;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Show the current value next to the label. */
  showValue?: boolean;
};

export function AdSlider({
  label,
  value,
  defaultValue = 0,
  onChange,
  showValue = true,
  min = 0,
  max = 100,
  step = 1,
  valueLabelDisplay = "auto",
  ...rest
}: AdSliderProps) {
  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState<number>(value ?? defaultValue);

  useEffect(() => {
    if (isControlled) setInnerValue(value ?? defaultValue);
  }, [defaultValue, isControlled, value]);

  const currentValue = isControlled ? value ?? defaultValue : innerValue;

  return (
    <Stack spacing={0.75} sx={{ width: "100%" }}>
      {(label || showValue) && (
        <Stack direction="row" alignItems="baseline" spacing={1}>
          {label ? (
            <Typography variant="body2" fontWeight={700}>
              {label}
            </Typography>
          ) : null}
          <Box flex={1} />
          {showValue ? (
            <Typography variant="caption" color="text.secondary">
              {currentValue}
            </Typography>
          ) : null}
        </Stack>
      )}

      <Slider
        {...rest}
        min={min}
        max={max}
        step={step}
        value={currentValue}
        valueLabelDisplay={valueLabelDisplay}
        onChange={(_e, next) => {
          const nextValue = Array.isArray(next) ? next[0] : next;
          if (!isControlled) setInnerValue(nextValue);
          onChange?.(nextValue);
        }}
      />
    </Stack>
  );
}

