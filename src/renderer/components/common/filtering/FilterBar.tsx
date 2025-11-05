import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { ReactNode } from "react";
import AddIcon from "@mui/icons-material/Add";
import { FilterConfig, FilterState } from "src/types/filter";
import { ColumnPickerButton } from "./ColumnPickerButton";
import type { Column } from "../table/DataTable";
import type { FilterAction } from "src/types/filter";
import { KeyboardCheckbox } from "../inputs/KeyboardCheckbox";
import type { OrderByConfig } from "./ColumnPickerButton";

interface FilterBarProps {
  config: FilterConfig;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  columns: Column[];
  visibleColumnIds: Set<string>;
  onVisibleColumnsChange: (columnIds: Set<string>) => void;
  defaultColumnIds?: string[];
  actions?: FilterAction[];
  clearLabel?: string;
  orderBy?: OrderByConfig;
  onOrderByChange?: (orderBy: OrderByConfig) => void;
  hideColumnPicker?: boolean;
}

export interface FilterBarRef {
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export const FilterBar = forwardRef<FilterBarRef, FilterBarProps>(
  (
    {
      config,
      filters,
      onFiltersChange,
      columns,
      visibleColumnIds,
      onVisibleColumnsChange,
      defaultColumnIds = [],
      actions = [],
      clearLabel = "Vymazat filtry",
      orderBy,
      onOrderByChange,
      hideColumnPicker = false,
    },
    ref,
  ) => {
    const [openActionId, setOpenActionId] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      searchInputRef,
    }));

    const visibleFilters = config.filters.filter(
      (f) => !f.columnId || visibleColumnIds.has(f.columnId),
    );

    const updateFilter = (filterId: string, value: any) => {
      onFiltersChange({ ...filters, [filterId]: value });
    };

    const handleClearFilters = () => {
      const cleared: FilterState = {};
      config.filters.forEach((filter) => {
        switch (filter.type) {
          case "text-search":
          case "number-input":
            cleared[filter.id] = "";
            break;
          case "checkbox":
            cleared[filter.id] = filter.required ? true : false;
            break;
          case "number-with-prefix":
            cleared[filter.id] = { prefix: null, value: "" };
            break;
          case "select":
            cleared[filter.id] = null;
            break;
          case "multiselect":
            cleared[filter.id] = [];
            break;
        }
      });
      onFiltersChange(cleared);
    };

    const validateRequiredGroup = (
      filterId: string,
      newValue: boolean,
    ): boolean => {
      const filter = config.filters.find((f) => f.id === filterId);
      if (
        !filter ||
        filter.type !== "checkbox" ||
        !filter.required ||
        !filter.group
      )
        return true;
      const groupFilters = config.filters.filter(
        (f) => f.type === "checkbox" && f.group === filter.group,
      );
      const checkedCount = groupFilters.filter((f) =>
        f.id === filterId ? newValue : filters[f.id],
      ).length;
      return checkedCount > 0;
    };

    const renderFilter = (
      filter: (typeof visibleFilters)[number],
    ): ReactNode => {
      switch (filter.type) {
        case "text-search":
          return (
            <TextField
              key={filter.id}
              size="small"
              label={filter.label}
              value={filters[filter.id] || ""}
              onChange={(e) => updateFilter(filter.id, e.target.value)}
              inputRef={filter.id === "search" ? searchInputRef : undefined}
              sx={{ minWidth: filter.width || 250 }}
            />
          );

        case "checkbox": {
          const canUncheck = validateRequiredGroup(filter.id, false);
          const checked = !!filters[filter.id];
          return (
            <FormControlLabel
              sx={{color: (theme) => checked? theme.palette.primary.main : theme.palette.text.secondary}}
              key={filter.id}
              control={
                <KeyboardCheckbox
                  checked={checked}
                  onChange={(e) => {
                    if (!e.target.checked && !canUncheck) return;
                    updateFilter(filter.id, e.target.checked);
                  }}
                />
              }
              label={filter.label}
            />
          );
        }

        case "number-input": {
          const value = filters[filter.id] || "";
          const validation = filter.validate
            ? filter.validate(value)
            : { valid: true };
          return (
            <TextField
              key={filter.id}
              size="small"
              label={filter.label}
              placeholder={filter.placeholder}
              value={value}
              onChange={(e) => {
                const newValue = e.target.value.replace(/\D/g, "");
                if (filter.maxLength && newValue.length > filter.maxLength) return;
                updateFilter(filter.id, newValue);
              }}
              error={!validation.valid}
              helperText={validation.error}
              sx={{ minWidth: filter.width || 150 }}
            />
          );
        }

        case "number-with-prefix": {
          const dicValue = filters[filter.id] || { prefix: null, value: "" };
          const isCustom = dicValue.prefix === "vlastní";
          const validation = filter.validate
            ? filter.validate(dicValue.prefix, dicValue.value)
            : { valid: true };

          return (
            <Box
              key={filter.id}
              sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
            >
              {!isCustom ? (
                <>
                  <FormControl size="small" sx={{ minWidth: filter.prefixWidth || 70 }}>
                    <InputLabel>{filter.label}</InputLabel>
                    <Select
                      value={dicValue.prefix || ""}
                      label={filter.label}
                      onChange={(e) => {
                        const newPrefix = e.target.value || null;
                        updateFilter(filter.id, {
                          prefix: newPrefix,
                          value: newPrefix ? dicValue.value : "",
                        });
                      }}
                    >
                      <MenuItem value="">
                        <em>Vybrat...</em>
                      </MenuItem>
                      {filter.prefixes.map((prefix: string) => (
                        <MenuItem key={prefix} value={prefix}>
                          {prefix}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    placeholder={filter.placeholder}
                    value={dicValue.value}
                    disabled={!dicValue.prefix}
                    onChange={(e) => {
                      const newValue = e.target.value.replace(/\D/g, "");
                      updateFilter(filter.id, { ...dicValue, value: newValue });
                    }}
                    error={!validation.valid}
                    helperText={validation.error}
                    sx={{ minWidth: filter.width || 150 }}
                  />
                </>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <TextField
                    size="small"
                    label={filter.label}
                    placeholder={filter.customPlaceholder}
                    value={dicValue.value}
                    onChange={(e) =>
                      updateFilter(filter.id, {
                        ...dicValue,
                        value: e.target.value,
                      })
                    }
                    error={!validation.valid}
                    helperText={validation.error}
                    sx={{ minWidth: filter.width || 200 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => updateFilter(filter.id, { prefix: null, value: "" })}
                    title="Zrušit vlastní DIČ"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          );
        }

        case "select":
          return (
            <FormControl key={filter.id} size="small" sx={{ minWidth: filter.width || 180 }}>
              <InputLabel>{filter.label}</InputLabel>
              <Select
                value={filters[filter.id] ?? ""}
                label={filter.label}
                onChange={(e: SelectChangeEvent) =>
                  updateFilter(filter.id, e.target.value || null)
                }
              >
                <MenuItem value="">
                  <em>{filter.placeholder || "Vše"}</em>
                </MenuItem>
                {filter.options.map((option: any) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );

        case "multiselect": {
          const selectedValues = filters[filter.id] || [];
          return (
            <FormControl key={filter.id} size="small" sx={{ minWidth: filter.width || 220 }}>
              <InputLabel>{filter.label}</InputLabel>
              <Select
                multiple
                value={selectedValues}
                label={filter.label}
                onChange={(e: SelectChangeEvent<typeof selectedValues>) =>
                  updateFilter(filter.id, e.target.value)
                }
                input={<OutlinedInput label={filter.label} />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value: any) => {
                      const option = filter.options.find((o: any) => o.value === value);
                      return <Chip key={value} label={option?.label || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {filter.options.map((option: any) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }

        default:
          return null;
      }
    };

    const activeAction = actions.find((a) => a.id === openActionId);

    return (
      <>
	  
        <Box
          sx={{
            display: "flex",
            gap: 2,
            p: 2,
            bgcolor: "background.default",
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            mb: 2,
            alignItems: "flex-start",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "flex-start",
              flex: 1,
            }}
          >
            {visibleFilters.map(renderFilter)}
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexShrink: 0 }}>
            {!hideColumnPicker && ( // NEW - conditionally render
              <ColumnPickerButton
                columns={columns}
                visibleColumnIds={visibleColumnIds}
                onVisibleColumnsChange={onVisibleColumnsChange}
                defaultColumnIds={defaultColumnIds}
                orderBy={orderBy}
                onOrderByChange={onOrderByChange}
              />
            )}

            <Button variant="outlined" size="small" onClick={handleClearFilters}>
              {clearLabel}
            </Button>

            {actions.map((a) => (
              <Button
                key={a.id}
                variant={a.variant || "contained"}
                size="small"
                startIcon={a.startIcon ?? <AddIcon />}
                onClick={() => {
                  if (a.renderDialog) {
                    setOpenActionId(a.id);
                  } else {
                    a.onClick?.();
                  }
                }}
              >
                {a.label}
              </Button>
            ))}
          </Box>
        </Box>

        {activeAction?.renderDialog?.({
          open: !!openActionId,
          onClose: () => setOpenActionId(null),
        })}
      </>
    );
  },
);

FilterBar.displayName = "FilterBar";

export default FilterBar;
