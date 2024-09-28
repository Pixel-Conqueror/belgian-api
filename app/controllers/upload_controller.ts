import ProcessCsvFileUploadedJob from '#jobs/process_csv_file_uploaded_job';
import { uploadFileValidator } from '#validators/upload_file';
import { cuid } from '@adonisjs/core/helpers';
import type { HttpContext } from '@adonisjs/core/http';
import app from '@adonisjs/core/services/app';
import queue from '@rlanz/bull-queue/services/main';

export default class UploadController {
  async handle({ request, auth }: HttpContext) {
    const { file, fileName } = await request.validateUsing(uploadFileValidator);

    const folderPath = this.generateFolderPath();
    await file.move(folderPath, { name: this.generateFileName(fileName) });

    await queue.dispatch(ProcessCsvFileUploadedJob, {
      folderPath,
      userId: auth.user!.id,
    });
    return { message: 'File uploaded successfully' };
  }

  private generateFileName(fileName: string) {
    if (fileName.endsWith('.csv')) {
      return fileName;
    }

    return `${fileName}.csv`;
  }

  private generateFolderPath() {
    return `${app.tmpPath('temp_csv')}/${cuid()}`;
  }
}
