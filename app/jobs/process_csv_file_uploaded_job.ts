import User from '#models/user';
import { DatabaseLoader } from '#services/database_loader';
import { Job } from '@rlanz/bull-queue';

interface ProcessCsvFileUploadedJobPayload {
  userId: User['id'];
  folderPath: string;
}

export default class ProcessCsvFileUploadedJob extends Job {
  static get $$filepath() {
    return import.meta.url;
  }

  async handle(payload: ProcessCsvFileUploadedJobPayload) {
    const parser = new DatabaseLoader(payload.folderPath);
    await parser.run();
  }

  async rescue(payload: ProcessCsvFileUploadedJobPayload) {
    console.error('Abort job', payload);
  }
}
