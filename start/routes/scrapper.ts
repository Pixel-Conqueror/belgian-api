import { API_PREFIX_V1 } from '#constants/api_version';
import { middleware } from '#start/kernel';
import router from '@adonisjs/core/services/router';

const ScrapperController = () =>
  import('#controllers/scrappers/scrapper_controller');

router
  .group(() => {
    router.get('/scrapper/:enterpriseId', [ScrapperController, 'index']);
  })
  .prefix(API_PREFIX_V1)
  .middleware(middleware.auth());
