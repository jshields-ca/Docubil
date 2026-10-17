'use strict';

const { detectLanguage } = require('../../src/services/languageDetect');

const SAMPLES = {
  en: 'The committee reviewed the report and agreed that the changes are necessary for the ' +
    'safety of the building. It will be presented to the board, which is expected to approve ' +
    'it on Monday. You can read the full text on the website, and comments are welcome from ' +
    'anyone who has an interest in the project.',
  fr: 'Le comité a examiné le rapport et il est convaincu que les changements sont nécessaires ' +
    'pour la sécurité du bâtiment. Ce document sera présenté au conseil, qui devrait ' +
    'l’approuver lundi. Vous pouvez lire le texte complet sur le site, et les commentaires ' +
    'des citoyens sont les bienvenus dans cette consultation avec nous.',
  es: 'El comité revisó el informe y está convencido de que los cambios son necesarios para la ' +
    'seguridad del edificio. El documento también será presentado al consejo, que ya ha ' +
    'expresado su apoyo. Hay más información sobre el proyecto en el sitio web, y los ' +
    'comentarios de todos los vecinos son muy bienvenidos entre las partes.',
  de: 'Der Ausschuss hat den Bericht geprüft und ist der Meinung, dass die Änderungen für die ' +
    'Sicherheit des Gebäudes notwendig sind. Das Dokument wird dem Rat vorgelegt, der sich ' +
    'auch am Montag damit befassen wird. Die Bürger sind eingeladen, den Text auf der Website ' +
    'zu lesen und mit Kommentaren zu unterstützen, die nicht anonym sind.',
};

describe('detectLanguage', () => {
  it.each(Object.entries(SAMPLES))('recognises %s', (lang, text) => {
    expect(detectLanguage(text)).toBe(lang);
  });

  it('returns null when there is too little text to be sure', () => {
    expect(detectLanguage('Invoice 2026-114')).toBeNull();
    expect(detectLanguage('')).toBeNull();
    expect(detectLanguage(undefined)).toBeNull();
  });

  it('returns null for a document mixing two languages evenly', () => {
    expect(detectLanguage(`${SAMPLES.en} ${SAMPLES.fr}`)).toBeNull();
  });
});
