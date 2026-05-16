import { testInstagramConnection } from './instagram.js';
import { sendWhatsAppMessage } from './whatsapp.js';
import { runBriefing, runDailyGeneration, runIntelligenceUpdate, runMetricsSync } from './scheduler.js';

const job = process.argv[2];

try {
  if (job === 'generate') console.log(await runDailyGeneration());
  else if (job === 'metrics') console.log(await runMetricsSync());
  else if (job === 'intelligence') console.log(await runIntelligenceUpdate());
  else if (job === 'whatsapp-test') console.log(await sendWhatsAppMessage('Teste da Central de Autoridade: WhatsApp conectado.'));
  else if (job === 'instagram-test') console.log(await testInstagramConnection());
  else {
    console.log('Use: generate | metrics | intelligence | whatsapp-test | instagram-test');
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
