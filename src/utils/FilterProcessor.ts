import { Prisma } from '@prisma/client';

type FilterOperator = 'equals' | 'contains' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' | 'not' | 'startsWith' | 'endsWith';
type SortDirection = 'asc' | 'desc';

interface FilterOption {
  field: string;
  operator: FilterOperator;
  value: any;
}

interface SortOption {
  field: string;
  direction: SortDirection;
}

interface PaginationOption {
  page: number;
  perPage: number;
}

export interface QueryOptions {
  filters?: FilterOption[];
  sorts?: SortOption[];
  pagination?: PaginationOption;
  includeDeleted?: boolean;
}

class FilterProcessor {
  /**
   * Processa opções de consulta e retorna um objeto de filtro para uso com o Prisma
   */
  static processQuery<T extends object>(options: QueryOptions): {
    where: any;
    orderBy: any[];
    skip?: number;
    take?: number;
    include?: any;
  } {
    const query: any = {
      where: {},
      orderBy: [],
    };

    // Processar filtros
    if (options.filters && options.filters.length > 0) {
      options.filters.forEach((filter) => {
        switch (filter.operator) {
          case 'equals':
            query.where[filter.field] = filter.value;
            break;
          case 'contains':
            query.where[filter.field] = { contains: filter.value };
            break;
          case 'in':
            query.where[filter.field] = { in: filter.value };
            break;
          case 'gt':
            query.where[filter.field] = { gt: filter.value };
            break;
          case 'gte':
            query.where[filter.field] = { gte: filter.value };
            break;
          case 'lt':
            query.where[filter.field] = { lt: filter.value };
            break;
          case 'lte':
            query.where[filter.field] = { lte: filter.value };
            break;
          case 'not':
            query.where[filter.field] = { not: filter.value };
            break;
          case 'startsWith':
            query.where[filter.field] = { startsWith: filter.value };
            break;
          case 'endsWith':
            query.where[filter.field] = { endsWith: filter.value };
            break;
        }
      });
    }

    // Aplicar filtro de soft delete, a menos que seja explicitamente solicitado para incluir excluídos
    if (!options.includeDeleted) {
      query.where.deletedAt = null;
    }

    // Processar ordenação
    if (options.sorts && options.sorts.length > 0) {
      options.sorts.forEach((sort) => {
        query.orderBy.push({ [sort.field]: sort.direction });
      });
    }

    // Processar paginação
    if (options.pagination) {
      const { page, perPage } = options.pagination;
      query.skip = (page - 1) * perPage;
      query.take = perPage;
    }

    return query;
  }

  /**
   * Converte parâmetros de consulta da URL para opções de consulta estruturadas
   */
  static fromQueryParams(queryParams: any): QueryOptions {
    const options: QueryOptions = {
      filters: [],
      sorts: [],
    };

    // Processar filtros
    Object.keys(queryParams).forEach((key) => {
      // Filtros com formato especial: field_operator
      const filterMatch = key.match(/^filter\.(.+)_(.+)$/);
      if (filterMatch) {
        const [, field, operator] = filterMatch;
        options.filters?.push({
          field,
          operator: operator as FilterOperator,
          value: this.parseValue(queryParams[key]),
        });
        return;
      }

      // Ordenação: sort=field:direction
      if (key === 'sort') {
        const sortValues = Array.isArray(queryParams[key])
          ? queryParams[key]
          : [queryParams[key]];

        sortValues.forEach((sortValue: string) => {
          const [field, direction = 'asc'] = sortValue.split(':');
          options.sorts?.push({
            field,
            direction: direction as SortDirection,
          });
        });
        return;
      }

      // Paginação
      if (key === 'page') {
        const page = parseInt(queryParams[key], 10) || 1;
        const perPage = parseInt(queryParams['perPage'], 10) || 10;
        options.pagination = { page, perPage };
        return;
      }

      // Incluir excluídos
      if (key === 'includeDeleted') {
        options.includeDeleted = queryParams[key] === 'true';
        return;
      }
    });

    return options;
  }

  /**
   * Converte valores de string para tipos adequados
   */
  private static parseValue(value: any): any {
    // Se já não for uma string, retornar como está
    if (typeof value !== 'string') {
      return value;
    }

    // Valor booleano
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Valor numérico
    if (!isNaN(Number(value))) {
      return Number(value);
    }

    // Data ISO
    if (
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2}))?$/.test(
        value
      )
    ) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
    }

    // Array (formato: valor1,valor2,valor3)
    if (value.includes(',')) {
      return value.split(',').map((v) => this.parseValue(v.trim()));
    }

    // Valor padrão (string)
    return value;
  }
}

export default FilterProcessor;