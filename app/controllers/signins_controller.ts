import User from '#models/user';
import { signinValidator } from '#validators/signin_validator';
import type { HttpContext } from '@adonisjs/core/http';

export default class SigninsController {
  /**
   * @handle
   * @description Create a new user account
   * @requestBody {"firstname": "John", "lastname": "Doe", "email": "johndoe@example.com", "password": "Aaaaaaaaa"}
   * @responseBody 200 - <User>
   * @responseHeader 200
   */
  async handle({ request }: HttpContext) {
    const { firstname, lastname, email, password } =
      await request.validateUsing(signinValidator);
    const user = await User.create({ firstname, lastname, email, password });

    return {
      message: 'User created successfully',
      user,
    };
  }
}
