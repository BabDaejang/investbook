import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = [
    // [시장 유형] group: "market"
    { name: '주식 시장', group: 'market', color: '#3B82F6', order: 0 },
    { name: '채권 시장', group: 'market', color: '#8B5CF6', order: 1 },
    { name: '부동산 시장', group: 'market', color: '#F59E0B', order: 2 },
    { name: '선물·옵션', group: 'market', color: '#EF4444', order: 3 },
    { name: '매크로', group: 'market', color: '#10B981', order: 4 },

    // [지식 영역] group: "domain"
    { name: '경제사', group: 'domain', color: '#6B7280', order: 5 },
    { name: '금융 시스템', group: 'domain', color: '#0EA5E9', order: 6 },
    { name: '산업분석', group: 'domain', color: '#F97316', order: 7 },
    { name: '기업분석·재무제표', group: 'domain', color: '#84CC16', order: 8 },
    { name: '밸류에이션', group: 'domain', color: '#EC4899', order: 9 },
    { name: '투자 대가', group: 'domain', color: '#D97706', order: 10 },
    { name: '심리·행동경제학', group: 'domain', color: '#A855F7', order: 11 },
    { name: '퀀트·데이터', group: 'domain', color: '#06B6D4', order: 12 },

    // [경험 수준] group: "level"
    { name: '입문', group: 'level', color: '#22C55E', order: 13 },
    { name: '중급', group: 'level', color: '#3B82F6', order: 14 },
    { name: '고급', group: 'level', color: '#F59E0B', order: 15 },
    { name: '전문가', group: 'level', color: '#EF4444', order: 16 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }
  console.log('Seed completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
