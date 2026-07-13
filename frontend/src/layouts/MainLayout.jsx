import { Outlet } from 'react-router-dom';
import FloatingNav from '../components/FloatingNav';
import Chatbot from '../components/Chatbot';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <div className="app-main">
        <main className="content" style={{ paddingTop: '80px', paddingBottom: '20px' }}>
          <Outlet />
        </main>
      </div>
      <FloatingNav />
      {user?.role !== 'admin' && <Chatbot />}
    </div>
  );
};

export default MainLayout;
