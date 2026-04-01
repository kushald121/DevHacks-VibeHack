import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import ComparePage from './pages/ComparePage'
import HistoryPage from './pages/HistoryPage'
import { UiProvider } from './ui/UiProvider'

export default function App() {
  return (
    <UiProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </BrowserRouter>
    </UiProvider>
  )
}
