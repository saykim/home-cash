import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import TransactionsPage from './pages/TransactionsPage';
import CalendarPage from './pages/CalendarPage';
import StatisticsPage from './pages/StatisticsPage';
import BudgetPage from './pages/BudgetPage';
import CardsPage from './pages/CardsPage';
import CherryPickerPage from './pages/CherryPickerPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="cards" element={<CardsPage />} />
        <Route path="cherry-picker" element={<CherryPickerPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
