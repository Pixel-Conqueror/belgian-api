import { API_PREFIX_V1 } from '#constants/api_version';
import { middleware } from '#start/kernel';
import router from '@adonisjs/core/services/router';

const EnterpriseController = () => import('#controllers/enterprise_controller');

router
  .get('/enterprise/:paginate', [EnterpriseController, 'index'])
  .prefix(API_PREFIX_V1)
  .middleware(middleware.auth());
