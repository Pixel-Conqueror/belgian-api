import { DatabaseLoader } from '#services/database_loader';
import { BaseCommand } from '@adonisjs/core/ace';
import type { CommandOptions } from '@adonisjs/core/types/ace';

export default class RunParser extends BaseCommand {
  static commandName = 'run:loader';
  static description =
    'Exécuter le service de traitement des fichiers CSV pour remplir la base de données';

  static options: CommandOptions = {};

  async run() {
    const loader = new DatabaseLoader();

    try {
      await loader.run();
      this.logger.success(
        'Le traitement des fichiers CSV est terminé avec succès.'
      );
    } catch (error) {
      this.error(
        `Erreur lors du traitement des fichiers CSV : ${error.message}`
      );
    }
  }
}
