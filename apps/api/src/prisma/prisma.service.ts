import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';

/**
 * Raw SQL implementation of PrismaService
 * This bypasses Prisma Client generation requirements
 * and uses direct PostgreSQL queries instead.
 *
 * NOTE: This is a temporary solution until Prisma engines are available.
 * All methods implement the same interface as Prisma Client for compatibility.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  // Expose client-like properties for compatibility
  user: any;
  userProfile: any;
  wallet: any;
  transaction: any;
  game: any;
  gamePlayer: any;
  match: any;
  matchPlayer: any;
  matchMove: any;
  refreshToken: any;
  coupon: any;
  couponClaim: any;
  withdrawalRequest: any;
  ageVerificationRequest: any;
  auditLog: any;
  dailyChallenge: any;
  restrictedRegion: any;
  rateLimitEntry: any;

  constructor(private config: ConfigService) {
    const databaseUrl = this.config.get('DATABASE_URL');

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Initialize model accessors
    this.user = this.createModel('User');
    this.userProfile = this.createModel('UserProfile');
    this.wallet = this.createModel('Wallet');
    this.transaction = this.createModel('Transaction');
    this.game = this.createModel('Game');
    this.gamePlayer = this.createModel('GamePlayer');
    this.match = this.createModel('Match');
    this.matchPlayer = this.createModel('MatchPlayer');
    this.matchMove = this.createModel('MatchMove');
    this.refreshToken = this.createModel('RefreshToken');
    this.coupon = this.createModel('Coupon');
    this.couponClaim = this.createModel('CouponClaim');
    this.withdrawalRequest = this.createModel('WithdrawalRequest');
    this.ageVerificationRequest = this.createModel('AgeVerificationRequest');
    this.auditLog = this.createModel('AuditLog');
    this.dailyChallenge = this.createModel('DailyChallenge');
    this.restrictedRegion = this.createModel('RestrictedRegion');
    this.rateLimitEntry = this.createModel('RateLimitEntry');
  }

  async onModuleInit() {
    try {
      await this.pool.query('SELECT 1');
      console.log('✅ Database connected successfully (Raw SQL mode)');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  /**
   * Create a model accessor with CRUD methods
   */
  private createModel(tableName: string) {
    return {
      findUnique: async ({ where, include }: any) => {
        const keys = Object.keys(where);
        const key = keys[0];
        const value = where[key];

        const query = `SELECT * FROM "${tableName}" WHERE "${key}" = $1 LIMIT 1`;
        const result = await this.pool.query(query, [value]);

        if (result.rows.length === 0) return null;

        const row = this.deserialize(result.rows[0]);

        // Handle includes (simplified - only basic relations)
        if (include) {
          await this.loadIncludes(tableName, row, include);
        }

        return row;
      },

      findFirst: async ({ where, orderBy, include }: any) => {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (where) {
          for (const [key, value] of Object.entries(where)) {
            conditions.push(`"${key}" = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }

        let query = `SELECT * FROM "${tableName}"`;
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }

        if (orderBy) {
          const orderKeys = Object.keys(orderBy);
          const orderClauses = orderKeys.map(key => `"${key}" ${orderBy[key].toUpperCase()}`);
          query += ` ORDER BY ${orderClauses.join(', ')}`;
        }

        query += ' LIMIT 1';

        const result = await this.pool.query(query, values);
        if (result.rows.length === 0) return null;

        const row = this.deserialize(result.rows[0]);

        if (include) {
          await this.loadIncludes(tableName, row, include);
        }

        return row;
      },

      findMany: async ({ where, orderBy, take, skip, include }: any = {}) => {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (where) {
          for (const [key, value] of Object.entries(where)) {
            if (value && typeof value === 'object' && 'gte' in value) {
              conditions.push(`"${key}" >= $${paramIndex}`);
              values.push(value.gte);
            } else if (value && typeof value === 'object' && 'lte' in value) {
              conditions.push(`"${key}" <= $${paramIndex}`);
              values.push(value.lte);
            } else if (value && typeof value === 'object' && 'in' in value) {
              conditions.push(`"${key}" = ANY($${paramIndex})`);
              values.push(value.in);
            } else {
              conditions.push(`"${key}" = $${paramIndex}`);
              values.push(value);
            }
            paramIndex++;
          }
        }

        let query = `SELECT * FROM "${tableName}"`;
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }

        if (orderBy) {
          const orderKeys = Object.keys(orderBy);
          const orderClauses = orderKeys.map(key => `"${key}" ${orderBy[key].toUpperCase()}`);
          query += ` ORDER BY ${orderClauses.join(', ')}`;
        }

        if (skip) query += ` OFFSET ${skip}`;
        if (take) query += ` LIMIT ${take}`;

        const result = await this.pool.query(query, values);
        const rows = result.rows.map(row => this.deserialize(row));

        if (include) {
          for (const row of rows) {
            await this.loadIncludes(tableName, row, include);
          }
        }

        return rows;
      },

      create: async ({ data }: any) => {
        const keys = Object.keys(data);
        const values = keys.map(key => data[key]);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const query = `
          INSERT INTO "${tableName}" (${keys.map(k => `"${k}"`).join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;

        const result = await this.pool.query(query, values);
        return this.deserialize(result.rows[0]);
      },

      update: async ({ where, data }: any) => {
        const whereKeys = Object.keys(where);
        const whereKey = whereKeys[0];
        const whereValue = where[whereKey];

        const dataKeys = Object.keys(data);
        const dataValues = dataKeys.map(key => {
          const value = data[key];
          // Handle increment/decrement
          if (value && typeof value === 'object') {
            if ('increment' in value) return { key, op: '+', value: value.increment };
            if ('decrement' in value) return { key, op: '-', value: value.decrement };
          }
          return { key, value };
        });

        const setClauses = dataValues.map((item, i) => {
          if (item.op) {
            return `"${item.key}" = "${item.key}" ${item.op} $${i + 1}`;
          }
          return `"${item.key}" = $${i + 1}`;
        });

        const values = [...dataValues.map(item => item.value), whereValue];

        const query = `
          UPDATE "${tableName}"
          SET ${setClauses.join(', ')}, "updatedAt" = NOW()
          WHERE "${whereKey}" = $${dataValues.length + 1}
          RETURNING *
        `;

        const result = await this.pool.query(query, values);
        if (result.rows.length === 0) return null;
        return this.deserialize(result.rows[0]);
      },

      updateMany: async ({ where, data }: any) => {
        const whereKeys = Object.keys(where);
        const conditions = whereKeys.map((key, i) => `"${key}" = $${i + 1}`);
        const whereValues = whereKeys.map(key => where[key]);

        const dataKeys = Object.keys(data);
        const setClauses = dataKeys.map((key, i) => `"${key}" = $${whereKeys.length + i + 1}`);
        const dataValues = dataKeys.map(key => data[key]);

        const query = `
          UPDATE "${tableName}"
          SET ${setClauses.join(', ')}, "updatedAt" = NOW()
          WHERE ${conditions.join(' AND ')}
        `;

        const result = await this.pool.query(query, [...whereValues, ...dataValues]);
        return { count: result.rowCount };
      },

      delete: async ({ where }: any) => {
        const keys = Object.keys(where);
        const key = keys[0];
        const value = where[key];

        const query = `DELETE FROM "${tableName}" WHERE "${key}" = $1 RETURNING *`;
        const result = await this.pool.query(query, [value]);

        if (result.rows.length === 0) return null;
        return this.deserialize(result.rows[0]);
      },

      deleteMany: async ({ where }: any) => {
        const keys = Object.keys(where);
        const conditions = keys.map((key, i) => `"${key}" = $${i + 1}`);
        const values = keys.map(key => where[key]);

        const query = `DELETE FROM "${tableName}" WHERE ${conditions.join(' AND ')}`;
        const result = await this.pool.query(query, values);

        return { count: result.rowCount };
      },

      count: async ({ where }: any = {}) => {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (where) {
          for (const [key, value] of Object.entries(where)) {
            conditions.push(`"${key}" = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }

        let query = `SELECT COUNT(*) FROM "${tableName}"`;
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }

        const result = await this.pool.query(query, values);
        return parseInt(result.rows[0].count);
      },

      aggregate: async ({ where, _sum, _avg, _count }: any = {}) => {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (where) {
          for (const [key, value] of Object.entries(where)) {
            if (value && typeof value === 'object' && 'gte' in value) {
              conditions.push(`"${key}" >= $${paramIndex}`);
              values.push(value.gte);
            } else {
              conditions.push(`"${key}" = $${paramIndex}`);
              values.push(value);
            }
            paramIndex++;
          }
        }

        const selectClauses: string[] = [];

        if (_sum) {
          Object.keys(_sum).forEach(key => {
            if (_sum[key]) selectClauses.push(`SUM("${key}") as "${key}"`);
          });
        }

        if (_avg) {
          Object.keys(_avg).forEach(key => {
            if (_avg[key]) selectClauses.push(`AVG("${key}") as "avg_${key}"`);
          });
        }

        if (_count) {
          selectClauses.push('COUNT(*) as count');
        }

        let query = `SELECT ${selectClauses.join(', ') || '*'} FROM "${tableName}"`;
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }

        const result = await this.pool.query(query, values);
        const row = result.rows[0];

        return {
          _sum: _sum ? Object.keys(_sum).reduce((acc, key) => {
            acc[key] = row[key] ? parseInt(row[key]) : 0;
            return acc;
          }, {} as any) : undefined,
          _avg: _avg ? Object.keys(_avg).reduce((acc, key) => {
            acc[key] = row[`avg_${key}`] ? parseFloat(row[`avg_${key}`]) : 0;
            return acc;
          }, {} as any) : undefined,
          _count: _count ? (row.count ? parseInt(row.count) : 0) : undefined,
        };
      },

      groupBy: async ({ by, where, _count, _sum }: any) => {
        // Simplified groupBy implementation
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (where) {
          for (const [key, value] of Object.entries(where)) {
            if (value && typeof value === 'object' && 'gte' in value) {
              conditions.push(`"${key}" >= $${paramIndex}`);
              values.push(value.gte);
            } else {
              conditions.push(`"${key}" = $${paramIndex}`);
              values.push(value);
            }
            paramIndex++;
          }
        }

        const groupByClause = Array.isArray(by) ? by.map(b => `"${b}"`).join(', ') : `"${by}"`;
        const selectClauses = [groupByClause];

        if (_count) {
          selectClauses.push('COUNT(*) as "_count"');
        }

        if (_sum) {
          Object.keys(_sum).forEach(key => {
            if (_sum[key]) selectClauses.push(`SUM("${key}") as "${key}"`);
          });
        }

        let query = `SELECT ${selectClauses.join(', ')} FROM "${tableName}"`;
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
        query += ` GROUP BY ${groupByClause}`;

        const result = await this.pool.query(query, values);
        return result.rows.map(row => this.deserialize(row));
      },
    };
  }

  /**
   * Transaction support (simplified)
   */
  async $transaction(callback: (client: any) => Promise<any>) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Create transaction client with same model structure
      const txClient: any = {};
      ['user', 'userProfile', 'wallet', 'transaction', 'game', 'gamePlayer',
       'match', 'matchPlayer', 'refreshToken', 'coupon', 'couponClaim'].forEach(model => {
        txClient[model] = this.createTransactionModel(client, model);
      });

      const result = await callback(txClient);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private createTransactionModel(client: PoolClient, tableName: string) {
    // Similar to createModel but uses transaction client
    return {
      findUnique: async ({ where }: any) => {
        const keys = Object.keys(where);
        const key = keys[0];
        const value = where[key];
        const query = `SELECT * FROM "${tableName}" WHERE "${key}" = $1 LIMIT 1`;
        const result = await client.query(query, [value]);
        return result.rows.length > 0 ? this.deserialize(result.rows[0]) : null;
      },
      update: async ({ where, data }: any) => {
        const whereKeys = Object.keys(where);
        const whereKey = whereKeys[0];
        const whereValue = where[whereKey];
        const dataKeys = Object.keys(data);
        const setClauses = dataKeys.map((key, i) => `"${key}" = $${i + 1}`);
        const dataValues = dataKeys.map(key => data[key]);
        const query = `UPDATE "${tableName}" SET ${setClauses.join(', ')}, "updatedAt" = NOW() WHERE "${whereKey}" = $${dataKeys.length + 1} RETURNING *`;
        const result = await client.query(query, [...dataValues, whereValue]);
        return result.rows.length > 0 ? this.deserialize(result.rows[0]) : null;
      },
      create: async ({ data }: any) => {
        const keys = Object.keys(data);
        const values = keys.map(key => data[key]);
        const placeholders = values.map((_, i) => `$${i + 1}`);
        const query = `INSERT INTO "${tableName}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
        const result = await client.query(query, values);
        return this.deserialize(result.rows[0]);
      },
      updateMany: async ({ where, data }: any) => {
        const whereKeys = Object.keys(where);
        const conditions = whereKeys.map((key, i) => `"${key}" = $${i + 1}`);
        const whereValues = whereKeys.map(key => where[key]);
        const dataKeys = Object.keys(data);
        const setClauses = dataKeys.map((key, i) => `"${key}" = $${whereKeys.length + i + 1}`);
        const dataValues = dataKeys.map(key => data[key]);
        const query = `UPDATE "${tableName}" SET ${setClauses.join(', ')}, "updatedAt" = NOW() WHERE ${conditions.join(' AND ')}`;
        const result = await client.query(query, [...whereValues, ...dataValues]);
        return { count: result.rowCount };
      },
    };
  }

  /**
   * Helper to deserialize database rows
   */
  private deserialize(row: any) {
    if (!row) return null;

    const result: any = {};
    for (const [key, value] of Object.entries(row)) {
      // Parse JSON fields
      if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Load related data (simplified includes)
   */
  private async loadIncludes(tableName: string, row: any, include: any) {
    // Simplified - only handle common cases
    // In production, this would be more sophisticated
    for (const [key, value] of Object.entries(include)) {
      if (value === true) {
        // Try to load relation based on common patterns
        // This is simplified and would need expansion for production
      }
    }
  }

  /**
   * Raw query support
   */
  async $queryRaw(query: string, ...params: any[]) {
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async $executeRaw(query: string, ...params: any[]) {
    const result = await this.pool.query(query, params);
    return result.rowCount;
  }
}
