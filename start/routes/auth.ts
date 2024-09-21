import { API_PREFIX_V1 } from '#constants/api_version';
import { middleware } from '#start/kernel';
import router from '@adonisjs/core/services/router';

const LoginController = () => import('#controllers/login_controller');
const SigninsController = () => import('#controllers/signins_controller');
const LogoutsController = () => import('#controllers/logouts_controller');

router
  .group(() => {
    router
      .group(() => {
        router.post('login', [LoginController, 'handle']);
        router.post('signin', [SigninsController, 'handle']);
      })
      .middleware(middleware.guest());

    router
      .post('logout', [LogoutsController, 'handle'])
      .middleware(middleware.auth());
  })
  .prefix('/auth')
  .prefix(API_PREFIX_V1);
