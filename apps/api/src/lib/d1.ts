export interface D1QueryResult<Row> {
  readonly results: readonly Row[];
}

export interface D1PreparedStatement {
  bind(...values: readonly unknown[]): D1PreparedStatement;
  first<Row>(): Promise<Row | null>;
  all<Row>(): Promise<D1QueryResult<Row>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
