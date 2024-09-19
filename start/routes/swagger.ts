import swagger from '#config/swagger';
import router from '@adonisjs/core/services/router';
import AutoSwagger from 'adonis-autoswagger';

// returns swagger in YAML
router.get('/swagger', async () =>
  AutoSwagger.default.docs(router.toJSON(), swagger)
);

// Swagger UI
router.get('/docs', async () => AutoSwagger.default.ui('/swagger', swagger));
