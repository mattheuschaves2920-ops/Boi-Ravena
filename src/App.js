import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabase'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// ─── USUÁRIOS (locais — sem servidor de auth) ────────────────────────────────
const USERS = [
  { id: 1, name: 'Admin Geral',  email: 'admin@restaurante.com',   password: '1234', role: 'admin',    avatar: 'A' },
  { id: 2, name: 'Cozinheiro',   email: 'cozinha@restaurante.com', password: '1234', role: 'operador', avatar: 'C' },
  { id: 3, name: 'Gerente',      email: 'gerente@restaurante.com', password: '1234', role: 'gerente',  avatar: 'G' },
]

const CATS = ['Carnes','Laticínios','Hortifruti','Bebidas','Grãos/Cereais','Temperos','Descartáveis','Limpeza']
const ROLE_LABELS  = { admin: 'Administrador', gerente: 'Gerente', operador: 'Operador' }
const ROLE_COLORS  = { admin: '#f97316', gerente: '#6366f1', operador: '#22c55e' }
const PIE_COLORS   = ['#f97316','#6366f1','#22c55e','#ec4899','#eab308','#06b6d4','#8b5cf6','#f43f5e']

const today    = () => new Date().toISOString().split('T')[0]
const fmtDate  = d  => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'
const fmtCur   = v  => `R$ ${(+v||0).toFixed(2).replace('.',',')}`

// ─── SHARED UI ───────────────────────────────────────────────────────────────
const IS  = { flex:1, background:'#111', border:'1px solid #2a2a2a', borderRadius:6, color:'#e8e8e8', padding:'10px 14px', fontSize:13, fontFamily:"'DM Mono',monospace", outline:'none', width:'100%' }
const BP  = { background:'#f97316', color:'#000', border:'none', borderRadius:6, padding:'10px 20px', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', letterSpacing:1, whiteSpace:'nowrap' }
const BG  = { background:'transparent', color:'#888', border:'1px solid #2a2a2a', borderRadius:6, padding:'10px 16px', fontFamily:"'DM Mono',monospace", fontSize:12, cursor:'pointer' }

function Overlay({ children, onClose }) {
  return (
    <div onClick={e => e.target===e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'#0d0d0d', border:'1px solid #1e1e1e', borderRadius:14, maxHeight:'90vh', overflowY:'auto', minWidth:320, maxWidth:'95vw' }}>
        {children}
      </div>
    </div>
  )
}

function MHead({ title, color='#f97316', onClose }) {
  return (
    <div style={{ padding:'20px 28px', borderBottom:'1px solid #1a1a1a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <span style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:16, color, letterSpacing:1 }}>{title}</span>
      <button onClick={onClose} style={{ background:'none', border:'none', color:'#555', fontSize:22, cursor:'pointer' }}>×</button>
    </div>
  )
}

function Toast({ msg, type }) {
  const c = type==='err' ? '#ef4444' : type==='warn' ? '#f59e0b' : '#22c55e'
  const bg= type==='err' ? '#1a0505' : type==='warn' ? '#1a1205' : '#051a0d'
  return (
    <div style={{ position:'fixed', bottom:28, right:28, zIndex:2000, background:bg, border:`1px solid ${c}`, color:c, padding:'12px 20px', borderRadius:8, fontSize:13, fontFamily:"'DM Mono',monospace", maxWidth:340 }}>
      {msg}
    </div>
  )
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [err,   setErr]   = useState('')
  const go = () => {
    const u = USERS.find(u => u.email===email && u.password===pass)
    if (u) onLogin(u); else setErr('E-mail ou senha incorretos.')
  }
  return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Mono',monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus{border-color:#f97316!important;outline:none}.rh:hover{background:#111!important}`}</style>
      <div style={{ width:380, animation:'fadeUp 0.5s ease' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:60, height:60, background:'#f97316', borderRadius:16, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:30, marginBottom:16 }}>🍽</div>
          <h1 style={{ fontFamily:"'Syne'", fontSize:28, fontWeight:800, color:'#fff', letterSpacing:2 }}>RESTAURANTE</h1>
          <p style={{ color:'#555', fontSize:11, letterSpacing:3, marginTop:4 }}>SISTEMA DE ESTOQUE</p>
        </div>
        <div style={{ background:'#0d0d0d', border:'1px solid #1e1e1e', borderRadius:14, padding:32 }}>
          {['E-MAIL','SENHA'].map((lbl,i) => (
            <div key={lbl} style={{ marginBottom: i===0?16:24 }}>
              <label style={{ fontSize:10, letterSpacing:2, color:'#555', display:'block', marginBottom:8 }}>{lbl}</label>
              <input type={i===1?'password':'email'} value={i===0?email:pass}
                onChange={e => i===0?setEmail(e.target.value):setPass(e.target.value)}
                onKeyDown={e => e.key==='Enter' && go()}
                placeholder={i===0?'admin@restaurante.com':'••••••'}
                style={{ ...IS, width:'100%' }} />
            </div>
          ))}
          {err && <p style={{ color:'#ef4444', fontSize:12, marginBottom:16, textAlign:'center' }}>{err}</p>}
          <button onClick={go} style={{ ...BP, width:'100%', padding:13, fontSize:14 }}>ENTRAR</button>
          <div style={{ marginTop:24, padding:16, background:'#0a0a0a', borderRadius:8, border:'1px solid #1a1a1a' }}>
            <p style={{ fontSize:10, color:'#444', marginBottom:8, letterSpacing:1 }}>DEMO (senha: 1234)</p>
            {USERS.map(u => (
              <button key={u.id} onClick={() => { setEmail(u.email); setPass('1234') }}
                style={{ display:'block', background:'none', border:'none', color:'#555', fontSize:11, cursor:'pointer', padding:'3px 0', fontFamily:"'DM Mono'" }}>
                {u.email} — <span style={{ color:ROLE_COLORS[u.role] }}>{ROLE_LABELS[u.role]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,      setUser]      = useState(null)
  const [tab,       setTab]       = useState('dashboard')
  const [products,  setProducts]  = useState([])
  const [movements, setMovements] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [toast,     setToast]     = useState(null)
  const [filterDate,setFilterDate]= useState(today())
  const [editProd,  setEditProd]  = useState(null)

  const [movForm, setMovForm] = useState({ productId:'', qty:'', note:'', type:'entrada' })
  const [prodForm,setProdForm]= useState({ name:'', category:CATS[0], unit:'kg', quantity:'', min_stock:'', max_stock:'', cost:'', barcode:'', supplier:'', expiry:'' })

  // ── LOAD DATA ──
  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const [{ data: prods }, { data: movs }] = await Promise.all([
        supabase.from('produtos').select('*').order('name'),
        supabase.from('movimentos').select('*').order('created_at', { ascending:false }).limit(500),
      ])
      if (prods) setProducts(prods)
      if (movs)  setMovements(movs)
      setLoading(false)
    }
    load()

    // REALTIME — qualquer celular vê mudanças instantâneas
    const ch = supabase.channel('estoque-changes')
      .on('postgres_changes', { event:'*', schema:'public', table:'produtos' },  () => load())
      .on('postgres_changes', { event:'*', schema:'public', table:'movimentos' }, () => load())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  const showToast = (msg, type='ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const canManage = user && (user.role==='admin' || user.role==='gerente')
  const canAdmin  = user && user.role==='admin'

  // ── STATS ──
  const todayMov   = movements.filter(m => m.created_at?.startsWith(filterDate))
  const totalCost  = products.reduce((s,p) => s + p.quantity * p.cost, 0)
  const lowStock   = products.filter(p => p.quantity <= p.min_stock)
  const expiring   = products.filter(p => {
    if (!p.expiry) return false
    const diff = (new Date(p.expiry) - new Date()) / 86400000
    return diff <= 7 && diff >= 0
  })

  const last7 = useMemo(() => {
    const days = []
    for (let i=6; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i)
      const ds = d.toISOString().split('T')[0]
      const dm = movements.filter(m => m.created_at?.startsWith(ds))
      days.push({
        date: d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),
        entradas: dm.filter(m=>m.type==='entrada').reduce((s,m)=>s+m.quantity,0),
        saidas:   dm.filter(m=>m.type==='saida').reduce((s,m)=>s+m.quantity,0),
      })
    }
    return days
  }, [movements])

  const catData = useMemo(() => {
    const map = {}
    products.forEach(p => { map[p.category] = (map[p.category]||0) + p.quantity*p.cost })
    return Object.entries(map).map(([name,value]) => ({ name, value:+value.toFixed(2) }))
  }, [products])

  // ── HANDLERS ──
  const handleMovement = async () => {
    const pid = movForm.productId
    const qty = parseFloat(movForm.qty)
    if (!pid || !qty || qty<=0) return showToast('Preencha produto e quantidade válida','err')
    const product = products.find(p=>p.id===pid)
    if (!product) return
    if (movForm.type==='saida' && product.quantity < qty)
      return showToast(`Estoque insuficiente! Disponível: ${product.quantity} ${product.unit}`,'err')

    const newQty = movForm.type==='entrada' ? product.quantity+qty : product.quantity-qty

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('produtos').update({ quantity: +newQty.toFixed(3) }).eq('id', pid),
      supabase.from('movimentos').insert({
        product_id: pid, type: movForm.type, quantity: qty,
        note: movForm.note, user_name: user.name, cost_unit: product.cost,
      }),
    ])
    if (e1||e2) return showToast('Erro ao salvar. Verifique a conexão.','err')
    setMovForm({ productId:'', qty:'', note:'', type:'entrada' })
    setModal(null)
    showToast(movForm.type==='entrada' ? `✓ +${qty} ${product.unit} adicionados!` : `✓ -${qty} ${product.unit} removidos!`)
  }

  const handleSaveProd = async () => {
    if (!prodForm.name || !prodForm.quantity) return showToast('Nome e quantidade são obrigatórios','err')
    const data = { name:prodForm.name, category:prodForm.category, unit:prodForm.unit, quantity:+prodForm.quantity, min_stock:+prodForm.min_stock||0, max_stock:+prodForm.max_stock||999, cost:+prodForm.cost||0, barcode:prodForm.barcode||null, supplier:prodForm.supplier||null, expiry:prodForm.expiry||null }
    const { error } = editProd
      ? await supabase.from('produtos').update(data).eq('id', editProd)
      : await supabase.from('produtos').insert(data)
    if (error) return showToast('Erro ao salvar produto','err')
    setProdForm({ name:'', category:CATS[0], unit:'kg', quantity:'', min_stock:'', max_stock:'', cost:'', barcode:'', supplier:'', expiry:'' })
    setEditProd(null); setModal(null)
    showToast(editProd ? '✓ Produto atualizado!' : '✓ Produto cadastrado!')
  }

  const openEdit = (p) => {
    setEditProd(p.id)
    setProdForm({ name:p.name, category:p.category, unit:p.unit, quantity:String(p.quantity), min_stock:String(p.min_stock), max_stock:String(p.max_stock), cost:String(p.cost), barcode:p.barcode||'', supplier:p.supplier||'', expiry:p.expiry||'' })
    setModal('produto')
  }

  const openMovModal = (type, product=null) => {
    setMovForm({ productId: product?product.id:'', qty:'', note:'', type })
    setModal('movimento')
  }

  if (!user) return <Login onLogin={setUser} />

  const TABS = [
    { key:'dashboard', label:'PAINEL',      icon:'◈' },
    { key:'estoque',   label:'ESTOQUE',     icon:'▤' },
    { key:'movimentos',label:'MOVIMENTOS',  icon:'⇅' },
    { key:'relatorios',label:'RELATÓRIOS',  icon:'◉' },
    ...(canAdmin ? [{ key:'usuarios', label:'USUÁRIOS', icon:'◎' }] : []),
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#080808', fontFamily:"'DM Mono',monospace", color:'#e0e0e0', display:'flex', flexDirection:'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#f97316;border-radius:2px}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus{border-color:#f97316!important;outline:none}.rh:hover{background:#111!important}.ph:hover{border-color:#f97316!important}`}</style>

      {/* TOP BAR */}
      <div style={{ background:'#0a0a0a', borderBottom:'1px solid #151515', padding:'0 16px', display:'flex', alignItems:'center', height:56, gap:12, flexShrink:0, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:30, height:30, background:'#f97316', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>🍽</div>
          <span style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:14, color:'#fff', letterSpacing:2 }}>RESTAURANTE</span>
        </div>
        <div style={{ display:'flex', gap:2, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)} style={{ background:tab===t.key?'#141414':'none', border:'none', borderBottom:tab===t.key?'2px solid #f97316':'2px solid transparent', color:tab===t.key?'#f97316':'#555', padding:'18px 10px', fontFamily:"'DM Mono'", fontSize:10, letterSpacing:1.5, cursor:'pointer', whiteSpace:'nowrap' }}>{t.icon} {t.label}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
          {lowStock.length>0 && <div style={{ background:'#1a0a00', border:'1px solid #f97316', borderRadius:6, padding:'3px 10px', fontSize:10, color:'#f97316', cursor:'pointer' }} onClick={()=>setTab('estoque')}>⚠ {lowStock.length}</div>}
          <div style={{ background:ROLE_COLORS[user.role]+'22', border:`1px solid ${ROLE_COLORS[user.role]}44`, borderRadius:8, padding:'5px 10px', display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:22, height:22, background:ROLE_COLORS[user.role], borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#000' }}>{user.avatar}</div>
            <span style={{ fontSize:10, color:'#ccc' }}>{user.name.split(' ')[0]}</span>
          </div>
          <button onClick={()=>setUser(null)} style={{ ...BG, padding:'5px 10px', fontSize:10 }}>SAIR</button>
        </div>
      </div>

      {/* ACTION BAR */}
      <div style={{ background:'#0a0a0a', borderBottom:'1px solid #111', padding:'8px 16px', display:'flex', gap:8, flexShrink:0 }}>
        <button style={{ ...BP, fontSize:12, padding:'7px 14px' }} onClick={()=>openMovModal('entrada')}>+ ENTRADA</button>
        <button style={{ ...BP, background:'#ef4444', fontSize:12, padding:'7px 14px' }} onClick={()=>openMovModal('saida')}>− SAÍDA</button>
        {canManage && <button style={{ ...BG, fontSize:11 }} onClick={()=>{ setEditProd(null); setProdForm({ name:'', category:CATS[0], unit:'kg', quantity:'', min_stock:'', max_stock:'', cost:'', barcode:'', supplier:'', expiry:'' }); setModal('produto') }}>+ PRODUTO</button>}
        {loading && <span style={{ fontSize:11, color:'#555', alignSelf:'center', marginLeft:8 }}>⟳ Sincronizando...</span>}
      </div>

      {/* MAIN */}
      <div style={{ flex:1, padding:16, overflowY:'auto', animation:'fadeUp 0.3s ease' }} key={tab}>

        {/* DASHBOARD */}
        {tab==='dashboard' && <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:16 }}>
            {[
              { label:'VALOR EM ESTOQUE', val:fmtCur(totalCost),   color:'#f97316', sub:`${products.length} produtos` },
              { label:'ALERTAS ATIVOS',   val:lowStock.length+expiring.length, color:'#f59e0b', sub:`${lowStock.length} baixo · ${expiring.length} venc.` },
              { label:'ENTRADAS HOJE',    val:`+${todayMov.filter(m=>m.type==='entrada').reduce((s,m)=>s+m.quantity,0)}`, color:'#22c55e', sub:`${todayMov.filter(m=>m.type==='entrada').length} mov.` },
              { label:'SAÍDAS HOJE',      val:`-${todayMov.filter(m=>m.type==='saida').reduce((s,m)=>s+m.quantity,0)}`,  color:'#ef4444', sub:`${todayMov.filter(m=>m.type==='saida').length} mov.` },
            ].map(c => (
              <div key={c.label} style={{ background:'#0d0d0d', border:'1px solid #181818', borderLeft:`3px solid ${c.color}`, borderRadius:10, padding:14 }}>
                <div style={{ fontSize:9, color:'#555', letterSpacing:1.5, marginBottom:6 }}>{c.label}</div>
                <div style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:24, color:c.color, lineHeight:1 }}>{c.val}</div>
                <div style={{ fontSize:10, color:'#444', marginTop:5 }}>{c.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'#0d0d0d', border:'1px solid #181818', borderRadius:10, padding:16, marginBottom:16 }}>
            <p style={{ fontSize:10, letterSpacing:2, color:'#555', marginBottom:12 }}>MOVIMENTOS — 7 DIAS</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={last7} barCategoryGap="30%">
                <XAxis dataKey="date" tick={{ fill:'#444', fontSize:9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#444', fontSize:9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:'#111', border:'1px solid #222', borderRadius:6, fontSize:11 }} />
                <Bar dataKey="entradas" fill="#22c55e" radius={[3,3,0,0]} name="Entradas" />
                <Bar dataKey="saidas"   fill="#ef4444" radius={[3,3,0,0]} name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {lowStock.length>0 && (
            <div style={{ background:'#0d0d0d', border:'1px solid #2a1500', borderLeft:'3px solid #f97316', borderRadius:10, padding:16 }}>
              <p style={{ fontSize:10, letterSpacing:2, color:'#f97316', marginBottom:10 }}>⚠ ESTOQUE BAIXO</p>
              {lowStock.map(p => (
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #151515', fontSize:12 }}>
                  <span>{p.name}</span><span style={{ color:'#f97316' }}>{p.quantity}/{p.min_stock} {p.unit}</span>
                </div>
              ))}
            </div>
          )}
        </>}

        {/* ESTOQUE */}
        {tab==='estoque' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
            {products.map(p => {
              const isLow = p.quantity<=p.min_stock
              const pct   = Math.min(100,(p.quantity/(p.max_stock||1))*100)
              const isExp = p.expiry && (new Date(p.expiry)-new Date())/86400000<=7
              return (
                <div key={p.id} className="ph" style={{ background:'#0d0d0d', border:`1px solid ${isLow?'#2a1500':'#181818'}`, borderRadius:10, padding:14, transition:'border 0.2s' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <p style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:13, color:'#fff', marginBottom:2 }}>{p.name}</p>
                      <p style={{ fontSize:10, color:'#555' }}>{p.category}</p>
                    </div>
                    <div style={{ display:'flex', gap:4 }}>
                      {isLow && <span style={{ background:'#2a1000', color:'#f97316', border:'1px solid #f9731633', fontSize:8, padding:'2px 5px', borderRadius:4 }}>BAIXO</span>}
                      {isExp && <span style={{ background:'#1a1000', color:'#f59e0b', border:'1px solid #f59e0b33', fontSize:8, padding:'2px 5px', borderRadius:4 }}>VENCE</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:5, marginBottom:6 }}>
                    <span style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:26, color:isLow?'#f97316':'#fff' }}>{p.quantity}</span>
                    <span style={{ fontSize:11, color:'#666' }}>{p.unit}</span>
                    <span style={{ marginLeft:'auto', fontSize:11, color:'#22c55e' }}>{fmtCur(p.cost)}/{p.unit}</span>
                  </div>
                  <div style={{ background:'#151515', borderRadius:4, height:3, marginBottom:10, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:isLow?'#f97316':'#22c55e', borderRadius:4 }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:9, color:'#444' }}>Mín:{p.min_stock} · Máx:{p.max_stock} {p.unit}</span>
                    <div style={{ display:'flex', gap:5 }}>
                      <button style={{ ...BG, padding:'3px 10px', fontSize:11, color:'#22c55e', borderColor:'#22c55e33' }} onClick={()=>openMovModal('entrada',p)}>+</button>
                      <button style={{ ...BG, padding:'3px 10px', fontSize:11, color:'#ef4444', borderColor:'#ef444433' }} onClick={()=>openMovModal('saida',p)}>−</button>
                      {canManage && <button style={{ ...BG, padding:'3px 9px', fontSize:10 }} onClick={()=>openEdit(p)}>✎</button>}
                    </div>
                  </div>
                  {p.expiry && <p style={{ fontSize:9, color:isExp?'#f59e0b':'#444', marginTop:6 }}>Validade: {fmtDate(p.expiry)}</p>}
                </div>
              )
            })}
          </div>
        )}

        {/* MOVIMENTOS */}
        {tab==='movimentos' && <>
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{ ...IS, width:'auto', flex:'none' }} />
            <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
              <div style={{ background:'#051a0d', border:'1px solid #22c55e33', borderRadius:6, padding:'6px 12px', fontSize:11, color:'#22c55e' }}>▲ {todayMov.filter(m=>m.type==='entrada').reduce((s,m)=>s+m.quantity,0)} ent.</div>
              <div style={{ background:'#1a0505', border:'1px solid #ef444433', borderRadius:6, padding:'6px 12px', fontSize:11, color:'#ef4444' }}>▼ {todayMov.filter(m=>m.type==='saida').reduce((s,m)=>s+m.quantity,0)} saí.</div>
            </div>
          </div>
          <div style={{ background:'#0d0d0d', border:'1px solid #181818', borderRadius:10, overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:520 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #181818' }}>
                    {['HORÁRIO','PRODUTO','TIPO','QTD','USUÁRIO','OBS.'].map(h=>(
                      <th key={h} style={{ padding:'12px 14px', textAlign:'left', fontSize:9, letterSpacing:2, color:'#444', fontWeight:400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movements.filter(m=>!filterDate||m.created_at?.startsWith(filterDate)).map(m=>{
                    const p = products.find(x=>x.id===m.product_id)
                    return (
                      <tr key={m.id} className="rh" style={{ borderBottom:'1px solid #111', transition:'background 0.15s' }}>
                        <td style={{ padding:'10px 14px', color:'#555', fontSize:10 }}>{new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                        <td style={{ padding:'10px 14px', color:'#ccc' }}>{p?.name||'—'}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ background:m.type==='entrada'?'#051a0d':'#1a0505', color:m.type==='entrada'?'#22c55e':'#ef4444', border:`1px solid ${m.type==='entrada'?'#22c55e33':'#ef444433'}`, fontSize:8, padding:'3px 7px', borderRadius:4, letterSpacing:1 }}>{m.type.toUpperCase()}</span>
                        </td>
                        <td style={{ padding:'10px 14px', fontFamily:"'Syne'", fontWeight:700, fontSize:15, color:m.type==='entrada'?'#22c55e':'#ef4444' }}>{m.type==='entrada'?'+':'-'}{m.quantity}<span style={{ fontSize:9, color:'#555', fontFamily:"'DM Mono'", marginLeft:3 }}>{p?.unit}</span></td>
                        <td style={{ padding:'10px 14px' }}><span style={{ fontSize:10, color:'#666', background:'#111', padding:'2px 7px', borderRadius:4 }}>{m.user_name||'—'}</span></td>
                        <td style={{ padding:'10px 14px', color:'#555', fontSize:11 }}>{m.note||'—'}</td>
                      </tr>
                    )
                  })}
                  {movements.filter(m=>m.created_at?.startsWith(filterDate)).length===0&&(
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:'40px 0', color:'#333', fontSize:13 }}>Nenhum movimento neste dia</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* RELATÓRIOS */}
        {tab==='relatorios' && <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14, marginBottom:14 }}>
            <div style={{ background:'#0d0d0d', border:'1px solid #181818', borderRadius:10, padding:16 }}>
              <p style={{ fontSize:10, letterSpacing:2, color:'#555', marginBottom:12 }}>TENDÊNCIA 7 DIAS</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={last7}>
                  <XAxis dataKey="date" tick={{ fill:'#444', fontSize:9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#444', fontSize:9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'#111', border:'1px solid #222', borderRadius:6, fontSize:11 }} />
                  <Line type="monotone" dataKey="entradas" stroke="#22c55e" strokeWidth={2} dot={{ fill:'#22c55e', r:3 }} name="Entradas" />
                  <Line type="monotone" dataKey="saidas"   stroke="#ef4444" strokeWidth={2} dot={{ fill:'#ef4444', r:3 }} name="Saídas" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:'#0d0d0d', border:'1px solid #181818', borderRadius:10, padding:16 }}>
              <p style={{ fontSize:10, letterSpacing:2, color:'#555', marginBottom:12 }}>VALOR POR CATEGORIA</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" nameKey="name">
                    {catData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background:'#111', border:'1px solid #222', borderRadius:6, fontSize:11 }} formatter={v=>fmtCur(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background:'#0d0d0d', border:'1px solid #181818', borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #181818', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontSize:10, letterSpacing:2, color:'#555' }}>RESUMO DO ESTOQUE</p>
              <p style={{ fontSize:12, color:'#f97316', fontFamily:"'Syne'", fontWeight:800 }}>TOTAL: {fmtCur(totalCost)}</p>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:480 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #181818' }}>
                    {['PRODUTO','CAT.','QTD','CUSTO','TOTAL','STATUS'].map(h=>(
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:9, letterSpacing:2, color:'#444', fontWeight:400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...products].sort((a,b)=>(b.quantity*b.cost)-(a.quantity*a.cost)).map(p=>(
                    <tr key={p.id} className="rh" style={{ borderBottom:'1px solid #111' }}>
                      <td style={{ padding:'9px 14px' }}>{p.name}</td>
                      <td style={{ padding:'9px 14px', color:'#666', fontSize:10 }}>{p.category}</td>
                      <td style={{ padding:'9px 14px', fontFamily:"'Syne'", fontWeight:700 }}>{p.quantity} {p.unit}</td>
                      <td style={{ padding:'9px 14px', color:'#888' }}>{fmtCur(p.cost)}</td>
                      <td style={{ padding:'9px 14px', color:'#22c55e' }}>{fmtCur(p.quantity*p.cost)}</td>
                      <td style={{ padding:'9px 14px' }}>
                        <span style={{ background:p.quantity<=p.min_stock?'#2a1000':'#051a0d', color:p.quantity<=p.min_stock?'#f97316':'#22c55e', fontSize:8, padding:'3px 7px', borderRadius:4 }}>
                          {p.quantity<=p.min_stock?'BAIXO':'OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* USUÁRIOS */}
        {tab==='usuarios' && canAdmin && (
          <div style={{ background:'#0d0d0d', border:'1px solid #181818', borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'18px 20px', borderBottom:'1px solid #181818' }}>
              <p style={{ fontSize:10, letterSpacing:2, color:'#555' }}>USUÁRIOS DO SISTEMA</p>
            </div>
            {USERS.map(u=>(
              <div key={u.id} className="rh" style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', borderBottom:'1px solid #111', transition:'background 0.15s' }}>
                <div style={{ width:38, height:38, background:ROLE_COLORS[u.role], borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne'", fontWeight:800, color:'#000', fontSize:15 }}>{u.avatar}</div>
                <div style={{ flex:1 }}>
                  <p style={{ color:'#ccc', fontSize:13, marginBottom:2 }}>{u.name}</p>
                  <p style={{ color:'#555', fontSize:11 }}>{u.email}</p>
                </div>
                <span style={{ background:ROLE_COLORS[u.role]+'22', color:ROLE_COLORS[u.role], border:`1px solid ${ROLE_COLORS[u.role]}44`, fontSize:9, padding:'4px 10px', borderRadius:20, letterSpacing:1 }}>
                  {ROLE_LABELS[u.role].toUpperCase()}
                </span>
              </div>
            ))}
            <div style={{ padding:'14px 20px' }}>
              <p style={{ fontSize:10, color:'#444' }}>Admin = acesso total · Gerente = gerencia produtos e relatórios · Operador = apenas movimentos</p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL MOVIMENTO */}
      {modal==='movimento' && (
        <Overlay onClose={()=>setModal(null)}>
          <div style={{ width:400 }}>
            <MHead title={movForm.type==='entrada'?'▲ REGISTRAR ENTRADA':'▼ REGISTRAR SAÍDA'} color={movForm.type==='entrada'?'#22c55e':'#ef4444'} onClose={()=>setModal(null)} />
            <div style={{ padding:'22px 26px', display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'flex', gap:8 }}>
                {['entrada','saida'].map(t=>(
                  <button key={t} onClick={()=>setMovForm(f=>({...f,type:t}))}
                    style={{ flex:1, ...BG, color:movForm.type===t?(t==='entrada'?'#22c55e':'#ef4444'):'#666', borderColor:movForm.type===t?(t==='entrada'?'#22c55e':'#ef4444'):'#2a2a2a', background:movForm.type===t?(t==='entrada'?'#051a0d':'#1a0505'):'transparent' }}>
                    {t==='entrada'?'▲ ENTRADA':'▼ SAÍDA'}
                  </button>
                ))}
              </div>
              <div>
                <label style={{ fontSize:10, letterSpacing:2, color:'#555', display:'block', marginBottom:7 }}>PRODUTO</label>
                <select value={movForm.productId} onChange={e=>setMovForm(f=>({...f,productId:e.target.value}))} style={IS}>
                  <option value="">Selecione...</option>
                  {products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, letterSpacing:2, color:'#555', display:'block', marginBottom:7 }}>QUANTIDADE</label>
                <input type="number" min="0.001" step="0.001" placeholder="0.000" value={movForm.qty} onChange={e=>setMovForm(f=>({...f,qty:e.target.value}))} style={IS} />
              </div>
              <div>
                <label style={{ fontSize:10, letterSpacing:2, color:'#555', display:'block', marginBottom:7 }}>OBSERVAÇÃO</label>
                <input placeholder="Ex: Compra semanal..." value={movForm.note} onChange={e=>setMovForm(f=>({...f,note:e.target.value}))} style={IS} />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button style={{ ...BP, flex:1, background:movForm.type==='entrada'?'#22c55e':'#ef4444' }} onClick={handleMovement}>CONFIRMAR</button>
                <button style={{ ...BG, flex:1 }} onClick={()=>setModal(null)}>CANCELAR</button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* MODAL PRODUTO */}
      {modal==='produto' && canManage && (
        <Overlay onClose={()=>setModal(null)}>
          <div style={{ width:500 }}>
            <MHead title={editProd?'✎ EDITAR PRODUTO':'+ NOVO PRODUTO'} color="#f97316" onClose={()=>setModal(null)} />
            <div style={{ padding:'22px 26px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  { label:'NOME',            key:'name',      type:'text',   ph:'Ex: Filé Mignon', full:true },
                  { label:'QUANTIDADE',       key:'quantity',  type:'number', ph:'0' },
                  { label:'ESTOQUE MÍNIMO',   key:'min_stock', type:'number', ph:'0' },
                  { label:'ESTOQUE MÁXIMO',   key:'max_stock', type:'number', ph:'999' },
                  { label:'CUSTO (R$)',        key:'cost',      type:'number', ph:'0.00' },
                  { label:'CÓDIGO DE BARRAS', key:'barcode',   type:'text',   ph:'789...' },
                  { label:'FORNECEDOR',        key:'supplier',  type:'text',   ph:'Nome fornecedor', full:true },
                  { label:'VALIDADE',          key:'expiry',    type:'date',   ph:'' },
                ].map(f=>(
                  <div key={f.key} style={{ gridColumn:f.full?'1/-1':'auto' }}>
                    <label style={{ fontSize:10, letterSpacing:2, color:'#555', display:'block', marginBottom:7 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.ph} value={prodForm[f.key]} onChange={e=>setProdForm(p=>({...p,[f.key]:e.target.value}))} style={IS} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize:10, letterSpacing:2, color:'#555', display:'block', marginBottom:7 }}>CATEGORIA</label>
                  <select value={prodForm.category} onChange={e=>setProdForm(p=>({...p,category:e.target.value}))} style={IS}>
                    {CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, letterSpacing:2, color:'#555', display:'block', marginBottom:7 }}>UNIDADE</label>
                  <select value={prodForm.unit} onChange={e=>setProdForm(p=>({...p,unit:e.target.value}))} style={IS}>
                    {['kg','g','l','ml','un','cx','pct','fardo'].map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:18 }}>
                <button style={{ ...BP, flex:1 }} onClick={handleSaveProd}>{editProd?'SALVAR':'CADASTRAR'}</button>
                <button style={{ ...BG, flex:1 }} onClick={()=>setModal(null)}>CANCELAR</button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
