import type { HttpContext } from '@adonisjs/core/http';

export default class UserController {
  index({ auth }: HttpContext) {
    return {
      user: auth.user!.serialize(),
    };
  }
}
