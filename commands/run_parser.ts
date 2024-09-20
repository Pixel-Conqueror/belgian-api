import { DatabaseLoader } from '#services/database_loader';
import { BaseCommand, flags } from '@adonisjs/core/ace';
import type { CommandOptions } from '@adonisjs/core/types/ace';

export default class RunParser extends BaseCommand {
  static commandName = 'run:parser';
  static description =
    'Exécuter le service de traitement des fichiers CSV pour complèter la base de données';

  @flags.string()
  declare path: string;

  static options: CommandOptions = {};

  async run() {
    const customPath = this.path || '';
    if (!customPath || customPath === '') {
      this.error(
        'Veuillez spécifier le chemin vers le dossier contenant les fichiers CSV'
      );
    }
    const parser = new DatabaseLoader(customPath);
    try {
      await parser.run();
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
