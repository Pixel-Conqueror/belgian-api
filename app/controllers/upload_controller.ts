import ProcessCsvFileUploadedJob from '#jobs/process_csv_file_uploaded_job';
import { uploadFileValidator } from '#validators/upload_file';
import { cuid } from '@adonisjs/core/helpers';
import type { HttpContext } from '@adonisjs/core/http';
import app from '@adonisjs/core/services/app';
import queue from '@rlanz/bull-queue/services/main';

export default class UploadController {
  async handle({ request, auth }: HttpContext) {
    const { file } = await request.validateUsing(uploadFileValidator);
    const folderName = cuid();
    const folderPath = `${app.tmpPath('temp_csv')}/${folderName}`;
    await file.move(folderPath);
    await queue.dispatch(ProcessCsvFileUploadedJob, {
      folderPath,
      userId: auth.user!.id,
    });
    return { message: 'File uploaded successfully' };
  }
}
