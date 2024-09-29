import { CheerioAPI } from 'cheerio';
import BaseScrapper from './base_scrapper.js';

const COMPANY_BASE_URL = 'https://www.companyweb.be/fr/';

export default class CompanyScrapperController extends BaseScrapper {
  baseUrl: string = COMPANY_BASE_URL;

  async getDataFromEnterpriseNumber(enterpriseId: string) {
    const data = await this.fetchAndParse(enterpriseId);
    return {
      enterpriseId,
      address: this.getAddress(data),
      creationDate: this.getCreationDate(data),
      mainActivity: this.getMainActivity(data),
    };
  }

  private getAddress($: CheerioAPI) {
    return $('div:contains("Adresse")').next().text().replace(/\s\s+/g, ' ');
  }

  private getCreationDate($: CheerioAPI) {
    const creationDate = this.getDataFromLabel($, 'Création');
    return creationDate.match(/\d{2}-\d{2}-\d{4}/)
      ? creationDate.match(/\d{2}-\d{2}-\d{4}/)?.at(0)
      : creationDate;
  }

  private getMainActivity($: CheerioAPI) {
    return this.getDataFromLabel($, 'Activité principale');
  }
}
