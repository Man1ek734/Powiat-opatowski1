(()=>{
  const STORAGE_KEY="powiat-opatowski-accessibility-v3";
  const LEGACY_KEYS=["powiat-opatowski-accessibility-v1","powiat-opatowski-accessibility-v2"];
  const levels=[1,1.15,1.3];
  const defaults={font:0,contrast:false,links:false};
  let settings={...defaults};
  let managedFonts=[];
  let resizeTimer;

  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(saved&&typeof saved==="object") settings={
      font:Math.max(0,Math.min(2,Number(saved.font)||0)),
      contrast:Boolean(saved.contrast),
      links:Boolean(saved.links)
    };

    /* Poprzednie wersje kontrastu mogły zapisać ustawienie powodujące pusty
       ekran. Zachowujemy bezpieczne preferencje, ale kontrast włączamy od nowa
       dopiero świadomym kliknięciem użytkownika. */
    if(!saved){
      for(const key of LEGACY_KEYS){
        const legacy=JSON.parse(localStorage.getItem(key)||"null");
        if(legacy&&typeof legacy==="object"){
          settings={
            font:Math.max(0,Math.min(2,Number(legacy.font)||0)),
            contrast:false,
            links:Boolean(legacy.links)
          };
          break;
        }
      }
    }
    LEGACY_KEYS.forEach(key=>localStorage.removeItem(key));
  }catch(_){settings={...defaults}}

  const utility=document.querySelector(".utility-links");
  if(!utility)return;

  utility.querySelectorAll("button").forEach(button=>{
    if(button.textContent.trim()==="A+")button.remove();
  });

  const trigger=document.createElement("button");
  trigger.type="button";
  trigger.className="accessibility-trigger";
  trigger.setAttribute("aria-haspopup","dialog");
  trigger.setAttribute("aria-expanded","false");
  trigger.setAttribute("aria-controls","accessibilityPanel");
  trigger.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4" r="2"></circle><path d="M4 8h16M12 6v7M8 21l4-8 4 8"></path></svg><span class="accessibility-trigger__label">Dostępność</span><i class="a11y-active-dot" aria-hidden="true"></i>';

  const oldLink=utility.querySelector('a[href="dostepnosc.html"]');
  if(oldLink)oldLink.replaceWith(trigger);else utility.prepend(trigger);

  const panel=document.createElement("section");
  panel.id="accessibilityPanel";
  panel.className="accessibility-panel";
  panel.setAttribute("role","dialog");
  panel.setAttribute("aria-labelledby","accessibilityTitle");
  panel.hidden=true;
  panel.innerHTML=`
    <div class="accessibility-panel__head">
      <div class="accessibility-panel__title"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4" r="2"></circle><path d="M4 8h16M12 6v7M8 21l4-8 4 8"></path></svg><strong id="accessibilityTitle">Dostępność</strong></div>
      <button class="accessibility-close" type="button" aria-label="Zamknij panel">×</button>
    </div>
    <div class="accessibility-panel__body">
      <div class="accessibility-option">
        <span><b>Rozmiar tekstu</b><small>Powiększ tekst na całej stronie</small></span>
        <div class="accessibility-font-controls" aria-label="Zmień rozmiar tekstu">
          <button type="button" data-font="minus" aria-label="Zmniejsz tekst">A−</button>
          <span class="accessibility-font-value">100%</span>
          <button type="button" data-font="plus" aria-label="Powiększ tekst">A+</button>
        </div>
      </div>
      <div class="accessibility-option">
        <span><b>Wysoki kontrast</b><small>Wyraźniejszy tekst i kolory</small></span>
        <button class="accessibility-switch" type="button" role="switch" aria-checked="false" data-setting="contrast" aria-label="Włącz wysoki kontrast"></button>
      </div>
      <div class="accessibility-option">
        <span><b>Podkreślone linki</b><small>Łatwiejsze rozpoznawanie odnośników</small></span>
        <button class="accessibility-switch" type="button" role="switch" aria-checked="false" data-setting="links" aria-label="Włącz podkreślenie linków"></button>
      </div>
      <div class="accessibility-actions">
        <button class="accessibility-reset" type="button">Przywróć ustawienia</button>
        <a class="accessibility-declaration" href="dostepnosc.html">Deklaracja dostępności →</a>
      </div>
    </div>
    <span class="accessibility-status" aria-live="polite"></span>`;
  document.body.appendChild(panel);

  const fontValue=panel.querySelector(".accessibility-font-value");
  const status=panel.querySelector(".accessibility-status");
  const closeButton=panel.querySelector(".accessibility-close");

  function save(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(settings))}catch(_){}
  }

  function clearManagedFonts(){
    managedFonts.forEach(({element,original})=>{element.style.fontSize=original});
    managedFonts=[];
  }

  function applyFont(){
    clearManagedFonts();
    const scale=levels[settings.font];
    if(scale===1)return;
    const selector="h1,h2,h3,h4,h5,h6,p,a,button,input,label,small,span,li,b,strong,td,th,time";
    const elements=[...document.querySelectorAll(selector)].filter(element=>!element.matches("svg,svg *"));
    const measurements=elements.map(element=>({element,original:element.style.fontSize,base:parseFloat(getComputedStyle(element).fontSize)}));
    measurements.forEach(item=>{
      if(Number.isFinite(item.base))item.element.style.fontSize=`${Math.min(item.base*scale,82)}px`;
    });
    managedFonts=measurements;
  }

  function apply(announce=true){
    document.documentElement.classList.toggle("a11y-contrast",settings.contrast);
    document.documentElement.classList.toggle("a11y-links",settings.links);
    applyFont();
    fontValue.textContent=`${Math.round(levels[settings.font]*100)}%`;
    panel.querySelector('[data-setting="contrast"]').setAttribute("aria-checked",String(settings.contrast));
    panel.querySelector('[data-setting="links"]').setAttribute("aria-checked",String(settings.links));
    const changed=settings.font>0||settings.contrast||settings.links;
    trigger.classList.toggle("has-settings",changed);
    if(announce)status.textContent=changed?"Zastosowano ustawienia dostępności.":"Przywrócono ustawienia domyślne.";
    save();
  }

  function setOpen(open){
    panel.hidden=!open;
    trigger.setAttribute("aria-expanded",String(open));
    if(open)closeButton.focus();
  }

  trigger.addEventListener("click",()=>setOpen(panel.hidden));
  closeButton.addEventListener("click",()=>{setOpen(false);trigger.focus()});
  panel.querySelector('[data-font="minus"]').addEventListener("click",()=>{settings.font=Math.max(0,settings.font-1);apply()});
  panel.querySelector('[data-font="plus"]').addEventListener("click",()=>{settings.font=Math.min(2,settings.font+1);apply()});
  panel.querySelectorAll("[data-setting]").forEach(button=>button.addEventListener("click",()=>{
    const key=button.dataset.setting;settings[key]=!settings[key];apply();
  }));
  panel.querySelector(".accessibility-reset").addEventListener("click",()=>{settings={...defaults};apply()});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!panel.hidden){setOpen(false);trigger.focus()}});
  document.addEventListener("click",event=>{if(!panel.hidden&&!panel.contains(event.target)&&!trigger.contains(event.target))setOpen(false)});
  window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(applyFont,120)});
  new MutationObserver(mutations=>{
    if(settings.font===0)return;
    if(mutations.some(mutation=>mutation.addedNodes.length)){clearTimeout(resizeTimer);resizeTimer=setTimeout(applyFont,40)}
  }).observe(document.body,{childList:true,subtree:true});

  apply(false);
})();
