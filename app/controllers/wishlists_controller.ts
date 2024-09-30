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
    const wishlist = await this.findWishlistsByUserId(auth.user!.id);
    return { wishlist };
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

    await this.createWishlist(userId, enterpriseId);
    await this.scrapperController.getEnterpriseData(enterpriseId);
    const wishlist = await this.findWishlistByEnterpriseId(
      enterpriseId,
      userId
    );

    return {
      wishlist,
      message: 'Wishlist created successfully.',
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

  /**
   * @delete
   * @description Delete a wishlist
   * @paramPath enterpriseId - Enterprise ID
   * @responseBody 200 - <Wishlist[]>
   * @responseHeader 200
   */
  async delete({ request, auth }: HttpContext) {
    const {
      params: { enterpriseId },
    } = await request.validateUsing(wishlistValidator);
    const userId = auth.user!.id.toString();

    const wishlist = await this.findWishlistByEnterpriseId(
      enterpriseId,
      userId
    );
    if (wishlist.length === 0) {
      throw new Error('Wishlist not found.');
    }

    await db.wishlist.delete({
      where: {
        userId,
        id: wishlist[0].id,
      },
    });

    return {
      message: 'Wishlist deleted successfully.',
    };
  }

  private async createWishlist(userId: UserId, enterpriseId: string) {
    const existingWishlist = await this.findWishlistByEnterpriseId(
      enterpriseId,
      userId
    );
    console.log('existingWishlist', existingWishlist);
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
      include: {
        scrappedData: true,
      },
    });
  }

  private findWishlistByEnterpriseId(enterpriseId: string, userId: UserId) {
    return db.wishlist.findMany({
      where: {
        enterpriseId,
        userId: userId.toString(),
      },
      include: {
        scrappedData: true,
      },
    });
  }
}
