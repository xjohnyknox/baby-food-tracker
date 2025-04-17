"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShoppingBag,
  Trash2,
  Utensils,
  Edit,
  Apple,
  Check,
  LogOut,
  User,
  Search,
  X,
  Tag,
  AlertTriangle,
  Droplet,
  Leaf,
  Save,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AuthProvider, useAuth } from "./auth-context"
import LoginForm from "./login-form"
import { dbService } from "./db-service"
import { useToast } from "@/components/ui/use-toast"
import type { JSX } from "react"

// Types
type MealType = "breakfast" | "morningSnack" | "lunch" | "afternoonSnack" | "dinner"
type DayPlan = Record<MealType, string>
type WeekPlan = Record<number, DayPlan> // 0-6 for days of week
type GroceryItem = {
  id: string
  name: string
  purchased: boolean
}

type FoodTag = "alergeno" | "vitaminaC" | "hierro"
type FoodCategory = "proteinas" | "verduras" | "frutas" | "cereales" | "grasas"
type FoodItem = {
  id: string
  name: string
  count: number
  custom?: boolean
  tags?: FoodTag[]
}
type FoodTracking = Record<FoodCategory, FoodItem[]>

const EMPTY_MEAL: DayPlan = {
  breakfast: "",
  morningSnack: "",
  lunch: "",
  afternoonSnack: "",
  dinner: "",
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Desayuno",
  morningSnack: "Merienda (Mañana)",
  lunch: "Almuerzo",
  afternoonSnack: "Merienda (Tarde)",
  dinner: "Cena",
}

const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

const TAG_LABELS: Record<FoodTag, string> = {
  alergeno: "Alérgeno",
  vitaminaC: "Vitamina C",
  hierro: "Hierro",
}

const TAG_COLORS: Record<FoodTag, string> = {
  alergeno: "bg-amber-500 hover:bg-amber-600",
  vitaminaC: "bg-orange-500 hover:bg-orange-600",
  hierro: "bg-red-500 hover:bg-red-600",
}

const TAG_ICONS: Record<FoodTag, JSX.Element> = {
  alergeno: <AlertTriangle className="h-3 w-3 mr-1" />,
  vitaminaC: <Droplet className="h-3 w-3 mr-1" />,
  hierro: <Leaf className="h-3 w-3 mr-1" />,
}

const getInitialFoodTracking = (): FoodTracking => ({
  proteinas: [
    { id: "p1", name: "Pollo", count: 0, tags: ["hierro"] },
    { id: "p2", name: "Huevo", count: 0, tags: ["alergeno", "hierro"] },
    { id: "p3", name: "Pescado", count: 0, tags: ["alergeno", "hierro"] },
    { id: "p4", name: "Legumbres", count: 0, tags: ["hierro"] },
    { id: "p5", name: "Carne de res", count: 0, tags: ["hierro"] },
  ],
  verduras: [
    { id: "v1", name: "Zanahoria", count: 0, tags: ["vitaminaC"] },
    { id: "v2", name: "Calabaza", count: 0, tags: ["vitaminaC"] },
    { id: "v3", name: "Papa", count: 0 },
    { id: "v4", name: "Espinaca", count: 0, tags: ["hierro", "vitaminaC"] },
    { id: "v5", name: "Brócoli", count: 0, tags: ["vitaminaC", "hierro"] },
  ],
  frutas: [
    { id: "f1", name: "Manzana", count: 0, tags: ["vitaminaC"] },
    { id: "f2", name: "Pera", count: 0 },
    { id: "f3", name: "Banano", count: 0 },
    { id: "f4", name: "Papaya", count: 0, tags: ["vitaminaC"] },
    { id: "f5", name: "Mango", count: 0, tags: ["vitaminaC"] },
    { id: "f6", name: "Guayaba", count: 0, tags: ["vitaminaC"] },
    { id: "f7", name: "Durazno", count: 0, tags: ["vitaminaC"] },
    { id: "f8", name: "Ciruela", count: 0 },
    { id: "f9", name: "Fresa", count: 0, tags: ["vitaminaC", "alergeno"] },
    { id: "f10", name: "Kiwi", count: 0, tags: ["vitaminaC", "alergeno"] },
  ],
  cereales: [
    { id: "c1", name: "Arroz", count: 0 },
    { id: "c2", name: "Avena", count: 0, tags: ["hierro"] },
    { id: "c3", name: "Quinoa", count: 0, tags: ["hierro"] },
    { id: "c4", name: "Maíz", count: 0 },
    { id: "c5", name: "Trigo", count: 0, tags: ["alergeno"] },
  ],
  grasas: [
    { id: "g1", name: "Aguacate", count: 0 },
    { id: "g2", name: "Aceite de oliva", count: 0 },
    { id: "g3", name: "Aceite de coco", count: 0 },
    { id: "g4", name: "Semillas de chía", count: 0 },
    { id: "g5", name: "Mantequilla natural", count: 0 },
    { id: "g6", name: "Frutos secos", count: 0, tags: ["alergeno"] },
  ],
})

const CATEGORY_LABELS: Record<FoodCategory, string> = {
  proteinas: "Proteínas",
  verduras: "Verduras",
  frutas: "Frutas",
  cereales: "Cereales",
  grasas: "Grasas",
}

// Helper function to normalize text for search (remove accents, lowercase)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function BabyFoodApp() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({})
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([])
  const [newGroceryItem, setNewGroceryItem] = useState("")
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [editingMeal, setEditingMeal] = useState<MealType | null>(null)
  const [mealInput, setMealInput] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [foodTracking, setFoodTracking] = useState<FoodTracking>(getInitialFoodTracking())
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<FoodCategory[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [activeTagFilter, setActiveTagFilter] = useState<FoodTag | null>(null)
  const [theme, setTheme] = useState<"pink" | "blue">("pink")
  const [isSaving, setIsSaving] = useState(false)

  // Food editing states
  const [editingFood, setEditingFood] = useState<{ category: FoodCategory; food: FoodItem | null }>({
    category: "proteinas",
    food: null,
  })
  const [newFoodName, setNewFoodName] = useState("")
  const [newFoodTags, setNewFoodTags] = useState<FoodTag[]>([])
  const [foodDialogOpen, setFoodDialogOpen] = useState(false)
  const [deleteFoodConfirmOpen, setDeleteFoodConfirmOpen] = useState(false)

  // Update theme when user changes
  useEffect(() => {
    if (user && user.gender) {
      setTheme(user.gender === "female" ? "pink" : "blue")
    }
  }, [user])

  // Cargar datos desde la base de datos al iniciar
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      try {
        setDataLoaded(false)

        // Cargar plan semanal
        const savedWeekPlan = await dbService.getWeekPlan(user.username)
        if (savedWeekPlan) {
          setWeekPlan(savedWeekPlan)
        } else {
          // Inicializar plan semanal vacío si no existe
          const emptyWeek: WeekPlan = {}
          for (let i = 0; i < 7; i++) {
            emptyWeek[i] = { ...EMPTY_MEAL }
          }
          setWeekPlan(emptyWeek)
          await dbService.saveWeekPlan(user.username, emptyWeek)
        }

        // Cargar lista de compras
        const savedGroceryList = await dbService.getGroceryList(user.username)
        if (savedGroceryList) {
          setGroceryList(savedGroceryList)
        } else {
          await dbService.saveGroceryList(user.username, [])
        }

        // Cargar seguimiento de alimentos
        const savedFoodTracking = await dbService.getFoodTracking(user.username)
        if (savedFoodTracking) {
          setFoodTracking(savedFoodTracking)
        } else {
          const initialFoodTracking = getInitialFoodTracking()
          setFoodTracking(initialFoodTracking)
          await dbService.saveFoodTracking(user.username, initialFoodTracking)
        }

        setDataLoaded(true)
        toast({
          title: "Datos cargados",
          description: "Tus datos se han cargado correctamente",
          duration: 3000,
        })
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "Hubo un problema al cargar tus datos",
          variant: "destructive",
          duration: 5000,
        })
      }
    }

    loadUserData()
  }, [user, toast])

  // Guardar datos en la base de datos
  const saveData = useCallback(async () => {
    if (!user || !dataLoaded) return

    try {
      setIsSaving(true)

      // Guardar todos los datos
      await Promise.all([
        dbService.saveWeekPlan(user.username, weekPlan),
        dbService.saveGroceryList(user.username, groceryList),
        dbService.saveFoodTracking(user.username, foodTracking),
      ])

      toast({
        title: "Datos guardados",
        description: "Tus datos se han guardado correctamente",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al guardar datos:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al guardar tus datos",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }, [user, weekPlan, groceryList, foodTracking, dataLoaded, toast])

  // Guardar datos cuando cambian
  useEffect(() => {
    if (dataLoaded) {
      const saveTimer = setTimeout(() => {
        saveData()
      }, 2000) // Guardar después de 2 segundos de inactividad

      return () => clearTimeout(saveTimer)
    }
  }, [weekPlan, groceryList, foodTracking, saveData, dataLoaded])

  // Handle search term changes
  useEffect(() => {
    if (searchTerm || activeTagFilter) {
      // Expand all categories that have matching foods
      const categoriesToExpand: FoodCategory[] = []

      Object.entries(foodTracking).forEach(([category, foods]) => {
        const hasMatch = foods.some(
          (food) =>
            (searchTerm ? normalizeText(food.name).includes(normalizeText(searchTerm)) : true) &&
            (activeTagFilter ? food.tags?.includes(activeTagFilter) : true),
        )
        if (hasMatch) {
          categoriesToExpand.push(category as FoodCategory)
        }
      })

      setExpandedCategories(categoriesToExpand)
    } else {
      setExpandedCategories([])
    }
  }, [searchTerm, activeTagFilter, foodTracking])

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })

  const previousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1))
  }

  const nextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1))
  }

  const formatDayLabel = (dayOffset: number) => {
    const date = addDays(weekStart, dayOffset)
    return format(date, "EEE, d MMM", { locale: es })
  }

  const handleAddGroceryItem = () => {
    if (newGroceryItem.trim()) {
      setGroceryList([...groceryList, { id: Date.now().toString(), name: newGroceryItem, purchased: false }])
      setNewGroceryItem("")
    }
  }

  const toggleGroceryItem = (id: string) => {
    setGroceryList(groceryList.map((item) => (item.id === id ? { ...item, purchased: !item.purchased } : item)))
  }

  const removeGroceryItem = (id: string) => {
    setGroceryList(groceryList.filter((item) => item.id !== id))
  }

  const openMealEditor = (day: number, meal: MealType, isEdit = false) => {
    setEditingDay(day)
    setEditingMeal(meal)
    setMealInput(weekPlan[day]?.[meal] || "")
    setIsEditing(isEdit)
  }

  const saveMeal = async () => {
    if (editingDay !== null && editingMeal !== null) {
      const updatedWeekPlan = {
        ...weekPlan,
        [editingDay]: {
          ...weekPlan[editingDay],
          [editingMeal]: mealInput,
        },
      }
      setWeekPlan(updatedWeekPlan)

      // Guardar en la base de datos
      if (user) {
        try {
          await dbService.saveWeekPlan(user.username, updatedWeekPlan)
        } catch (error) {
          console.error("Error al guardar comida:", error)
        }
      }

      setEditingDay(null)
      setEditingMeal(null)
    }
  }

  const deleteMeal = async () => {
    if (editingDay !== null && editingMeal !== null) {
      const updatedWeekPlan = {
        ...weekPlan,
        [editingDay]: {
          ...weekPlan[editingDay],
          [editingMeal]: "",
        },
      }
      setWeekPlan(updatedWeekPlan)

      // Guardar en la base de datos
      if (user) {
        try {
          await dbService.saveWeekPlan(user.username, updatedWeekPlan)
        } catch (error) {
          console.error("Error al eliminar comida:", error)
        }
      }

      setEditingDay(null)
      setEditingMeal(null)
      setDeleteConfirmOpen(false)
    }
  }

  const incrementFoodCount = (category: FoodCategory, foodId: string) => {
    setFoodTracking({
      ...foodTracking,
      [category]: foodTracking[category].map((food) =>
        food.id === foodId ? { ...food, count: food.count + 1 } : food,
      ),
    })
  }

  const decrementFoodCount = (category: FoodCategory, foodId: string) => {
    setFoodTracking({
      ...foodTracking,
      [category]: foodTracking[category].map((food) =>
        food.id === foodId && food.count > 0 ? { ...food, count: food.count - 1 } : food,
      ),
    })
  }

  const openAddFoodDialog = (category: FoodCategory) => {
    setEditingFood({ category, food: null })
    setNewFoodName("")
    setNewFoodTags([])
    setFoodDialogOpen(true)
  }

  const openEditFoodDialog = (category: FoodCategory, food: FoodItem) => {
    setEditingFood({ category, food })
    setNewFoodName(food.name)
    setNewFoodTags(food.tags || [])
    setFoodDialogOpen(true)
  }

  const toggleFoodTag = (tag: FoodTag) => {
    if (newFoodTags.includes(tag)) {
      setNewFoodTags(newFoodTags.filter((t) => t !== tag))
    } else {
      setNewFoodTags([...newFoodTags, tag])
    }
  }

  const saveFood = async () => {
    if (!newFoodName.trim()) return

    const { category, food } = editingFood
    let updatedFoodTracking = { ...foodTracking }

    if (food) {
      // Edit existing food
      updatedFoodTracking = {
        ...foodTracking,
        [category]: foodTracking[category].map((item) =>
          item.id === food.id ? { ...item, name: newFoodName, tags: newFoodTags } : item,
        ),
      }
    } else {
      // Add new food
      const newFood: FoodItem = {
        id: `custom_${Date.now()}`,
        name: newFoodName,
        count: 0,
        custom: true,
        tags: newFoodTags.length > 0 ? newFoodTags : undefined,
      }
      updatedFoodTracking = {
        ...foodTracking,
        [category]: [...foodTracking[category], newFood],
      }
    }

    setFoodTracking(updatedFoodTracking)

    // Guardar en la base de datos
    if (user) {
      try {
        await dbService.saveFoodTracking(user.username, updatedFoodTracking)
      } catch (error) {
        console.error("Error al guardar alimento:", error)
      }
    }

    setFoodDialogOpen(false)
  }

  const openDeleteFoodConfirm = () => {
    // Cerrar el diálogo de edición antes de abrir el de confirmación
    setFoodDialogOpen(false)

    // Pequeña pausa para asegurar que el primer diálogo se cierre completamente
    setTimeout(() => {
      setDeleteFoodConfirmOpen(true)
    }, 50)
  }

  const deleteFood = async () => {
    const { category, food } = editingFood

    if (food && category) {
      console.log("Eliminando alimento:", food.name, "de categoría:", category)

      // 1. Crear una nueva copia del estado para asegurar que la actualización sea completa
      const updatedFoodTracking = { ...foodTracking }

      // 2. Filtrar el alimento a eliminar
      updatedFoodTracking[category] = updatedFoodTracking[category].filter((item) => item.id !== food.id)

      // 3. Actualizar el estado con la nueva copia
      setFoodTracking(updatedFoodTracking)

      // 4. Guardar en la base de datos
      if (user) {
        try {
          await dbService.saveFoodTracking(user.username, updatedFoodTracking)
          toast({
            title: "Alimento eliminado",
            description: `${food.name} ha sido eliminado correctamente`,
            duration: 3000,
          })
        } catch (error) {
          console.error("Error al eliminar alimento:", error)
          toast({
            title: "Error",
            description: "No se pudo eliminar el alimento",
            variant: "destructive",
            duration: 5000,
          })
        }
      }
    } else {
      console.warn("No se pudo eliminar: datos de alimento incompletos", editingFood)
    }

    // 5. Cerrar todos los diálogos y limpiar el estado
    setDeleteFoodConfirmOpen(false)
    setFoodDialogOpen(false)
    setEditingFood({ category: "proteinas", food: null })
    setNewFoodName("")
    setNewFoodTags([])
  }

  const handleLogout = async () => {
    // Asegurar que los datos se guarden antes de cerrar sesión
    try {
      await saveData()
      logout()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      logout() // Cerrar sesión de todos modos
    }
  }

  const handleAccordionValueChange = (value: string) => {
    if (value) {
      setExpandedCategories([value as FoodCategory])
    } else {
      setExpandedCategories([])
    }
  }

  // Filter foods based on search term and tag filter
  const getFilteredFoods = (category: FoodCategory) => {
    return foodTracking[category].filter((food) => {
      const matchesSearch = searchTerm ? normalizeText(food.name).includes(normalizeText(searchTerm)) : true

      const matchesTag = activeTagFilter ? food.tags?.includes(activeTagFilter) : true

      return matchesSearch && matchesTag
    })
  }

  // Check if any foods match the filters
  const hasSearchResults = Object.values(foodTracking).some((foods) =>
    foods.some((food) => {
      const matchesSearch = searchTerm ? normalizeText(food.name).includes(normalizeText(searchTerm)) : true

      const matchesTag = activeTagFilter ? food.tags?.includes(activeTagFilter) : true

      return matchesSearch && matchesTag
    }),
  )

  const toggleTagFilter = (tag: FoodTag) => {
    if (activeTagFilter === tag) {
      setActiveTagFilter(null)
    } else {
      setActiveTagFilter(tag)
    }
  }

  // Forzar guardado manual
  const handleManualSave = async () => {
    await saveData()
  }

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <Card className={`border-${theme}-200 shadow-md`}>
        <CardHeader
          className={`bg-gradient-to-r ${
            theme === "pink" ? "from-pink-100 to-purple-100" : "from-blue-100 to-cyan-100"
          } rounded-t-lg`}
        >
          <div className="flex items-center justify-between">
            <CardTitle className={`text-2xl font-bold text-${theme}-700`}>Planificador de Comidas para Bebé</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className={`h-5 w-5 text-${theme}-500`} />
                <CardDescription className={`text-${theme}-600 font-medium`}>
                  Semana del {format(weekStart, "d 'de' MMMM, yyyy", { locale: es })}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                disabled={isSaving}
                className={`text-${theme}-600 hover:text-${theme}-800 hover:bg-${theme}-50`}
              >
                {isSaving ? "Guardando..." : "Guardar"}
                <Save className="h-4 w-4 ml-1" />
              </Button>
              <div className="flex items-center space-x-2">
                <User className={`h-4 w-4 text-${theme}-600`} />
                <span className={`text-sm text-${theme}-600`}>{user?.username}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className={`text-${theme}-600 hover:text-${theme}-800 hover:bg-${theme}-50`}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="mealplan" className="w-full">
            <TabsList className={`grid w-full grid-cols-3 mb-6 bg-${theme}-50`}>
              <TabsTrigger
                value="mealplan"
                className={`data-[state=active]:bg-${theme}-200 data-[state=active]:text-${theme}-800`}
              >
                <Utensils className="h-4 w-4 mr-2" />
                Plan de Comidas
              </TabsTrigger>
              <TabsTrigger
                value="shopping"
                className={`data-[state=active]:bg-${theme}-200 data-[state=active]:text-${theme}-800`}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Lista de Compras
              </TabsTrigger>
              <TabsTrigger
                value="foodtracking"
                className={`data-[state=active]:bg-${theme}-200 data-[state=active]:text-${theme}-800`}
              >
                <Apple className="h-4 w-4 mr-2" />
                Alimentos Probados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mealplan" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousWeek}
                  className={`border-${theme}-200 text-${theme}-700 hover:bg-${theme}-50`}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextWeek}
                  className={`border-${theme}-200 text-${theme}-700 hover:bg-${theme}-50`}
                >
                  Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Table View for Meal Plan */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={`p-2 bg-${theme}-50 text-${theme}-700 text-left border border-${theme}-100`}></th>
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <th
                          key={day}
                          className={`p-2 bg-${theme}-50 text-${theme}-700 text-center border border-${theme}-100`}
                        >
                          <div className="font-medium">{DAY_LABELS[day]}</div>
                          <div className="text-xs font-normal">{formatDayLabel(day)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(MEAL_LABELS).map(([mealKey, mealLabel]) => (
                      <tr key={mealKey}>
                        <td className={`p-2 bg-${theme}-50 text-${theme}-700 font-medium border border-${theme}-100`}>
                          {mealLabel}
                        </td>
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                          <td key={`${day}-${mealKey}`} className={`p-0 border border-${theme}-100 relative`}>
                            <div className="min-h-[60px] p-2 text-sm">
                              {weekPlan[day]?.[mealKey as MealType] || (
                                <span className="text-gray-400 text-xs">Sin planificar</span>
                              )}
                            </div>
                            <div className="absolute bottom-1 right-1 flex space-x-1">
                              {weekPlan[day]?.[mealKey as MealType] && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-6 w-6 p-0 text-${theme}-600 hover:text-${theme}-800 hover:bg-${theme}-50`}
                                    onClick={() => openMealEditor(day, mealKey as MealType, true)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 w-6 p-0 text-${theme}-600 hover:text-${theme}-800 hover:bg-${theme}-50`}
                                onClick={() => openMealEditor(day, mealKey as MealType, false)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Meal Editor Dialog */}
              <Dialog
                open={editingDay !== null && editingMeal !== null}
                onOpenChange={(open) => !open && setEditingDay(null)}
              >
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className={`text-${theme}-700`}>
                      {isEditing ? "Editar" : "Añadir"} {editingMeal && MEAL_LABELS[editingMeal]} -{" "}
                      {editingDay !== null && DAY_LABELS[editingDay]}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="meal" className={`text-${theme}-700`}>
                        Detalles de la comida
                      </Label>
                      <Input
                        id="meal"
                        value={mealInput}
                        onChange={(e) => setMealInput(e.target.value)}
                        className={`border-${theme}-200 focus:border-${theme}-400`}
                        placeholder="ej. Puré de plátano con yogur"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex justify-between sm:justify-between">
                    {isEditing && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setDeleteConfirmOpen(true)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        Eliminar
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={saveMeal}
                      className={`bg-${theme}-500 hover:bg-${theme}-600 text-white`}
                    >
                      Guardar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará la comida planificada y no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteMeal} className="bg-red-500 hover:bg-red-600">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>

            <TabsContent value="shopping" className="mt-0">
              <Card className={`border-${theme}-100`}>
                <CardHeader className={`py-4 px-6 bg-${theme}-50`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-lg font-medium text-${theme}-800`}>Lista de Compras</CardTitle>
                    <CardDescription className={`text-${theme}-600`}>
                      Artículos necesarios para esta semana
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex space-x-2 mb-6">
                    <Input
                      placeholder="Añadir artículo..."
                      value={newGroceryItem}
                      onChange={(e) => setNewGroceryItem(e.target.value)}
                      className={`border-${theme}-200 focus:border-${theme}-400`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddGroceryItem()
                      }}
                    />
                    <Button
                      onClick={handleAddGroceryItem}
                      className={`bg-${theme}-500 hover:bg-${theme}-600 text-white`}
                    >
                      Añadir
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {groceryList.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Tu lista de compras está vacía. Añade artículos arriba.
                      </div>
                    ) : (
                      groceryList.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-3 rounded-md ${
                            item.purchased ? `bg-${theme}-50 opacity-60` : "bg-white"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`item-${item.id}`}
                              checked={item.purchased}
                              onCheckedChange={() => toggleGroceryItem(item.id)}
                              className={`border-${theme}-300 data-[state=checked]:bg-${theme}-500 data-[state=checked]:border-${theme}-500`}
                            />
                            <label
                              htmlFor={`item-${item.id}`}
                              className={`text-sm ${item.purchased ? "line-through text-gray-400" : "text-gray-700"}`}
                            >
                              {item.name}
                            </label>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGroceryItem(item.id)}
                            className={`text-${theme}-600 hover:text-${theme}-800 hover:bg-${theme}-50`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="foodtracking" className="mt-0">
              <Card className={`border-${theme}-100`}>
                <CardHeader className={`py-4 px-6 bg-${theme}-50`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-lg font-medium text-${theme}-800`}>Alimentos Probados</CardTitle>
                    <CardDescription className={`text-${theme}-600`}>
                      Seguimiento de alimentos que el bebé ha probado
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className={`text-sm text-${theme}-700 mb-4`}>
                    Registra los alimentos que tu bebé ha probado. Los alimentos probados 3 o más veces se destacarán.
                  </div>

                  {/* Tag Filters */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-sm text-gray-500 flex items-center">
                      <Tag className="h-4 w-4 mr-1" /> Filtrar por:
                    </span>
                    {(Object.keys(TAG_LABELS) as FoodTag[]).map((tag) => (
                      <Badge
                        key={tag}
                        variant={activeTagFilter === tag ? "default" : "outline"}
                        className={`cursor-pointer ${activeTagFilter === tag ? TAG_COLORS[tag] : "hover:bg-gray-100"}`}
                        onClick={() => toggleTagFilter(tag)}
                      >
                        {TAG_ICONS[tag]}
                        {TAG_LABELS[tag]}
                      </Badge>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar alimento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-10 pr-10 border-${theme}-200 focus:border-${theme}-400`}
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {!hasSearchResults && (searchTerm || activeTagFilter) && (
                    <div className="text-center py-4 text-gray-500">
                      No se encontraron alimentos que coincidan con los filtros aplicados.
                    </div>
                  )}

                  <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    value={expandedCategories[0]}
                    onValueChange={handleAccordionValueChange}
                  >
                    {(Object.keys(CATEGORY_LABELS) as FoodCategory[]).map((category) => {
                      const filteredFoods = getFilteredFoods(category)
                      if ((searchTerm || activeTagFilter) && filteredFoods.length === 0) return null

                      return (
                        <AccordionItem key={category} value={category} className={`border-${theme}-100`}>
                          <AccordionTrigger className={`text-${theme}-700 hover:text-${theme}-800 py-4`}>
                            <div className="flex justify-between w-full pr-4">
                              <span>{CATEGORY_LABELS[category]}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openAddFoodDialog(category)
                                }}
                                className={`h-7 border-${theme}-200 text-${theme}-600 hover:text-${theme}-800 hover:bg-${theme}-50`}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Añadir
                              </Button>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
                              {filteredFoods.map((food) => (
                                <div
                                  key={food.id}
                                  className={`flex flex-col p-3 rounded-md border ${
                                    food.count >= 3 ? "border-green-200 bg-green-50" : `border-${theme}-100`
                                  } ${
                                    searchTerm && normalizeText(food.name).includes(normalizeText(searchTerm))
                                      ? `ring-2 ring-${theme}-300`
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                      {food.count >= 3 && <Check className="h-4 w-4 text-green-500 mr-2" />}
                                      <span className="text-sm font-medium">{food.name}</span>
                                      {food.count >= 3 && (
                                        <Badge className="ml-2 bg-green-500 hover:bg-green-600">Aprobado</Badge>
                                      )}
                                      {food.custom && (
                                        <Badge
                                          variant="outline"
                                          className={`ml-2 border-${theme}-200 text-${theme}-600`}
                                        >
                                          Personalizado
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openEditFoodDialog(category, food)}
                                        className={`h-7 w-7 p-0 text-${theme}-600 hover:text-${theme}-800 hover:bg-${theme}-50`}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => decrementFoodCount(category, food.id)}
                                        disabled={food.count === 0}
                                        className={`h-7 w-7 p-0 border-${theme}-200`}
                                      >
                                        -
                                      </Button>
                                      <span className="text-sm font-medium w-5 text-center">{food.count}</span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => incrementFoodCount(category, food.id)}
                                        className={`h-7 w-7 p-0 border-${theme}-200`}
                                      >
                                        +
                                      </Button>
                                    </div>
                                  </div>

                                  {food.tags && food.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {food.tags.map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="secondary"
                                          className={`text-xs ${TAG_COLORS[tag]} text-white`}
                                        >
                                          {TAG_ICONS[tag]}
                                          {TAG_LABELS[tag]}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Food Editor Dialog */}
      <Dialog
        open={foodDialogOpen}
        onOpenChange={(open) => {
          setFoodDialogOpen(open)
          if (!open) {
            // Si se cierra sin guardar, limpiar el estado
            setTimeout(() => {
              if (!deleteFoodConfirmOpen) {
                setEditingFood({ category: "proteinas", food: null })
                setNewFoodName("")
                setNewFoodTags([])
              }
            }, 100)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`text-${theme}-700`}>
              {editingFood.food ? "Editar Alimento" : "Añadir Nuevo Alimento"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="foodName" className={`text-${theme}-700`}>
                Nombre del Alimento
              </Label>
              <Input
                id="foodName"
                value={newFoodName}
                onChange={(e) => setNewFoodName(e.target.value)}
                className={`border-${theme}-200 focus:border-${theme}-400`}
                placeholder="ej. Brócoli"
              />
            </div>

            <div className="grid gap-2">
              <Label className={`text-${theme}-700`}>Etiquetas</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TAG_LABELS) as FoodTag[]).map((tag) => (
                  <Badge
                    key={tag}
                    variant={newFoodTags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer ${newFoodTags.includes(tag) ? TAG_COLORS[tag] : "hover:bg-gray-100"}`}
                    onClick={() => toggleFoodTag(tag)}
                  >
                    {TAG_ICONS[tag]}
                    {TAG_LABELS[tag]}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            {editingFood.food && (
              <Button
                type="button"
                variant="destructive"
                onClick={openDeleteFoodConfirm}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Eliminar
              </Button>
            )}
            <Button type="button" onClick={saveFood} className={`bg-${theme}-500 hover:bg-${theme}-600 text-white`}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Food Confirmation Dialog */}
      <AlertDialog
        open={deleteFoodConfirmOpen}
        onOpenChange={(open) => {
          setDeleteFoodConfirmOpen(open)
          if (!open) {
            // Si se cierra sin confirmar, asegurarse de que todo esté limpio
            setEditingFood({ category: "proteinas", food: null })
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el alimento "{editingFood.food?.name}" y su historial de seguimiento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                deleteFood()
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-600 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <BabyFoodApp />
}

