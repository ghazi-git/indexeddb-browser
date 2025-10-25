export type FilterOptionDef =
  | string
  | {
      displayKey: string;
      displayName: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      predicate: (filterValues: any[], celValue: any) => boolean;
      numberOfInputs?: 0 | 1 | 2;
    };
