import vine, { SimpleMessagesProvider } from '@vinejs/vine';

export const scrappingValidator = vine.compile(
  vine.object({
    params: vine.object({
      companyNumber: vine
        .string()
        .regex(/^\d{6,}$/)
        .trim(),
    }),
  })
);

scrappingValidator.messagesProvider = new SimpleMessagesProvider({
  'companyNum.required': 'The company number is required.',
  'companyNum.regex':
    'The company number must be a number with at least 6 digits.',
});
