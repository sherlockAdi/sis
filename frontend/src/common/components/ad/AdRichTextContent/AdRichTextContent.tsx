import { Box, Typography } from "@mui/material";
import { sanitizeRichTextHtml } from "../../../utils/richText";

export type AdRichTextContentProps = {
  html?: string | null;
  emptyText?: string;
};

export function AdRichTextContent({ html, emptyText = "—" }: AdRichTextContentProps) {
  if (!html) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        color: "text.secondary",
        overflowWrap: "anywhere",
        "& p": { margin: 0, marginBottom: 1 },
        "& ul, & ol": { marginTop: 0, marginBottom: 1.25, paddingLeft: 2.5 },
        "& a": { color: "primary.main" },
      }}
      dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(html) }}
    />
  );
}
