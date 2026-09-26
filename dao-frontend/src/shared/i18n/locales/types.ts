/** Same keys as English, any string values. Missing keys are a compile error. */
export type TranslationShape<T> = { [K in keyof T]: T[K] extends string ? string : TranslationShape<T[K]> };
