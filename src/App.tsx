import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SurveyPage from './pages/SurveyPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/survey/:id" element={<SurveyPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
