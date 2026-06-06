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
                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABLCAYAAACGGCK3AAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAA570lEQVR42t29eZxdVZnv/X3W2nufscZUKnMgAxAChBnCGGZp27YFTQDBAVR8vaI4ez9ta0jr7dvtrCBeba+gNgoJCE4IKiQRSJiHQEIghMxzaq4z7r3W8/6xz6mqBLT1tt39vrfy2Z9Tqapz9t7rt57fMz9b+C/6WrwYc8M5CwzndKvIMnfw73f8fEGXS2ozbeBmCzJbYYagUxHtBulQ0RYjmlUvkYDxgHPWo1r3nqpPzLDzpk9V97i67Ii92eQS/wrObhiq66azr39438Hn1KUL7Yq1e2UFK/2SJfj/inWR/8yTqSKw0MAyFRm94Xu/cXFm3pyeIwPlZEn8KWI5RiwzEMYXikbCUFAE75UkgaSuJLHiYoVYUAWvoGrBKBIKBosEgljAWZJEqFU9pZLXpKb7fSybvMqaJOGJamyeKIf5dW+8/r7ayLUuxnDUQmHhMi+C/l8FiCoGFspYSdj6u/lTcmH9HOPkYuCMIJQZra0WRInrSnlAKfUo5b3qK3vRWq9SG1BxZcHVEU00BVgBHbNiAggqVjAharJC0IIGrQbbbiRqNyZsMYQ5i7UWV1d6+z31qt+UOFbFsb1/qMbyty5Zub35kUuXLrQsg0XLXivJ/78CRHWhhdEd9vLvjxs/Ic8bxfmFeDmrpSVoJRLqZRjY5RncrMngBhjegakPqKhHbAbCFiFqJz1ahKAIQRZsBowRxAgq4GLBxxDXIRkW4hLUhzz1fqgPKMmQ4uspYLYgGow3PppokK4wCFssgU3fMzjkhlD9fc3Jnb0Dyb3v/MrqvU0JX7ZsoVm06D8OGPmPAsLIMtfctT1PH3V6NpB3i/KWXIsZTyjU+qH3VXG9z6F9azHVXozJQL5bKEwXWqYK+W4h0yYEGbAm/TTvBZcoLgHvQJMGXSF4BSGlKVELVlAU5wxJ3VAteaqDSnW/p7pHqe12xPs9GoMUxNvJ1ptJgdhOa6PQ4qvKwJDb7zw/qzpuufx/PvzIWKn5jwDmLwrI0qUL7cIRzlXpe/7oSzLGXxdazg06LNSVgU3idq8S9jxpTH1AJDtBaJ8jtB8GhYmWbBa8h7gKpUHo71P6etNjYBCGhqFUhlpVqcfgElBVVAURCAIIQyGKhHwOCnmhWDS0tBiKRSHfImSzQhAaHFAdUkr7ler2hHirw/d7NCNqp1rP1ABtCWxGhErJESes8MhNb/vHh+4GvCqybNFC85ekMvmLKetlC400dkzPk8ctzOdrn8jm9RQK4EuqPc9Zt/nXgR14RSQ7AbpPFrqONuTHG8Qrw33C3l2wfYuydZuya5fS26sMDUG9Ds4BCiJgBEQ0fTWgXjBGUU3/RtNrGjlEwNgUqHxeaGsTusZZursNXeMs+XZLkBHiRKn2KNWtCW5zgg44tMOozgydH29tLjRCLMSJf1ID+8W/Xbxy2Ws34n8xILp0oW0CsfXBkxZ0tLolxVa3gJYY6onb9VjAxrtDW+sRuk/xTDobOmYI4g19uy0bXxLWveDYuBH27FHKJUW9YG262wObAmCkoa8llQYA9eASIVvwVIYNYaRI445EUjDGbBq8gndK4lOAxUA2K7S1GyZPDpk00dA5zhIWDHWnVPd4/MYYtieQFfzswOlkSz4T2ECFuvMPVeCGt372oQcPXov/dEDGSsXKH501afaE+hdyRXdN2ziHRjW3/zlkw0+sqQ8KU9/gOPR8JeqGeL/lpTWGpx43PPdMwu6dDmOzGOOIwhQIQ1Ma0u3epCN1gkuEKJP+PIhgwrSYE88rseqXLQzst7g4RS6uCTZUjG1IjowCk36vIyAlDkpDZXItOVpbLZMmW6ZODejoCjAZoTbg0E0x8moCIejcyNtpgRZCY0XBCz8YGkr+7i1LVu3890rL/xEgSxcutE3efG7pGW9vz+uXx3XqpHqupklf4jf9GDuwSZjxNzEz3uSxnVDeYnj8YcPvV1g2bjCUh+pMPnQyxZYMm9e+QEtHJwKocw1JEJK6YATCKAUj3+Lp6E7YvSkcufQrPrWf+Zf18auvdXPfrW3YMAVz4ow6fbsDKiWDsUpSNyhKEDWoDMVYS5IkDPf3cfF738srzz3LxmdfwEQ5jIVxXZZDDgmYNDkg22Kolz3+lZhgYwztFnti5MLxVsZF1sTO7a57/dTZ1z/8o3+P0rd/7huWL14QvOnme92PFp/S+rn3zfhOZ9H+g2R8SxwkyZ7fePvy9zBtRygnfjqm++yE8j7Db+8MuOXbAQ/81tLXI+SyQiB1Jkybwoe/9W1KvX1sX7uOeqVKJpsjsAHqhKkzEvIFpTpkcXXh0Ll1LrhyiDUrigSBoVayRBmolULW/r6F/dsjMlnBGuFtH+tj35YMfbtDrBHGT0loHaeU+gOCwGCMUOrvJxNGXP73n+Xia/8fHvzhD6kND5LNBggwPOTZviNh584EV1NaWy2Z6SE6PYB+jz5dN6KITpIkE0pre8Fe8r6/mTr71OM7l1913YOV5YsXBD9YucX/h0nI8sULgnOXrEzu/Z9nHz9uHP/a1SFz41zsGPZm5+010UQ58lrPpFMT4j7Pit8Yfn1PyPathkxGyWWbSldQ58jlclz//Vu45777OH7KFNbefx9rV6/G1WvE9SxXfGqYwZ4MD/y4nUKLB/UY44lrDa4RxVrPcJ+hpdMR16ShP4QgUrwzIEJlKOCiqwfItjh++rU2gqiMmIATLjifM9/9Lh585lkunD+f777//dSqVdSk0pTKkZI4qCfQ0mo4bHbIzFkhYYsh2evQx2tYCy0XZTU3Ht+Vsbbm/Pq+KlfNf9/DT+nyBYGcuzL5iwMyAsY/nfm2tqK5NZ+jIG0uSTYkwZ6f1ek6w3D426Gttc6aJz3LfmJ5eZ0hk4VspgGEpic0gLWG4d4+Pvqd73DT7UvZtm0bH/7QdUzKZtmx5jm2PPc8fbu3UxkaJqkl2MASRhnCKEMmFxFEEUEYYmxAFBm8txjTMIG9J44d3iUkcZ24Vse7OmKEQvt4Dj12HkecfTYDQcgXvvAFusaP57+/9xq+8q53U2hvx3vfgAM8fkQZxE6Jk5TK5h2TYeqMELFK/HSN+MWYjgsytB1jkhZjAoyWhyp6zTHvWnXH8uULgnP/RFDkzwHjV//jjOvbi8HX1XiCFnXV1XVbXhMz5aqQaadDtTfhF/ckrPidgAr5wshdITIKhgDWGMpDQ5xy/gXMufxy3vX2K2lrb2fuvHksOOcc5h5xOB35IpFJ9YixFi+CQ3FecarpwqkeoD3FGKwxWGuwxmKNIbAWvCeOE0r1Gq9u3caDDzzAY488wp6dO7n1jtsZevhh7r/1BxQ7O0lcunajoCi+abIJ1JJUdmbPjjjxxAxtEwz1LQlDv6nQNi+g+6LQhQ6bzwn9Zf34nCtWfbUBSsN4/3cA0gTjl58/83Pji8GSkk+czWGqv6uJH0yYenWO8YfCxrV1lt4es2MrtLSkVhFeMQ071AAGTT1pEQwQGEtpoJ8rP7eYR3bt4pZv/y9aWlqoVCoEYUhrexstLa2EUYRzjmqlQr1eJ4ljkiTBO49qA5TGgok0Pt8YjLUEQUAYhgRBQOIShgaHqJRK5HJ5hocG+au3vIVPv/9avn7FFamzIg0Qmv7MCHmNAUYUj1CpKe0dhgVnZJk5N6Q+7Oj9aYXsOGHqokhD1LcXArunL/n8EW9/9HN/Cn3JnwLGz//hzMUTWsMbhmpxIhls7b6KmECYeGWGtjZY/VCdX/6iDl7I5dKQxojfkIaOGpIhGBEMMuZ3gq/XefPHPsYjO3dw5x1LCUXI5nI459KF96mIGWNGFrx5/GGzXEdem9+bhrTEcczAwADnXnwxn/nI9dz5yU+y85VXiPI5nPP4pmMpDd9lBBbBk0pn00utJemNnD4/wymnh6hR9t5VxThlxtWRWsV1FINgV5/7hyMuX7343wJF/i0wfnHDGdePbw+/PlSNEwmMrd5fFpuHcZfmyYXKb39b5ZGHY4r51IdQ35AEkQZFpWAggsVgGjfWBMiKoOpJKmVOe/PfUp4yhV+vWs2Gl1/G1WpEYUiUyaSgjFnoP/XLGIOqEtdq1OMYNYaphx7KpW95C6dNn8Z9X/kqe7dvI9vSgneuQVXaAKLhUNL4fuRfSp3akJZEhUpVOf64kAsvzpBthe23V9GSMvu9GRXnXVshDHb2uk8c+fbVX/ljoMgfikktWrTM/XTxGZd2twZ31eoucSE2fqAqGKXtb/OEqvzqvgprX0hobZERwjXSoCXAjqEoiyCN/xtSSjONsIY1qeRUBgbpnjyZqSecSG8ux4u7d7Nx2zZ279hBNpP5oxLxujcnQq1Ww4QRE6dMZsb0acybNZsZrUV6n32W5373ABIERLkcLnGoCH7MKRTFNYHhtdLiRnSLokYYKitHHhFw6dsy5Npg8w9riFdmXZ1Rqt7lsmGwZ8AtOurK1cuaG/7fBEQXLzayZIlf9vdnHDW+xTymSi6JlPiRmnH9nsLf5glQfn1/hZc3xLQWDeobCnsMTf0xMGzjzFYYkRQAayyuVsNVq7S1t9E6aSL5adMozD+Nr3/zJpIkHtnxf4pklIaHOfOcc3jTqafSu+Y5wkqJ3s2b2btlK7FzZFtb04X2vuEsNkxyOAAY3wBGU6+8oV98GmEeoTBQA8Ml5bAjLFdcniHbAi9/p0Z+vDDtbaFSFrXWVPeV3Pxjr3r0edXFRmTJAX6KOTgcsuyodfKVj87PtRTkdmOlUA+9Ji/GJtmZkL0wjzi47zcVNrySHASGjpq0zcUXIaBJXQYrKRhGIBAaQDXAUBCXEIYB+bZW6i5h18sv0fvsM5x+yilEmQzq/Z8nHdUqh8+dy1SfsPa2f+Xlhx6mZ+cuMsUixbY2jCpWPVbAmkbMDMWg6fVoc5GEoBFPM5p60wYzer/SWEavtBSEl19y3LWshtbhsKszDG707H/ECTnUCvlCYO548jtvyi9btk7SLOofAKSZfJnVYb7YlguOHvZJ4nvVxs/Uic7NkcnCQw9XeGlDQjHPQWDIAZaUGZEMRqTCKBjTlIyG9aUQaGMhBKwoRh2hCLlcHmMDSsPDGGv+/OCQCKpKpVol39pKsaWFbBhivEe8H9VjjesLDgKmec00/i4QSX9P82+kcd+KlfR/6qGlKDy/1vGLn9fJ5mHWOyN2/i6msl1txbuks2CPzGZ7vrxo0TLHsoXmdQFZujDVG3cvOfustnxw3WA1ToyYIHmoip0XkZtsWbOmxpp1McVcmjZlhKZGFfjBYKT/b/oeNCSmoWO0+Z4mGE3zWEZ8lXhoCFOvky8WR5Tun/PV3tZGZd8+LCDqG1LLyGEZPad5HWAsSjBGWiyjoFgOBqUh7w5ai8LqRxNWPpAwbpZh4gUhm5fVQCToH06StqL9wDO3nHGOLFrmdOlCezAgsnDuXF28eEEQWL1JvKChEfdcDBkhc2yGHZsdq5+qkQ1HOd+MUUQHg8FYyWiA0fy56CgYpnHzTakxDUmzCqExJKUS1d276ezqIkmSP12xqxJEEeOKBfa++CJRNovxjV0vzetk9NBRfda8btvMuRwkLQbBSiPPcgAojIAiXsnnhPt+E/Py845p54bYorD7wRjbIoJTQuNvWrp4bsTauSMxaNMwca0sWeLnWf/u9ryZV0rixPd76zbUsadkSCqOVY9XSJI0P9F8o4zRG2bE4ZORnWQaeQkro2CkHHygVNiRHZouTEDj5yKIKj0vPM+kSZP+LECSOKaju5to7156XnqJbC6HSastRg9JzW4r0pCGlD5lLDCS0mzTUDEH6ZWx1z/6nvQTApPmXX7+i5jqkDL9byN6n3ZU96itepd0FsOjZk1rv0aWLPHLFy+wzWiv3Lpiix41OD+XyZs7UNp8JOIfrwmdhtxREWuerrF+Y0I+I4jKa/SGRRExIyCM3UGvBaMhUUZGpELGgGFldKGaS29rNWT2bJ56bg3ZTObftLKMMVRrNWbNnMnhe3cztGM7YSYa8YkMY51WRsL9MiaqIIzqDmlsLMY4s9qkahkbC5GR99BIkIUh7N0PkYWjT7eU9iqDLzrajgtJykrsOPaSs+Z89/y/e7B+wxLELF+8wIqgti24vC0XHFrz6rVHjd/nyBybZbDH8/z6mEw4yqNykN6Ag03bBi29HhiiDfrSA6TCkvojTUtMAKNKJpNlYMtmxpVKFNrbcUnyJ9GVWstxUyZT3bgRG2YQ5zE6KhGhHKxDGKGcsXQ21ihJN5mMWGGMOLdNJT/GWGkwBl7JZ5WHVyfs2uyZfH5AeYenvF1NHe87isG01mLl7SLoiuULrFnBSq8ggeh1LvZqItCX6sjkgKjDsm5dnXJJCe1rd89YvTEWjIN1xqhk6AEXLmOkwoocsHObCxJZIa7XKezaySHTplGr1f5N2krimM7ubuaN66TS30cU2gbdeMQrxivSACc4CBgZQ2eGpgU4lsK0oTsaoOhBOmVE6rVx/0JoheEhZdVDCYUuQ8sRlt7HYmxWqMeqVvS6xYsXmxUrVnqzZAn+zsWnn5gL7QkV55WyWt3jyMzNMNjr2PBqTCZqhG44OGo71vEbVcjmIMkYsaTMa8EwDYqSMbt0xAoSQTyIWNizh1PmHkns3EjA8o/R1cwZM2ip1UlihxUzwu2poh4FJ5Xk1wIzIi1GDgLrYIV+kKLXsZZnGlxVD/kMrHnesWeb0nVKQHmbo96vtpJ4zWfsvHM6f3fKkiV4AxCKXZgNLRridbuDvBB1W17dGFMq+xHpGMu56SKPsZwOUuJNa2rkRg4Gg1F9YQ4CwzaNA58uXBgY6kODnHTMMWTy+ZG41h9yCJM4YcaMGWTUN5w/aeg3wXAgOFb1QGD+gLS8Pih6gKK3TRNfR3WjbWzaMBCGBpU1zyS0TrUErYbhlx0S4TOhEBgWAZiFCxda9f7iWuwBMbojQaYGJImyaUtMYMaAIWMsrBGqOjBsYuVAs1jQNFZ1EBhjaaFp0zfBEE2BsKIpaF4xUZaZRx1NMZ/Hef9Hact7R8e4cYw77HAkrhMYCEgXzzIaIRiJPotiGhUPpiEtFn2NbgleA9QYtmiCImOrZAQa1KUKUQDr1iVUa0rrEQGlVxwKplr3GOSixYsXBObNs3cdIcicWuKgosYPeYIpAb37E3r7HFEgI7VNB1slYz1xo6P8CWP9jIbovg4YB9BU870+3bXNzzJicZUqU089lfyEbuJq9d/UISYI2LdjB7Pe+lbaDjkUrdcxxjQWNQUmGDHNG0cjSiAj+sWkAIyRcjlAUhqbyYymF8Yq+QNovaFfo1DYu9eza5undbal3q8kQ5i68xjhiFMjN9dkjJyWiWzkjHrt92CEsMOwZ5cjruuIDX6gIueACziYqswYfWNED9QZjCrwsWCIppIxqjRHbXpJYiYeOYeXX9nIQH8/1to/aPp67ykUCvz+gQfpN4ZDFywgKZUw1qabQEbpKmg6fAdQWSot6bXIa6ywplUoY3ynkRjYGB9lLL3RBN0I9Rps3eTJjTdICPW9HrX4bCYIoqycFojoyQYwVpS+GCkKNoD9+5KRnAavIx0GOSAla16Hqoy8VsRfTzKaYIyCNxoXs+qJshl2r17Ng+tfSs/9x4qeVMlEEbv37uWHN97ISa++ShhGWOdHaoBVRqsgm9E919jH2lR+jbC7NQdV3EmDhhScNKk7DcibRkmrNjZns4JSxoRFjMDO7Q4CiDoMtT2OcLpVHIjRkwNVneucooEIgx7bbkgc9A94rDkwRj9WVMc6TUYgMAYRk4p4I2Y0Eg4RSWlI9QCAXiMZyBhqa9CdKlGxhb2rVrPFWLS1ldi5P9pN451D2lp56Y47OFwMUbEFcUm6zsKBwDSdUO/TPD2jji+N/IdtBCn1gA05mto1jdCeNhjAjayTjoT0XYO2Aiv09njqdSXqEqq9HkTEpYmXuYGBad570iSxYiYa4rpSqabK+EDrShvCLQdUjxj1VIdKJPUaoQhRGBAGNt1tiYMkIYoicsVig7q0YSK+FoxRz19Gb15BjWG+evaKUFY9MEx9UILHAZNUOSsMcUmC7+slLLak5T0NiVBJb1lR4nIJsQFBGDZyGwdLSrq5mmKpDR3YBMk3F1/SjKbRNNFlJJUyGSMlgRVKpbRkNmo3lLYmeKeSpql1WiDQ6bVx1hhs3lCueZJ4NIYzNmQwVp8aY6gODZLN5ZhzxulMm3sULV3jCAqFtJyzWsNVKrihQfa+sJbtjz9OFASYMEjBVT3A6RoJ38toirepVD3CJBGuFSVBRqMGYyR1NNMHkQjU6wSTJzHzDW/g1bvuwg2XILD4JgMlCV6ECSeeTHnvHkq7d2OsBU0pbMTv0mbaeWzBw6ik65i1MTqaUUzf4xuACb6xEeM6VMpKpihoPeVLl1JoR6Be82obN+hBQiGJFZ/q97FNSSPKSQBrLfVyieMvvpg3fujD7N6/j2cfWcXTjzxC35Yt+GqVQiFPJpOlfdIkzn/f+zjp3e/m3r/7O6ScKlkZCVCOUp/hQBN57Pe+YVBk9LWxKNAmvTfsT0u1v8SRV13FIZddxv2/+iVT+/rJBxYnac7ciOHUL32RqQsW8Msvf5l9//JdJnd1UXeuoTakkciVMVHtMT9vSIlp/E1KXU3gNAW1sbmUZopbiH1a0Z/PpE4jvpGvV/JNp3gkJy6m2a+Xfn+AhIyhER/HtI7r5KLrPsQPbr6ZR+++m3ZVCuo59tzzyOWybHjwAaJCgT2PP86qnv1c/ZPbmfn2K3jmK19latd4nE/GRF7HWjIN/0Ab52zcdPo6amo3o81NpduUGkTQep38hAlMfsNFlEolhqtVQmtTS8hY4v5ejvzoR5m6YAHqPS88+yz5KDPGIGlGDQUVxWtqGutIFU2avjUjekQbWkIP2iiNn+moX0KzJ9JygMFgDGKAZKyiUG0WHbyWrswYTjAi4BzffM97eOand3FM93imtRQ5+Q1v4D3f/z5D47oYRMhkshTb25j/zncB0DswyHAzDH5AxPjAcIxWa2iSYJKYgNQgGMnsWZNeo47GycYegTFoqUT3mWcStneQVKsEXhsZP4OWK3QedTRHXH016j39+/fT//LLdIiQVGsj5vkBjp+k/ok5yDmUg8qaUitSxujcZj/LKOMYSaPdKe+NqgHvUSMiZSOCsZJKROIJM2DtaPyqmTyVsSc2hnqlgg4McPj4boxXarUaZ7z7anp7enjonntoC0Pq5TIX3bCEI//qr9i2YQMPLV3GhNZW1LtRW36MWW2MQUtlJp93Lhfe/hOCIw4nLlcIjG0ELQ06XIJSmUBMw/sePUwjiBhYw+S/edNo6ZDqiDFBEnPURz9KrR4jxrDlxRdhcJA3fPe7HH/DDQxVKqnVeLBl+ZpaMzkovqcH1JsduKFHuiAILERZ8DVN2+9sQwiMlI1Cr216NqHgy0omK0Rho2dLRmNEwtjwuyLGEIQh3nuSWo3OadOYecopPPjTu2HvHqYcegiX3Pxtjn3rW1mzejVf/MAH6K5V6IgivHqMsY3Yj6ZFcM06rSRh3DHHYA89lOcqVSpAKCkYfrjExIsuouvC84lLw2ngUJt5cSEQg1SqtM89isxhh1Hq7SXMZlPT21rcwCDTLr6YcO4c1vzmfgBefuwxxhUKdM8/le3WsjlO0rw7o0HEUYZoOJc27eK1xoyGYYxNdaOMUtfBG1k1bbfL5SEpKSYCCVSD9CS9RmGrEUEMKnnBDXqyOUMhP1pRMury6QEfLg2OM9YQVyrMnj8fjOH3y5Zy5l+/iXf85A5mnnYav7vjDr5xzTW0bXqV2a1teOcwxuLLZTSJQYR4cCjNtHklKhZZ/5Wv8MOzzyZ85RU68jnUp5QVZELmfPITvGAMvd6TDQKMGZUOawRfHmbaJW/h5aefZseLL5ItFNKFcw4TBMz9+MdZ/v1byOTz6ZCC9esp9PTw09NO5/d//xkmW0uQyxMak+oya0akwhqDr9Wp9vVR7tlPPDyMMamBUhscoNSzH1+vpfQ41odr0JZ6KBQgV4S4z2OLglg0SMMc240I6xp8rNJm8AOeKISOdoP3vI6COli3NOx67znynHPYtHEjPa++it+5g+/9t//GL7/1LY467TS+8sDvWHDF2ykNDhIEAa5Upvu447j4llu57Le/48hrr6VeqSBxTJCJmP2e93Lc0cdwtLFENgDvqe7YzoTTTmN/qcTL99xDZ5IQD/SnnK9gVTCxI9vWSecFF/DEbT9Ga7U0IZXNkfT1MeOyRfQHhmfvvJM58+dTqVboXbuWIy64kLlXXskxNuDiz32Ok2+6kV1xDEmCGy4hmqYD4uEhWqdN46xPfYrLvve/mX3BBdQG+hHg6Df9DVfddDNv+9rXmXjmWZSq1ZESoea6eQedXYYogvp+JRpnEEWtFayw1jjlCU2RE9Np8EMKCXRPsCM6hNdwoh4AkDpHplBg+rxjWX3ffeTVE/f0MPz0Uzz3zW/yoysuZ8eLL3LhF77Ake+/loGeHtqmTeXcb3yDrmOO4dfL7mRnFLF/3LiU+88/j6M+cj2vThjPzmoVUy6T7exk8rnnMv3yK3jqZz9jUrGFYz/+cdrPOx8bOwJJ63Z1aIiJb7iIvdUqu5Yvp70ZhQ0tUigw84Mf5N4vfZlJ7e1k29rYtu5FdHCQs7/0RVovvZTN3d3MWLSIpx5/nC2795DJZDhtyRLedPtPGACmnnUWC2+/nROuvoa9xtB5wYUk06az6H99h7d88Uu8tHcv3/3yl3lixQpMlElbisf6cAqTpho0hnqvJzPRoE5FUbzwhEk0WFWNXd0oRjoNOCXpdUyeGpDJpHb2WP1hDtAjqRLGezomT8Lk86z62c9p07RdLFcsMn58Fy2VMg9+8pP0b97M2R+8jsHOTg677DJy7e388POf557rP0zy1FO85cYbab3ySqZecimDfX2sue9+2sXQftKJHP7Ff2b/vGNws2ex+4UX+Jv/9W2e3bOb8f/902zt7ECSZMSKmnzl23nsjjuYWK6QGRpOrzdOmHLFFeyvVVn7k59w0gkngiqvPvYY0489lrCjg/u//nUOOf10AB6//XYOmzyZC2+5lcMuuQQtFhmYfgjn//MX8caw5KqruPkd7+DRm2/mpEsvZeoJJ3DzZz7D9z9yPS07dzLdGgpjIh2NEkgyGZg6w1LZp/gYogkG8WIqdR+X6ma1ueeV7g1e5cXIGmxevGk1VLcmdE2wjO8yqccuHJC8b4YQjU1LP/t27qRz6lQq1SrTDpnG8eecQ+IceE8SxwT5PLZaY//69QQi5OfO5ZCLLqJnzx4eve023njRRbzlX/6FcqXCb396F+OPPZZnH3yAXG8fXa2tzP385/nVt7/N9hUr2Lt+Padcdhk71q8nrlbp27iRjZs3p5WNAwOMO/ssSl3jeGnpMo5s76Desx+AtpkzmXHN1fz2pm8xpV5nyuGHgQg7XniBeW96E6rK5qeeZMHll7Nj0ybK23ew6Ac/4OknnySp1Xjmt7/lzEWLyLa0cMvnP8/GX/6CT990Ix/7+c95fvlyerZt4+jTT+ewri5aTdow78dYViKQJEr3BGHCdGFoQ0KmU4ja8Lm0lOelxwflRbNs2TIHel8mNKD4cHpIfUtCEMDs2QHOj3rCjHx4akWU+3oZd8ihXPX1r/M3n/0cfXv2MGHGTPbYgP4kSUPPImjisLkcXXPmUKmUCXI52iZO5KkHHiQ/MMj4iRNxccKmZ55h7qnzEeD5Bx5kfL3OhNPm05skrLtjKRe9+9307trN5FmzGHfEHDpmzuTeD3+Y+aecOmKdTbvug6y67cd09vbRHUXU+3oBOP+jH6F/cJANP/s5c7u6iKZMAaDc389RF13EpufXkAlDumbN4rG77+byf/pnnlqxgud/9zuCTIZdr25i/l//NZvXr+fR227jwvMv4LA3/jXPPfYYzzzyCP/6zncwY9o0rlt2J3SOIx4exjZ8h6a15hLh8LmGTAaG1jsKh1uM4jORoML9S5asTAxAvcaySt1Bgg0PsWhZqe52zD4yoqVF0p7upkI3gk8SkjjhjR//BNffdRd7FdY89xwP/vRu7v3Slxh67FFagxAFgjCg0tvLzDe8gfZDD+WxX91LUq2CKlueX8OEjjb2/P73DK5bS7lcZtYpp+KcY9+6dXSHIbkZh+K8Y/4VV9B93nm8vOoR8uO7eHzpUp788Ed481vfRuecOWzctJnJl15Kf2cnL3z/Fo7vHAfe43v7AJg4+zBW3HorkyoVOjJZookTKVUqZAoFWrq7ee7+3zD7uONRVWYceyzFYoG7PvtZ3rBoEf19fYRRSCaX48FlS2mvVDj3Ix8B4Mn776e7WMQODvL9RQtx5TLvX7qU3CGHEpfLDXM+nTjR2gpzTjCUtnncoFKcY9E4TVDVlWUAZvFizKJ/evjpaqxP5QKDKYoLJ1tKa+q0dxuOmBMS19MwCpI2a9og4Oobb+T8a6/lG5/9LF+7+t3Q18fA3j3MmjSRrtYWQmuwYUB53z4mHH8C5y9eTH/Pfpb+0z8xpaUFBWpDQ+SMJchkiTo72fb88xx67Dy2v/IKum8fHa0t9Dz9NFGtjmtt4ZVnnqG0cSM7l97Jedd9kEvuXEZfayuP/+QnTJk2le5Pf5L7//EfmVGt0W0tiOD37Qfv2bd5M6/e/xvmtLbhMWTa2hjcu5f2iRNRVbY99xyzTjgBgOlz5vCjz36Wo8aPZ9a8ebzy7LMUW1tRVZ6/737Ofsc7GDfvGJJ6nS1r11Ko1Sh0T2DitGks/eAHCIHLvvY1hhsNM8ZCvQZHHGMZN0XYuzqhcKgl14nLBUYqdf/sAzsffmLxYow5hwUGUHVyYxQY0ZonOy+kvtVR3e847uRwREqsNdRKJS764HUcedZZ3PW977Hitts4++ij2f3Uk/Rs3Eg+lyVxnrhcYWj3HmZdcCGX//g29u7Zwz+95z209PTQNjiIiDB++nR6Nm5kzuWXs2egn20P/Z6uiRPZvWkTuVqNbKFA6fm1PHrlVey/7ce41Y9RbG1lz5e/yqYl/8AD3/kOL3zjmxxTq3P8t27iiQcepPeX93Jixzi8cwSBxff2pr7RHXcwfmCQcWGYxqCMpTo8TGCDtFJ+YIBJc+YgItz51a8S7trFzO5uzPjxbF+7NnU4gUs/fD3HXn4Zq+++h2ocs3vtWo488wxO/+Qn2SdCqbefV1ev4pDDDqPe1kY9jvFOKLTCcWcYynuVoZcd404L8DXIZI045aYlS/A3nLPAmHOXrHSqyMsD8dLBUrIpY4wJx1sfTbIMPFqjY5Lh+JNC6rVRr33ctKkAPPvIKlorZVypxNN33028bi1+cIh6ucKkI+dw6Y3f5OKvfZ3fLLuTf1i4kGjDK8ybNJm9zz3H/rVrueTjH+eyO++k+7JF/Pgzf8/kcpXBJ57EtrYQNXwLDQO6DZw6eTLVe+5h/JZtZFqKtD7zDCe8upmz2ts57sZv8HK1wkOf+XsWdI0n6xw4j40ymJ07efYDH2TH3T/jmLZ2vNfUtygNYzMZ9jz5BD6OyXd10TFtGmseXc2Lv/oVx3Z14Rom69D+/ex69FEQ4eRL3sK//P1nqfQP0L9vH4VikYU338y9d93F1ufW0DlhAnMWnMPDv/kN+7bvIJvLUKt4TjjN0H2IYecDCfnphtwU4yOM6RtOtm7fXP2JKsK5K10A6IobFgQf/9rKyn3/eObnM5H9fqUWu+Jpkem9s0xpi+f4+QGbX3Hs3eXJ5HP8/EtfwuZyvPOTH2fD8ccRVCrYICBfLNAycSJt06bji0VefOYZvnfppQysW8fhbW2Mb2vFeYdRz/IPf4hJCxcynM1x27veRdvevRwxYQLP/o9/pO/ouWRaiqj3iCoeqKsnFGFynGCMYApFwnKF3F9dzJpNm3jsWzdzdq7AJDHU1RM00rIuTohWruTcfAETGJwIUq9T3b6D3PHHUXplI099+Hqkt5d73/FOXu7dz7xCgby1DA0MUN21i6itje0rHuTn730Pj2/ZSu2FF+g67zz69u7l7CuvRPIFXlixnNNPP41L//mLrF+/nm9/6lNMby0SV2DSIcKJ5xgGNnkG1zpmvS+Dr3rfkg2DwYr7wpuXPFVezoLgXFYmMrZz6gZWmLOL7on2vDkuyaqrPFqzte2OQ67J0rPVc9dt9TS84erEiWfSsccy/cQTaZs4kSCKqAyX2L9jOztffJE969ZCbx+TW4pMKBYxXlH1afjDCCZJKA8NM5wktLe20pXNprvae+JqFZvPU2gE8CzN2qrUW7aqI2VD6pWd/QNMbG+jSwzq0/RQLGk+IhHwRnAKCYq3AZW+XiZecw3jPvExvnfOORy1v4d6Lpf2jIRBGp43Qrmvj6OvfT+9c4/koQ9dx6HFIpWGAxq1tzP305/m2VWreNtHPsKW9etR73n64Ye47/u3MDkK6Igy1JznLddYpswxvPDNOsVDLBMvti6sGztY1udXrKifeO133uREluhok8eY+SW/+uKZZ3QXzMMen0RZ7J7bylI4JmD6hRHPrIx54N6YlqLBqKE+PEy9WsE1si8GiIyhmM3Sls+TDUJE0+aYZo45aER3AxEiY9P2Nq9p74ZCaBpdVz5NsAakpTvSBAQhbNZXaRpbyxuLeDfS5uAAPwaQmDTLqAIqhjiJ8e3tzPvFz/jhte9n6po15IoF6l7xkibnEoG4kYoIFixgzQMPMCOwJIBTqNeqZKZN55V9e+lobaWUL7D71VdheIhJnZ1kQsvAoOOsN1tO+ivL5vtiep9wHHFdFl/XJIpssLvfnXPCux5dOXaK0EijyLJ161SXLrSHX3vflivOm9be1RaeHjvn8tOt2X9/nWiqZcY8S72sbH3Vk4kgiCJaCgVaiy10tBTpKBZozRfIZjKEImRII7lehdBA3hhUIWfSorPYKzmaTTxK0Ri8VyLSv82M5OYgL0LeGLIiI038okKLERL1qb8kSmQMORHiRqJHBQpiiIzBiZI09JLZswcbhQxMmUJp1SNMKrakm0AkBUIgby1Olb516yhEIQWRFDTABCG1vj6KgJSGMT19dGUzdLW0YI0yNOQ5er5l/puF/s2OLcsSZr0zwuZJOgtRsKcv+dax73z02wePdJLX9BguW2iKu4aCNlt6vDMn8+qRc+U1ie1bXWfWB3LkCsqvlyasf9bTWgTxo6WVzYr2rBj6XKLbanW6g0BmZyL2JQmba3XmZDJsj2NajOGobIZnKlVyYpgZBTxfqenpuZzsSxI21OuaE+GETEYmWMOaWp3tcUKbNXp6lJG8CBkVfl+rcFQYMVkMFlifxPpiEnNWlJV2a6ihrKjVtIJyQpSRVmvxKCsrFeZkM+jMWWx5aT37vWrZe5kWRXpYGMoOl/BsrcZhUYZJmYjhJGZNtcbcbDZNx2tKhaoeJ+l0ukQ93ijlYWXaXMv5V1rAs/arNSadEzBuvnWZ2Nqhqq7dvU1PPm3atPrBU0/NwS15C9fO1Tdef19tqGouq3k/bOtI20nWFw+zbP1RFW+EixdajjjGUBpq+ic6EpwPBHqShFVDw0yOQrbV6y5utLg+Wa7opDBkfbXm9iYJHdayvlbT7XFMQQx7k8RlRSh5r2uqNUKEWwYH6TCWrUnMpiTWHuf48fCwtlpDXZRbS8P+8XpN89awT73+sFxyndayXZ0WreV/l4b9oHoyIqxpgBwr3FEads/Var7r5Q3MCjOsKJXpsJZ7Bgd1r3PkjeHhUklpJLz6veeXg0O+3zm1AiqapvhE8Orx6hEDtRJMOcJw5tsCTAgv/0ud9sMN4880XmpIXbU0UDaXnf7xRyssnKsHl5i9pppGlizxunShvfgTK9cPDPmrgtAaKvgJb8xoUBBe/UEVmxXedKVh7gmSgiIpKF4hEsP6apVJUcisTEZOLxasQSgYocUaeb5SJVbPxDDAAROCQMZbSySG2ZkoMAId1kiLEfGqOs1aHwMTbUBWhEiEKUE6PmmzS/SYMNRXklgrCG2BFQ/8vlbVY6OMbEoSXopjeWM+L+dlc3JaNic1YJtLdG4Y6atxgmYiCgiTgkCqPr2uwKRSPiUMpcUYPDDgvD80Cnm1XicUQQ8q1ROBelmZfIRh/lsioiJsuKVGkBemvy1QLanPZI3pHfLvPP7dj6zVpQvtwS3RrwsIgCxa5pYvXxAs+Niqn+0bdB8q5IKAqrqpV2SUBF75fg2Thb++ynDSOUKl1OjINY3BYKBVn/ot9YbZ2iwomxQG5IxxTtNBfdVGj3iUSoZvFrDVgZXVip6UyeIalen7nZPHq1U9LZeTOsLOJGFyEJhdztGvCRVVPtfeYfd6x13lkm+zQkVVKz4tQCg1cvm7k0QnBoHdkyRmIHEgEBlhdbWiRWOYHATUG9McmmU/vUnCxCCQ7fW4SQeNQrsUmnpVmTLPcvxfh4QF2HhrDa0rs98dqFbVtRbDYF+f/8gxVz32U12+IPhDowD/UL0Z5567MtHlC4Kzrnvkpn0DyWda8mEgsboZV2dUHbx0cx2nwoWXCxcuSqso4npqbh6Vz9GTJP65UsU9U654ERh0nrL32mYtiWJ7E0esysxMRl+oVd1vhodcqzEairDPObyqnp3LyS/LJfUoO5NE263xx2QycvfwsB/2ypp6Xd+cL5Cosqpa8zWUn1dKnBJlJGvEtBjLaZmMLCuX/G8r5eSluOaHveeFep03FgrEqv6ZWk1B2B7HelY+L5vrMRvrdY1Vdb9LtIayI479kHf+rEKBHXHd7YhjDRv5B5+km/GQ00JmnxeChc23VqGuzHpvRknUtRejYFevX3zkFY994/941snIzJPGrKenv3fm303ukv9RSWJvsrDtjtiUd3mO/EBAx1Rlyxpl+V3C/q3Q3iLUVdlfj32ntWZcGFBKHBXvaLcBFa9kgY4gpardcezrXuWwKBKDMuw9JeeYbEP2J4lOtFaG1Wus0G1FepzXbmNlv/c6zhgGvZcs6KTAytYkoa6qs8NQ6pqa4S/Fda151UPC0NTx7HaeVmPpd4lGYilaIztcQqs11BBVlEhE9iSOtsASozrkHDkx0u+9L1gxGTHEMdg2YcLJAV2HB1B2DN5TITfRMP3yUCOcbysEdt+Afm7mW1d//t89DehgUNbcesZ149q5UdUjBed23+fsntWOw95hmXwKlPbDY7+CFx5KfYmWfKMQTJVAhYiUviIxI5UsiJCjYQZr2scRIoQNfyAjgnNK1PBdfFqLMfI736hSVCBWJdNIplUbprEDosZ9lBvDyAIxVL3HYEb8FGOg3iiUdg2T3Bih1hgyI0CtqStiT4yQPcTScXRAYYKBbQnlByu0HR8w4eLQ5VRtPguDFX/9zLc+9s0/dbLcnzzNpfmBz9w6/5LuDvlBJqQlDl0ysNYHm+5IGH+q4bCFQpSBTc/AE/cKuzYImQhyGRCfOntpAXZavhM0apKaTp/VZquCNrqpGg6hNlvFdEwvoo50KjGm52S07my07LPpKAopgE5T/eCk4SyixCJjZpcIXnTEj/Gq6eA0JyTeQ5uQmRVQOMQQBQZ5vobfENN6QZb2YyRpz0hgjA4PDOvVR79j9Z1/zpi/P2u8TvODn7r11HkTOs2/tufkmJKJXTLgZcOPnHFVOOztlu55EA94XlwlPL/cMrADshkhCJotYGlxWdCscJd00W0j+RWMdOhqo3ih2ZU72m/SbARqRghQec3NqIyC0mw1cA1H1Uuz4Jq0tLRRe5g0p/5I2m7gUTRpzPotCDLVYCcbbNGQ6XOEz9YwkVA4P6u58eInFKyNxa3tq/irTr161bN/7szFP2sq6ZIfbPHLFy8ITv/oI7vmHjf9X6e0ancxkhPDPDL+dBISzMY7PEM7oO1wmHkiHHqMkm+FUp9Q7hXUKTZIm1fGpoWhKS3pNhmp1RhT+9ssW1fRkRLnhs2dLn5jkUeOkZ4PGR2tNAYMbUhOEwzf7BNpAKXpD3AFQQ+xmMMNdFskhuzaOtH6OhwWEZ2VSfIFY4tRYEqxu/WZjfWFb/zoo1uWL14QzLj6Twfj/3hu79ixQq/+dP6iloL7SlvBTC2bWGs9+E13eTuwCaadI0w5T8i2CYO7Ycuzhs1PQN8WRWuSzmgPU64WBOMb7dPabHFrFqj5tMSHMR1aOjpJolnRIa/t3Rkd0dco8B8FonEgjdeUqtQ3YlkBuFbw4wU/3qB5QWpKZmtCZmuMbzNwbOTCzsCML1hJcDvVmI+f/aGVt/975vb+RSZbP/LD07pnT0g+nw302kJRqEjie19UtvwCU+uHiacbJp0hZMYJlT7D3g3CrrVKzwao9igmARtIeshow74daY9LQWn2MsrY6ncdk/MfA4qOeaCIb3YzvQ4Y6tOIsVPBGyXJQ9IhuC7Btws+FExZyWxPyOxI8BFUZoVeJ1ntzARp0WfE93ZW5LNXL1m5W5cutPxnT7b+Q7Pft/z81DOLebekmOe8IK+UYud7nkW3/UZsrUdpP0roOtmSnxLgVRjaB32boX+Tp7wDan2g1fT5Rdak/SnN2e8jfd9jul7HNsKMVL/LgX0iza6CJkC+oUPUC2oUF0KcF+JWcO2CaxV8LgUqGPBkdiSE+xw+C5VDAhePDyQfGROogNXl3vjFCz+/6qH/8tnvf+zpCDvuP/mSlpz/RDYjp4d5GCh5BtaT7Pi92qFNKlGHof0oS352gG0zxA7qg1DpgfJupbZPSfoUN6hoVZBYMWOqKEeejnBQEfOBkdLRVhGVdNqbDwQXgc8ZkgIkLUpSFJIsaJSCZEtKsM8R7UkwFU/carQ+LXBxh7XZwIgkkCiP1kW/dM1XHvnp/+eejnCwboElIwGz3Q+c9ObIcJ2BC9vaDcOx0rddXc9TSu/zauJBlbDDkD3EEk0JCMcZNErLLV01LUZOhsGVFD+s+BL4KmgN0vi6NnIpzS6MVHzUggagIfiM4DON1yy4DLhIUgvKK1RBhjxBjyfscZiyx2VE6+ONr08IkEJgc9ZQqzic6u/qam+69saHfjayEW9YLLJkyV/sAWL/MU/YOYhHt943/5Ss9e/Gc0khZyZiDINDysA27wbWex181Zu434sEIkG7Iey22HEG22owhbR9WI02+B6SJH1miDRt1Ebuw3nBaZqMas5A9L4xYTRJy/+1ojCoSL/D9DtkWBEHPis+Hmd8fZwRbTE2kwmQBCplvweRu2uOW99/88OPvd4DCf6SX/+xz6BautCydplK4xF0Lyyd39ma46/E8TaXcE4hF7QTWIaGPYP7HLXdLqls99T3eomH1OARCcDkDKYgmLwgOQMZIBLECmoaHV2Ac4pPBBd7tAZaU7TskUr6qtU03aegmhWftIgm7QbXEgS2YAisoHWlWnH9asxKh9xZdrVff+hbT/SM5Iv+wk/U+U8FZIyOec1T2l5YumBi4OIFvi4XO8eZiMxuKQSogWpNqQx5agOeuNf5ZFDVDXmSYRWtKRqr4NIFGm2ZOECJqzbaeTUykBH1ecHnjWjRGLIGEzY6tRIolx04XvHqH4499w/GwcqPffehXWOlYe3cubrkL0hN/6WAHKz808TM6M1959oTw+NPKR5ha+5kRU523h8rqjPVmPFhZG0QpPkH79P62DhWvFN8AkmcfrAnLQz3SFpZ0mh/EgTv02cguhjKFed9onvV8apXWeNVHvfOPBnHpfXv/+5T8diij2Xr1snCZcu88H/Zcwz/EDgrbkjH2r3eQOH7vnJRZ04qhxo1s5y6w4xnBoYpeJ0QK50CRZCsVyLvRkZXOZdo7JGKOoYSp/0oe3zCdqeyyXnzinP6SlXize/72qO9B59z8eIFAcANN6x0/5kPkxz79f8Ck4PK52AkpvYAAAAASUVORK5CYII=" alt="Boi de Minas" style={{width:180,height:"auto",marginBottom:16,objectFit:"contain"}} />
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
                    <img src="data:image/png;base64,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" alt="Boi de Minas" style={{height:48,width:"auto",objectFit:"contain",filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.4))"}} />
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
