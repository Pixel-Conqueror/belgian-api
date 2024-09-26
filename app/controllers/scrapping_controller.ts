import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrappingValidator } from '#validators/scrapping_validator';

export default class ScrappingController {
  public async index({ params, response }: HttpContextContract) {
    // Validation du paramètre Number qui est passé dans l'URL (params)
    const validatedData = await scrappingValidator.validate({
      Number: params.Number, // Validation de params.Number
    });

    const companyNumber = validatedData.Number;

    try {
      // URLs pour le scrapping
      const companyWebUrl = `https://www.companyweb.be/fr/${companyNumber}`;
      const kboUrl = `https://kbopub.economie.fgov.be/kbopub/toonondernemingps.html?lang=fr&ondernemingsnummer=${companyNumber}`;

      // Scraping CompanyWeb
      const scrapeCompanyWeb = async (url: string) => {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let address = $('div:contains("Adresse")').next().text().replace(/\s\s+/g, ' ').trim();
        let creationDate = $('div:contains("Création")').next().text().trim();
        let mainActivity = $('div:contains("Activité principale")').next().text().trim();

        address = address.replace(/Création\s+\d{2}-\d{2}-\d{4}/, '').trim();
        creationDate = creationDate.match(/\d{2}-\d{2}-\d{4}/) ? creationDate.match(/\d{2}-\d{2}-\d{4}/)[0] : creationDate;
        mainActivity = mainActivity.replace(/Essayer gratuitement\s+/, '').trim();
        address = address.replace(/Essayer gratuitement\s+/, '').trim();

        return {
          companyNumber: $('div:contains("Numéro d\'entreprise")').next().text().trim(),
          vatNumber: $('div:contains("Numéro d\'entreprise")').next().text().trim(),
          address,
          creationDate,
          mainActivity,
        };
      };

      // Scraping KBO
      const scrapeKBO = async (url: string) => {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        return {
          companyNumber: $('#table td:contains("Numéro d\'entreprise")').next().text().trim(),
          legalStatus: $('#table td:contains("Statut")').next().text().trim(),
          legalSituation: $('#table td:contains("Situation juridique")').next().text().trim().replace(/Depuis/, ' Depuis'),
          startDate: $('#table td:contains("Date de début")').next().text().trim(),
          companyName: $('#table td:contains("Dénomination")').next().text().trim().split('Dénomination')[0].trim(),
          phoneNumber: $('#table td:contains("Numéro de téléphone")').next().text().trim(),
          legalForm: $('#table td:contains("Forme légale")').next().text().trim().replace(/\n|\t/g, '').replace(/Depuis/, ' Depuis').trim(),
        };
      };

      // Exécution des deux scrapes
      const companyWebData = await scrapeCompanyWeb(companyWebUrl);
      const kboData = await scrapeKBO(kboUrl);

      // Fusion des données
      const combinedData = { ...companyWebData, ...kboData };

      return response.ok(combinedData);
    } catch (error) {
      // Log de l'erreur complète
      console.error('Error during scrapping:', error.message);
      console.error(error.stack); // Ajoute cette ligne pour voir la stack trace complète

      return response.internalServerError({
        message: 'An error occurred during scrapping',
        details: error.message, // Retourne aussi le message d'erreur pour aider au débogage
      });
    }
  }
}
