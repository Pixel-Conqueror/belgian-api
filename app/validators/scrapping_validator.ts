import vine, { SimpleMessagesProvider } from '@vinejs/vine';

// Définir le validateur pour valider que le paramètre Number est un numéro valide
export const scrappingValidator = vine.compile(
  vine.object({
    Number: vine
      .string()
      .regex(/^\d{6,}$/)  
      .trim(),
  })
);

// Messages personnalisés pour la validation
scrappingValidator.messagesProvider = new SimpleMessagesProvider({
  'Number.required': 'Le numéro de l\'entreprise est requis.',
  'Number.regex': 'Le numéro de l\'entreprise doit être composé d\'au moins 6 chiffres.',
});
