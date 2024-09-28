import { API_PREFIX_V1 } from '#constants/api_version';
import { middleware } from '#start/kernel';
import router from '@adonisjs/core/services/router';

import '#routes/auth';
import '#routes/enterprise';
import '#routes/scrapper';
import '#routes/swagger';
import '#routes/upload_csv';
import '#routes/welcome';

const UserController = () => import('#controllers/user_controller');

router
  .get('/user', [UserController, 'index'])
  .prefix(API_PREFIX_V1)
  .middleware(middleware.auth());

router.get('*', ({ response }) => response.redirect().toRoute('welcome'));
