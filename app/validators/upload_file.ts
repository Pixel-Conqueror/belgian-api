import vine from '@vinejs/vine';

export const uploadFileValidator = vine.compile(
  vine.object({
    file: vine.file({
      size: '1gb',
      extnames: ['csv'],
    }),
  })
);
