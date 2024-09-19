import { API_PREFIX_V1 } from '#constants/api_version';
import { middleware } from '#start/kernel';
import router from '@adonisjs/core/services/router';

const LoginController = () => import('#controllers/login_controller');
const SigninsController = () => import('#controllers/signins_controller');

router
  .group(() => {
    router
      .group(() => {
        router.post('login', [LoginController, 'handle']);
        router.post('signin', [SigninsController, 'handle']);
        router.post('verify_token', [LoginController, 'verifyToken']);
      })
      .prefix('/auth')
      .middleware(middleware.guest());
  })
  .prefix(API_PREFIX_V1);
