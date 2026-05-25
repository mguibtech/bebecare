# BebeCare — Mobile (React Native CLI)

App mobile do BebeCare. **React Native CLI bare** (não Expo), TypeScript, React Navigation, React Query, Zustand, React Native Paper.

> ⚠️ Esta pasta começa vazia de propósito. O `init` do React Native CLI gera projetos nativos Android (Gradle) e iOS (Xcode) que **precisam ser criados no seu ambiente real** (Windows com Android Studio configurado). Rodar o init em outro ambiente quebra caminhos e SDK paths.

## Pré-requisitos (Windows)

Siga o passo a passo oficial: https://reactnative.dev/docs/set-up-your-environment?os=windows

Resumo dos pré-requisitos:

- **Node.js 20 LTS** ou superior
- **JDK 17** (recomendo Temurin via `winget install EclipseAdoptium.Temurin.17.JDK`)
- **Android Studio** com:
  - Android SDK Platform 35 (ou a mais recente)
  - Android SDK Build-Tools 35
  - Android SDK Platform-Tools
  - Android Emulator + uma AVD (ex: Pixel 7 / API 35)
- Variáveis de ambiente:
  - `ANDROID_HOME` apontando para `%LOCALAPPDATA%\Android\Sdk`
  - `JAVA_HOME` apontando para a JDK 17
  - Adicionar `%ANDROID_HOME%\platform-tools` ao `PATH`

Confira com:

```powershell
node -v          # >= 20
java -version    # 17.x
adb --version
```

## Inicializar o projeto (uma vez só)

Dentro de `apps/mobile/` (**esta pasta**, abra um PowerShell aqui):

```powershell
npx @react-native-community/cli@latest init BebeCareMobile --version latest --skip-install
```

Isso vai criar uma subpasta `BebeCareMobile/`. **Mova o conteúdo dela para cá** (a pasta `apps/mobile/`) para que esta pasta seja a raiz do projeto RN. No PowerShell:

```powershell
# Mover conteúdo de BebeCareMobile/ para o diretório atual
Get-ChildItem -Path .\BebeCareMobile -Force | Move-Item -Destination .
Remove-Item .\BebeCareMobile
```

Depois:

```powershell
npm install
```

> Alternativa: rode o init com `--directory .` se seu CLI suportar — mas geralmente exige pasta vazia.

## Rodar

Em um terminal:

```powershell
npm start
```

Em outro terminal (com o emulador Android aberto):

```powershell
npm run android
```

## Próximos passos (Fase 1)

Quando o projeto base estiver rodando ("Welcome to React Native"), abra um PR/commit chamado **"chore(mobile): init RN CLI bare"** e me avise — vou instalar e configurar:

- React Navigation (native stack)
- React Query (TanStack Query)
- Zustand
- React Native Paper + tema do BebeCare
- Axios configurado para falar com `http://10.0.2.2:3000/api` (emulador Android ⇄ host)
- React Native Keychain (para guardar o JWT)
- ESLint + Prettier alinhados com a API

## Convenções

- TypeScript em tudo
- Nomes em inglês, comentários em português
- Hooks de React Query gerados junto com cada endpoint da API
