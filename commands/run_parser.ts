import { ParserService } from '#services/parser_service';
import { BaseCommand } from '@adonisjs/core/ace';
import type { CommandOptions } from '@adonisjs/core/types/ace';

export default class RunParser extends BaseCommand {
  static commandName = 'run:parser';
  static description = 'Exécuter le service de traitement des fichiers CSV';

  static options: CommandOptions = {};

  async run() {
    const parserService = new ParserService();

    try {
      await parserService.run();
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
