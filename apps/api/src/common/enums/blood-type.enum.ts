// Tipo sanguíneo do bebê (8 valores do sistema ABO+Rh). Não usamos 'unknown' —
// se o pai/mãe ainda não sabe, o campo fica null no banco.
export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}
