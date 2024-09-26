import { API_PREFIX_V1 } from '#constants/api_version';
import { middleware } from '#start/kernel';
import router from '@adonisjs/core/services/router';

const ScrappingController = () => import('#controllers/scrapping_controller');

router
  .get('/scrapping/:Number', [ScrappingController, 'index'])
  .prefix(API_PREFIX_V1)
//   .middleware(middleware.auth());
