import * as cheerio from 'cheerio';

export type ScrapperResult = Record<string, string | undefined>;
export type EnterpriseId = string;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3';

export default abstract class BaseScrapper {
  private userAgent: string = USER_AGENT;
  abstract baseUrl: string;

  async fetchAndParse(enterpriseId: EnterpriseId) {
    const request = await fetch(this.buildUrl(enterpriseId), {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!request.ok) {
      throw new Error('Failed to fetch data');
    }

    return cheerio.load(await request.text());
  }

  getDataFromSelector($: cheerio.CheerioAPI, selector: string) {
    return $(selector).next().text().trim();
  }

  getDataFromLabel($: cheerio.CheerioAPI, selector: string) {
    return $(`div:contains("${selector}")`)
      .next()
      .text()
      .replace(/Essayer gratuitement\s+/, '')
      .trim();
  }

  abstract getDataFromEnterpriseNumber(
    enterpriseId: EnterpriseId
  ): Promise<ScrapperResult>;

  private buildUrl(enterpriseId: EnterpriseId) {
    return `${this.baseUrl}${enterpriseId}`;
  }
}
