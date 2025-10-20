import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
} from "@mui/material";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import type { Column } from "../table/DataTable";
import { KeyboardCheckbox } from "../inputs/KeyboardCheckbox";

interface ColumnSelectorButtonProps {
  columns: Column[];
  visibleColumnIds: Set<string>;
  onVisibleColumnsChange: (columnIds: Set<string>) => void;
  defaultColumnIds?: string[]; // Default visible columns
}

export function ColumnSelectorButton({
  columns,
  visibleColumnIds,
  onVisibleColumnsChange,
  defaultColumnIds = [],
}: ColumnSelectorButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleToggleColumn = (columnId: string) => {
    const next = new Set(visibleColumnIds);
    next.has(columnId) ? next.delete(columnId) : next.add(columnId);
    onVisibleColumnsChange(next);
  };

  const handleSelectAll = () => {
    onVisibleColumnsChange(new Set(columns.map((c) => c.id)));
  };

  const handleResetToDefault = () => {
    onVisibleColumnsChange(new Set(defaultColumnIds));
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        variant="outlined"
        size="large"
        title="Vybrat sloupce"
        sx={{ minWidth: "auto", px: 1 }}
      >
        <ViewColumnIcon />
      </Button>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Vybrat sloupce</DialogTitle>

        <DialogContent dividers>
          <FormGroup>
            {columns.map((column) => (
              <FormControlLabel
                key={column.id}
                control={
                  <KeyboardCheckbox  // changed here
                    size="small"
                    checked={visibleColumnIds.has(column.id)}
                    onChange={() => handleToggleColumn(column.id)}
                  />
                }
                label={column.label}
              />
            ))}
          </FormGroup>
        </DialogContent>

        <DialogActions sx={{ px: 2 }}>
          <Box sx={{ display: "flex", gap: 1, mr: "auto" }}>
            <Button size="small" variant="outlined" onClick={handleSelectAll}>
              Vybrat vše
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleResetToDefault}
              startIcon={<RestartAltIcon />}
            >
              Obnovit výchozí
            </Button>
          </Box>

          <Button
            onClick={() => setDialogOpen(false)}
            variant="contained"
            color="primary"
          >
            Zavřít
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
