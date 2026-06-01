/* eslint-disable react-refresh/only-export-components */
// src/contexts/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('baizona_theme')
    return saved === 'dark'
  })

  useEffect(() => {
    if (darkMode) {
      document.body.style.background = '#0f172a'
      localStorage.setItem('baizona_theme', 'dark')
    } else {
      document.body.style.background = '#f8fafc'
      localStorage.setItem('baizona_theme', 'light')
    }
  }, [darkMode])

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}