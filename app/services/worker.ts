import { parentPort, workerData } from 'node:worker_threads';
import fs from 'node:fs';
import Papa from 'papaparse';
import db from '#services/db';
import { parse } from 'date-fns';

const { filePath, fileName, fileLength, codeMappings, upsertMode, chunkSize } =
  workerData;

const formatDate = (dateString: string): Date => {
  return parse(dateString, 'dd-MM-yyyy', new Date());
};

const processCSVFile = () => {
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
              row['description'] = codeMappings[naceVersionCategory][naceCode];
            }
          } else {
            if (codeMappings[column] && codeMappings[column][value]) {
              row[column] = codeMappings[column][value];
            }
          }
        }

        rows.push(row);
        processedLines++;
        console.log(
          `${fileName} Processed lines: ${processedLines}/${fileLength}`
        );

        if (rows.length >= chunkSize) {
          parser.pause();
          try {
            if (upsertMode) {
              await upsertDataByFileName(fileName, rows);
            } else {
              await insertDataByFileName(fileName, rows);
            }
            rows = [];
            parser.resume();
          } catch (err) {
            parser.abort();
            reject(err);
          }
        }
      },
      complete: async () => {
        try {
          if (rows.length > 0) {
            if (upsertMode) {
              await upsertDataByFileName(fileName, rows);
            } else {
              await insertDataByFileName(fileName, rows);
            }
          }
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
};

// eslint-disable-next-line @typescript-eslint/no-shadow
const insertDataByFileName = async (fileName: string, rows: any[]) => {
  switch (fileName) {
    case 'enterprise.csv':
      await insertEnterprises(rows);
      break;
    case 'activity.csv':
      await insertActivities(rows);
      break;
    case 'address.csv':
      await insertAddresses(rows);
      break;
    case 'branch.csv':
      await insertBranches(rows);
      break;
    case 'contact.csv':
      await insertContacts(rows);
      break;
    case 'denomination.csv':
      await insertDenominations(rows);
      break;
    case 'establishment.csv':
      await insertEstablishments(rows);
      break;
    default:
      console.warn(`Unhandled file: ${fileName}`);
  }
};

// Upsert data based on file name
// eslint-disable-next-line @typescript-eslint/no-shadow
const upsertDataByFileName = async (fileName: string, rows: any[]) => {
  switch (fileName) {
    case 'enterprise.csv':
      await upsertEnterprises(rows);
      break;
    case 'activity.csv':
      await upsertActivities(rows);
      break;
    case 'address.csv':
      await upsertAddresses(rows);
      break;
    case 'branch.csv':
      await upsertBranches(rows);
      break;
    case 'contact.csv':
      await upsertContacts(rows);
      break;
    case 'denomination.csv':
      await upsertDenominations(rows);
      break;
    case 'establishment.csv':
      await upsertEstablishments(rows);
      break;
    default:
      console.warn(`Unhandled file: ${fileName}`);
  }
};

// Insert enterprises
const insertEnterprises = async (rows: any[]) => {
  const enterprises = rows.map((row) => ({
    enterpriseNumber: row['EnterpriseNumber'],
    status: row['Status'],
    juridicalSituation: row['JuridicalSituation'],
    typeOfEnterprise: row['TypeOfEnterprise'],
    juridicalForm: row['JuridicalForm'],
    startDate: row['StartDate'] ? formatDate(row['StartDate']) : new Date(),
  }));
  await db.enterprise.createMany({ data: enterprises });
};

// Insert activities
const insertActivities = async (rows: any[]) => {
  const activities = rows.map((row) => ({
    entityNumber: row['EntityNumber'],
    activityGroup: row['ActivityGroup'],
    naceVersion: row['NaceVersion'],
    naceCode: row['NaceCode'],
    description: row['description'] || 'No description available',
    classification: row['Classification'],
    uniqueKey: `${row['EntityNumber']}-${row['NaceVersion']}-${row['NaceCode']}`,
  }));
  await db.activity.createMany({ data: activities });
};

// Insert addresses
const insertAddresses = async (rows: any[]) => {
  const addresses = rows.map((row) => ({
    entityNumber: row['EntityNumber'],
    typeOfAddress: row['TypeOfAddress'],
    zipcode: row['Zipcode'],
    municipalityFR: row['MunicipalityFR'],
    streetFR: row['StreetFR'],
    houseNumber: row['HouseNumber'],
    extraAddressInfo: row['ExtraAddressInfo'] || null,
    uniqueKey: `${row['EntityNumber']}-${row['TypeOfAddress']}`,
  }));
  await db.address.createMany({ data: addresses });
};

// Insert branches
const insertBranches = async (rows: any[]) => {
  const branches = rows.map((row) => ({
    branchId: row['Id'],
    startDate: row['StartDate'] ? formatDate(row['StartDate']) : new Date(),
    enterpriseNumber: row['EnterpriseNumber'],
    uniqueKey: `${row['Id']}-${row['EnterpriseNumber']}`,
  }));
  await db.branch.createMany({ data: branches });
};

// Insert contacts
const insertContacts = async (rows: any[]) => {
  const contacts = rows.map((row) => ({
    entityNumber: row['EntityNumber'],
    entityContact: row['EntityContact'],
    contactType: row['ContactType'],
    value: row['Value'],
    uniqueKey: `${row['EntityNumber']}-${row['ContactType']}-${row['Value']}`,
  }));
  await db.contact.createMany({ data: contacts });
};

// Insert denominations
const insertDenominations = async (rows: any[]) => {
  const denominations = rows.map((row) => ({
    entityNumber: row['EntityNumber'],
    typeOfDenomination: row['TypeOfDenomination'],
    denomination: row['Denomination'],
    uniqueKey: `${row['EntityNumber']}-${row['TypeOfDenomination']}-${row['Denomination']}`,
  }));
  await db.denomination.createMany({ data: denominations });
};

// Insert establishments
const insertEstablishments = async (rows: any[]) => {
  const establishments = rows.map((row) => ({
    establishmentNumber: row['EstablishmentNumber'],
    startDate: row['StartDate'] ? formatDate(row['StartDate']) : new Date(),
    enterpriseNumber: row['EnterpriseNumber'],
    uniqueKey: `${row['EstablishmentNumber']}-${row['EnterpriseNumber']}`,
  }));
  await db.establishment.createMany({ data: establishments });
};

// Upsert enterprises
const upsertEnterprises = async (rows: any[]) => {
  for (const row of rows) {
    const enterprise = {
      enterpriseNumber: row['EnterpriseNumber'],
      status: row['Status'],
      juridicalSituation: row['JuridicalSituation'],
      typeOfEnterprise: row['TypeOfEnterprise'],
      juridicalForm: row['JuridicalForm'],
      startDate: row['StartDate'] ? formatDate(row['StartDate']) : new Date(),
    };
    await db.enterprise.upsert({
      where: { enterpriseNumber: enterprise.enterpriseNumber },
      update: enterprise,
      create: enterprise,
    });
  }
};

// Upsert activities
const upsertActivities = async (rows: any[]) => {
  for (const row of rows) {
    const activity = {
      entityNumber: row['EntityNumber'],
      activityGroup: row['ActivityGroup'],
      naceVersion: row['NaceVersion'],
      naceCode: row['NaceCode'],
      description: row['description'] || 'No description available',
      classification: row['Classification'],
      uniqueKey: `${row['EntityNumber']}-${row['NaceVersion']}-${row['NaceCode']}`,
    };
    await db.activity.upsert({
      where: { uniqueKey: activity.uniqueKey },
      update: activity,
      create: activity,
    });
  }
};

// Upsert addresses
const upsertAddresses = async (rows: any[]) => {
  for (const row of rows) {
    const address = {
      entityNumber: row['EntityNumber'],
      typeOfAddress: row['TypeOfAddress'],
      zipcode: row['Zipcode'],
      municipalityFR: row['MunicipalityFR'],
      streetFR: row['StreetFR'],
      houseNumber: row['HouseNumber'],
      extraAddressInfo: row['ExtraAddressInfo'] || null,
      uniqueKey: `${row['EntityNumber']}-${row['TypeOfAddress']}`,
    };
    await db.address.upsert({
      where: { uniqueKey: address.uniqueKey },
      update: address,
      create: address,
    });
  }
};

// Upsert branches
const upsertBranches = async (rows: any[]) => {
  for (const row of rows) {
    const branch = {
      branchId: row['Id'],
      startDate: row['StartDate'] ? formatDate(row['StartDate']) : new Date(),
      enterpriseNumber: row['EnterpriseNumber'],
      uniqueKey: `${row['Id']}-${row['EnterpriseNumber']}`,
    };
    await db.branch.upsert({
      where: { uniqueKey: branch.uniqueKey },
      update: branch,
      create: branch,
    });
  }
};

// Upsert contacts
const upsertContacts = async (rows: any[]) => {
  for (const row of rows) {
    const contact = {
      entityNumber: row['EntityNumber'],
      entityContact: row['EntityContact'],
      contactType: row['ContactType'],
      value: row['Value'],
      uniqueKey: `${row['EntityNumber']}-${row['ContactType']}-${row['Value']}`,
    };
    await db.contact.upsert({
      where: { uniqueKey: contact.uniqueKey },
      update: contact,
      create: contact,
    });
  }
};

// Upsert denominations
const upsertDenominations = async (rows: any[]) => {
  for (const row of rows) {
    const denomination = {
      entityNumber: row['EntityNumber'],
      typeOfDenomination: row['TypeOfDenomination'],
      denomination: row['Denomination'],
      uniqueKey: `${row['EntityNumber']}-${row['TypeOfDenomination']}-${row['Denomination']}`,
    };
    await db.denomination.upsert({
      where: { uniqueKey: denomination.uniqueKey },
      update: denomination,
      create: denomination,
    });
  }
};

// Upsert establishments
const upsertEstablishments = async (rows: any[]) => {
  for (const row of rows) {
    const establishment = {
      establishmentNumber: row['EstablishmentNumber'],
      startDate: row['StartDate'] ? formatDate(row['StartDate']) : new Date(),
      enterpriseNumber: row['EnterpriseNumber'],
      uniqueKey: `${row['EstablishmentNumber']}-${row['EnterpriseNumber']}`,
    };
    await db.establishment.upsert({
      where: { uniqueKey: establishment.uniqueKey },
      update: establishment,
      create: establishment,
    });
  }
};

// Exécution principale du Worker
processCSVFile()
  .then(() => {
    parentPort?.postMessage('done');
  })
  .catch((err) => {
    console.error('Worker encountered an error:', err);
  });
