const removePhonePrefix = (digits: string) =>
      digits.replace(/^(420|00420|421|00421)/, "");

export function matchPhone(value: string, query: string): boolean{
if (!value || !query) return false;

    const normalize = (input: string) => input.replace(/\D/g, "");

    
    const normalizedValue = removePhonePrefix(normalize(value));
    const normalizedQuery = removePhonePrefix(normalize(query));

    return normalizedValue.startsWith(normalizedQuery);
}