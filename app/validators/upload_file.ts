import vine from '@vinejs/vine';
import { FileNames } from '#validators/enum/file_names';

export const uploadFileValidator = vine.compile(
  vine.object({
    file: vine.file({
      size: '1gb',
      extnames: ['csv'],
    }),
    fileName: vine.enum(FileNames),
  })
);
