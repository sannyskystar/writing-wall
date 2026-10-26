let articles=[], activeCat='All Writing';
const board = document.getElementById('board');
const filterBar = document.getElementById('filterBar');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
const progress = document.getElementById('progress');

async function fetchJSON(p){ const r=await fetch(p); if(!r.ok) throw new Error(p); return r.json(); }
async function fetchText(p){ const r=await fetch(p); if(!r.ok) return ''; return r.text(); }

async function init(){
  const config = await fetchJSON('config.json');
  document.getElementById('aboutTitle').textContent = config.about.title;
  document.getElementById('aboutText').textContent = config.about.body;
  const emailLink = document.getElementById('emailLink');
  emailLink.href = 'mailto:' + config.contact.email;
  emailLink.textContent = config.contact.email;
  document.getElementById('profileLinks').innerHTML = (config.contact.profiles||[]).map(p=>`<a href="${p.url}" target="_blank" rel="noopener">${p.label}</a>`).join(' · ');
  document.getElementById('year').textContent = new Date().getFullYear();

  articles = await fetchJSON('content/articles.json');
  for(const a of articles){
    a._body = await fetchText('content/articles/' + a.contentFile);
  }

  buildFilters(config.categories);
  renderFeatured();
  render();

  searchInput.addEventListener('input', render);
  document.getElementById('clearBtn').onclick = ()=>{ searchInput.value=''; activeCat='All Writing'; buildFilters(config.categories); render(); };
  document.getElementById('resetBtn').onclick = ()=>{ searchInput.value=''; activeCat='All Writing'; buildFilters(config.categories); render(); };

  const saved = localStorage.getItem('ww-theme');
  if(saved) document.documentElement.dataset.theme = saved;
  document.getElementById('themeToggle').onclick = ()=>{
    const cur = document.documentElement.dataset.theme;
    const next = cur==='dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('ww-theme', next);
  };

  window.addEventListener('scroll', ()=>{
    const sc = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    if(progress) progress.style.width = Math.min(100, sc*100) + '%';
  });
}

function buildFilters(cats){
  filterBar.innerHTML='';
  cats.forEach(c=>{
    const b=document.createElement('button');
    b.textContent=c;
    b.setAttribute('role','tab');
    b.setAttribute('aria-selected', c===activeCat ? 'true' : 'false');
    if(c===activeCat) b.classList.add('active');
    b.onclick=()=>{ activeCat=c; buildFilters(cats); render(); };
    filterBar.appendChild(b);
  });
}

function cardHTML(a){
  const meta = `${a.date} · ${a.readingTime} min`;
  const href = `article.html?slug=${encodeURIComponent(a.slug)}`;
  if(a.cardType==='short'){
    return `<a class="card short" href="${href}"><div class="cat">${a.category}</div><p>${a.excerpt}</p><div class="meta">${meta}</div></a>`;
  }
  if(a.cardType==='quote'){
    return `<a class="card quote" href="${href}"><div class="cat">${a.category}</div><blockquote>“${a.excerpt}”</blockquote><div class="meta">${a.title} · ${meta}</div></a>`;
  }
  if(a.cardType==='featured'){
    return `<a class="card featured" href="${href}"><div class="cat">${a.category} · Pinned</div><h3>${a.title}</h3><p>${a.excerpt}</p><div class="meta">${meta}</div></a>`;
  }
  return `<a class="card" href="${href}"><div class="cat">${a.category}</div><h3>${a.title}</h3><p>${a.excerpt}</p><div class="meta">${meta}</div></a>`;
}

function renderFeatured(){
  const f = articles.find(a=>a.featured) || articles[0];
  if(!f) return;
  document.getElementById('featuredMini').innerHTML = cardHTML(f);
}

function render(){
  const q = (searchInput.value||'').toLowerCase().trim();
  const filtered = articles.filter(a=>{
    const catOk = activeCat==='All Writing' || a.category===activeCat;
    const searchOk = !q || (a.title + ' ' + a.excerpt + ' ' + a._body + ' ' + a.tags.join(' ')).toLowerCase().includes(q);
    return catOk && searchOk;
  }).sort((x,y)=> y.date.localeCompare(x.date));

  board.innerHTML = filtered.map(cardHTML).join('');
  emptyState.hidden = filtered.length>0;
}

init();
