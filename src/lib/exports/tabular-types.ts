export type TabularColumn = {
  header: string;
  key: string;
  width?: number;
};

export type TabularExport = {
  title: string;
  subtitle?: string;
  sheetName?: string;
  columns: TabularColumn[];
  rows: Record<string, string | number | boolean | null | undefined>[];
};
