import db from '#services/db';
import { HttpContext } from '@adonisjs/core/http';

export default class EnterpriseController {
  /**
   * @index
   * @description Get paginated enterprises dataset
   * @params paginate - Pagination options
   * @responseBody 200 - <Enterprise>
   * @responseHeader 200
   */
  index = async ({ params }: HttpContext) => {
    const paginate = params.paginate;
    const take = 10;
    const skip = paginate * take;

    const enterprises = await db.enterprise.aggregateRaw({
      pipeline: [
        {
          $lookup: {
            from: 'denomination',
            localField: 'enterpriseNumber',
            foreignField: 'entityNumber',
            as: 'denominations',
          },
        },
        {
          $lookup: {
            from: 'activity',
            localField: 'enterpriseNumber',
            foreignField: 'entityNumber',
            as: 'activities',
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: take,
        },
      ],
    });

    return {
      enterprises,
    };
  };
}
