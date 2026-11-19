/* Projeção comercial experimental; não substitui a apuração da administradora. */
(function(){
  const rates={'0126':.24,'0127':.245,'0128':.245,'2203':.21,'2204':.21,'4210':.21,'8221':.22};
  const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const pct=v=>v.toLocaleString('pt-BR',{maximumFractionDigits:2})+'%';
  const el=(id)=>document.getElementById(id);
  function estimate(p,g,mode,unit,amount,embedded,fgts){
    const base=p.credit*(1+rates[g.group]), monthly=base/p.term, insurance=g.cat==='Imóveis'?0:base*.00084;
    // Lance fixo: parcela inicial integral do grupo, antes do seguro, independentemente do prazo contratado.
    const reference=base/g.duration;
    const paid=monthly*(p.pct===70?.7:1);
    const balance=base-paid, months=p.term-1;
    const min=base/(g.group==='0128'?280:g.duration);
    let bid=mode==='draw'?0:mode==='free'?(unit==='percent'?p.credit*amount/100:unit==='cot'?reference*amount:amount):reference*Number(mode);
    bid=Math.round(bid*100)/100;
    if(!Number.isFinite(bid)||bid<0||bid>balance+.01||(mode==='free'&&bid<min-.01))return {error:'Informe um lance entre '+brl(min)+' e '+brl(balance)+'.'};
    if(!Number.isFinite(embedded)||embedded<0||!Number.isFinite(fgts)||fgts<0)return {error:'Informe valores válidos de recursos.'};
    if(embedded>bid+.005||embedded>p.credit*.3+.005||(!g.embedded&&embedded>0)||fgts>bid-embedded+.005||(!g.fgts&&fgts>0))return {error:'Os recursos não podem exceder o lance total ou os limites autorizados na tabela.'};
    const net=Math.max(0,balance-bid), shorter=Math.ceil(Math.max(0,net/monthly-1e-9));
    return {base,monthly,insurance,reference,paid,balance,months,bid,embedded,fgts,own:Math.max(0,bid-embedded-fgts),credit:p.credit-embedded,net,lower:months&&net>0?net/months+insurance:0,shorter,regular:net>0?monthly+insurance:0,last:shorter?net-monthly*(shorter-1)+insurance:0};
  }
  window.lanceScenario=null;
  window.getLanceScenario=function(p){const a=window.lanceScenario;return a&&p&&a.key===[p.group,p.code,p.term,p.pct].join('|')?a.summary:''};
  window.openLanceSimulator=function(p,g){
    if(!p||!g||!(g.group in rates))return;
    const old=el('lanceDialog');if(old)old.remove();
    const dialog=document.createElement('dialog');dialog.id='lanceDialog';dialog.setAttribute('aria-labelledby','lanceTitle');
    const fixed=g.cat==='Imóveis'?[60,70]:[15];
    const style=document.createElement('style');style.textContent=`
    #lanceDialog{box-sizing:border-box;width:min(750px,96vw);max-height:92dvh;overflow:auto;border:0;border-radius:18px;padding:20px;background:#fff;color:#122b4b;box-shadow:0 20px 70px #0005}
    #lanceDialog::backdrop{background:#0d203bb0}#lanceDialog *{box-sizing:border-box}#lanceDialog h2,#lanceDialog h3{margin:0 0 8px}#lanceDialog p{margin:8px 0}
    #lanceDialog .ls-head{display:flex;align-items:start;justify-content:space-between;gap:12px}#lanceDialog .ls-close{background:#eaf1fb;color:#16385d;border:0;border-radius:8px;padding:8px 12px;font-size:16px;cursor:pointer}
    #lanceDialog .ls-hero{padding:15px;background:#0d315d;color:#fff;border-radius:12px;margin:12px 0}#lanceDialog .ls-hero b{font-size:26px;display:block;margin:4px 0}
    #lanceDialog .ls-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0}#lanceDialog label{display:block;font-size:12px;font-weight:750;margin-bottom:4px}
    #lanceDialog select,#lanceDialog input:not([type=range]){width:100%;padding:10px;border:1px solid #b5c8df;border-radius:8px;background:white;color:#122b4b;font:inherit}#lanceDialog input[type=range]{width:100%;accent-color:#1760ad}
    #lanceDialog .ls-full{grid-column:1/-1}#lanceDialog .ls-result{border:1px solid #d4e0ef;border-radius:10px;padding:12px;background:#f6f9fd;min-width:0}#lanceDialog .ls-result strong{display:block;font-size:21px;overflow-wrap:anywhere;margin-top:5px}#lanceDialog .ls-label{font-size:12px;color:#49617e}
    #lanceDialog .ls-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px}#lanceDialog .ls-row b{text-align:right}
    #lanceDialog .ls-note{font-size:12px;line-height:1.5;color:#536580}#lanceDialog .ls-error{background:#fff0ef;padding:10px;border-radius:8px;color:#9d271c}#lanceDialog [hidden]{display:none!important}
    #lanceDialog .ls-buttons{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}#lanceDialog .ls-buttons button{padding:10px 14px;border:0;border-radius:8px;font-weight:700;color:white;background:#1760ad;cursor:pointer}
    #lanceDialog .ls-desktop-quick{display:none}
html.desktop-ui #lanceDialog{width:min(920px,96vw);scrollbar-width:none}
html.desktop-ui #lanceDialog::-webkit-scrollbar{display:none}
html.desktop-ui #lanceDialog #lsRange{display:none}
html.desktop-ui #lanceDialog .ls-mobile-range-label{display:none}
html.desktop-ui #lanceDialog .ls-desktop-quick{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
html.desktop-ui #lanceDialog .ls-desktop-quick button{background:#eaf2fd;color:#1255a4;border:1px solid #c8d9ee;border-radius:8px;min-height:34px;padding:5px 12px;font-weight:750;flex:1}
html.desktop-ui #lanceDialog .ls-desktop-quick button:hover{background:#d6e7fc}
html.desktop-ui #lanceDialog .ls-desktop-quick button[aria-pressed="true"]{background:#1255a4;color:white}
html.desktop-ui #lanceDialog .ls-hero{padding:12px;margin:8px 0}
html.desktop-ui #lanceDialog .ls-grid{gap:8px;margin:8px 0}
html.desktop-ui #lanceDialog .ls-row{padding:5px 0}


    html.desktop-ui #lanceDialog{width:min(1160px,96vw);max-height:92dvh;overflow:auto;overscroll-behavior:contain;padding:16px}
    html.desktop-ui #lanceDialog .ls-main{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:8px 16px;align-items:start;transform:none}
    html.desktop-ui #lanceDialog .ls-head{grid-column:1/-1}
    html.desktop-ui #lanceDialog .ls-hero{grid-column:1;grid-row:2;margin:0}
    html.desktop-ui #lanceDialog .ls-controls{grid-column:1;grid-row:3;margin:0}
    html.desktop-ui #lanceDialog #lsError{grid-column:1;grid-row:4}
    html.desktop-ui #lanceDialog #lsOutput{grid-column:2;grid-row:2/5;min-width:0}
    html.desktop-ui #lanceDialog .ls-main>.ls-note,html.desktop-ui #lanceDialog .ls-buttons{grid-column:1/-1;margin:0}
    html.desktop-ui #lanceDialog .ls-main>.ls-note{font-size:11px;line-height:1.3}
    html.desktop-ui #lanceDialog #lsOutput .ls-grid{margin:0 0 6px}
    html.desktop-ui #lanceDialog .ls-result{padding:8px}
    html.desktop-ui #lanceDialog .ls-result strong{font-size:18px}
    html.desktop-ui #lanceDialog .ls-row{font-size:12px;padding:4px 0}
    html.desktop-ui #lanceDialog #lsOutput h3{font-size:15px;margin-top:8px!important}
    html.desktop-ui #lanceDialog #lsOutput .ls-note{font-size:11px;line-height:1.3}
    html.desktop-ui #lanceDialog input:not([type=range]),html.desktop-ui #lanceDialog select{min-height:36px;padding:6px 9px;font-size:14px}
    @media(max-width:680px){html.desktop-ui #lanceDialog .ls-main{display:block}html.desktop-ui #lanceDialog .ls-hero{margin:6px 0}}
    @media(max-width:460px){#lanceDialog{padding:13px}#lanceDialog .ls-grid{gap:8px}#lanceDialog .ls-result strong{font-size:18px}}

    /* Mobile: leitura nítida, campos de toque e ações sem zoom automático. */
    html:not(.desktop-ui) #lanceDialog{width:min(calc(100% - 12px),520px);max-height:calc(var(--app-height,100dvh) - 16px);padding:14px;border-radius:12px;overflow:auto;overscroll-behavior:contain}
    html:not(.desktop-ui) #lanceDialog .ls-main{min-width:0}
    html:not(.desktop-ui) #lanceDialog .ls-head{gap:8px}
    html:not(.desktop-ui) #lanceDialog .ls-head h2{font-size:20px;line-height:1.2}
    html:not(.desktop-ui) #lanceDialog .ls-close{display:grid;place-items:center;min-width:44px;min-height:44px;font-size:25px;padding:0;flex:none}
    html:not(.desktop-ui) #lanceDialog .ls-hero{padding:12px;margin:9px 0;border-radius:9px;line-height:1.4}
    html:not(.desktop-ui) #lanceDialog .ls-hero b{font-size:27px;letter-spacing:0}
    html:not(.desktop-ui) #lanceDialog .ls-grid{gap:8px;margin:10px 0}
    html:not(.desktop-ui) #lanceDialog .ls-grid>*{min-width:0}
    html:not(.desktop-ui) #lanceDialog label{line-height:1.3;font-size:13px}
    html:not(.desktop-ui) #lanceDialog select,html:not(.desktop-ui) #lanceDialog input:not([type=range]){font-size:16px;min-height:44px;padding:8px;border-radius:8px}
    html:not(.desktop-ui) #lanceDialog input[type=range]{height:32px;margin:2px 0 0}
    html:not(.desktop-ui) #lanceDialog .ls-result{padding:9px;border-radius:8px}
    html:not(.desktop-ui) #lanceDialog .ls-result strong{font-size:clamp(16px,4.8vw,22px);line-height:1.25;font-variant-numeric:tabular-nums}
    html:not(.desktop-ui) #lanceDialog .ls-label{font-size:12px;line-height:1.3}
    html:not(.desktop-ui) #lanceDialog .ls-row{gap:9px;font-size:13px;padding:7px 0;line-height:1.35}
    html:not(.desktop-ui) #lanceDialog .ls-row span{min-width:0}
    html:not(.desktop-ui) #lanceDialog .ls-row b{flex:none;max-width:52%;overflow-wrap:anywhere}
    html:not(.desktop-ui) #lanceDialog .ls-buttons{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
    html:not(.desktop-ui) #lanceDialog .ls-buttons button{min-height:44px;font-size:14px;padding:9px 10px}
    html:not(.desktop-ui) #lanceDialog #lsUse{grid-column:1/-1;background:#1255a4}
    html:not(.desktop-ui) #lanceDialog #lsCopy,html:not(.desktop-ui) #lanceDialog #lsReset{background:#edf4fd;color:#1255a4;border:1px solid #c8d9ee}
    @media(max-width:360px){html:not(.desktop-ui) #lanceDialog{padding:10px}html:not(.desktop-ui) #lanceDialog .ls-result{padding:7px}}

    /* Mobile: valores monetários inteiros, sem quebrar dígitos ou centavos. */
    html:not(.desktop-ui) #lanceDialog .ls-hero b,
    html:not(.desktop-ui) #lanceDialog .ls-number{white-space:nowrap;overflow-wrap:normal;word-break:normal;font-variant-numeric:tabular-nums}
    html:not(.desktop-ui) #lanceDialog #lsOutput .ls-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))}
    html:not(.desktop-ui) #lanceDialog .ls-result strong.ls-number{font-size:clamp(16px,4.6vw,20px)}
    html:not(.desktop-ui) #lanceDialog .ls-row b.ls-number{max-width:none;flex:0 0 auto}
    html:not(.desktop-ui) #lanceDialog .ls-row span{flex:1;overflow-wrap:break-word}
    @media(max-width:480px){
      html:not(.desktop-ui) #lanceDialog{padding:11px}
      html:not(.desktop-ui) #lanceDialog #lsOutput .ls-grid{grid-template-columns:minmax(0,1fr);gap:5px}
      html:not(.desktop-ui) #lanceDialog #lsOutput .ls-result{display:grid;grid-template-columns:minmax(0,1fr) max-content;align-items:center;gap:7px;padding:8px 9px}
      html:not(.desktop-ui) #lanceDialog #lsOutput .ls-result strong{margin:0;text-align:right;font-size:clamp(15px,4.6vw,19px)}
      html:not(.desktop-ui) #lanceDialog #lsOutput .ls-result strong:not(.ls-number){max-width:130px;white-space:normal;overflow-wrap:break-word}
      html:not(.desktop-ui) #lanceDialog #lsOutput .ls-result .ls-label{min-width:0;overflow-wrap:break-word}
      html:not(.desktop-ui) #lanceDialog .ls-hero b{font-size:clamp(23px,6.4vw,27px)}
    }

    `;
    dialog.append(style);
    const panel=document.createElement('div');panel.className='ls-main';
    panel.innerHTML='<div class="ls-head"><div><h2 id="lanceTitle">Simule seu lance</h2><p class="ls-note">Experimente livremente antes de contratar.</p></div><button class="ls-close" id="lsClose" type="button" aria-label="Fechar">×</button></div>'+
      '<div class="ls-hero">Grupo '+g.group+' · '+p.code+'<b>'+brl(p.credit)+'</b>'+p.term+' meses · '+brl(p.payment)+' de parcela oficial · '+(p.pct===70?'70%':'Integral / tabela')+'</div>'+
      '<div class="ls-grid ls-controls"><div class="ls-full"><label for="lsMode">Modalidade</label><select id="lsMode"><option value="draw">Sorteio (sem lance)</option><option value="free">Lance livre</option>'+fixed.map(n=>'<option value="'+n+'">Lance fixo — '+n+' cotas (estimativa)</option>').join('')+'</select></div>'+
      '<div id="lsUnitBox"><label for="lsUnit">Informar lance em</label><select id="lsUnit"><option value="money">Reais (R$)</option><option value="percent">% da carta</option><option value="cot">Cotas de referência</option></select></div><div id="lsAmountBox"><label for="lsAmount">Valor do lance</label><input id="lsAmount" type="number" min="0" step="0.01" value="10000"></div>'+
      '<div class="ls-full" id="lsRangeBox"><label for="lsRange" class="ls-mobile-range-label">Ajuste rápido em % da carta</label><input id="lsRange" type="range" min="0" max="100" step="1" value="20"><div class="ls-desktop-quick" role="group" aria-label="Escolher percentual do lance"><button type="button" data-ls-quick="10" aria-pressed="false">10%</button><button type="button" data-ls-quick="15" aria-pressed="false">15%</button><button type="button" data-ls-quick="20" aria-pressed="false">20%</button><button type="button" data-ls-quick="25" aria-pressed="false">25%</button><button type="button" data-ls-quick="30" aria-pressed="false">30%</button><button type="button" data-ls-quick="40" aria-pressed="false">40%</button><button type="button" data-ls-quick="50" aria-pressed="false">50%</button></div></div>'+
      '<div class="ls-full" id="lsSourceBox"><label for="lsSource">Origem dos recursos</label><select id="lsSource"><option value="own">Recursos próprios</option>'+(g.embedded?'<option value="embedded">Embutido</option><option value="mixed">Misto: próprio + embutido</option>':'')+(g.fgts?'<option value="fgts">FGTS + próprios</option>':'')+(g.fgts&&g.embedded?'<option value="all">Próprio + embutido + FGTS</option>':'')+'</select></div>'+
      '<div id="lsEmbBox"><label for="lsEmb">Embutido (R$ · até 30% do crédito)</label><input id="lsEmb" type="number" min="0" step="0.01" value="0"></div><div id="lsFgtsBox"><label for="lsFgts">FGTS (R$ · sujeito à elegibilidade)</label><input id="lsFgts" type="number" min="0" step="0.01" value="0"></div></div>'+
      '<div id="lsError" class="ls-error" role="alert" hidden></div><div id="lsOutput" aria-live="polite"></div><p class="ls-note">Projeção hipotética de contemplação na primeira assembleia, com a primeira parcela paga. Valores sem reajustes. O lance fixo utiliza a parcela inicial integral do grupo como referência, sem seguro, independentemente do prazo contratado. Seguro estimado constante. Parcelas anteriores à adesão, diferenças contratuais e liberação do crédito dependem da apuração oficial. Não há garantia de contemplação. '+(g.group==='4210'?'Lance embutido não habilitado: a tabela de motos não informa limite. ':'')+(g.group==='0126'||g.group==='8221'?'Taxa total inferida da tabela, pendente de confirmação. ':'')+(g.group==='4210'||g.group==='0128'?'O adendo apresenta referência específica para o lance mínimo. ':'')+'</p><div class="ls-buttons"><button type="button" id="lsUse">Usar cenário na proposta</button><button type="button" id="lsCopy">Copiar cenário</button><button type="button" id="lsReset">Reiniciar</button></div><p id="lsStatus" role="status" class="ls-note"></p>';
    dialog.append(panel);document.body.append(dialog);
    let current=null;
    function update(){
      const mode=el('lsMode').value, source=el('lsSource').value, unit=el('lsUnit').value, free=mode==='free',draw=mode==='draw';
      ['lsUnitBox','lsAmountBox','lsRangeBox'].forEach(id=>el(id).hidden=!free);
      el('lsSourceBox').hidden=draw;
      el('lsEmbBox').hidden=draw||!['mixed','all'].includes(source);
      el('lsFgtsBox').hidden=draw||!['fgts','all'].includes(source);
      let amount=Number(el('lsAmount').value);
      panel.querySelectorAll('[data-ls-quick]').forEach(b=>b.setAttribute('aria-pressed',String(free&&unit==='percent'&&Number(b.dataset.lsQuick)===amount)));
      let prelim=estimate(p,g,mode,unit,amount,0,0);
      let embedded=draw?0:source==='embedded'&&!prelim.error?prelim.bid:['mixed','all'].includes(source)?Number(el('lsEmb').value):0;
      let fgts=draw?0:['fgts','all'].includes(source)?Number(el('lsFgts').value):0;
      if(source==='embedded'&&!draw&&embedded>p.credit*.3+.005)prelim={error:'O lance integralmente embutido excede 30% do crédito. Escolha lance misto para complementar.'};
      const x=prelim.error?prelim:estimate(p,g,mode,unit,amount,embedded,fgts);
      current=x.error?null:x;el('lsError').hidden=!x.error;el('lsError').textContent=x.error||'';el('lsCopy').disabled=!!x.error;el('lsUse').disabled=!!x.error;
      if(x.error){el('lsOutput').innerHTML='';return;}
      const numericClass=b=>/^(?:R\$|\d)/.test(String(b))?' class="ls-number"':'';
      const row=(a,b)=>'<div class="ls-row"><span>'+a+'</span><b'+numericClass(b)+'>'+b+'</b></div>';
      const tile=(a,b)=>'<div class="ls-result"><span class="ls-label">'+a+'</span><strong'+numericClass(b)+'>'+b+'</strong></div>';
      el('lsOutput').innerHTML='<div class="ls-grid">'+tile('Lance total',brl(x.bid))+tile('Crédito líquido estimado',brl(x.credit))+tile('Recursos próprios',brl(x.own))+tile('Saldo remanescente estimado',brl(x.net))+'</div>'+
        row('Lance sobre a carta',pct(x.bid/p.credit*100))+row('Parcela inicial de referência do grupo',brl(x.reference))+row('Cotas equivalentes', (x.bid/x.reference).toLocaleString('pt-BR',{maximumFractionDigits:2}))+row('Lance embutido',brl(x.embedded))+row('FGTS',brl(x.fgts))+row('Saldo antes do lance (sem seguro futuro)',brl(x.balance))+row('Primeira parcela oficial',brl(p.payment))+row('Desembolso inicial: parcela + recursos próprios',brl(p.payment+x.own))+
        '<h3 style="margin-top:15px">Compare as duas estratégias</h3><div class="ls-grid">'+tile('Manter prazo / reduzir parcela', (x.net>0?x.months:0)+' × '+brl(x.lower))+tile('Reduzir prazo / manter parcela integral',(x.shorter>x.months?'Não aplicável neste prazo':x.shorter+' meses'))+'</div>'+(x.shorter>x.months?'':row('Parcela integral estimada na redução de prazo',brl(x.regular))+row('Última parcela estimada',brl(Math.max(0,x.last))))+'<p class="ls-note">Saldo sem seguro futuro. Na modalidade reduzida, a diferença não amortizada permanece no saldo. Se o prazo calculado ultrapassar o prazo contratado, a administradora deverá ajustar as parcelas; não há extensão automática.</p>';
    }
    el('lsMode').value=String(fixed[0]);
    el('lsAmount').value=String(Math.round(p.credit*.2));
    for(const id of ['lsMode','lsUnit','lsAmount','lsSource','lsEmb','lsFgts'])el(id).addEventListener('input',update);
    el('lsRange').addEventListener('input',()=>{el('lsUnit').value='percent';el('lsAmount').value=el('lsRange').value;update()});
    panel.querySelectorAll('[data-ls-quick]').forEach(b=>b.onclick=()=>{el('lsUnit').value='percent';el('lsAmount').value=b.dataset.lsQuick;el('lsRange').value=b.dataset.lsQuick;update()});
    el('lsClose').onclick=()=>dialog.close();
    el('lsReset').onclick=()=>{el('lsMode').value=String(fixed[0]);el('lsUnit').value='money';el('lsAmount').value=String(Math.round(p.credit*.2));el('lsSource').value='own';el('lsEmb').value=0;el('lsFgts').value=0;el('lsRange').value=20;el('lsStatus').textContent='';update()};
    function scenarioText(){if(!current)return '';const x=current;const modality=el('lsMode').selectedOptions[0].textContent;return ['Simulação comercial estimada — Grupo '+g.group+' / '+p.code,'Crédito: '+brl(p.credit),'Parcela de tabela: '+brl(p.payment)+' / '+p.term+' meses','Modalidade: '+modality,'Lance: '+brl(x.bid),'Recursos próprios: '+brl(x.own),'Embutido: '+brl(x.embedded),'FGTS: '+brl(x.fgts),'Crédito líquido: '+brl(x.credit),'Saldo estimado: '+brl(x.net),'Redução da parcela: '+brl(x.lower),'Redução do prazo: '+(x.shorter>x.months?'não aplicável neste prazo':x.shorter+' meses'),'Sujeito à confirmação da administradora; sem garantia de contemplação.'].join('\n');}
    el('lsUse').onclick=()=>{if(!current)return;window.lanceScenario={key:[p.group,p.code,p.term,p.pct].join('|'),summary:scenarioText()};dialog.close();if(typeof window.refreshLanceChoice==='function')window.refreshLanceChoice();};
    el('lsCopy').onclick=async()=>{const msg=scenarioText();if(!msg)return;try{await navigator.clipboard.writeText(msg);el('lsStatus').textContent='Cenário copiado.'}catch(e){el('lsStatus').textContent='Não foi possível copiar automaticamente.'}};
    dialog.addEventListener('close',()=>dialog.remove());
    update();dialog.showModal();
  };
})();
