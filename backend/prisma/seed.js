const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar condomínio de exemplo
  const condominium = await prisma.condominium.create({
    data: {
      name: 'Condomínio Residencial Manus',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      phone: '(11) 1234-5678',
      email: 'contato@condmanus.com.br',
      qrCode: `COND-${uuidv4().substring(0, 8).toUpperCase()}`
    }
  });

  console.log(`✅ Condomínio criado: ${condominium.name}`);

  // Criar blocos
  const blockA = await prisma.block.create({
    data: {
      name: 'Bloco A',
      condominiumId: condominium.id
    }
  });

  const blockB = await prisma.block.create({
    data: {
      name: 'Bloco B',
      condominiumId: condominium.id
    }
  });

  console.log('✅ Blocos criados: Bloco A, Bloco B');

  // Criar unidades
  const units = [];
  for (let floor = 1; floor <= 3; floor++) {
    for (let apt = 1; apt <= 2; apt++) {
      const number = `${floor}0${apt}`;
      
      const unitA = await prisma.unit.create({
        data: {
          number,
          floor,
          blockId: blockA.id,
          qrCode: `UNIT-${uuidv4().substring(0, 8).toUpperCase()}`
        }
      });
      units.push(unitA);

      const unitB = await prisma.unit.create({
        data: {
          number,
          floor,
          blockId: blockB.id,
          qrCode: `UNIT-${uuidv4().substring(0, 8).toUpperCase()}`
        }
      });
      units.push(unitB);
    }
  }

  console.log(`✅ ${units.length} unidades criadas`);

  // Criar usuário admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@interfoneapp.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
      status: 'ACTIVE',
      condominiumId: condominium.id
    }
  });

  console.log(`✅ Admin criado: ${admin.email}`);

  // Criar zelador
  const janitorPassword = await bcrypt.hash('zelador123', 10);
  const janitor = await prisma.user.create({
    data: {
      email: 'zelador@condmanus.com.br',
      password: janitorPassword,
      name: 'José da Silva',
      phone: '(11) 98765-4321',
      role: 'JANITOR',
      status: 'ACTIVE',
      condominiumId: condominium.id
    }
  });

  console.log(`✅ Zelador criado: ${janitor.email}`);

  // Criar alguns moradores
  const residentPassword = await bcrypt.hash('morador123', 10);
  
  const resident1 = await prisma.user.create({
    data: {
      email: 'maria@email.com',
      password: residentPassword,
      name: 'Maria Santos',
      phone: '(11) 91234-5678',
      role: 'RESIDENT',
      status: 'ACTIVE',
      condominiumId: condominium.id,
      unitId: units[0].id // Bloco A - 101
    }
  });

  const resident2 = await prisma.user.create({
    data: {
      email: 'joao@email.com',
      password: residentPassword,
      name: 'João Oliveira',
      phone: '(11) 92345-6789',
      role: 'RESIDENT',
      status: 'ACTIVE',
      condominiumId: condominium.id,
      unitId: units[2].id // Bloco A - 102
    }
  });

  const resident3 = await prisma.user.create({
    data: {
      email: 'ana@email.com',
      password: residentPassword,
      name: 'Ana Costa',
      phone: '(11) 93456-7890',
      role: 'RESIDENT',
      status: 'ACTIVE',
      condominiumId: condominium.id,
      unitId: units[1].id // Bloco B - 101
    }
  });

  console.log('✅ Moradores criados: Maria Santos, João Oliveira, Ana Costa');

  // Criar alguns comunicados
  await prisma.announcement.create({
    data: {
      title: 'Bem-vindos ao App Interfone!',
      content: 'Este é o novo sistema de interfone virtual do nosso condomínio. Agora você pode receber chamadas de visitantes diretamente no seu celular!',
      condominiumId: condominium.id,
      authorId: admin.id
    }
  });

  await prisma.announcement.create({
    data: {
      title: 'Manutenção da Piscina',
      content: 'Informamos que a piscina estará em manutenção nos dias 20 e 21 deste mês. Pedimos desculpas pelo transtorno.',
      condominiumId: condominium.id,
      authorId: janitor.id
    }
  });

  console.log('✅ Comunicados de exemplo criados');

  console.log('');
  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📋 Credenciais de teste:');
  console.log('   Admin:    admin@interfoneapp.com / admin123');
  console.log('   Zelador:  zelador@condmanus.com.br / zelador123');
  console.log('   Morador:  maria@email.com / morador123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
