import { Pool } from "pg";

export const postgresPool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "socket_io_app",
  password: "123123a@",
  port: 5434,
});