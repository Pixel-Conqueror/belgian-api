import User from '#models/user';
import { Job } from '@rlanz/bull-queue';

interface ProcessCsvFileUploadedJobPayload {
  userId: User['id'];
  fileName: string;
}

export default class ProcessCsvFileUploadedJob extends Job {
  // This is the path to the file that is used to create the job
  static get $$filepath() {
    return import.meta.url;
  }

  /**
   * Base Entry point
   */
  async handle(payload: ProcessCsvFileUploadedJobPayload) {
    console.log('job', payload);
  }

  /**
   * This is an optional method that gets called when the retries has exceeded and is marked failed.
   */
  async rescue(payload: ProcessCsvFileUploadedJobPayload) {}
}
