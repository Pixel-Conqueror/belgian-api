import ScrapperController from '#controllers/scrappers/scrapper_controller';
import db from '#services/db';
import { wishlistValidator } from '#validators/wishlist_validator';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class WishlistsController {
  constructor(private scrapperController: ScrapperController) {}

  /**
   * @index
   * @description Display a list of wishlists
   * @responseBody 200 - <Wishlist[]>
   * @responseHeader 200
   */
  async index({ auth }: HttpContext) {
    const wishlists = await db.wishlist.findMany({
      where: {
        userId: auth.user!.id.toString(),
      },
      include: {
        scrappedDatas: true,
      },
    });

    return wishlists;
  }

  /**
   * @store
   * @description Create a new wishlist and scrap related data
   * @paramPath enterpriseId - Enterprise ID
   * @responseBody 200 - <ScrappedData[]>
   * @responseHeader 200
   */
  async store({ request, auth }: HttpContext) {
    const {
      params: { enterpriseId },
    } = await request.validateUsing(wishlistValidator);
    const userId = auth.user!.id.toString();

    const existingWishlist = await db.wishlist.findUnique({
      where: {
        id: '',
        enterpriseId,
        userId,
      },
    });

    if (existingWishlist) {
      throw new Error('This enterprise is already in your wishlist.');
    }

    await db.wishlist.create({
      data: {
        userId,
        enterpriseId,
      },
    });

    const scrappedData =
      await this.scrapperController.getEnterpriseData(enterpriseId);

    if (scrappedData) {
      const existingScrapperData = await db.scrappedData.findUnique({
        where: { enterpriseId },
      });

      if (!existingScrapperData) {
        await db.scrappedData.create({
          data: scrappedData,
        });
      }
    }

    return {
      scrappedData,
    };
  }

  /**
   * @index
   * @description Show scrapped data for a specific enterprise
   * @paramPath enterpriseId - Enterprise ID
   * @responseBody 200 - <ScrappedData[]>
   * @responseHeader 200
   */
  async show({ request }: HttpContext) {
    const {
      params: { enterpriseId },
    } = await request.validateUsing(wishlistValidator);

    const scrappedData = await db.scrappedData.findUnique({
      where: { enterpriseId },
      include: {},
    });

    if (!scrappedData) {
      throw new Error('Scrapped data not found for this enterprise.');
    }

    return scrappedData;
  }
}
