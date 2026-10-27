import React,{useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {ArrowRight,UserRound,ShieldCheck,AlertCircle} from 'lucide-react';
import {api} from '../api.js';
import {COLLEGES,Field} from '../common.jsx';

export default function Auth({mode,login}){
  const nav=useNavigate();
  const isSignup=mode==='signup';
  const [role,setRole]=useState('user'),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[college,setCollege]=useState(COLLEGES[0]),[error,setError]=useState(''),[busy,setBusy]=useState(false);

  const submit=async e=>{
    e.preventDefault();setError('');setBusy(true);
    try{
      const res=isSignup?await api.signup({name:name.trim(),email:email.trim(),password,college}):await api.login({email:email.trim(),password});
      const isAdmin=res.user.role==='admin';
      if(!isSignup&&(role==='admin')!==isAdmin){setError(isAdmin?'This is an admin account. Use the Admin tab.':'This account is not an administrator.');return}
      login(res);
      nav(isAdmin?'/admin':'/events');
    }catch(err){setError(err.message)}
    finally{setBusy(false)}
  };

  return <div className="auth-page"><Link to="/" className="brand auth-brand"><span className="brand-mark">M</span><span>MANGALMAY<span className="brand-sub">SPORTS DEPARTMENT</span></span></Link><div className="auth-glow"></div><motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="auth-card"><div className="eyebrow">{isSignup?'YOUR SEASON STARTS HERE':'WELCOME BACK'}</div><h1>{isSignup?'GET IN THE GAME.':'READY TO PLAY?'}</h1><p>{isSignup?'Create your profile and represent your college.':'Sign in to manage your registrations and teams.'}</p>
    {!isSignup&&<div className="role-toggle"><button className={role==='user'?'active':''} onClick={()=>setRole('user')} type="button"><UserRound size={16}/> Student</button><button className={role==='admin'?'active':''} onClick={()=>setRole('admin')} type="button"><ShieldCheck size={16}/> Admin</button></div>}
    <form onSubmit={submit} className="form-stack">
      {isSignup&&<Field label="FULL NAME"><input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></Field>}
      <Field label="EMAIL ADDRESS"><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@college.edu" autoComplete="email"/></Field>
      <Field label="PASSWORD"><input type="password" required minLength={isSignup?8:1} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)} placeholder={isSignup?'At least 8 characters':'Enter password'} autoComplete={isSignup?'new-password':'current-password'}/></Field>
      {isSignup&&<Field label="COLLEGE / INSTITUTION"><select value={college} onChange={e=>setCollege(e.target.value)}>{COLLEGES.map(c=><option key={c}>{c}</option>)}</select></Field>}
      {error&&<div className="error-msg" role="alert"><AlertCircle size={16}/>{error}</div>}
      <button className="btn btn-full" type="submit" disabled={busy}>{busy?'Please wait\u2026':!isSignup&&role==='admin'?'Enter admin dashboard':isSignup?'Create student account':'Sign in'} <ArrowRight size={17}/></button>
    </form>
    <div className="auth-switch">{isSignup?'Already registered?':'New to Mangalmay Sports?'} <Link to={isSignup?'/login':'/signup'}>{isSignup?'Log in':'Create account'}</Link></div></motion.div><div className="auth-side-note">PLAY BEYOND <span>{'\u2733'}</span> GREATER NOIDA</div></div>;
}
