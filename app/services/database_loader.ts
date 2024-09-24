import { Worker } from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import { createInterface } from 'node:readline';
import db from '#services/db';

export class DatabaseLoader {
  private CHUNK_SIZE = 1000;
  private CSV_DIR: string;
  private insertionOrder = [
    'enterprise.csv',
    'activity.csv',
    'address.csv',
    'branch.csv',
    'contact.csv',
    'denomination.csv',
    'establishment.csv',
  ];
  private upsertMode: boolean;

  constructor(customPath?: string) {
    this.CSV_DIR = customPath
      ? path.isAbsolute(customPath)
        ? customPath
        : path.join(process.cwd(), customPath)
      : path.join(process.cwd(), 'app/services/csvs');
    this.upsertMode = !!customPath;
  }

  private async getFileLength(filePath: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      let lineCount = 0;

      const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
      const rl = createInterface({
        input: readStream,
        crlfDelay: Infinity,
      });

      rl.on('line', () => {
        lineCount++;
      });

      rl.on('close', () => {
        resolve(lineCount);
      });

      rl.on('error', (error: any) => {
        reject(error);
      });
    });
  }

  private async loadCodeMappings(
    filePath: string
  ): Promise<{ [category: string]: { [code: string]: string } }> {
    const codeMappings: { [category: string]: { [code: string]: string } } = {};

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });

      Papa.parse(stream, {
        header: true,
        transform: (value) => value.trim(),
        dynamicTyping: false,
        skipEmptyLines: true,
        step: (results) => {
          const { Category, Code, Description } = results.data as {
            Category: string;
            Code: string;
            Description: string;
          };
          if (Category && Code && Description) {
            if (!codeMappings[Category]) {
              codeMappings[Category] = {};
            }
            codeMappings[Category][Code] = Description;
          }
        },
        complete: () => resolve(codeMappings),
        error: (err) => reject(err),
      });
    });
  }

  public async run() {
    try {
      const codeMappings = await this.loadCodeMappings(
        path.join(this.CSV_DIR, 'cleaned-codes.csv')
      );

      const processingPromises = [];

      for (const fileName of this.insertionOrder) {
        const filePath = path.join(this.CSV_DIR, fileName);
        if (fs.existsSync(filePath)) {
          console.log(`Processing file: ${fileName}`);

          const fileLength = await this.getFileLength(filePath);

          // Ajoutez la promesse de traitement au tableau
          processingPromises.push(
            this.processFileInWorker(
              filePath,
              fileName,
              fileLength,
              codeMappings
            )
          );
        } else {
          console.warn(
            `File ${fileName} not found in ${this.CSV_DIR}. Skipping...`
          );
        }
      }

      // Exécuter toutes les promesses en parallèle
      await Promise.all(processingPromises);

      console.log('All files processed successfully.');
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      await db.$disconnect();
    }
  }

  private async processFileInWorker(
    filePath: string,
    fileName: string,
    fileLength: number,
    codeMappings: { [category: string]: { [code: string]: string } }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        path.join(import.meta.dirname, '../../build/app/services/worker.js'),
        {
          workerData: {
            filePath,
            fileName,
            fileLength,
            codeMappings,
            upsertMode: this.upsertMode,
            chunkSize: this.CHUNK_SIZE,
          },
        }
      );

      worker.on('message', (message) => {
        if (message === 'done') {
          resolve();
        }
      });

      worker.on('error', (error) => {
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }
}
