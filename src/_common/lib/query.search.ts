import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query must be at least 1 character')
    .max(100, 'Search query must be less than 100 characters')
    .optional(),
  fields: z
    .array(z.string())
    .optional()
    .describe('Specific fields to search in'),
  mode: z
    .enum(['insensitive', 'default'])
    .default('insensitive')
    .describe('Search mode for case sensitivity'),
  searchType: z
    .enum(['contains', 'startsWith', 'endsWith', 'equals', 'fullText'])
    .default('contains')
    .describe('Type of search to perform'),
});

export type SearchMode = 'insensitive' | 'default';
export type SearchType =
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'equals'
  | 'fullText';

export interface SearchableField {
  field: string;
  weight?: number; // For ranking in full-text search
  relation?: string; // For nested field searches
}

export interface SearchConfig {
  searchableFields: SearchableField[];
  enableFullTextSearch?: boolean;
  defaultOperator?: 'AND' | 'OR';
}

export class SearchDto extends createZodDto(searchSchema) {}

export class SearchBuilder {
  private query: string | undefined;
  private fields: string[] | undefined;
  private mode: SearchMode;
  private searchType: SearchType;

  constructor(searchDto: SearchDto) {
    this.query = searchDto.query;
    this.fields = searchDto.fields;
    this.mode = searchDto.mode;
    this.searchType = searchDto.searchType;
  }

  /**
   * Build Prisma where clause for search
   */
  public buildWhere<T = any>(config: SearchConfig): T {
    if (!this.query || this.query.trim() === '') {
      return {} as T;
    }

    const trimmedQuery = this.query.trim();
    const searchFields =
      this.fields || config.searchableFields.map((f) => f.field);

    if (this.searchType === 'fullText' && config.enableFullTextSearch) {
      return this.buildFullTextSearch(trimmedQuery, config) as T;
    }

    return this.buildRegularSearch(trimmedQuery, searchFields, config) as T;
  }

  /**
   * Build full-text search where clause (PostgreSQL specific)
   */
  private buildFullTextSearch(query: string, config: SearchConfig) {
    // For PostgreSQL full-text search
    return {
      OR: config.searchableFields.map((field) => ({
        [field.field]: {
          search: query,
        },
      })),
    };
  }

  /**
   * Build regular search where clause with LIKE operations
   */
  private buildRegularSearch(
    query: string,
    searchFields: string[],
    config: SearchConfig,
  ) {
    const operator = config.defaultOperator || 'OR';
    const searchConditions = searchFields.map((field) =>
      this.buildFieldCondition(field, query),
    );

    return {
      [operator]: searchConditions,
    };
  }

  /**
   * Build search condition for a specific field
   */
  private buildFieldCondition(field: string, query: string) {
    // Handle nested fields (e.g., 'user.firstName')
    if (field.includes('.')) {
      return this.buildNestedFieldCondition(field, query);
    }

    // Build simple field condition
    return {
      [field]: {
        [this.searchType]: query,
        mode: this.mode,
      },
    };
  }

  /**
   * Build search condition for nested fields
   */
  private buildNestedFieldCondition(field: string, query: string) {
    const parts = field.split('.');
    const [relation, ...fieldParts] = parts;
    const fieldPath = fieldParts.join('.');

    return {
      [relation]: {
        [fieldPath]: {
          [this.searchType]: query,
          mode: this.mode,
        },
      },
    };
  }

  /**
   * Check if search is active
   */
  public get isActive(): boolean {
    return !!this.query && this.query.trim().length > 0;
  }

  /**
   * Get search terms (split by spaces for multi-word search)
   */
  public get searchTerms(): string[] {
    if (!this.query) return [];
    return this.query
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0);
  }

  /**
   * Build fuzzy search with similarity (PostgreSQL specific)
   */
  public buildFuzzySearch<T = any>(config: SearchConfig, similarity = 0.3): T {
    if (!this.isActive) {
      return {} as T;
    }

    // Using PostgreSQL pg_trgm extension for fuzzy search
    const searchFields =
      this.fields || config.searchableFields.map((f) => f.field);

    return {
      OR: searchFields.map((field) => ({
        [field]: {
          // Raw SQL for similarity search
          similarity: {
            gte: similarity,
            query: this.query,
          },
        },
      })),
    } as T;
  }
}
