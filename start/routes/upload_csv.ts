import { API_PREFIX_V1 } from '#constants/api_version';
import { middleware } from '#start/kernel';
import router from '@adonisjs/core/services/router';

const UploadController = () => import('#controllers/upload_controller');

router
  .post('/upload_csv', [UploadController, 'handle'])
  .middleware(middleware.auth())
  .prefix(API_PREFIX_V1);
