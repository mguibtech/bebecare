# Áudios do Modo Soninho

Os 8 sons de ruído branco **não são versionados no git** (são grandes e cada um
tem licença própria). Cada dev/build precisa adicioná-los localmente.

> **O app compila e roda sem os áudios.** A tela do Modo Soninho funciona, mas
> não sai som até os arquivos serem colocados em `res/raw` (mesma ideia do
> `google-services.json` do Firebase).

## Onde colocar

Coloque os arquivos em:

```
apps/mobile/android/app/src/main/res/raw/
```

⚠️ Nomes de recurso Android: **minúsculas, sem espaços, sem pontos extras**.
Use exatamente estes nomes (o player monta `android.resource://com.bebecare/raw/<nome>`):

| Som | Arquivo esperado | Ícone |
|---|---|---|
| Ruído branco | `sleep_white.ogg` | waveform |
| Ruído marrom | `sleep_brown.ogg` | sine-wave |
| Chuva | `sleep_rain.ogg` | weather-pouring |
| Ventilador | `sleep_fan.ogg` | fan |
| Batimento | `sleep_heartbeat.ogg` | heart-pulse |
| Útero | `sleep_womb.ogg` | baby-face-outline |
| Mar | `sleep_ocean.ogg` | waves |
| Carro | `sleep_car.ogg` | car |

## Formato recomendado

- **OGG Vorbis**, mono, ~96–128 kbps
- Duração **2–3 min** por arquivo (loopa via `RepeatMode.Track`; arquivos mais
  longos disfarçam a emenda do loop)
- ~2–3 MB cada (APK total estimado continua confortável)

## Fontes CC0 / CC-BY (preencha ao adicionar)

Use **apenas** áudios de domínio público (CC0) ou CC-BY com atribuição. Boas
fontes: [Freesound](https://freesound.org) (filtre por CC0), [Pixabay](https://pixabay.com/sound-effects/).

Documente aqui a fonte e licença de cada arquivo que você adicionar:

| Arquivo | Fonte (URL) | Autor | Licença |
|---|---|---|---|
| `sleep_white.ogg` | _(preencher)_ | | CC0 |
| `sleep_brown.ogg` | | | |
| `sleep_rain.ogg` | | | |
| `sleep_fan.ogg` | | | |
| `sleep_heartbeat.ogg` | | | |
| `sleep_womb.ogg` | | | |
| `sleep_ocean.ogg` | | | |
| `sleep_car.ogg` | | | |

## Depois de adicionar

`npm run android` (rebuild — os recursos entram no APK).
