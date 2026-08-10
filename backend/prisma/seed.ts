import { PrismaClient, RunStatus, ResultStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.versionTestRun.deleteMany();
  await prisma.appVersion.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.feature.deleteMany();

  const searchFeature = await prisma.feature.create({
    data: { name: 'חיפוש', sortOrder: 1 },
  });

  const rowsFeature = await prisma.feature.create({
    data: { name: 'שורות', sortOrder: 2 },
  });

  const testCases = await Promise.all([
    prisma.testCase.create({
      data: {
        featureId: searchFeature.id,
        scenario: 'טקסט תקין',
        steps: 'מזינים טקסט חופשי תקין, מריצים חיפוש',
        expectedResult: 'קבלת תוצאות',
        sortOrder: 1,
      },
    }),
    prisma.testCase.create({
      data: {
        featureId: searchFeature.id,
        scenario: "חיפוש של אימוג'י",
        steps: 'מזינים 😊',
        expectedResult: 'שגיאה - "אימוג\'י לא נתמך"',
        sortOrder: 2,
      },
    }),
    prisma.testCase.create({
      data: {
        featureId: rowsFeature.id,
        scenario: 'הוספת שורה',
        steps: 'לוחצים על הכפתור של הוספת שורה',
        expectedResult: 'נוספה שורה',
        sortOrder: 1,
      },
    }),
    prisma.testCase.create({
      data: {
        featureId: rowsFeature.id,
        scenario: 'מחיקה שורה',
        steps: 'מקש ימין על שורה קיימת - מחק',
        expectedResult: 'השורה נמחקה',
        sortOrder: 2,
      },
    }),
  ]);

  const version = await prisma.appVersion.create({
    data: {
      name: 'v1.0.0',
      description: 'גרסת QA ראשונה',
      versionTestRuns: {
        create: [
          { testCaseId: testCases[0].id, runStatus: RunStatus.done, resultStatus: ResultStatus.success },
          { testCaseId: testCases[1].id, runStatus: RunStatus.need_to_run },
          { testCaseId: testCases[2].id, runStatus: RunStatus.done, resultStatus: ResultStatus.success },
          { testCaseId: testCases[3].id, runStatus: RunStatus.need_to_run },
        ],
      },
    },
  });

  console.log(`Seeded version: ${version.name} with ${testCases.length} test cases`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
