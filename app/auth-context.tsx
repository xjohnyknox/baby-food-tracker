"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { dbService } from "./db-service"

type User = {
  username: string
  gender: "male" | "female"
}

type AuthContextType = {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  signup: (username: string, password: string, gender: "male" | "female") => Promise<boolean>
  logout: () => void
  error: string | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Inicializar y cargar usuario al inicio
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        // Intentar migrar datos de localStorage a IndexedDB (solo la primera vez)
        const migrationFlag = localStorage.getItem("dbMigrationCompleted")
        if (!migrationFlag) {
          await dbService.migrateFromLocalStorage()
          localStorage.setItem("dbMigrationCompleted", "true")
        }

        // Obtener usuario actual de la base de datos
        const currentUser = await dbService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        }
      } catch (error) {
        console.error("Error al inicializar autenticación:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    setError(null)

    // Simple validation
    if (!username || !password) {
      setError("Por favor ingresa nombre de bebé y contraseña")
      return false
    }

    try {
      // Buscar usuario en la base de datos
      const foundUser = await dbService.getUserByUsername(username)

      if (!foundUser) {
        setError("Usuario no encontrado")
        return false
      }

      if (foundUser.password !== password) {
        setError("Contraseña incorrecta")
        return false
      }

      // Login successful
      const loggedInUser = { username: foundUser.username, gender: foundUser.gender }
      setUser(loggedInUser)

      // Guardar usuario actual en la base de datos
      await dbService.setCurrentUser(loggedInUser)

      return true
    } catch (e) {
      console.error("Login error", e)
      setError("Error al iniciar sesión")
      return false
    }
  }

  const signup = async (username: string, password: string, gender: "male" | "female"): Promise<boolean> => {
    setError(null)

    // Simple validation
    if (!username || !password) {
      setError("Por favor ingresa nombre de bebé y contraseña")
      return false
    }

    // Validate username (no spaces, only alphanumeric and underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("El nombre solo puede contener letras, números y guiones bajos")
      return false
    }

    // Validate alphanumeric password
    const hasLetters = /[a-zA-Z]/.test(password)
    const hasNumbers = /[0-9]/.test(password)

    if (!hasLetters || !hasNumbers) {
      setError("La contraseña debe contener letras y números")
      return false
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return false
    }

    try {
      // Verificar si el usuario ya existe
      const existingUser = await dbService.getUserByUsername(username)
      if (existingUser) {
        setError("Este nombre ya está registrado")
        return false
      }

      // Añadir nuevo usuario
      const newUser = { username, password, gender }
      await dbService.addUser(newUser)

      // Auto login
      const loggedInUser = { username, gender }
      setUser(loggedInUser)

      // Guardar usuario actual en la base de datos
      await dbService.setCurrentUser(loggedInUser)

      // Inicializar datos de usuario
      await dbService.saveUserData(username, {
        username,
        weekPlan: {},
        groceryList: [],
        foodTracking: null,
      })

      return true
    } catch (e) {
      console.error("Signup error", e)
      setError("Error al registrarse")
      return false
    }
  }

  const logout = async () => {
    try {
      // Eliminar usuario actual de la base de datos
      await dbService.setCurrentUser(null)
      setUser(null)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, error, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

