
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

// Check environment variables
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error("Missing Firebase Admin credentials in .env.local");
  process.exit(1);
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Handle private key newlines correctly
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const INITIAL_QRCODES = [
  {
    code: 'LOOB_MALETA',
    response: [
        '> 🔓 BIOMETRIA DETECTADA...',
        '> AUTENTICAÇÃO: TOKEN ORGÂNICO VÁLIDO.',
        '> Conteúdo: Tecido Biológico Humano em Formol.',
        '> Órgão: Fígado.',
        '> Assinatura de DNA: Compatível com Victor Krov (99.9% - Gêmeo ou Clone).',
        '> Função: Token de Acesso. A barreira da Ilha reconhece este DNA como "Autorizado".',
        '> Status da Tranca: Bloqueio Biométrico. Necessário polegar do Krov para abrir sem detonar.'
    ]
  },
  {
    code: 'LOOB_ACESSO',
    response: [
        '> 🔑 CÓDIGO DE ACESSO ESCANEADO.',
        '> Porta desbloqueada. Vocês têm 30 segundos.'
    ]
  },
  {
    code: 'LOOB_SEGREDO',
    response: [
        '> 📜 ARQUIVO CRIPTOGRAFADO DECODIFICADO.',
        '> O Maestro está na Ilha. Coordenadas: -23.5505, -46.6333',
        '> Boa sorte. Vocês vão precisar.'
    ]
  }
];

async function seedQRCodes() {
  console.log('Seeding QR Codes...');
  const batch = db.batch();

  for (const qr of INITIAL_QRCODES) {
    const ref = db.collection('qrcodes').doc(); 
    // Or use deterministic ID if needed, e.g. .doc(qr.code), but random is fine for list.
    batch.set(ref, qr);
  }

  await batch.commit();
  console.log('Done.');
}

seedQRCodes().catch(console.error);
