import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const GarageSettingsContext = createContext()

export function GarageSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    garage_name: 'AutoMedic Garage',
    phone: '+265 994 040 900',
    address: 'Area 47, Lilongwe, Malawi',
    whatsapp: '+265994040900',
    working_hours: 'Mon–Sat: 7am – 6pm',
    email: 'info@automedic.mw',
    vat_rate: 16.5,
    currency: 'MK'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/settings/garage')
      if (response.data.success) {
        setSettings(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch garage settings:', err)
      setError(err)
      // Keep default values on error
    } finally {
      setLoading(false)
    }
  }

  const refreshSettings = () => {
    fetchSettings()
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <GarageSettingsContext.Provider value={{ 
      settings, 
      loading, 
      error, 
      refreshSettings 
    }}>
      {children}
    </GarageSettingsContext.Provider>
  )
}

export function useGarageSettings() {
  const context = useContext(GarageSettingsContext)
  if (!context) {
    throw new Error('useGarageSettings must be used within a GarageSettingsProvider')
  }
  return context
}