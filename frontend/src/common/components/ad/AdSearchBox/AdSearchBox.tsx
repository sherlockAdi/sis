import { useEffect, useMemo, useRef, useState } from "react";
import { IconButton, InputAdornment, TextField, type TextFieldProps } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Close";

export type AdSearchBoxProps = Omit<TextFieldProps, "onChange" | "value" | "defaultValue"> & {
  value?: string;
  defaultValue?: string;
  /** Called whenever the value changes. */
  onChange?: (value: string) => void;
  /** Called when user submits (Enter / search icon / debounce if enabled). */
  onSearch?: (value: string) => void;
  /** Auto-call `onSearch` after user stops typing. */
  debounceMs?: number;
  /** Show clear button when there is text. */
  clearable?: boolean;
};

export function AdSearchBox({
  value,
  defaultValue = "",
  onChange,
  onSearch,
  debounceMs,
  clearable = true,
  placeholder = "Search…",
  size = "small",
  fullWidth = true,
  ...rest
}: AdSearchBoxProps) {
  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState<string>(value ?? defaultValue);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (isControlled) setInnerValue(value ?? "");
  }, [isControlled, value]);

  const currentValue = isControlled ? value ?? "" : innerValue;

  const scheduleDebouncedSearch = useMemo(() => {
    if (!debounceMs || !onSearch) return null;
    return (next: string) => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
      debounceTimer.current = window.setTimeout(() => onSearch(next), debounceMs);
    };
  }, [debounceMs, onSearch]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, []);

  const setValue = (next: string) => {
    if (!isControlled) setInnerValue(next);
    onChange?.(next);
    scheduleDebouncedSearch?.(next);
  };

  return (
    <TextField
      {...rest}
      value={currentValue}
      size={size}
      fullWidth={fullWidth}
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        rest.onKeyDown?.(e);
        if (e.key === "Enter") onSearch?.(currentValue);
      }}
      InputProps={{
        ...rest.InputProps,
        startAdornment: (
          <InputAdornment position="start">
            <IconButton
              size="small"
              aria-label="Search"
              onClick={() => onSearch?.(currentValue)}
              edge="start"
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end" sx={{ gap: 0.5 }}>
            {clearable && currentValue ? (
              <IconButton
                size="small"
                aria-label="Clear search"
                onClick={() => {
                  setValue("");
                  onSearch?.("");
                }}
                edge="end"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : null}
            {rest.InputProps?.endAdornment}
          </InputAdornment>
        ),
      }}
    />
  );
}

