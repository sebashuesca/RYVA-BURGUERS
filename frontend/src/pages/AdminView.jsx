import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ChefHat, Check, Image as ImageIcon, KeyRound, LockKeyhole, LogOut, Package, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { api, apiMessage } from '../lib/api.js'
import { money } from '../lib/format.js'
import { defaultImageForCategory } from '../lib/productImages.js'
import '../admin.css'

function blankForm(categoryId = '') {
  return { nombre: '', descripcion: '', precio_base: '', id_categoria: categoryId, disponible: false, imagen_url: '', receta: [] }
}

function ProductEditor({ editor, categories, ingredients, busy, error, onChange, onRecipeChange, onSubmit, onClose }) {
  const { form, id, recipeDirty } = editor
  const category = categories.find((item) => item.id_categoria === Number(form.id_categoria))
  const preview = form.imagen_url.trim() || defaultImageForCategory(category?.nombre_categoria)
  const canPublish = form.receta.length > 0

  return (
    <div className="admin-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
      <section className="admin-editor" role="dialog" aria-modal="true" aria-label={id ? 'Editar producto' : 'Crear producto'}>
        <div className="admin-editor-head">
          <div><span className="admin-kicker">CATÁLOGO / {id ? `PRODUCTO #${id}` : 'NUEVO PRODUCTO'}</span><h2>{id ? 'Editar producto' : 'Crear producto'}<span>.</span></h2></div>
          <button className="admin-icon-button" type="button" onClick={onClose} disabled={busy} aria-label="Cerrar formulario"><X size={20} /></button>
        </div>
        <form id="admin-product-form" onSubmit={onSubmit} className="admin-editor-body">
          <div className="admin-fields">
            <label className="admin-field">Nombre del producto<input required maxLength="120" value={form.nombre} onChange={(event) => onChange({ nombre: event.target.value })} placeholder="Ej. Riva Especial" /></label>
            <label className="admin-field">Descripción<textarea maxLength="500" rows="3" value={form.descripcion} onChange={(event) => onChange({ descripcion: event.target.value })} placeholder="Ingredientes y detalles que verá el cliente" /></label>
            <div className="admin-field-row">
              <label className="admin-field">Precio base (MXN)<input type="number" min="0" max="99999999.99" step="0.01" required value={form.precio_base} onChange={(event) => onChange({ precio_base: event.target.value })} placeholder="0.00" /></label>
              <label className="admin-field">Categoría<select required value={form.id_categoria} onChange={(event) => onChange({ id_categoria: event.target.value })}><option value="">Selecciona una</option>{categories.map((item) => <option key={item.id_categoria} value={item.id_categoria} disabled={!item.activo && item.id_categoria !== Number(form.id_categoria)}>{item.nombre_categoria}{item.activo ? '' : ' · inactiva'}</option>)}</select></label>
            </div>
            <label className="admin-field">Enlace de imagen <span>opcional</span><input type="url" maxLength="500" value={form.imagen_url} onChange={(event) => onChange({ imagen_url: event.target.value })} placeholder="https://..." /><small>Si lo dejas vacío, se usará la imagen de la categoría.</small></label>
            <label className="admin-switch-row"><input type="checkbox" checked={form.disponible} onChange={(event) => onChange({ disponible: event.target.checked })} /><span className="admin-switch-track" /><span><strong>Disponible en el menú</strong><small>Para publicarlo, agrega una receta con insumos suficientes.</small></span></label>
            {form.disponible && !canPublish && <p className="admin-inline-alert">Agrega al menos un ingrediente a la receta antes de publicar.</p>}
          </div>
          <aside className="admin-editor-side">
            <div className="admin-preview"><img src={preview} alt="Vista previa del producto" /><span><ImageIcon size={15} /> VISTA PREVIA</span></div>
            <div className="admin-recipe-head"><div><span className="admin-kicker">CONTROL DE COCINA</span><h3>Receta</h3></div><button type="button" disabled={!ingredients.length} onClick={() => onRecipeChange([...form.receta, { id_ingrediente: '', cantidad_requerida: '' }])}><Plus size={15} /> Insumo</button></div>
            <p className="admin-recipe-note">El inventario se descuenta según estas cantidades al confirmar un pedido.</p>
            <div className="admin-recipe-list">
              {form.receta.length === 0 && <p className="admin-recipe-empty">Aún no hay insumos en este producto.</p>}
              {form.receta.map((line, index) => (
                <div className="admin-recipe-line" key={index}>
                  <select aria-label={`Insumo ${index + 1}`} required value={line.id_ingrediente} onChange={(event) => onRecipeChange(form.receta.map((row, position) => position === index ? { ...row, id_ingrediente: event.target.value } : row))}>
                    <option value="">Insumo</option>
                    {ingredients.map((item) => <option key={item.id_ingrediente} value={item.id_ingrediente}>{item.nombre_insumo} ({item.unidad_medida})</option>)}
                  </select>
                  <input aria-label={`Cantidad del insumo ${index + 1}`} type="number" required min="0.001" step="0.001" value={line.cantidad_requerida} onChange={(event) => onRecipeChange(form.receta.map((row, position) => position === index ? { ...row, cantidad_requerida: event.target.value } : row))} placeholder="Cant." />
                  <button type="button" aria-label={`Quitar insumo ${index + 1}`} onClick={() => onRecipeChange(form.receta.filter((_, position) => position !== index))}><X size={17} /></button>
                </div>
              ))}
            </div>
            {id && !recipeDirty && <small className="admin-recipe-note">La receta actual solo se modifica si cambias estos insumos.</small>}
          </aside>
        </form>
        {error && <div className="admin-editor-error admin-error" role="alert">{error}</div>}
        <div className="admin-editor-actions"><button type="button" className="admin-outline-button" disabled={busy} onClick={onClose}>Cancelar</button><button className="admin-primary-button" type="submit" form="admin-product-form" disabled={busy || (form.disponible && !canPublish)}>{busy ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear producto'} <ArrowRight size={17} /></button></div>
      </section>
    </div>
  )
}

export default function AdminView() {
  const [key, setKey] = useState(() => sessionStorage.getItem('riva_admin_key') || '')
  const [keyInput, setKeyInput] = useState('')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('Todos')
  const [editor, setEditor] = useState(null)
  const [editorError, setEditorError] = useState('')
  const [editorLoading, setEditorLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadData = useCallback(async (adminKey) => {
    setLoading(true)
    try {
      const headers = { 'X-Admin-Key': adminKey }
      const [catalog, categoryList, inventory] = await Promise.all([
        api.get('/api/v1/productos/admin', { headers }),
        api.get('/api/v1/productos/categorias', { headers }),
        api.get('/api/v1/ingredientes', { headers }),
      ])
      setProducts(catalog.data)
      setCategories(categoryList.data)
      setIngredients(inventory.data)
      setError('')
    } catch (failure) {
      if (failure?.response?.status === 401) {
        sessionStorage.removeItem('riva_admin_key')
        setKey('')
        setError('Clave administrativa incorrecta. Intenta de nuevo.')
      } else {
        setError(apiMessage(failure))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (key) loadData(key) }, [key, loadData])

  const visible = useMemo(() => products.filter((product) => {
    const matchesSearch = `${product.nombre} ${product.descripcion || ''}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
    const matchesStatus = status === 'Todos' || (status === 'Disponibles' ? product.disponible : !product.disponible)
    return matchesSearch && matchesStatus
  }), [products, search, status])
  const availableCount = products.filter((product) => product.disponible).length

  function unlock(event) {
    event.preventDefault()
    const entered = keyInput.trim()
    if (!entered) return
    sessionStorage.setItem('riva_admin_key', entered)
    setKey(entered)
    setKeyInput('')
    setError('')
  }

  function logout() {
    sessionStorage.removeItem('riva_admin_key')
    setKey('')
    setProducts([])
    setEditor(null)
  }

  function openCreate() {
    const firstActive = categories.find((item) => item.activo)?.id_categoria || ''
    setEditor({ id: null, form: blankForm(firstActive), recipeDirty: false })
    setEditorError('')
    setError('')
  }

  async function openEdit(product) {
    setEditorLoading(true)
    setEditorError('')
    setError('')
    try {
      const { data: recipe } = await api.get(`/api/v1/productos/${product.id_producto}/receta`, { headers: { 'X-Admin-Key': key } })
      const category = categories.find((item) => item.id_categoria === product.id_categoria)
      const isDefault = product.imagen_url === defaultImageForCategory(category?.nombre_categoria)
      setEditor({
        id: product.id_producto,
        recipeDirty: false,
        form: {
          nombre: product.nombre,
          descripcion: product.descripcion || '',
          precio_base: String(product.precio_base),
          id_categoria: product.id_categoria,
          disponible: product.disponible,
          imagen_url: isDefault ? '' : product.imagen_url || '',
          receta: recipe.map((line) => ({ id_ingrediente: String(line.id_ingrediente), cantidad_requerida: String(line.cantidad_requerida) })),
        },
      })
    } catch (failure) {
      setError(apiMessage(failure))
    } finally {
      setEditorLoading(false)
    }
  }

  function changeForm(changes) {
    setEditor((current) => ({ ...current, form: { ...current.form, ...changes } }))
  }

  function changeRecipe(recipe) {
    setEditor((current) => ({ ...current, recipeDirty: true, form: { ...current.form, receta: recipe } }))
  }

  async function saveProduct(event) {
    event.preventDefault()
    if (!editor || busy) return
    const { form, id, recipeDirty } = editor
    setBusy(true)
    setEditorError('')
    setError('')
    setNotice('')
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio_base: Number(form.precio_base),
        id_categoria: Number(form.id_categoria),
        disponible: form.disponible,
        imagen_url: form.imagen_url.trim() || defaultImageForCategory(categories.find((item) => item.id_categoria === Number(form.id_categoria))?.nombre_categoria),
      }
      if (!id || recipeDirty) {
        payload.receta = form.receta.map((line) => ({ id_ingrediente: Number(line.id_ingrediente), cantidad_requerida: Number(line.cantidad_requerida) }))
      }
      const headers = { 'X-Admin-Key': key }
      if (id) await api.put(`/api/v1/productos/${id}`, payload, { headers })
      else await api.post('/api/v1/productos', payload, { headers })
      setEditor(null)
      setNotice(id ? 'Producto actualizado.' : 'Producto creado.')
      await loadData(key)
    } catch (failure) {
      setEditorError(apiMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return
    setDeletingId(product.id_producto)
    setError('')
    setNotice('')
    try {
      await api.delete(`/api/v1/productos/${product.id_producto}`, { headers: { 'X-Admin-Key': key } })
      setProducts((current) => current.filter((item) => item.id_producto !== product.id_producto))
      setNotice('Producto eliminado.')
    } catch (failure) {
      setError(apiMessage(failure))
    } finally {
      setDeletingId(null)
    }
  }

  if (!key) {
    return <div className="admin-auth-screen"><div className="admin-auth-card"><span className="admin-auth-mark">R<span>.</span></span><span className="admin-kicker">ACCESO ADMINISTRATIVO</span><h1>El catálogo<br />está en tus manos.</h1><p>Ingresa la clave de operación para gestionar productos y disponibilidad.</p><form onSubmit={unlock}><label className="admin-field">Clave administrativa<div className="admin-key-field"><KeyRound size={18} /><input autoFocus type="password" required value={keyInput} onChange={(event) => setKeyInput(event.target.value)} placeholder="Clave de operación" /></div></label><button className="admin-primary-button" type="submit">Entrar al panel <ArrowRight size={18} /></button></form>{error && <p className="admin-error" role="alert">{error}</p>}<small><LockKeyhole size={15} /> La clave se conserva solo durante esta sesión.</small><a href="#/kds">Volver a comandas</a></div></div>
  }

  return (
    <div className="admin-shell">
      <header className="admin-header"><div className="admin-brand"><span className="admin-brand-mark">R<span>.</span></span><div><strong>RIVA BURGUERS</strong><small>ADMINISTRACIÓN</small></div></div><nav aria-label="Panel de administración"><a href="#/kds"><ChefHat size={18} /> Comandas</a><a href="#/"><ArrowLeft size={18} /> Menú público</a><button type="button" onClick={logout} aria-label="Cerrar sesión"><LogOut size={19} /></button></nav></header>
      <main className="admin-main">
        <div className="admin-title-row"><div><span className="admin-kicker">RIVA BURGUERS / CATÁLOGO</span><h1>Productos<span>.</span></h1><p>Crea, edita y organiza lo que aparece en el menú.</p></div><button className="admin-primary-button" type="button" onClick={openCreate} disabled={!categories.some((item) => item.activo)}><Plus size={19} /> Nuevo producto</button></div>
        <div className="admin-stats"><div><span className="admin-stat-icon"><Package size={23} /></span><div><strong>{products.length}</strong><small>PRODUCTOS EN TOTAL</small></div></div><div><span className="admin-stat-icon lime"><Check size={23} /></span><div><strong>{availableCount}</strong><small>DISPONIBLES</small></div></div><div><span className="admin-stat-icon orange"><ImageIcon size={23} /></span><div><strong>{products.length - availableCount}</strong><small>FUERA DEL MENÚ</small></div></div></div>
        <section className="admin-catalog"><div className="admin-catalog-top"><div><span className="admin-kicker">GESTIÓN DE MENÚ</span><h2>Todo el catálogo</h2></div><button className="admin-refresh" type="button" onClick={() => loadData(key)} disabled={loading} aria-label="Actualizar productos"><RefreshCw size={18} className={loading ? 'spin' : ''} /></button></div><div className="admin-toolbar"><label className="admin-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar producto…" aria-label="Buscar producto" /></label><div className="admin-filters" role="group" aria-label="Filtrar por disponibilidad">{['Todos', 'Disponibles', 'No disponibles'].map((option) => <button type="button" key={option} className={status === option ? 'active' : ''} onClick={() => setStatus(option)}>{option}</button>)}</div></div>
          {error && <div className="admin-error" role="alert">{error}</div>}{notice && <div className="admin-notice" role="status"><Check size={16} /> {notice}</div>}
          {loading && !products.length ? <div className="admin-empty">Cargando productos…</div> : visible.length ? <div className="admin-product-grid">{visible.map((product) => { const category = categories.find((item) => item.id_categoria === product.id_categoria); return <article className="admin-product-card" key={product.id_producto}><div className="admin-product-image"><img src={product.imagen_url || defaultImageForCategory(category?.nombre_categoria)} alt={product.nombre} loading="lazy" /><span className={product.disponible ? 'admin-badge available' : 'admin-badge'}>{product.disponible ? 'Disponible' : 'No disponible'}</span></div><div className="admin-product-content"><span className="admin-product-category">{category?.nombre_categoria || 'Categoría inactiva'}</span><h3>{product.nombre}</h3><p>{product.descripcion || 'Sin descripción'}</p><div className="admin-product-bottom"><strong>{money(product.precio_base)}</strong><div><button type="button" aria-label={`Editar ${product.nombre}`} onClick={() => openEdit(product)} disabled={editorLoading || deletingId === product.id_producto}><Pencil size={18} /></button><button type="button" className="danger" aria-label={`Eliminar ${product.nombre}`} onClick={() => deleteProduct(product)} disabled={deletingId === product.id_producto}>{deletingId === product.id_producto ? <RefreshCw size={18} className="spin" /> : <Trash2 size={18} />}</button></div></div></div></article> })}</div> : <div className="admin-empty">No hay productos para este filtro.</div>}
        </section>
      </main>
      {editor && <ProductEditor editor={editor} categories={categories} ingredients={ingredients} busy={busy} error={editorError} onChange={changeForm} onRecipeChange={changeRecipe} onSubmit={saveProduct} onClose={() => setEditor(null)} />}
    </div>
  )
}
