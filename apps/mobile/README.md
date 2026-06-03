This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Push / Firebase (M6/6A)

O app usa **Firebase Cloud Messaging (FCM)** para lembretes de dose de remédio e
de consulta. As credenciais do Firebase **não são versionadas** (são
gitignored) — cada dev precisa configurá-las localmente.

> **O app compila e roda sem o Firebase.** O plugin `google-services` só é
> aplicado quando o `google-services.json` existe (ver `android/app/build.gradle`),
> e todo o código de push vira no-op via `isFirebaseConfigured()`. Você só
> precisa dos passos abaixo quando for testar/usar push de verdade.

### Android

1. No [Firebase console](https://console.firebase.google.com), crie (ou abra) o
   projeto **BebeCare**.
2. **Add app → Android**, com o package name **exato**: `com.bebecare`.
3. Baixe o `google-services.json` gerado.
4. Coloque em `apps/mobile/android/app/google-services.json`.
   (Veja `google-services.example.json` ao lado para o formato esperado.)
5. Rebuilde: `npm run android`. Push fica ativo a partir daí.

O emulador Android recebe push normalmente.

### iOS (precisa de macOS + Xcode)

1. No mesmo projeto Firebase, **Add app → iOS** com o bundle id do app.
2. Baixe o `GoogleService-Info.plist` e coloque em `apps/mobile/ios/`
   (também gitignored). Adicione-o ao target no Xcode.
3. Em **Signing & Capabilities**, habilite **Push Notifications** e
   **Background Modes → Remote notifications**.
4. `cd ios && bundle exec pod install`.
5. Push em iOS só funciona em **device físico** (ou simulador no macOS 13+
   recente); não funciona em simulador antigo.

### Backend

O backend (`apps/api`) envia push via Firebase Admin SDK e espera 3 variáveis no
`.env`: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
(geradas a partir de uma service account do mesmo projeto Firebase). Sem elas, o
backend usa um sender "stub" (não envia de verdade).

## Alarmes locais de remédio (M6/B8 — notifee)

O **diferencial do despertador**: além do push (que pode atrasar em devices com
otimização de bateria agressiva), cada horário de remédio com **"Tocar alarme"**
ligado agenda um **alarme local via [`@notifee/react-native`]** que toca no
horário exato, por cima da lockscreen, mesmo com o app fechado.

**Como funciona (código em [`src/features/medications/alarms/`]):**

- Um trigger notification por `(schedule × dia-da-semana ativo)`, com repetição
  **semanal**. O notifee persiste e re-registra os triggers após reboot
  (permissão `RECEIVE_BOOT_COMPLETED` no manifest) — sem `BroadcastReceiver`
  próprio.
- `useMedicationAlarmSync()` (montado no `AppNavigator`) reconcilia os alarmes
  do bebê selecionado sempre que a lista de remédios muda e no launch.
  Idempotente: cancela os do bebê e reagenda.
- Os ids são escopados por bebê (`med-alarm:<babyId>:<scheduleId>:<dia>`), então
  famílias com 2+ bebês não sobrescrevem os alarmes umas das outras.
- No logout, `cancelAllMedicationAlarms()` limpa os alarmes da conta que sai.

**Permissão de alarme exato (Android 12+):** pedida *just-in-time* — quando há
alarmes ativos mas a permissão está revogada, um snackbar oferece "Ativar" que
abre a tela do sistema. Sem ela, o alarme cai pro agendamento inexato (atrasa,
mas não quebra).

> ⚠️ **`@notifee/react-native` é um módulo nativo.** Depois de instalar (já feito),
> é obrigatório **rebuildar** o app — `npm run android` — para o JS enxergar o
> módulo. Antes do rebuild, todo o código de alarme é no-op seguro (guard
> try/catch), o app roda normal só sem agendar alarme.

**Como verificar no device/emulador:**

1. `npm run android` (rebuild com o módulo nativo).
2. Cadastre um remédio com um horário **1–2 min no futuro**, com **"Tocar
   alarme" ligado**.
3. Conceda a permissão de "Alarmes e lembretes" se o snackbar pedir.
4. Feche o app (não só minimize) e aguarde o horário — o alarme deve tocar em
   tela cheia.
5. Em devices Xiaomi/Huawei/Oppo, desabilite a otimização de bateria pro
   BebeCare se o alarme não disparar (risco mapeado no roadmap).

[`@notifee/react-native`]: https://notifee.app
[`src/features/medications/alarms/`]: src/features/medications/alarms/

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
