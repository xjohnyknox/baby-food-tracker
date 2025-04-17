"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "./auth-context"

export default function LoginForm() {
  const { login, signup, error } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [gender, setGender] = useState<"male" | "female">("male")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (isLogin) {
        await login(username, password)
      } else {
        await signup(username, password, gender)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Card className="w-full max-w-md border-pink-200 shadow-lg">
        <CardHeader className="space-y-1 bg-gradient-to-r from-pink-100 to-purple-100 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-center text-pink-700">
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </CardTitle>
          <CardDescription className="text-center text-pink-600">
            {isLogin
              ? "Ingresa tus credenciales para acceder a tu cuenta"
              : "Crea una nueva cuenta para comenzar a usar la aplicación"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-pink-700">
                  Nombre de bebé
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa el nombre de tu bebé"
                  className="border-pink-200 focus:border-pink-400"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="text-pink-700">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="border-pink-200 focus:border-pink-400"
                  required
                />
              </div>

              {!isLogin && (
                <div className="grid gap-2">
                  <Label className="text-pink-700">Género del bebé</Label>
                  <RadioGroup
                    value={gender}
                    onValueChange={(value) => setGender(value as "male" | "female")}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="male"
                        id="male"
                        className="border-blue-300 text-blue-500 focus:ring-blue-400"
                      />
                      <Label htmlFor="male" className="text-blue-600">
                        Niño
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="female"
                        id="female"
                        className="border-pink-300 text-pink-500 focus:ring-pink-400"
                      />
                      <Label htmlFor="female" className="text-pink-600">
                        Niña
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <Button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white" disabled={isSubmitting}>
                {isSubmitting ? "Procesando..." : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" className="text-pink-600 hover:text-pink-800" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "¿No tienes una cuenta? Regístrate" : "¿Ya tienes una cuenta? Inicia sesión"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

