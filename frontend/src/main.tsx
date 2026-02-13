import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Store from './redux/Store/index.ts'
import { Provider } from 'react-redux'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <Provider store={Store}>
      <App />
    </Provider>
  // </StrictMode>,
)
