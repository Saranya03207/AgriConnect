import { Link, Outlet } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { ROUTES } from '@/constants';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 text-primary font-bold text-xl">
            <Sprout className="h-7 w-7" />
            AgriConnect
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.LOGIN}
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
              
              Login
            </Link>
            <Link
              to={ROUTES.REGISTER}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AgriConnect. All rights reserved.</p>
      </footer>
    </div>);

}