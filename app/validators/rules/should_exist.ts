import db from '@adonisjs/lucid/services/db';
import vine from '@vinejs/vine';
import { FieldContext } from '@vinejs/vine/types';

/**
 * Options accepted by the unique rule
 */
type Options = {
  table: string;
  column: string;
};

/**
 * Implementation
 */
async function shouldExist(
  value: unknown,
  options: Options,
  field: FieldContext
) {
  /**
   * We do not want to deal with non-string
   * values. The "string" rule will handle the
   * the validation.
   */
  if (typeof value !== 'string') {
    return;
  }

  const row = await db
    .from(options.table)
    .select(options.column)
    .where(options.column, value)
    .first();

  if (!row) {
    field.report('No value found for {{ field }} field', 'should_exist', field);
  }
}

/**
 * Converting a function to a VineJS rule
 */
export const shouldExistRule = vine.createRule(shouldExist);
