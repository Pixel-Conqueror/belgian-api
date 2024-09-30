import { HttpContext } from '@adonisjs/core/http';
import logger from '@adonisjs/core/services/logger';

export default class LogRequest {
  async handle({ request }: HttpContext, next: () => Promise<void>) {
    logger.debug(
      `[${request.method()}]: ${request.url()} [${JSON.stringify(request.headers())}]`
    );
    await next();
  }
}
