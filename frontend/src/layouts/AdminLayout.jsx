import { Outlet } from 'react-router-dom';

/**
 * AdminLayout – admin-specific shell with wider nav options.
 * Will include admin sidebar in later phases.
 */
export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* TODO Phase 10: <AdminSidebar /> */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>);

}