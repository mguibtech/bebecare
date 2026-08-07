// Gera o APK de release assinado e envia pro Firebase App Distribution.
//
// Uso:
//   npm run distribute                       -> notas = última mensagem de commit
//   npm run distribute -- --notes "texto"    -> notas customizadas
//
// Pré-requisitos (uma vez só):
//   1. npm i -g firebase-tools && firebase login
//   2. Upload keystore gerado + props BEBECARE_UPLOAD_* no
//      %USERPROFILE%\.gradle\gradle.properties (ver DEPLOY.md)
//   3. Grupo de testers criado no console (App Distribution) com o alias abaixo
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// App Android no projeto Firebase (bebecareapp-61508) — vem do google-services.json
const APP_ID = '1:405552655820:android:7ea19b08356ac525450169';
// Alias do grupo de testers no console do Firebase (App Distribution → Testers)
const TESTER_GROUPS = 'familia';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = resolve(mobileRoot, 'android');
const apkPath = resolve(androidDir, 'app/build/outputs/apk/release/app-release.apk');
const isWindows = process.platform === 'win32';

// Aviso se o keystore de release não estiver configurado: o build.gradle cai no
// debug keystore em silêncio, e trocar de assinatura depois força todo tester a
// desinstalar/reinstalar o app.
const globalGradleProps = resolve(homedir(), '.gradle', 'gradle.properties');
const hasUploadKeystore =
  existsSync(globalGradleProps) &&
  readFileSync(globalGradleProps, 'utf8').includes('BEBECARE_UPLOAD_STORE_FILE');
if (!hasUploadKeystore) {
  console.warn(
    '\n⚠️  BEBECARE_UPLOAD_STORE_FILE não encontrado em ~/.gradle/gradle.properties.' +
      '\n   O APK será assinado com o keystore de DEBUG. Ver DEPLOY.md (seção keystore).\n',
  );
}

// Notas de release: --notes "..." ou a última mensagem de commit
const notesFlag = process.argv.indexOf('--notes');
const releaseNotes =
  notesFlag > -1 && process.argv[notesFlag + 1]
    ? process.argv[notesFlag + 1]
    : execSync('git log -1 --pretty=%s', { cwd: mobileRoot }).toString().trim();

run(isWindows ? 'gradlew.bat' : './gradlew', ['assembleRelease'], androidDir);

if (!existsSync(apkPath)) {
  console.error(`❌ APK não encontrado em ${apkPath}`);
  process.exit(1);
}

run(
  'firebase',
  [
    'appdistribution:distribute',
    apkPath,
    '--app',
    APP_ID,
    '--groups',
    TESTER_GROUPS,
    '--release-notes',
    releaseNotes,
  ],
  mobileRoot,
);

console.log('\n✅ Build distribuído! Os testers recebem e-mail do Firebase com o link.');

function run(cmd, args, cwd) {
  console.log(`\n> ${cmd} ${args.join(' ')}\n`);
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWindows });
  if (result.status !== 0) {
    if (result.error?.code === 'ENOENT') {
      console.error(`❌ Comando "${cmd}" não encontrado. Instalou o firebase-tools? (npm i -g firebase-tools)`);
    }
    process.exit(result.status ?? 1);
  }
}
