import { useSortable } from "@dnd-kit/sortable";
import { TableCell, Box } from "@mui/material";
import { Column } from "./DataTable";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import { CSS } from "@dnd-kit/utilities";

interface DraggableHeaderCellProps {
	column: Column;
	disabled?: true;
}

function DraggableHeaderCell({ column, disabled }: DraggableHeaderCellProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: column.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<TableCell
			ref={setNodeRef}
			style={{
				...style,
				minWidth: column.minWidth,
				maxWidth: column.maxWidth,
				width: column.width,
				position: "relative",
			}}
			align={column.align}
			{...attributes}
		>
			<Box
				sx={{
					pr: column.align === "right" ? disabled ? 0 : "24px" : 0,
					overflow: "hidden",
					whiteSpace: "nowrap",
					textOverflow: "ellipsis",
					userSelect: "none",
					fontWeight: 600,
				}}
				title={column.label}
			>
				{column.label}
			</Box>

			{!disabled && <Box
				{...listeners}
				sx={{
					position: "absolute",
					right: 4,
					top: "50%",
					transform: "translateY(-50%)",
					cursor: "grab",
					lineHeight: 0,
					display: "flex",
					alignItems: "center",
					"&:active": { cursor: "grabbing" },
					"&:hover": { color: "primary.main" },
					color: "text.disabled",
					p: 0.25,
				}}
				aria-label={`Přesunout sloupec ${column.label}`}
			>
				<DragHandleIcon sx={{ fontSize: 16, opacity: 0.7 }} />
			</Box>}
		</TableCell>
	);
}

export default DraggableHeaderCell;
