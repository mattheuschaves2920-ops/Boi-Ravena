import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabase'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const USERS = [
  { id: 1, name: 'Admin Geral',  email: 'admin@restaurante.com',   password: '1234', role: 'admin',    avatar: 'A' },
  { id: 2, name: 'Cozinheiro',   email: 'cozinha@restaurante.com', password: '1234', role: 'operador', avatar: 'C' },
  { id: 3, name: 'Gerente',      email: 'gerente@restaurante.com', password: '1234', role: 'gerente',  avatar: 'G' },
]
const CATS = ['Carnes','Laticínios','Hortifruti','Bebidas','Grãos/Cereais','Temperos','Descartáveis','Limpeza']
const ROLE_LABELS = { admin:'Administrador', gerente:'Gerente', operador:'Operador' }
const PIE_COLORS = ['#EA1D2C','#FF6B6B','#FF8C00','#FFB347','#28a745','#17a2b8','#6f42c1','#fd7e14']

const today = () => new Date().toISOString().split('T')[0]
const fmtDate = d => d ? new Date(d+'T00:00:00').toLocaleDateString('pt-BR') : '—'
const fmtCur = v => `R$ ${(+v||0).toFixed(2).replace('.',',')}`

// ─── ESTILOS IFOOD ─────────────────────────────────────────────
const C = {
  red: '#EA1D2C', redDark: '#C8111F', redLight: '#FFF0F1',
  gray: '#F2F2F2', grayMid: '#DCDCDC', grayDark: '#717171',
  text: '#3E3E3E', white: '#FFFFFF', green: '#50A773', orange: '#FF8C00',
}

const styles = {
  input: {
    width:'100%', background:C.white, border:`1.5px solid ${C.grayMid}`,
    borderRadius:12, color:C.text, padding:'12px 16px', fontSize:14,
    fontFamily:"'Nunito',sans-serif", outline:'none', transition:'border 0.2s',
  },
  btnRed: {
    background:C.red, color:C.white, border:'none', borderRadius:12,
    padding:'12px 24px', fontFamily:"'Nunito',sans-serif", fontWeight:800,
    fontSize:14, cursor:'pointer', transition:'all 0.2s', whiteSpace:'nowrap',
  },
  btnWhite: {
    background:C.white, color:C.red, border:`2px solid ${C.red}`, borderRadius:12,
    padding:'10px 20px', fontFamily:"'Nunito',sans-serif", fontWeight:700,
    fontSize:13, cursor:'pointer', transition:'all 0.2s',
  },
  btnGray: {
    background:C.gray, color:C.grayDark, border:'none', borderRadius:12,
    padding:'10px 18px', fontFamily:"'Nunito',sans-serif", fontWeight:600,
    fontSize:13, cursor:'pointer',
  },
  card: {
    background:C.white, borderRadius:16, padding:20,
    boxShadow:'0 2px 8px rgba(0,0,0,0.08)', border:`1px solid ${C.grayMid}`,
  },
}

function Overlay({ children, onClose }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
      <div style={{background:C.white,borderRadius:20,maxHeight:'90vh',overflowY:'auto',width:'100%',maxWidth:480,boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
        {children}
      </div>
    </div>
  )
}

function MHead({ title, onClose, color }) {
  return (
    <div style={{padding:'20px 24px',borderBottom:`1px solid ${C.grayMid}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <span style={{fontFamily:"'Nunito'",fontWeight:900,fontSize:18,color:color||C.red}}>{title}</span>
      <button onClick={onClose} style={{background:C.gray,border:'none',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:18,color:C.grayDark,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
    </div>
  )
}

function Toast({ msg, type }) {
  const bg = type==='err' ? C.red : type==='warn' ? C.orange : C.green
  return (
    <div style={{position:'fixed',bottom:24,right:24,zIndex:2000,background:bg,color:C.white,padding:'14px 22px',borderRadius:14,fontSize:14,fontFamily:"'Nunito',sans-serif",fontWeight:700,boxShadow:'0 4px 20px rgba(0,0,0,0.2)',maxWidth:320}}>
      {msg}
    </div>
  )
}

// ─── LOGIN ───────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email,setEmail]=useState('')
  const [pass,setPass]=useState('')
  const [err,setErr]=useState('')
  const go=()=>{
    const u=USERS.find(u=>u.email===email&&u.password===pass)
    if(u) onLogin(u); else setErr('E-mail ou senha incorretos.')
  }
  return (
    <div style={{minHeight:'100vh',background:C.gray,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Nunito',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}input:focus{border-color:${C.red}!important;outline:none}`}</style>
      <div style={{width:380,animation:'fadeUp 0.4s ease'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:72,height:72,background:C.red,borderRadius:20,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:36,marginBottom:16,boxShadow:'0 8px 24px rgba(234,29,44,0.3)'}}>🍽️</div>
          <h1 style={{fontFamily:"'Nunito'",fontSize:26,fontWeight:900,color:C.text}}>Estoque do Restaurante</h1>
          <p style={{color:C.grayDark,fontSize:13,marginTop:4}}>Faça login para continuar</p>
        </div>
        <div style={{...styles.card,padding:28}}>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:700,color:C.grayDark,display:'block',marginBottom:6,letterSpacing:0.5}}>E-MAIL</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"
              onKeyDown={e=>e.key==='Enter'&&go()} style={styles.input} />
          </div>
          <div style={{marginBottom:24}}>
            <label style={{fontSize:12,fontWeight:700,color:C.grayDark,display:'block',marginBottom:6,letterSpacing:0.5}}>SENHA</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••"
              onKeyDown={e=>e.key==='Enter'&&go()} style={styles.input} />
          </div>
          {err&&<p style={{color:C.red,fontSize:13,marginBottom:16,textAlign:'center',fontWeight:700}}>{err}</p>}
          <button onClick={go} style={{...styles.btnRed,width:'100%',padding:14,fontSize:16,borderRadius:14}}>Entrar</button>
          <div style={{marginTop:20,padding:16,background:C.redLight,borderRadius:12}}>
            <p style={{fontSize:11,color:C.red,fontWeight:800,marginBottom:8}}>USUÁRIOS DE DEMONSTRAÇÃO (senha: 1234)</p>
            {USERS.map(u=>(
              <button key={u.id} onClick={()=>{setEmail(u.email);setPass('1234')}}
                style={{display:'block',background:'none',border:'none',color:C.grayDark,fontSize:12,cursor:'pointer',padding:'3px 0',fontFamily:"'Nunito'",fontWeight:600}}>
                {u.email} — <span style={{color:C.red,fontWeight:800}}>{ROLE_LABELS[u.role]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null)
  const [tab,setTab]=useState('dashboard')
  const [products,setProducts]=useState([])
  const [movements,setMovements]=useState([])
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState(null)
  const [toast,setToast]=useState(null)
  const [filterDate,setFilterDate]=useState(today())
  const [editProd,setEditProd]=useState(null)
  const [search,setSearch]=useState('')
  const [movForm,setMovForm]=useState({productId:'',qty:'',note:'',type:'entrada'})
  const [prodForm,setProdForm]=useState({name:'',category:CATS[0],unit:'kg',quantity:'',min_stock:'',max_stock:'',cost:'',barcode:'',supplier:'',expiry:''})

  useEffect(()=>{
    if(!user) return
    const load=async()=>{
      setLoading(true)
      const [{data:prods},{data:movs}]=await Promise.all([
        supabase.from('produtos').select('*').order('name'),
        supabase.from('movimentos').select('*').order('created_at',{ascending:false}).limit(500),
      ])
      if(prods) setProducts(prods)
      if(movs) setMovements(movs)
      setLoading(false)
    }
    load()
    const ch=supabase.channel('changes')
      .on('postgres_changes',{event:'*',schema:'public',table:'produtos'},()=>load())
      .on('postgres_changes',{event:'*',schema:'public',table:'movimentos'},()=>load())
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[user])

  const showToast=(msg,type='ok')=>{setToast({msg,type});setTimeout(()=>setToast(null),3500)}
  const canManage=user&&(user.role==='admin'||user.role==='gerente')
  const canAdmin=user&&user.role==='admin'

  const todayMov=movements.filter(m=>m.created_at?.startsWith(filterDate))
  const totalCost=products.reduce((s,p)=>s+p.quantity*p.cost,0)
  const lowStock=products.filter(p=>p.quantity<=p.min_stock)
  const expiring=products.filter(p=>{if(!p.expiry)return false;const d=(new Date(p.expiry)-new Date())/86400000;return d<=7&&d>=0})
  const filtered=products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.category.toLowerCase().includes(search.toLowerCase()))

  const last7=useMemo(()=>{
    const days=[]
    for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split('T')[0];const dm=movements.filter(m=>m.created_at?.startsWith(ds));days.push({date:d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),entradas:dm.filter(m=>m.type==='entrada').reduce((s,m)=>s+m.quantity,0),saidas:dm.filter(m=>m.type==='saida').reduce((s,m)=>s+m.quantity,0)})}
    return days
  },[movements])

  const catData=useMemo(()=>{const map={};products.forEach(p=>{map[p.category]=(map[p.category]||0)+p.quantity*p.cost});return Object.entries(map).map(([name,value])=>({name,value:+value.toFixed(2)}))},[products])

  const handleMovement=async()=>{
    const pid=movForm.productId;const qty=parseFloat(movForm.qty)
    if(!pid||!qty||qty<=0) return showToast('Preencha produto e quantidade','err')
    const product=products.find(p=>p.id===pid)
    if(!product) return
    if(movForm.type==='saida'&&product.quantity<qty) return showToast(`Estoque insuficiente! Disponível: ${product.quantity} ${product.unit}`,'err')
    const newQty=movForm.type==='entrada'?product.quantity+qty:product.quantity-qty
    const[{error:e1},{error:e2}]=await Promise.all([
      supabase.from('produtos').update({quantity:+newQty.toFixed(3)}).eq('id',pid),
      supabase.from('movimentos').insert({product_id:pid,type:movForm.type,quantity:qty,note:movForm.note,user_name:user.name,cost_unit:product.cost}),
    ])
    if(e1||e2) return showToast('Erro ao salvar','err')
    setMovForm({productId:'',qty:'',note:'',type:'entrada'});setModal(null)
    showToast(movForm.type==='entrada'?`✓ +${qty} ${product.unit} adicionados!`:`✓ -${qty} ${product.unit} removidos!`)
  }

  const handleSaveProd=async()=>{
    if(!prodForm.name||!prodForm.quantity) return showToast('Nome e quantidade são obrigatórios','err')
    const data={name:prodForm.name,category:prodForm.category,unit:prodForm.unit,quantity:+prodForm.quantity,min_stock:+prodForm.min_stock||0,max_stock:+prodForm.max_stock||999,cost:+prodForm.cost||0,barcode:prodForm.barcode||null,supplier:prodForm.supplier||null,expiry:prodForm.expiry||null}
    const{error}=editProd?await supabase.from('produtos').update(data).eq('id',editProd):await supabase.from('produtos').insert(data)
    if(error) return showToast('Erro ao salvar produto','err')
    setProdForm({name:'',category:CATS[0],unit:'kg',quantity:'',min_stock:'',max_stock:'',cost:'',barcode:'',supplier:'',expiry:''})
    setEditProd(null);setModal(null)
    showToast(editProd?'✓ Produto atualizado!':'✓ Produto cadastrado!')
  }

  const openEdit=(p)=>{setEditProd(p.id);setProdForm({name:p.name,category:p.category,unit:p.unit,quantity:String(p.quantity),min_stock:String(p.min_stock),max_stock:String(p.max_stock),cost:String(p.cost),barcode:p.barcode||'',supplier:p.supplier||'',expiry:p.expiry||''});setModal('produto')}
  const openMovModal=(type,product=null)=>{setMovForm({productId:product?product.id:'',qty:'',note:'',type});setModal('movimento')}

  if(!user) return <Login onLogin={setUser} />

  const TABS=[
    {key:'dashboard',label:'Painel',icon:'🏠'},
    {key:'estoque',label:'Estoque',icon:'📦'},
    {key:'movimentos',label:'Movimentos',icon:'🔄'},
    {key:'relatorios',label:'Relatórios',icon:'📊'},
    ...(canAdmin?[{key:'usuarios',label:'Usuários',icon:'👥'}]:[]),
  ]

  return (
    <div style={{minHeight:'100vh',background:C.gray,fontFamily:"'Nunito',sans-serif",color:C.text}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:${C.grayMid};border-radius:3px}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus{border-color:${C.red}!important;outline:none}.rhover:hover{background:${C.redLight}!important}`}</style>

      {/* HEADER */}
      <div style={{background:C.red,padding:'0 20px',display:'flex',alignItems:'center',height:60,gap:16,boxShadow:'0 2px 12px rgba(234,29,44,0.3)',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
          <div style={{width:36,height:36,background:'rgba(255,255,255,0.2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🍽️</div>
          <span style={{fontWeight:900,fontSize:18,color:C.white,letterSpacing:0.5}}>Estoque</span>
          {loading&&<span style={{fontSize:11,color:'rgba(255,255,255,0.7)',marginLeft:4}}>⟳ atualizando...</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {lowStock.length>0&&<div style={{background:'rgba(255,255,255,0.2)',borderRadius:20,padding:'4px 12px',fontSize:12,color:C.white,fontWeight:800,cursor:'pointer'}} onClick={()=>setTab('estoque')}>⚠️ {lowStock.length} alertas</div>}
          <div style={{background:'rgba(255,255,255,0.15)',borderRadius:20,padding:'6px 12px',display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:28,height:28,background:'rgba(255,255,255,0.3)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:C.white,fontSize:13}}>{user.avatar}</div>
            <span style={{fontSize:13,color:C.white,fontWeight:700}}>{user.name.split(' ')[0]}</span>
          </div>
          <button onClick={()=>setUser(null)} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:20,padding:'6px 14px',color:C.white,fontSize:12,cursor:'pointer',fontFamily:"'Nunito'",fontWeight:700}}>Sair</button>
        </div>
      </div>

      {/* ACTION BAR */}
      <div style={{background:C.white,padding:'12px 20px',display:'flex',gap:8,flexWrap:'wrap',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderBottom:`1px solid ${C.grayMid}`}}>
        <button style={styles.btnRed} onClick={()=>openMovModal('entrada')}>+ Entrada</button>
        <button style={{...styles.btnWhite}} onClick={()=>openMovModal('saida')}>− Saída</button>
        {canManage&&<button style={styles.btnGray} onClick={()=>{setEditProd(null);setProdForm({name:'',category:CATS[0],unit:'kg',quantity:'',min_stock:'',max_stock:'',cost:'',barcode:'',supplier:'',expiry:''});setModal('produto')}}>+ Produto</button>}
      </div>

      {/* TABS */}
      <div style={{background:C.white,padding:'0 20px',display:'flex',gap:4,overflowX:'auto',borderBottom:`2px solid ${C.grayMid}`}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{background:'none',border:'none',borderBottom:tab===t.key?`3px solid ${C.red}`:'3px solid transparent',color:tab===t.key?C.red:C.grayDark,padding:'14px 16px',fontFamily:"'Nunito'",fontSize:13,fontWeight:tab===t.key?800:600,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.2s'}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{padding:16,maxWidth:1100,margin:'0 auto',animation:'fadeUp 0.3s ease'}} key={tab}>

        {/* DASHBOARD */}
        {tab==='dashboard'&&(()=>{
          const custoDia = todayMov.filter(m=>m.type==='saida').reduce((s,m)=>s+m.quantity*(m.cost_unit||0),0)
          const topProdutos = [...products].map(p=>({...p, totalSaida: movements.filter(m=>m.product_id===p.id&&m.type==='saida').reduce((s,m)=>s+m.quantity,0)})).sort((a,b)=>b.totalSaida-a.totalSaida).slice(0,5)
          const semEstoque = products.filter(p=>p.quantity===0)
          const ultimosMov = movements.slice(0,6)
          const custoSemanal = last7.map(d=>({...d, custo: movements.filter(m=>m.created_at?.startsWith(last7.find(x=>x.date===d.date)?.fullDate||'')).reduce((s,m)=>s+m.quantity*(m.cost_unit||0),0)}))
          return <>
            {/* SAUDAÇÃO */}
            <div style={{background:`linear-gradient(135deg,${C.red},#ff4757)`,borderRadius:16,padding:'18px 20px',marginBottom:16,color:C.white,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <p style={{fontSize:13,opacity:0.85,fontWeight:600}}>Bem-vindo de volta,</p>
                <p style={{fontWeight:900,fontSize:20}}>{user.name} 👋</p>
                <p style={{fontSize:11,opacity:0.75,marginTop:4}}>{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</p>
              </div>
              <div style={{textAlign:'right'}}>
                <p style={{fontSize:11,opacity:0.75}}>Valor em estoque</p>
                <p style={{fontWeight:900,fontSize:24}}>{fmtCur(totalCost)}</p>
                <p style={{fontSize:11,opacity:0.75}}>{products.length} produtos cadastrados</p>
              </div>
            </div>

            {/* CARDS PRINCIPAIS — 4 colunas */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:14}}>
              {[
                {label:'Custo do Dia',val:fmtCur(custoDia),icon:'💸',color:'#6f42c1',bg:'#F5F0FF',sub:`${todayMov.filter(m=>m.type==='saida').length} saídas registradas`},
                {label:'Itens Críticos',val:lowStock.length+semEstoque.length,icon:'🚨',color:C.red,bg:C.redLight,sub:`${semEstoque.length} zerados · ${lowStock.length} baixo`},
                {label:'Entradas Hoje',val:`+${todayMov.filter(m=>m.type==='entrada').reduce((s,m)=>s+m.quantity,0)}`,icon:'📥',color:C.green,bg:'#F0FFF6',sub:`${todayMov.filter(m=>m.type==='entrada').length} movimentos`},
                {label:'Vencendo em Breve',val:expiring.length,icon:'📅',color:C.orange,bg:'#FFF8F0',sub:'próximos 7 dias'},
              ].map(c=>(
                <div key={c.label} style={{...styles.card,background:c.bg,border:`1.5px solid ${c.color}33`,padding:14}}>
                  <div style={{fontSize:10,fontWeight:800,color:c.color,marginBottom:6,letterSpacing:0.5}}>{c.icon} {c.label.toUpperCase()}</div>
                  <div style={{fontWeight:900,fontSize:26,color:c.color,lineHeight:1}}>{c.val}</div>
                  <div style={{fontSize:10,color:C.grayDark,marginTop:5,fontWeight:600}}>{c.sub}</div>
                </div>
              ))}
            </div>

            {/* ALERTAS CRÍTICOS */}
            {(lowStock.length>0||expiring.length>0||semEstoque.length>0)&&(
              <div style={{...styles.card,border:`1.5px solid ${C.red}`,background:C.redLight,marginBottom:14,padding:14}}>
                <p style={{fontSize:12,fontWeight:800,color:C.red,marginBottom:10}}>🚨 ALERTAS QUE PRECISAM DE ATENÇÃO</p>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {semEstoque.map(p=>(
                    <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:C.white,borderRadius:8,padding:'8px 12px'}}>
                      <span style={{fontWeight:700,fontSize:13}}>{p.name}</span>
                      <span style={{background:C.red,color:C.white,fontSize:10,padding:'2px 10px',borderRadius:20,fontWeight:800}}>ZERADO</span>
                    </div>
                  ))}
                  {lowStock.filter(p=>p.quantity>0).map(p=>(
                    <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:C.white,borderRadius:8,padding:'8px 12px'}}>
                      <span style={{fontWeight:700,fontSize:13}}>{p.name}</span>
                      <span style={{color:C.orange,fontWeight:800,fontSize:12}}>{p.quantity}/{p.min_stock} {p.unit}</span>
                    </div>
                  ))}
                  {expiring.map(p=>(
                    <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:C.white,borderRadius:8,padding:'8px 12px'}}>
                      <span style={{fontWeight:700,fontSize:13}}>{p.name}</span>
                      <span style={{color:C.orange,fontWeight:800,fontSize:12}}>⏰ Vence {fmtDate(p.expiry)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GRÁFICO + TOP PRODUTOS */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div style={{...styles.card}}>
                <p style={{fontSize:12,fontWeight:800,color:C.grayDark,marginBottom:12}}>📈 ENTRADAS × SAÍDAS — 7 DIAS</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={last7} barCategoryGap="30%">
                    <XAxis dataKey="date" tick={{fill:C.grayDark,fontSize:9}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill:C.grayDark,fontSize:9}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{background:C.white,border:`1px solid ${C.grayMid}`,borderRadius:10,fontSize:11}} />
                    <Bar dataKey="entradas" fill={C.green} radius={[5,5,0,0]} name="Entradas" />
                    <Bar dataKey="saidas" fill={C.red} radius={[5,5,0,0]} name="Saídas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{...styles.card}}>
                <p style={{fontSize:12,fontWeight:800,color:C.grayDark,marginBottom:10}}>🔥 MAIS CONSUMIDOS</p>
                {topProdutos.length===0
                  ? <p style={{color:C.grayDark,fontSize:12,textAlign:'center',padding:'20px 0'}}>Sem movimentos ainda</p>
                  : topProdutos.map((p,i)=>{
                    const maxVal=topProdutos[0].totalSaida||1
                    return(
                      <div key={p.id} style={{marginBottom:8}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                          <span style={{fontSize:12,fontWeight:700,color:C.text}}>{i+1}. {p.name}</span>
                          <span style={{fontSize:11,fontWeight:800,color:C.red}}>{p.totalSaida} {p.unit}</span>
                        </div>
                        <div style={{background:C.grayMid,borderRadius:4,height:5,overflow:'hidden'}}>
                          <div style={{width:`${(p.totalSaida/maxVal)*100}%`,height:'100%',background:C.red,borderRadius:4}} />
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>

            {/* VALOR POR CATEGORIA + ÚLTIMOS MOVIMENTOS */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div style={{...styles.card}}>
                <p style={{fontSize:12,fontWeight:800,color:C.grayDark,marginBottom:10}}>🥧 VALOR POR CATEGORIA</p>
                {catData.length===0
                  ? <p style={{color:C.grayDark,fontSize:12,textAlign:'center',padding:'20px 0'}}>Sem produtos ainda</p>
                  : catData.sort((a,b)=>b.value-a.value).map((c,i)=>(
                    <div key={c.name} style={{marginBottom:8}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                        <span style={{fontSize:12,fontWeight:700}}>{c.name}</span>
                        <span style={{fontSize:11,fontWeight:800,color:PIE_COLORS[i%PIE_COLORS.length]}}>{fmtCur(c.value)}</span>
                      </div>
                      <div style={{background:C.grayMid,borderRadius:4,height:5,overflow:'hidden'}}>
                        <div style={{width:`${(c.value/(catData[0]?.value||1))*100}%`,height:'100%',background:PIE_COLORS[i%PIE_COLORS.length],borderRadius:4}} />
                      </div>
                    </div>
                  ))
                }
              </div>

              <div style={{...styles.card}}>
                <p style={{fontSize:12,fontWeight:800,color:C.grayDark,marginBottom:10}}>⏱ ÚLTIMOS MOVIMENTOS</p>
                {ultimosMov.length===0
                  ? <p style={{color:C.grayDark,fontSize:12,textAlign:'center',padding:'20px 0'}}>Sem movimentos ainda</p>
                  : ultimosMov.map(m=>{
                    const p=products.find(x=>x.id===m.product_id)
                    return(
                      <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:`1px solid ${C.gray}`}}>
                        <div style={{width:32,height:32,borderRadius:10,background:m.type==='entrada'?'#F0FFF6':C.redLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>
                          {m.type==='entrada'?'📥':'📤'}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontWeight:700,fontSize:12,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p?.name||'—'}</p>
                          <p style={{fontSize:10,color:C.grayDark,fontWeight:600}}>{m.user_name} · {new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p>
                        </div>
                        <span style={{fontWeight:900,fontSize:13,color:m.type==='entrada'?C.green:C.red,flexShrink:0}}>
                          {m.type==='entrada'?'+':'-'}{m.quantity} {p?.unit}
                        </span>
                      </div>
                    )
                  })
                }
                {movements.length>6&&<button onClick={()=>setTab('movimentos')} style={{...styles.btnGray,width:'100%',marginTop:10,fontSize:12}}>Ver todos →</button>}
              </div>
            </div>
          </>
        })()}

        {/* ESTOQUE */}
        {tab==='estoque'&&<>
          <input placeholder="🔍 Buscar produto ou categoria..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{...styles.input,marginBottom:14,borderRadius:14,paddingLeft:16}} />
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
            {filtered.map(p=>{
              const isLow=p.quantity<=p.min_stock
              const pct=Math.min(100,(p.quantity/(p.max_stock||1))*100)
              const isExp=p.expiry&&(new Date(p.expiry)-new Date())/86400000<=7
              return(
                <div key={p.id} style={{...styles.card,border:`1.5px solid ${isLow?C.red:C.grayMid}`,background:isLow?C.redLight:C.white}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                    <div>
                      <p style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:2}}>{p.name}</p>
                      <p style={{fontSize:11,color:C.grayDark,fontWeight:600}}>{p.category} · {p.supplier||'—'}</p>
                    </div>
                    <div style={{display:'flex',gap:4}}>
                      {isLow&&<span style={{background:C.red,color:C.white,fontSize:9,padding:'3px 8px',borderRadius:20,fontWeight:800}}>BAIXO</span>}
                      {isExp&&<span style={{background:C.orange,color:C.white,fontSize:9,padding:'3px 8px',borderRadius:20,fontWeight:800}}>VENCE</span>}
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:8}}>
                    <span style={{fontWeight:900,fontSize:30,color:isLow?C.red:C.text,lineHeight:1}}>{p.quantity}</span>
                    <span style={{fontSize:13,color:C.grayDark,fontWeight:600}}>{p.unit}</span>
                    <span style={{marginLeft:'auto',fontSize:12,color:C.green,fontWeight:800}}>{fmtCur(p.cost)}/{p.unit}</span>
                  </div>
                  <div style={{background:C.grayMid,borderRadius:6,height:6,marginBottom:12,overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:'100%',background:isLow?C.red:C.green,borderRadius:6,transition:'width 0.5s'}} />
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:10,color:C.grayDark,fontWeight:600}}>Mín: {p.min_stock} · Máx: {p.max_stock}</span>
                    <div style={{display:'flex',gap:6}}>
                      <button style={{...styles.btnGray,padding:'5px 12px',fontSize:12,color:C.green,fontWeight:800}} onClick={()=>openMovModal('entrada',p)}>+ Entrada</button>
                      <button style={{...styles.btnGray,padding:'5px 12px',fontSize:12,color:C.red,fontWeight:800}} onClick={()=>openMovModal('saida',p)}>− Saída</button>
                      {canManage&&<button style={{...styles.btnGray,padding:'5px 10px',fontSize:12}} onClick={()=>openEdit(p)}>✏️</button>}
                    </div>
                  </div>
                  {p.expiry&&<p style={{fontSize:10,color:isExp?C.orange:C.grayDark,marginTop:8,fontWeight:600}}>📅 Validade: {fmtDate(p.expiry)}</p>}
                </div>
              )
            })}
            {filtered.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:C.grayDark}}>Nenhum produto encontrado</div>}
          </div>
        </>}

        {/* MOVIMENTOS */}
        {tab==='movimentos'&&<>
          <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
            <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}
              style={{...styles.input,width:'auto',flex:'none'}} />
            <div style={{marginLeft:'auto',display:'flex',gap:8}}>
              <div style={{background:'#F0FFF6',border:`1.5px solid ${C.green}`,borderRadius:10,padding:'8px 14px',fontSize:12,color:C.green,fontWeight:800}}>📥 +{todayMov.filter(m=>m.type==='entrada').reduce((s,m)=>s+m.quantity,0)}</div>
              <div style={{background:C.redLight,border:`1.5px solid ${C.red}`,borderRadius:10,padding:'8px 14px',fontSize:12,color:C.red,fontWeight:800}}>📤 -{todayMov.filter(m=>m.type==='saida').reduce((s,m)=>s+m.quantity,0)}</div>
            </div>
          </div>
          <div style={{...styles.card,padding:0,overflow:'hidden'}}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:520}}>
                <thead>
                  <tr style={{background:C.gray,borderBottom:`2px solid ${C.grayMid}`}}>
                    {['Horário','Produto','Tipo','Qtd','Usuário','Observação'].map(h=>(
                      <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:800,color:C.grayDark,letterSpacing:0.5}}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movements.filter(m=>!filterDate||m.created_at?.startsWith(filterDate)).map(m=>{
                    const p=products.find(x=>x.id===m.product_id)
                    return(
                      <tr key={m.id} className="rhover" style={{borderBottom:`1px solid ${C.gray}`,transition:'background 0.15s'}}>
                        <td style={{padding:'11px 16px',color:C.grayDark,fontSize:11,fontWeight:600}}>{new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                        <td style={{padding:'11px 16px',fontWeight:700}}>{p?.name||'—'}</td>
                        <td style={{padding:'11px 16px'}}>
                          <span style={{background:m.type==='entrada'?'#F0FFF6':C.redLight,color:m.type==='entrada'?C.green:C.red,border:`1.5px solid ${m.type==='entrada'?C.green:C.red}`,fontSize:10,padding:'3px 10px',borderRadius:20,fontWeight:800}}>
                            {m.type==='entrada'?'Entrada':'Saída'}
                          </span>
                        </td>
                        <td style={{padding:'11px 16px',fontWeight:900,fontSize:16,color:m.type==='entrada'?C.green:C.red}}>{m.type==='entrada'?'+':'-'}{m.quantity} <span style={{fontSize:10,color:C.grayDark,fontWeight:600}}>{p?.unit}</span></td>
                        <td style={{padding:'11px 16px'}}><span style={{fontSize:11,color:C.grayDark,background:C.gray,padding:'3px 10px',borderRadius:20,fontWeight:700}}>{m.user_name||'—'}</span></td>
                        <td style={{padding:'11px 16px',color:C.grayDark,fontSize:12}}>{m.note||'—'}</td>
                      </tr>
                    )
                  })}
                  {movements.filter(m=>m.created_at?.startsWith(filterDate)).length===0&&(
                    <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:C.grayDark,fontWeight:600}}>Nenhum movimento neste dia</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* RELATÓRIOS */}
        {tab==='relatorios'&&<>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14,marginBottom:14}}>
            <div style={styles.card}>
              <p style={{fontSize:12,fontWeight:800,color:C.grayDark,marginBottom:12}}>📈 TENDÊNCIA 7 DIAS</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={last7}>
                  <XAxis dataKey="date" tick={{fill:C.grayDark,fontSize:10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:C.grayDark,fontSize:10}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{background:C.white,border:`1px solid ${C.grayMid}`,borderRadius:10,fontSize:12}} />
                  <Line type="monotone" dataKey="entradas" stroke={C.green} strokeWidth={3} dot={{fill:C.green,r:4}} name="Entradas" />
                  <Line type="monotone" dataKey="saidas" stroke={C.red} strokeWidth={3} dot={{fill:C.red,r:4}} name="Saídas" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={styles.card}>
              <p style={{fontSize:12,fontWeight:800,color:C.grayDark,marginBottom:12}}>🥧 VALOR POR CATEGORIA</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" nameKey="name">
                    {catData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{background:C.white,border:`1px solid ${C.grayMid}`,borderRadius:10,fontSize:12}} formatter={v=>fmtCur(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{...styles.card,padding:0,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.grayMid}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <p style={{fontSize:13,fontWeight:800,color:C.text}}>📋 Resumo do Estoque</p>
              <p style={{fontSize:14,color:C.red,fontWeight:900}}>Total: {fmtCur(totalCost)}</p>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:480}}>
                <thead>
                  <tr style={{background:C.gray}}>
                    {['Produto','Categoria','Qtd','Custo','Total','Status'].map(h=>(
                      <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:11,fontWeight:800,color:C.grayDark}}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...products].sort((a,b)=>(b.quantity*b.cost)-(a.quantity*a.cost)).map(p=>(
                    <tr key={p.id} className="rhover" style={{borderBottom:`1px solid ${C.gray}`}}>
                      <td style={{padding:'10px 16px',fontWeight:700}}>{p.name}</td>
                      <td style={{padding:'10px 16px',color:C.grayDark,fontSize:11}}>{p.category}</td>
                      <td style={{padding:'10px 16px',fontWeight:800}}>{p.quantity} {p.unit}</td>
                      <td style={{padding:'10px 16px',color:C.grayDark}}>{fmtCur(p.cost)}</td>
                      <td style={{padding:'10px 16px',color:C.green,fontWeight:800}}>{fmtCur(p.quantity*p.cost)}</td>
                      <td style={{padding:'10px 16px'}}>
                        <span style={{background:p.quantity<=p.min_stock?C.redLight:'#F0FFF6',color:p.quantity<=p.min_stock?C.red:C.green,fontSize:10,padding:'3px 10px',borderRadius:20,fontWeight:800}}>
                          {p.quantity<=p.min_stock?'Baixo':'OK'}
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
        {tab==='usuarios'&&canAdmin&&(
          <div style={{...styles.card,padding:0,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.grayMid}`}}>
              <p style={{fontSize:13,fontWeight:800}}>👥 Usuários do Sistema</p>
            </div>
            {USERS.map(u=>(
              <div key={u.id} className="rhover" style={{display:'flex',alignItems:'center',gap:14,padding:'16px 20px',borderBottom:`1px solid ${C.gray}`,transition:'background 0.15s'}}>
                <div style={{width:44,height:44,background:C.red,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:C.white,fontSize:18}}>{u.avatar}</div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:800,fontSize:14,marginBottom:2}}>{u.name}</p>
                  <p style={{color:C.grayDark,fontSize:12,fontWeight:600}}>{u.email}</p>
                </div>
                <span style={{background:C.redLight,color:C.red,border:`1.5px solid ${C.red}33`,fontSize:11,padding:'5px 14px',borderRadius:20,fontWeight:800}}>{ROLE_LABELS[u.role]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL MOVIMENTO */}
      {modal==='movimento'&&(
        <Overlay onClose={()=>setModal(null)}>
          <MHead title={movForm.type==='entrada'?'📥 Registrar Entrada':'📤 Registrar Saída'} color={movForm.type==='entrada'?C.green:C.red} onClose={()=>setModal(null)} />
          <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'flex',gap:8}}>
              {['entrada','saida'].map(t=>(
                <button key={t} onClick={()=>setMovForm(f=>({...f,type:t}))}
                  style={{flex:1,padding:'10px',borderRadius:12,border:`2px solid ${movForm.type===t?(t==='entrada'?C.green:C.red):C.grayMid}`,background:movForm.type===t?(t==='entrada'?'#F0FFF6':C.redLight):C.white,color:movForm.type===t?(t==='entrada'?C.green:C.red):C.grayDark,fontFamily:"'Nunito'",fontWeight:800,fontSize:13,cursor:'pointer'}}>
                  {t==='entrada'?'📥 Entrada':'📤 Saída'}
                </button>
              ))}
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:800,color:C.grayDark,display:'block',marginBottom:6}}>PRODUTO</label>
              <select value={movForm.productId} onChange={e=>setMovForm(f=>({...f,productId:e.target.value}))} style={styles.input}>
                <option value="">Selecione um produto...</option>
                {products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit})</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:800,color:C.grayDark,display:'block',marginBottom:6}}>QUANTIDADE</label>
              <input type="number" min="0.001" step="0.001" placeholder="0" value={movForm.qty} onChange={e=>setMovForm(f=>({...f,qty:e.target.value}))} style={styles.input} />
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:800,color:C.grayDark,display:'block',marginBottom:6}}>OBSERVAÇÃO</label>
              <input placeholder="Ex: Compra semanal, consumo jantar..." value={movForm.note} onChange={e=>setMovForm(f=>({...f,note:e.target.value}))} style={styles.input} />
            </div>
            <div style={{display:'flex',gap:10}}>
              <button style={{...styles.btnRed,flex:1,background:movForm.type==='entrada'?C.green:C.red}} onClick={handleMovement}>Confirmar</button>
              <button style={{...styles.btnGray,flex:1}} onClick={()=>setModal(null)}>Cancelar</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* MODAL PRODUTO */}
      {modal==='produto'&&canManage&&(
        <Overlay onClose={()=>setModal(null)}>
          <MHead title={editProd?'✏️ Editar Produto':'+ Novo Produto'} onClose={()=>setModal(null)} />
          <div style={{padding:'20px 24px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                {label:'NOME',key:'name',type:'text',ph:'Ex: Filé Mignon',full:true},
                {label:'QUANTIDADE',key:'quantity',type:'number',ph:'0'},
                {label:'ESTOQUE MÍNIMO',key:'min_stock',type:'number',ph:'0'},
                {label:'ESTOQUE MÁXIMO',key:'max_stock',type:'number',ph:'999'},
                {label:'CUSTO (R$)',key:'cost',type:'number',ph:'0,00'},
                {label:'CÓDIGO DE BARRAS',key:'barcode',type:'text',ph:'789...'},
                {label:'FORNECEDOR',key:'supplier',type:'text',ph:'Nome do fornecedor',full:true},
                {label:'VALIDADE',key:'expiry',type:'date',ph:''},
              ].map(f=>(
                <div key={f.key} style={{gridColumn:f.full?'1/-1':'auto'}}>
                  <label style={{fontSize:11,fontWeight:800,color:C.grayDark,display:'block',marginBottom:6}}>{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={prodForm[f.key]} onChange={e=>setProdForm(p=>({...p,[f.key]:e.target.value}))} style={styles.input} />
                </div>
              ))}
              <div>
                <label style={{fontSize:11,fontWeight:800,color:C.grayDark,display:'block',marginBottom:6}}>CATEGORIA</label>
                <select value={prodForm.category} onChange={e=>setProdForm(p=>({...p,category:e.target.value}))} style={styles.input}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:800,color:C.grayDark,display:'block',marginBottom:6}}>UNIDADE</label>
                <select value={prodForm.unit} onChange={e=>setProdForm(p=>({...p,unit:e.target.value}))} style={styles.input}>
                  {['kg','g','l','ml','un','cx','pct','fardo'].map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button style={{...styles.btnRed,flex:1}} onClick={handleSaveProd}>{editProd?'Salvar':'Cadastrar'}</button>
              <button style={{...styles.btnGray,flex:1}} onClick={()=>setModal(null)}>Cancelar</button>
            </div>
          </div>
        </Overlay>
      )}

      {toast&&<Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
