"use client";
// @ts-nocheck

import * as React from 'react';
import ScoutTemplate from './ScoutTemplate';
import SidebarPanel from './SidebarPanel';
import { supabase } from '@/lib/supabase';
import ImportVocabularyModal from './ImportVocabularyModal';
import SentenceBuildExercise from './SentenceBuildExercise';
import { X } from 'lucide-react';

const FOLDER_COLORS = [
  { color: '#E08A2C', deep: '#BE6F1B' }, // Orange
  { color: '#3A82F6', deep: '#2563EB' }, // Blue
  { color: '#10B981', deep: '#059669' }, // Green
  { color: '#EC4899', deep: '#DB2777' }, // Pink
  { color: '#8A5FC6', deep: '#6E45A4' }, // Purple
];

const SET_VISUAL = [
  { icon:'💻', color:'#2E9D7E', deep:'#24795F', desc:'AI, tự động hóa và xu hướng công nghệ số.' },
  { icon:'🌿', color:'#E08A2C', deep:'#BE6F1B', desc:'Biến đổi khí hậu, sinh thái và phát triển bền vững.' },
  { icon:'👥', color:'#C95F50', deep:'#A8483B', desc:'Cộng đồng, bản sắc và các vấn đề xã hội.' },
  { icon:'🏺', color:'#C98A2C', deep:'#A06A14', desc:'Văn minh, di sản và khám phá khảo cổ học.' },
  { icon:'📊', color:'#D45F9E', deep:'#B0457F', desc:'Thị trường, thương mại và tài chính.' },
  { icon:'🩺', color:'#4E6CD0', deep:'#3A53AE', desc:'Y học, dịch tễ và lối sống lành mạnh.' },
  { icon:'🎓', color:'#8A5FC6', deep:'#6E45A4', desc:'Học tập, nhận thức và hành vi con người.' },
  { icon:'🏛️', color:'#3E8F8F', deep:'#2C6E6E', desc:'Quy hoạch, xây dựng và không gian sống.' },
  { icon:'📣', color:'#D4607A', deep:'#B0455F', desc:'Báo chí, mạng xã hội và dư luận.' },
  { icon:'🌐', color:'#5566C9', deep:'#3F4EA8', desc:'Toàn cầu hóa, di cư và hợp tác quốc tế.' },
  { icon:'🎨', color:'#2E9DB8', deep:'#227A90', desc:'Âm nhạc, điện ảnh và văn hóa đại chúng.' },
];

class Component extends React.Component<any, any> {
  constructor(props){
    super(props);
    this.deck = [];
    this.wordSets = [
      {id:'personal', kicker:'Cá nhân', label:'Bộ từ của bản thân', count:0, icon:'✏️', color:'#5D6B2D', deep:'#46531F', desc:'Tự thêm và ôn tập từ vựng của riêng bạn.', rating:'—', mastery:0, personal:true}
    ];
    this.setLabels = {'personal': 'Bộ từ của bản thân'};
    this.cardPatterns = [
      'radial-gradient(rgba(255,255,255,.16) 2px, transparent 2.3px) 0 0/22px 22px',
      'repeating-linear-gradient(45deg, rgba(255,255,255,.10) 0 9px, transparent 9px 22px)',
      'repeating-radial-gradient(circle at 118% 115%, transparent 0 16px, rgba(255,255,255,.12) 16px 19px)',
      'linear-gradient(rgba(255,255,255,.10) 1px,transparent 1px) 0 0/24px 24px, linear-gradient(90deg,rgba(255,255,255,.10) 1px,transparent 1px) 0 0/24px 24px',
      'repeating-linear-gradient(90deg, rgba(255,255,255,.11) 0 2px, transparent 2px 15px)',
      'repeating-linear-gradient(45deg, rgba(255,255,255,.08) 0 2px, transparent 2px 16px), repeating-linear-gradient(-45deg, rgba(255,255,255,.08) 0 2px, transparent 2px 16px)',
      'repeating-linear-gradient(0deg, rgba(255,255,255,.10) 0 8px, transparent 8px 22px)',
      'radial-gradient(rgba(255,255,255,.13) 3px, transparent 3.4px) 0 0/30px 30px',
      'repeating-linear-gradient(60deg, rgba(255,255,255,.10) 0 8px, transparent 8px 20px)',
      'repeating-radial-gradient(circle at 50% 120%, transparent 0 18px, rgba(255,255,255,.10) 18px 21px)',
      'radial-gradient(rgba(255,255,255,.14) 1.5px, transparent 1.7px) 0 0/16px 16px',
      'repeating-linear-gradient(135deg, rgba(255,255,255,.10) 0 8px, transparent 8px 20px)'
    ];
    // personalFolders now lives in state and is loaded from API
    this.state = {
      vocabSets: [], vocabSetsLoading: true,
      index:0, flipped:false,
      starred:{0:true,3:true,7:true},
      seen:{0:true},
      autoPlay:false, showStats:false, dark:false, navOpen:true,
      confetti:false,
      practice:null, mistakes:{},
      view:this.props.initialView || 'dashboard', targetBand:'7.0', bandMenuOpen:false, examDateStr:'2027-06-28',
      datePickerOpen:false, pickerYM:null,
      known:[], unknown:[], reviewList:[], focus:null, focusPos:0, knownTab:null, setMenuOpen:false, currentSet:'0', listKind:'known',
      srsData:{}, personalFolders:[], importModalOpen: false, dashData: null as any, statsData: null as any,
      activePanel: null as (null | 'profile' | 'avatar' | 'password'), panelLoading: false, panelError: '', panelSuccess: '', avatarUrlOverride: '',
      createFolderOpen: false, createFolderName: '', createFolderLoading: false, createFolderError: '',
      activeFolderId: null as (null|string), activeFolderName: '', activeFolderColorIdx: 0,
      folderWords: [] as any[], folderWordsLoading: false,
      addWordModalOpen: false, addWordInput: '', addWordResults: [] as any[], addWordFetchLoading: false, addWordSaveLoading: false, addWordError: '', duplicatePrompt: null as { word: string, resolve: (val: boolean) => void } | null,
      renameFolderModalOpen: false, renameFolderInput: '', renameFolderLoading: false,
      tidiansActive: false,
      tidiansSourceIdx: [] as number[],
      tidiansSelectionOpen: false,
      tidiansCandidates: [] as number[],
      profileName: '', profilePhone: '', profileBio: '',
      profileInAppReminders: true, profileEmailReminders: true, profileStreakWarning: true,
      profileLoading: false, profileError: '', profileSuccess: '',

      roadmap: null,
      roadmapLoading: true,
      roadmapActionLoading: false,
      roadmapCurrentBand: 5.0,
      roadmapTargetBand: 6.5,
      roadmapDailyHours: 2.0,
      roadmapTargetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      roadmapFocusSkills: ["Listening", "Reading", "Writing", "Speaking"],
      roadmapIsGenerating: false,
      roadmapGenerationStep: 0,
      roadmapGenerationProgress: 0,
      roadmapActivePhaseTab: "phase_1",
      roadmapIsEditingGoals: false,
      dailyTasks: [],
      dailyTasksLoading: true,
      dailyTasksError: null,
      dailyTasksCompletingId: null
    };
    // Mây 3D trôi quanh dashboard
    this.dashClouds = [
      {top:'4%',  left:'2%',  w:'150px', h:'78px', op:'.95', dur:'30s', delay:'0s'},
      {top:'14%', left:'46%', w:'120px', h:'62px', op:'.85', dur:'38s', delay:'-6s'},
      {top:'3%',  left:'74%', w:'170px', h:'88px', op:'.9',  dur:'34s', delay:'-12s'},
      {top:'40%', left:'-3%', w:'130px', h:'66px', op:'.8',  dur:'44s', delay:'-4s'},
      {top:'52%', left:'58%', w:'140px', h:'72px', op:'.85', dur:'40s', delay:'-18s'},
      {top:'68%', left:'24%', w:'110px', h:'58px', op:'.78', dur:'48s', delay:'-9s'},
      {top:'78%', left:'80%', w:'128px', h:'66px', op:'.82', dur:'36s', delay:'-22s'},
      {top:'30%', left:'30%', w:'96px',  h:'52px', op:'.7',  dur:'52s', delay:'-15s'}
    ];
    // Heatmap removed, dynamically computed in _dashboardVals

    // Sao lung linh cho chế độ ban đêm
    this.cardStars = Array.from({length:22}).map((_,k)=>({
      top:(5+Math.random()*80).toFixed(1)+'%',
      left:(4+Math.random()*92).toFixed(1)+'%',
      size:(k%4===0?13+Math.random()*7:6+Math.random()*7).toFixed(1)+'px',
      delay:(Math.random()*2.6).toFixed(2)+'s',
      dur:(1.5+Math.random()*1.8).toFixed(2)+'s'
    }));
    // Thống kê: số từ thêm vào / đã học / cần ôn theo ngày
    this.stats = [
      {day:'T2', added:6, learned:4, review:2},
      {day:'T3', added:5, learned:3, review:2},
      {day:'T4', added:9, learned:7, review:2},
      {day:'T5', added:8, learned:5, review:3},
      {day:'T6', added:11, learned:8, review:3},
      {day:'T7', added:7, learned:6, review:1},
      {day:'CN', added:10, learned:7, review:3}
    ];
  }
  _hoverIn = (e: any) => {
    const el = e.target.closest('[data-hover]');
    if (el) {
      if (!el.dataset.origStyle) el.dataset.origStyle = el.style.cssText;
      el.style.cssText += ';' + el.getAttribute('data-hover');
    }
  };

  _hoverOut = (e: any) => {
    const el = e.target.closest('[data-hover]');
    if (el && el.dataset.origStyle !== undefined) {
      el.style.cssText = el.dataset.origStyle;
    }
  };

  async _fetchDashboard() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : { 'x-mock-user-id': 'usr_2' };
      const res = await fetch('/api/student/dashboard', { headers });
      if (!res.ok) return;
      const d = await res.json();
      this.setState({ dashData: d });
    } catch(e) { console.error(e); }
  }

  async _fetchStats() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : { 'x-mock-user-id': 'usr_2' };
      const res = await fetch('/api/vocab-reviews/stats', { headers });
      if (!res.ok) return;
      const d = await res.json();
      this.setState({ statsData: d });
    } catch(e) { console.error(e); }
  }

  async _fetchVocabSets() {
    try {
      const res = await fetch('/api/system-vocab');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success && data.data) {
        const fetchedVocabSets = data.data;
        this.wordSets = [
          {id:'personal', kicker:'Cá nhân', label:'Bộ từ của bản thân', count:0, icon:'✏️', color:'#5D6B2D', deep:'#46531F', desc:'Tự thêm và ôn tập từ vựng của riêng bạn.', rating:'—', mastery:0, personal:true},
          ...fetchedVocabSets.map((vs: any, i: number) => {
            const v = SET_VISUAL[i] || SET_VISUAL[0];
            return {id:String(i), kicker:'IELTS', label:vs.topic, count:(vs.words || []).length, icon:v.icon, color:v.color, deep:v.deep, desc:v.desc, rating:'—', mastery:0, personal:false};
          })
        ];
        this.setLabels = this.wordSets.reduce((a: any, w: any)=>{a[w.id]=w.label;return a;},{});
        this.deck = this._buildDeck(0, fetchedVocabSets);
        this.setState({ vocabSets: fetchedVocabSets, vocabSetsLoading: false, currentSet: '0' });
        // Deck is ready now — hydrate the lists so word->index mapping succeeds.
        this._fetchSrsData('0').then(srsData => this.hydrateLists(srsData));
      }
    } catch(e) { console.error(e); this.setState({ vocabSetsLoading: false }); }
  }

  componentDidMount(){
    try{ if(localStorage.getItem('tid-dark')==='1') this.setState({dark:true}); }catch(e){}
    // Resolve admin access from fresh server-side metadata (avoids stale JWT after a role change).
    supabase.auth.getUser().then(({ data }) => {
      const role = data?.user?.user_metadata?.role;
      if (role === 'ADMIN' || role === 'INSTRUCTOR') this.setState({ isAdminLive: true });
    }).catch(() => {});
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view');
        if (view) {
          this.setState({ view });
        }
      }
    } catch(e) {}
    this._fetchVocabSets();
    this._fetchPersonalFolders();
    this._fetchDashboard();
    this._fetchStats();
    this._fetchUserProfile();
    this._fetchRoadmap();
    this._fetchDailyTasks();
    if (typeof window !== 'undefined' && window.location.search.includes('edit=true')) {
      this.setState({ view: 'editProfile' });
    }
    this._kh = (e: any)=>{
      const p=this.state.practice;
      if(p){
        if(e.key==='Escape'){ this.closePractice(); return; }
        if(p.finished) return;
        const type=this._curType(p);
        if(e.ctrlKey && e.key.toLowerCase()==='x'){ e.preventDefault(); this.listeningSay(); return; }
        if(type==='meaning'){
          if(!p.answered && ['1','2','3','4'].includes(e.key)){ e.preventDefault(); this.quizAnswer(Number(e.key)-1); return; }
          if(p.answered && (e.key==='Enter'||e.code==='Space')){ e.preventDefault(); this.practiceNext(); return; }
        } else if(type==='listening'||type==='context'){
          if(e.key==='Enter'){ e.preventDefault(); if(p.checked) this.practiceNext(); else this.checkType(); return; }
        }
        return;
      }
      const t=e.target; if(t && /input|textarea|select/i.test(t.tagName)) return;
      const studying = this.state.view==='study' || this.state.view==='cards';
      if(e.code==='Space'){ e.preventDefault(); this.flip(); }
      else if(e.key==='ArrowRight'){ this.next(); }
      else if(e.key==='ArrowLeft'){ this.prev(); }
      else if(e.key==='1'){ if(studying){ e.preventDefault(); this.markUnknown(); } }
      else if(e.key==='2'){ if(studying){ e.preventDefault(); this.markKnown(); } }
      else if(e.key && e.key.toLowerCase()==='s'){ this.toggleStar(); }
    };
    window.addEventListener('keydown', this._kh);
    document.addEventListener('mouseover', this._hoverIn);
    document.addEventListener('mouseout', this._hoverOut);
  }
  componentDidUpdate(){
    const p=this.state.practice;
    if(p && p.wrongPair && !this._wrongTimer){
      this._wrongTimer=setTimeout(()=>{ this._wrongTimer=null; this.matchClearWrong(); }, 850);
    }
  }
  componentWillUnmount(){ if(this._kh) window.removeEventListener('keydown', this._kh); if(this._wrongTimer) clearTimeout(this._wrongTimer); }
  flip = ()=> this.setState(s=>({flipped:!s.flipped}));
  next = ()=> this.setState(s=>{
    if(s.focus && s.focus.length){
      const np=(s.focusPos+1)%s.focus.length;
      const conf=s.focusPos===s.focus.length-1;
      return {focusPos:np, index:s.focus[np], flipped:false, confetti:conf};
    }
    const ni=(s.index+1)%this.deck.length;
    const seen={...s.seen};
    if(!seen[ni]){ seen[ni]=true; }
    const conf = s.index===this.deck.length-1;
    return {index:ni, flipped:false, seen, confetti:conf};
  }, this.autoSpeak);
  prev = ()=> this.setState(s=>{
    if(s.focus && s.focus.length){
      const np=(s.focusPos-1+s.focus.length)%s.focus.length;
      return {focusPos:np, index:s.focus[np], flipped:false};
    }
    return {index:(s.index-1+this.deck.length)%this.deck.length, flipped:false};
  }, this.autoSpeak);
  toggleAutoPlay = ()=> this.setState(s=>({autoPlay:!s.autoPlay}), ()=>{ if(this.state.autoPlay) this.speak(); });
  autoSpeak = ()=>{ if(this.state.autoPlay) this.speak(); };
  openStats = ()=> this.setState({showStats:true});
  stop = (e)=>{ if(e&&e.stopPropagation) e.stopPropagation(); };
  toggleDark = ()=> this.setState(s=>{ const d=!s.dark; try{localStorage.setItem('tid-dark', d?'1':'0');}catch(e){} return {dark:d}; });
  toggleNav = ()=> this.setState(s=>({navOpen:!s.navOpen}));
  setView = (v)=> this.setState({view:v});
  toggleBandMenu = ()=> this.setState(s=>({bandMenuOpen:!s.bandMenuOpen}));
  setTargetBand = (v)=> this.setState({targetBand:v, bandMenuOpen:false});
  _advanceNav(s){ if(s.focus && s.focus.length){ const np=(s.focusPos+1)%s.focus.length; return {focusPos:np, index:s.focus[np]}; } return {index:(s.index+1)%this.deck.length}; }
  markKnown = ()=> this.setState(s=>{ const i=s.index; const known=[i,...s.known.filter((idx: number)=>idx!==i)]; const unknown=s.unknown.filter((idx: number)=>idx!==i); const reviewList=s.reviewList?s.reviewList.filter((idx: number)=>idx!==i):[]; this._submitRating(this.deck[i].word,'easy'); return {known, unknown, reviewList, ...this._advanceNav(s), flipped:false}; });
  markUnknown = ()=> this.setState(s=>{ const i=s.index; const unknown=[i,...s.unknown.filter((idx: number)=>idx!==i)]; const known=s.known.filter((idx: number)=>idx!==i); const reviewList=s.reviewList?s.reviewList.filter((idx: number)=>idx!==i):[]; this._submitRating(this.deck[i].word,'forgot'); return {unknown, known, reviewList, ...this._advanceNav(s), flipped:false}; });
  showKnownTab = (t)=> this.setState({knownTab:t, view:'cards'});
  closeKnownTab = ()=> this.setState({knownTab:null});
  goList = (kind)=> this.setState({view:'lists', listKind:kind, focus:null, focusPos:0});
  toggleSetMenu = (e)=>{ if(e&&e.stopPropagation) e.stopPropagation(); this.setState(s=>({setMenuOpen:!s.setMenuOpen})); };
  pickSet = (id)=>{ if(id!=='personal'){ this.deck=this._buildDeck(parseInt(id)); } this.setState({currentSet:id, setMenuOpen:false, index:0, flipped:false, focus:null, focusPos:0}); };
  goSets = ()=> this.setState({view:'sets', setMenuOpen:false, focus:null, focusPos:0});
  goStudy = ()=> this.setState({view:'study', setMenuOpen:false, focus:null, focusPos:0});
  goPersonal = ()=> this.setState({view:'personal', setMenuOpen:false, focus:null, focusPos:0});
  setExamDate = (e)=>{ const v=e&&e.target&&e.target.value; if(v) this.setState({examDateStr:v}); };
  toggleDatePicker = ()=> this.setState(s=>{
    if(s.datePickerOpen) return {datePickerOpen:false};
    const d=new Date((s.examDateStr||'2027-06-28')+'T00:00:00');
    return {datePickerOpen:true, pickerYM:{y:d.getFullYear(), m:d.getMonth()}};
  });
  shiftPickerMonth = (delta)=> this.setState(s=>{
    const ym=s.pickerYM||{y:2027,m:5}; let m=ym.m+delta, y=ym.y;
    while(m<0){m+=12;y--;} while(m>11){m-=12;y++;}
    return {pickerYM:{y,m}};
  });
  pickExamDay = (y,m,d)=>{ const v=y+'-'+('0'+(m+1)).slice(-2)+'-'+('0'+d).slice(-2); this.setState({examDateStr:v, datePickerOpen:false}); };
  openSet = (id)=>{
    if(id!=='personal'){
      this.deck=this._buildDeck(parseInt(id));
      this.setState({currentSet:id, index:0, flipped:false, view:'study', setMenuOpen:false, srsData:{}, known:[], unknown:[], reviewList:[], focus:null, focusPos:0, mistakes:{}}, ()=>{
        this._fetchSrsData(id).then(srsData=>this.hydrateLists(srsData));
      });
    } else {
      this.setState({currentSet:id, index:0, flipped:false, view:'study', setMenuOpen:false, focus:null, focusPos:0});
    }
  };
  closeStats = ()=> this.setState({showStats:false});
  toggleStar = ()=> this.setState(s=>({starred:{...s.starred,[s.index]:!s.starred[s.index]}}));
  jumpTo = (i)=> this.setState({index:i, flipped:false}, this.autoSpeak);
  closeConfetti = ()=> this.setState({confetti:false});
  speak = ()=>{ try{ const u=new SpeechSynthesisUtterance(this.deck[this.state.index].word); u.lang='en-US'; u.rate=.9; speechSynthesis.cancel(); speechSynthesis.speak(u);}catch(e){} };
  speakBtn = (e)=>{ if(e&&e.stopPropagation) e.stopPropagation(); this.speak(); };
  starBtn = (e)=>{ if(e&&e.stopPropagation) e.stopPropagation(); this.toggleStar(); };

  // ---------- PRACTICE ENGINE ----------
  _shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  _posEn(p){ return p==='Danh từ'?'NOUN':p==='Động từ'?'VERB':p==='Tính từ'?'ADJECTIVE':'WORD'; }
  _posShort(p){ return p==='Danh từ'?'N':p==='Động từ'?'V':p==='Tính từ'?'ADJ':p==='Trạng từ'?'ADV':'W'; }

  // ---- DATA & SRS WIRING ----
  _posViFromEn(pos){ const m={v:'Động từ',n:'Danh từ',adj:'Tính từ',adv:'Trạng từ','v/n':'Động từ/Danh từ','n/adj':'Danh từ/Tính từ'}; return m[pos]||pos; }

  _buildDeck(setIndex, overrideSets?: any){
    const currentVocabSets = overrideSets || this.state?.vocabSets || [];
    if(setIndex===null||setIndex<0||setIndex>=currentVocabSets.length) return [];
    const vs=currentVocabSets[setIndex];
    return vs.words.map(w=>({
      word:w.word, ipa:w.ipa||'', posVi:this._posViFromEn(w.pos),
      vi:w.definition, exampleEn:w.example, exampleVi:'', tag:vs.topic, syn:''
    }));
  }

  async _fetchSrsData(setRef){
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const token=session?.access_token||'';
      const headers: Record<string,string>=token?{Authorization:`Bearer ${token}`}:{'x-mock-user-id':'usr_2'};
      const res=await fetch(`/api/vocab-reviews/words?set_ref=${encodeURIComponent(setRef)}`,{headers});
      if(!res.ok) return {};
      const rows=await res.json();
      const map={}; (rows||[]).forEach(r=>{map[r.word]=r;}); return map;
    }catch{return {};}
  }

  hydrateLists = (srsData: any) => {
    const wordToIndex: Record<string, number> = {};
    this.deck.forEach((c: any, i: number) => { wordToIndex[c.word] = i; });
    
    const rows = Object.values(srsData).sort((a: any, b: any) => {
      const ta = a.last_reviewed_at ? new Date(a.last_reviewed_at).getTime() : 0;
      const tb = b.last_reviewed_at ? new Date(b.last_reviewed_at).getTime() : 0;
      return tb - ta;
    });

    const known: number[] = [];
    const unknown: number[] = [];
    const reviewList: number[] = [];
    const now = Date.now();

    rows.forEach((r: any) => {
      const idx = wordToIndex[r.word];
      if (idx === undefined) return;
      
      const isKnown = r.status === 'known' || (r.status == null && r.review_count >= 1 && r.ease_factor > 2);
      if (r.status === 'known') known.push(idx);
      else if (r.status === 'unknown') unknown.push(idx);
      else if (r.status == null) {
        if (r.review_count >= 1 && r.ease_factor > 2) known.push(idx);
        else unknown.push(idx);
      }

      if (isKnown && r.next_review_at) {
        const nextTime = new Date(r.next_review_at).getTime();
        if (nextTime <= now) {
          reviewList.push(idx);
        }
      }
    });
    this.setState({ known, unknown, reviewList, srsData });
  };

  async _submitRating(word,rating){
    try{
      const setRef=this.state.currentSet;
      if(setRef==='personal') return;
      const {data:{session}}=await supabase.auth.getSession();
      const token=session?.access_token||'';
      const headers={'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{'x-mock-user-id':'usr_2'})};
      await fetch('/api/vocab-reviews/words',{method:'POST',headers,body:JSON.stringify({set_ref:setRef,word,rating})});
      const srsData=await this._fetchSrsData(setRef);
      this.hydrateLists(srsData);
    }catch(e){console.error(e);}
  }

  async _fetchPersonalFolders(){
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const token=session?.access_token||'';
      const headers: Record<string,string>=token?{Authorization:`Bearer ${token}`}:{'x-mock-user-id':'usr_2'};
      const res=await fetch('/api/notebook/folders',{headers});
      if(!res.ok) return;
      const d=await res.json();
      if(d.data) this.setState({personalFolders:d.data});
    }catch(e){console.error(e);}
  }

  async _submitCreateFolder(){
    const name = this.state.createFolderName.trim();
    if(!name){ this.setState({createFolderError:'Vui lòng nhập tên thư mục.'}); return; }
    this.setState({createFolderLoading:true, createFolderError:''});
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const token=session?.access_token||'';
      const headers: Record<string,string>={'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{'x-mock-user-id':'usr_2'})};
      const res=await fetch('/api/notebook/folders',{method:'POST',headers,body:JSON.stringify({name})});
      if(!res.ok){ this.setState({createFolderError:'Tạo thư mục thất bại.',createFolderLoading:false}); return; }
      this.setState({createFolderOpen:false,createFolderName:'',createFolderLoading:false,createFolderError:''});
      await this._fetchPersonalFolders();
    }catch(e){ this.setState({createFolderError:'Đã xảy ra lỗi.',createFolderLoading:false}); }
  }

  async _openFolderView(id, name, colorIdx){
    this.setState({view:'folderDetail', activeFolderId:id, activeFolderName:name, activeFolderColorIdx:colorIdx, folderWords:[], folderWordsLoading:true});
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const token=session?.access_token||'';
      const headers: Record<string,string>=token?{Authorization:`Bearer ${token}`}:{'x-mock-user-id':'usr_2'};
      const res=await fetch(`/api/notebook?folder_id=${id}`,{headers});
      if(!res.ok){ this.setState({folderWordsLoading:false}); return; }
      const d=await res.json();
      this.setState({folderWords:d.data||[], folderWordsLoading:false});
    }catch(e){ this.setState({folderWordsLoading:false}); }
  }

  async _lookupWords(){
    const raw = this.state.addWordInput;
    const words = raw.split(/[\n,]+/).map(w=>w.trim().toLowerCase()).filter(Boolean);
    if(!words.length){ this.setState({addWordError:'Vui lòng nhập ít nhất một từ.'}); return; }
    const initial = words.map(w=>({word:w, viDef:'', enDef:'', example:'', pos:'', loading:true, error:'', saved:false, duplicate:false}));
    this.setState({addWordResults:initial, addWordFetchLoading:true, addWordError:''});

    await Promise.all(words.map(async (word, i)=>{
      try{
        // Free Dictionary API
        let enDef='', example='', pos='', audioUrl='';
        try{
          const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
          if(dictRes.ok){
            const dictData = await dictRes.json();
            const entry = dictData?.[0];
            // Find audio URL from phonetics
            const phonetic = entry?.phonetics?.find((p:any)=>p.audio);
            audioUrl = phonetic?.audio || '';
            // Search all meanings for best definition + example
            const meanings = entry?.meanings || [];
            for(const m of meanings){
              if(!pos && m.partOfSpeech) pos = m.partOfSpeech;
              for(const d of (m.definitions||[])){
                if(!enDef && d.definition) enDef = d.definition;
                if(!example && d.example) example = d.example;
                if(enDef && example) break;
              }
              if(enDef && example) break;
            }
          }
        }catch(_){}

        // Google Translate unofficial
        let viDef = '';
        try{
          const gtRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`);
          if(gtRes.ok){
            const gtData = await gtRes.json();
            viDef = gtData?.[0]?.[0]?.[0] || '';
          }
        }catch(_){}

        this.setState(prev=>{
          const arr=[...prev.addWordResults];
          arr[i]={...arr[i], enDef, example, pos, viDef, audioUrl, loading:false, error:!enDef&&!viDef?'Không tìm thấy từ này.':''};
          return {addWordResults:arr};
        });
      }catch(e){
        this.setState(prev=>{
          const arr=[...prev.addWordResults];
          arr[i]={...arr[i], loading:false, error:'Lỗi tra cứu.'};
          return {addWordResults:arr};
        });
      }
    }));
    this.setState({addWordFetchLoading:false});
  }

  _updateWordResult(i, field, value){
    this.setState(prev=>{
      const arr=[...prev.addWordResults];
      arr[i]={...arr[i],[field]:value};
      return {addWordResults:arr};
    });
  }

  async _saveWordResults(){
    this.setState({addWordSaveLoading:true});
    const {data:{session}}=await supabase.auth.getSession();
    const token=session?.access_token||'';
    const headers: Record<string,string>={'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{'x-mock-user-id':'usr_2'})};
    let savedCount=0;
    const results=[...this.state.addWordResults];
    for(let i=0;i<results.length;i++){
      const r=results[i];
      if(r.error||r.duplicate||r.saved||!r.viDef?.trim()||!r.example?.trim()) continue;
      try{
        const res=await fetch('/api/notebook',{method:'POST',headers,body:JSON.stringify({word:r.word,definition:r.viDef.trim(),example:r.example?.trim()||null,pos:r.pos||null,folder_id:this.state.activeFolderId})});
        if(res.status===409){
          this.setState({addWordSaveLoading:false});
          const force = await new Promise<boolean>(resolve => {
            this.setState({ duplicatePrompt: { word: r.word, resolve } });
          });
          this.setState({ duplicatePrompt: null, addWordSaveLoading: true });
          
          if(force){
            const retryRes=await fetch('/api/notebook',{method:'POST',headers,body:JSON.stringify({word:r.word,definition:r.viDef.trim(),example:r.example?.trim()||null,pos:r.pos||null,folder_id:this.state.activeFolderId,force:true})});
            if(retryRes.ok){
              this.setState(prev=>{ const a=[...prev.addWordResults]; a[i]={...a[i],saved:true,duplicate:false,error:''}; return {addWordResults:a}; });
              savedCount++;
            } else {
              this.setState(prev=>{ const a=[...prev.addWordResults]; a[i]={...a[i],error:'Lỗi khi lưu lại'}; return {addWordResults:a}; });
            }
          } else {
            this.setState(prev=>{ const a=[...prev.addWordResults]; a[i]={...a[i],duplicate:true,error:'Từ đã có trong sổ'}; return {addWordResults:a}; });
          }
        } else if(res.ok){
          this.setState(prev=>{ const a=[...prev.addWordResults]; a[i]={...a[i],saved:true}; return {addWordResults:a}; });
          savedCount++;
        } else {
          const errBody=await res.json().catch(()=>({}));
          console.error('[saveWordResults] server error:', res.status, errBody);
          this.setState(prev=>{ const a=[...prev.addWordResults]; a[i]={...a[i],error:`Lỗi ${res.status}: ${errBody?.error||'unknown'}`}; return {addWordResults:a}; });
        }
      }catch(e){ console.error('[saveWordResults] fetch error:', e); }
    }
    this.setState({addWordSaveLoading:false});
    if(savedCount>0){
      await this._openFolderView(this.state.activeFolderId, this.state.activeFolderName, this.state.activeFolderColorIdx);
      await this._fetchPersonalFolders();
      // Close only if all saved
      const remaining=this.state.addWordResults.filter(r=>!r.saved&&!r.error&&!r.duplicate);
      if(remaining.length===0) this.setState({addWordModalOpen:false, addWordInput:'', addWordResults:[]});
    }
  }

  async _deleteFolderWord(wordId){
    if(!confirm('Xoá từ này khỏi sổ tay?')) return;
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const token=session?.access_token||'';
      const headers: Record<string,string>=token?{Authorization:`Bearer ${token}`}:{'x-mock-user-id':'usr_2'};
      await fetch(`/api/notebook?id=${wordId}`,{method:'DELETE',headers});
      this.setState({folderWords:this.state.folderWords.filter(w=>w.id!==wordId)});
      await this._fetchPersonalFolders();
    }catch(e){console.error(e);}
  }

  async _submitRenameFolderDetail(){
    if(this.state.activeFolderId === 'general') return;
    const name=this.state.renameFolderInput.trim();
    if(!name) return;
    this.setState({renameFolderLoading:true});
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const token=session?.access_token||'';
      const headers: Record<string,string>={'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{'x-mock-user-id':'usr_2'})};
      await fetch('/api/notebook/folders',{method:'PUT',headers,body:JSON.stringify({id:this.state.activeFolderId,name})});
      this.setState({activeFolderName:name,renameFolderModalOpen:false,renameFolderLoading:false});
      await this._fetchPersonalFolders();
    }catch(e){ this.setState({renameFolderLoading:false}); }
  }

  async _deleteFolderDetail(){
    if(this.state.activeFolderId === 'general') return;
    if(!confirm(`Xoá thư mục "${this.state.activeFolderName}"? Các từ sẽ không bị xoá.`)) return;
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const token=session?.access_token||'';
      const headers: Record<string,string>=token?{Authorization:`Bearer ${token}`}:{'x-mock-user-id':'usr_2'};
      await fetch(`/api/notebook/folders?id=${this.state.activeFolderId}`,{method:'DELETE',headers});
      this.setState({view:'personal', activeFolderId:null, activeFolderName:'', folderWords:[]});
      await this._fetchPersonalFolders();
    }catch(e){console.error(e);}
  }

  async _fetchUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        this.setState({
          profileName: user.user_metadata?.name || user.email?.split('@')[0] || '',
          profilePhone: user.user_metadata?.phone || '',
          profileBio: user.user_metadata?.bio || '',
          profileInAppReminders: user.user_metadata?.inAppReminders !== false,
          profileEmailReminders: user.user_metadata?.emailReminders !== false,
          profileStreakWarning: user.user_metadata?.streakWarning !== false,
        });
      }
    } catch (e) {
      console.error("Lỗi khi tải thông tin cá nhân:", e);
    }
  }

  async _saveProfile(e: React.FormEvent) {
    if (e) e.preventDefault();
    this.setState({ profileLoading: true, profileError: '', profileSuccess: '' });
    
    if (!this.state.profileName.trim()) {
      this.setState({ profileError: 'Họ và tên không được bỏ trống.', profileLoading: false });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          name: this.state.profileName.trim(), 
          phone: this.state.profilePhone.trim(), 
          bio: this.state.profileBio.trim(),
          inAppReminders: this.state.profileInAppReminders,
          emailReminders: this.state.profileEmailReminders,
          streakWarning: this.state.profileStreakWarning
        },
      });

      if (error) throw error;

      this.setState({ profileSuccess: 'Cập nhật thông tin hồ sơ thành công!', profileLoading: false });
      setTimeout(() => {
        this.setState({ view: 'dashboard', profileSuccess: '' });
      }, 1500);
    } catch (err: any) {
      this.setState({ profileError: err.message || 'Đã xảy ra lỗi khi cập nhật.', profileLoading: false });
    }
  }

  _getLocaleUrl(path: string) {
    const match = window.location.pathname.match(/^\/(en|vi)\b/);
    const prefix = match ? `/${match[1]}` : '';
    return `${prefix}${path}`;
  }

  _fetchDailyTasks = async () => {
    try {
      this.setState({ dailyTasksLoading: true, dailyTasksError: null });
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = token 
        ? { Authorization: `Bearer ${token}` } 
        : { "x-mock-user-id": "usr_2" };

      const res = await fetch("/api/student/daily-tasks", { headers });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể tải danh sách nhiệm vụ");
      }

      const data = await res.json();
      this.setState({ dailyTasks: data.dailyTasks || [], dailyTasksLoading: false });
    } catch (err: any) {
      console.error(err);
      this.setState({ dailyTasksError: err.message || "Đã xảy ra lỗi khi tải dữ liệu", dailyTasksLoading: false });
    }
  };

  _handleCompleteDailyTask = async (taskId: string) => {
    if (this.state.dailyTasksCompletingId) return;
    this.setState({ dailyTasksCompletingId: taskId });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = token 
        ? { Authorization: `Bearer ${token}` } 
        : { "x-mock-user-id": "usr_2" };

      const res = await fetch(`/api/student/daily-tasks/${taskId}/complete`, {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể cập nhật trạng thái hoàn thành");
      }

      await this._fetchDailyTasks();
    } catch (err: any) {
      alert(err.message || "Lỗi khi cập nhật");
    } finally {
      this.setState({ dailyTasksCompletingId: null });
    }
  };

  _fetchRoadmap = async () => {
    try {
      this.setState({ roadmapLoading: true });
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/student/roadmap", {
        headers: {
          "Authorization": `Bearer ${session?.access_token || ""}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        this.setState({
          roadmap: data.roadmap,
          roadmapCurrentBand: data.roadmap ? data.roadmap.currentBand : 5.0,
          roadmapTargetBand: data.roadmap ? data.roadmap.targetBand : 6.5,
          roadmapDailyHours: data.roadmap ? data.roadmap.dailyHours : 2.0,
          roadmapTargetDate: data.roadmap ? data.roadmap.targetDate : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          roadmapFocusSkills: data.roadmap ? data.roadmap.focusSkills : ["Listening", "Reading", "Writing", "Speaking"],
        });
      }
    } catch (err) {
      console.error("Lỗi khi tải lộ trình:", err);
    } finally {
      this.setState({ roadmapLoading: false });
    }
  };

  _handleRoadmapSkillsChange = (skill: string) => {
    const focusSkills = this.state.roadmapFocusSkills;
    if (focusSkills.includes(skill)) {
      this.setState({ roadmapFocusSkills: focusSkills.filter(s => s !== skill) });
    } else {
      this.setState({ roadmapFocusSkills: [...focusSkills, skill] });
    }
  };

  _startRoadmapAIGeneration = async (e: any) => {
    if (e) e.preventDefault();
    const { roadmapCurrentBand, roadmapTargetBand, roadmapFocusSkills } = this.state;
    if (roadmapTargetBand <= roadmapCurrentBand) {
      alert("Band mục tiêu phải lớn hơn Band hiện tại!");
      return;
    }
    if (roadmapFocusSkills.length === 0) {
      alert("Vui lòng chọn ít nhất một kỹ năng cần tập trung!");
      return;
    }

    this.setState({
      roadmapIsGenerating: true,
      roadmapGenerationStep: 0,
      roadmapGenerationProgress: 0
    });

    const stepsCount = 4;
    const intervalTime = 600;

    const progressInterval = setInterval(() => {
      this.setState(s => ({
        roadmapGenerationProgress: s.roadmapGenerationProgress >= 100 ? 100 : s.roadmapGenerationProgress + 4
      }));
    }, 100);

    const stepInterval = setInterval(() => {
      this.setState(s => ({
        roadmapGenerationStep: s.roadmapGenerationStep >= stepsCount - 1 ? stepsCount - 1 : s.roadmapGenerationStep + 1
      }));
    }, intervalTime);

    setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/student/roadmap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || ""}`
          },
          body: JSON.stringify({
            action: "GENERATE",
            currentBand: this.state.roadmapCurrentBand,
            targetBand: this.state.roadmapTargetBand,
            dailyHours: this.state.roadmapDailyHours,
            targetDate: this.state.roadmapTargetDate,
            focusSkills: this.state.roadmapFocusSkills
          })
        });

        if (res.ok) {
          const data = await res.json();
          this.setState({ roadmap: data.roadmap, roadmapIsEditingGoals: false });
        }
      } catch (err) {
        console.error("Lỗi khi tạo lộ trình:", err);
      } finally {
        this.setState({ roadmapIsGenerating: false });
        clearInterval(progressInterval);
        clearInterval(stepInterval);
      }
    }, 2800);
  };

  _activateRoadmap = async () => {
    try {
      this.setState({ roadmapActionLoading: true });
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/student/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({ action: "ACTIVATE" })
      });

      if (res.ok) {
        const data = await res.json();
        this.setState({ roadmap: data.roadmap, roadmapActivePhaseTab: "phase_1" });
        window.dispatchEvent(new Event("visibilitychange"));
      }
    } catch (err) {
      console.error("Lỗi kích hoạt lộ trình:", err);
    } finally {
      this.setState({ roadmapActionLoading: false });
    }
  };

  _toggleRoadmapTask = async (phaseId: string, taskId: string, completed: boolean) => {
    const roadmap = this.state.roadmap;
    if (!roadmap) return;

    // Optimistic update
    const updatedPhases = roadmap.phases.map((phase: any) => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: phase.tasks.map((task: any) => {
            if (task.id === taskId) {
              return { ...task, completed };
            }
            return task;
          })
        };
      }
      return phase;
    });

    this.setState({ roadmap: { ...roadmap, phases: updatedPhases } });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/student/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({
          action: "TOGGLE_TASK",
          phaseId,
          taskId,
          completed
        })
      });

      if (!res.ok) {
        this._fetchRoadmap();
      }
    } catch (err) {
      console.error("Lỗi cập nhật tiến độ:", err);
      this._fetchRoadmap();
    }
  };

  _resetRoadmap = async () => {
    if (!confirm("Bạn có chắc muốn đặt lại lộ trình học? Toàn bộ dữ liệu tiến trình hiện tại sẽ bị xóa.")) {
      return;
    }

    try {
      this.setState({ roadmapActionLoading: true });
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/student/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({ action: "DELETE" })
      });

      if (res.ok) {
        this.setState({ roadmap: null, roadmapIsEditingGoals: false });
      }
    } catch (err) {
      console.error("Lỗi reset lộ trình:", err);
    } finally {
      this.setState({ roadmapActionLoading: false });
    }
  };

  _studyFolderWords(){
    const words=this.state.folderWords;
    if(!words||words.length===0) return;
    this.deck=words.map(w=>({
      word:w.word,
      ipa:'',
      posVi:this._posViFromEn(w.pos||''),
      vi:w.definition||w.word,
      exampleEn:w.example||'',
      exampleVi:'',
      tag:this.state.activeFolderName,
      syn:''
    }));
    this.setState({currentSet:'personal', index:0, flipped:false, view:'study', setMenuOpen:false, srsData:{}, known:[], unknown:[], reviewList:[], focus:null, focusPos:0, mistakes:{}});
  }

  _computeMastery(setIndex){
    const currentVocabSets = this.state.vocabSets;
    const vs=currentVocabSets[setIndex];
    if (!vs) return null;
    if(!vs||vs.words.length===0) return 0;
    const now=new Date();
    const mastered=vs.words.filter(w=>{
      const s=this.state.srsData[w.word];
      return s&&s.review_count>=3&&s.next_review_at&&new Date(s.next_review_at)>now;
    }).length;
    return Math.round((mastered/vs.words.length)*100);
  }

  _blank(idx){
    const w=this.deck[idx].word, s=this.deck[idx].exampleEn;
    const re=new RegExp('\\b'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(s|es|d|ed|ing)?\\b','i');
    return re.test(s)? s.replace(re,'________') : s+' ________';
  }
  // Sentence split around the blank so the input can sit inline where the word goes.
  _blankParts(idx){
    const w=this.deck[idx].word, s=this.deck[idx].exampleEn||'';
    const re=new RegExp('\\b'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(s|es|d|ed|ing)?\\b','i');
    const m=s.match(re);
    if(m && m.index!=null){ return { before:s.slice(0,m.index), after:s.slice(m.index+m[0].length) }; }
    return { before:s?s+' ':'', after:'' };
  }
  _options(idx){
    const others=this._shuffle(this.deck.map((_,k)=>k).filter(k=>k!==idx)).slice(0,3);
    const all=this._shuffle([idx,...others]);
    return { list: all.map(k=>this.deck[k].word), correct: all.indexOf(idx) };
  }
  _buildQuestion(idx,type){
    const o=this._options(idx);
    return { idx, type, options:o.list, correct:o.correct, blank:this._blank(idx) };
  }
  startPractice = (mode, srcIdxArg)=>{
    let sourceIdx;
    if(Array.isArray(srcIdxArg)){ sourceIdx = srcIdxArg.filter((k: number)=>this.deck[k]); }
    else if(mode==='review'){ sourceIdx = this.state.reviewList || []; }
    else { sourceIdx = this.deck.map((_,k)=>k); }
    if(!sourceIdx.length) return;
    const scopeIdx = Array.isArray(srcIdxArg) ? sourceIdx.slice() : null;
    let practice;
    {
      let order=this._shuffle(sourceIdx);
      let queue;
      if(mode==='quiz'){ queue=order.map(k=>this._buildQuestion(k,'meaning')); }
      else if(mode==='blank'){ queue=order.map(k=>this._buildQuestion(k,'context')); }
      else if(mode==='listening'){ queue=order.map(k=>this._buildQuestion(k,'listening')); }
      else { const types=['meaning','context','listening']; queue=order.map((k,n)=>this._buildQuestion(k,types[n%3])); }
      const titles={quiz:'Quiz',blank:'Điền vào chỗ trống',listening:'Listening',mixed:'Tổng hợp',review:'Cần ôn tập'};
      const accents={quiz:'#9a5a14',blank:'#C2693B',listening:'#5D6B2D',mixed:'#1F1F1F',review:'#C2693B'};
      practice={ mode, baseMode:mode, scopeIdx, title:titles[mode]||'Luyện tập', accent:accents[mode]||'#5D6B2D',
        queue, pos:0, quizMode:'meaning', answered:false, selected:null,
        input:'', hintShown:false, checked:false, typedCorrect:false,
        correct:0, wrong:0, finished:false };
    }
    this.setState({practice}, ()=>{ const q=practice.queue[0]; if(q.type==='listening') this._say(this.deck[q.idx].word); });
  };
  closePractice = ()=> this.setState({practice:null});
  _say(text){ try{ const u=new SpeechSynthesisUtterance(text); u.lang='en-US'; u.rate=.9; speechSynthesis.cancel(); speechSynthesis.speak(u);}catch(e){} }
  _playSfx(type){
    try{
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if(!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if(type==='correct'){
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      } else if(type==='wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      }
    }catch(e){}
  }
  _addMistake(idx){ this.setState(s=>({mistakes:{...s.mistakes,[idx]:true}})); }
  _curType(p){ return p.mode==='quiz'? p.quizMode : p.queue[p.pos].type; }
  setQuizMode = (m)=> this.setState(s=>({practice:{...s.practice, quizMode:m, answered:false, selected:null}}));
  quizAnswer = (choice)=> this.setState(s=>{
    const p=s.practice; if(p.answered) return null;
    const q=p.queue[p.pos]; const ok=choice===q.correct;
    const mistakes = ok ? s.mistakes : {...s.mistakes,[q.idx]:true};
    this._submitRating(this.deck[q.idx].word, ok?'good':'forgot');
    if(ok) this._playSfx('correct'); else this._playSfx('wrong');
    return { mistakes, practice:{...p, answered:true, selected:choice, correct:p.correct+(ok?1:0), wrong:p.wrong+(ok?0:1)}, miniConfetti: ok };
  }, ()=>{ if(this.state.miniConfetti) setTimeout(()=>this.setState({miniConfetti:false}), 1000); });
  listeningInput = (e)=>{ const v=e.target.value; this.setState(s=>({practice:{...s.practice, input:v}})); };
  listeningHint = ()=> this.setState(s=>({practice:{...s.practice, hintShown:true}}));
  listeningSay = ()=>{ const p=this.state.practice; this._say(this.deck[p.queue[p.pos].idx].word); };
  checkType = ()=> this.setState(s=>{
    const p=s.practice; if(p.checked) return null;
    const q=p.queue[p.pos]; const ans=this.deck[q.idx].word.trim().toLowerCase();
    const ok=(p.input||'').trim().toLowerCase()===ans;
    const mistakes = ok ? s.mistakes : {...s.mistakes,[q.idx]:true};
    if(ok) this._playSfx('correct'); else this._playSfx('wrong');
    return { mistakes, practice:{...p, checked:true, typedCorrect:ok, correct:p.correct+(ok?1:0), wrong:p.wrong+(ok?0:1)}, miniConfetti: ok };
  }, ()=>{ if(this.state.miniConfetti) setTimeout(()=>this.setState({miniConfetti:false}), 1000); });
  practiceNext = ()=> this.setState(s=>{
    const p=s.practice; const last=p.pos>=p.queue.length-1;
    if(last) return { practice:{...p, finished:true}, confetti:true };
    const np={...p, pos:p.pos+1, answered:false, selected:null, input:'', hintShown:false, checked:false, typedCorrect:false};
    return { practice:np };
  }, ()=>{ const p=this.state.practice; if(p && !p.finished){ const q=p.queue[p.pos]; if(this._curType(p)==='listening') this._say(this.deck[q.idx].word); } });
  restartPractice = ()=>{ const m=this.state.practice.baseMode||this.state.practice.mode; const scope=this.state.practice.scopeIdx; this.setState({practice:null, confetti:false}, ()=>this.startPractice(m, scope||undefined)); };

  // matching
  matchPickLeft = (idx)=> this.setState(s=>{ const p=s.practice; if(p.matched[idx]) return null; return {practice:{...p, selL:idx, wrongPair:null}}; });
  matchPickRight = (ridx)=> this.setState(s=>{
    const p=s.practice; if(p.matched[ridx]||p.selL==null) return null;
    if(p.selL===ridx){ const matched={...p.matched,[ridx]:true}; const done=Object.keys(matched).length>=p.pairs.length;
      return {practice:{...p, matched, selL:null, score:p.score+10, finished:done, wrongPair:null}, ...(done?{confetti:true}:{})}; }
    const mistakes={...s.mistakes,[p.selL]:true,[ridx]:true};
    const hearts=Math.max(0,p.hearts-1);
    return {mistakes, practice:{...p, wrongPair:[p.selL,ridx], hearts, selL:null, finished:hearts<=0}};
  });
  matchClearWrong = ()=> this.setState(s=> s.practice&&s.practice.wrongPair? {practice:{...s.practice, wrongPair:null}} : null);
  reviewMistakes = ()=>{ if((this.state.reviewList || []).length) this.startPractice('review'); };
  studyList = (kind)=> this.setState(s=>{
    const src = kind==='known'? s.known : kind==='unknown'? s.unknown : (s.reviewList||[]);
    const focus = (src||[]).filter((i: number)=>this.deck[i]);
    if(!focus.length) return null;
    return {focus, focusPos:0, index:focus[0], flipped:false, view:'study', confetti:false};
  }, this.autoSpeak);
  _listVals(){
    const kind=this.state.listKind;
    const srcList = kind==='known'? this.state.known : kind==='unknown'? this.state.unknown : (this.state.reviewList || []);
    const rows = (Array.isArray(srcList) ? srcList : []).filter(i=>this.deck[i]).map(i=>({
      word:this.deck[i].word, vi:this.deck[i].vi, posVi:this.deck[i].posVi, ipa:this.deck[i].ipa, pos:this._posShort(this.deck[i].posVi),
      speak:(e)=>{ if(e&&e.stopPropagation) e.stopPropagation(); this._say(this.deck[i].word); },
      go:()=>this.setState({index:i, flipped:false, view:'cards', focus:null, focusPos:0}) }));
    const meta={
      known:{title:'Đã nhớ', desc:'Những từ bạn đã nắm vững', accent:'#5D6B2D', accentBg:'#EEF1E2', accentInk:'#5D6B2D'},
      unknown:{title:'Chưa nhớ', desc:'Những từ bạn cần xem lại', accent:'#C2693B', accentBg:'#F7E7DE', accentInk:'#C2693B'},
      review:{title:'Cần ôn tập', desc:'Những từ đã nhớ cần ôn lại', accent:'#EE9A23', accentBg:'#FFF3D6', accentInk:'#9a5a14'}
    }[kind]||{};
    const navActive = (k)=> this.state.view==='lists' && this.state.listKind===k;
    return {
      listKind:kind, listRows:rows, listEmpty:rows.length===0, listHasRows:rows.length>0, listCount:String(rows.length),
      listTitle:meta.title, listDesc:meta.desc, listAccent:meta.accent, listAccentBg:meta.accentBg, listAccentInk:meta.accentInk,
      listIsReview: kind==='review',
      studyListAgain:()=>this.studyList(kind),
      listStudyFlashcard:()=>this.studyList(kind),
      listStudyQuiz:()=>this.startPractice('quiz', srcList),
      listStudyListening:()=>this.startPractice('listening', srcList),
      listStudyBlank:()=>this.startPractice('blank', srcList),
      listStudyMixed:()=>this.startPractice('mixed', srcList),
      goKnownTab:()=>this.goList('known'), goUnknownTab:()=>this.goList('unknown'), goReviewTab:()=>this.goList('review'),
      tabKnownBg: this.state.listKind==='known'?'#5D6B2D':'#fff', tabKnownInk: this.state.listKind==='known'?'#FFF8EB':'#7c8362',
      tabUnknownBg: this.state.listKind==='unknown'?'#C2693B':'#fff', tabUnknownInk: this.state.listKind==='unknown'?'#FFF8EB':'#7c8362',
      tabReviewBg: this.state.listKind==='review'?'#EE9A23':'#fff', tabReviewInk: this.state.listKind==='review'?'#FFF8EB':'#7c8362',
      navKnownBg: navActive('known')?'#F6C453':'transparent', navKnownInk: navActive('known')?'#2A3114':'#C9CFAE', navKnownWeight: navActive('known')?'800':'600', navKnownShadow: navActive('known')?'0 4px 0 rgba(0,0,0,.14)':'none',
      navUnknownBg: navActive('unknown')?'#F6C453':'transparent', navUnknownInk: navActive('unknown')?'#2A3114':'#C9CFAE', navUnknownWeight: navActive('unknown')?'800':'600', navUnknownShadow: navActive('unknown')?'0 4px 0 rgba(0,0,0,.14)':'none',
      navReviewBg: navActive('review')?'#F6C453':'transparent', navReviewInk: navActive('review')?'#2A3114':'#C9CFAE', navReviewWeight: navActive('review')?'800':'600', navReviewShadow: navActive('review')?'0 4px 0 rgba(0,0,0,.14)':'none'
    };
  }

  _optStyle(st){
    if(this.state.dark){
      if(st==='correct') return {bg:'#22361B',border:'#6E8A3C',numBg:'#7DA046',numInk:'#11140C',ink:'#DDE9C7'};
      if(st==='wrong')   return {bg:'#3A241B',border:'#C2693B',numBg:'#C2693B',numInk:'#FFF8EB',ink:'#F0C3AC'};
      if(st==='dim')     return {bg:'#1C2012',border:'rgba(255,255,255,.07)',numBg:'#242A18',numInk:'#6f7656',ink:'#6f7656'};
      return {bg:'#242A18',border:'rgba(255,255,255,.10)',numBg:'#11140C',numInk:'#C9D49C',ink:'#F3F1E6'};
    }
    if(st==='correct') return {bg:'#E7F0DD',border:'#5D6B2D',numBg:'#5D6B2D',numInk:'#FFF8EB',ink:'#2A3114'};
    if(st==='wrong')   return {bg:'#F7E7DE',border:'#C2693B',numBg:'#C2693B',numInk:'#FFF8EB',ink:'#8a3d1c'};
    if(st==='dim')     return {bg:'#FBF8EF',border:'#EFEAD8',numBg:'#F4F0E1',numInk:'#c2c6ad',ink:'#b6bb9c'};
    return {bg:'#fff',border:'#E7E1CD',numBg:'#EEF1E2',numInk:'#5D6B2D',ink:'#2A3114'};
  }
  _cellStyle(st){
    if(st==='matched') return {bg:'#E7F0DD',border:'#9DB87E',ink:'#6f7e4e',op:'.55'};
    if(st==='selected')return {bg:'#FFF3D6',border:'#F6C453',ink:'#2A3114',op:'1'};
    if(st==='wrong')   return {bg:'#F7E7DE',border:'#C2693B',ink:'#8a3d1c',op:'1'};
    return {bg:'#fff',border:'#E7E1CD',ink:'#2A3114',op:'1'};
  }
  _practiceVals(reviewCount){
    const p=this.state.practice;
    if(!p) return { practiceActive:false };
    const P={ practiceActive:true, pTitle:p.title, pAccent:p.accent, pIsMatching:p.mode==='matching',
      pFinished:!!p.finished, pShowResult:!!p.finished, closePractice:this.closePractice, restartPractice:this.restartPractice,
      reviewMistakes:this.reviewMistakes };
    P.pShowMatching = p.mode==='matching' && !p.finished;
    P.pIsQuizOrListen = false;
    if(p.mode==='matching'){
      const matchedCount=Object.keys(p.matched).length;
      P.mMatched=matchedCount; P.mTotal=p.pairs.length;
      P.mProgressW=Math.round(matchedCount/p.pairs.length*100)+'%';
      P.mScore=p.score;
      P.mHearts=Array.from({length:5}).map((_,k)=>({on:k<p.hearts, color:k<p.hearts?'#EE5A6F':'#E7E1CD'}));
      P.mFinishedWin = p.finished && p.hearts>0;
      P.mFinishedLose = p.finished && p.hearts<=0;
      P.pResultMatching = true; P.pResultQa = false;
      P.pResultEmoji = P.mFinishedLose ? '🌧️' : (matchedCount===p.pairs.length ? '🎉' : '🌱');
      P.pResultTitle = P.mFinishedLose ? 'Hết lượt rồi!' : 'Hoàn thành ghép thẻ!';
      P.pResultSub = P.mFinishedLose ? 'Những cặp sai đã được thêm vào mục Cần ôn tập.' : 'Bạn đã nối đúng tất cả các cặp từ. Tuyệt vời!';
      P.rStatA = matchedCount+'/'+p.pairs.length; P.rStatALabel='Cặp đúng';
      P.rStatB = String(p.score); P.rStatBLabel='Điểm';
      P.rStatC = String(p.hearts); P.rStatCLabel='Tim còn lại';
      P.mLeft=p.left.map(idx=>{ const st=p.matched[idx]?'matched':(p.selL===idx?'selected':(p.wrongPair&&p.wrongPair[0]===idx?'wrong':'idle')); const s=this._cellStyle(st);
        return { word:this.deck[idx].word, bg:s.bg, border:s.border, ink:s.ink, op:s.op, pick:()=>this.matchPickLeft(idx) }; });
      P.mRight=p.right.map(idx=>{ const st=p.matched[idx]?'matched':(p.wrongPair&&p.wrongPair[1]===idx?'wrong':'idle'); const s=this._cellStyle(st);
        return { vi:this.deck[idx].vi, bg:s.bg, border:s.border, ink:s.ink, op:s.op, pick:()=>this.matchPickRight(idx) }; });
      return P;
    }
    const q=p.queue[p.pos], type=this._curType(p), card=this.deck[q.idx];
    P.pHuman=p.pos+1; P.pLen=p.queue.length;
    P.pProgressW=Math.round(((p.pos+((p.answered||p.checked)?1:0))/p.queue.length)*100)+'%';
    P.pIsMeaning=type==='meaning'; P.pIsContext=type==='context'; P.pIsListening=type==='listening';
    P.pIsQuiz = P.pIsMeaning||P.pIsContext;
    P.pIsQuizOrListen = !p.finished;
    P.pShowQuizBody = P.pIsMeaning && !p.finished;
    P.pShowListenBody = (P.pIsListening||P.pIsContext) && !p.finished;
    P.pInputPlaceholder = P.pIsContext ? 'Nhập từ còn thiếu…' : 'Gõ từ bạn nghe được…';
    P.pShowQuizToggle = false;
    P.pQuizMode=p.quizMode; P.setQuizMode=this.setQuizMode;
    P.setMeaning=()=>this.setQuizMode('meaning'); P.setContext=()=>this.setQuizMode('context');
    P.qmMeaningBg = p.quizMode==='meaning'?'#5D6B2D':(this.state.dark?'#242A18':'#fff');
    P.qmMeaningInk = p.quizMode==='meaning'?'#FFF8EB':(this.state.dark?'#A9B189':'#7c8362');
    P.qmContextBg = p.quizMode==='context'?'#5D6B2D':(this.state.dark?'#242A18':'#fff');
    P.qmContextInk = p.quizMode==='context'?'#FFF8EB':(this.state.dark?'#A9B189':'#7c8362');
    P.pPosEn=this._posEn(card.posVi);
    P.pPromptMeaning=card.vi; P.pPromptContext=q.blank;
    if(P.pIsContext){ const parts=this._blankParts(q.idx); P.pPromptBefore=parts.before; P.pPromptAfter=parts.after; P.pInputSize=(card.word?card.word.length:8)+1; }
    else { P.pPromptBefore=''; P.pPromptAfter=''; P.pInputSize=10; }
    P.pLabel = P.pIsMeaning?'CHỌN TỪ TIẾNG ANH ĐÚNG' : P.pIsContext?'ĐIỀN TỪ VÀO CHỖ TRỐNG' : 'NGHE & GÕ TỪ TIẾNG ANH';
    P.pAnswered=p.answered;
    P.pOptions=q.options.map((w,k)=>{ let st='idle'; if(p.answered){ st = k===q.correct?'correct':(k===p.selected?'wrong':'dim'); } const s=this._optStyle(st);
      return { label:w, num:k+1, bg:s.bg, border:s.border, numBg:s.numBg, numInk:s.numInk, ink:s.ink,
        showCheck: p.answered&&k===q.correct, showX: p.answered&&k===p.selected&&k!==q.correct, pick:()=>this.quizAnswer(k) }; });
    // listening
    P.pInput=p.input; P.pHintShown=p.hintShown; P.pChecked=p.checked; P.pTypedCorrect=p.typedCorrect;
    P.pAnswerWord=card.word; P.pIpa=card.ipa; P.pVi=card.vi; P.pExample=card.exampleEn; P.pExampleVi=card.exampleVi;
    P.pTypedFeedback = p.checked ? (p.typedCorrect?'Chính xác! 🎉':'Đáp án đúng: '+card.word) : '';
    P.pTypedFbColor = p.typedCorrect?'#5D6B2D':'#C2693B';
    P.pInputBorder = p.checked ? (p.typedCorrect?'#5D6B2D':'#C2693B') : (this.state.dark?'rgba(255,255,255,.08)':'#E7E1CD');
    P.listeningInput=this.listeningInput; P.listeningHint=this.listeningHint; P.listeningSay=this.listeningSay;
    P.checkType=this.checkType; P.practiceNext=this.practiceNext;
    // letter hint slots (listening only — context types inline in the sentence)
    if(P.pIsListening){
      const ans=card.word; const typed=(p.input||'');
      P.pLetterSlots = ans.split('').map((ch,k)=>{
        const tch=typed[k]||'';
        let bg='#fff',border='#E7E1CD',ink='#c2c6ad',show='';
        if(p.checked){ const right=tch.toLowerCase()===ch.toLowerCase(); bg=right?'#E7F0DD':'#F7E7DE'; border=right?'#9DB87E':'#D8A78C'; ink=right?'#5D6B2D':'#b9694a'; show=ch; }
        else if(p.hintShown){ show = (k===0||k===ans.length-1)?ch:''; bg = show?'#FFF3D6':'#fff'; border = show?'#F4DFA8':'#E7E1CD'; ink='#9a5a14'; if(!show){ show=tch?tch:''; if(tch){ink='#1F1F1F';} } }
        else { show=tch; if(tch){ink='#1F1F1F';border='#D9D3BF';} }
        return { ch:show||'·', bg, border, ink };
      });
    } else { P.pLetterSlots=[]; }
    P.pHintHidden = P.pIsListening && !p.hintShown && !p.checked;
    P.pShowCheck = !p.checked;
    P.pShowNext = p.answered||p.checked;
    P.pNextLabel = (p.pos>=p.queue.length-1)?'Xem kết quả':'Câu tiếp theo';
    // result
    P.pCorrect=p.correct; P.pWrong=p.wrong;
    P.pAccuracy = p.queue.length?Math.round(p.correct/p.queue.length*100):0;
    P.pAccuracyW = P.pAccuracy+'%';
    P.pResultMatching=false; P.pResultQa=true;
    P.pResultEmoji = P.pAccuracy>=80?'🎉':(P.pAccuracy>=50?'🌱':'🌧️');
    P.pResultTitle = P.pAccuracy>=80?'Xuất sắc!':(P.pAccuracy>=50?'Khá tốt!':'Cần luyện thêm');
    P.pResultSub = p.wrong>0 ? (p.wrong+' từ làm sai đã được thêm vào mục Cần ôn tập.') : 'Bạn trả lời đúng tất cả. Quá đỉnh!';
    P.rStatA = String(p.correct); P.rStatALabel='Câu đúng';
    P.rStatB = String(p.wrong); P.rStatBLabel='Câu sai';
    P.rStatC = P.pAccuracy+'%'; P.rStatCLabel='Chính xác';
    return P;
  }

  _dashboardVals(){
    const dark=this.state.dark;
    const hc = dark ? ['rgba(255,255,255,.05)','#39491F','#5C722C','#88A23F','#E0A52E']
                    : ['#EAE6D6','#D8E1BF','#A9C07A','#7E9A45','#5D6B2D'];
    const realDays = this.state.statsData?.activeDays;
    const hist = realDays ?? (this.state.dashData?.history ?? {});
    // real activeDays are interaction COUNTS; dashData.history is minutes.
    const useCount = !!realDays;
    const heatLevel = (v: number) => v===0 ? 0 : useCount ? (v<3?1:v<6?2:v<11?3:4) : (v<15?1:v<30?2:v<60?3:4);
    const heatWeeks = Array.from({length:26}, (_,w) => ({
      days: Array.from({length:7}, (_,d) => {
        const date = new Date();
        date.setDate(date.getDate() - ((25-w)*7 + (6-d)));
        const key = date.getFullYear()+'-'+('0'+(date.getMonth()+1)).slice(-2)+'-'+('0'+date.getDate()).slice(-2);
        const lvl = heatLevel(hist[key] ?? 0);
        return { bg: hc[lvl] };
      })
    }));
    const monthLabelsList = ['TH1','TH2','TH3','TH4','TH5','TH6','TH7','TH8','TH9','TH10','TH11','TH12'];
    const sd = this.state.dashData?.skills;
    const toW = (v: any) => v==null ? '2%' : ((v/9)*100).toFixed(1)+'%';
    const skills = [
      {name:'Reading',   band: sd?.reading   != null ? String(sd.reading)   : '--', w: toW(sd?.reading),   color:'#5D6B2D'},
      {name:'Writing',   band: sd?.writing   != null ? String(sd.writing)   : '--', w: toW(sd?.writing),   color:'#C2693B'},
      {name:'Listening', band: sd?.listening != null ? String(sd.listening) : '--', w: toW(sd?.listening), color:'#E0A52E'},
      {name:'Speaking',  band: sd?.speaking  != null ? String(sd.speaking)  : '--', w: toW(sd?.speaking),  color:'#8AA04A'}
    ];
    const weekBars = [
      {label:'T1', val:21, h:'36%'},
      {label:'T2', val:8,  h:'14%'},
      {label:'T3', val:12, h:'20%'},
      {label:'T4', val:59, h:'100%'}
    ];
    const dayLabels = ['CN','T2','T3','T4','T5','T6','T7'];
    const flameDays = Array.from({length:7}, (_,k) => {
      const d = new Date(); d.setDate(d.getDate() - (6-k));
      const key = d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
      const label = dayLabels[d.getDay()];
      return { label, done: (hist[key] ?? 0) > 0, today: k===6 };
    });
    // xu hướng band (6 mốc) — sparkline
    const trend=[1.5,1.5,2.0,2.0,2.5,2.5]; const tmax=7, tmin=0;
    const tw=240, th=56;
    const pts=trend.map((v,i)=>{ const x=(i/(trend.length-1))*tw; const y=th-((v-tmin)/(tmax-tmin))*th; return [x,y]; });
    const trendLine=pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
    const trendArea='0,'+th+' '+trendLine+' '+tw+','+th;
    // đếm ngược kỳ thi
    const exam=new Date((this.state.examDateStr||'2027-06-28')+'T00:00:00'); const now=new Date();
    const examDays=Math.max(0,Math.ceil((exam-now)/86400000));
    const dotN=Math.min(examDays,540);
    const examDots=Array.from({length:dotN}).map((_,k)=>({
      op:(0.34+(1-k/Math.max(1,dotN-1))*0.66).toFixed(2),
      bg: k<7 ? '#EE9A23' : (this.state.dark?'#9FC46A':'#5D6B2D'),
      delay: ((k*0.022)%2.6).toFixed(2)+'s'
    }));
    const examDotsExtra = examDays>dotN ? ('+'+(examDays-dotN)) : '';
    const now2 = new Date();
    const today = now2.getDate();
    // Current month
    const curYear = now2.getFullYear(), curMonth = now2.getMonth();
    const dim = new Date(curYear, curMonth+1, 0).getDate();
    const firstDow = (new Date(curYear, curMonth, 1).getDay()+6)%7; // Monday=0
    // Previous month
    const prevDate = new Date(curYear, curMonth, 0);
    const dimPrev = prevDate.getDate();
    const firstDowPrev = (new Date(curYear, curMonth-1, 1).getDay()+6)%7;
    const monthNames = ['THÁNG 1','THÁNG 2','THÁNG 3','THÁNG 4','THÁNG 5','THÁNG 6','THÁNG 7','THÁNG 8','THÁNG 9','THÁNG 10','THÁNG 11','THÁNG 12'];
    const weekStart = new Date(now2); weekStart.setDate(weekStart.getDate() - 25*7 - 6);
    const months = Array.from({length:6}, (_,i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i*30); return monthLabelsList[d.getMonth()]; });

    const streakLen = this.state.statsData?.streak ?? this.state.dashData?.streak ?? 0;
    const streakStart = new Date(now2);
    streakStart.setDate(streakStart.getDate() - streakLen + 1);
    const streakStartKey = streakStart.getFullYear()+'-'+('0'+(streakStart.getMonth()+1)).slice(-2)+'-'+('0'+streakStart.getDate()).slice(-2);

    const genMonth = (dim: number, firstDow: number, isCurrentMonth: boolean, baseYear: number, baseMonth: number) => {
      const cells: any[] = [];
      for(let i=0;i<firstDow;i++) cells.push({blank:true, day:'', bg:'transparent', ring:'transparent', ink:'transparent', shadow:'none'});
      for(let d=1;d<=dim;d++){
        const future=isCurrentMonth && d>today;
        const key = baseYear+'-'+('0'+(baseMonth+1)).slice(-2)+'-'+('0'+d).slice(-2);
        const mins = future ? 0 : (hist[key] ?? 0);
        let lvl = future ? 0 : heatLevel(mins);
        const isToday=isCurrentMonth && d===today;

        const isStreak = !future && mins > 0 && key >= streakStartKey;
        let tileBg = future ? (dark?'rgba(255,255,255,.04)':'#F4F0E1') : hc[lvl];
        let ink = future ? (dark?'rgba(255,255,255,.32)':'#c9cdb6') : (lvl>=3?(dark?'#0F1A38':'#FFF8EB'):(dark?'#9FB0D8':'#6b7155'));
        if (isStreak) { tileBg = '#F6C453'; ink = '#2A3114'; }
        const shadow = isToday ? 'inset 0 0 0 2px #F6C453, 0 0 0 2px rgba(246,196,83,.35)' : 'none';
        cells.push({blank:false, day:String(d), bg:tileBg, ink, shadow, isToday, isStreak});
      }
      return cells;
    };

    const calendarMonths = [
      { label: `${monthNames[curMonth===0?11:curMonth-1]} · ${curMonth===0?curYear-1:curYear}`, cells: genMonth(dimPrev, firstDowPrev, false, curMonth===0?curYear-1:curYear, curMonth===0?11:curMonth-1) },
      { label: `${monthNames[curMonth]} · ${curYear}`, cells: genMonth(dim, firstDow, true, curYear, curMonth) }
    ];
    const bandOpts=['5.0','5.5','6.0','6.5','7.0','7.5','8.0','8.5','9.0'];
    const target=this.state.targetBand;
    const sfA="radial-gradient(1.6px 1.6px at 12% 20%,#EAF1FF,transparent),radial-gradient(2px 2px at 46% 32%,#FFFFFF,transparent),radial-gradient(1.4px 1.4px at 82% 24%,#EAF1FF,transparent),radial-gradient(1.5px 1.5px at 64% 72%,#DCE6FF,transparent),radial-gradient(1.3px 1.3px at 30% 84%,#FFFFFF,transparent)";
    const sfB="radial-gradient(1.2px 1.2px at 26% 56%,#CBD8F4,transparent),radial-gradient(1.5px 1.5px at 90% 60%,#FFFFFF,transparent),radial-gradient(1.2px 1.2px at 72% 40%,#EAF1FF,transparent),radial-gradient(1.3px 1.3px at 54% 14%,#DCE6FF,transparent),radial-gradient(1.1px 1.1px at 16% 70%,#EAF1FF,transparent)";
    const bandNowNum = this.state.dashData?.skills?.overall ?? 0;
    const bandTargetNum = parseFloat(this.state.targetBand) || 7.0;
    const bandRemainNum = Math.max(0, bandTargetNum - bandNowNum);

    return {
      dashStreak: this.state.statsData?.streak ?? this.state.dashData?.streak ?? this.props.streak?.currentStreak ?? 0,
      bandNow: String(bandNowNum || '--'), bandTarget:target, bandRemain: String(bandRemainNum.toFixed(1)), bandGoalW: bandNowNum > 0 ? ((bandNowNum / bandTargetNum) * 100).toFixed(1) + '%' : '2%',
      bandMenuOpen:this.state.bandMenuOpen, toggleBandMenu:this.toggleBandMenu,
      bandOptions: bandOpts.map(v=>({ v, sel:v===target, pick:()=>this.setTargetBand(v),
        bg: v===target?'#EEF1E2':'transparent', ink: v===target?'#5D6B2D':'#6b7155', weight: v===target?'800':'600' })),
      nightLayerDisp: this.state.dark?'block':'none',
      starFieldBgA:sfA, starFieldBgB:sfB,
      calendarMonths, monthLabel: `${monthNames[curMonth]} · ${curYear}`,
      examDots, examDotColor: dark?'#9FC46A':'#5D6B2D', examMonthsText: Math.round(examDays/30)+' tháng nữa',
      monthWeekdays:[{l:'T2'},{l:'T3'},{l:'T4'},{l:'T5'},{l:'T6'},{l:'T7'},{l:'CN'}],
      dashClouds:this.dashClouds,
      cloudHi: this.state.dark?'rgba(120,135,165,.45)':'#FFFFFF',
      cloudLo: this.state.dark?'rgba(50,65,95,.55)':'#E7ECF5',
      cloudLo2: this.state.dark?'rgba(55,70,100,.5)':'#EEF1F8',
      cloudShadow: this.state.dark?'drop-shadow(0 10px 14px rgba(0,0,0,.5))':'drop-shadow(0 10px 13px rgba(70,80,110,.16))',
      skills, weekBars, flameDays,
      heatWeeks, heatMonths:months, heatRowLabels:['','T2','','T4','','T6',''],
      recentHistory: (this.state.dashData?.recentHistory ?? []),
      trendLine, trendArea, trendW:tw, trendH:th,
      examDays:String(examDays), examDate:(('0'+exam.getDate()).slice(-2)+'/'+('0'+(exam.getMonth()+1)).slice(-2)+'/'+exam.getFullYear()),
      examDateValue:(this.state.examDateStr||'2027-06-28'), setExamDate:this.setExamDate, examDotsExtra,
      datePickerOpen:this.state.datePickerOpen, toggleDatePicker:this.toggleDatePicker,
      pickerPrev:()=>this.shiftPickerMonth(-1), pickerNext:()=>this.shiftPickerMonth(1),
      pickerTitle:(()=>{ const ym=this.state.pickerYM||{y:2027,m:5}; return ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'][ym.m]+' '+ym.y; })(),
      pickerWeekdays:[{l:'T2'},{l:'T3'},{l:'T4'},{l:'T5'},{l:'T6'},{l:'T7'},{l:'CN'}],
      pickerCells:(()=>{
        const ym=this.state.pickerYM||{y:2027,m:5};
        const first=new Date(ym.y,ym.m,1); let lead=(first.getDay()+6)%7; // Mon=0
        const dim=new Date(ym.y,ym.m+1,0).getDate();
        const sel=this.state.examDateStr||''; const t=new Date(); const todayKey=t.getFullYear()+'-'+('0'+(t.getMonth()+1)).slice(-2)+'-'+('0'+t.getDate()).slice(-2);
        const cells=[];
        for(let i=0;i<lead;i++) cells.push({blank:true, day:'', bg:'transparent', ink:'transparent', pick:()=>{}});
        for(let d=1;d<=dim;d++){
          const key=ym.y+'-'+('0'+(ym.m+1)).slice(-2)+'-'+('0'+d).slice(-2);
          const isSel=key===sel, isToday=key===todayKey;
          cells.push({ blank:false, day:String(d),
            bg: isSel?'#5D6B2D':'transparent',
            ink: isSel?'#FFF8EB':(isToday?'#C2693B':'#2A3114'),
            weight: (isSel||isToday)?'900':'600',
            pick:((yy,mm,dd)=>()=>this.pickExamDay(yy,mm,dd))(ym.y,ym.m,d) });
        }
        return cells;
      })(),
      vocabMastered:34, vocabTotal:50, vocabPct:'68%',
      vocabDash: (2*Math.PI*30).toFixed(1), vocabOffset: ((1-0.68)*2*Math.PI*30).toFixed(1),
      totalTests:'100', weakSkill:'Listening',
      heatLegend: dark ? ['rgba(255,255,255,.05)','#39491F','#5C722C','#88A23F','#E0A52E'] : ['#EAE6D6','#D8E1BF','#A9C07A','#7E9A45','#5D6B2D']
    };
  }

  renderVals(){
    const isReviewMode=this.state.practice&&this.state.practice.baseMode==='review';
    const reviewCount=(this.state.reviewList || []).length;
    const P=this._practiceVals(reviewCount);
    const i=this.state.index;
    const inFocus=Array.isArray(this.state.focus) && this.state.focus.length>0;
    const card=this.deck[i] || { word: '', ipa: '', posVi: '', vi: '', exampleEn: '', exampleVi: '', tag: '', syn: '' };
    const total=inFocus ? this.state.focus.length : Math.max(1, this.deck.length);
    const human=inFocus ? this.state.focusPos+1 : i+1;
    const pct=Math.round((human/total)*100);
    const starred=!!this.state.starred[i];
    const sd=this.state.statsData;
    const daily=(sd && Array.isArray(sd.daily)) ? sd.daily : [];
    const maxAdded=Math.max(1, ...daily.map((d: any)=>(d.learned||0)+(d.review||0)));
    const H=190;
    const bars=daily.map((d: any)=>{
      const added=(d.learned||0)+(d.review||0);
      return {
        day:d.label, added,
        learnedH:Math.round(((d.learned||0)/maxAdded)*H)+'px',
        reviewH:Math.round(((d.review||0)/maxAdded)*H)+'px'
      };
    });
    const totalAdded=sd?sd.wordsAdded:0;
    const totalLearned=sd?sd.known:0;
    const totalReview=sd?sd.due:0;
    const accuracyStr=(sd && sd.accuracy!=null)?sd.accuracy+'%':'—';
    const cols=['#F6C453','#5D6B2D','#EE9A23','#FFF8EB','#C2693B','#8AA04A','#E8B4A0'];
    const confettiPieces=this.state.confetti? Array.from({length:64}).map((_,k)=>({
      left:(Math.random()*100).toFixed(1)+'%',
      bg:cols[k%cols.length],
      delay:(Math.random()*0.5).toFixed(2)+'s',
      dur:(1.6+Math.random()*1.4).toFixed(2)+'s',
      size:(7+Math.random()*8).toFixed(0)+'px',
      radius: k%3===0?'50%':'2px'
    })):[];
    const miniConfettiPieces=this.state.miniConfetti? Array.from({length:32}).map((_,k)=>({
      left:(10+Math.random()*80).toFixed(1)+'%',
      bg:cols[k%cols.length],
      delay:(Math.random()*0.2).toFixed(2)+'s',
      dur:(1.0+Math.random()*0.8).toFixed(2)+'s',
      size:(6+Math.random()*6).toFixed(0)+'px',
      radius: k%3===0?'50%':'2px'
    })):[];
    return {
      navOverviewBg: this.state.view === 'dashboard' ? '#F6C453' : 'transparent',
      navOverviewInk: this.state.view === 'dashboard' ? '#2A3114' : (this.state.dark ? '#8A94B4' : '#C9D49C'),
      navOverviewWeight: this.state.view === 'dashboard' ? '800' : '600',
      navOverviewShadow: this.state.view === 'dashboard' ? '0 4px 0 rgba(0,0,0,.14)' : 'none',

      navSetsBg: this.state.view === 'sets' ? '#F6C453' : 'transparent',
      navSetsInk: this.state.view === 'sets' ? '#2A3114' : (this.state.dark ? '#8A94B4' : '#C9D49C'),
      navSetsWeight: this.state.view === 'sets' ? '800' : '600',
      navSetsShadow: this.state.view === 'sets' ? '0 4px 0 rgba(0,0,0,.14)' : 'none',

      navFlashBg: (this.state.view === 'study' || this.state.view === 'cards') ? '#F6C453' : 'transparent',
      navFlashInk: (this.state.view === 'study' || this.state.view === 'cards') ? '#2A3114' : (this.state.dark ? '#8A94B4' : '#C9D49C'),
      navFlashWeight: (this.state.view === 'study' || this.state.view === 'cards') ? '800' : '600',
      navFlashShadow: (this.state.view === 'study' || this.state.view === 'cards') ? '0 4px 0 rgba(0,0,0,.14)' : 'none',

      navStatsBg: this.state.view === 'stats' ? '#F6C453' : 'transparent',
      navStatsInk: this.state.view === 'stats' ? '#2A3114' : (this.state.dark ? '#8A94B4' : '#C9D49C'),
      navStatsWeight: this.state.view === 'stats' ? '800' : '600',
      navStatsShadow: this.state.view === 'stats' ? '0 4px 0 rgba(0,0,0,.14)' : 'none',

      navRoadmapBg: this.state.view === 'roadmap' ? '#F6C453' : 'transparent',
      navRoadmapInk: this.state.view === 'roadmap' ? '#2A3114' : (this.state.dark ? '#8A94B4' : '#C9D49C'),
      navRoadmapWeight: this.state.view === 'roadmap' ? '800' : '600',
      navRoadmapShadow: this.state.view === 'roadmap' ? '0 4px 0 rgba(0,0,0,.14)' : 'none',

      word:card.word, ipa:card.ipa, posVi:card.posVi, vi:card.vi,
      exampleEn:card.exampleEn, exampleVi:card.exampleVi, tag:card.tag, syn:card.syn,
      flipped:this.state.flipped,
      cardTransform:this.state.flipped?'rotateY(180deg)':'rotateY(0deg)',
      meaningTransform:this.state.flipped?'translateY(0%)':'translateY(-101%)',
      index:i, human, total,
      progressPct:pct, progressW:pct+'%',
      starred, starFill: starred?'#F6C453':'none', starStroke: starred?'#EE9A23':'#b6bb9c',
      starFill2: starred?'#2A3114':'none', starStroke2:'#2A3114',
      seenCount: Object.keys(this.state.seen).length,
      dark:this.state.dark, themeAttr:this.state.dark?'dark':'light', toggleDark:this.toggleDark,
      sunDisplay:this.state.dark?'none':'block', moonDisplay:this.state.dark?'block':'none',
      inkColor:this.state.dark?'#F3F1E6':'#2A3114', ink2Color:this.state.dark?'#9FA882':'#6b7155',
      appBg: this.state.dark ? '#1B1E13' : '#fff',
      sidebarBg: this.state.dark ? '#0E1A36' : '#46531F',
      sidebarGrad: this.state.dark ? 'linear-gradient(180deg,#16243f 0%,#0B1228 100%)' : 'linear-gradient(180deg,#52602A 0%,#3E4A1B 100%)',
      sidebarColor: this.state.dark ? '#C3CEE6' : '#E6E9D2',
      navSectionColor: this.state.dark ? '#7E875F' : '#8B946C',
      navUnselColor: this.state.dark ? '#8A94B4' : '#C9D49C',
      headerBg: this.state.dark ? '#1B1E13' : '#fff',
      headerBorder: this.state.dark ? 'rgba(255,255,255,.07)' : '#EFEAD8',
      searchBg: this.state.dark ? '#242A18' : '#F4F0E1',
      searchInk: this.state.dark ? '#9FA882' : '#9aa07f',
      searchKBtn: this.state.dark ? '#2C3320' : '#fff',
      searchKBorder: this.state.dark ? 'rgba(255,255,255,.07)' : '#E4DEC9',
      searchKColor: this.state.dark ? '#E7E3D2' : '#b6bb9c',
      panelBorder: this.state.dark ? 'rgba(255,255,255,.08)' : '#EFEAD8',
      panelHover: this.state.dark ? 'background:#242A18;' : 'background:#F4F0E1;',
      contentBg: this.state.dark ? '#181B10' : '#FFF8EB',
      nightCardBg: this.state.dark ? 'linear-gradient(165deg,#0F1A38 0%,#1B2C54 58%,#26437a 100%)' : '#fff',
      nightCardBorder: this.state.dark ? '#2C4474' : '#EFE7D2',
      nightCardShadow: this.state.dark ? '0 12px 34px -22px rgba(6,10,26,.9)' : '0 10px 30px -20px rgba(46,53,20,.4)',
      titleColor: this.state.dark ? '#9FA882' : '#a8ae8c',
      manifestSub: this.state.dark ? '#9FA882' : '#8a9170',
      streakSub: this.state.dark ? '#9FA882' : '#8a9170',
      dividerColor: this.state.dark ? 'rgba(255,255,255,.07)' : '#F2EEE0',
      monthCellBg: this.state.dark ? '#242A18' : '#fff',
      listHeaderBg: this.state.dark ? '#242A18' : '#FBF8EF',
      listBorder: this.state.dark ? 'rgba(255,255,255,.06)' : '#EFE7D2',
      listHover: this.state.dark ? 'background:rgba(255,255,255,.03);' : 'background:#FBF8EF;',
      listBtnBg: this.state.dark ? 'rgba(255,255,255,.08)' : '#EEF1E2',
      listBtnInk: this.state.dark ? '#A9B189' : '#5D6B2D',
      
      cardFrontBg: this.state.dark?'linear-gradient(165deg,#0F1A38 0%,#1B2C54 58%,#26437a 100%)':'#F6C453',
      cardBorder: this.state.dark?'#2E4576':'#e3b13f',
      cardShadow: this.state.dark?'0 26px 50px -22px rgba(6,10,26,.8),0 2px 0 #16213f':'0 26px 50px -22px rgba(238,154,83,.55),0 2px 0 #e3b13f',
      cardInk: this.state.dark?'#F4F7FF':'#1F1F1F',
      cardSub: this.state.dark?'#9DB2E0':'#7a4f12',
      cardHint: this.state.dark?'#9DB2E0':'#9a5a14',
      cardChipBg: this.state.dark?'rgba(255,255,255,.12)':'rgba(42,49,20,.14)',
      cardChipInk: this.state.dark?'#CBD8F4':'#5a3c0a',
      sunBlobDisp: this.state.dark?'none':'block', sunFaceDisp: this.state.dark?'none':'flex',
      moonDisp: this.state.dark?'flex':'none', starsDisp: this.state.dark?'block':'none',
      cardStars: this.cardStars,
      comets: [
        {top:'14%', left:'68%', len:'70px', dur:'7s',  delay:'0s'},
        {top:'40%', left:'90%', len:'54px', dur:'9s',  delay:'3.5s'},
        {top:'70%', left:'52%', len:'62px', dur:'11s', delay:'6s'}
      ],
      navOpen:this.state.navOpen, toggleNav:this.toggleNav,
      sidebarCol: this.state.navOpen?'250px 1fr':'78px 1fr',
      navHeaderJustify: this.state.navOpen?'space-between':'center',
      navBrandFlex: this.state.navOpen?'flex':'none',
      navTogRot: this.state.navOpen?'none':'rotate(180deg)',
      navSectionDisp: this.state.navOpen?'block':'none',
      navLabelDisp: this.state.navOpen?'inline':'none',
      navBadgeDisp: this.state.navOpen?'inline-flex':'none',
      navItemJustify: this.state.navOpen?'flex-start':'center',
      navBarsDisp: this.state.navOpen?'flex':'none',
      cloudColor: this.state.dark?'rgba(150,175,225,.16)':'#FFFFFF',
      cloudOpacity: this.state.dark?'0.5':'0.85',
      autoPlay:this.state.autoPlay,
      autoKnobLeft: this.state.autoPlay?'23px':'3px',
      autoTrackBg: this.state.autoPlay?'#5D6B2D':'#D8D2BE',
      toggleAutoPlay:this.toggleAutoPlay,
      showStats:this.state.showStats, openStats:this.openStats, closeStats:this.closeStats, stop:this.stop,
      bars, totalAdded, totalLearned, totalReview, accuracy:accuracyStr,
      flip:this.flip, next:this.next, prev:this.prev, toggleStar:this.toggleStar,
      speak:this.speak, speakBtn:this.speakBtn, starBtn:this.starBtn, jumpTo:this.jumpTo,
      showConfetti:this.state.confetti, closeConfetti:this.closeConfetti, confettiPieces, miniConfettiPieces,
      masteryPct:'68%', masteryW:'68%',
      reviewCount, reviewBadge:String(reviewCount), hasMistakes:reviewCount>0,
      reviewBadgeBg: reviewCount>0?'rgba(238,154,35,.32)':'rgba(255,255,255,.12)',
      isDashboard:this.state.view==='dashboard', isStudy:this.state.view==='study',
      isStats:this.state.view==='stats',
      isRoadmap: this.state.view === 'roadmap',
      roadmap: this.state.roadmap,
      roadmapLoading: this.state.roadmapLoading,
      roadmapActionLoading: this.state.roadmapActionLoading,
      roadmapCurrentBand: this.state.roadmapCurrentBand,
      roadmapTargetBand: this.state.roadmapTargetBand,
      roadmapDailyHours: this.state.roadmapDailyHours,
      roadmapTargetDate: this.state.roadmapTargetDate,
      roadmapFocusSkills: this.state.roadmapFocusSkills,
      roadmapIsGenerating: this.state.roadmapIsGenerating,
      roadmapGenerationStep: this.state.roadmapGenerationStep,
      roadmapGenerationProgress: this.state.roadmapGenerationProgress,
      roadmapActivePhaseTab: this.state.roadmapActivePhaseTab,
      roadmapIsEditingGoals: this.state.roadmapIsEditingGoals,
      
      fetchRoadmap: this._fetchRoadmap,
      handleRoadmapSkillsChange: this._handleRoadmapSkillsChange,
      startRoadmapAIGeneration: this._startRoadmapAIGeneration,
      activateRoadmap: this._activateRoadmap,
      toggleRoadmapTask: this._toggleRoadmapTask,
      resetRoadmap: this._resetRoadmap,
      setRoadmapState: (updates: any) => this.setState(updates),

      isDaily: this.state.view === 'daily',
      dailyTasks: this.state.dailyTasks,
      dailyTasksLoading: this.state.dailyTasksLoading,
      dailyTasksError: this.state.dailyTasksError,
      dailyTasksCompletingId: this.state.dailyTasksCompletingId,
      fetchDailyTasks: this._fetchDailyTasks,
      handleCompleteDailyTask: this._handleCompleteDailyTask,
      
      navDailyBg: this.state.view === 'daily' ? '#F6C453' : 'transparent',
      navDailyInk: this.state.view === 'daily' ? '#2A3114' : (this.state.dark ? '#8A94B4' : '#C9D49C'),
      navDailyWeight: this.state.view === 'daily' ? '800' : '600',
      navDailyShadow: this.state.view === 'daily' ? '0 4px 0 rgba(0,0,0,.14)' : 'none',
      goDaily: () => {
        this.setView('daily');
        try {
          window.history.pushState(null, '', this._getLocaleUrl('/learning/daily'));
        } catch(e) {}
      },

      goDashboard: () => {
        this.setView('dashboard');
        try {
          window.history.pushState(null, '', this._getLocaleUrl('/profile'));
        } catch(e) {}
      },
      goStats: () => {
        this._fetchStats();
        this.setView('stats');
        try {
          window.history.pushState(null, '', this._getLocaleUrl('/profile?view=stats'));
        } catch(e) {}
      },
      goSets: () => {
        this.setView('sets');
        try {
          window.history.pushState(null, '', this._getLocaleUrl('/profile?view=sets'));
        } catch(e) {}
      },
      goStudy: () => {
        this.goStudy();
        try {
          window.history.pushState(null, '', this._getLocaleUrl('/profile?view=study'));
        } catch(e) {}
      },
      goEditProfile: () => {
        this.setView('editProfile');
        try {
          window.history.pushState(null, '', this._getLocaleUrl('/profile?edit=true'));
        } catch(e) {}
      },
      goRoadmap: () => {
        this.setView('roadmap');
        try {
          window.history.pushState(null, '', this._getLocaleUrl('/roadmap'));
        } catch(e) {}
      },
      isSets:this.state.view==='sets', goSets:this.goSets,
      setsSummary: this.wordSets.length+' bộ · '+this.wordSets.reduce((a,w)=>a+w.count,0)+' từ',
      setCards: [...this.wordSets.filter(w=>w.personal), ...this.wordSets.filter(w=>!w.personal)].map((ws,i)=>{
        const stat = this.state.dashData?.vocabStats?.[ws.id];
        const rating = stat && stat.attempts > 0 ? stat.avgScore.toFixed(1) : ws.rating;
        return {
        id:ws.id, label:ws.label, desc:ws.desc, count:ws.count, icon:ws.icon, kicker:ws.kicker,
        color:ws.color, deep:ws.deep, rating: rating, pattern:this.cardPatterns[i%this.cardPatterns.length],
        masteryPct:(ws.personal?0:this._computeMastery(parseInt(ws.id)))+'%', current:ws.id===this.state.currentSet,
        currentDisp:(ws.id===this.state.currentSet&&!ws.personal)?'inline-flex':'none',
        statsDisp: ws.personal?'none':'inline-flex',
        personalDisp: ws.personal?'inline-flex':'none',
        texSize:'280px', grid:'grid-column:span 2;', headSize:'25px',
        open: ws.personal? (()=>this.goPersonal()) : (()=>this.openSet(ws.id))
        };
      }),
      isPersonal:this.state.view==='personal', goPersonal:this.goPersonal,
      personalFolders: this.state.personalFolders.map((f, i)=>{
        const c = FOLDER_COLORS[i % FOLDER_COLORS.length];
        return {
          id:f.id, name:f.name,
          date:f.created_at?new Date(f.created_at).toLocaleDateString('vi-VN',{day:'numeric',month:'short',year:'numeric'}):'',
          count:f.word_count||0, color:c.color, deep:c.deep,
          open:()=>this._openFolderView(f.id, f.name, i % FOLDER_COLORS.length)
        };
      }),
      personalTotal: this.state.personalFolders.reduce((a,f)=>a+(f.word_count||0),0),
      personalFolderCount: this.state.personalFolders.length,
      isFolderDetail: this.state.view==='folderDetail',
      folderDetailName: this.state.activeFolderName,
      folderDetailWords: this.state.folderWords.map(w => ({
          ...w,
          speak: (e: any) => { if(e&&e.stopPropagation) e.stopPropagation(); this._say(w.word); }
      })),
      folderDetailLoading: this.state.folderWordsLoading,
      folderDetailColor: FOLDER_COLORS[this.state.activeFolderColorIdx]?.color||'#E08A2C',
      folderDetailDeep: FOLDER_COLORS[this.state.activeFolderColorIdx]?.deep||'#C2693B',
      goBackToPersonal: ()=>this.setState({view:'personal'}),
      openFolderAddWordModal: ()=>this.setState({addWordModalOpen:true,addWordInput:'',addWordResults:[],addWordError:'',addWordFetchLoading:false,addWordSaveLoading:false}),
      deleteFolderWord: (id)=>this._deleteFolderWord(id),
      startRenameFolderDetail: this.state.activeFolderId === 'general' ? null : ()=>this.setState({renameFolderModalOpen:true,renameFolderInput:this.state.activeFolderName}),
      deleteFolderDetail: this.state.activeFolderId === 'general' ? null : ()=>this._deleteFolderDetail(),
      studyFolderWords: ()=>this._studyFolderWords(),
      navAvatarUrl: this.state.avatarUrlOverride || this.props.avatarUrl || '',
      openImportModal: () => this.setState({ importModalOpen: true }),
      createNewFolder: () => this.setState({ createFolderOpen: true, createFolderName: '', createFolderError: '' }),
      goEditProfile:    () => { this.setState({ view: 'editProfile' }); },
      cancelEditProfile: () => { this.setState({ view: 'dashboard', profileError: '', profileSuccess: '' }); },
      isAdmin: this.state.isAdminLive || this.props.role === 'ADMIN' || this.props.role === 'INSTRUCTOR',
      goAdmin:          () => { const seg=window.location.pathname.split('/')[1]; const lc=(seg==='en'||seg==='vi')?`/${seg}`:''; window.location.href=`${lc}/admin`; },
      goVocabNotebook:  () => { window.location.href = this._getLocaleUrl('/practice/vocabulary/notebook'); },
      goDiagnostic:     () => { window.location.href = this._getLocaleUrl('/orientation'); },
      goRoadmap:        () => { window.location.href = this._getLocaleUrl('/roadmap'); },
      openProfilePanel:  () => this.setState({ activePanel: 'profile',   panelError: '', panelSuccess: '' }),
      openAvatarPanel:   () => this.setState({ activePanel: 'avatar',    panelError: '', panelSuccess: '' }),
      openPasswordPanel: () => this.setState({ activePanel: 'password',  panelError: '', panelSuccess: '' }),
      closePanel:        () => this.setState({ activePanel: null, panelLoading: false, panelError: '', panelSuccess: '' }),
      ...this._dashboardVals(),
      startTidians:()=> {
        let sourceIdx = this.deck.map((_,k)=>k);
        // If we are viewing a specific list (like known/unknown/review), scope to that list
        if (this.state.view === 'lists') {
            const kind = this.state.listKind;
            const src = kind==='known'? this.state.known : kind==='unknown'? this.state.unknown : (this.state.reviewList || []);
            sourceIdx = src.filter((i: number)=>this.deck[i]);
        }
        if(!sourceIdx.length) return;
        this.setState({ tidiansSelectionOpen: true, tidiansCandidates: sourceIdx });
      },
      startQuiz:()=>this.startPractice('quiz'),
      startListening:()=>this.startPractice('listening'),
      startBlank:()=>this.startPractice('blank'),
      startMixed:()=>this.startPractice('mixed'),
      markKnown:this.markKnown, markUnknown:this.markUnknown,
      knownCount:this.state.known.length,
      unknownCount:this.state.unknown.length,
      showKnownTab:this.showKnownTab, closeKnownTab:this.closeKnownTab,
      showKnownTabKnown:()=>this.goList('known'),
      showKnownTabUnknown:()=>this.goList('unknown'),
      goReview:()=>this.goList('review'),
      isLists:this.state.view==='lists',
      ...this._listVals(),
      setMenuRot: this.state.setMenuOpen?'rotate(180deg)':'none',
      knownTabOpen: !!this.state.knownTab,
      knownTabIsKnown: this.state.knownTab==='known',
      knownTabTitle: this.state.knownTab==='known'?'Đã nhớ':'Chưa nhớ',
      knownTabAccent: this.state.knownTab==='known'?'#5D6B2D':'#C2693B',
      knownTabBg: this.state.knownTab==='known'?'#EEF1E2':'#F7E7DE',
      knownTabList: (this.state.knownTab==='known'?this.state.known:(this.state.knownTab==='unknown'?this.state.unknown:[])).map((i: number)=>({
        word:this.deck[i]?this.deck[i].word:'', vi:this.deck[i]?this.deck[i].vi:'', posVi:this.deck[i]?this.deck[i].posVi:'', ipa:this.deck[i]?this.deck[i].ipa:'', pos:this.deck[i]?this._posShort(this.deck[i].posVi):'',
        speak:(e: any)=>{ if(e&&e.stopPropagation) e.stopPropagation(); if(this.deck[i]) this._say(this.deck[i].word); },
        go:()=>this.setState({index:i, flipped:false, knownTab:null, view:'cards', focus:null, focusPos:0}) })),
      knownTabEmpty: (this.state.knownTab==='known'?this.state.known:(this.state.knownTab==='unknown'?this.state.unknown:[])).length===0,
      setMenuOpen:this.state.setMenuOpen, toggleSetMenu:this.toggleSetMenu,
      currentSetLabel:this.setLabels[this.state.currentSet]||'Môi trường',
      setOptions:this.wordSets.map(ws=>({ id:ws.id, label:ws.label, count:ws.count, icon:ws.icon,
        sel:ws.id===this.state.currentSet, pick:()=>this.pickSet(ws.id),
        bg: ws.id===this.state.currentSet?'#EEF1E2':'transparent',
        ink: ws.id===this.state.currentSet?'#5D6B2D':'#3E4A1B',
        weight: ws.id===this.state.currentSet?'800':'600' })),
      reviewMistakes:this.reviewMistakes,
      isEditProfile: this.state.view==='editProfile',
      profileName: this.state.profileName,
      profilePhone: this.state.profilePhone,
      profileBio: this.state.profileBio,
      profileInAppReminders: this.state.profileInAppReminders,
      profileEmailReminders: this.state.profileEmailReminders,
      profileStreakWarning: this.state.profileStreakWarning,
      profileLoading: this.state.profileLoading,
      profileError: this.state.profileError,
      profileSuccess: this.state.profileSuccess,
      setProfileName: (v)=>this.setState({profileName:v}),
      setProfilePhone: (v)=>this.setState({profilePhone:v}),
      setProfileBio: (v)=>this.setState({profileBio:v}),
      toggleProfileInAppReminders: ()=>this.setState(s=>({profileInAppReminders:!s.profileInAppReminders})),
      toggleProfileEmailReminders: ()=>this.setState(s=>({profileEmailReminders:!s.profileEmailReminders})),
      toggleProfileStreakWarning: ()=>this.setState(s=>({profileStreakWarning:!s.profileStreakWarning})),
      saveProfile: (e)=>this._saveProfile(e),
      ...P
    };
  }

  render() {
    if (this.state.vocabSetsLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FDFBF7', color: '#5D6B2D', fontFamily: "'Nunito', sans-serif" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
            <h2 style={{ margin: 0, fontSize: '20px' }}>Đang tải bộ từ vựng...</h2>
          </div>
        </div>
      );
    }

    return (
      <React.Fragment>
        <ScoutTemplate userName={this.props.userName} {...this.renderVals()} />
        {this.state.importModalOpen && (
          <ImportVocabularyModal 
            onClose={() => this.setState({ importModalOpen: false })} 
            onImported={() => {
              this.setState({ importModalOpen: false });
              this._fetchPersonalFolders();
            }} 
          />
        )}
        {this.state.createFolderOpen && (
          <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={()=>this.setState({createFolderOpen:false,createFolderError:''})}>
            <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.55)',backdropFilter:'blur(6px)'}}></div>
            <div style={{position:'relative',background:this.state.dark?'#242A18':'#FFFDF6',border:this.state.dark?'1px solid rgba(255,255,255,.1)':'1px solid #E4DEC9',borderRadius:'24px',padding:'32px',width:'100%',maxWidth:'420px',boxShadow:'0 32px 80px rgba(0,0,0,.4)',animation:'panelSlideIn .25s ease both'}} onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'24px'}}>
                <div style={{width:'46px',height:'46px',borderRadius:'14px',background:'#5D6B2D',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 0 #46531F',flexShrink:0}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF8EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>
                </div>
                <div>
                  <h3 style={{fontFamily:'Nunito,sans-serif',fontWeight:900,fontSize:'20px',margin:0,color:this.state.dark?'#F3F1E6':'#2A3114'}}>Tạo thư mục mới</h3>
                  <p style={{fontSize:'13px',fontWeight:600,color:this.state.dark?'#7E875F':'#9aa07f',margin:'3px 0 0'}}>Đặt tên để nhóm từ vựng của bạn</p>
                </div>
              </div>
              <label style={{display:'block',fontSize:'12px',fontWeight:800,color:this.state.dark?'#7E875F':'#9aa07f',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'.08em'}}>Tên thư mục</label>
              <input
                autoFocus
                value={this.state.createFolderName}
                onChange={e=>this.setState({createFolderName:e.target.value,createFolderError:''})}
                onKeyDown={e=>{ if(e.key==='Enter') this._submitCreateFolder(); if(e.key==='Escape') this.setState({createFolderOpen:false,createFolderError:''}); }}
                placeholder="Ví dụ: IELTS Academic, Từ vựng Y tế..."
                maxLength={60}
                style={{width:'100%',background:this.state.dark?'rgba(255,255,255,.07)':'#FBF8EF',border:this.state.dark?'1.5px solid rgba(255,255,255,.15)':'1.5px solid #D9CDB5',borderRadius:'12px',color:this.state.dark?'#F3F1E6':'#2A3114',fontFamily:'Nunito,sans-serif',fontWeight:700,fontSize:'16px',padding:'13px 16px',outline:'none',boxSizing:'border-box',transition:'border-color .15s'}}
              />
              {this.state.createFolderError && (
                <div style={{fontSize:'13px',fontWeight:700,color:'#FF7A7A',marginTop:'8px'}}>{this.state.createFolderError}</div>
              )}
              <div style={{display:'flex',gap:'10px',marginTop:'22px'}}>
                <button
                  onClick={()=>this._submitCreateFolder()}
                  disabled={this.state.createFolderLoading}
                  style={{flex:1,background:'#5D6B2D',border:'none',borderRadius:'14px',color:'#FFF8EB',padding:'13px 0',fontFamily:'Nunito,sans-serif',fontWeight:900,fontSize:'15px',cursor:'pointer',boxShadow:'0 4px 0 #46531F',opacity:this.state.createFolderLoading?.6:1,transition:'opacity .15s'}}
                >
                  {this.state.createFolderLoading?'Đang tạo...':'Tạo thư mục'}
                </button>
                <button
                  onClick={()=>this.setState({createFolderOpen:false,createFolderName:'',createFolderError:''})}
                  style={{background:this.state.dark?'rgba(255,255,255,.08)':'#F0EAD8',border:'none',borderRadius:'14px',color:this.state.dark?'#a8ae8c':'#6b7155',padding:'13px 20px',fontFamily:'Nunito,sans-serif',fontWeight:800,fontSize:'15px',cursor:'pointer'}}
                >
                  Huỷ
                </button>
              </div>
            </div>
          </div>
        )}
        {this.state.addWordModalOpen && (() => {
          const dk = this.state.dark;
          const bg = dk?'#242A18':'#FFFDF6';
          const bdr = dk?'1px solid rgba(255,255,255,.1)':'1px solid #E4DEC9';
          const ink = dk?'#F3F1E6':'#2A3114';
          const ink2 = dk?'#9FA882':'#6b7155';
          const inputBg = dk?'rgba(255,255,255,.07)':'#FBF8EF';
          const inputBdr = dk?'1.5px solid rgba(255,255,255,.12)':'1.5px solid #D9CDB5';
          const inputStyle = {width:'100%',background:inputBg,border:inputBdr,borderRadius:'10px',color:ink,fontFamily:'Nunito,sans-serif',fontWeight:700,fontSize:'14px',padding:'10px 13px',outline:'none',boxSizing:'border-box' as const};
          const labelStyle = {display:'block',fontSize:'11px',fontWeight:800,color:ink2,marginBottom:'5px',textTransform:'uppercase' as const,letterSpacing:'.08em'};
          const results = this.state.addWordResults;
          const hasResults = results.length > 0;
          const saveable = results.filter(r=>!r.saved&&!r.error&&r.viDef?.trim()&&r.example?.trim());
          return (
          <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={()=>this.setState({addWordModalOpen:false})}>
            <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.6)',backdropFilter:'blur(8px)'}}></div>
            <div style={{position:'relative',background:bg,border:bdr,borderRadius:'24px',padding:'28px',width:'100%',maxWidth:hasResults?'640px':'440px',maxHeight:'88vh',overflowY:'auto',boxShadow:'0 32px 80px rgba(0,0,0,.45)',animation:'panelSlideIn .25s ease both',transition:'max-width .3s ease'}} onClick={e=>e.stopPropagation()}>

              {/* Header */}
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
                <div style={{width:'38px',height:'38px',borderRadius:'11px',background:'#5D6B2D',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 3px 0 #46531F',flexShrink:0}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF8EB" strokeWidth="2.2"><path d="M12 3v12M8 11l4 4 4-4"/><path d="M5 21h14"/></svg>
                </div>
                <div>
                  <div style={{fontFamily:'Nunito,sans-serif',fontWeight:900,fontSize:'16px',color:ink}}>Thêm từ vào "{this.state.activeFolderName}"</div>
                  <div style={{fontSize:'12px',fontWeight:600,color:ink2,marginTop:'2px'}}>Nhập tiếng Anh — hệ thống tự tra nghĩa</div>
                </div>
              </div>

              {/* Step 1: Input */}
              {!hasResults && (
                <div>
                  <label style={labelStyle}>Từ vựng (mỗi dòng hoặc cách nhau bằng dấu phẩy)</label>
                  <textarea
                    autoFocus
                    value={this.state.addWordInput}
                    onChange={e=>this.setState({addWordInput:e.target.value,addWordError:''})}
                    placeholder={'ubiquitous\nambiguous, resilient\ncoherent'}
                    rows={5}
                    style={{...inputStyle,resize:'vertical',lineHeight:'1.6',fontSize:'15px'}}
                  />
                  {this.state.addWordError && <div style={{fontSize:'13px',fontWeight:700,color:'#FF7A7A',marginTop:'8px'}}>{this.state.addWordError}</div>}
                  <div style={{display:'flex',gap:'10px',marginTop:'18px'}}>
                    <button onClick={()=>this._lookupWords()} disabled={this.state.addWordFetchLoading}
                      style={{flex:1,background:'#5D6B2D',border:'none',borderRadius:'14px',color:'#FFF8EB',padding:'13px 0',fontFamily:'Nunito,sans-serif',fontWeight:900,fontSize:'15px',cursor:'pointer',boxShadow:'0 4px 0 #46531F',opacity:this.state.addWordFetchLoading?.6:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                      {this.state.addWordFetchLoading
                        ? <><div style={{width:'16px',height:'16px',border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'tidSpin .7s linear infinite'}}></div>Đang tra cứu...</>
                        : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>Tra cứu tự động</>}
                    </button>
                    <button onClick={()=>this.setState({addWordModalOpen:false})}
                      style={{background:dk?'rgba(255,255,255,.08)':'#F0EAD8',border:'none',borderRadius:'14px',color:ink2,padding:'13px 20px',fontFamily:'Nunito,sans-serif',fontWeight:800,fontSize:'15px',cursor:'pointer'}}>
                      Huỷ
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Results */}
              {hasResults && (
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                    <button onClick={()=>this.setState({addWordResults:[],addWordInput:this.state.addWordInput})}
                      style={{display:'inline-flex',alignItems:'center',gap:'5px',background:'none',border:'none',color:ink2,fontFamily:'Nunito,sans-serif',fontWeight:700,fontSize:'13px',cursor:'pointer',padding:0}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6"/></svg>
                      Nhập lại
                    </button>
                    <span style={{fontSize:'13px',fontWeight:700,color:ink2}}>{results.length} từ · {saveable.length} sẵn sàng lưu</span>
                  </div>

                  <div style={{display:'flex',flexDirection:'column',gap:'12px',marginBottom:'18px'}}>
                    {results.map((r,i)=>(
                      <div key={i} style={{background:dk?'rgba(255,255,255,.05)':'rgba(0,0,0,.04)',border:r.saved?'1.5px solid #5D6B2D':r.error||r.duplicate?'1.5px solid rgba(255,80,80,.4)':inputBdr,borderRadius:'14px',padding:'14px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                          {r.loading
                            ? <div style={{width:'14px',height:'14px',border:'2px solid rgba(255,255,255,.2)',borderTopColor:'#5D6B2D',borderRadius:'50%',animation:'tidSpin .7s linear infinite',flexShrink:0}}></div>
                            : r.saved
                              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5D6B2D" strokeWidth="2.8"><path d="M20 6L9 17l-5-5"/></svg>
                              : r.error||r.duplicate
                                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF8080" strokeWidth="2.8"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5D6B2D" strokeWidth="2.4"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                          }
                          <span style={{fontFamily:'Nunito,sans-serif',fontWeight:900,fontSize:'16px',color:ink}}>{r.word}</span>
                          {r.pos && <span style={{fontSize:'10px',fontWeight:800,background:'rgba(93,107,45,.25)',color:'#a8c45a',borderRadius:'5px',padding:'2px 7px',textTransform:'uppercase'}}>{r.pos}</span>}
                          {r.audioUrl && !r.loading && (
                            <button onClick={()=>{ const a=new Audio(r.audioUrl); a.play(); }}
                              title="Nghe phát âm"
                              style={{background:'rgba(93,107,45,.2)',border:'none',borderRadius:'7px',padding:'4px 7px',cursor:'pointer',display:'flex',alignItems:'center',color:'#a8c45a'}}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                            </button>
                          )}
                          {r.saved && <span style={{fontSize:'11px',fontWeight:800,color:'#5D6B2D',marginLeft:'auto'}}>✓ Đã lưu</span>}
                          {(r.error||r.duplicate) && <span style={{fontSize:'11px',fontWeight:700,color:'#FF8080',marginLeft:'auto'}}>{r.error||r.duplicate}</span>}
                        </div>
                        {!r.loading && !r.saved && (
                          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                            <div>
                              <label style={{...labelStyle,marginBottom:'4px'}}>Nghĩa tiếng Việt</label>
                              <input value={r.viDef} onChange={e=>this._updateWordResult(i,'viDef',e.target.value)} placeholder="Nhập nghĩa..." style={{...inputStyle,fontSize:'13px',padding:'8px 11px'}}/>
                            </div>
                            {r.enDef && <div style={{fontSize:'12px',fontWeight:600,color:ink2,fontStyle:'italic',lineHeight:'1.4',padding:'0 2px'}}>📖 {r.enDef}</div>}
                            <div>
                              <label style={{...labelStyle,marginBottom:'4px'}}>Ví dụ (kèm ví dụ để có thể lưu)</label>
                              <textarea value={r.example} onChange={e=>this._updateWordResult(i,'example',e.target.value)} placeholder="Nhập ví dụ..." style={{...inputStyle,fontSize:'13px',padding:'8px 11px',height:'60px'}}/>
                            </div>
                            {!r.viDef?.trim() || !r.example?.trim() ? (
                               <div style={{fontSize:'12px',fontWeight:700,color:'#FF8080'}}>Thiếu định nghĩa hoặc ví dụ. Vui lòng bổ sung để có thể lưu.</div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{display:'flex',gap:'10px'}}>
                    <button onClick={()=>this._saveWordResults()} disabled={this.state.addWordSaveLoading||saveable.length===0}
                      style={{flex:1,background:'#5D6B2D',border:'none',borderRadius:'14px',color:'#FFF8EB',padding:'13px 0',fontFamily:'Nunito,sans-serif',fontWeight:900,fontSize:'15px',cursor:saveable.length?'pointer':'not-allowed',boxShadow:'0 4px 0 #46531F',opacity:(this.state.addWordSaveLoading||!saveable.length)?.5:1}}>
                      {this.state.addWordSaveLoading?'Đang lưu...':`Lưu ${saveable.length} từ`}
                    </button>
                    <button onClick={()=>this.setState({addWordModalOpen:false,addWordResults:[]})}
                      style={{background:dk?'rgba(255,255,255,.08)':'#F0EAD8',border:'none',borderRadius:'14px',color:ink2,padding:'13px 20px',fontFamily:'Nunito,sans-serif',fontWeight:800,fontSize:'15px',cursor:'pointer'}}>
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          );
        })()}
        {this.state.duplicatePrompt && (() => {
          const dk = this.state.dark;
          const bg = dk?'#242A18':'#FFFDF6';
          const bdr = dk?'1px solid rgba(255,255,255,.1)':'1px solid #E4DEC9';
          const ink = dk?'#F3F1E6':'#2A3114';
          const ink2 = dk?'#9FA882':'#6b7155';
          return (
          <div style={{position:'fixed',inset:0,zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
            <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.6)',backdropFilter:'blur(8px)'}}></div>
            <div style={{position:'relative',background:bg,border:bdr,borderRadius:'24px',padding:'28px',width:'100%',maxWidth:'400px',boxShadow:'0 32px 80px rgba(0,0,0,.45)',animation:'panelSlideIn .25s ease both',textAlign:'center'}} onClick={e=>e.stopPropagation()}>
              <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'rgba(255,128,128,.15)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF8080" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h3 style={{fontFamily:'Nunito,sans-serif',fontWeight:900,fontSize:'18px',margin:'0 0 8px',color:ink}}>Từ đã có trong sổ</h3>
              <p style={{fontSize:'14px',fontWeight:600,color:ink2,margin:'0 0 24px',lineHeight:'1.5'}}>
                Từ "<strong style={{color:ink,fontWeight:800}}>{this.state.duplicatePrompt.word}</strong>" đã tồn tại trong sổ từ vựng của bạn.<br/><br/>Bạn có muốn add vào lại không?
              </p>
              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={()=>this.state.duplicatePrompt?.resolve(true)}
                  style={{flex:1,background:'#FF8080',border:'none',borderRadius:'14px',color:'#fff',padding:'13px 0',fontFamily:'Nunito,sans-serif',fontWeight:900,fontSize:'15px',cursor:'pointer'}}>
                  Add lại
                </button>
                <button onClick={()=>this.state.duplicatePrompt?.resolve(false)}
                  style={{flex:1,background:dk?'rgba(255,255,255,.08)':'#F0EAD8',border:'none',borderRadius:'14px',color:ink2,padding:'13px 0',fontFamily:'Nunito,sans-serif',fontWeight:800,fontSize:'15px',cursor:'pointer'}}>
                  Huỷ
                </button>
              </div>
            </div>
          </div>
          );
        })()}
        {this.state.renameFolderModalOpen && (
          <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={()=>this.setState({renameFolderModalOpen:false})}>
            <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.55)',backdropFilter:'blur(6px)'}}></div>
            <div style={{position:'relative',background:this.state.dark?'#242A18':'#FFFDF6',border:this.state.dark?'1px solid rgba(255,255,255,.1)':'1px solid #E4DEC9',borderRadius:'24px',padding:'32px',width:'100%',maxWidth:'420px',boxShadow:'0 32px 80px rgba(0,0,0,.4)',animation:'panelSlideIn .25s ease both'}} onClick={e=>e.stopPropagation()}>
              <h3 style={{fontFamily:'Nunito,sans-serif',fontWeight:900,fontSize:'18px',margin:'0 0 16px',color:this.state.dark?'#F3F1E6':'#2A3114'}}>Đổi tên thư mục</h3>
              <input autoFocus value={this.state.renameFolderInput} onChange={e=>this.setState({renameFolderInput:e.target.value})}
                onKeyDown={e=>{ if(e.key==='Enter') this._submitRenameFolderDetail(); if(e.key==='Escape') this.setState({renameFolderModalOpen:false}); }}
                maxLength={60}
                style={{width:'100%',background:this.state.dark?'rgba(255,255,255,.07)':'#FBF8EF',border:this.state.dark?'1.5px solid rgba(255,255,255,.15)':'1.5px solid #D9CDB5',borderRadius:'12px',color:this.state.dark?'#F3F1E6':'#2A3114',fontFamily:'Nunito,sans-serif',fontWeight:700,fontSize:'16px',padding:'13px 16px',outline:'none',boxSizing:'border-box'}}/>
              <div style={{display:'flex',gap:'10px',marginTop:'18px'}}>
                <button onClick={()=>this._submitRenameFolderDetail()} disabled={this.state.renameFolderLoading}
                  style={{flex:1,background:'#5D6B2D',border:'none',borderRadius:'14px',color:'#FFF8EB',padding:'13px 0',fontFamily:'Nunito,sans-serif',fontWeight:900,fontSize:'15px',cursor:'pointer',boxShadow:'0 4px 0 #46531F'}}>
                  {this.state.renameFolderLoading?'Đang lưu...':'Lưu'}
                </button>
                <button onClick={()=>this.setState({renameFolderModalOpen:false})}
                  style={{background:this.state.dark?'rgba(255,255,255,.08)':'#F0EAD8',border:'none',borderRadius:'14px',color:this.state.dark?'#a8ae8c':'#6b7155',padding:'13px 20px',fontFamily:'Nunito,sans-serif',fontWeight:800,fontSize:'15px',cursor:'pointer'}}>
                  Huỷ
                </button>
              </div>
            </div>
          </div>
        )}
        {this.state.activePanel && (
          <SidebarPanel
            panel={this.state.activePanel}
            onClose={() => this.setState({ activePanel: null })}
            onAvatarUpdated={(url: string) => { this.setState({ avatarUrlOverride: url }) }}
            dark={this.state.dark}
            userName={this.props.userName}
            navAvatarUrl={this.state.avatarUrlOverride || this.props.avatarUrl || ''}
            dashStreak={this.state.dashData?.streak ?? 0}
            skills={this.state.dashData?.skills ?? null}
            inkColor={this.state.dark ? '#F3F1E6' : '#2A3114'}
            ink2Color={this.state.dark ? '#9FA882' : '#6b7155'}
            headerBg={this.state.dark ? '#1B1E13' : '#fff'}
            panelBorder={this.state.dark ? 'rgba(255,255,255,.08)' : '#EFEAD8'}
            contentBg={this.state.dark ? '#181B10' : '#FFF8EB'}
            titleColor={this.state.dark ? '#7E8A5A' : '#9aa07f'}
            nightCardBg={this.state.dark ? 'linear-gradient(165deg,#0F1A38 0%,#1B2C54 100%)' : '#fff'}
            nightCardBorder={this.state.dark ? '#2C4474' : '#EFE7D2'}
          />
        )}
        {this.state.tidiansSelectionOpen && (
          <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Nunito', sans-serif"}}>
             <div style={{background:'#FFFDF8',color:'#2A3114',padding:'40px 30px',borderRadius:'24px',width:'90%',maxWidth:'420px',position:'relative',boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}}>
                <button onClick={() => this.setState({tidiansSelectionOpen:false})} style={{position:'absolute',top:'16px',right:'16px',background:'none',border:'none',cursor:'pointer',color:'#666'}}>
                   <X size={24} />
                </button>
                <h3 style={{marginTop:0,marginBottom:'30px',textAlign:'center',fontSize:'22px',fontWeight:'800',color:'#1F2937'}}>Bạn muốn luyện với bao nhiêu từ?</h3>
                <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'12px'}}>
                   {[10, 20, 30, 50].map(n => (
                      <button key={n} 
                        onClick={() => {
                           const shuffled = [...this.state.tidiansCandidates].sort(() => 0.5 - Math.random());
                           const selected = shuffled.slice(0, Math.min(n, this.state.tidiansCandidates.length));
                           this.setState({ tidiansSelectionOpen: false, tidiansActive: true, tidiansSourceIdx: selected });
                        }}
                        style={{padding:'14px 20px',background:'#fff',border:'1px solid #E5E7EB',borderRadius:'12px',fontSize:'18px',fontWeight:'800',color:'#374151',cursor:'pointer',minWidth:'80px',boxShadow:'0 2px 4px rgba(0,0,0,0.05)',transition:'all 0.2s'}}>
                        {n}
                      </button>
                   ))}
                   <button 
                     onClick={() => {
                         this.setState({ tidiansSelectionOpen: false, tidiansActive: true, tidiansSourceIdx: this.state.tidiansCandidates });
                     }}
                     style={{padding:'14px 20px',background:'#fff',border:'1px solid #E5E7EB',borderRadius:'12px',fontSize:'18px',fontWeight:'800',color:'#374151',cursor:'pointer',width:'100%',marginTop:'10px',boxShadow:'0 2px 4px rgba(0,0,0,0.05)',transition:'all 0.2s'}}>
                     Tất cả ({this.state.tidiansCandidates.length})
                   </button>
                </div>
             </div>
          </div>
        )}

        {this.state.tidiansActive && this.state.tidiansSourceIdx && (() => {
          const words = this.state.tidiansSourceIdx.map((i: number) => this.deck[i]).filter(Boolean);
          const setId = this.state.currentSet || 'all';
          return (
            <SentenceBuildExercise
              words={words}
              storageKeyId={`s${setId}`}
              folders={this.state.personalFolders}
              onBack={() => this.setState({ tidiansActive: false })}
              onHistoryPost={async (payload) => {
                 try {
                   await fetch('/api/student/history', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                   });
                 } catch (e) {
                   console.error("Failed to post history", e);
                 }
              }}
            />
          );
        })()}
      </React.Fragment>
    );
  }
}


export default Component;
