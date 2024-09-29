import { HttpContext } from '@adonisjs/core/http';
import db from '#services/db';

export default class SearchController {
  /**
   * @search
   * @search datas matching custom request
   * @params query - value to search
   * @responseBody 200 - <Enterprise>[]
   * @responseHeader 200
   */
  search = async ({ params, response }: HttpContext) => {
    const searchString = params.query;
    const cursor = params.cursor || null;
    const isEnterpriseFormat =
      /^[0-9]{10}$|^[0-9]{4}\.[0-9]{3}\.[0-9]{3}$/.test(
        searchString.replace(/\./g, '')
      );

    const zipcodeFormat = /^(?:[0-9]{2}|[0-9]{4})$/.test(searchString);

    if (isEnterpriseFormat) {
      const data = await this.searchByEnterpriseNumber(searchString);
      return response.json(data);
    } else if (zipcodeFormat) {
      const data = await this.searchByPostalCode(searchString, cursor);
      return response.json(data);
    } else {
      const data = await this.searchByDenomination(searchString, cursor);
      return response.json(data);
    }
  };

  private searchByEnterpriseNumber = async (enterpriseNumber: string) => {
    const enterprise = await db.enterprise.findUnique({
      where: {
        enterpriseNumber: enterpriseNumber,
      },
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
    });

    if (enterprise) {
      return { status: 200, data: enterprise };
    } else {
      return {
        error: 404,
        message: 'Aucune entreprise trouvée avec ce numéro.',
      };
    }
  };

  private searchByDenomination = async (
    searchString: string,
    cursor: string | null
  ) => {
    const take = 10;

    const denominations = await db.denomination.findMany({
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { uniqueKey: decodeURI(cursor) } : undefined,
      where: {
        denomination: {
          contains: searchString,
          mode: 'insensitive',
        },
      },
      include: {
        enterprise: {
          include: {
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
        },
      },
      orderBy: {
        uniqueKey: 'asc',
      },
    });

    const nextCursor =
      denominations.length === take
        ? encodeURI(denominations[denominations.length - 1].uniqueKey)
        : null;

    return {
      data: denominations,
      nextCursor,
    };
  };

  private searchByPostalCode = async (
    postalCode: string,
    cursor: string | null
  ) => {
    const take = 10;

    const addresses = await db.address.findMany({
      where: {
        zipcode:
          postalCode.length === 4
            ? { equals: postalCode }
            : { startsWith: postalCode },
      },
      include: {
        enterprise: {
          include: {
            denominations: true,
          },
        },
      },
      orderBy: {
        uniqueKey: 'asc',
      },
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { uniqueKey: decodeURI(cursor) } : undefined,
    });

    if (addresses.length === 0) {
      return {
        message: 'Aucune adresse trouvée avec ce code postal.',
        data: [],
      };
    }

    const nextCursor =
      addresses.length === take
        ? encodeURI(addresses[addresses.length - 1].uniqueKey)
        : null;

    return {
      data: addresses,
      nextCursor,
    };
  };
}
