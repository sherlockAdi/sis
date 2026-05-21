import { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { sanitizeRichTextHtml } from "../../../utils/richText";

export type AdRichTextEditorProps = {
  label?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  minHeight?: number;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
};

export function AdRichTextEditor({
  label,
  value,
  defaultValue = "",
  placeholder,
  required = false,
  disabled = false,
  helperText,
  error,
  minHeight = 220,
  fullWidth = true,
  onChange,
}: AdRichTextEditorProps) {
  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState<string>(value ?? defaultValue);

  useEffect(() => {
    if (isControlled && value !== undefined) setInnerValue(value);
  }, [isControlled, value]);

  const currentValue = useMemo(() => (isControlled ? value ?? "" : innerValue), [innerValue, isControlled, value]);
  const editorData = useMemo(() => sanitizeRichTextHtml(currentValue), [currentValue]);

  const config = useMemo(
    () => ({
      placeholder,
      toolbar: [
        "heading",
        "|",
        "bold",
        "italic",
        "bulletedList",
        "numberedList",
        "|",
        "link",
        "blockQuote",
        "undo",
        "redo",
      ],
    }),
    [placeholder],
  );

  return (
    <Box width={fullWidth ? "100%" : "auto"}>
      {label ? (
        <Typography variant="body2" fontWeight={800} mb={0.5}>
          {label}
          {required && " *"}
        </Typography>
      ) : null}

      <Box
        sx={{
          border: "1px solid",
          borderColor: error ? "error.main" : "grey.400",
          borderRadius: 1,
          backgroundColor: disabled ? "#f5f5f5" : "white",
          overflow: "hidden",
          "& .ck.ck-editor__main > .ck-editor__editable": {
            minHeight,
            border: "none !important",
            boxShadow: "none !important",
          },
          "& .ck.ck-editor__editable_inline": {
            padding: 2,
          },
          "& .ck.ck-toolbar": {
            border: "none",
            borderBottom: "1px solid",
            borderBottomColor: "rgba(0,0,0,0.12)",
            borderRadius: 0,
          },
        }}
      >
        <CKEditor
          editor={ClassicEditor as any}
          data={editorData}
          disabled={disabled}
          config={config}
          onChange={(_, editor) => {
            const next = sanitizeRichTextHtml(editor.getData());
            if (!isControlled) setInnerValue(next);
            onChange?.(next);
          }}
        />
      </Box>

      {(error || helperText) ? (
        <Typography variant="caption" color={error ? "error" : "text.secondary"} mt={0.5} display="block">
          {error || helperText || ""}
        </Typography>
      ) : null}
    </Box>
  );
}
