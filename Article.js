function mdToHtml(src){
  let s = src;
  s = s.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  s = s.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  s = s.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  s = s.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/^- (.*)$/gm, '<li>$1</li>');
  s = s.replace(/(<li>.*<\/li>)/gs, m=>'<ul>'+m+'</ul>');
  s = s.replace(/\n\n/g, '</p><p>');
  s = '<p>'+s+'</p>';
  s = s.replace(/<p><h/g,'<h').replace(/<\/h([1-3])><\/p>/g,'</h$1>');
  s = s.replace(/<p><ul>/g,'<ul>').replace(/<\/ul><\/p>/g,'</ul>');
  s = s.replace(/<p><blockquote>/g,'<blockquote>').replace(/<\/blockquote><\/p>/g,'</blockquote>');
  return s;
}

async function initArticle(){
  const slug = new URLSearchParams(location.search).get('slug');
  if(!slug){ document.getElementById('articleContent').innerHTML='<p>Missing article.</p>'; return; }
  const list = await (await fetch('content/articles.json')).json();
  const idx = list.findIndex(a=>a.slug===slug);
  const meta = list[idx];
  if(!meta){ document.getElementById('articleContent').innerHTML=`<p>Article not found. <a href="index.html">Back to wall</a></p>`; return; }
  const raw = await (await fetch('content/articles/'+meta.contentFile)).text();
  document.title = meta.title + ' — The Writing Wall';
  document.getElementById('articleContent').innerHTML = `
    <div class="cat">${meta.category}</div>
    <h1>${meta.title}</h1>
    <p class="muted">${meta.date} · ${meta.readingTime} min read</p>
    <p class="muted"><em>${meta.excerpt}</em></p>
    <div>${mdToHtml(raw)}</div>
    <p class="muted small">${meta.tags.map(t=>'#'+t).join(' ')}</p>
    <p><a href="index.html#board">← Return to board</a> · <button id="copyLink">Copy link</button> <button id="shareBtn">Share</button></p>
  `;
  document.getElementById('copyLink').onclick = ()=> navigator.clipboard.writeText(location.href);
  const shareBtn = document.getElementById('shareBtn');
  if(navigator.share){ shareBtn.onclick = ()=> navigator.share({title: meta.title, url: location.href}); }
  else { shareBtn.style.display='none'; }

  const nav = document.getElementById('articleNav');
  let html='';
  if(list[idx-1]) html+=`<a href="article.html?slug=${list[idx-1].slug}">← ${list[idx-1].title}</a>`;
  else html+='<span></span>';
  if(list[idx+1]) html+=`<a href="article.html?slug=${list[idx+1].slug}">${list[idx+1].title} →</a>`;
  nav.innerHTML=html;

  const related = list.filter(a=>a.slug!==slug && (a.category===meta.category || a.tags.some(t=>meta.tags.includes(t)))).slice(0,3);
  document.getElementById('relatedSection').innerHTML = '<h3>Related</h3>' + related.map(r=>`<p><a href="article.html?slug=${r.slug}">${r.title}</a> — ${r.excerpt}</p>`).join('');

  window.addEventListener('scroll', ()=>{
    const el=document.getElementById('progressBar');
    const sc = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    if(el) el.style.width = Math.min(100, sc*100)+'%';
  });
}
initArticle();
