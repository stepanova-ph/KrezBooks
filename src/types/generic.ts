export type CreateInput<T, K extends keyof T> = Omit<T, K>;
export type UpdateInput<T, K extends keyof T, PK extends keyof T> = Pick<
  T,
  PK
> &
  Partial<Omit<T, PK | K>>;
