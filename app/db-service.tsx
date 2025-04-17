// Base de datos usando IndexedDB para persistencia de datos
export interface DBSchema {
  users: {
    key: string // username
    value: {
      username: string
      password: string
      gender: "male" | "female"
    }
  }
  userData: {
    key: string // username
    value: {
      weekPlan?: any
      groceryList?: any
      foodTracking?: any
      settings?: any
    }
  }
  currentUser: {
    key: string // "currentUser"
    value: {
      username: string
      gender: "male" | "female"
    } | null
  }
}

class DBService {
  private dbName = "babyFoodTracker"
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private dbReady: Promise<boolean>
  private dbReadyResolve!: (value: boolean) => void

  constructor() {
    this.dbReady = new Promise((resolve) => {
      this.dbReadyResolve = resolve
    })
    this.initDB()
  }

  private initDB(): void {
    if (!window.indexedDB) {
      console.error("Su navegador no soporta IndexedDB. Los datos no se guardarán entre sesiones.")
      this.dbReadyResolve(false)
      return
    }

    const request = window.indexedDB.open(this.dbName, this.dbVersion)

    request.onerror = (event) => {
      console.error("Error al abrir la base de datos:", event)
      this.dbReadyResolve(false)
    }

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result
      console.log("Base de datos abierta correctamente")
      this.dbReadyResolve(true)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Crear almacenes de objetos (tablas)
      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "username" })
      }

      if (!db.objectStoreNames.contains("userData")) {
        db.createObjectStore("userData", { keyPath: "username" })
      }

      if (!db.objectStoreNames.contains("currentUser")) {
        db.createObjectStore("currentUser", { keyPath: "id" })
      }
    }
  }

  // Esperar a que la base de datos esté lista
  async waitForDB(): Promise<boolean> {
    return this.dbReady
  }

  // Métodos para usuarios
  async getUsers(): Promise<any[]> {
    await this.waitForDB()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["users"], "readonly")
      const store = transaction.objectStore("users")
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = (event) => {
        console.error("Error al obtener usuarios:", event)
        reject(new Error("Error al obtener usuarios"))
      }
    })
  }

  async addUser(user: { username: string; password: string; gender: "male" | "female" }): Promise<boolean> {
    await this.waitForDB()
    if (!this.db) return false

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["users"], "readwrite")
      const store = transaction.objectStore("users")
      const request = store.add(user)

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = (event) => {
        console.error("Error al añadir usuario:", event)
        reject(new Error("Error al añadir usuario"))
      }
    })
  }

  async getUserByUsername(username: string): Promise<any | null> {
    await this.waitForDB()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["users"], "readonly")
      const store = transaction.objectStore("users")
      const request = store.get(username)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = (event) => {
        console.error("Error al obtener usuario:", event)
        reject(new Error("Error al obtener usuario"))
      }
    })
  }

  // Métodos para datos de usuario
  async getUserData(username: string): Promise<any | null> {
    await this.waitForDB()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["userData"], "readonly")
      const store = transaction.objectStore("userData")
      const request = store.get(username)

      request.onsuccess = () => {
        resolve(request.result || { username })
      }

      request.onerror = (event) => {
        console.error("Error al obtener datos de usuario:", event)
        reject(new Error("Error al obtener datos de usuario"))
      }
    })
  }

  async saveUserData(username: string, data: any): Promise<boolean> {
    await this.waitForDB()
    if (!this.db) return false

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["userData"], "readwrite")
      const store = transaction.objectStore("userData")

      // Asegurarse de que el objeto tiene el username como clave
      const dataToSave = { ...data, username }

      const request = store.put(dataToSave)

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = (event) => {
        console.error("Error al guardar datos de usuario:", event)
        reject(new Error("Error al guardar datos de usuario"))
      }
    })
  }

  // Métodos para usuario actual
  async getCurrentUser(): Promise<any | null> {
    await this.waitForDB()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["currentUser"], "readonly")
      const store = transaction.objectStore("currentUser")
      const request = store.get("currentUser")

      request.onsuccess = () => {
        resolve(request.result?.user || null)
      }

      request.onerror = (event) => {
        console.error("Error al obtener usuario actual:", event)
        reject(new Error("Error al obtener usuario actual"))
      }
    })
  }

  async setCurrentUser(user: { username: string; gender: "male" | "female" } | null): Promise<boolean> {
    await this.waitForDB()
    if (!this.db) return false

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["currentUser"], "readwrite")
      const store = transaction.objectStore("currentUser")
      const request = store.put({ id: "currentUser", user })

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = (event) => {
        console.error("Error al establecer usuario actual:", event)
        reject(new Error("Error al establecer usuario actual"))
      }
    })
  }

  // Métodos específicos para datos de la aplicación
  async saveWeekPlan(username: string, weekPlan: any): Promise<boolean> {
    try {
      const userData = await this.getUserData(username)
      return await this.saveUserData(username, { ...userData, weekPlan })
    } catch (error) {
      console.error("Error al guardar plan semanal:", error)
      return false
    }
  }

  async getWeekPlan(username: string): Promise<any | null> {
    try {
      const userData = await this.getUserData(username)
      return userData?.weekPlan || null
    } catch (error) {
      console.error("Error al obtener plan semanal:", error)
      return null
    }
  }

  async saveGroceryList(username: string, groceryList: any): Promise<boolean> {
    try {
      const userData = await this.getUserData(username)
      return await this.saveUserData(username, { ...userData, groceryList })
    } catch (error) {
      console.error("Error al guardar lista de compras:", error)
      return false
    }
  }

  async getGroceryList(username: string): Promise<any | null> {
    try {
      const userData = await this.getUserData(username)
      return userData?.groceryList || null
    } catch (error) {
      console.error("Error al obtener lista de compras:", error)
      return null
    }
  }

  async saveFoodTracking(username: string, foodTracking: any): Promise<boolean> {
    try {
      const userData = await this.getUserData(username)
      return await this.saveUserData(username, { ...userData, foodTracking })
    } catch (error) {
      console.error("Error al guardar seguimiento de alimentos:", error)
      return false
    }
  }

  async getFoodTracking(username: string): Promise<any | null> {
    try {
      const userData = await this.getUserData(username)
      return userData?.foodTracking || null
    } catch (error) {
      console.error("Error al obtener seguimiento de alimentos:", error)
      return null
    }
  }

  // Método para migrar datos de localStorage a IndexedDB
  async migrateFromLocalStorage(): Promise<boolean> {
    try {
      // Migrar usuarios
      const usersStr = localStorage.getItem("users")
      if (usersStr) {
        const users = JSON.parse(usersStr)
        for (const user of users) {
          await this.addUser(user)
        }
      }

      // Migrar usuario actual
      const currentUserStr = localStorage.getItem("user")
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr)
        await this.setCurrentUser(currentUser)
      }

      // Migrar datos de usuario
      const currentUser = await this.getCurrentUser()
      if (currentUser) {
        const username = currentUser.username

        // Migrar plan semanal
        const weekPlanStr = localStorage.getItem(`weekPlan_${username}`)
        if (weekPlanStr) {
          await this.saveWeekPlan(username, JSON.parse(weekPlanStr))
        }

        // Migrar lista de compras
        const groceryListStr = localStorage.getItem(`groceryList_${username}`)
        if (groceryListStr) {
          await this.saveGroceryList(username, JSON.parse(groceryListStr))
        }

        // Migrar seguimiento de alimentos
        const foodTrackingStr = localStorage.getItem(`foodTracking_${username}`)
        if (foodTrackingStr) {
          await this.saveFoodTracking(username, JSON.parse(foodTrackingStr))
        }
      }

      return true
    } catch (error) {
      console.error("Error al migrar datos desde localStorage:", error)
      return false
    }
  }
}

// Exportar una instancia única del servicio
export const dbService = new DBService()
// Base de datos usando IndexedDB para persistencia de datos
export interface DBSchema {
  users: {
    key: string // username
    value: {
      username: string
      password: string
      gender: "male" | "female"
    }
  }
  userData: {
    key: string // username
    value: {
      weekPlan?: any
      groceryList?: any
      foodTracking?: any
      settings?: any
    }
  }
  currentUser: {
    key: string // "currentUser"
    value: {
      username: string
      gender: "male" | "female"
    } | null
  }
}

class DBService {
  private dbName = "babyFoodTracker"
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private dbReady: Promise<boolean>
  private dbReadyResolve!: (value: boolean) => void

  constructor() {
    this.dbReady = new Promise((resolve) => {
      this.dbReadyResolve = resolve
    })
    this.initDB()
  }

  private initDB(): void {
    if (!window.indexedDB) {
      console.error("Su navegador no soporta IndexedDB. Los datos no se guardarán entre sesiones.")
      this.dbReadyResolve(false)
      return
    }

    const request = window.indexedDB.open(this.dbName, this.dbVersion)

    request.onerror = (event) => {
      console.error("Error al abrir la base de datos:", event)
      this.dbReadyResolve(false)
    }

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result
      console.log("Base de datos abierta correctamente")
      this.dbReadyResolve(true)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Crear almacenes de objetos (tablas)
      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "username" })
      }

      if (!db.objectStoreNames.contains("userData")) {
        db.createObjectStore("userData", { keyPath: "username" })
      }

      if (!db.objectStoreNames.contains("currentUser")) {
        db.createObjectStore("currentUser", { keyPath: "id" })
      }
    }
  }

  // Esperar a que la base de datos esté lista
  async waitForDB(): Promise<boolean> {
    return this.dbReady
  }

  // Métodos para usuarios
  async getUsers(): Promise<any[]> {
    await this.waitForDB()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["users"], "readonly")
      const store = transaction.objectStore("users")
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = (event) => {
        console.error("Error al obtener usuarios:", event)
        reject(new Error("Error al obtener usuarios"))
      }
    })
  }

  async addUser(user: { username: string; password: string; gender: "male" | "female" }): Promise<boolean> {
    await this.waitForDB()
    if (!this.db) return false

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["users"], "readwrite")
      const store = transaction.objectStore("users")
      const request = store.add(user)

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = (event) => {
        console.error("Error al añadir usuario:", event)
        reject(new Error("Error al añadir usuario"))
      }
    })
  }

  async getUserByUsername(username: string): Promise<any | null> {
    await this.waitForDB()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["users"], "readonly")
      const store = transaction.objectStore("users")
      const request = store.get(username)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = (event) => {
        console.error("Error al obtener usuario:", event)
        reject(new Error("Error al obtener usuario"))
      }
    })
  }

  // Métodos para datos de usuario
  async getUserData(username: string): Promise<any | null> {
    await this.waitForDB()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["userData"], "readonly")
      const store = transaction.objectStore("userData")
      const request = store.get(username)

      request.onsuccess = () => {
        resolve(request.result || { username })
      }

      request.onerror = (event) => {
        console.error("Error al obtener datos de usuario:", event)
        reject(new Error("Error al obtener datos de usuario"))
      }
    })
  }

  async saveUserData(username: string, data: any): Promise<boolean> {
    await this.waitForDB()
    if (!this.db) return false

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["userData"], "readwrite")
      const store = transaction.objectStore("userData")

      // Asegurarse de que el objeto tiene el username como clave
      const dataToSave = { ...data, username }

      const request = store.put(dataToSave)

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = (event) => {
        console.error("Error al guardar datos de usuario:", event)
        reject(new Error("Error al guardar datos de usuario"))
      }
    })
  }

  // Métodos para usuario actual
  async getCurrentUser(): Promise<any | null> {
    await this.waitForDB()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["currentUser"], "readonly")
      const store = transaction.objectStore("currentUser")
      const request = store.get("currentUser")

      request.onsuccess = () => {
        resolve(request.result?.user || null)
      }

      request.onerror = (event) => {
        console.error("Error al obtener usuario actual:", event)
        reject(new Error("Error al obtener usuario actual"))
      }
    })
  }

  async setCurrentUser(user: { username: string; gender: "male" | "female" } | null): Promise<boolean> {
    await this.waitForDB()
    if (!this.db) return false

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["currentUser"], "readwrite")
      const store = transaction.objectStore("currentUser")
      const request = store.put({ id: "currentUser", user })

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = (event) => {
        console.error("Error al establecer usuario actual:", event)
        reject(new Error("Error al establecer usuario actual"))
      }
    })
  }

  // Métodos específicos para datos de la aplicación
  async saveWeekPlan(username: string, weekPlan: any): Promise<boolean> {
    try {
      const userData = await this.getUserData(username)
      return await this.saveUserData(username, { ...userData, weekPlan })
    } catch (error) {
      console.error("Error al guardar plan semanal:", error)
      return false
    }
  }

  async getWeekPlan(username: string): Promise<any | null> {
    try {
      const userData = await this.getUserData(username)
      return userData?.weekPlan || null
    } catch (error) {
      console.error("Error al obtener plan semanal:", error)
      return null
    }
  }

  async saveGroceryList(username: string, groceryList: any): Promise<boolean> {
    try {
      const userData = await this.getUserData(username)
      return await this.saveUserData(username, { ...userData, groceryList })
    } catch (error) {
      console.error("Error al guardar lista de compras:", error)
      return false
    }
  }

  async getGroceryList(username: string): Promise<any | null> {
    try {
      const userData = await this.getUserData(username)
      return userData?.groceryList || null
    } catch (error) {
      console.error("Error al obtener lista de compras:", error)
      return null
    }
  }

  async saveFoodTracking(username: string, foodTracking: any): Promise<boolean> {
    try {
      const userData = await this.getUserData(username)
      return await this.saveUserData(username, { ...userData, foodTracking })
    } catch (error) {
      console.error("Error al guardar seguimiento de alimentos:", error)
      return false
    }
  }

  async getFoodTracking(username: string): Promise<any | null> {
    try {
      const userData = await this.getUserData(username)
      return userData?.foodTracking || null
    } catch (error) {
      console.error("Error al obtener seguimiento de alimentos:", error)
      return null
    }
  }

  // Método para migrar datos de localStorage a IndexedDB
  async migrateFromLocalStorage(): Promise<boolean> {
    try {
      // Migrar usuarios
      const usersStr = localStorage.getItem("users")
      if (usersStr) {
        const users = JSON.parse(usersStr)
        for (const user of users) {
          await this.addUser(user)
        }
      }

      // Migrar usuario actual
      const currentUserStr = localStorage.getItem("user")
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr)
        await this.setCurrentUser(currentUser)
      }

      // Migrar datos de usuario
      const currentUser = await this.getCurrentUser()
      if (currentUser) {
        const username = currentUser.username

        // Migrar plan semanal
        const weekPlanStr = localStorage.getItem(`weekPlan_${username}`)
        if (weekPlanStr) {
          await this.saveWeekPlan(username, JSON.parse(weekPlanStr))
        }

        // Migrar lista de compras
        const groceryListStr = localStorage.getItem(`groceryList_${username}`)
        if (groceryListStr) {
          await this.saveGroceryList(username, JSON.parse(groceryListStr))
        }

        // Migrar seguimiento de alimentos
        const foodTrackingStr = localStorage.getItem(`foodTracking_${username}`)
        if (foodTrackingStr) {
          await this.saveFoodTracking(username, JSON.parse(foodTrackingStr))
        }
      }

      return true
    } catch (error) {
      console.error("Error al migrar datos desde localStorage:", error)
      return false
    }
  }
}

// Exportar una instancia única del servicio
export const dbService = new DBService()

