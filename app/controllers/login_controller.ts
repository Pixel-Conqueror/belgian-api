import User from '#models/user';
import { loginValidator } from '#validators/login_validator';
import type { HttpContext } from '@adonisjs/core/http';

export default class LoginController {
  /**
   * @handle
   * @description Authenticate user
   * @requestBody {"email": "johndoe@example.com", "password": "my_strong_password"}
   * @responseBody 200 - <User>
   * @responseHeader 200
   */
  async handle({ request }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator);
    const user = await User.verifyCredentials(email, password);
    const token = await User.accessTokens.create(user);

    token.identifier;
    return {
      message: 'Login successful',
      token,
    };
  }
}
