import { API_PREFIX_V1 } from '#constants/api_version';
import { middleware } from '#start/kernel';
import router from '@adonisjs/core/services/router';

const EnterpriseController = () => import('#controllers/enterprise_controller');

router
  .group(() => {
    router.get('/enterprise/:cursor?', [EnterpriseController, 'index']);
    router.get('/enterprise/find/:id', [EnterpriseController, 'getEnterprise']);
  })
  .prefix(API_PREFIX_V1)
  .middleware(middleware.auth());
