import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import InvitePage from './pages/InvitePage';
import GroupPage from './pages/GroupPage';
import ExpenseDetailsPage from './pages/ExpenseDetailsPage';
import { AuthGuard } from './components/AuthGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<AuthGuard />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/groups/:id" element={<GroupPage />} />
          <Route path="/groups/:groupId/expenses/:expenseId" element={<ExpenseDetailsPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
