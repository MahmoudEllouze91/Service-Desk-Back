import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import {
  PrismaClient,
  RequestStatus,
  Urgency,
  Role,
} from '../src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set to connect to the database.');
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
});

async function main() {
  console.log('🌱 Initialisation des données...');

  // 1. Nettoyage des anciennes données
  await prisma.statusHistory.deleteMany();
  await prisma.request.deleteMany();

  // 2. Création des utilisateurs
  const requester = await prisma.user.upsert({
    where: { email: 'sophie@example.com' },
    update: {},
    create: {
      firstname: 'Sophie',
      lastname: 'Martin',
      email: 'sophie@example.com',
      role: Role.REQUESTER,
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'thomas@example.com' },
    update: {},
    create: {
      firstname: 'Thomas',
      lastname: 'Bernard',
      email: 'thomas@example.com',
      role: Role.OPERATOR,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'claire@example.com' },
    update: {},
    create: {
      firstname: 'Claire',
      lastname: 'Dubois',
      email: 'claire@example.com',
      role: Role.MANAGER,
    },
  });

  // 3. Données de démonstration
  const Categories = {
    HARDWARE: 'Materiel',
    OS: "Systeme d'exploitation",
    SOFTWARE: 'Logiciel',
    OTHER: 'Autre',
  };

  const categories = [
    Categories.HARDWARE,
    Categories.OS,
    Categories.SOFTWARE,
    Categories.OTHER,
  ];

  const statuses = [
    RequestStatus.NEW,
    RequestStatus.NEW,
    RequestStatus.NEW,
    RequestStatus.IN_PROGRESS,
    RequestStatus.IN_PROGRESS,
    RequestStatus.RESOLVED,
  ];

  const urgencies = [Urgency.LOW, Urgency.NORMAL, Urgency.HIGH];

  const titles = [
    'Problème de connexion VPN',
    "Demande d'accès à une application",
    'Ordinateur portable en panne',
    'Installation de Microsoft Office',
    "Problème d'imprimante",
    'Réinitialisation du mot de passe',
    'Demande de nouvel écran',
    'Problème de connexion réseau',
    'Installation de Visual Studio Code',
    'Accès au serveur de fichiers',
  ];

  // 4. Création des 30 demandes
  for (let i = 0; i < 30; i++) {
    const status = statuses[i % statuses.length];

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - i);

    const request = await prisma.request.create({
      data: {
        title: `${titles[i % titles.length]} #${i + 1}`,
        description: `Description de démonstration pour la demande ${i + 1}.`,
        category: categories[i % categories.length],
        urgency: urgencies[i % urgencies.length],
        status,

        userCreatorId: requester.id,

        // Les demandes nouvelles ne sont pas encore affectées
        ...(status !== RequestStatus.NEW
          ? { assignedOperatorId: operator.id }
          : {}),

        createdAt,
      },
    });

    // 5. Création de l'historique de statut
    await prisma.statusHistory.create({
      data: {
        requestId: request.id,
        assigningUserId: status === RequestStatus.NEW ? requester.id : operator.id,
        status: RequestStatus.NEW,
      },
    });

    if (status !== RequestStatus.NEW) {
      await prisma.statusHistory.create({
        data: {
          requestId: request.id,
          assigningUserId: operator.id,
          status,
        },
      });
    }
  }

  console.log('✅ 3 utilisateurs créés ou conservés.');
  console.log('✅ 30 demandes créées.');
  console.log('✅ Historiques de statut générés.');
}

main()
  .catch((error) => {
    console.error('❌ Erreur pendant le seed :', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
