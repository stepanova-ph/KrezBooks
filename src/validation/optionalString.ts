import z from "zod";

export const optionalString = z.preprocess(
	(val) => (val === "" || val === null ? undefined : val),
	z.string().optional(),
);
