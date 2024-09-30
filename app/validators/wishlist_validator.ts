import vine, { SimpleMessagesProvider } from '@vinejs/vine';

export const wishlistValidator = vine.compile(
  vine.object({
    params: vine.object({
      enterpriseId: vine.string().trim(),
    }),
  })
);

wishlistValidator.messagesProvider = new SimpleMessagesProvider({
  'companyNum.required': 'Enterprise ID is required.',
  'companyNum.regex': 'Enterprise ID must be a number with at least 6 digits.',
});
