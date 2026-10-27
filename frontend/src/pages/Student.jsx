import React,{useEffect,useState} from 'react';
import {Link,useNavigate,useParams,useSearchParams} from 'react-router-dom';
import {motion,AnimatePresence} from 'framer-motion';
import {QRCodeSVG} from 'qrcode.react';
import {Activity,ArrowUpRight,ArrowRight,Check,Clock,Download,Flame,Plus,ShieldCheck,Trash2,Trophy,CalendarDays,Upload,CheckCircle2,AlertCircle} from 'lucide-react';
import {api} from '../api.js';
import {COLLEGES,Field,PageHeading,money,shortId,teamRules,rangeText,PHONE_RE,EMAIL_RE} from '../common.jsx';

// Replace with the institution's verified merchant UPI ID before launch (set in .env).
const UPI_VPA=import.meta.env.VITE_UPI_VPA;
const UPI_NAME=import.meta.env.VITE_UPI_NAME||'Mangalmay Sports';

const OPEN='Registration open';
const regLink=e=>`/register/${e.eventId}?e=${e.id}`;
const Notice=({title,text,to,cta})=><div className="empty-state"><h3>{title}</h3><p>{text}</p><Link className="btn" to={to}>{cta} <ArrowRight size={16}/></Link></div>;

/* ---------------------------------------------------------------- Events */
export function Events({events,mine}){
  const drafts=mine.filter(e=>e.status==='draft');
  const draft=drafts[0];
  const [filter,setFilter]=useState('All');
  return <>
    <PageHeading eyebrow="YOUR NEXT CHAPTER" title={<>Find your <span className="lime">arena.</span></>} subtitle="Pick an event, bring your people, and make it count." action={<div className="season-pill"><CalendarDays size={16}/> SEASON 2026</div>}/>
    {draft&&<Link className="continue-banner" to={regLink(draft)}><div className="continue-icon"><Clock/></div><div><strong>Continue registration</strong><span>Your {draft.sportName||'registration'} entry is saved. Pick up right where you left off.</span></div><ArrowRight/></Link>}
    <div className="filter-row"><div className="eyebrow">FEATURED EVENTS <span className="count-tag">{events.length.toString().padStart(2,'0')}</span></div><div className="filter-chips">{['All',OPEN,'Coming soon'].map(f=><button className={filter===f?'selected':''} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div></div>
    <div className="event-list">{events.filter(e=>filter==='All'||e.status===filter).map((e,i)=>{
      const open=e.status===OPEN;const d=drafts.find(x=>x.eventId===e.id);
      return <motion.article initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.07}} className="event-card" key={e.id}>
        <div className="event-art" style={{'--art':i%2?'#a58bff':'#c7ff4d'}}><div className="event-art-ring"></div><span>MGI<br/>SPORTS</span><b>{String(i+1).padStart(2,'0')}</b></div>
        <div className="event-info"><div className="event-meta"><span className="status-open"><i/>{e.status}</span><span>{e.date}</span></div><h2>{e.name}</h2><p>{e.desc}</p><div className="event-venue"><Activity size={15}/>{e.venue}</div></div>
        <div className="event-cta">{open?<Link to={d?regLink(d):`/register/${e.id}`} className="btn">{d?'Continue':'Register now'} <ArrowUpRight size={16}/></Link>:<button className="btn" disabled>{e.status}</button>}<span>{open?'Slots are limited per sport':'Registration not open yet'}</span></div>
      </motion.article>;})}
      {events.length===0&&<div className="empty-state"><h3>No events yet</h3><p>Check back soon.</p></div>}
    </div>
    <div className="section-note"><Flame size={16}/> <span>Good teams are built before game day. Get your squad ready.</span></div>
  </>;
}

/* ---------------------------------------------------------- Registration */
export function Registration({events,mine,reloadMine,session}){
  const {eventId}=useParams();
  const [sp]=useSearchParams();
  const nav=useNavigate();
  const event=events.find(e=>e.id===eventId);
  const draftId=sp.get('e');
  const existing=draftId?mine.find(e=>e.id===draftId&&e.eventId===eventId&&(e.status==='draft'||e.status==='rejected')):null;

  const [sports,setSports]=useState([]);
  const [id,setId]=useState(existing?.id||null);
  const [step,setStep]=useState(existing?.step||1);
  const [name,setName]=useState(existing?.name||session.name||''),[email,setEmail]=useState(existing?.email||session.email||''),[phone,setPhone]=useState(existing?.phone||''),[college,setCollege]=useState(existing?.college||session.college||COLLEGES[0]);
  const [sportId,setSportId]=useState(existing?.sportId||''),[team,setTeam]=useState(existing?.team||'');
  const [members,setMembers]=useState(existing?.members?.length?existing.members:[{name:session.name||'',phone:''}]);
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);

  useEffect(()=>{api.sports(eventId).then(setSports).catch(e=>setError(e.message))},[eventId]);

  if(!event)return <Notice title="Event not found" text="This event doesn't exist or was removed." to="/events" cta="Browse events"/>;
  if(draftId&&!existing)return <Notice title="This registration can't be edited" text="It has already been submitted. You can view it from your account." to="/account" cta="Go to account"/>;
  if(event.status!==OPEN)return <Notice title="Registration is not open" text={`${event.name} is currently "${event.status}".`} to="/events" cta="Back to events"/>;

  const sport=sports.find(s=>s.id===sportId);
  const rules=teamRules(sport?.teamSize);

  const validate=n=>{
    if(n===1){
      if(!name.trim())return 'Enter your full name.';
      if(!EMAIL_RE.test(email.trim()))return 'Enter a valid email address.';
      if(!PHONE_RE.test(phone.trim()))return 'Enter a valid 10-digit mobile number.';
      if(!college)return 'Choose your college.';
    }
    if(n===2){
      if(!sport)return 'Please select a sport.';
      if(sport.remaining<=0)return `${sport.name} is fully booked.`;
    }
    if(n===3){
      if(!sport)return 'Sports are still loading. Please try again in a moment.';
      if(rules.teamNameRequired&&!team.trim())return 'Give your team a name.';
      if(members.length<rules.min||members.length>rules.max)return `${sport.name} needs ${rangeText(rules)} team members (you have ${members.length}).`;
      const bad=members.findIndex(m=>!m.name.trim());
      if(bad>=0)return `Enter a name for member ${bad+1}.`;
      const badPhone=members.findIndex(m=>m.phone.trim()&&!PHONE_RE.test(m.phone.trim()));
      if(badPhone>=0)return `Member ${badPhone+1} has an invalid phone number.`;
    }
    return '';
  };

  const save=async toStep=>{
    const d=await api.saveDraft({id,eventId,sportId:sportId||null,name,email,phone,college,team,members,step:toStep});
    setId(d.id);await reloadMine();return d;
  };
  const next=async e=>{
    e?.preventDefault();setError('');
    const msg=validate(step);if(msg){setError(msg);return}
    setBusy(true);
    try{const d=await save(Math.min(3,step+1));if(step===3)nav(`/payment?e=${d.id}`);else setStep(step+1)}
    catch(err){setError(err.message)}finally{setBusy(false)}
  };
  const back=async()=>{
    setError('');setBusy(true);
    try{await save(step-1);setStep(step-1)}catch(err){setError(err.message)}finally{setBusy(false)}
  };
  const setMember=(i,patch)=>setMembers(members.map((x,j)=>j===i?{...x,...patch}:x));

  return <>
    <PageHeading eyebrow="EVENT REGISTRATION" title={<>Build your <span className="lime">line-up.</span></>} subtitle={event.name}/>
    <div className="steps"><div className="steps-line"><span style={{width:`${(step-1)*50}%`}}/></div>{['Your details','Choose sport','Review & pay'].map((s,i)=><div className={'step '+(step===i+1?'current':step>i+1?'done':'')} key={s}><span>{step>i+1?<Check size={14}/>:`0${i+1}`}</span>{s}</div>)}</div>
    <form className="registration-panel" onSubmit={next} noValidate>
      <div className="reg-panel-head"><div><span className="eyebrow">STEP 0{step} / 03</span><h2>{['Confirm your details','Pick your sport','Your team, your moment'][step-1]}</h2><p>{['Make sure we have the right details for your entry.','Choose the competition you want to enter.','Add your team details before moving to payment.'][step-1]}</p></div><span className="saved-tag"><CheckCircle2 size={14}/> Auto-save on</span></div>
      {step===1&&<div className="reg-form-grid">
        <Field label="FULL NAME"><input value={name} maxLength={100} onChange={e=>setName(e.target.value)}/></Field>
        <Field label="EMAIL ADDRESS"><input type="email" value={email} maxLength={150} onChange={e=>setEmail(e.target.value)}/></Field>
        <Field label="PHONE NUMBER"><input value={phone} maxLength={10} inputMode="numeric" onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="10-digit mobile number"/></Field>
        <Field label="COLLEGE / INSTITUTION"><select value={college} onChange={e=>setCollege(e.target.value)}>{COLLEGES.map(c=><option key={c}>{c}</option>)}</select></Field>
      </div>}
      {step===2&&<div className="sport-select-grid">{sports.map(s=>{const full=s.remaining<=0;return <button type="button" key={s.id} disabled={full} onClick={()=>setSportId(s.id)} className={'sport-option '+(sportId===s.id?'picked':'')}><span className="option-emoji">{s.icon}</span><span className="option-info"><strong>{s.name}</strong><small>{s.teamSize} {'\u00B7'} {full?'Fully booked':`${s.remaining} of ${s.slots} slots left`}</small></span><b>{money(s.fee)}</b><span className="option-check">{sportId===s.id?<Check size={15}/>:''}</span></button>})}</div>}
      {step===3&&<>
        <div className="selected-summary"><span className="option-emoji">{sport?.icon}</span><div><strong>{sport?.name}</strong><small>{event.name} {'\u00B7'} {sport?.teamSize}</small></div><b>{money(sport?.fee)}</b></div>
        <Field label={rules.teamNameRequired?'TEAM NAME':'TEAM NAME (OPTIONAL)'}><input value={team} maxLength={100} onChange={e=>setTeam(e.target.value)} placeholder="Give your squad a name"/></Field>
        <div className="members-head"><div><strong>Team members</strong><span>{sport?`${sport.name} needs ${rangeText(rules)} ${rules.max===1?'name':'names'}. Phone is optional.`:'Add names and contact numbers for your squad.'}</span></div><button className="btn btn-outline btn-sm" type="button" disabled={members.length>=rules.max} onClick={()=>setMembers([...members,{name:'',phone:''}])}><Plus size={15}/> Add member</button></div>
        <div className="member-list">{members.map((m,i)=><div className="member-row" key={i}><span className="member-number">{String(i+1).padStart(2,'0')}</span><input aria-label="Member name" placeholder="Full name" maxLength={100} value={m.name} onChange={e=>setMember(i,{name:e.target.value})}/><input aria-label="Member phone" placeholder="Phone number" maxLength={10} inputMode="numeric" value={m.phone} onChange={e=>setMember(i,{phone:e.target.value.replace(/\D/g,'')})}/><button type="button" className="icon-btn" aria-label="Remove member" onClick={()=>setMembers(members.filter((_,j)=>j!==i))} disabled={members.length===1}><Trash2 size={16}/></button></div>)}</div>
        <div className="registration-total"><span>Entry fee {'\u00B7'} {sport?.name}</span><strong>{money(sport?.fee)}</strong></div>
      </>}
      {error&&<div className="error-msg" role="alert" style={{marginTop:18}}><AlertCircle size={16}/>{error}</div>}
      <div className="reg-actions">{step>1&&<button type="button" className="btn btn-outline" disabled={busy} onClick={back}>Back</button>}<button className="btn" type="submit" disabled={busy}>{busy?'Saving\u2026':step===3?'Continue to payment':'Continue'} <ArrowRight size={16}/></button></div>
    </form>
    <p className="privacy-note"><ShieldCheck size={15}/> Your details are used only to manage your sports registration.</p>
  </>;
}

/* --------------------------------------------------------------- Payment */
export function Payment({mine,reloadMine}){
  const [sp]=useSearchParams();
  const nav=useNavigate();
  const id=sp.get('e');
  const enrollment=mine.find(e=>e.id===id)||(!id?mine.find(e=>e.status==='draft'&&e.sportId):null);
  const [utr,setUtr]=useState(''),[file,setFile]=useState(null),[sent,setSent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');

  const brand=<div className="payment-topline"><Link to="/" className="brand"><span className="brand-mark">M</span><span>MANGALMAY<span className="brand-sub">SPORTS DEPARTMENT</span></span></Link><span className="secure-label"><ShieldCheck size={15}/> PAYMENT</span></div>;
  if(!enrollment)return <div className="payment-standalone">{brand}<div className="payment-card"><h2>No registration to pay for</h2><Link to="/events" className="btn">Browse events</Link></div></div>;
  if(enrollment.status!=='draft'&&!sent)return <div className="payment-standalone">{brand}<div className="payment-card"><h2>Already submitted</h2><p className="muted" style={{marginBottom:18}}>Payment proof for this registration is already {enrollment.status==='verified'?'verified':'under review'}.</p><Link to={`/receipt/${enrollment.id}`} className="btn">View receipt</Link></div></div>;

  const fee=enrollment.fee;
  const upi=`upi://pay?pa=${UPI_VPA}&pn=${encodeURIComponent(UPI_NAME)}&am=${fee}&cu=INR&tn=${encodeURIComponent(enrollment.team||enrollment.sportName||'Sports registration')}`;

  const submit=async e=>{
    e.preventDefault();setError('');
    if(!/^\d{12}$/.test(utr.trim())){setError('Enter the 12-digit UTR from your payment app.');return}
    if(!file){setError('Upload the payment screenshot.');return}
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)){setError('Only PNG, JPG or WEBP images are allowed.');return}
    if(file.size>3*1024*1024){setError('Screenshot must be under 3 MB.');return}
    setBusy(true);
    try{await api.pay(enrollment.id,utr.trim(),file);await reloadMine();setSent(true)}
    catch(err){setError(err.message)}finally{setBusy(false)}
  };

  return <div className="payment-standalone">{brand}
    <div className="payment-card"><AnimatePresence mode="wait">{sent?
      <motion.div key="success" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="payment-success"><div className="success-mark"><Check size={30}/></div><h2>Payment submitted.</h2><p>Your entry is in the verification queue.</p><button className="btn" onClick={()=>nav(`/receipt/${enrollment.id}`)}>View receipt <ArrowRight size={16}/></button></motion.div>:
      <motion.div key="pay" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
        <div className="qr-block"><div className="qr-frame"><QRCodeSVG value={upi} size={230} level="H" includeMargin bgColor="#ffffff" fgColor="#0a0b12"/></div><div className="amount-label">AMOUNT TO PAY</div><div className="amount-value">{money(fee)}</div></div>
        <form onSubmit={submit} className="payment-proof" noValidate>
          <Field label="UTR / TRANSACTION ID"><input value={utr} maxLength={12} inputMode="numeric" onChange={e=>setUtr(e.target.value.replace(/\D/g,''))} placeholder="Enter 12-digit UTR"/></Field>
          <label className="upload-control"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/><span className="upload-icon"><Upload size={17}/></span><span><strong>{file?file.name:'Upload payment screenshot'}</strong><small>{file?'Selected \u00B7 click to change':'PNG, JPG or WEBP \u00B7 max 3 MB'}</small></span><span className="upload-choose">{file?'CHANGE':'BROWSE'}</span></label>
          {error&&<div className="error-msg" role="alert"><AlertCircle size={16}/>{error}</div>}
          <button className="btn btn-full" type="submit" disabled={busy}>{busy?'Submitting\u2026':'Submit payment proof'} <ArrowRight size={16}/></button>
        </form>
      </motion.div>}</AnimatePresence></div>
    <div className="payment-bottom"><span>UPI {'\u00B7'} INR</span><span>MANGALMAY SPORTS 2026</span></div></div>;
}

/* --------------------------------------------------------------- Receipt */
export function Receipt({mine}){
  const {id}=useParams();
  const e=mine.find(x=>x.id===id);
  if(!e)return <div className="empty-state">Receipt not found. <Link to="/account">Back to account</Link></div>;

  const download=async()=>{
    const {default:jsPDF}=await import('jspdf');   // loaded on demand to keep the main bundle small
    const pdf=new jsPDF();
    pdf.setFillColor(10,11,18);pdf.rect(0,0,210,297,'F');
    pdf.setTextColor(199,255,77);pdf.setFontSize(12);pdf.text('MANGALMAY / SPORTS DEPARTMENT',20,24);
    pdf.setTextColor(255,255,255);pdf.setFontSize(28);pdf.text('REGISTRATION RECEIPT',20,48);
    pdf.setDrawColor(199,255,77);pdf.line(20,57,190,57);pdf.setFontSize(12);
    const rows=[['Registration ID',shortId(e.id)],['Participant',e.name||'-'],['College',e.college||'-'],['Event',e.eventName||'-'],['Sport',e.sportName||'-'],['Team',e.team||'Individual entry'],['Entry fee','Rs. '+Number(e.fee||0).toLocaleString('en-IN')],['Payment status',e.status.toUpperCase()],['UTR',e.utr||'Pending']];
    rows.forEach((r,i)=>{pdf.setTextColor(166,172,190);pdf.text(r[0].toUpperCase(),20,77+i*15);pdf.setTextColor(255,255,255);pdf.text(String(r[1]).slice(0,75),80,77+i*15)});
    pdf.setTextColor(166,172,190);pdf.setFontSize(9);
    pdf.text(e.status==='verified'?'Payment verified by the sports department.':'This receipt is not final until the payment is verified.',20,250);
    pdf.setTextColor(199,255,77);pdf.setFontSize(10);pdf.text('Play fair. Play loud. \u00B7 Mangalmay Group of Institutions',20,260);
    pdf.save(`Mangalmay-Receipt-${shortId(e.id)}.pdf`);
  };

  return <><PageHeading eyebrow="YOU'RE IN THE GAME" title={<>Your entry. <span className="lime">On record.</span></>} subtitle="Download a copy of your registration receipt."/>
    <div className="receipt-card"><div className="receipt-head"><div className="success-mark"><Check size={24}/></div><div><div className="eyebrow">REGISTRATION RECEIPT</div><h2>{e.sportName}</h2><p>{e.eventName}</p></div><span className={'status-badge '+e.status}>{e.status}</span></div>
      <div className="receipt-grid">{[['PARTICIPANT',e.name],['COLLEGE',e.college],['TEAM',e.team||'Individual entry'],['ENTRY FEE',money(e.fee)],['TRANSACTION ID',e.utr||'Awaiting payment'],['REGISTRATION ID',shortId(e.id)]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div>
      {e.status==='pending'&&<p className="muted" style={{marginBottom:18}}>Your payment is waiting for verification. You'll see the status change here once the sports department reviews it.</p>}
      {e.status==='rejected'&&<p className="error-msg" style={{marginBottom:18}}><AlertCircle size={16}/> This payment was rejected. Open your account to correct the details and resubmit.</p>}
      <button className="btn" onClick={download}><Download size={16}/> Download PDF receipt</button></div></>;
}

/* --------------------------------------------------------------- Account */
export function Account({mine,sports,session}){
  const iconOf=e=>sports.find(s=>s.id===e.sportId)?.icon||'\uD83C\uDFC6';
  return <><PageHeading eyebrow="PLAYER PROFILE" title={<>Your game. <span className="lime">Your story.</span></>} subtitle="Your details and every entry, all in one place."/>
    <div className="account-profile"><div className="account-avatar">{session.name?.[0]||'P'}</div><div><h2>{session.name}</h2><p>{session.email}</p><span>{session.college}</span></div><span className="verified-chip"><ShieldCheck size={14}/> PLAYER</span></div>
    <div className="account-section-head"><h2>Your registrations <span>{String(mine.length).padStart(2,'0')}</span></h2><Link to="/events" className="text-link">Find an event <ArrowRight size={15}/></Link></div>
    {mine.length===0?<div className="empty-state"><div className="empty-icon"><Trophy size={26}/></div><h3>No entries. Yet.</h3><p>Your next big moment starts with one registration.</p><Link className="btn" to="/events">Explore events <ArrowRight size={16}/></Link></div>:
    <div className="account-enrollments">{mine.map(e=><div className="account-enrollment" key={e.id}><div className="mini-sport-icon">{iconOf(e)}</div><div className="account-enroll-info"><strong>{e.sportName||'Sport not chosen yet'}</strong><span>{e.eventName} {'\u00B7'} {e.team||'Individual entry'}</span></div><span className={'status-badge '+e.status}>{e.status}</span>{e.status==='draft'||e.status==='rejected'?<Link className="text-link" to={regLink(e)}>{e.status==='draft'?'Continue':'Resubmit'} <ArrowRight size={14}/></Link>:<Link className="icon-btn" to={`/receipt/${e.id}`} title="View receipt"><ArrowUpRight size={17}/></Link>}</div>)}</div>}
  </>;
}
