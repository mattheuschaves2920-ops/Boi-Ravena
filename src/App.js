import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const USERS = [
  { id:1, name:'Admin Geral',  email:'admin@restaurante.com',   password:'1234', role:'admin',    avatar:'A' },
  { id:2, name:'Cozinheiro',   email:'cozinha@restaurante.com', password:'1234', role:'operador', avatar:'C' },
  { id:3, name:'Gerente',      email:'gerente@restaurante.com', password:'1234', role:'gerente',  avatar:'G' },
]
const CATS    = ['Carnes','Laticínios','Hortifruti','Bebidas','Grãos/Cereais','Temperos','Descartáveis','Limpeza']
const SETORES = ['Cozinha','Lanchonete','Salão','Churrasco']
const TURNOS  = [
  { id:'T1', label:'Turno 1', sub:'07:00 – 15:00', icon:'🌅', start:7,  end:15 },
  { id:'T2', label:'Turno 2', sub:'15:00 – 23:00', icon:'🌆', start:15, end:23 },
]
const TURNO_SEGUINTE = { T1:'T2', T2:'T1' }
const ROLE_LABELS = { admin:'Administrador', gerente:'Gerente', operador:'Operador' }
const PIE_COLORS  = ['#EA1D2C','#FF8C00','#50A773','#17a2b8','#6f42c1','#fd7e14','#FF6B6B','#FFB347']
const SETOR_ICONS = { 'Cozinha':'🍳', 'Lanchonete':'🥪', 'Salão':'🪑', 'Churrasco':'🔥' }
const SETOR_COLORS= { 'Cozinha':'#EA1D2C', 'Lanchonete':'#FF8C00', 'Salão':'#50A773', 'Churrasco':'#8B4513' }

const todayStr  = () => new Date().toISOString().split('T')[0]
const fmtDate   = d  => d ? new Date(d+'T00:00:00').toLocaleDateString('pt-BR') : '—'
const fmtCur    = v  => `R$ ${(+v||0).toFixed(2).replace('.',',')}`
const getTurnoAtual = () => { const h=new Date().getHours(); return h>=7&&h<15?'T1':'T2' }
const getTurnoFromDate = (dateStr) => { const h=new Date(dateStr).getHours(); return h>=7&&h<15?'T1':'T2' }

const C = {
  red:'#EA1D2C', redDark:'#C8111F', redLight:'#FFF0F1',
  gray:'#F2F2F2', grayMid:'#DCDCDC', grayDark:'#717171',
  text:'#3E3E3E', white:'#FFFFFF', green:'#50A773', orange:'#FF8C00',
  purple:'#6f42c1', blue:'#17a2b8',
}
const S = {
  input:{ width:'100%', background:C.white, border:`1.5px solid ${C.grayMid}`, borderRadius:12, color:C.text, padding:'12px 16px', fontSize:14, fontFamily:"'Nunito',sans-serif", outline:'none', transition:'border 0.2s' },
  btnRed:{ background:C.red, color:C.white, border:'none', borderRadius:12, padding:'12px 24px', fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:14, cursor:'pointer', whiteSpace:'nowrap' },
  btnGray:{ background:C.gray, color:C.grayDark, border:'none', borderRadius:12, padding:'10px 18px', fontFamily:"'Nunito',sans-serif", fontWeight:600, fontSize:13, cursor:'pointer' },
  card:{ background:C.white, borderRadius:16, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', border:`1px solid ${C.grayMid}` },
}

function Overlay({ children, onClose }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
      <div style={{background:C.white,borderRadius:20,maxHeight:'90vh',overflowY:'auto',width:'100%',maxWidth:500,boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>{children}</div>
    </div>
  )
}
function MHead({ title, onClose, color }) {
  return (
    <div style={{padding:'18px 22px',borderBottom:`1px solid ${C.grayMid}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <span style={{fontFamily:"'Nunito'",fontWeight:900,fontSize:17,color:color||C.red}}>{title}</span>
      <button onClick={onClose} style={{background:C.gray,border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:18,color:C.grayDark,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
    </div>
  )
}
function Toast({ msg, type }) {
  const bg=type==='err'?C.red:type==='warn'?C.orange:C.green
  return <div style={{position:'fixed',bottom:80,right:20,zIndex:2000,background:bg,color:C.white,padding:'14px 22px',borderRadius:14,fontSize:14,fontFamily:"'Nunito',sans-serif",fontWeight:700,boxShadow:'0 4px 20px rgba(0,0,0,0.2)',maxWidth:320}}>{msg}</div>
}

function Login({ onLogin }) {
  const [email,setEmail]=useState(''); const [pass,setPass]=useState(''); const [err,setErr]=useState('')
  const go=()=>{ const u=USERS.find(u=>u.email===email&&u.password===pass); if(u) onLogin(u); else setErr('E-mail ou senha incorretos.') }
  return (
    <div style={{minHeight:'100vh',background:C.gray,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Nunito',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus{border-color:${C.red}!important;outline:none}`}</style>
      <div style={{width:380,animation:'fadeUp 0.4s ease'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:72,height:72,background:C.red,borderRadius:20,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:36,marginBottom:16,boxShadow:'0 8px 24px rgba(234,29,44,0.3)'}}>🍽️</div>
          <h1 style={{fontFamily:"'Nunito'",fontSize:26,fontWeight:900,color:C.text}}>Estoque do Restaurante</h1>
          <p style={{color:C.grayDark,fontSize:13,marginTop:4}}>Faça login para continuar</p>
        </div>
        <div style={{...S.card,padding:28}}>
          {[{label:'E-MAIL',type:'email',val:email,set:setEmail,ph:'seu@email.com'},{label:'SENHA',type:'password',val:pass,set:setPass,ph:'••••••'}].map(f=>(
            <div key={f.label} style={{marginBottom:16}}>
              <label style={{fontSize:12,fontWeight:700,color:C.grayDark,display:'block',marginBottom:6}}>{f.label}</label>
              <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} onKeyDown={e=>e.key==='Enter'&&go()} style={S.input} />
            </div>
          ))}
          {err&&<p style={{color:C.red,fontSize:13,marginBottom:16,textAlign:'center',fontWeight:700}}>{err}</p>}
          <button onClick={go} style={{...S.btnRed,width:'100%',padding:14,fontSize:16,borderRadius:14}}>Entrar</button>
          <div style={{marginTop:20,padding:16,background:C.redLight,borderRadius:12}}>
            <p style={{fontSize:11,color:C.red,fontWeight:800,marginBottom:8}}>DEMO (senha: 1234)</p>
            {USERS.map(u=><button key={u.id} onClick={()=>{setEmail(u.email);setPass('1234')}} style={{display:'block',background:'none',border:'none',color:C.grayDark,fontSize:12,cursor:'pointer',padding:'3px 0',fontFamily:"'Nunito'",fontWeight:600}}>{u.email} — <span style={{color:C.red,fontWeight:800}}>{ROLE_LABELS[u.role]}</span></button>)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [user,setUser]         = useState(null)
  const [tab,setTab]           = useState('dashboard')
  const [products,setProducts] = useState([])
  const [movements,setMovements] = useState([])
  const [loading,setLoading]   = useState(true)
  const [modal,setModal]       = useState(null)
  const [toast,setToast]       = useState(null)
  const [filterDate,setFilterDate] = useState(todayStr())
  const [filterTurno,setFilterTurno] = useState('todos')
  const [filterSetor,setFilterSetor] = useState('todos')
  const [editProd,setEditProd] = useState(null)
  const [search,setSearch]     = useState('')
  const [movForm,setMovForm]   = useState({productId:'',qty:'',note:'',type:'entrada',setor:SETORES[0],turno:getTurnoAtual()})
  const [prodForm,setProdForm] = useState({name:'',category:CATS[0],unit:'kg',quantity:'',min_stock:'',max_stock:'',cost:'',barcode:'',supplier:'',expiry:'',setor:SETORES[0]})
  const [dashTurno,setDashTurno] = useState(getTurnoAtual())
  const [dashSetor,setDashSetor] = useState('todos')
  const [sepForm,setSepForm] = useState({productId:'',qty:'',turnoDestino:'T2',dataDestino:'',obs:''})

  useEffect(()=>{
    if(!user) return
    const load=async()=>{
      setLoading(true)
      const [{data:prods},{data:movs}]=await Promise.all([
        supabase.from('produtos').select('*').order('name'),
        supabase.from('movimentos').select('*').order('created_at',{ascending:false}).limit(500),
      ])
      if(prods) setProducts(prods)
      if(movs)  setMovements(movs)
      setLoading(false)
    }
    load()
    const ch=supabase.channel('changes')
      .on('postgres_changes',{event:'*',schema:'public',table:'produtos'},()=>load())
      .on('postgres_changes',{event:'*',schema:'public',table:'movimentos'},()=>load())
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[user])

  const showToast=(msg,type='ok')=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3500) }
  const canManage = user&&(user.role==='admin'||user.role==='gerente')
  const canAdmin  = user&&user.role==='admin'

  const todayMov   = movements.filter(m=>m.created_at?.startsWith(todayStr()))
  const totalCost  = products.reduce((s,p)=>s+p.quantity*p.cost,0)
  const lowStock   = products.filter(p=>p.quantity<=p.min_stock&&p.quantity>0)
  const semEstoque = products.filter(p=>p.quantity===0)
  const expiring   = products.filter(p=>{ if(!p.expiry) return false; const d=(new Date(p.expiry)-new Date())/86400000; return d<=7&&d>=0 })
  const filtered   = products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.category.toLowerCase().includes(search.toLowerCase()))
  const pctOk      = products.length ? Math.round((products.filter(p=>p.quantity>p.min_stock).length/products.length)*100) : 100

  // Movimentos filtrados por turno e setor
  const movFiltrados = useMemo(()=>{
    let movs = movements.filter(m=>m.created_at?.startsWith(todayStr()))
    if(dashTurno!=='todos') movs=movs.filter(m=>getTurnoFromDate(m.created_at)===dashTurno)
    if(dashSetor!=='todos') movs=movs.filter(m=>m.setor===dashSetor)
    return movs
  },[movements,dashTurno,dashSetor])

  const last7 = useMemo(()=>{
    const days=[]
    for(let i=6;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i)
      const ds=d.toISOString().split('T')[0]
      const dm=movements.filter(m=>m.created_at?.startsWith(ds))
      days.push({ date:d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}), fullDate:ds, entradas:dm.filter(m=>m.type==='entrada').reduce((s,m)=>s+m.quantity,0), saidas:dm.filter(m=>m.type==='saida').reduce((s,m)=>s+m.quantity,0) })
    }
    return days
  },[movements])

  // Stats por turno
  const statsPorTurno = useMemo(()=>
    TURNOS.map(t=>{
      const movs=todayMov.filter(m=>getTurnoFromDate(m.created_at)===t.id)
      return { ...t, entradas:movs.filter(m=>m.type==='entrada').reduce((s,m)=>s+m.quantity,0), saidas:movs.filter(m=>m.type==='saida').reduce((s,m)=>s+m.quantity,0), custo:movs.filter(m=>m.type==='saida').reduce((s,m)=>s+m.quantity*(m.cost_unit||0),0), total:movs.length }
    })
  ,[todayMov])

  // Stats por setor
  const statsPorSetor = useMemo(()=>
    SETORES.map(s=>{
      const movs=todayMov.filter(m=>m.setor===s)
      return { setor:s, entradas:movs.filter(m=>m.type==='entrada').reduce((sm,m)=>sm+m.quantity,0), saidas:movs.filter(m=>m.type==='saida').reduce((sm,m)=>sm+m.quantity,0), custo:movs.filter(m=>m.type==='saida').reduce((sm,m)=>sm+m.quantity*(m.cost_unit||0),0), total:movs.length }
    })
  ,[todayMov])

  const topProdutos = useMemo(()=>
    [...products].map(p=>({...p,totalSaida:movements.filter(m=>m.product_id===p.id&&m.type==='saida').reduce((s,m)=>s+m.quantity,0)})).sort((a,b)=>b.totalSaida-a.totalSaida).slice(0,5)
  ,[products,movements])

  // Carnes separadas pendentes para o turno atual ou dia seguinte
  const separacoesPendentes = useMemo(()=>
    movements.filter(m=>m.type==='separacao'&&m.para_turno===getTurnoAtual()&&(m.para_data===todayStr()||!m.para_data))
  ,[movements])

  const custoDia  = todayMov.filter(m=>m.type==='saida').reduce((s,m)=>s+m.quantity*(m.cost_unit||0),0)
  const custoMes  = movements.filter(m=>{ const d=new Date(m.created_at); const n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()&&m.type==='saida' }).reduce((s,m)=>s+m.quantity*(m.cost_unit||0),0)

  const handleMovement=async()=>{
    const pid=movForm.productId; const qty=parseFloat(movForm.qty)
    if(!pid||!qty||qty<=0) return showToast('Preencha produto e quantidade','err')
    const product=products.find(p=>p.id===pid)
    if(!product) return
    if(movForm.type==='saida'&&product.quantity<qty) return showToast(`Estoque insuficiente! Disponível: ${product.quantity} ${product.unit}`,'err')
    const newQty=movForm.type==='entrada'?product.quantity+qty:product.quantity-qty
    const[{error:e1},{error:e2}]=await Promise.all([
      supabase.from('produtos').update({quantity:+newQty.toFixed(3)}).eq('id',pid),
      supabase.from('movimentos').insert({product_id:pid,type:movForm.type,quantity:qty,note:movForm.note,user_name:user.name,cost_unit:product.cost,setor:movForm.setor,turno:movForm.turno}),
    ])
    if(e1||e2) return showToast('Erro ao salvar','err')
    setMovForm(f=>({...f,productId:'',qty:'',note:''})); setModal(null)
    showToast(movForm.type==='entrada'?`✓ +${qty} ${product.unit} em ${movForm.setor}!`:`✓ -${qty} ${product.unit} em ${movForm.setor}!`)
  }

  const handleSeparacao=async()=>{
    const pid=sepForm.productId; const qty=parseFloat(sepForm.qty)
    if(!pid||!qty||qty<=0) return showToast('Preencha produto e quantidade','err')
    const product=products.find(p=>p.id===pid)
    if(!product) return
    if(product.quantity<qty) return showToast('Estoque insuficiente!','err')
    const tDest=TURNOS.find(t=>t.id===sepForm.turnoDestino)
    const dataLabel=sepForm.dataDestino?new Date(sepForm.dataDestino+'T12:00:00').toLocaleDateString('pt-BR'):'próximo turno'
    const nota='Separado para '+tDest?.label+' ('+dataLabel+')'+(sepForm.obs?' - '+sepForm.obs:'')
    const{error}=await supabase.from('movimentos').insert({product_id:pid,type:'separacao',quantity:qty,note:nota,user_name:user.name,cost_unit:product.cost,setor:'Churrasco',turno:getTurnoAtual(),para_turno:sepForm.turnoDestino,para_data:sepForm.dataDestino||null})
    if(error) return showToast('Erro ao salvar','err')
    setSepForm({productId:'',qty:'',turnoDestino:'T2',dataDestino:'',obs:''}); setModal(null)
    showToast('Carnes separadas com sucesso! 🥩')
  }

  const handleSaveProd=async()=>{
    if(!prodForm.name||!prodForm.quantity) return showToast('Nome e quantidade obrigatórios','err')
    const data={name:prodForm.name,category:prodForm.category,unit:prodForm.unit,quantity:+prodForm.quantity,min_stock:+prodForm.min_stock||0,max_stock:+prodForm.max_stock||999,cost:+prodForm.cost||0,barcode:prodForm.barcode||null,supplier:prodForm.supplier||null,expiry:prodForm.expiry||null,setor:prodForm.setor}
    const{error}=editProd?await supabase.from('produtos').update(data).eq('id',editProd):await supabase.from('produtos').insert(data)
    if(error) return showToast('Erro ao salvar','err')
    setProdForm({name:'',category:CATS[0],unit:'kg',quantity:'',min_stock:'',max_stock:'',cost:'',barcode:'',supplier:'',expiry:'',setor:SETORES[0]}); setEditProd(null); setModal(null)
    showToast(editProd?'✓ Produto atualizado!':'✓ Produto cadastrado!')
  }

  const openEdit=(p)=>{ setEditProd(p.id); setProdForm({name:p.name,category:p.category,unit:p.unit,quantity:String(p.quantity),min_stock:String(p.min_stock),max_stock:String(p.max_stock),cost:String(p.cost),barcode:p.barcode||'',supplier:p.supplier||'',expiry:p.expiry||'',setor:p.setor||SETORES[0]}); setModal('produto') }
  const openMov=(type,product=null)=>{ setMovForm({productId:product?product.id:'',qty:'',note:'',type,setor:SETORES[0],turno:getTurnoAtual()}); setModal('movimento') }

  if(!user) return <Login onLogin={setUser} />

  const turnoAtual = TURNOS.find(t=>t.id===getTurnoAtual())
  const TABS=[
    {key:'dashboard',label:'Painel',icon:'🏠'},
    {key:'estoque',label:'Estoque',icon:'📦'},
    {key:'movimentos',label:'Movimentos',icon:'🔄'},
    {key:'relatorios',label:'Relatórios',icon:'📊'},
    ...(canAdmin?[{key:'usuarios',label:'Usuários',icon:'👥'}]:[]),
  ]

  return (
    <div style={{minHeight:'100vh',background:C.gray,fontFamily:"'Nunito',sans-serif",color:C.text,paddingBottom:80}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.grayMid};border-radius:3px}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus{border-color:${C.red}!important;outline:none}.rh:hover{background:${C.redLight}!important}.cc:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.12)!important;cursor:pointer}`}</style>

      {/* HEADER */}
      <div style={{background:C.red,padding:'0 16px',display:'flex',alignItems:'center',height:56,gap:12,boxShadow:'0 2px 12px rgba(234,29,44,0.3)',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
          <div style={{width:34,height:34,background:'rgba(255,255,255,0.2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🍽️</div>
          <div>
            <span style={{fontWeight:900,fontSize:15,color:C.white}}>Estoque</span>
            <span style={{fontSize:11,color:'rgba(255,255,255,0.8)',marginLeft:8}}>{turnoAtual?.icon} {turnoAtual?.label} · {turnoAtual?.sub}</span>
          </div>
          {loading&&<span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>⟳</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {(lowStock.length+semEstoque.length)>0&&<div style={{background:'rgba(255,255,255,0.2)',borderRadius:20,padding:'4px 10px',fontSize:11,color:C.white,fontWeight:800,cursor:'pointer'}} onClick={()=>setTab('estoque')}>🚨 {lowStock.length+semEstoque.length}</div>}
          <div style={{background:'rgba(255,255,255,0.15)',borderRadius:20,padding:'5px 10px',display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:26,height:26,background:'rgba(255,255,255,0.3)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:C.white,fontSize:12}}>{user.avatar}</div>
            <span style={{fontSize:12,color:C.white,fontWeight:700}}>{user.name.split(' ')[0]}</span>
          </div>
          <button onClick={()=>setUser(null)} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:20,padding:'5px 12px',color:C.white,fontSize:11,cursor:'pointer',fontFamily:"'Nunito'",fontWeight:700}}>Sair</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{background:C.white,padding:'0 16px',display:'flex',overflowX:'auto',borderBottom:`2px solid ${C.grayMid}`,position:'sticky',top:56,zIndex:99}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{background:'none',border:'none',borderBottom:tab===t.key?`3px solid ${C.red}`:'3px solid transparent',color:tab===t.key?C.red:C.grayDark,padding:'12px 14px',fontFamily:"'Nunito'",fontSize:12,fontWeight:tab===t.key?800:600,cursor:'pointer',whiteSpace:'nowrap'}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:14,maxWidth:1100,margin:'0 auto',animation:'fadeUp 0.3s ease'}} key={tab}>

        {/* ══ DASHBOARD ══ */}
        {tab==='dashboard'&&<>

          {/* BANNER */}
          <div style={{background:`linear-gradient(135deg,${C.red},#ff4757)`,borderRadius:16,padding:'16px 18px',marginBottom:14,color:C.white,boxShadow:'0 4px 16px rgba(234,29,44,0.3)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <p style={{fontSize:12,opacity:0.85,fontWeight:600}}>{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</p>
                <p style={{fontWeight:900,fontSize:19,marginTop:2}}>Olá, {user.name.split(' ')[0]}! 👋</p>
              </div>
              <div style={{textAlign:'right'}}>
                <p style={{fontSize:10,opacity:0.75}}>💰 Valor em estoque</p>
                <p style={{fontWeight:900,fontSize:20}}>{fmtCur(totalCost)}</p>
                <p style={{fontSize:10,opacity:0.7}}>{products.length} produtos · {pctOk}% OK</p>
              </div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button onClick={()=>openMov('entrada')} style={{background:'rgba(255,255,255,0.25)',border:'1px solid rgba(255,255,255,0.4)',borderRadius:10,padding:'7px 14px',color:C.white,fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:"'Nunito'"}}>+ Entrada</button>
              <button onClick={()=>openMov('saida')} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:10,padding:'7px 14px',color:C.white,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Nunito'"}}>− Saída</button>
              {canManage&&<button onClick={()=>{setEditProd(null);setProdForm({name:'',category:CATS[0],unit:'kg',quantity:'',min_stock:'',max_stock:'',cost:'',barcode:'',supplier:'',expiry:'',setor:SETORES[0]});setModal('produto')}} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:10,padding:'7px 14px',color:C.white,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Nunito'"}}>+ Produto</button>}
              <button onClick={()=>setModal('separacao')} style={{background:'rgba(139,69,19,0.4)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:10,padding:'7px 14px',color:C.white,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Nunito'"}}>🥩 Separar Carnes</button>
            </div>
          </div>

          {/* ALERTA CARNES SEPARADAS */}
          {separacoesPendentes.length>0&&(
            <div style={{...S.card,border:'2px solid #8B4513',background:'#FFF5EE',marginBottom:14,padding:14}}>
              <p style={{fontSize:12,fontWeight:800,color:'#8B4513',marginBottom:10}}>🥩 CARNES SEPARADAS PARA ESTE TURNO</p>
              <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {separacoesPendentes.map(m=>{
                  const p=products.find(x=>x.id===m.product_id)
                  return(
                    <div key={m.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:C.white,borderRadius:10,padding:'9px 12px',border:'1px solid #8B451333'}}>
                      <div>
                        <p style={{fontWeight:800,fontSize:13}}>{p?.name||'—'}</p>
                        <p style={{fontSize:10,color:C.grayDark,fontWeight:600}}>{m.note} · por {m.user_name}</p>
                      </div>
                      <span style={{color:'#8B4513',fontWeight:900,fontSize:14}}>{m.quantity} {p?.unit}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* FILTROS TURNO + SETOR */}
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            <div style={{display:'flex',gap:6,background:C.white,borderRadius:12,padding:6,boxShadow:'0 1px 4px rgba(0,0,0,0.08)'}}>
              <button onClick={()=>setDashTurno('todos')} style={{...S.btnGray,padding:'6px 12px',fontSize:11,background:dashTurno==='todos'?C.red:C.gray,color:dashTurno==='todos'?C.white:C.grayDark,borderRadius:8,fontWeight:dashTurno==='todos'?800:600}}>Todos os Turnos</button>
              {TURNOS.map(t=><button key={t.id} onClick={()=>setDashTurno(t.id)} style={{...S.btnGray,padding:'6px 12px',fontSize:11,background:dashTurno===t.id?C.red:C.gray,color:dashTurno===t.id?C.white:C.grayDark,borderRadius:8,fontWeight:dashTurno===t.id?800:600}}>{t.icon} {t.label}</button>)}
            </div>
            <div style={{display:'flex',gap:6,background:C.white,borderRadius:12,padding:6,boxShadow:'0 1px 4px rgba(0,0,0,0.08)'}}>
              <button onClick={()=>setDashSetor('todos')} style={{...S.btnGray,padding:'6px 12px',fontSize:11,background:dashSetor==='todos'?C.text:C.gray,color:dashSetor==='todos'?C.white:C.grayDark,borderRadius:8,fontWeight:dashSetor==='todos'?800:600}}>Todos os Setores</button>
              {SETORES.map(s=><button key={s} onClick={()=>setDashSetor(s)} style={{...S.btnGray,padding:'6px 12px',fontSize:11,background:dashSetor===s?SETOR_COLORS[s]:C.gray,color:dashSetor===s?C.white:C.grayDark,borderRadius:8,fontWeight:dashSetor===s?800:600}}>{SETOR_ICONS[s]} {s}</button>)}
            </div>
          </div>

          {/* CARDS POR TURNO */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
            {TURNOS.map(t=>{
              const stats=statsPorTurno.find(x=>x.id===t.id)
              const isAtual=t.id===getTurnoAtual()
              return(
                <div key={t.id} className="cc" onClick={()=>setDashTurno(dashTurno===t.id?'todos':t.id)} style={{...S.card,border:`2px solid ${dashTurno===t.id?C.red:isAtual?C.red+'44':C.grayMid}`,background:dashTurno===t.id?C.redLight:C.white,transition:'all 0.2s',padding:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div>
                      <p style={{fontWeight:800,fontSize:14,color:C.text}}>{t.icon} {t.label}</p>
                      <p style={{fontSize:11,color:C.grayDark,fontWeight:600}}>{t.sub}</p>
                    </div>
                    {isAtual&&<span style={{background:C.red,color:C.white,fontSize:9,padding:'3px 8px',borderRadius:20,fontWeight:800}}>ATUAL</span>}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:8}}>
                    <div style={{textAlign:'center',background:C.gray,borderRadius:10,padding:'8px 4px'}}>
                      <p style={{fontSize:18,fontWeight:900,color:C.green}}>+{stats?.entradas||0}</p>
                      <p style={{fontSize:9,color:C.grayDark,fontWeight:700}}>ENTRADAS</p>
                    </div>
                    <div style={{textAlign:'center',background:C.gray,borderRadius:10,padding:'8px 4px'}}>
                      <p style={{fontSize:18,fontWeight:900,color:C.red}}>-{stats?.saidas||0}</p>
                      <p style={{fontSize:9,color:C.grayDark,fontWeight:700}}>SAÍDAS</p>
                    </div>
                    <div style={{textAlign:'center',background:C.gray,borderRadius:10,padding:'8px 4px'}}>
                      <p style={{fontSize:14,fontWeight:900,color:C.purple}}>{fmtCur(stats?.custo||0).replace('R$ ','')}</p>
                      <p style={{fontSize:9,color:C.grayDark,fontWeight:700}}>CUSTO</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CARDS POR SETOR */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
            {statsPorSetor.map(s=>(
              <div key={s.setor} className="cc" onClick={()=>setDashSetor(dashSetor===s.setor?'todos':s.setor)} style={{...S.card,border:`2px solid ${dashSetor===s.setor?SETOR_COLORS[s.setor]:C.grayMid}`,background:dashSetor===s.setor?SETOR_COLORS[s.setor]+'11':C.white,transition:'all 0.2s',padding:14}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{width:36,height:36,background:SETOR_COLORS[s.setor]+'22',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{SETOR_ICONS[s.setor]}</div>
                  <div><p style={{fontWeight:800,fontSize:13,color:C.text}}>{s.setor}</p><p style={{fontSize:10,color:C.grayDark,fontWeight:600}}>{s.total} movimentos hoje</p></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  <div style={{background:C.gray,borderRadius:8,padding:'6px 8px',textAlign:'center'}}>
                    <p style={{fontWeight:900,fontSize:16,color:C.green}}>+{s.entradas}</p>
                    <p style={{fontSize:9,color:C.grayDark,fontWeight:700}}>ENT.</p>
                  </div>
                  <div style={{background:C.gray,borderRadius:8,padding:'6px 8px',textAlign:'center'}}>
                    <p style={{fontWeight:900,fontSize:16,color:C.red}}>-{s.saidas}</p>
                    <p style={{fontSize:9,color:C.grayDark,fontWeight:700}}>SAÍ.</p>
                  </div>
                </div>
                <p style={{fontSize:11,color:SETOR_COLORS[s.setor],fontWeight:800,marginTop:8,textAlign:'center'}}>{fmtCur(s.custo)} de custo</p>
              </div>
            ))}
          </div>

          {/* ALERTAS */}
          {(lowStock.length>0||expiring.length>0||semEstoque.length>0)&&(
            <div style={{...S.card,border:`1.5px solid ${C.red}`,background:C.redLight,marginBottom:14,padding:14}}>
              <p style={{fontSize:12,fontWeight:800,color:C.red,marginBottom:10}}>🚨 ALERTAS — AÇÃO NECESSÁRIA</p>
              <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {semEstoque.map(p=>(
                  <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:C.white,borderRadius:10,padding:'9px 12px'}}>
                    <div><p style={{fontWeight:800,fontSize:13}}>{p.name}</p><p style={{fontSize:10,color:C.grayDark}}>{p.category} · {p.setor||'—'}</p></div>
                    <span style={{background:C.red,color:C.white,fontSize:10,padding:'3px 10px',borderRadius:20,fontWeight:800}}>ZERADO</span>
                  </div>
                ))}
                {lowStock.map(p=>(
                  <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:C.white,borderRadius:10,padding:'9px 12px'}}>
                    <div><p style={{fontWeight:800,fontSize:13}}>{p.name}</p><p style={{fontSize:10,color:C.grayDark}}>{p.setor||'—'}</p></div>
                    <span style={{color:C.orange,fontWeight:800,fontSize:12}}>{p.quantity}/{p.min_stock} {p.unit}</span>
                  </div>
                ))}
                {expiring.map(p=>(
                  <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:C.white,borderRadius:10,padding:'9px 12px'}}>
                    <div><p style={{fontWeight:800,fontSize:13}}>{p.name}</p><p style={{fontSize:10,color:C.grayDark}}>{p.setor||'—'}</p></div>
                    <span style={{color:C.orange,fontWeight:800,fontSize:11}}>⏰ Vence {fmtDate(p.expiry)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LINHA DO TEMPO FILTRADA */}
          <div style={{...S.card,marginBottom:14,padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <p style={{fontSize:12,fontWeight:800,color:C.grayDark}}>⏱ MOVIMENTOS DE HOJE {dashTurno!=='todos'?`· ${TURNOS.find(t=>t.id===dashTurno)?.label}`:''} {dashSetor!=='todos'?`· ${dashSetor}`:''}</p>
              <div style={{display:'flex',gap:6}}>
                <span style={{background:'#F0FFF6',color:C.green,border:`1px solid ${C.green}33`,fontSize:10,padding:'3px 8px',borderRadius:20,fontWeight:800}}>+{movFiltrados.filter(m=>m.type==='entrada').reduce((s,m)=>s+m.quantity,0)}</span>
                <span style={{background:C.redLight,color:C.red,border:`1px solid ${C.red}33`,fontSize:10,padding:'3px 8px',borderRadius:20,fontWeight:800}}>-{movFiltrados.filter(m=>m.type==='saida').reduce((s,m)=>s+m.quantity,0)}</span>
              </div>
            </div>
            {movFiltrados.length===0
              ? <div style={{textAlign:'center',padding:'20px 0',color:C.grayDark}}>
                  <p style={{fontSize:28,marginBottom:6}}>📋</p>
                  <p style={{fontWeight:700,fontSize:13}}>Nenhum movimento {dashTurno!=='todos'?'neste turno':''} {dashSetor!=='todos'?`no setor ${dashSetor}`:''}</p>
                </div>
              : <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {movFiltrados.slice(0,8).map(m=>{
                    const p=products.find(x=>x.id===m.product_id)
                    const tInfo=TURNOS.find(t=>t.id===getTurnoFromDate(m.created_at))
                    return(
                      <div key={m.id} style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{fontSize:11,color:C.grayDark,fontWeight:600,width:36,flexShrink:0}}>{new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                        <div style={{width:2,height:36,background:m.type==='entrada'?C.green:C.red,borderRadius:2,flexShrink:0}} />
                        <div style={{flex:1,background:m.type==='entrada'?'#F0FFF6':C.redLight,borderRadius:10,padding:'7px 10px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontWeight:800,fontSize:12,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p?.name||'—'}</p>
                            <div style={{display:'flex',gap:6,marginTop:2}}>
                              <span style={{fontSize:9,color:C.grayDark,fontWeight:600}}>{m.user_name}</span>
                              {m.setor&&<span style={{fontSize:9,background:SETOR_COLORS[m.setor]+'22',color:SETOR_COLORS[m.setor],padding:'1px 6px',borderRadius:10,fontWeight:700}}>{SETOR_ICONS[m.setor]} {m.setor}</span>}
                              {tInfo&&<span style={{fontSize:9,background:'#f0f0f0',color:C.grayDark,padding:'1px 6px',borderRadius:10,fontWeight:600}}>{tInfo.icon} {tInfo.label}</span>}
                            </div>
                          </div>
                          <span style={{fontWeight:900,fontSize:13,color:m.type==='entrada'?C.green:C.red,flexShrink:0}}>{m.type==='entrada'?'+':'-'}{m.quantity} {p?.unit}</span>
                        </div>
                      </div>
                    )
                  })}
                  {movFiltrados.length>8&&<button onClick={()=>setTab('movimentos')} style={{...S.btnGray,width:'100%',marginTop:4,fontSize:12}}>Ver todos os {movFiltrados.length} movimentos →</button>}
                </div>
            }
          </div>

          {/* GRÁFICO + MAIS CONSUMIDOS */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={S.card}>
              <p style={{fontSize:12,fontWeight:800,color:C.grayDark,marginBottom:10}}>📈 MOVIMENTOS — 7 DIAS</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={last7} barCategoryGap="30%">
                  <XAxis dataKey="date" tick={{fill:C.grayDark,fontSize:9}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:C.grayDark,fontSize:9}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{background:C.white,border:`1px solid ${C.grayMid}`,borderRadius:10,fontSize:11}} />
                  <Bar dataKey="entradas" fill={C.green} radius={[4,4,0,0]} name="Entradas" />
                  <Bar dataKey="saidas"   fill={C.red}   radius={[4,4,0,0]} name="Saídas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={S.card}>
              <p style={{fontSize:12,fontWeight:800,color:C.grayDark,marginBottom:10}}>🔥 MAIS CONSUMIDOS</p>
              {topProdutos.filter(p=>p.totalSaida>0).length===0
                ? <p style={{color:C.grayDark,fontSize:12,textAlign:'center',padding:'20px 0',fontWeight:600}}>Sem dados ainda</p>
                : topProdutos.filter(p=>p.totalSaida>0).map((p,i)=>{
                    const max=topProdutos[0].totalSaida||1
                    return(
                      <div key={p.id} style={{marginBottom:9}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                          <span style={{fontSize:12,fontWeight:700}}>{i+1}. {p.name}</span>
                          <span style={{fontSize:11,fontWeight:800,color:C.red}}>{p.totalSaida} {p.unit}</span>
                        </div>
                        <div style={{background:C.grayMid,borderRadius:4,height:5,overflow:'hidden'}}>
                          <div style={{width:`${(p.totalSaida/max)*100}%`,height:'100%',background:PIE_COLORS[i],borderRadius:4}} />
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          </div>
        </>}

        {/* ══ ESTOQUE ══ */}
        {tab==='estoque'&&<>
          <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
            <input placeholder="🔍 Buscar produto..." value={search} onChange={e=>setSearch(e.target.value)} style={{...S.input,flex:1,minWidth:200}} />
            <select value={filterSetor} onChange={e=>setFilterSetor(e.target.value)} style={{...S.input,width:'auto',flex:'none'}}>
              <option value="todos">Todos os Setores</option>
              {SETORES.map(s=><option key={s} value={s}>{SETOR_ICONS[s]} {s}</option>)}
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:12}}>
            {filtered.filter(p=>filterSetor==='todos'||p.setor===filterSetor).map(p=>{
              const isLow=p.quantity<=p.min_stock; const pct=Math.min(100,(p.quantity/(p.max_stock||1))*100); const isExp=p.expiry&&(new Date(p.expiry)-new Date())/86400000<=7
              return(
                <div key={p.id} style={{...S.card,border:`1.5px solid ${isLow?C.red:C.grayMid}`,background:isLow?C.redLight:C.white}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div>
                      <p style={{fontWeight:800,fontSize:14,marginBottom:2}}>{p.name}</p>
                      <div style={{display:'flex',gap:5,alignItems:'center'}}>
                        <p style={{fontSize:11,color:C.grayDark,fontWeight:600}}>{p.category}</p>
                        {p.setor&&<span style={{fontSize:9,background:SETOR_COLORS[p.setor]+'22',color:SETOR_COLORS[p.setor],padding:'1px 6px',borderRadius:10,fontWeight:700}}>{SETOR_ICONS[p.setor]} {p.setor}</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:4}}>
                      {isLow&&<span style={{background:C.red,color:C.white,fontSize:9,padding:'2px 7px',borderRadius:20,fontWeight:800}}>BAIXO</span>}
                      {isExp&&<span style={{background:C.orange,color:C.white,fontSize:9,padding:'2px 7px',borderRadius:20,fontWeight:800}}>VENCE</span>}
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'baseline',gap:5,marginBottom:6}}>
                    <span style={{fontWeight:900,fontSize:28,color:isLow?C.red:C.text,lineHeight:1}}>{p.quantity}</span>
                    <span style={{fontSize:12,color:C.grayDark,fontWeight:600}}>{p.unit}</span>
                    <span style={{marginLeft:'auto',fontSize:11,color:C.green,fontWeight:800}}>{fmtCur(p.cost)}/{p.unit}</span>
                  </div>
                  <div style={{background:C.grayMid,borderRadius:6,height:5,marginBottom:10,overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:'100%',background:isLow?C.red:C.green,borderRadius:6}} />
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:10,color:C.grayDark,fontWeight:600}}>Mín:{p.min_stock} · Máx:{p.max_stock}</span>
                    <div style={{display:'flex',gap:5}}>
                      <button style={{...S.btnGray,padding:'4px 10px',fontSize:11,color:C.green,fontWeight:800}} onClick={()=>openMov('entrada',p)}>+</button>
                      <button style={{...S.btnGray,padding:'4px 10px',fontSize:11,color:C.red,fontWeight:800}} onClick={()=>openMov('saida',p)}>−</button>
                      {canManage&&<button style={{...S.btnGray,padding:'4px 9px',fontSize:11}} onClick={()=>openEdit(p)}>✏️</button>}
                    </div>
                  </div>
                  {p.expiry&&<p style={{fontSize:10,color:isExp?C.orange:C.grayDark,marginTop:7,fontWeight:600}}>📅 Validade: {fmtDate(p.expiry)}</p>}
                </div>
              )
            })}
          </div>
        </>}

        {/* ══ MOVIMENTOS ══ */}
        {tab==='movimentos'&&<>
          <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
            <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{...S.input,width:'auto',flex:'none'}} />
            <select value={filterTurno} onChange={e=>setFilterTurno(e.target.value)} style={{...S.input,width:'auto',flex:'none'}}>
              <option value="todos">Todos os Turnos</option>
              {TURNOS.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
            <select value={filterSetor} onChange={e=>setFilterSetor(e.target.value)} style={{...S.input,width:'auto',flex:'none'}}>
              <option value="todos">Todos os Setores</option>
              {SETORES.map(s=><option key={s} value={s}>{SETOR_ICONS[s]} {s}</option>)}
            </select>
          </div>
          <div style={{...S.card,padding:0,overflow:'hidden'}}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:550}}>
                <thead><tr style={{background:C.gray}}>{['Horário','Produto','Tipo','Qtd','Turno','Setor','Usuário'].map(h=><th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:10,fontWeight:800,color:C.grayDark}}>{h.toUpperCase()}</th>)}</tr></thead>
                <tbody>
                  {movements.filter(m=>{
                    if(filterDate&&!m.created_at?.startsWith(filterDate)) return false
                    if(filterTurno!=='todos'&&getTurnoFromDate(m.created_at)!==filterTurno) return false
                    if(filterSetor!=='todos'&&m.setor!==filterSetor) return false
                    return true
                  }).map(m=>{
                    const p=products.find(x=>x.id===m.product_id)
                    const tInfo=TURNOS.find(t=>t.id===getTurnoFromDate(m.created_at))
                    return(
                      <tr key={m.id} className="rh" style={{borderBottom:`1px solid ${C.gray}`,transition:'background 0.15s'}}>
                        <td style={{padding:'9px 12px',color:C.grayDark,fontSize:11,fontWeight:600}}>{new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                        <td style={{padding:'9px 12px',fontWeight:700,fontSize:12}}>{p?.name||'—'}</td>
                        <td style={{padding:'9px 12px'}}><span style={{background:m.type==='entrada'?'#F0FFF6':C.redLight,color:m.type==='entrada'?C.green:C.red,border:`1px solid ${m.type==='entrada'?C.green:C.red}`,fontSize:9,padding:'2px 8px',borderRadius:20,fontWeight:800}}>{m.type==='entrada'?'Entrada':'Saída'}</span></td>
                        <td style={{padding:'9px 12px',fontWeight:900,fontSize:14,color:m.type==='entrada'?C.green:C.red}}>{m.type==='entrada'?'+':'-'}{m.quantity}<span style={{fontSize:9,color:C.grayDark,fontWeight:600,marginLeft:2}}>{p?.unit}</span></td>
                        <td style={{padding:'9px 12px'}}>{tInfo&&<span style={{fontSize:10,background:C.gray,padding:'2px 8px',borderRadius:20,fontWeight:700,color:C.text}}>{tInfo.icon} {tInfo.label}</span>}</td>
                        <td style={{padding:'9px 12px'}}>{m.setor&&<span style={{fontSize:10,background:SETOR_COLORS[m.setor]+'22',color:SETOR_COLORS[m.setor],padding:'2px 8px',borderRadius:20,fontWeight:700}}>{SETOR_ICONS[m.setor]} {m.setor}</span>}</td>
                        <td style={{padding:'9px 12px'}}><span style={{fontSize:10,color:C.grayDark,background:C.gray,padding:'2px 8px',borderRadius:20,fontWeight:700}}>{m.user_name||'—'}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* ══ RELATÓRIOS ══ */}
        {tab==='relatorios'&&<>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
            {[{label:'Valor Total',val:fmtCur(totalCost),color:C.red,icon:'💰'},{label:'Custo do Mês',val:fmtCur(custoMes),color:C.purple,icon:'📅'},{label:'Custo do Dia',val:fmtCur(custoDia),color:C.orange,icon:'💸'}].map(c=>(
              <div key={c.label} style={{...S.card,textAlign:'center',border:`1.5px solid ${c.color}33`}}>
                <p style={{fontSize:22,marginBottom:4}}>{c.icon}</p>
                <p style={{fontWeight:900,fontSize:20,color:c.color}}>{c.val}</p>
                <p style={{fontSize:11,color:C.grayDark,fontWeight:600,marginTop:4}}>{c.label}</p>
              </div>
            ))}
          </div>

          {/* COMPARATIVO DE TURNOS */}
          <div style={{...S.card,marginBottom:14,padding:16}}>
            <p style={{fontSize:13,fontWeight:800,marginBottom:12}}>🔄 COMPARATIVO DE TURNOS — HOJE</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {statsPorTurno.map(t=>(
                <div key={t.id} style={{background:C.gray,borderRadius:12,padding:14}}>
                  <p style={{fontWeight:800,fontSize:13,marginBottom:8}}>{t.icon} {t.label} <span style={{fontSize:11,color:C.grayDark,fontWeight:600}}>({t.sub})</span></p>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                    {[{l:'Entradas',v:`+${t.entradas}`,c:C.green},{l:'Saídas',v:`-${t.saidas}`,c:C.red},{l:'Custo',v:fmtCur(t.custo),c:C.purple}].map(x=>(
                      <div key={x.l} style={{background:C.white,borderRadius:8,padding:'8px 4px',textAlign:'center'}}>
                        <p style={{fontWeight:900,fontSize:13,color:x.c}}>{x.v}</p>
                        <p style={{fontSize:9,color:C.grayDark,fontWeight:700}}>{x.l.toUpperCase()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COMPARATIVO DE SETORES */}
          <div style={{...S.card,marginBottom:14,padding:16}}>
            <p style={{fontSize:13,fontWeight:800,marginBottom:12}}>🏢 COMPARATIVO DE SETORES — HOJE</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {statsPorSetor.map(s=>(
                <div key={s.setor} style={{background:SETOR_COLORS[s.setor]+'11',border:`1.5px solid ${SETOR_COLORS[s.setor]}33`,borderRadius:12,padding:14}}>
                  <p style={{fontWeight:800,fontSize:13,marginBottom:8,color:SETOR_COLORS[s.setor]}}>{SETOR_ICONS[s.setor]} {s.setor}</p>
                  {[{l:'Entradas',v:`+${s.entradas}`,c:C.green},{l:'Saídas',v:`-${s.saidas}`,c:C.red},{l:'Custo',v:fmtCur(s.custo),c:C.purple}].map(x=>(
                    <div key={x.l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${SETOR_COLORS[s.setor]}22`}}>
                      <span style={{fontSize:12,fontWeight:600,color:C.grayDark}}>{x.l}</span>
                      <span style={{fontSize:12,fontWeight:900,color:x.c}}>{x.v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={{...S.card,marginBottom:14}}>
            <p style={{fontSize:12,fontWeight:800,color:C.grayDark,marginBottom:10}}>📈 MOVIMENTOS — 7 DIAS</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={last7} barCategoryGap="30%">
                <XAxis dataKey="date" tick={{fill:C.grayDark,fontSize:9}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:C.grayDark,fontSize:9}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{background:C.white,border:`1px solid ${C.grayMid}`,borderRadius:10,fontSize:11}} />
                <Bar dataKey="entradas" fill={C.green} radius={[4,4,0,0]} name="Entradas" />
                <Bar dataKey="saidas"   fill={C.red}   radius={[4,4,0,0]} name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{...S.card,padding:0,overflow:'hidden'}}>
            <div style={{padding:'14px 18px',borderBottom:`1px solid ${C.grayMid}`,display:'flex',justifyContent:'space-between'}}>
              <p style={{fontSize:13,fontWeight:800}}>📋 Resumo do Estoque</p>
              <p style={{fontSize:13,color:C.red,fontWeight:900}}>{fmtCur(totalCost)}</p>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:500}}>
                <thead><tr style={{background:C.gray}}>{['Produto','Categoria','Setor','Qtd','Custo','Total','Status'].map(h=><th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:10,fontWeight:800,color:C.grayDark}}>{h.toUpperCase()}</th>)}</tr></thead>
                <tbody>
                  {[...products].sort((a,b)=>(b.quantity*b.cost)-(a.quantity*a.cost)).map(p=>(
                    <tr key={p.id} className="rh" style={{borderBottom:`1px solid ${C.gray}`}}>
                      <td style={{padding:'8px 12px',fontWeight:700}}>{p.name}</td>
                      <td style={{padding:'8px 12px',color:C.grayDark,fontSize:11}}>{p.category}</td>
                      <td style={{padding:'8px 12px'}}>{p.setor&&<span style={{fontSize:9,background:SETOR_COLORS[p.setor]+'22',color:SETOR_COLORS[p.setor],padding:'2px 7px',borderRadius:20,fontWeight:700}}>{SETOR_ICONS[p.setor]} {p.setor}</span>}</td>
                      <td style={{padding:'8px 12px',fontWeight:800}}>{p.quantity} {p.unit}</td>
                      <td style={{padding:'8px 12px',color:C.grayDark}}>{fmtCur(p.cost)}</td>
                      <td style={{padding:'8px 12px',color:C.green,fontWeight:800}}>{fmtCur(p.quantity*p.cost)}</td>
                      <td style={{padding:'8px 12px'}}><span style={{background:p.quantity<=p.min_stock?C.redLight:'#F0FFF6',color:p.quantity<=p.min_stock?C.red:C.green,fontSize:9,padding:'2px 8px',borderRadius:20,fontWeight:800}}>{p.quantity<=p.min_stock?'Baixo':'OK'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* ══ USUÁRIOS ══ */}
        {tab==='usuarios'&&canAdmin&&(
          <div style={{...S.card,padding:0,overflow:'hidden'}}>
            <div style={{padding:'14px 18px',borderBottom:`1px solid ${C.grayMid}`}}><p style={{fontSize:13,fontWeight:800}}>👥 Usuários do Sistema</p></div>
            {USERS.map(u=>(
              <div key={u.id} className="rh" style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',borderBottom:`1px solid ${C.gray}`}}>
                <div style={{width:42,height:42,background:C.red,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:C.white,fontSize:17}}>{u.avatar}</div>
                <div style={{flex:1}}><p style={{fontWeight:800,fontSize:14,marginBottom:2}}>{u.name}</p><p style={{color:C.grayDark,fontSize:12,fontWeight:600}}>{u.email}</p></div>
                <span style={{background:C.redLight,color:C.red,border:`1.5px solid ${C.red}33`,fontSize:10,padding:'4px 12px',borderRadius:20,fontWeight:800}}>{ROLE_LABELS[u.role].toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTÃO FLUTUANTE */}
      <button onClick={()=>openMov('entrada')} style={{position:'fixed',bottom:20,right:20,width:54,height:54,background:C.red,color:C.white,border:'none',borderRadius:'50%',fontSize:26,cursor:'pointer',boxShadow:'0 4px 20px rgba(234,29,44,0.4)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900}}>+</button>

      {/* MODAL MOVIMENTO */}
      {modal==='movimento'&&(
        <Overlay onClose={()=>setModal(null)}>
          <MHead title={movForm.type==='entrada'?'📥 Registrar Entrada':'📤 Registrar Saída'} color={movForm.type==='entrada'?C.green:C.red} onClose={()=>setModal(null)} />
          <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex',gap:8}}>
              {['entrada','saida'].map(t=>(
                <button key={t} onClick={()=>setMovForm(f=>({...f,type:t}))} style={{flex:1,padding:10,borderRadius:12,border:`2px solid ${movForm.type===t?(t==='entrada'?C.green:C.red):C.grayMid}`,background:movForm.type===t?(t==='entrada'?'#F0FFF6':C.redLight):C.white,color:movForm.type===t?(t==='entrada'?C.green:C.red):C.grayDark,fontFamily:"'Nunito'",fontWeight:800,fontSize:13,cursor:'pointer'}}>
                  {t==='entrada'?'📥 Entrada':'📤 Saída'}
                </button>
              ))}
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>PRODUTO</label>
              <select value={movForm.productId} onChange={e=>setMovForm(f=>({...f,productId:e.target.value}))} style={S.input}>
                <option value="">Selecione...</option>
                {products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit})</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{fontSize:11,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>TURNO</label>
                <select value={movForm.turno} onChange={e=>setMovForm(f=>({...f,turno:e.target.value}))} style={S.input}>
                  {TURNOS.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label} ({t.sub})</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>SETOR</label>
                <select value={movForm.setor} onChange={e=>setMovForm(f=>({...f,setor:e.target.value}))} style={S.input}>
                  {SETORES.map(s=><option key={s} value={s}>{SETOR_ICONS[s]} {s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>QUANTIDADE</label>
              <input type="number" min="0.001" step="0.001" placeholder="0" value={movForm.qty} onChange={e=>setMovForm(f=>({...f,qty:e.target.value}))} style={S.input} />
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>OBSERVAÇÃO</label>
              <input placeholder="Ex: Compra semanal..." value={movForm.note} onChange={e=>setMovForm(f=>({...f,note:e.target.value}))} style={S.input} />
            </div>
            <div style={{display:'flex',gap:8}}>
              <button style={{...S.btnRed,flex:1,background:movForm.type==='entrada'?C.green:C.red}} onClick={handleMovement}>Confirmar</button>
              <button style={{...S.btnGray,flex:1}} onClick={()=>setModal(null)}>Cancelar</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* MODAL SEPARAÇÃO CARNES */}
      {modal==='separacao'&&(
        <Overlay onClose={()=>setModal(null)}>
          <MHead title="🥩 Separar Carnes para Próximo Turno" color="#8B4513" onClose={()=>setModal(null)} />
          <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
            <div style={{background:'#FFF5EE',border:'1px solid #8B451333',borderRadius:12,padding:12}}>
              <p style={{fontSize:12,fontWeight:700,color:'#8B4513'}}>🔥 Turno atual: {TURNOS.find(t=>t.id===getTurnoAtual())?.icon} {TURNOS.find(t=>t.id===getTurnoAtual())?.label} ({TURNOS.find(t=>t.id===getTurnoAtual())?.sub})</p>
              <p style={{fontSize:11,color:C.grayDark,marginTop:4}}>As carnes separadas aparecerão como alerta no turno de destino.</p>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>PRODUTO (CARNE)</label>
              <select value={sepForm.productId} onChange={e=>setSepForm(f=>({...f,productId:e.target.value}))} style={S.input}>
                <option value="">Selecione a carne...</option>
                {products.filter(p=>p.category==='Carnes'||p.setor==='Churrasco').map(p=><option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit})</option>)}
                <optgroup label="── Outros produtos ──">
                {products.filter(p=>p.category!=='Carnes'&&p.setor!=='Churrasco').map(p=><option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit})</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>QUANTIDADE</label>
              <input type="number" min="0.001" step="0.001" placeholder="0" value={sepForm.qty} onChange={e=>setSepForm(f=>({...f,qty:e.target.value}))} style={S.input} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{fontSize:11,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>TURNO DE DESTINO</label>
                <select value={sepForm.turnoDestino} onChange={e=>setSepForm(f=>({...f,turnoDestino:e.target.value}))} style={S.input}>
                  {TURNOS.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label} ({t.sub})</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>DATA (opcional)</label>
                <input type="date" value={sepForm.dataDestino} onChange={e=>setSepForm(f=>({...f,dataDestino:e.target.value}))} style={S.input} />
              </div>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>OBSERVAÇÃO</label>
              <input placeholder="Ex: Temperar antes de usar..." value={sepForm.obs} onChange={e=>setSepForm(f=>({...f,obs:e.target.value}))} style={S.input} />
            </div>
            <div style={{display:'flex',gap:8}}>
              <button style={{...S.btnRed,flex:1,background:'#8B4513'}} onClick={handleSeparacao}>🥩 Confirmar Separação</button>
              <button style={{...S.btnGray,flex:1}} onClick={()=>setModal(null)}>Cancelar</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* MODAL PRODUTO */}
      {modal==='produto'&&canManage&&(
        <Overlay onClose={()=>setModal(null)}>
          <MHead title={editProd?'✏️ Editar Produto':'+ Novo Produto'} onClose={()=>setModal(null)} />
          <div style={{padding:'16px 20px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[{label:'NOME',key:'name',type:'text',ph:'Ex: Filé Mignon',full:true},{label:'QUANTIDADE',key:'quantity',type:'number',ph:'0'},{label:'ESTOQUE MÍNIMO',key:'min_stock',type:'number',ph:'0'},{label:'ESTOQUE MÁXIMO',key:'max_stock',type:'number',ph:'999'},{label:'CUSTO (R$)',key:'cost',type:'number',ph:'0,00'},{label:'CÓDIGO DE BARRAS',key:'barcode',type:'text',ph:'789...'},{label:'FORNECEDOR',key:'supplier',type:'text',ph:'Nome fornecedor',full:true},{label:'VALIDADE',key:'expiry',type:'date',ph:''}].map(f=>(
                <div key={f.key} style={{gridColumn:f.full?'1/-1':'auto'}}>
                  <label style={{fontSize:10,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={prodForm[f.key]} onChange={e=>setProdForm(p=>({...p,[f.key]:e.target.value}))} style={S.input} />
                </div>
              ))}
              <div>
                <label style={{fontSize:10,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>CATEGORIA</label>
                <select value={prodForm.category} onChange={e=>setProdForm(p=>({...p,category:e.target.value}))} style={S.input}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>UNIDADE</label>
                <select value={prodForm.unit} onChange={e=>setProdForm(p=>({...p,unit:e.target.value}))} style={S.input}>{['kg','g','l','ml','un','cx','pct','fardo'].map(u=><option key={u}>{u}</option>)}</select>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:10,fontWeight:800,color:C.grayDark,display:'block',marginBottom:5}}>SETOR</label>
                <select value={prodForm.setor} onChange={e=>setProdForm(p=>({...p,setor:e.target.value}))} style={S.input}>{SETORES.map(s=><option key={s} value={s}>{SETOR_ICONS[s]} {s}</option>)}</select>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button style={{...S.btnRed,flex:1}} onClick={handleSaveProd}>{editProd?'Salvar':'Cadastrar'}</button>
              <button style={{...S.btnGray,flex:1}} onClick={()=>setModal(null)}>Cancelar</button>
            </div>
          </div>
        </Overlay>
      )}

      {toast&&<Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
