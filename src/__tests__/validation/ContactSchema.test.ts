import { describe, it, expect } from "vitest";
import { contactSchema } from "../../validation/contactSchema";

describe("contactSchema", () => {
	const validContact = {
		ico: "12345678",
		modifier: 1,
		company_name: "Test Company",
		is_supplier: true,
		is_customer: false,
		price_group: 1,
	};

	describe("required fields", () => {
		it("should pass with all required fields", () => {
			const result = contactSchema.safeParse(validContact);
			expect(result.success).toBe(true);
		});

		it("should fail without ico", () => {
			const { ico, ...without } = validContact;
			const result = contactSchema.safeParse(without);
			expect(result.success).toBe(false);
		});

		it("should fail without company_name", () => {
			const { company_name, ...without } = validContact;
			const result = contactSchema.safeParse(without);
			expect(result.success).toBe(false);
		});

		it("should fail without modifier", () => {
			const { modifier, ...without } = validContact;
			const result = contactSchema.safeParse(without);
			expect(result.success).toBe(false);
		});
	});

	describe("modifier validation", () => {
		it("should accept modifiers 1-100", () => {
			for (let mod of [1, 50, 100]) {
				const result = contactSchema.safeParse({
					...validContact,
					modifier: mod,
				});
				expect(result.success).toBe(true);
			}
		});

		it("should reject modifier 0", () => {
			const result = contactSchema.safeParse({ ...validContact, modifier: 0 });
			expect(result.success).toBe(false);
		});

		it("should reject modifier 101", () => {
			const result = contactSchema.safeParse({
				...validContact,
				modifier: 101,
			});
			expect(result.success).toBe(false);
		});

		it("should convert string modifier to number", () => {
			const result = contactSchema.safeParse({
				...validContact,
				modifier: "5",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.modifier).toBe(5);
			}
		});
	});

	describe("price_group validation", () => {
		it("should accept price groups 1-4", () => {
			for (let pg of [1, 2, 3, 4]) {
				const result = contactSchema.safeParse({
					...validContact,
					price_group: pg,
				});
				expect(result.success).toBe(true);
			}
		});

		it("should reject price group 0", () => {
			const result = contactSchema.safeParse({
				...validContact,
				price_group: 0,
			});
			expect(result.success).toBe(false);
		});

		it("should reject price group 5", () => {
			const result = contactSchema.safeParse({
				...validContact,
				price_group: 5,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("company_name validation", () => {
		it("should require at least 2 characters", () => {
			const result = contactSchema.safeParse({
				...validContact,
				company_name: "A",
			});
			expect(result.success).toBe(false);
		});

		it("should accept 2-40 characters", () => {
			const result = contactSchema.safeParse({
				...validContact,
				company_name: "AB",
			});
			expect(result.success).toBe(true);
		});

		it("should reject over 40 characters", () => {
			const longName = "A".repeat(41);
			const result = contactSchema.safeParse({
				...validContact,
				company_name: longName,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("contact type validation", () => {
		it("should require at least is_supplier or is_customer", () => {
			const result = contactSchema.safeParse({
				...validContact,
				is_supplier: false,
				is_customer: false,
			});
			expect(result.success).toBe(false);
		});

		it("should allow both is_supplier and is_customer", () => {
			const result = contactSchema.safeParse({
				...validContact,
				is_supplier: true,
				is_customer: true,
			});
			expect(result.success).toBe(true);
		});
	});

	describe("email validation", () => {
		it("should accept valid email", () => {
			const result = contactSchema.safeParse({
				...validContact,
				email: "test@example.com",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid email", () => {
			const result = contactSchema.safeParse({
				...validContact,
				email: "invalid-email",
			});
			expect(result.success).toBe(false);
		});

		it("should allow empty email", () => {
			const result = contactSchema.safeParse({
				...validContact,
				email: "",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("postal_code validation", () => {
		it("should normalize postal code", () => {
			const result = contactSchema.safeParse({
				...validContact,
				postal_code: "123 45",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.postal_code).toBe("12345");
			}
		});

		it("should accept 5 digit format", () => {
			const result = contactSchema.safeParse({
				...validContact,
				postal_code: "12345",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid postal code", () => {
			const result = contactSchema.safeParse({
				...validContact,
				postal_code: "123",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("optional fields", () => {
		it("should accept undefined optional fields", () => {
			const result = contactSchema.safeParse({
				...validContact,
				dic: undefined,
				representative_name: undefined,
				street: undefined,
				city: undefined,
				postal_code: undefined,
				phone: undefined,
				email: undefined,
				website: undefined,
				bank_account: undefined,
			});
			expect(result.success).toBe(true);
		});

		it("should accept empty string for optional fields", () => {
			const result = contactSchema.safeParse({
				...validContact,
				email: "",
				phone: "",
				website: "",
			});
			expect(result.success).toBe(true);
		});
	});
});
