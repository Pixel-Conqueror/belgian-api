import db from '#services/db';
import { HttpContext } from '@adonisjs/core/http';

export default class EnterpriseController {
  /**
   * @index
   * @description Get paginated enterprises dataset
   * @paramPath cursor - cursor for pagination
   * @responseBody 200 - <Enterprise>
   * @responseHeader 200
   */
  index = async ({ params }: HttpContext) => {
    const cursor = params.cursor || null;
    const take = 10;

    const enterprises = await db.enterprise.findMany({
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { enterpriseNumber: cursor } : undefined,
      include: {
        denominations: {
          select: {
            denomination: true,
            typeOfDenomination: true,
          },
        },
        addresses: {
          select: {
            streetFR: true,
            houseNumber: true,
            zipcode: true,
            municipalityFR: true,
            extraAddressInfo: true,
          },
        },
      },
      orderBy: {
        enterpriseNumber: 'asc',
      },
    });

    const nextCursor =
      enterprises.length === take
        ? enterprises[enterprises.length - 1].enterpriseNumber
        : null;

    return {
      data: enterprises,
      nextCursor,
    };
  };

  /**
   * @getEnterprise
   * @description Get enterprise by its number with related data
   * @params enterpriseNumber - number of the enterprise
   * @responseBody 200 - <Enterprise>
   * @responseHeader 200
   */
  getEnterprise = async ({ params }: HttpContext) => {
    const enterpriseNumber = params.id;
    console.log('enterpriseNumber', enterpriseNumber);

    const enterprise = await db.enterprise.findUnique({
      where: { enterpriseNumber },
      include: {
        activities: {},
        addresses: {},
        contacts: {},
        denominations: {},
        branches: {},
        establishments: {},
      },
    });

    if (!enterprise) {
      return { message: 'Enterprise not found', status: 404 };
    }

    return {
      data: enterprise,
    };
  };
}
