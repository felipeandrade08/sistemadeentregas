'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Company { id: string; name: string; slug: string; phone: string | null; logo_url: string | null; address: string | null }
interface Category { id: string; name: string; sort_order: number }
interface Product { id: string; category_id: string | null; name: string; description: string | null; image_url: string | null; price: number; stock: number | null }
interface CartItem { product: Product; quantity: number }

export default function LojaPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const [company, setCompany] = useState<Company | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<{ orderNumber: number; total: number } | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [reference, setReference] = useState('')
  const [distance, setDistance] = useState('')
  const [payment, setPayment] = useState<'pix' | 'cash' | 'card'>('pix')
  const [notes, setNotes] = useState('')
  const [delivery, setDelivery] = useState<{ pricing_type: 'fixed' | 'per_km'; fixed_fee: number; price_per_km: number; minimum_fee: number; max_distance_km: number | null; free_delivery_minimum: number | null } | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true); setError('')
      const { data: foundCompany, error: companyError } = await supabase.from('companies').select('id,name,slug,phone,logo_url,address').eq('slug', params.slug).eq('is_active', true).maybeSingle()
      if (companyError || !foundCompany) { setError('Esta loja não foi encontrada ou está temporariamente indisponível.'); setLoading(false); return }
      setCompany(foundCompany)
      const [{ data: cats, error: catError }, { data: items, error: productError }, { data: settings }] = await Promise.all([
        supabase.from('categories').select('id,name,sort_order').eq('company_id', foundCompany.id).eq('is_active', true).order('sort_order').order('name'),
        supabase.from('products').select('id,category_id,name,description,image_url,price,stock').eq('company_id', foundCompany.id).eq('is_active', true).order('name'),
        supabase.from('delivery_settings').select('pricing_type,fixed_fee,price_per_km,minimum_fee,max_distance_km,free_delivery_minimum').eq('company_id', foundCompany.id).maybeSingle()
      ])
      if (catError || productError) setError('Não foi possível carregar o catálogo.')
      setCategories(cats || []); setProducts(items || []); setDelivery(settings || null); setLoading(false)
    }
    load()
  }, [params.slug])

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0), [cart])
  const deliveryFee = useMemo(() => {
    if (!delivery) return 0
    if (delivery.free_delivery_minimum !== null && subtotal >= Number(delivery.free_delivery_minimum)) return 0
    if (delivery.pricing_type === 'fixed') return Math.max(Number(delivery.minimum_fee), Number(delivery.fixed_fee))
    const km = Number(distance.replace(',', '.'))
    if (!Number.isFinite(km) || km < 0) return Number(delivery.minimum_fee)
    return Math.max(Number(delivery.minimum_fee), km * Number(delivery.price_per_km))
  }, [delivery, subtotal, distance])
  const total = subtotal + deliveryFee
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  function add(product: Product) {
    setCart(current => {
      const existing = current.find(item => item.product.id === product.id)
      const max = product.stock === null ? 999 : Math.max(0, product.stock)
      if (max === 0) return current
      if (existing) return current.map(item => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, max) } : item)
      return [...current, { product, quantity: 1 }]
    })
  }
  function changeQuantity(productId: string, delta: number) {
    setCart(current => current.flatMap(item => {
      if (item.product.id !== productId) return [item]
      const max = item.product.stock === null ? 999 : item.product.stock
      const quantity = Math.min(max, item.quantity + delta)
      return quantity <= 0 ? [] : [{ ...item, quantity }]
    }))
  }

  function openCheckout() {
    setError('')
    if (!cart.length) return setError('Adicione pelo menos um produto ao carrinho.')
    setCheckoutOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!company || !cart.length) return
    setSending(true); setError('')
    const km = distance.trim() === '' ? null : Number(distance.replace(',', '.'))
    if (delivery?.pricing_type === 'per_km' && (km === null || !Number.isFinite(km) || km < 0)) {
      setError('Informe a distância aproximada da entrega em km.'); setSending(false); return
    }
    if (delivery && delivery.max_distance_km !== null && km !== null && km > Number(delivery.max_distance_km)) {
      setError(`A loja atende entregas de até ${Number(delivery.max_distance_km).toFixed(1).replace('.', ',')} km.`); setSending(false); return
    }
    const { data, error: orderError } = await supabase.rpc('create_public_order', {
      p_company_id: company.id,
      p_customer: { name, phone },
      p_address: { street, number, complement, neighborhood, city, state, postal_code: postalCode, reference },
      p_items: cart.map(item => ({ product_id: item.product.id, quantity: item.quantity })),
      p_payment_method: payment,
      p_notes: notes,
      p_distance_km: km
    })
    if (orderError) setError(orderError.message)
    else {
      setSuccess({ orderNumber: Number(data.order_number), total: Number(data.total) })
      setCart([]); setCheckoutOpen(false)
    }
    setSending(false)
  }

  if (loading) return <main className="store-page"><div className="store-shell"><div className="store-loading">Carregando loja...</div></div></main>
  if (!company) return <main className="store-page"><div className="store-shell"><div className="store-error"><h1>Loja indisponível</h1><p>{error}</p></div></div></main>

  return <main className="store-page">
    <header className="store-header">
      <div className="store-shell store-header-inner">
        <div className="store-brand">
          {company.logo_url ? <img src={company.logo_url} alt={company.name} /> : <span>{company.name.charAt(0).toUpperCase()}</span>}
          <div><strong>{company.name}</strong><small>{company.address || 'Faça seu pedido online'}</small></div>
        </div>
        <button className="store-cart-button" onClick={openCheckout}>🛒 Carrinho <b>{cartCount}</b></button>
      </div>
    </header>

    <div className="store-shell">
      {success && <section className="store-success"><div className="success-icon">✓</div><h1>Pedido recebido!</h1><p>Seu pedido <strong>#{success.orderNumber}</strong> foi enviado para {company.name}.</p><div className="success-total">Total: R$ {success.total.toFixed(2).replace('.', ',')}</div><button className="primary-button" onClick={() => setSuccess(null)}>Fazer novo pedido</button></section>}
      {!success && !checkoutOpen && <>
        <section className="store-hero"><p className="eyebrow">LOJA ONLINE</p><h1>Peça pelo celular.<br />Receba em casa.</h1><p>Escolha seus produtos, confirme o endereço e acompanhe seu pedido com praticidade.</p></section>
        {error && <div className="form-error">{error}</div>}
        {categories.length === 0 && products.length === 0 ? <div className="store-empty">Esta loja ainda não possui produtos disponíveis.</div> : <section className="store-catalog">
          {categories.length ? categories.map(category => {
            const items = products.filter(p => p.category_id === category.id)
            if (!items.length) return null
            return <div className="store-category" key={category.id}><h2>{category.name}</h2><div className="store-products">{items.map(product => <ProductCard key={product.id} product={product} onAdd={add} />)}</div></div>
          }) : null}
          {products.filter(p => !p.category_id).length > 0 && <div className="store-category"><h2>Outros</h2><div className="store-products">{products.filter(p => !p.category_id).map(product => <ProductCard key={product.id} product={product} onAdd={add} />)}</div></div>}
        </section>}
      </>}

      {!success && checkoutOpen && <section className="checkout-layout">
        <div className="checkout-form panel"><button className="back-link" onClick={() => setCheckoutOpen(false)}>← Voltar ao catálogo</button><p className="eyebrow">FINALIZAR PEDIDO</p><h1>Onde vamos entregar?</h1><form onSubmit={submitOrder} className="auth-form">
          <div className="form-row"><label>Nome<input value={name} onChange={e => setName(e.target.value)} required placeholder="Seu nome" /></label><label>WhatsApp<input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="(00) 00000-0000" /></label></div>
          <div className="form-row"><label>CEP<input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="00000-000" /></label><label>Número<input value={number} onChange={e => setNumber(e.target.value)} required placeholder="123" /></label></div>
          <label>Rua<input value={street} onChange={e => setStreet(e.target.value)} required placeholder="Rua / Avenida" /></label>
          <div className="form-row"><label>Bairro<input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Bairro" /></label><label>Cidade<input value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade" /></label></div>
          <div className="form-row"><label>Complemento<input value={complement} onChange={e => setComplement(e.target.value)} placeholder="Apto, casa, bloco..." /></label><label>Estado<input value={state} onChange={e => setState(e.target.value)} placeholder="UF" maxLength={2} /></label></div>
          <label>Referência<input value={reference} onChange={e => setReference(e.target.value)} placeholder="Ex.: perto da praça" /></label>
          {delivery?.pricing_type === 'per_km' && <label>Distância aproximada (km)<input value={distance} onChange={e => setDistance(e.target.value.replace(/[^0-9,.]/g, ''))} inputMode="decimal" placeholder="Ex.: 4,5" required /><small className="muted">Usada para calcular a taxa de entrega.</small></label>}
          <label>Forma de pagamento<select value={payment} onChange={e => setPayment(e.target.value as 'pix' | 'cash' | 'card')}><option value="pix">PIX</option><option value="card">Cartão</option><option value="cash">Dinheiro</option></select></label>
          <label>Observações<textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Alguma observação para o pedido?" /></label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button" disabled={sending}>{sending ? 'Enviando pedido...' : 'Confirmar pedido'}</button>
        </form></div>
        <aside className="checkout-summary panel"><p className="eyebrow">SEU PEDIDO</p><h2>{company.name}</h2>{cart.map(item => <div className="summary-item" key={item.product.id}><div><strong>{item.quantity}x {item.product.name}</strong><small>R$ {Number(item.product.price).toFixed(2).replace('.', ',')} cada</small></div><div className="summary-controls"><button onClick={() => changeQuantity(item.product.id, -1)}>−</button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.product.id, 1)}>+</button></div></div>)}<div className="summary-total"><span>Subtotal</span><strong>R$ {subtotal.toFixed(2).replace('.', ',')}</strong></div><div className="summary-total"><span>Entrega</span><strong>{deliveryFee === 0 ? 'GRÁTIS' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}</strong></div><div className="summary-grand"><span>Total</span><strong>R$ {total.toFixed(2).replace('.', ',')}</strong></div></aside>
      </section>}
    </div>
  </main>
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  const unavailable = product.stock !== null && product.stock <= 0
  return <article className={`store-product ${unavailable ? 'is-unavailable' : ''}`}>
    <div className="product-image">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <span>{product.name.charAt(0).toUpperCase()}</span>}</div>
    <div className="product-content"><h3>{product.name}</h3><p>{product.description || 'Produto da casa'}</p><div className="product-bottom"><strong>R$ {Number(product.price).toFixed(2).replace('.', ',')}</strong><button className="primary-button" disabled={unavailable} onClick={() => onAdd(product)}>{unavailable ? 'Esgotado' : '+ Adicionar'}</button></div></div>
  </article>
}
