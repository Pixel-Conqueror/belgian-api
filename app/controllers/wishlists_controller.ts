import ScrapperController from '#controllers/scrapper_controller';
import User from '#models/user';
import db from '#services/db';
import { wishlistValidator } from '#validators/wishlist_validator';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';

type UserId = User['id'] | string;

@inject()
export default class WishlistsController {
  constructor(private scrapperController: ScrapperController) {}

  /**
   * @index
   * @description Display a list of wishlists for the authenticated user
   * @responseBody 200 - <Wishlist[]>
   * @responseHeader 200
   */
  async index({ auth }: HttpContext) {
    const wishlists = await this.findWishlistsByUserId(auth.user!.id);
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

    const wishlist = await this.createWishlist(userId, enterpriseId);
    const scrappedData =
      await this.scrapperController.getEnterpriseData(enterpriseId);

    return {
      scrappedData,
      wishlist,
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

  private async createWishlist(userId: UserId, enterpriseId: string) {
    const existingWishlist = await this.findWishlistByEnterpriseId(
      enterpriseId,
      userId
    );
    if (existingWishlist.length > 0) {
      throw new Error('This enterprise is already in your wishlist.');
    }

    return db.wishlist.create({
      data: {
        userId: userId.toString(),
        enterpriseId,
      },
    });
  }

  private findWishlistsByUserId(userId: UserId) {
    return db.wishlist.findMany({
      where: {
        userId: userId.toString(),
      },
    });
  }

  private findWishlistByEnterpriseId(enterpriseId: string, userId: UserId) {
    return db.wishlist.findMany({
      where: {
        enterpriseId,
        userId: userId.toString(),
      },
    });
  }
}
