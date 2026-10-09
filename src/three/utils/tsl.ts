/**
 * TSL's typings do not follow storage-buffer elements through swizzles, arithmetic and
 * mixed vector types. The shader graph itself is type-checked when it is built, so compute
 * code loosens individual nodes with `loose()` instead of fighting the declarations.
 */
// oxlint-disable-next-line typescript/no-explicit-any
export type AnyNode = any

export const loose = (node: unknown): AnyNode => node
