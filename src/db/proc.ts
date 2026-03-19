import { pool } from './pool';

export async function callProc<T = any>(callSql: string, params?: Record<string, unknown>): Promise<T[]> {
  // mysql2 returns: [resultSets, fields]
  // where resultSets is an array of result sets for CALL statements.
  const [resultSets] = await pool.query<any>(callSql, params as any);
  const first = Array.isArray(resultSets) ? resultSets[0] : resultSets;
  return (first ?? []) as T[];
}

export async function callProcSets(callSql: string, params?: Record<string, unknown>): Promise<any[][]> {
  const [resultSets] = await pool.query<any>(callSql, params as any);
  if (!Array.isArray(resultSets)) return [[resultSets]];

  // For CALL, mysql2 typically returns: [rows1, rows2, ..., ResultSetHeader]
  // Keep only the row arrays.
  return resultSets.filter((x: any) => Array.isArray(x));
}
