import {
  Activity,
  Address,
  Branch,
  Contact,
  Denomination,
  Enterprise,
  Establishment,
} from '@prisma/client';
import db from '#services/db';
import Papa from 'papaparse';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'date-fns';
import { createInterface } from 'node:readline';

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
  private fileLength = 0;
  private progress = 0;
  private upsertMode: boolean;

  constructor(customPath?: string) {
    this.CSV_DIR = customPath
      ? path.isAbsolute(customPath)
        ? customPath
        : path.join(process.cwd(), customPath)
      : path.join(process.cwd(), 'app/services/csvs');
    this.upsertMode = !!customPath;
  }

  private formatDate(dateString: string): Date {
    return parse(dateString, 'dd-MM-yyyy', new Date());
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

      for (const fileName of this.insertionOrder) {
        const filePath = path.join(this.CSV_DIR, fileName);
        if (fs.existsSync(filePath)) {
          console.log(`Processing file: ${fileName}`);

          this.fileLength = await this.getFileLength(filePath);
          this.progress = 0;

          await this.processCSVFileWithModel(filePath, fileName, codeMappings);
          console.log(`Finished processing file: ${fileName}`);
        } else {
          console.warn(
            `File ${fileName} not found in ${this.CSV_DIR}. Skipping...`
          );
        }
      }
      console.log('All files processed successfully.');
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      await db.$disconnect();
    }
  }

  private async processCSVFileWithModel(
    filePath: string,
    fileName: string,
    codeMappings: { [category: string]: { [code: string]: string } }
  ) {
    return new Promise<void>((resolve, reject) => {
      const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
      let header: string[] = [];
      let rows: any[] = [];
      let processedLines = 0;

      Papa.parse(stream, {
        header: true,
        transform: (value) => value.trim(),
        dynamicTyping: false,
        skipEmptyLines: true,
        step: async (results, parser) => {
          if (results.errors.length) {
            console.error('Parsing error:', results.errors);
            parser.abort();
            reject(results.errors);
          }

          if (header.length === 0) {
            header = results.meta.fields || [];
          }

          const row = results.data as { [key: string]: string };
          for (const column of header) {
            const value = row[column];

            if (column === 'NaceVersion') {
              const naceVersionCategory = `Nace${value}`;
              const naceCode = row['NaceCode'];

              if (
                codeMappings[naceVersionCategory] &&
                codeMappings[naceVersionCategory][naceCode]
              ) {
                row['description'] =
                  codeMappings[naceVersionCategory][naceCode];
              }
            } else {
              if (codeMappings[column] && codeMappings[column][value]) {
                row[column] = codeMappings[column][value];
              }
            }
          }

          rows.push(row);
          processedLines++;

          if (rows.length >= this.CHUNK_SIZE) {
            parser.pause();
            try {
              if (this.upsertMode) {
                await this.upsertDataByFileName(fileName, rows);
              } else {
                await this.insertDataByFileName(fileName, rows);
              }
              rows = [];
              parser.resume();
              this.updateProgress(processedLines, this.fileLength, fileName);
            } catch (err) {
              parser.abort();
              reject(err);
            }
          }
        },
        complete: async () => {
          try {
            if (rows.length > 0) {
              if (this.upsertMode) {
                await this.upsertDataByFileName(fileName, rows);
              } else {
                await this.insertDataByFileName(fileName, rows);
              }
            }
            this.updateProgress(processedLines, this.fileLength, fileName);
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  private async insertDataByFileName(fileName: string, rows: any[]) {
    switch (fileName) {
      case 'enterprise.csv':
        await this.insertEnterprises(rows);
        break;

      case 'activity.csv':
        await this.insertActivities(rows);
        break;

      case 'address.csv':
        await this.insertAddresses(rows);
        break;

      case 'branch.csv':
        await this.insertBranches(rows);
        break;

      case 'contact.csv':
        await this.insertContacts(rows);
        break;

      case 'denomination.csv':
        await this.insertDenominations(rows);
        break;

      case 'establishment.csv':
        await this.insertEstablishments(rows);
        break;

      default:
        console.warn(`Unhandled file: ${fileName}`);
    }
  }

  private async upsertDataByFileName(fileName: string, rows: any[]) {
    switch (fileName) {
      case 'enterprise.csv':
        await this.upsertEnterprises(rows);
        break;

      case 'activity.csv':
        await this.upsertActivities(rows);
        break;

      case 'address.csv':
        await this.upsertAddresses(rows);
        break;

      case 'branch.csv':
        await this.upsertBranches(rows);
        break;

      case 'contact.csv':
        await this.upsertContacts(rows);
        break;

      case 'denomination.csv':
        await this.upsertDenominations(rows);
        break;

      case 'establishment.csv':
        await this.upsertEstablishments(rows);
        break;

      default:
        console.warn(`Unhandled file: ${fileName}`);
    }
  }

  private updateProgress(
    processedLines: number,
    fileLength: number,
    fileName: string
  ) {
    const percentage = ((processedLines / fileLength) * 100).toFixed(2);
    console.log(`${fileName}: ${percentage}%`);
  }

  // Insertion Methods (Unchanged)
  private async insertEnterprises(rows: any[]) {
    const enterprises: Omit<Enterprise, 'id'>[] = rows.map((row) => ({
      enterpriseNumber: row['EnterpriseNumber'],
      status: row['Status'],
      juridicalSituation: row['JuridicalSituation'],
      typeOfEnterprise: row['TypeOfEnterprise'],
      juridicalForm: row['JuridicalForm'],
      startDate: row['StartDate']
        ? this.formatDate(row['StartDate'])
        : new Date(),
    }));

    try {
      await db.enterprise.createMany({
        data: enterprises,
      });
    } catch (error) {
      console.error('Error inserting enterprises:', error);
      throw error;
    }
  }

  private async insertActivities(rows: any[]) {
    const activities: Omit<Activity, 'id'>[] = rows.map((row) => ({
      entityNumber: row['EntityNumber'],
      activityGroup: row['ActivityGroup'],
      naceVersion: row['NaceVersion'],
      naceCode: row['NaceCode'],
      description: row['description'],
      classification: row['Classification'],
      uniqueKey: `${row['EntityNumber']}-${row['NaceVersion']}-${'NaceCode'}`,
    }));

    try {
      await db.activity.createMany({
        data: activities,
      });
    } catch (error) {
      console.error('Error inserting activities:', error);
      throw error;
    }
  }

  private async insertAddresses(rows: any[]) {
    const addresses: Omit<Address, 'id'>[] = rows.map((row) => ({
      entityNumber: row['EntityNumber'],
      typeOfAddress: row['TypeOfAddress'],
      zipcode: row['Zipcode'],
      municipalityFR: row['MunicipalityFR'],
      streetFR: row['StreetFR'],
      houseNumber: row['HouseNumber'],
      extraAddressInfo: row['ExtraAddressInfo'] || null,
      uniqueKey: `${row['EntityNumber']}-${row['TypeOfAddress']}`,
    }));

    try {
      await db.address.createMany({
        data: addresses,
      });
    } catch (error) {
      console.error('Error inserting addresses:', error);
      throw error;
    }
  }

  private async insertBranches(rows: any[]) {
    const branches: Omit<Branch, 'id'>[] = rows.map((row) => ({
      branchId: row['Id'],
      startDate: row['StartDate']
        ? this.formatDate(row['StartDate'])
        : new Date(),
      enterpriseNumber: row['EnterpriseNumber'],
      uniqueKey: `${row['Id']}-${row['EnterpriseNumber']}`,
    }));

    try {
      await db.branch.createMany({
        data: branches,
      });
    } catch (error) {
      console.error('Error inserting branches:', error);
      throw error;
    }
  }

  private async insertContacts(rows: any[]) {
    const contacts: Omit<Contact, 'id'>[] = rows.map((row) => ({
      entityNumber: row['EntityNumber'],
      entityContact: row['EntityContact'],
      contactType: row['ContactType'],
      value: row['Value'],
      uniqueKey: `${row['EntityNumber']}-${row['EntityContact']}`,
    }));

    try {
      await db.contact.createMany({
        data: contacts,
      });
    } catch (error) {
      console.error('Error inserting contacts:', error);
      throw error;
    }
  }

  private async insertDenominations(rows: any[]) {
    const denominations: Omit<Denomination, 'id'>[] = rows.map((row) => ({
      entityNumber: row['EntityNumber'],
      typeOfDenomination: row['TypeOfDenomination'],
      denomination: row['Denomination'],
      uniqueKey: `${row['EntityNumber']}-${row['TypeOfDenomination']}`,
    }));

    try {
      await db.denomination.createMany({
        data: denominations,
      });
    } catch (error) {
      console.error('Error inserting denominations:', error);
      throw error;
    }
  }

  private async insertEstablishments(rows: any[]) {
    const establishments: Omit<Establishment, 'id'>[] = rows.map((row) => ({
      establishmentNumber: row['EstablishmentNumber'],
      startDate: row['StartDate']
        ? this.formatDate(row['StartDate'])
        : new Date(),
      enterpriseNumber: row['EnterpriseNumber'],
      uniqueKey: `${row['Establishment']}-${row['EnterpriseNumber']}`,
    }));

    try {
      await db.establishment.createMany({
        data: establishments,
      });
    } catch (error) {
      console.error('Error inserting establishments:', error);
      throw error;
    }
  }

  // Upsert Methods
  private async upsertEnterprises(rows: any[]) {
    for (const row of rows) {
      const data: Omit<Enterprise, 'id'> = {
        enterpriseNumber: row['EnterpriseNumber'],
        status: row['Status'],
        juridicalSituation: row['JuridicalSituation'],
        typeOfEnterprise: row['TypeOfEnterprise'],
        juridicalForm: row['JuridicalForm'],
        startDate: row['StartDate']
          ? this.formatDate(row['StartDate'])
          : new Date(),
      };

      try {
        await db.enterprise.upsert({
          where: { enterpriseNumber: data.enterpriseNumber },
          update: data,
          create: data,
        });
      } catch (error) {
        console.error('Error upserting enterprise:', error);
        throw error;
      }
    }
  }

  private async upsertActivities(rows: any[]) {
    for (const row of rows) {
      const data: Omit<Activity, 'id'> = {
        entityNumber: row['EntityNumber'],
        activityGroup: row['ActivityGroup'],
        naceVersion: row['NaceVersion'],
        naceCode: row['NaceCode'],
        description: row['description'],
        classification: row['Classification'],
        uniqueKey: `${row['EntityNumber']}-${row['NaceVersion']}-${'NaceCode'}`,
      };

      try {
        await db.activity.upsert({
          where: {
            uniqueKey: data.uniqueKey,
          },
          update: data,
          create: data,
        });
      } catch (error) {
        console.error('Error upserting activity:', error);
        throw error;
      }
    }
  }

  private async upsertAddresses(rows: any[]) {
    for (const row of rows) {
      const data: Omit<Address, 'id'> = {
        entityNumber: row['EntityNumber'],
        typeOfAddress: row['TypeOfAddress'],
        zipcode: row['Zipcode'],
        municipalityFR: row['MunicipalityFR'],
        streetFR: row['StreetFR'],
        houseNumber: row['HouseNumber'],
        extraAddressInfo: row['ExtraAddressInfo'] || null,
        uniqueKey: `${row['EntityNumber']}-${row['TypeOfAddress']}`,
      };

      try {
        await db.address.upsert({
          where: {
            uniqueKey: data.uniqueKey,
          },
          update: data,
          create: data,
        });
      } catch (error) {
        console.error('Error upserting address:', error);
        throw error;
      }
    }
  }

  private async upsertBranches(rows: any[]) {
    for (const row of rows) {
      const data: Omit<Branch, 'id'> = {
        branchId: row['Id'],
        startDate: row['StartDate']
          ? this.formatDate(row['StartDate'])
          : new Date(),
        enterpriseNumber: row['EnterpriseNumber'],
        uniqueKey: `${row['Id']}-${row['EnterpriseNumber']}`,
      };

      try {
        await db.branch.upsert({
          where: {
            uniqueKey: data.uniqueKey,
          },
          update: data,
          create: data,
        });
      } catch (error) {
        console.error('Error upserting branch:', error);
        throw error;
      }
    }
  }

  private async upsertContacts(rows: any[]) {
    for (const row of rows) {
      const data: Omit<Contact, 'id'> = {
        entityNumber: row['EntityNumber'],
        entityContact: row['EntityContact'],
        contactType: row['ContactType'],
        value: row['Value'],
        uniqueKey: `${row['EntityNumber']}-${row['EntityContact']}`,
      };

      try {
        await db.contact.upsert({
          where: {
            uniqueKey: data.uniqueKey,
          },
          update: data,
          create: data,
        });
      } catch (error) {
        console.error('Error upserting contact:', error);
        throw error;
      }
    }
  }

  private async upsertDenominations(rows: any[]) {
    for (const row of rows) {
      const data: Omit<Denomination, 'id'> = {
        entityNumber: row['EntityNumber'],
        typeOfDenomination: row['TypeOfDenomination'],
        denomination: row['Denomination'],
        uniqueKey: `${row['EntityNumber']}-${row['TypeOfDenomination']}`,
      };

      try {
        await db.denomination.upsert({
          where: {
            uniqueKey: data.uniqueKey,
          },
          update: data,
          create: data,
        });
      } catch (error) {
        console.error('Error upserting denomination:', error);
        throw error;
      }
    }
  }

  private async upsertEstablishments(rows: any[]) {
    for (const row of rows) {
      const data: Omit<Establishment, 'id'> = {
        establishmentNumber: row['EstablishmentNumber'],
        startDate: row['StartDate']
          ? this.formatDate(row['StartDate'])
          : new Date(),
        enterpriseNumber: row['EnterpriseNumber'],
        uniqueKey: `${row['Establishment']}-${row['EnterpriseNumber']}`,
      };

      try {
        await db.establishment.upsert({
          where: { uniqueKey: data.uniqueKey },
          update: data,
          create: data,
        });
      } catch (error) {
        console.error('Error upserting establishment:', error);
        throw error;
      }
    }
  }
}
