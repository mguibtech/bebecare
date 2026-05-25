// Unidades de dose de medicação. Pacote enxuto que cobre ~95% dos remédios
// pediátricos. Outras (mcg, supositório, spray) entram em V2 se aparecer demanda.
export enum DoseUnit {
  DROP = 'drop',       // gota
  ML = 'ml',           // mililitro
  MG = 'mg',           // miligrama (xaropes que vêm em mg/ml também usam ML)
  TABLET = 'tablet',   // comprimido
  SACHET = 'sachet',   // sachê
}
