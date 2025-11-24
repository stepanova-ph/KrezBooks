import { Dialog } from "../dialog/Dialog";

export function FormDialog({
	open,
	onClose,
	title,
	children,
	onSubmit,
	isPending = false,
	submitLabel = "Uložit",
	cancelLabel = "Vymazat formulář",
	mode = "create",
}: FormDialogProps & { mode?: "create" | "edit" }) {
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(e);
	};

	const actions =
		mode === "create"
			? [
					{
						label: cancelLabel,
						onClick: onClose,
						variant: "outlined" as const,
					},
					{
						label: isPending ? "Ukládám..." : submitLabel,
						onClick: handleSubmit,
						variant: "contained" as const,
						disabled: isPending,
						type: "submit" as const,
					},
				]
			: [
					{
						label: isPending ? "Ukládám..." : submitLabel,
						onClick: handleSubmit,
						variant: "contained" as const,
						disabled: isPending,
						type: "submit" as const,
					},
				];

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={title}
			actions={actions}
			onSubmit={handleSubmit}
		>
			<form onSubmit={handleSubmit} noValidate>
				{children}
			</form>
		</Dialog>
	);
}
