'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Category { id: string; name: string }
interface Product { id: string; name: string; description: string | null; price: number; stock: number | null; is_active: boolean; category_id: string | null }

export default function ProdutosPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', (await supabase.auth.getUser()).data.user?.id ?? '').maybeSingle()
    if (!profile?.company_id) { setError('Empresa não configurada.'); setLoading(false); return }
    const [{ data: cats, error: catError }, { data: items, error: productError }] = await Promise.all([
      supabase.from('categories').select('id,name').eq('company_id', profile.company_id).order('sort_order').order('name'),
      supabase.from('products').select('id,name,description,price,stock,is_active,category_id').eq('company_id', profile.company_id).order('created_at', { ascending: false })
    ])
    if (catError || productError) setError(catError?.message || productError?.message || 'Não foi possível carregar os produtos.')
    setCategories(cats || []); setProducts(items || []); setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addCategory(e: FormEvent) {
    e.preventDefault(); if (!newCategory.trim()) return
    setSaving(true); setError(''); setMessage('')
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', (await supabase.auth.getUser()).data.user?.id ?? '').maybeSingle()
    if (!profile?.company_id) { setError('Empresa não configurada.'); setSaving(false); return }
    const { error } = await supabase.from('categories').insert({ company_id: profile.company_id, name: newCategory.trim() })
    if (error) setError(error.code === '23505' ? 'Essa categoria já existe.' : error.message)
    else { setNewCategory(''); setMessage('Categoria criada.'); await load() }
    setSaving(false)
  }

  async function addProduct(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError(''); setMessage('')
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', (await supabase.auth.getUser()).data.user?.id ?? '').maybeSingle()
    const value = Number(price.replace(',', '.'))
    if (!profile?.company_id) setError('Empresa não configurada.')
    else if (!name.trim()) setError('Informe o nome do produto.')
    else if (!Number.isFinite(value) || value < 0) setError('Informe um preço válido.')
    else {
      const { error } = await supabase.from('products').insert({ company_id: profile.company_id, name: name.trim(), description: description.trim() || null, price: value, stock: stock === '' ? null : Math.max(0, Number.parseInt(stock, 10)), category_id: categoryId || null, is_active: true })
      if (error) setError(error.message)
      else { setName(''); setDescription(''); setPrice(''); setStock(''); setCategoryId(''); setMessage('Produto cadastrado com sucesso.'); await load() }
    }
    setSaving(false)
  }

  async function toggleProduct(product: Product) {
    const { error } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    if (error) setError(error.message); else await load()
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Excluir o produto “${product.name}”?`)) return
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) setError(error.message); else { setMessage('Produto excluído.'); await load() }
  }

  return <main className="dashboard"><section className="dashboard-main">
    <div className="dashboard-title"><div><p className="eyebrow">CATÁLOGO</p><h1>Produtos</h1><p className="muted">Cadastre o que sua empresa vende e controle o que aparece na loja.</p></div><a className="secondary-button" href="/empresa">← Voltar aos pedidos</a></div>
    {error && <div className="form-error">{error}</div>}{message && <div className="success-message">{message}</div>}
    <section className="stats-grid"><article className="stat-card"><div className="stat-label">Produtos</div><div className="stat-value">{products.length}</div></article><article className="stat-card"><div className="stat-label">Ativos</div><div className="stat-value">{products.filter(p => p.is_active).length}</div></article><article className="stat-card"><div className="stat-label">Categorias</div><div className="stat-value">{categories.length}</div></article></section>
    <section className="catalog-grid">
      <article className="panel"><h2>Novo produto</h2><form onSubmit={addProduct} className="auth-form"><label>Nome<input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: X-Burger" required /></label><label>Descrição<textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição do produto" rows={3} /></label><div className="form-row"><label>Preço<input value={price} onChange={e => setPrice(e.target.value)} placeholder="19,90" inputMode="decimal" required /></label><label>Estoque<input value={stock} onChange={e => setStock(e.target.value.replace(/\D/g, ''))} placeholder="Ilimitado" inputMode="numeric" /></label></div><label>Categoria<select value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">Sem categoria</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button className="primary-button" disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar produto'}</button></form></article>
      <article className="panel"><h2>Nova categoria</h2><form onSubmit={addCategory} className="inline-form"><input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Ex.: Lanches" /><button className="secondary-button" disabled={saving}>Adicionar</button></form><div className="category-list">{categories.length ? categories.map(c => <span key={c.id} className="category-chip">{c.name}</span>) : <p className="muted">Nenhuma categoria criada.</p>}</div></article>
    </section>
    <section className="panel"><div className="panel-header"><div><p className="eyebrow">CATÁLOGO ATUAL</p><h2>Seus produtos</h2></div></div>{loading ? <p className="muted">Carregando...</p> : products.length === 0 ? <div className="empty-order">Você ainda não cadastrou produtos.</div> : <div className="product-list">{products.map(p => <article className="product-row" key={p.id}><div><strong>{p.name}</strong><p className="muted">{p.description || 'Sem descrição'} · {categories.find(c => c.id === p.category_id)?.name || 'Sem categoria'}</p></div><div className="product-price">R$ {Number(p.price).toFixed(2).replace('.', ',')}<small>{p.stock === null ? 'Estoque livre' : `${p.stock} un.`}</small></div><div className="product-actions"><button className="secondary-button" onClick={() => toggleProduct(p)}>{p.is_active ? 'Desativar' : 'Ativar'}</button><button className="danger-button" onClick={() => deleteProduct(p)}>Excluir</button></div></article>)}</div>}</section>
  </section></main>
}
