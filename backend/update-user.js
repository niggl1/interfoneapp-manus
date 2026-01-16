const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'eduardodominikus@hotmail.com' },
    data: {
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
  console.log('Usuário atualizado:', user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
