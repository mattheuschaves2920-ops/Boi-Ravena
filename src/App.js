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
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAABaCAIAAAD8YgW4AAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAABFA0lEQVR42s19d5xlVZF/VZ1zw0vdr/N0mp48TCIzA8OQJCigZBRYEZWgrq6Lsuq6rKvLqj8X9bforoKoKCoKCAiIhEUyMgxh8kxP7gk93T0dX343nHPq98e9r7tBV3FX3d9jPsrQ4d1br07Vt771rboIf/EXIhAhAijNb/yKaGmQHc1O9wx31gyns8VubZT1aVmXlPUpsi2qTwjHYgZgg8wYBFiomqpvSmXOFfVIMTg0FgyMBnsP+f3D1eEJf6IYApg3vAEhABhm5r/4Xf/F3okQkJCZzdS9U3uzs2hWcunc5JLZidkddmezXZ+hZIIsiUTIxMCgGRiYGbSByEDMYDQCECEYBtTEDMDMmsIAPR/LFZUr6sFxtXewur2/vONAeddgeWTCA+Cpi0H8S1oc/zL+O92+rY3usYvTq46sO25xan6X3VQnbAtAsAJQhpWC0ANVgbCMQYlVCcISGw9UlbUCUMAhGAASiBJQAtooXBQJEEnEBJIjwCaSTIhkiDSyJj/g0Xy4e9Bbv6e4dufElr3FiaI3eXmIyH9+i/8ZDU2EiKx1/NfZnckzT6g/6/j6oxcm2pulJSFgDhQHAQRF8sbYGzSVQagcYm/C6AqwAiYgieQwWSAdQsHCRiADQKxBB8wKVMDGRw7YKGBGFEwuynq0G4VsElaDoAySi4iIhkBjGPChCbV5b3HNtvFXdowPjlUmrxYYzJ/N3n8WQwuBbNgwAEBT1jn3lOzFZ9avPDLVlEFjwDfsh+DnsXwA8zu4sMdUDrEJULjsNlKijRKt7DSRXQ8yRdJhsgEEE8YvQMOMRiNrNAaUBg5IBRx6HJYgKBh/FLxRHY6ZsMDGA7JANJJsl9YMCfWINhAQaUSD4yW9cW/huY2ja7aP5cv+pIMbw/+/G1oI1HGKo+WHZ666MHveaZmudgmGPW2CgCqHcKKXxtZxoc9oBYkmyMwS6R5KdaDTANIlIRGBCRiYwQAbMobZgNYchWaOvQ4BEOP/EYyGkY0mzagMBSHrEFWVw5wJRrk6oPwBrYsaBcoWIboltAhIITI6WmiGgzl/zbbxX68b3t6fm3TwP625/2SGFoQ6vjJ5/un1H76i8fQTHMtlozhg8sfl6HoYeJFzu0A6UD+fGpZgeqawG9CSgAxoGDQGAVQqXCpBIc/5PBeKXCxhpWx8DzwflAalwGgGQBIsJQoC1wbHwWQSEylMJTGdpmSSXBdthwQBAiqEUEPogV/kcEAF+1QwGLJi0SJplg1tUlmABlwiL+ANfYVHXxtYs200itmE+KcKJvgngROAYAwA0KVnN37iA40nHCMBdGiYQRb2WPv/EwZfZkRsXIZtx4rULLCSSAZQYeBjMQ+jw2ZwyAwN8aFhmJgw5TL4PmuFBgABCUwEEgBructwhD0AGAxwDUwgghBg25BIYl0dNjTI5mbR2ED1dWg7AiSGhkOFusL+oAr7lB4IEQC6LJ5t6XoAAwkSCNjbX3zo5YHnNw0DMCLU3ut/z9AIQLVY8faVzTd+tOWkFRLADw0DidGNctd9NLEdM7Oh+zRsXIZ2HQuD2sdSngb7sW8P79mjBwZMLgdBEEceQSwEEkF0hwhANZMSATBoBZaF/AZ8DBzdB4NhMMzGgDasNQCCZUEmjU3NonWGbG0V2TopLQgN+MyqxPqA5t0BT2hsFrzQ1s2CmZNCSEmb9xXvfnbfqzvG3nhe/+KGnoxii2bXfe66jkvekZS28imQNg+/bm3/GRX3Q/sJMOscyMxCAoAQijnatxu3bIbeLWZoiH0fCMGyUApAii1FPOmdgMCAyAyIiMhemdyk7pmvtq5xM1lGYmZAAKAIa7/B8tG9MQAzaM2hZs3gulSX4Y5Ou6Pdqm9AslAZVAp4TPPOAA4GWCd4kW06JDCkhSABq7fnfvBEX99Q8X8YSfB/EpFtS3z8PTOvf29LU1ZXTZBsgsJu2PwDyO+mnjNg9nkq3QESQJWpf694bY1Z+xr092OlUE3XJW2HEEx0KpEZAZAj62JkM0LkEDWDbQMgGM0zZqrFx3tLVgS//lmqf6ddygsSzAZUgMJioujnODKwASAGgzD5ERBRpVyWiYzvKyG5IUudXbKzU2bSwggMmCFvcIcPe0NsFHikC00SlMmmpa/Mvc8P3PnE3lDr/7Zri/9GAYIIhuGoBdnbb1x8xTkNSofsavTF1jtgyx3UvBSP+0zQc7pKZFCVafNauv9n8PO7Yf1aLJcwkZTHnn7y8N7dSoXSdkFrYiAAQiRE1ASAglAggsbGGaqtUxdGhSBgQ4mUuehvij0r/NwBuXW1QwQAYEmYtSTwy6gDJAQENJoQIIKDBIgMJIRAGj80fOIFFx1z+mnbVz/vum6lZAYH1f79KpfXloCUQyJJpsMyHZLyhtd7WDJihhVabAOfcmTD8sVNO/srhya8yAJ/XkMTYXR0rjtv9tc/Pr+zjYphmKjD0d/w2v+rUeJxf2/mnhe49VqVxOu/kT/6Lj50P+3fS5bEZBJtS1SLpWu+9KUjTz1t16uvjQ8Oum7ClhYiAgAC1jcYKVkHJARWy3DyRZVV53mvPu5KQUJAcVw0tJmJQdH7otu/000kQQci26Lff1N+3yZ7fNC2bQCDdY2KCFQYI28hZVjxqqXyuR+67r3/fNO2V17ufXF1MpkCZEsCG8xNmAMHwpExbQvMJEkkyHRbYobF+0K9yRNJsmbIaqB6mp0LTmpTBtftzE83xZ/e0ILQGG6qd//PdUs+8M4Zfqg4YYRPu74bDryoD7uSll7L9W2KfVj/srzjVvnLB2h0hJIJch2kKEQQVYvFpSuW69a2uu6ZyxYt3r1xYyU3YQlh2TYr+uAXiq2dvHW16ybItuTYQWv7q44ObCEEgkhl8MA2Z81DaQSBRhIJKUmHtO1ld2LIFiSEEMx49ZcLyQzuXJtwXFCeX5rItc2e/eFv3DLquo7j7nru+f7eXtt1I/6EECwJRFQqcn9/ODqmEw7Wp4jSkufY5JJ6zTeDKjHbNg6QNu9Y0bRodv3qLfmKp8QfY2v8o4Lyop76L1+zeG6nXQ3Dujas7gz33+XXzcPDrpb1nUHC4r498It74LU1hIiJJBC+gT4TQpTGx86+6v2zzzzr2quv+cw/fHbFokVbn3lm/a+fOrRvr1fx5y5VgWeN7LWlDWxYKzbakDBx4GVkBmmBClBak+wEqhCEnMRh3LM0LI3T0H6ZyNjtcxeses+li09/250//dm9d931y0cfveNjH9u3dauTTLBhA2wAar+IGcEPgZE7O8SSRW5jk6UtEJ4Jf1NWI6bxHcn0QslV1dpk9w37f3PLto27ctMKtD+FoSMrn3rEjM9dOd912ADXNYncc5XRF/yZFzkdZ1LGDVQA//m4fvwRqlYxlQZApGlJI0JphGSUSjc0fOond73/mmt39PYee/zxl11+2ZFLFptiaXj37oO9ewvjwwg+ALnJZCKVSqST0knaCVdI6aaSRAQMSMhIUGOqEMGveqHnaRX65VK1ZKQjWno62hcuSrQ0v7Jh3fdv/+6a36x+z3vf+9mPffSfzztfWhZDnCSjf2EAU8uaGsEP2LZg4UJ78SLHTQEIUr1+4TflxhWJltMSRqm6BPoGPvnvux5dfegt2hrfopUvXNn9iUvmaRMai5MO5R4phYd0z9XJ+oWQEbpvl7r3br1nD6bSKAjAIGEt1wNjDUUIQJKiMDp25T/903g2+9lP3JBtyBaLhY7OrqOOO3bZ4UfMmjWzsaHBkhYihqEqVypVr+r7frXqMetKtaqVmURvEQR0XNe2bSJKJpOWZaVSSSGoUqkODAxu3rjxldWr9/b1pTOZSql8590/nViz5v6vfb2+udlozcARATtpbmDQ0V+RNaMXcEsTLl+e6OoU7CCP6PGHy4lOMfPSJKO2hUmlrL+/bd+djx54K7bGt2Lly07r+di7ZperSiTAZpj4Rclysfu9bqoVJPLzz/iP/sqwwWQSjGEEpBjCAjEjMCIRIgFQ9HYMxuiP3XbbHQ8//MDP7m7v7KxWq5VyOQxDIYRt2SQIALTWSms2hmMSMy5bfusGMPqtEeEU/Swbo40homQqlU6n+/fvf/+1V3/86mu+fP75oBWTMDESjJhuNhxbYjKYMAAj+AoI+ZijraOOTIgkgmdGHighw5wPJEVCk+aGeufG7x647Rd7pUD1e22Nf9DKV7xt1sfOm5Uv+uRIK+D8g4VEh2y7OJVK6cA3DzzgbdjA6TQKAjZAOPUbCYCYKUIUiKL2FYGkw9BNpS7/4k33PvPsA/fcm0omE8lkZFAzrS8Q03V/zCsKuNEPEpHneeNjY5decfmNn7rhex/6yMDWrU4qpY02BgxGuRBqlo2LTQPAwKZma8Pg+WbuXPm201LprAHEkYcqwZBe8KGkrGPwuaHBufG7+2994A/YWvx+K5+/svsTF84plny0iKpcfLDozLayZ6dTDo8Mmzt/7O3ew3UZQgZgEDUrIwACCObIvgIwMjcBRv5uWVZYrW558skzTjt12Ymr9g4MHBoc1EoJITCisSP3/SNfkyY2WlcrlUI+39Ta+slPf+qS08/48cevH9jWm8hk2BgEJIy5EwaugW4AQI7TScSrIDIAsGXRyIjZtz/s6pDZeqw/QvpDevBJv/koWySxWlbnrGwaHDXrd+alwP+qmsHfY+WTlrV98apFnheARAyw/HDR7pHpt6UyDhwcCH/xYLniYcIlNowAAqd+owCOrpRi48YXLZEYGRkIWBKy4UqxsOCYYzpXnrgjX3h5w4Z9e/f6lYoUwrLt/0bNGoZhEAQMnEhn5syZe/KqlSsOO2x07boX7/oJK2WnM0prxjeV6qwZdBw60DDX+mXTwwgzoe9zIgHvOi+xYL5Ukgfvr5T69JKPp9BmVpxKOe/74vYn1hz6r0pH/F1sHBrm+Z31//7RwyUaZYAQK78siUaRPDORsbFvn/rlo2XDwrHBGKZpVo5SHwIQ0WRQjnyEcDJ0TH4SQCS8UkkwdM2f37BwfsF1907kdh04MHBw0LyJN3oLr5aW5tlz587q7JjV1JJRQW7b9h1r1uTHx5P1dYjI2gAAIBkAg28OOBrAMAIhszHMhoFxKkMaZiDwFQphLrwwuWiRMAj7flb1xtTSv0krbSRyaKzz/n7T1r787+SyxW9X2ACQSdo3X7usOS0CZchG78kKCHROT7mS9u0Lf/l4FUDYFnNcPU9GDCYGQhRIiCCi8heBIKqGQQBLiAvl+O0M25Zl2XZueHi4d5s6cKC+WPz0zTf3DR/a0bvNdd230stDxDAIOjo7b/33b9Drr2Nv79BLv9n57LNDu3cLSybSKWYGhviTZgBgYogDw1QymI5mKP7L5BcQGVgI1Aa39QbtM0RbC9YdLifWq9xW1bbc8auccuGEZY0PPD8SBPq3HZh+252Z4RMXLZg9wy1UFSaE/1qg89p5W9IWcLA/fPQ/KwAkJTBH0PgNcZkQBKCopT5EFEgisjKywKlPhQCEYWIGY8AYJ5FI1NVpxJH9+0CrRDI1PSu+lRwoLClR7Hzu2YFtvYHnperq0vV1AhG1lgASkRAp+oeirgwIZpqGXgShAKbIY+Lvii4VI0IcDVgCGOjn91X39Rlb8LyrktUB0/+Yn6yTxbJZ2uN86dp5ZvJD/a8MTYTa8NnLO884pnmsEIik0HvDcKvvnJ6SCZwYU088XdaGpARkjpggnFaPCEARSzbi6xMxicEicnCY/BIgA0IE/hCJEICYLQDbkqyNbdsct6reqqEtaXEYuK6bcBMWAmmNxlDsAUzAAlgAy9jcBMDITMyCIfJtZBCIEoE4sjVG2RsQCJAgblhaErSie3/ujQxxog7mXpUYfN4b36rcNI1MBO8+rfmSUzu04UhD8jsMjQjMPKMh+eFzZperobAIquy/WLWOS8hWCiv89AuVqoeWhRi3eWC6lSlCF/AGKyODYJY4FaGQQRgmY5ANIqIQRCSAJXB0PiBUfi6XTqf5LXs0Imqt67NZ9j1VLkshRBSsmAWzYCO5li0wcgiWURYhQgBkI5iJ3+DaUcEliAjiQBdhJyQizbYNhSLfd1+1koe6Odh1dmLPvRVdAZJUKusb39fT3pQwNWj7W4YGZIbrzp2drbNUiNKi8GWfmoQ4zAafXnq1cmgUHIeiFEXwBisjg6yRychTvkzIYlpEFgyCDUKNGEWMvIwmgwkDaZ3bv6+5tYXfMu2LiEqptvb24oF+Va2SEIgoECWRiBIGgGAjmaclZxbAApHiCBG5dhy2EUAASmAwkV/Xwh2DjA6a5mQC9x6Ax57wyKe2VXaiVex72LNT6Id6RoP49BVzmN8ANWiqXcJ89PzGUw5vLhQDclDvV/pgIFa4FuHOnd72nTrhEhtA5ChmRRiDmAmQiCBWogAhRqdGAAuEGgUKxBAdBSQipPiQxrcNgpmYkdm2rMFNm1sam6Ia762HjpndXQdeeomIkJkYkRmZEZEQBVHkmzVzTz+IgFORxAjmSQcSiISMzIRY61ZOuTYbzqTwlVfV2nWBLXDmBW6uNyxs006KJgr6/BObli9qMoaJ8A2GZmYivPKMHtbADKghfK0qFtkiS/lx9doG37IEAGN8ZVMolDBK0oiAUWZHjFx2ypcjK0eyrciFBIAEjqKnABDMIroxACeZHNi4sY4wVZcxk+qb3/syWifr6loQDrz4YjqZEjoKzVFxBMgQ9RYE1dIyswCIYgUBC2QCQCJABmBhGGvwQxAKBIqNHp8egghBARi2LXr8iWD8kEl3Y8uJ9oFHPYy5Kb7+0h4imkRNNMlhrzis+fBZ9eWqIof0rgAUiEWuULBho1+uoJSAMPmx8iTMAJh2sqIuCQABSIxTH3LEeAAgCyJCqGV2FACS4wKSamdY2nZhcIAHDs7o6gqC4A/mQ0QMgqCju8ts3lIeG3VsS2AE1TGyZozUavKByNyCo9wY5UkQCCLKybUwQrX0GP2nKPkLqHUo4kYTOBbncvDr5zwITNtJtvZ4dG1oJ7FUVscvypx0eBNzrKykyJ0R8eITu4wxgMghqK0eLnHsNA0OhLv3ho5DUVuPAGiyBcccWTZ6+6gkic6jxGkHMIoJNV+WkwV6RDlFv2ESSDELAGAurFs3t6cnCMO3ZGitj5o7V+3aCUKwMcgs2FjIFoJEIIzOChLH5kZEQRRlS8lAwFE1K6KLJEJmwTwVrynK/EhEUzEEkZDYYCKJG9ap3bs41YBtJzrDLwRaESAYNu87qzOqNqOOJTLDopn1h8/KVDxNLvKBAAyIuTYo3twbaqZavxQmQYUAnmzKQay+mAJ5kxFDGAPAgIhEApBqlJ6soUMRcRPMkcsgEBlOuolCb+/8xkay7T+oqNBKZbLZ42bNqgwNuY4t2MRlJ7NhRgAJYAPYwJG5ovcCAIFxxhZRiouC71T1Ms3WHH1UjIZFrc4RNY+RwKHGF38TqKpuPEawgvxmJZOiXFHLF9UtnVPPDERxlx/ecUy7JQUDCwazM6C5tpPBoYNh/6BybMQa8xIBzghmEGCEQJFBACMigRGRnib6MGJWfqoshFp8jA8HYpy4ECNnt5EFsJCiMDo6x7LauzoD3/89To2Ivu/PmjOnUSuvXBIkoipUIAsAKzo0HH/WFoJd84PJVCnikMWSGeKwZpAEkYhiCEzLjZGNiSL3ipA1AmPSgV071Z7d4NaL+mVy4nUPGbQGx4KLTmqPs5QxnE7Yxy5orHqapDDjmgtGzrFBmW27fG0ifcVkRK7hh/j0IGKUAAmmExoMgqd4zojciKNNlE/iu+NJ2GdFEZA5+thMGGQC/+gjj6p6HhH9181iCoJg/rx5VrkMJsq9kR0hStqEQMgEhg0jG0KUCBJARGGWYweKgp5gAAQBIMAAIpHAWm6s2TqO6TRZCcc5E5TC19eGHHL2cNsfNd6QFg5VPbNqWTaTsLVhAoAjZmfb6i0/NCRJ7w2wgWSjzI+ag4PGtqmmsoDpOXC63Wt1KtMUtVQrwAkJYzglouNWu6upnkscQwHZRCVc/PkZc9RRR/7BQpyNmdnTY0sZockIJEwS2RTlwzgNMEQ5LULZDDU5VO3YMYsIfwITmNpvYaphPgKUtSuv3T4iIht0Hdq9U48MmVQHOS2i2BsKGz2f25ucoxdk42R47IKGiJllxTykodMSEvoHVLUKggCR8U3lSeyQiAAUU7sgcCo0R3QBEiLEpAfVUt9U3qtFD4mAYJi5Bl0BEVFzpru7u2eWmIaQ/qtXJpNpOeooiDiNmLqKK9X41HFcOlF8+g0hW9ERZIzoRjFpawCIEAtoIgKcCuu1Pg4wQBzxa95jE5SLvHOnljamFsjiLsWKGUAgrFzaCABkCTG/M+2HmiRC0bBnqF2aQPcPhJE2+w3lY40WoGmeiwASp9gZqjUrovq7VvIx1JIPMQpGimIoMhoWDBKm6gg0bCUTs045NfA9+IOMB9HQ/v1dbzu98Ygjw2o1qp0IUEJU+sfBCjnCvyzAEDMYBgQbOcZLDMg8aWtZw0VR9xNq3zMFQmJWEiaBAAMQwe5dKqxAao5UJfbHmSzwA71sdp0lBXU2J2c0uEGoUSKPKHZRZmUxZ8bGjWUhAk8KcyJsjxi9ZeQsFLOjkxRHLckgoox+NoZ3IGtWjuoUibFNBRgEruEWJBQYhqmmproFC7Zu2Kh/rzszs+u6Lz73nJZy8cUXG88nokmFJHJUSUdhjSOuM/q8Ra1jKCk6r5GmicU01AyANV4B4/kkjgtxgdFtxhxOdCu2hUNDJj/OyRYhkuAd1GRhEHJnk9PdkqS5HemkQ9oAEvCYonohXRif0FUPoiSE09w5cpbJqqQWNKZpCngqAdZSJRBAlNCIEZAJWSJEcyMEMRiPfwpYAkshuFwZ79uz+pVXbMv6PaHDGJNMJjdt2vTYk08mENCYuE6Jiw+cRlwATRFy0VUxACCzpCi7xKGPahA7ghwSYkISYSqA1CxAEfsUVwaCKmU+dEhZSbSbpDegiFBpTrpiQXdazmpL1lrTYIqGOoUkzk0Y5t+R9HBaGCEEqMFhqH3U0XcTTkJm+C02FaKDGWliaqweUi1qIzOSYL/6/Fe+Mjgw4Ng2MP++2GGMnUo9fPt3nWolkU6jMRTLHJExCnVRnYICmAENsK5R5wigGQBYxAAkvpOox0Sx9gORAYmATSRf5drtm9o3a2ACYAKtYfiQXoRgt1Fld8iRZp5gbkdKtje4xgAjQGjAM1Rvg+J8QUdQZlrBzYgYn3uAiBeYNCJGjSuOMjXJmnuQ1lTjYogZASetTIDxca5RB4hQqyhZJpLl114jJF/K3z8xRczacdzduwIhZSKBxsT1bTQlFxE0NcI5+iABwAAigAEWSJoZgCWhMkCMBmtNXmbBoKL2VoxfmBj0JOnBrAGjEbxIJExIY2OsFVuNqDaCDgEIjOGuFle2ZF3DTITgA2imFGkF5YrB2nmZ5JGRpvUAERHQkoRGB56vqh5qhYRCSEkYMrMxFrPtum4qRYisNSJabKKYMclMRfgkCoVQCzvIgMZkbPccNr/WJvydnc1aWFAA85hPclwANBN5EkKkkoZNpCMQAMxoEJhIeZ4BICklgAI2gARowAgEA2iMkYShQWAGjB1IMxNAFFZ17CIGoxAYOz4AEkYtRgZBUCyY0Gc7I0H5pspokTbclnWkaxEwsAAOGRjRRaU4COICD6cX3PHJipyVAUx5Ime7iY6FC2cuXtzcPTPZUC8dx4TKaB0UiuXhQwMbNxzassUCtBJJNDrSEWBNZB5H/JpcH2M0HUtwQjZzAK4RQvM0rQhCTRUQU2wMaAEgc6hU9wXnBbnc2OqXpe1ojIMsI4IxYaWSntmlwzAYHzeIIi5pJwmNKF6DBUYBmkghhgjMxGzipI86ojlj7UfcuzEMItZHIBJ4VQh9EElgQO0zOciaE46QKcfShkEghAYJUKJWRuvotqfcOc6sUdFFCMBaqVM/+MGTLrvcSLFzy9a927ZP7NldHB1Vvu/YdqqurrVn5smf/QesVJ/+v1/Pb9uWTCTZaIw1CEwxAcaTxQsiihp2RARijExsRYErfveIT39D1GYkValmFi1a8aUvbf3Niy8/9dQi1wXDUanIDNqYoz/3j3PPPXf3K2se/ejH2jNpYwxBFOnA1DBPLfhGHyEa4ChYCzCmVgvX3LgWK2LwErVNWCLqkMOQhY2IzAFHFyAESUtGwvh4KgQFmBDY/I78M+l3gqhSzL/3y//n6He+80df/epzDz3kHRpJghG+39Tc4hAEQVBk3h8E2++594bHH7/kO7fddvHFOpeXlkTDiDxVTEYWr3UxosgYqcenpd/o++NshWBw0p+jcl+gCv2u897FxowODk0YLSDqHQMK6U2ML7r++sMuuQQA9vTt7fe8rmw9G0PxEFA0bTdt4mgqb8elFDEyRJEaDUDUQtRxmAYT/xJgBAJgZsMooxJEMSAYhqRLcvrwBzPU+vBTVUJN0oW1Iw/G6EQyqYLghvPP71u3fn5ba7a9lUJ1+t98fMEpJ99+3YdobDSdcHUQ2K4TVCr1bW00e87E6pfanTrmmFJAjNNjDJWii1YhWTKi6mvhJfoAeJpeknC6JAWR/TDZ1t5++ulIFIaBDSAjSQZRWCplD1+26Kr3hUFg2fbOV1+ttySGYe0TZRNdCDBFsTnioxEmtV1RuCNgY2C6uCl2ewQCMLG9eLLlFXtTlHAiRsUPdYTPYqdiEDSFoDFGC/GdTzq3hXTfTTf5+/cf1TOz0XWr+VzXiuUrr3rf1i2b1+/aSa4TeF61XDn5U5+qb2vLj431bd8uHJcMixqYpanmEBIgagPMbksrhVpwVMJFEJtJIJEQjBRXd1OgM2qM6Uq1edWqZFsbRJRAdESQBQIAL/3EJ6TjCCEqpdLgtm0NQrjNLcBxa4IgltNE9SrUiHKqWbPGGcRssECMSFicZLen6kOc7H4AAwKSjIbJsBpo8gKNBAgobEJm0EZKtCRiDRRjrX88yc9FEDKVSrUlUxAqYwwzHnvRxcz86I9/0pRMUKVskM79139d8o6zAeDHX/u6PzjU6DiT4iPCqeo8Kny0Uss+/em3//xeOvLISrUsSSAAgSEkrPomlxeTt8RAZtofzUKI9nPPngL4wMKAEDLM57vOPbd1xYrRgwdJiIN9e4p9e45+3/vefs/dMy44P18oSimxRokwAqCpVTFRrxknD00McSAu2acMGh/OyQFIcByUNmjfAINwkJmJQGmmsqcJiRjRQQY0PlgOJhyYAq9RSQ1YU+5ERwQjvSsRKd9v7O46bNWqvm3b+tavr/e8upmzLrvjjmXvfGfgebd/4Z9X33fv4uYG2+jYJQmFECREjMERkFlYsnX5cVY63etVx1lLZESWQFD10osXd7z7UqO1YLCiP1j7I4g8L7NoUXrp0kP79kdsXlz7hEqk0ks/+YkNTz012n8AAPrWb5CV6szjjrPTmT2eP2iMlAKwhuIhLr4nwxJFcpvJOjASexCSECgmlcmx1jAWFRtwE2g5YDwGYHIRGYTAYkXRaCGIySObWIAusWVhJk3G1E4oTnGJUcqYnvSJKPS92cceaznO0/ffb2t9zg03XPfQQ13Llj19330fP/2MF+/43jGtrXWAUVWERLpa9SbGg1yODCMSMhCRUGbNx6//znv/anz9+uZUio2J6E0dhEs/9zm96sTN+ZwUQiIIik4VEqIkYq/aef55h/r7e595eoqkFxTmC7OufC9n65//4Z2dCxYCQN/69c3p1Labv/bjqz+48cFfNFnSGxmNAiMCC0IiERNPghBBVyuqUo3JBiISgowOyuXqxEQln5+KyABENcKHIZNByyZVYLQQXQRmIXAkH8rBiSoisGFyUSSQ84YkZ7NYK8F58gThZL3HjDSJ/ZgB5p+4Shvz2lNPdbe1hoyvPfvM3MOPWHzC8ReXr+1/9FelzZswUwcAJERYKrUcceTMU08O84Wd999vhaG0bdYaLdsfGW3aX+5Ip11gBBRSctWrX7w4NXfOU//w2UTCtZA0ARhdU/oxByHW1bW/89wHv/Uty5IA4CSSkgT6gd3Wdth11z3yrW+jMZmGBt/zhrZvb0kkdLVqbdx0HGHXypPaTzll3Q/uUGNj0nHCcjnUWiYTgoRXLhspG+bPB+kMb98mCAGxWiza9fWdRy5qm7/Qq1S3Pv0Ua65NNkSjp4CMDc0kLAjHjEyjdDDwDREPjXvUN1iOQDgIxHrBEwoAm5qEEJOKv2lMRQRjanM5xGy0ctKZeSuO27Zu3diBA2nPf/GWr//8Ix/51nveveFXvzrzqquu+ulPF1/3oUqlYksrKBZ7zjn77Du+f+Q11x53ww3Hfu2r40rpSjUoFOd98P3vePSRprPOqhaLlrBAm3Ai5/UfbD/7Hf19e0Y2bJipWVcqXCoJBmImNkKQqZSaTzmF6+s3P/iLNAMAOG6CpQxKpdnXXl0x+plbb1t2/HIAGD7Qn9uxfcHZ55z2iwdmX321yTae/K1vZU85Zd3omBLCz+WyixZ1rjqJkIJioeXoo8/7zu1X/vz+K3/20wtvu7WkNdn2yddf/9FHHrnq+3e2nXzKEMNwGDLhZLM8Ou1CcksbGQPeIWU1UdRZMAZ29Jdk31Cp7JmkJDCMLcL0+sqHxiaRSEAYgJjMB1PIfEpDTQDKD5t6ZmWaW3/zndsd5qRtYVNzM6KemFjzrzf3/fqpK2699fS/vb5Yquz94R1dixaf+I+fs2z76bt/9tjtty8+/IhyV/fshiwXi/Mvv4wd9+nXX+9x7FbPY8ed9YEPGILOd73zl7fd1pSpO+5f/kW2NB988KHiY48nEgk2Bhk04Mwr/2rzM89U+/Y2aw0AiboMB4E1d97sv/qrB2+5ReYm5i1ZCgAHt/VSEB7xgQ+4DQ1PP/3UwjPPJKJf/+AOLzchMnULr73umI9+FIT86kmr5h9/wvn/8S3Ldbe+/tpjd965+Jhjgu7ui/7uhsUnn7p948b/eN9Vg1u31ltWU7aepo2cCWSjIZHG5hkYVjgYMQ0nuGzYEliqmm37inRwrDo04VkWsjFWqzBVDsd1fYNoaREqNBQr/jAmImBK32UYUAhjVNuCeYbN2qefzQKwUsYYpQ1Ku6Ozo7L29Vduvx2YV7zvykEh5l16aSKT6X1lzU++8IWG/v6ebPaD37295YrLrdNOczJ16598stzX1y4tyGRW/OiHhZmdu9mYTGbn6pevuv++bTu2r129uu1jf92rAwIQJLBSTR9xROqII1664/uzE8lkvgAAifq6MPB7rr06n8+9/OMfLe3uznZ1A0Df6693L1ncsmhR/86dg1t7V156qdKq96WXmplXff4LK66/XlrWwM4dE6nkmV/5V8t1n3/ooZvec9n+p5/Zdv8DM9s7Fp98am505Esf+GB1z56jOzvnt7SkiSKSerLaCEPdNgPrGqg6rLXHiS4yih2H+ke8/pEqKa23HSjYtjDKiDrCJAYHQ+HQzJmSp+HEGpXOMS2ASELoMMwdOtQye9bw0CEJfMQJx9uuCyYa+WMdhk46ldu5AxDT6bQ1e3bHSScDwKN33tlYqZx8/oVv+8IXQqNv+8hfNy9eDADrnnyy1bLscmXRZ/9hPAx/fPU1WcDda9Ycd8lFbMxjt/zbUeees+WRR0ZLJUSUiNrzuq+9ZtfatYOvvLog26AmcgBgSyuzdFn3RRc/efvt7vjEvBntdvsMAOjftGnxmWcB8yu/fHhGd/eM+fP7tmwZWrvuwpu/ai9Z/PSP7gTmNY89tuqii+ubm/u2bv3B5z8/k8TH/+M/PvHww74xL/38vmxzy5Kjj27Q2mKtjYl5ZOBpdQ3Mnod2Asq7lVWHThOCMgmbNuwuKK0JAF7bORHzrBKsLkvtC5XiWT1WOkXaxAgjRiCRzlVKHYaV3ESmtfX8G288+oILJNHFH/1Y66pVI9JSETUKjIQmVKm2GcycGx5Ot7a19MwcHRzYt27dTMdtW34cABzY2tvS2bn0pJPKhcL+9es7pOW0t7eeftpz3/teayJxzDve0b9168KVJ5Jtv/+unx5cv+GFW245fNnhFhKUKollyxredtqz//7NTimbSepCgQHsROKMT32qMDq69v77F6bTycYmO5OplkuVXH7R6acD4pZnnj38tNMAYM0vHlp5xRUL3/nOb773ypaeWQwwsGf3ygvOZ4YHvvXv1sjw8aeeMvfUU4cP9r/6+usPf/5zz3//+393+3dO/siHC6UyGkUkpldOWkOmDufMlzrg0naVmi+FhQSgDby4eSJu/m3qyw+OVx0LQYE711YTxh/R9c2yZ5YVhhw3+uIVIUxCVAuFRDZ70U3//KlHfzX7jLPAdu7/9q3/8bcf/89bbgkmJqRlRaw7MwPRwvPehYibfvNiIplExN2bN5nx8ZaG7La7fuLlcvmxsbb588lxdq1dGwwPNwKk583XiLtffPG4K65wFi7s37ixqbtr34aND33mM099+MOrVp288NTTBkoFFfo9n/7k9tWr+194YWldVgCbQjGsVBo6OpaecspTd9yRzBe6pBRNTQQwum+/m0l3LF48OjSU279/2RlnKBWGKnzPP974H1ddZQEvXbVq//btmfps84z2PVs2977w4pzmpuOuuQYANr74G53Ptzc0PPfVmx+86QvvuuHvLvza1ysGUOlanxaQIPR5znxqnAGVAQ5GTXaJpX12E3RgzF+/IwcAJAgrfvhS77jrWCpk0YwyK4LtAVm4aJEVKftrAwlMQlSKhXmrTvybu+9e+Z7LbvuXL/7dO88dO3Bg//btM+vqFjU1tdlSADCAtGR1dGzJZZfPOWFlUK0+/oMftjQ3A8Bo/4CjjWs7lb37hNEHd+zoXrIEAHa89lpGqyQSCmEJccmXvth90kljAwMHN2wIiyWRSjSE4eWf/vujLr/8tV894lerDe84K7ni+Me//MX5ieQMRiDEckmVikLKiaGhdQ8+uLC+3gqVzNYBwOiBA01dXUKIHatXJ5OJrmXLiuMT537oQ8/98Ifbnn5q5YrlKMTWl1a3dHcD84YXXjADA8ddcmnX8uUAsHnNmqyQ0nDSdTf96McPfemLR7/97Rd85SuFMIi4U8EABqQNi48WaMHEutCdgW476gBSCfncuomyFwrCWIvzxOtDXmgiciCx1PJ2hF5et88UPbOkH3CsPBOyWiotettpV3/r23XNzZ//4AceuvXW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" alt="Boi de Minas" style={{width:160,height:'auto',marginBottom:8,borderRadius:16,objectFit:'contain'}} />
          <h1 style={{fontFamily:"'Nunito'",fontSize:26,fontWeight:900,color:C.text}}>Boi de Minas</h1>
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
          <img src="data:image/png;base64,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pOW0t7eeftpz3/teayJxzDve0b9168KVJ5Jtv/+unx5cv+GFW245fNnhFhKUKollyxredtqz//7NTimbSepCgQHsROKMT32qMDq69v77F6bTycYmO5OplkuVXH7R6acD4pZnnj38tNMAYM0vHlp5xRUL3/nOb773ypaeWQwwsGf3ygvOZ4YHvvXv1sjw8aeeMvfUU4cP9r/6+usPf/5zz3//+393+3dO/siHC6UyGkUkpldOWkOmDufMlzrg0naVmi+FhQSgDby4eSJu/m3qyw+OVx0LQYE711YTxh/R9c2yZ5YVhhw3+uIVIUxCVAuFRDZ70U3//KlHfzX7jLPAdu7/9q3/8bcf/89bbgkmJqRlRaw7MwPRwvPehYibfvNiIplExN2bN5nx8ZaG7La7fuLlcvmxsbb588lxdq1dGwwPNwKk583XiLtffPG4K65wFi7s37ixqbtr34aND33mM099+MOrVp288NTTBkoFFfo9n/7k9tWr+194YWldVgCbQjGsVBo6OpaecspTd9yRzBe6pBRNTQQwum+/m0l3LF48OjSU279/2RlnKBWGKnzPP974H1ddZQEvXbVq//btmfps84z2PVs2977w4pzmpuOuuQYANr74G53Ptzc0PPfVmx+86QvvuuHvLvza1ysGUOlanxaQIPR5znxqnAGVAQ5GTXaJpX12E3RgzF+/IwcAJAgrfvhS77jrWCpk0YwyK4LtAVm4aJEVKftrAwlMQlSKhXmrTvybu+9e+Z7LbvuXL/7dO88dO3Bg//btM+vqFjU1tdlSADCAtGR1dGzJZZfPOWFlUK0+/oMftjQ3A8Bo/4CjjWs7lb37hNEHd+zoXrIEAHa89lpGqyQSCmEJccmXvth90kljAwMHN2wIiyWRSjSE4eWf/vujLr/8tV894lerDe84K7ni+Me//MX5ieQMRiDEckmVikLKiaGhdQ8+uLC+3gqVzNYBwOiBA01dXUKIHatXJ5OJrmXLiuMT537oQ8/98Ifbnn5q5YrlKMTWl1a3dHcD84YXXjADA8ddcmnX8uUAsHnNmqyQ0nDSdTf96McPfemLR7/97Rd85SuFMIi4U8EABqQNi48WaMHEutCdgW476gBSCfncuomyFwrCWIvzxOtDXmgiciCx1PJ2hF5et88UPbOkH3CsPBOyWiotettpV3/r23XNzZ//4AceuvXW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" alt="Boi de Minas" style={{height:42,width:'auto',borderRadius:8,objectFit:'contain'}} />
          <div>
            <span style={{fontWeight:900,fontSize:15,color:C.white}}>Boi de Minas</span>
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
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            <button onClick={()=>openMov('entrada')} style={{...S.btnRed,padding:'10px 20px',fontSize:13}}>+ Entrada</button>
            <button onClick={()=>openMov('saida')} style={{...S.btnRed,background:'#e53935',padding:'10px 20px',fontSize:13}}>− Saída</button>
            {canManage&&<button onClick={()=>{setEditProd(null);setProdForm({name:'',category:CATS[0],unit:'kg',quantity:'',min_stock:'',max_stock:'',cost:'',barcode:'',supplier:'',expiry:'',setor:SETORES[0]});setModal('produto')}} style={{...S.btnGray,padding:'10px 20px',fontSize:13}}>+ Produto</button>}
            <button onClick={()=>setModal('separacao')} style={{...S.btnRed,background:'#8B4513',padding:'10px 20px',fontSize:13}}>🥩 Separar Carnes</button>
          </div>
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
