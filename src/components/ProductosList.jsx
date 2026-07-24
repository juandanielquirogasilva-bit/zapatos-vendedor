import { useState, useEffect } from 'react'

function ProductosList({ token, onLogout }) {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [precioOfertaInputs, setPrecioOfertaInputs] = useState({})

  const cargarProductos = () => {
    setCargando(true)
    fetch('http://localhost:3001/productos')
      .then((res) => res.json())
      .then((data) => {
        setProductos(data)
        setCargando(false)
      })
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  const authFetch = (url, options = {}) =>
    fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    })

  const eliminarProducto = async (id) => {
    if (!confirm('¿Seguro que querés eliminar este producto? No se puede deshacer.')) return
    const res = await authFetch(`http://localhost:3001/productos/${id}`, { method: 'DELETE' })
    if (res.status === 401) return onLogout()
    cargarProductos()
  }

  const toggleVendido = async (producto) => {
    const res = await authFetch(`http://localhost:3001/productos/${producto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendido: !producto.vendido }),
    })
    if (res.status === 401) return onLogout()
    cargarProductos()
  }

  const activarOferta = async (producto) => {
    const precio = precioOfertaInputs[producto.id]
    if (!precio) return
    const res = await authFetch(`http://localhost:3001/productos/${producto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oferta: true, precioOferta: parseFloat(precio) }),
    })
    if (res.status === 401) return onLogout()
    setPrecioOfertaInputs({ ...precioOfertaInputs, [producto.id]: '' })
    cargarProductos()
  }

  const quitarOferta = async (producto) => {
    const res = await authFetch(`http://localhost:3001/productos/${producto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oferta: false, precioOferta: null }),
    })
    if (res.status === 401) return onLogout()
    cargarProductos()
  }

  if (cargando) {
    return <p className="text-center text-gray-400 py-8 text-sm">Cargando productos...</p>
  }

  if (productos.length === 0) {
    return <p className="text-center text-gray-400 py-8 text-sm">Todavía no cargaste ningún producto.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {productos.map((producto) => (
        <div key={producto.id} className="border rounded-lg p-3 flex gap-3">
          <img
            src={producto.imagenes?.[0]}
            alt={producto.nombre}
            className="w-16 h-16 object-cover rounded-lg shrink-0 bg-gray-100"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{producto.nombre}</p>
            <p className="text-xs text-gray-500 mb-1">
              {producto.categoria} · {producto.genero} · ${producto.precio}
            </p>

            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {producto.nuevo && (
                <span className="text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded">Nuevo</span>
              )}
              {producto.temporada && (
                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">Temporada</span>
              )}
              {producto.oferta && (
                <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded">
                  Oferta ${producto.precioOferta}
                </span>
              )}
              {producto.vendido && (
                <span className="text-[10px] bg-gray-400 text-white px-1.5 py-0.5 rounded">Vendido</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => toggleVendido(producto)}
                className="text-xs border rounded-lg px-2 py-1"
              >
                {producto.vendido ? 'Quitar vendido' : 'Marcar vendido'}
              </button>

              {producto.oferta ? (
                <button
                  onClick={() => quitarOferta(producto)}
                  className="text-xs border rounded-lg px-2 py-1"
                >
                  Quitar oferta
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="Precio oferta"
                    value={precioOfertaInputs[producto.id] || ''}
                    onChange={(e) =>
                      setPrecioOfertaInputs({ ...precioOfertaInputs, [producto.id]: e.target.value })
                    }
                    className="w-24 text-xs border rounded-lg px-2 py-1"
                  />
                  <button
                    onClick={() => activarOferta(producto)}
                    className="text-xs border rounded-lg px-2 py-1"
                  >
                    Poner en oferta
                  </button>
                </div>
              )}

              <button
                onClick={() => eliminarProducto(producto.id)}
                className="text-xs text-red-600 border border-red-200 rounded-lg px-2 py-1 ml-auto"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProductosList