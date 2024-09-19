import { API_PREFIX_V1 } from '#constants/api_version';
import router from '@adonisjs/core/services/router';

router
  .group(() => {
    router.get('hello', () => ({ yo: '👋 swagger -> /docs' })).as('welcome');
  })
  .prefix(API_PREFIX_V1);
