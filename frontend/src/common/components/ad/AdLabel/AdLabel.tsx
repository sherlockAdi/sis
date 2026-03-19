import { Typography } from "@mui/material";

export type AdLabelProps = {
    text: string;
    required?: boolean;
    color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
};

export default function AdLabel({
    text,
    required = false,
    color = "primary",
}: AdLabelProps) {
    return (
        <Typography
            component="label"
            variant="body2"
            fontWeight={600}
            color={color}
            sx={{ display: "block", mb: 0.5 }}
        >
            {text}
            {required && (
                <Typography
                    component="span"
                    color="error"
                    sx={{ ml: 0.5 }}
                >
                    *
                </Typography>
            )}
        </Typography>
    );
}