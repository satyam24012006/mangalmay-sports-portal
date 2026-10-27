import React,{useCallback,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
import {api,getToken,setToken,setUnauthorizedHandler} from './api.js';
import {Loading,UserLayout} from './common.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Admin from './pages/Admin.jsx';
import {Events,Registration,Payment,Receipt,Account} from './pages/Student.jsx';
import './style.css';

function App(){
  const [session,setSession]=useState(null),[booting,setBooting]=useState(true);
  const [events,setEvents]=useState([]),[sports,setSports]=useState([]);
  const [mine,setMine]=useState([]),[mineReady,setMineReady]=useState(false);

  const logout=useCallback(()=>{setToken(null);setSession(null);setMine([]);setMineReady(false)},[]);
  useEffect(()=>{setUnauthorizedHandler(logout)},[logout]);

  const reloadCatalog=useCallback(async()=>{try{const [e,s]=await Promise.all([api.events(),api.sports()]);setEvents(e);setSports(s)}catch{/* shown per page */}},[]);
  const reloadMine=useCallback(async()=>{try{setMine(await api.myEnrollments())}catch{/* keep old list */}setMineReady(true)},[]);

  useEffect(()=>{(async()=>{
    await reloadCatalog();
    if(getToken()){try{setSession(await api.me())}catch{setToken(null)}}
    setBooting(false);
  })()},[reloadCatalog]);
  useEffect(()=>{if(session?.role==='user')reloadMine()},[session,reloadMine]);

  const login=({token,user})=>{setToken(token);setSession(user)};
  if(booting)return <Loading/>;

  const student=el=>session?.role==='user'?(mineReady?el:<Loading/>):<Navigate to="/login" replace/>;
  const layout=el=>student(<UserLayout session={session} logout={logout}>{el}</UserLayout>);

  return <BrowserRouter><div className="app-shell"><Routes>
    <Route path="/" element={<Landing session={session} sports={sports}/>}/>
    <Route path="/login" element={<Auth mode="login" login={login}/>}/>
    <Route path="/signup" element={<Auth mode="signup" login={login}/>}/>
    <Route path="/events" element={layout(<Events events={events} mine={mine}/>)}/>
    <Route path="/register/:eventId" element={layout(<Registration events={events} mine={mine} reloadMine={reloadMine} session={session}/>)}/>
    <Route path="/payment" element={student(<Payment mine={mine} reloadMine={reloadMine}/>)}/>
    <Route path="/receipt/:id" element={layout(<Receipt mine={mine}/>)}/>
    <Route path="/account" element={layout(<Account mine={mine} sports={sports} session={session}/>)}/>
    <Route path="/admin" element={session?.role==='admin'?<Admin events={events} sports={sports} reloadCatalog={reloadCatalog} logout={logout}/>:<Navigate to="/login" replace/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></div></BrowserRouter>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
