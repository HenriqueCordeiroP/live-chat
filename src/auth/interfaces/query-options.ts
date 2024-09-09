export interface QueryOptions {
  where?: object;
  relations?: object;
  order?: object;
  take?: number;
  skip?: number;
  withDeleted?: boolean;
}
