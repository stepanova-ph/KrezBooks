import { useState, useEffect } from "react";

export interface UseFormDialogOptions<T> {
	open: boolean;
	initialData?: Partial<T> | null;
	mode: "create" | "edit";
	defaultFormData: T;
	onSubmit: (data: T) => Promise<void>;
	schema?: any; // Zod schema for validation
}

export function useFormDialog<T extends Record<string, any>>({
	open,
	initialData,
	mode,
	defaultFormData,
	onSubmit,
	schema,
}: UseFormDialogOptions<T>) {
	const [formData, setFormData] = useState<T>(defaultFormData);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isPending, setIsPending] = useState(false);

	// Reset form when dialog opens/closes or data changes
	useEffect(() => {
		if (open) {
			if (mode === "edit" && initialData) {
				setFormData({ ...defaultFormData, ...initialData });
			} else {
				setFormData(defaultFormData);
			}
			setErrors({});
		}
	}, [open, mode, initialData]);

	const handleChange = (field: string, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	const handleBlur = (field: string) => {
		if (!schema) return;

		try {
			schema.shape[field]?.parse(formData[field]);
			setErrors((prev) => ({ ...prev, [field]: "" }));
		} catch (err: any) {
			setErrors((prev) => ({ ...prev, [field]: err.errors?.[0]?.message }));
		}
	};

	const validate = (): boolean => {
		if (!schema) return true;

		try {
			schema.parse(formData);
			setErrors({});
			return true;
		} catch (err: any) {
			const newErrors: Record<string, string> = {};
			err.errors?.forEach((error: any) => {
				const field = error.path[0];
				if (field) newErrors[field] = error.message;
			});
			setErrors(newErrors);
			return false;
		}
	};

	const handleSubmit = async () => {
		if (!validate()) return;

		setIsPending(true);
		try {
			await onSubmit(formData);
		} finally {
			setIsPending(false);
		}
	};

	return {
		formData,
		setFormData,
		errors,
		isPending,
		handleChange,
		handleBlur,
		handleSubmit,
		validate,
	};
}
