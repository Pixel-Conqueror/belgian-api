import { API_PREFIX_V1 } from '#constants/api_version';
import { middleware } from '#start/kernel';
import router from '@adonisjs/core/services/router';

const SearchController = () => import('#controllers/search_controller');

router
  .get('/search/:query/:cursor?', [SearchController, 'search'])
  .prefix(API_PREFIX_V1)
  .middleware(middleware.auth());
