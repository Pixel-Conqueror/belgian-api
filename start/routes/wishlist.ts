import { API_PREFIX_V1 } from '#constants/api_version';
import { middleware } from '#start/kernel';
import router from '@adonisjs/core/services/router';

const WishlistsController = () => import('#controllers/wishlists_controller');

router
  .group(() => {
    router.get('/wishlists', [WishlistsController, 'index']);
    router.post('/wishlist/:enterpriseId', [WishlistsController, 'store']);
    router.delete('/wishlist/:enterpriseId', [WishlistsController, 'delete']);
    router.get('/wishlist/:enterpriseId', [WishlistsController, 'show']);
  })
  .prefix(API_PREFIX_V1)
  .middleware(middleware.auth());
