import db from '#services/db';
import CompanyScrapperController from '#services/scrappers/company_scrapper';
import KboScrapperController from '#services/scrappers/kbo_scrapper';
import { scrappingValidator } from '#validators/scrapping_validator';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';
import { ScrappedData } from '@prisma/client';

type ScrapperResultData = Record<string, string | undefined>;
type ScrapperResult = ScrappedData;

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
    const existingScrappedData =
      await this.findScrappedDataByEnterpriseId(enterpriseId);

    if (existingScrappedData) {
      return existingScrappedData;
    }

    return await this.scrapEnterpriseData(enterpriseId);
  }

  public async scrapEnterpriseData(
    enterpriseId: string
  ): Promise<ScrapperResult> {
    const datas = await Promise.all([
      this.companyScrapperController.getDataFromEnterpriseNumber(enterpriseId),
      this.kboScrapperController.getDataFromEnterpriseNumber(enterpriseId),
    ]);
    const scrappedData = this.deepMergeResults(...datas);
    await db.scrappedData.create({
      data: scrappedData,
    });
    return scrappedData;
  }

  public findScrappedDataByEnterpriseId(
    enterpriseId: string
  ): Promise<ScrapperResult | null> {
    return db.scrappedData.findUnique({
      where: { enterpriseId },
    });
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
