import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import EntryPage from './pages/EntryPage';
import CallPage from './pages/CallPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página inicial */}
        <Route path="/" element={<WelcomePage />} />
        
        {/* Entrada via QR Code */}
        <Route path="/unit/:qrCode" element={<EntryPage />} />
        <Route path="/v/:qrCode" element={<EntryPage />} />
        
        {/* Tela de chamada */}
        <Route path="/call/:residentId" element={<CallPage />} />
        
        {/* Fallback */}
        <Route path="*" element={<WelcomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
