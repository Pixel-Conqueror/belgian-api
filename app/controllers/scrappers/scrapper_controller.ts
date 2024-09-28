import CompanyScrapperController from '#controllers/scrappers/company_scrapper_controller';
import KboScrapperController from '#controllers/scrappers/kbo_scrapper_controller';
import { scrappingValidator } from '#validators/scrapping_validator';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';

type ScrapperResult = Record<string, string | undefined>;

@inject()
export default class ScrapperController {
  constructor(
    private companyScrapperController: CompanyScrapperController,
    private kboScrapperController: KboScrapperController
  ) {}

  /**
   * @index
   * @description Get data from enterprise number
   * @paramPath companyNumber - Company number
   * @responseBody 200 - <ScrapperResult>
   * @responseHeader 200
   */
  public async index({ request }: HttpContext) {
    const {
      params: { companyNumber },
    } = await request.validateUsing(scrappingValidator);

    const datas = await Promise.all([
      this.companyScrapperController.getDataFromEnterpriseNumber(companyNumber),
      this.kboScrapperController.getDataFromEnterpriseNumber(companyNumber),
    ]);

    const mergedResults = this.deepMergeResults(...datas);
    return { data: mergedResults };
  }

  private deepMergeResults(...objects: ScrapperResult[]): ScrapperResult {
    const deepCopyObjects = objects.map((object) =>
      JSON.parse(JSON.stringify(object))
    );
    return deepCopyObjects.reduce(
      (merged, current) => ({ ...merged, ...current }),
      {} as ScrapperResult
    );
  }
}
