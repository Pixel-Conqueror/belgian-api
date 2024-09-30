import { shouldExistRule } from '#validators/rules/should_exist';
import vine, { SimpleMessagesProvider } from '@vinejs/vine';

export const loginValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .trim()
      .toLowerCase()
      .use(shouldExistRule({ table: 'users', column: 'email' })),
    password: vine.string().trim(),
  })
);

export const verifyTokenValidator = vine.compile(
  vine.object({
    token: vine
      .string()
      .trim()
      .use(shouldExistRule({ table: 'access_tokens', column: 'token' })),
  })
);

loginValidator.messagesProvider = new SimpleMessagesProvider({
  'email.should_exist': 'Credentials are not valid',
});
