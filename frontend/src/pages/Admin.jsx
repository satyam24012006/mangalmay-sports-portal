import React,{useCallback,useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Activity,ArrowRight,Check,ClipboardList,Clock,Download,Flame,Grid2X2,LogOut,Plus,Trash2,Users,Wallet,Trophy,CalendarDays,Search,X,AlertCircle} from 'lucide-react';
import {api} from '../api.js';
import {COLLEGES,Field,money,fmtDate} from '../common.jsx';

const TABS=[['Overview',Grid2X2],['Users',Users],['Events',CalendarDays],['Sports',Trophy],['Enrollments',ClipboardList],['Payments',Wallet]];
const blankForm=tab=>tab==='Users'?{name:'',email:'',college:COLLEGES[0],password:''}
  :tab==='Events'?{name:'',date:'2026-12-10',venue:'Mangalmay Campus',status:'Registration open',desc:''}
  :tab==='Sports'?{name:'',category:'TEAM SPORT',fee:500,teamSize:'5 players',slots:10,icon:'\uD83C\uDFC6',color:'#c7ff4d'}:{};
const LABELS={teamSize:'TEAM SIZE',desc:'DESCRIPTION',slots:'SLOTS PER EVENT'};

export default function Admin({events,sports,reloadCatalog,logout}){
  const [tab,setTab]=useState('Overview'),[search,setSearch]=useState(''),[modal,setModal]=useState(null),[form,setForm]=useState({});
  const [users,setUsers]=useState([]),[enrollments,setEnrollments]=useState([]),[stats,setStats]=useState(null);
  const [err,setErr]=useState(''),[formErr,setFormErr]=useState(''),[busy,setBusy]=useState(false);

  const load=useCallback(async()=>{
    try{const [u,en,st]=await Promise.all([api.admin.users(),api.admin.enrollments(),api.admin.stats()]);setUsers(u);setEnrollments(en);setStats(st)}
    catch(e){setErr(e.message)}
  },[]);
  useEffect(()=>{load()},[load]);
  const refreshAll=()=>Promise.all([load(),reloadCatalog()]);

  const pending=stats?.pending??0;
  const filtered=(arr,keys)=>arr.filter(x=>keys.some(k=>String(x[k]||'').toLowerCase().includes(search.toLowerCase())));

  const closeModal=()=>{if(form.image)URL.revokeObjectURL(form.image);setModal(null);setForm({});setFormErr('')};
  const openAdd=()=>{setForm(blankForm(tab));setFormErr('');setModal('add')};
  const run=async fn=>{setErr('');try{await fn();await refreshAll()}catch(e){setErr(e.message)}};

  const add=async()=>{
    setBusy(true);setFormErr('');
    try{
      if(tab==='Users')await api.admin.createUser(form);
      if(tab==='Events')await api.admin.createEvent(form);
      if(tab==='Sports')await api.admin.createSport({...form,fee:Number(form.fee),slots:Number(form.slots)});
      await refreshAll();closeModal();
    }catch(e){setFormErr(e.message)}finally{setBusy(false)}
  };
  const remove=(kind,id)=>{
    if(!window.confirm('Remove this item? This cannot be undone.'))return;
    run(()=>kind==='Users'?api.admin.deleteUser(id):kind==='Events'?api.admin.deleteEvent(id):kind==='Sports'?api.admin.deleteSport(id):api.admin.deleteEnrollment(id));
  };
  const verify=(e,status)=>run(()=>api.admin.setStatus(e.id,status));
  const viewProof=async e=>{
    setForm({image:null,loading:true});setModal('proof');setFormErr('');
    try{const blob=await api.proof(e.id);setForm({image:URL.createObjectURL(blob)})}
    catch(er){setFormErr(er.message);setForm({})}
  };
  const exportCsv=async()=>{
    setErr('');
    try{const blob=await api.admin.exportCsv();const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mangalmay-payments.csv';a.click();URL.revokeObjectURL(a.href)}
    catch(e){setErr(e.message)}
  };

  const rowsFor=t=>t==='Users'?filtered(users,['name','email','college']):t==='Events'?filtered(events,['name','venue','status']):t==='Sports'?filtered(sports,['name','category']):filtered(enrollments,['name','email','sportName','team','utr','status']).filter(e=>t!=='Payments'||e.status!=='draft');
  const rows=tab==='Overview'?[]:rowsFor(tab);
  const kpis=[[Users,'Total users',stats?.users??0,'Registered players'],[ClipboardList,'Enrollments',stats?.enrollments??0,'All registration records'],[Wallet,'Verified revenue',money(stats?.verifiedRevenue),'Confirmed payments'],[Clock,'Pending review',pending,'Awaiting verification']];

  return <div className="admin-shell"><aside className="admin-sidebar"><Link to="/" className="brand"><span className="brand-mark">M</span><span>MANGALMAY<span className="brand-sub">SPORTS ADMIN</span></span></Link><div className="admin-label">MANAGEMENT</div><nav>{TABS.map(([t,I])=><button key={t} onClick={()=>{setTab(t);setSearch('');setErr('')}} className={'admin-nav '+(tab===t?'active':'')}><I size={17}/>{t}{t==='Enrollments'&&pending>0&&<span className="nav-count">{pending}</span>}</button>)}</nav><div className="admin-sidebar-bottom"><div className="admin-user"><div className="avatar">A</div><div><strong>Sports Admin</strong><span>Administrator</span></div></div><button className="logout-btn" onClick={logout}><LogOut size={16}/> Sign out</button></div></aside>
  <main className="admin-main"><header className="admin-header"><div><span className="top-kicker">ADMINISTRATION / 2026</span><span className="top-current">{tab.toUpperCase()}</span></div><div className="admin-header-right"><span className="top-status"><span className="live-dot"/> SYSTEM ONLINE</span><div className="avatar">A</div></div></header>
  <div className="admin-content"><div className="admin-page-title"><div><div className="eyebrow">SPORTS DEPARTMENT / MANGALMAY</div><h1>{tab==='Overview'?'Command center.':tab+'.'}</h1><p>{tab==='Overview'?'Your season at a glance. Keep every detail in play.':`Manage ${tab.toLowerCase()} and keep the season running smoothly.`}</p></div>{['Users','Events','Sports'].includes(tab)&&<button className="btn" onClick={openAdd}><Plus size={16}/> Add {tab.slice(0,-1)}</button>}{tab==='Payments'&&<button className="btn" onClick={exportCsv}><Download size={16}/> Export CSV</button>}</div>
  {err&&<div className="error-msg" role="alert" style={{marginBottom:18}}><AlertCircle size={16}/>{err}</div>}

  {tab==='Overview'&&<><div className="kpi-grid">{kpis.map(([I,l,v,s],i)=><div className="kpi-card" key={l}><div className="kpi-top"><span>{l}</span><I size={18}/></div><strong>{v}</strong><small>{s}</small><div className="kpi-spark" style={{'--spark':i%2?'#a58bff':'#c7ff4d'}}><span/><span/><span/><span/><span/><span/><span/></div></div>)}</div>
    <div className="admin-panels"><div className="admin-panel"><div className="admin-panel-title"><h2>Latest registrations</h2><button onClick={()=>setTab('Enrollments')}>View all <ArrowRight size={14}/></button></div>{enrollments.length===0?<p className="muted">New registrations will appear here.</p>:enrollments.slice(0,5).map(e=><div className="activity-row" key={e.id}><div className="activity-avatar">{e.name?.[0]||'P'}</div><div><strong>{e.name||'Unnamed'}</strong><span>{e.sportName||'No sport yet'} {'\u00B7'} {e.team||'Individual'}</span></div><span className={'status-badge '+e.status}>{e.status}</span></div>)}</div>
    <div className="admin-panel"><div className="admin-panel-title"><h2>Season snapshot</h2><Activity size={17}/></div><div className="snapshot-line"><span>Active events</span><strong>{stats?.events??0}</strong></div><div className="snapshot-line"><span>Available sports</span><strong>{stats?.sports??0}</strong></div><div className="snapshot-line"><span>Verified entries</span><strong>{stats?.verified??0}</strong></div><div className="snapshot-line"><span>Rejected payments</span><strong>{stats?.rejected??0}</strong></div><div className="snapshot-tip"><Flame size={17}/><span>Review payment proof promptly to keep teams moving.</span></div></div></div></>}

  {tab!=='Overview'&&<><div className="table-toolbar"><div className="search-box"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${tab.toLowerCase()}...`}/></div>{tab==='Payments'&&<div className="filter-chips"><span className="table-count">{rows.length} records</span></div>}</div>
    <div className="data-table-wrap"><table className="data-table"><thead><tr>{(tab==='Users'?['User','College','Joined','Actions']:tab==='Events'?['Event','Date','Venue','Status','Actions']:tab==='Sports'?['Sport','Entry fee','Team size','Slots / event','Actions']:['Participant','Sport / Team','Amount','UTR / Proof','Status','Actions']).map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
    {tab==='Users'&&rows.map(u=><tr key={u.id}><td><div className="table-person"><div className="activity-avatar">{u.name?.[0]}</div><div><strong>{u.name}</strong><span>{u.email}</span><button className="tiny-link" onClick={()=>{setForm({user:u});setModal('userDetail')}}>View enrollments ({u.enrollments??0})</button></div></div></td><td>{u.college}</td><td>{fmtDate(u.createdAt)}</td><td><button className="icon-btn danger" aria-label="Delete user" onClick={()=>remove('Users',u.id)}><Trash2 size={16}/></button></td></tr>)}
    {tab==='Events'&&rows.map(e=><tr key={e.id}><td><strong>{e.name}</strong><span className="table-sub">{e.desc}</span></td><td>{e.date}</td><td>{e.venue}</td><td><span className={'status-badge '+(e.status==='Registration open'?'verified':e.status==='Closed'?'rejected':'pending')}>{e.status}</span></td><td><button className="icon-btn danger" aria-label="Delete event" onClick={()=>remove('Events',e.id)}><Trash2 size={16}/></button></td></tr>)}
    {tab==='Sports'&&rows.map(s=><tr key={s.id}><td><div className="sport-table-name"><span>{s.icon}</span><div><strong>{s.name}</strong><small>{s.category}</small></div></div></td><td>{money(s.fee)}</td><td>{s.teamSize}</td><td>{s.slots}</td><td><button className="icon-btn danger" aria-label="Delete sport" onClick={()=>remove('Sports',s.id)}><Trash2 size={16}/></button></td></tr>)}
    {(tab==='Enrollments'||tab==='Payments')&&rows.map(e=><tr key={e.id}><td><div className="table-person"><div className="activity-avatar">{e.name?.[0]||'P'}</div><div><strong>{e.name||'Unnamed'}</strong><span>{e.email}</span></div></div></td><td><strong>{e.sportName||'\u2014'}</strong><span className="table-sub">{e.team||'Individual entry'}</span><button className="tiny-link" onClick={()=>{setForm({enrollment:e});setModal('enrollmentDetail')}}>View team & details</button></td><td>{money(e.fee)}</td><td>{e.utr||'\u2014'}{e.hasProof&&<button className="tiny-link" onClick={()=>viewProof(e)}>View screenshot</button>}</td><td><span className={'status-badge '+e.status}>{e.status}</span></td><td>{e.status==='pending'?<div className="row-actions"><button className="verify-btn" onClick={()=>verify(e,'verified')} title="Verify" aria-label="Verify payment"><Check size={15}/></button><button className="reject-btn" onClick={()=>verify(e,'rejected')} title="Reject" aria-label="Reject payment"><X size={15}/></button></div>:<button className="icon-btn danger" aria-label="Delete registration" onClick={()=>remove('Enrollments',e.id)}><Trash2 size={16}/></button>}</td></tr>)}
    </tbody></table>{rows.length===0&&<div className="table-empty">Nothing here yet. Add a record or change your search.</div>}</div></>}</div></main>

  {modal&&<div className="modal-backdrop" onClick={closeModal}><div className="admin-modal" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">ADMIN / MANAGEMENT</span><h2>{modal==='add'?`Add ${tab.slice(0,-1)}`:modal==='proof'?'Payment screenshot':modal==='userDetail'?'User details':'Enrollment details'}</h2></div><button className="icon-btn" aria-label="Close" onClick={closeModal}><X size={18}/></button></div>
    {modal==='add'&&<div className="modal-form">{Object.entries(form).map(([k,v])=><Field key={k} label={(LABELS[k]||k.replace(/([A-Z])/g,' $1')).toUpperCase()}>{k==='college'||k==='status'||k==='category'?<select value={v} onChange={e=>setForm({...form,[k]:e.target.value})}>{(k==='college'?COLLEGES:k==='status'?['Registration open','Coming soon','Closed']:['TEAM SPORT','RACKET SPORT','INDIVIDUAL']).map(x=><option key={x}>{x}</option>)}</select>:<input type={k==='date'?'date':k==='fee'||k==='slots'?'number':k==='password'?'password':'text'} min={k==='fee'||k==='slots'?0:undefined} autoComplete={k==='password'?'new-password':undefined} placeholder={k==='password'?'At least 8 characters':undefined} value={v} onChange={e=>setForm({...form,[k]:e.target.value})}/>}</Field>)}{formErr&&<div className="error-msg" role="alert" style={{gridColumn:'1/-1'}}><AlertCircle size={16}/>{formErr}</div>}<button className="btn btn-full" disabled={busy} onClick={add}>{busy?'Saving\u2026':'Create record'} <ArrowRight size={16}/></button></div>}
    {modal==='userDetail'&&<div className="detail-modal-body"><p><b>{form.user.name}</b> {'\u00B7'} {form.user.email}</p><p>{form.user.college}</p><h3>Enrollments</h3>{enrollments.filter(e=>e.userId===form.user.id).map(e=><div className="detail-line" key={e.id}>{e.sportName||'No sport yet'} {'\u00B7'} {e.team||'Individual'} <span className={'status-badge '+e.status}>{e.status}</span></div>)}{enrollments.every(e=>e.userId!==form.user.id)&&<p className="muted">No enrollments yet.</p>}</div>}
    {modal==='enrollmentDetail'&&<div className="detail-modal-body"><p><b>{form.enrollment.name}</b> {'\u00B7'} {form.enrollment.email} {'\u00B7'} {form.enrollment.phone||'No phone'}</p><p>{form.enrollment.college}</p><p>Event: {form.enrollment.eventName}</p><p>Sport: {form.enrollment.sportName||'\u2014'} {'\u00B7'} Team: {form.enrollment.team||'Individual'}</p><p>Entry fee: {money(form.enrollment.fee)} {'\u00B7'} UTR: {form.enrollment.utr||'\u2014'}</p><h3>Team members</h3>{form.enrollment.members.map((m,i)=><div className="detail-line" key={i}>{m.name||'Unnamed'} <span>{m.phone||'No phone'}</span></div>)}</div>}
    {modal==='proof'&&<div className="proof-image">{form.image?<img src={form.image} alt="Uploaded payment proof"/>:formErr?<div className="error-msg"><AlertCircle size={16}/>{formErr}</div>:<p className="muted">Loading{'\u2026'}</p>}</div>}
  </div></div>}</div>;
}
