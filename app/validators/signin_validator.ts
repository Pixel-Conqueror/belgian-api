import { uniqueRule } from '#validators/rules/unique';
import vine from '@vinejs/vine';

export const signinValidator = vine.compile(
  vine.object({
    firstname: vine.string().trim(),
    lastname: vine.string().trim(),
    email: vine
      .string()
      .email()
      .trim()
      .toLowerCase()
      .use(uniqueRule({ table: 'users', column: 'email' })),
    password: vine.string().trim(),
  })
);
