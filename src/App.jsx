import { useState } from 'react'
import ProductosList from './components/ProductosList'

function App() {
  const [token, setToken] = useState(localStorage.getItem('vendorToken') || '')
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')
  const [validando, setValidando] = useState(false)
  const [vista, setVista] = useState('formulario')

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: 'deportivo',
    genero: 'Hombre',
    nuevo: false,
    temporada: false,
  })
  const [archivos, setArchivos] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorLogin('')
    setValidando(true)
    try {
      const res = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) throw new Error('Contraseña incorrecta')
      const data = await res.json()
      localStorage.setItem('vendorToken', data.token)
      setToken(data.token)
    } catch (err) {
      setErrorLogin('❌ Contraseña incorrecta')
    } finally {
      setValidando(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('vendorToken')
    setToken('')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleArchivos = (e) => {
    setArchivos([...e.target.files])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (archivos.length === 0) {
      setMensaje('❌ Agregá al menos una foto')
      return
    }

    try {
      setSubiendo(true)

      // 1. Subir las fotos
      const formData = new FormData()
      archivos.forEach((archivo) => formData.append('fotos', archivo))

      const resUpload = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (resUpload.status === 401) {
        handleLogout()
        setMensaje('❌ Tu sesión expiró, volvé a iniciar sesión')
        return
      }

      const { urls } = await resUpload.json()

      // 2. Crear el producto con las URLs que devolvió el servidor
      const res = await fetch('http://localhost:3001/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: form.nombre,
          descripcion: form.descripcion,
          precio: form.precio,
          categoria: form.categoria,
          genero: form.genero,
          nuevo: form.nuevo,
          temporada: form.temporada,
          imagenes: urls,
        }),
      })

      if (res.status === 401) {
        handleLogout()
        setMensaje('❌ Tu sesión expiró, volvé a iniciar sesión')
        return
      }

      if (!res.ok) throw new Error('Error al guardar')

      setMensaje('✅ Producto agregado correctamente')
      setForm({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: 'deportivo',
        genero: 'Hombre',
        nuevo: false,
        temporada: false,
      })
      setArchivos([])
      e.target.reset()
    } catch (err) {
      setMensaje('❌ Hubo un error al guardar el producto')
    } finally {
      setSubiendo(false)
    }
  }

  // Pantalla de login: se muestra si todavía no hay token guardado
  if (!token) {
    return (
      <div className="max-w-sm mx-auto p-4 mt-20">
        <h1 className="text-xl font-bold mb-4 text-center">AFJ Calzados — Panel del vendedor</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            className="border rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            disabled={validando}
            className="bg-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {validando ? 'Entrando...' : 'Entrar'}
          </button>
          {errorLogin && <p className="text-center text-sm text-red-600">{errorLogin}</p>}
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">AFJ Calzados — Panel del vendedor</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 underline shrink-0 ml-2"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="flex gap-2 mb-4 border-b">
        <button
          onClick={() => setVista('formulario')}
          className={`px-3 py-2 text-sm font-medium border-b-2 ${
            vista === 'formulario' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400'
          }`}
        >
          Nuevo producto
        </button>
        <button
          onClick={() => setVista('lista')}
          className={`px-3 py-2 text-sm font-medium border-b-2 ${
            vista === 'lista' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400'
          }`}
        >
          Productos
        </button>
      </div>

      {vista === 'lista' ? (
        <ProductosList token={token} onLogout={handleLogout} />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre del producto"
            value={form.nombre}
            onChange={handleChange}
            required
            className="border rounded-lg px-3 py-2"
          />

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={form.descripcion}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
            rows={3}
          />

          <input
            type="number"
            name="precio"
            placeholder="Precio"
            value={form.precio}
            onChange={handleChange}
            required
            className="border rounded-lg px-3 py-2"
          />

          <select
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="deportivo">Deportivo</option>
            <option value="formal">Formal</option>
            <option value="sandalia">Sandalia</option>
            <option value="bota">Bota</option>
          </select>

          <select
            name="genero"
            value={form.genero}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="Hombre">Hombre</option>
            <option value="Mujer">Mujer</option>
            <option value="Niños">Niños</option>
            <option value="Unisex">Unisex</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="nuevo"
              checked={form.nuevo}
              onChange={handleChange}
            />
            Marcar como "Nuevo"
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="temporada"
              checked={form.temporada}
              onChange={handleChange}
            />
            Marcar como "De Temporada"
          </label>

          <div className="border rounded-lg p-3">
            <p className="text-sm font-semibold mb-2">Fotos del producto (hasta 5)</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleArchivos}
              className="text-sm"
            />
            {archivos.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">{archivos.length} foto(s) seleccionada(s)</p>
            )}
          </div>

          <button
            type="submit"
            disabled={subiendo}
            className="bg-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {subiendo ? 'Guardando...' : 'Guardar producto'}
          </button>

          {mensaje && <p className="text-center text-sm">{mensaje}</p>}
        </form>
      )}
    </div>
  )
}

export default App