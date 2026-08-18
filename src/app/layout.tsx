import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ToastContainer } from '@/components/common/ToastContainer';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
import { DocumentViewerDrawer } from '@/components/documents/DocumentViewerDrawer';
import { GlobalSearchModal } from '@/components/layout/GlobalSearchModal';

export const metadata: Metadata = {
  title: 'VeriSpec AI | Industrial Product Intelligence Platform',
  description: 'AI-Powered Product Intelligence for Industrial Commerce. Unify fragmented datasheets, PDFs, and supplier catalogs into verified product intelligence with human-in-the-loop validation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 flex overflow-hidden">
        <AppProvider>
          {/* Left Navigation Sidebar */}
          <Sidebar />

          {/* Main App Container */}
          <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full overflow-hidden">
            {/* Topbar */}
            <Topbar />

            {/* Scrollable Page Content */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
              <div className="max-w-7xl mx-auto space-y-6">
                {children}
              </div>
            </main>
          </div>

          {/* Global Drawers, Modals & Toast notifications */}
          <ProductDetailModal />
          <DocumentViewerDrawer />
          <GlobalSearchModal />
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}
