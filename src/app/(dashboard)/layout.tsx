import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';

import { prisma } from '@/lib/prisma';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Conta bozze reali e fatture emesse con residuo > 0
  let bozzeCount = 0;
  let daIncassareCount = 0;
  try {
    const [bozze, fattureEmesse] = await Promise.all([
      prisma.invoice.count({
        where: { stato: { in: ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'] } },
      }),
      prisma.invoice.findMany({
        where: { stato: 'EMESSA' },
        select: {
          totaleDocumento: true,
          payments: { select: { importo: true } },
        },
      }),
    ]);
    bozzeCount = bozze;
    daIncassareCount = fattureEmesse.filter((f) => {
      const tot = Number(f.totaleDocumento);
      const inc = f.payments.reduce((s, p) => s + Number(p.importo), 0);
      return tot - inc > 0.005;
    }).length;
  } catch {
    // Fallback se DB non ancora connesso
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <Sidebar
        bozzeBadge={bozzeCount}
        daIncassareBadge={daIncassareCount}
      />

      {/* Contenuto principale (offset sidebar desktop) */}
      <div className="lg:pl-64">
        <Header
          titoloPagina="Gestionale Studio"
          nomeUtente={session.user.name}
          emailUtente={session.user.email}
        />
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
