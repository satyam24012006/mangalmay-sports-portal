import React from 'react';
import {Link,useLocation} from 'react-router-dom';
import {Grid2X2,UserRound,LogOut} from 'lucide-react';

export const COLLEGES=['Mangalmay Institute of Engineering and Technology','Ajay Kumar Garg Engineering College','ABES Engineering College','KIET Group of Institutions','JSS Academy of Technical Education','Galgotias College of Engineering and Technology','GL Bajaj Institute of Technology and Management','Noida Institute of Engineering and Technology','IPEC Ghaziabad','IMS Engineering College','United College of Engineering and Research','Greater Noida Institute of Technology','Bennett University','Sharda University','Other AKTU-affiliated college'];
export const money=n=>'\u20B9'+Number(n||0).toLocaleString('en-IN');
export const shortId=id=>String(id||'').slice(0,12).toUpperCase();
export const PHONE_RE=/^[6-9]\d{9}$/;
export const EMAIL_RE=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const fmtDate=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'\u2014';

/* Mirrors TeamRules.java on the server (the server is the final authority). */
export function teamRules(teamSize=''){
  const m=/(\d+)\s*player/i.exec(teamSize);
  if(m){const n=Number(m[1]);return {min:n,max:n+4,teamNameRequired:true}}
  const t=teamSize.toLowerCase();
  if(t.includes('single')||t.includes('double'))return {min:1,max:2,teamNameRequired:false};
  return {min:1,max:20,teamNameRequired:false};
}
export const rangeText=r=>r.min===r.max?String(r.min):`${r.min} to ${r.max}`;

export function Loading(){return <div className="empty-state" style={{margin:'20vh auto',maxWidth:360}}>Loading\u2026</div>}

export function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
export function PageHeading({eyebrow,title,subtitle,action}){return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>}
export function SideLink({to,icon,label,active}){return <Link className={'side-link '+(active?'active':'')} to={to}>{icon}{label}{active&&<span className="side-active-dot"/>}</Link>}
export function UserLayout({session,logout,children}){const loc=useLocation();return <div className="portal"><aside className="sidebar"><Link to="/" className="brand"><span className="brand-mark">M</span><span>MANGALMAY<span className="brand-sub">SPORTS DEPARTMENT</span></span></Link><div className="side-caption">PLAYER HUB</div><nav><SideLink to="/events" icon={<Grid2X2 size={17}/>} label="Events" active={loc.pathname==='/events'}/><SideLink to="/account" icon={<UserRound size={17}/>} label="My account" active={loc.pathname==='/account'}/></nav><div className="sidebar-bottom"><div className="profile-mini"><div className="avatar">{session?.name?.[0]||'P'}</div><div><strong>{session?.name}</strong><span>{session?.college||'Student player'}</span></div></div><button className="logout-btn" onClick={logout}><LogOut size={16}/> Sign out</button></div></aside><main className="portal-main"><header className="portal-top"><div><span className="top-kicker">MANGALMAY / SPORTS</span><span className="top-current">{loc.pathname==='/account'?'MY ACCOUNT':loc.pathname==='/payment'?'SECURE PAYMENT':loc.pathname.startsWith('/register')?'REGISTRATION':loc.pathname.startsWith('/receipt')?'RECEIPT':'EVENTS & ACTIVITIES'}</span></div><div className="top-status"><span className="live-dot"/> SEASON 2026</div></header><div className="portal-content">{children}</div></main></div>}
