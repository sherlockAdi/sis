import { useState } from "react";

import {
    Box,
    FormControl,
    IconButton,
    InputLabel,
    ListSubheader,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    type SelectChangeEvent,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export type AdDropDownMultiOption = {
    label: string;
    value: string;
};

export type AdDropDownMultiProps = {
    label?: string;
    options: AdDropDownMultiOption[];
    value?: string[];
    required?: boolean;
    fullWidth?: boolean;
    onChange?: (value: string[]) => void;
};

export function AdDropDownMulti({
    label,
    options,
    value = [],
    required = false,
    fullWidth = true,
    onChange,
}: AdDropDownMultiProps) {
    const [selected, setSelected] = useState<string[]>(value);
    const [open, setOpen] = useState(false);

    const handleChange = (event: SelectChangeEvent<string[]>) => {
        const val = event.target.value as string[];
        setSelected(val);
        onChange?.(val);
    };

    return (
        <FormControl fullWidth={fullWidth} size="small">
            {label && <InputLabel required={required}>{label}</InputLabel>}

            <Select
                multiple
                value={selected}
                label={label}
                onChange={handleChange}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                renderValue={(selected) => selected.join(", ")}
            >
                <ListSubheader
                    sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        bgcolor: "background.paper",
                        py: 0.5,
                    }}
                >
                    <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                            {label ? `Select ${label}` : "Select"}
                        </Typography>
                        <IconButton
                            size="small"
                            aria-label="close"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpen(false);
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </ListSubheader>

                {options.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                        <Checkbox checked={selected.indexOf(opt.value) > -1} />
                        <ListItemText primary={opt.label} />
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
