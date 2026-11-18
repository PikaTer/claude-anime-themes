// Cat Ina: Ninyomanyo Ninya'nis, Ina with cat ears, on about one wake in five.
// Her lines and how she nyanifies everyone else's.

/** What she blurts as she wakes, greets Ao-chan with, and says as she goes. */
export const CAT_WAKE = 'INYA?!?'
export const CAT_AO = 'AO-NYAN!!'
export const CAT_BYE = 'BYE NYA~'

/** Her own lines, mixed in with Ina's usual ones while she works. */
export const CAT_SAY = [
  "IT IS I,\nNINYOMANYO\nNINYA'NIS!",
  'INYA, INYA, INYA',
  'TAKONYACHI!',
  'NYA-T IS THIS?',
  'PURR PURR~',
  'PAWS FOR A BREAK~',
  'HISSS... A BUG!',
  'KNEADING THE CODE~',
  'LOVE THE FLOOR,\nINYA~',
]

/** A shared line as cat Ina says it: every NA a NYA, and so on. */
export const nyan = text =>
  text.replaceAll('AO-CHAN', 'AO-NYAN').replaceAll('WAH', 'NYAH').replaceAll('NA', 'NYA').replaceAll('NO', 'NYO')
