import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1 w-full flex flex-col items-center py-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
