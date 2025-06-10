import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const orderSchema = z.object({
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  orderBy: z.string().default('created_at'),
});

type PrismaOrderByValue = 'asc' | 'desc';
type PrismaOrderBy = Record<string, PrismaOrderByValue | Record<string, any>>;

export class OrderDto extends createZodDto(orderSchema) {}

export class OrderBuilder {
  private orderDto: OrderDto;

  constructor(orderDto: OrderDto) {
    this.orderDto = orderDto;
  }

  public use(
    orderBy = this.orderDto.orderBy,
    orderDir = this.orderDto.orderDir,
  ): PrismaOrderBy {
    if (!orderBy.includes('.')) {
      return {
        [orderBy]: orderDir,
      };
    }

    const parts = orderBy.split('.');

    if (parts[parts.length - 1] === '_count') {
      return this.buildCountOrder(parts, orderDir);
    }

    return this.buildNestedOrder(parts, orderDir);
  }

  private buildCountOrder(parts: string[], orderDir: 'asc' | 'desc') {
    const result: any = {};
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      current[part] = {};
      current = current[part];
    }

    current._count = orderDir;

    return result;
  }

  private buildNestedOrder(parts: string[], orderDir: string) {
    const result: any = {};
    let current = result;

    // Navigate through the nested path
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      current[part] = {};
      current = current[part];
    }

    // Set the final field with direction
    current[parts[parts.length - 1]] = orderDir;

    return result;
  }

  public static createMultipleOrders(
    orders: Array<{ field: string; direction: 'asc' | 'desc' }>,
  ) {
    return orders.map((order) => {
      const dto = new OrderDto();
      dto.orderBy = order.field;
      dto.orderDir = order.direction;
      return new OrderBuilder(dto).use();
    });
  }

  public static validateOrderField(
    orderBy: string,
    allowedFields: string[],
    allowedRelations: Record<string, string[]> = {},
  ): boolean {
    if (!orderBy.includes('.')) {
      return allowedFields.includes(orderBy);
    }

    const parts = orderBy.split('.');

    // Handle _count validation
    if (parts[parts.length - 1] === '_count') {
      const relationPath = parts.slice(0, -1);
      return this.validateRelationPath(relationPath, allowedRelations);
    }

    // Handle nested field validation
    return this.validateNestedField(parts, allowedFields, allowedRelations);
  }

  private static validateRelationPath(
    path: string[],
    allowedRelations: Record<string, string[]>,
  ): boolean {
    if (path.length === 1) {
      return Object.keys(allowedRelations).includes(path[0]);
    }

    // For deeper nesting, you'd need more complex validation
    // This is a simplified version
    return path.every((part) => Object.keys(allowedRelations).includes(part));
  }

  private static validateNestedField(
    parts: string[],
    allowedFields: string[],
    allowedRelations: Record<string, string[]>,
  ): boolean {
    if (parts.length === 1) {
      return allowedFields.includes(parts[0]);
    }

    const [relation, ...fieldParts] = parts;
    const relationFields = allowedRelations[relation];

    if (!relationFields) {
      return false;
    }

    const fieldPath = fieldParts.join('.');
    return (
      relationFields.includes(fieldPath) ||
      fieldParts.every((field) => relationFields.includes(field))
    );
  }
}
