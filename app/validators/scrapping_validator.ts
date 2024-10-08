import vine, { SimpleMessagesProvider } from '@vinejs/vine';

export const scrappingValidator = vine.compile(
  vine.object({
    params: vine.object({
      enterpriseId: vine
        .string()
        .regex(/^\d{6,}$/)
        .trim(),
    }),
  })
);

scrappingValidator.messagesProvider = new SimpleMessagesProvider({
  'companyNum.required': 'Enterprise ID is required.',
  'companyNum.regex': 'Enterprise ID must be a number with at least 6 digits.',
});
