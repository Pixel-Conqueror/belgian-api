import { CheerioAPI } from 'cheerio';
import BaseScrapper from './base_scrapper.js';

const KBO_BASE_URL =
  'https://kbopub.economie.fgov.be/kbopub/toonondernemingps.html?lang=fr&ondernemingsnummer=';

export default class KboScrapperService extends BaseScrapper {
  baseUrl: string = KBO_BASE_URL;

  async getDataFromEnterpriseNumber(enterpriseId: string) {
    const data = await this.fetchAndParse(enterpriseId);
    return {
      enterpriseId,
      legalStatus: this.getLegalStatus(data),
      legalSituation: this.getLegalSituation(data),
      startDate: this.getStartDate(data),
      companyName: this.getCompanyName(data),
      phoneNumber: this.getPhoneNumber(data),
      legalForm: this.getLegalForm(data),
    };
  }

  private getLegalStatus($: CheerioAPI) {
    return this.getDataFromSelector($, '#table td:contains("Statut")');
  }

  private getLegalSituation($: CheerioAPI) {
    const legalSitation = this.getDataFromSelector(
      $,
      '#table td:contains("Situation juridique")'
    );
    return legalSitation.replace(/Depuis/, ' Depuis').trim();
  }

  private getStartDate($: CheerioAPI) {
    return this.getDataFromSelector($, '#table td:contains("Date de début")');
  }

  private getCompanyName($: CheerioAPI) {
    const companyName = this.getDataFromSelector(
      $,
      '#table td:contains("Dénomination")'
    );
    return companyName.trim().split('Dénomination')[0].trim();
  }

  private getPhoneNumber($: CheerioAPI) {
    return this.getDataFromSelector(
      $,
      '#table td:contains("Numéro de téléphone")'
    );
  }

  private getLegalForm($: CheerioAPI) {
    const legalForm = this.getDataFromSelector(
      $,
      '#table td:contains("Date de début")'
    );
    return legalForm
      .replace(/\n|\t/g, '')
      .replace(/Depuis/, ' Depuis')
      .trim();
  }
}
