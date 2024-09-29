import CompanyScrapperController from '#controllers/scrappers/company_scrapper_controller';
import KboScrapperController from '#controllers/scrappers/kbo_scrapper_controller';
import { scrappingValidator } from '#validators/scrapping_validator';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';
import { ScrapperData } from '@prisma/client';

type ScrapperResultData = Record<string, string | undefined>;
type ScrapperResult = ScrapperData;

@inject()
export default class ScrapperController {
  constructor(
    private companyScrapperController: CompanyScrapperController,
    private kboScrapperController: KboScrapperController
  ) {}

  /**
   * @index
   * @description Get data from enterprise id
   * @paramPath enterpriseId - Enterprise id
   * @responseBody 200 - <ScrapperResult>
   * @responseHeader 200
   */
  public async index({ request }: HttpContext) {
    const {
      params: { enterpriseId },
    } = await request.validateUsing(scrappingValidator);
    return this.getEnterpriseData(enterpriseId);
  }

  public async getEnterpriseData(
    enterpriseId: string
  ): Promise<ScrapperResult> {
    const datas = await Promise.all([
      this.companyScrapperController.getDataFromEnterpriseNumber(enterpriseId),
      this.kboScrapperController.getDataFromEnterpriseNumber(enterpriseId),
    ]);

    return this.deepMergeResults(...datas);
  }

  private deepMergeResults(...objects: ScrapperResultData[]): ScrapperResult {
    const deepCopyObjects = objects.map((object) =>
      JSON.parse(JSON.stringify(object))
    );
    return deepCopyObjects.reduce(
      (merged, current) => ({ ...merged, ...current }),
      {} as ScrapperResult
    );
  }
}
