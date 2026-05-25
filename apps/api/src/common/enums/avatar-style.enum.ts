// Estilos do DiceBear suportados para avatares.
// A URL final é construída no mobile como:
//   https://api.dicebear.com/9.x/<style>/svg?seed=<seed>
// Para incluir um novo estilo, adicionar aqui E na migration que tem o tipo Postgres.
export enum AvatarStyle {
  ADVENTURER = 'adventurer',
  LORELEI = 'lorelei',
  MICAH = 'micah',
  PERSONAS = 'personas',
  NOTIONISTS = 'notionists',
  AVATAAARS = 'avataaars',
  BOTTTS = 'bottts',
  CROODLES = 'croodles',
}
