import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens';
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid';
import { compose } from '@adonisjs/core/helpers';
import hash from '@adonisjs/core/services/hash';
import { BaseModel, column } from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
});

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  // @example(John)
  declare firstname: string;

  @column()
  // @example(Doe)
  declare lastname: string;

  @column()
  // @example(johndoe@example.com)
  declare email: string;

  @column({ serializeAs: null })
  declare password: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null;

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '1 hour',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  });
}
