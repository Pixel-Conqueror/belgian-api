import User from '#models/user';
import type { HttpContext } from '@adonisjs/core/http';

export default class LogoutsController {
  async handle({ auth }: HttpContext) {
    const user = auth.user!;
    const tokenId = user.currentAccessToken.identifier;
    await User.accessTokens.delete(user, tokenId);
    return { message: 'Logout successful' };
  }
}
