/* Projeção comercial experimental; não substitui a apuração da administradora. */
(function(){
  const rates={'0126':.24,'0127':.245,'0128':.245,'2203':.21,'2204':.21,'4210':.21,'8221':.22};
  const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const pct=v=>v.toLocaleString('pt-BR',{maximumFractionDigits:2})+'%';
  const el=(id)=>document.getElementById(id);
  function estimate(p,g,mode,unit,amount,embedded,fgts){
    const base=p.credit*(1+rates[g.group]), monthly=base/p.term, insurance=g.cat==='Imóveis'?0:base*.00084;
    const reference=base/g.duration;
    const paid=monthly*(p.pct===70?.7:1);
    const balance=base-paid, months=p.term-1;
    const min=reference;
    let bid=mode==='draw'?0:mode==='free'?(unit==='percent'?p.credit*amount/100:unit==='cot'?reference*amount:amount):reference*Number(mode);
    bid=Math.round(bid*100)/100;
    if(!Number.isFinite(bid)||bid<0||bid>balance+.01||(mode==='free'&&bid<min-.01))return {error:'Informe um lance entre '+brl(min)+' e '+brl(balance)+'.'};
    if(!Number.isFinite(embedded)||embedded<0||!Number.isFinite(fgts)||fgts<0)return {error:'Informe valores válidos de recursos.'};
    if(embedded>bid+.005||embedded>p.credit*.3+.005||(!g.embedded&&embedded>0)||fgts>bid-embedded+.005||(!g.fgts&&fgts>0))return {error:'Os recursos não podem exceder o lance total ou os limites autorizados na tabela.'};
    const net=Math.max(0,balance-bid), shorter=Math.ceil(Math.max(0,net/monthly-1e-9));
    return {base,monthly,insurance,reference,paid,balance,months,bid,embedded,fgts,own:Math.max(0,bid-embedded-fgts),credit:p.credit-embedded,net,lower:months&&net>0?net/months+insurance:0,shorter,regular:net>0?monthly+insurance:0,last:shorter?net-monthly*(shorter-1)+insurance:0};
  }
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
    @media(max-width:460px){#lanceDialog{padding:13px}#lanceDialog .ls-grid{gap:8px}#lanceDialog .ls-result strong{font-size:18px}}
    `;
    dialog.append(style);
    const panel=document.createElement('div');
    panel.innerHTML='<div class="ls-head"><div><h2 id="lanceTitle">Simule seu lance</h2><p class="ls-note">Experimente livremente antes de contratar.</p></div><button class="ls-close" id="lsClose" type="button" aria-label="Fechar">×</button></div>'+
      '<div class="ls-hero">Grupo '+g.group+' · '+p.code+'<b>'+brl(p.credit)+'</b>'+p.term+' meses · '+brl(p.payment)+' de parcela oficial · '+(p.pct===70?'70%':'Integral / tabela')+'</div>'+
      '<div class="ls-grid"><div class="ls-full"><label for="lsMode">Modalidade</label><select id="lsMode"><option value="draw">Sorteio (sem lance)</option><option value="free">Lance livre</option>'+fixed.map(n=>'<option value="'+n+'">Lance fixo — '+n+' cotas (estimativa)</option>').join('')+'</select></div>'+
      '<div id="lsUnitBox"><label for="lsUnit">Informar lance em</label><select id="lsUnit"><option value="money">Reais (R$)</option><option value="percent">% da carta</option><option value="cot">Cotas de referência</option></select></div><div id="lsAmountBox"><label for="lsAmount">Valor do lance</label><input id="lsAmount" type="number" min="0" step="0.01" value="10000"></div>'+
      '<div class="ls-full" id="lsRangeBox"><label for="lsRange">Ajuste rápido em % da carta</label><input id="lsRange" type="range" min="0" max="100" step="1" value="20"></div>'+
      '<div class="ls-full" id="lsSourceBox"><label for="lsSource">Origem dos recursos</label><select id="lsSource"><option value="own">Recursos próprios</option>'+(g.embedded?'<option value="embedded">Embutido</option><option value="mixed">Misto: próprio + embutido</option>':'')+(g.fgts?'<option value="fgts">FGTS + próprios</option>':'')+(g.fgts&&g.embedded?'<option value="all">Próprio + embutido + FGTS</option>':'')+'</select></div>'+
      '<div id="lsEmbBox"><label for="lsEmb">Embutido (R$ · até 30% do crédito)</label><input id="lsEmb" type="number" min="0" step="0.01" value="0"></div><div id="lsFgtsBox"><label for="lsFgts">FGTS (R$ · sujeito à elegibilidade)</label><input id="lsFgts" type="number" min="0" step="0.01" value="0"></div></div>'+
      '<div id="lsError" class="ls-error" role="alert" hidden></div><div id="lsOutput" aria-live="polite"></div><p class="ls-note">Projeção hipotética de contemplação na primeira assembleia, com a primeira parcela paga. Valores sem reajustes. O lance fixo é estimado pelo prazo de referência da tabela, sem seguro; essa base ainda não foi validada pela administradora. Seguro estimado constante. Parcelas anteriores à adesão, diferenças contratuais e liberação do crédito dependem da apuração oficial. Não há garantia de contemplação. '+(g.group==='4210'?'Lance embutido não habilitado: a tabela de motos não informa limite. ':'')+(g.group==='0126'||g.group==='8221'?'Taxa total inferida da tabela, pendente de confirmação. ':'')+(g.group==='4210'||g.group==='0128'?'O adendo apresenta referência específica para o lance mínimo; confirmar a base do lance fixo. ':'')+'</p><div class="ls-buttons"><button type="button" id="lsCopy">Copiar cenário</button><button type="button" id="lsReset">Reiniciar</button></div><p id="lsStatus" role="status" class="ls-note"></p>';
    dialog.append(panel);document.body.append(dialog);
    let current=null;
    function update(){
      const mode=el('lsMode').value, source=el('lsSource').value, unit=el('lsUnit').value, free=mode==='free',draw=mode==='draw';
      ['lsUnitBox','lsAmountBox','lsRangeBox'].forEach(id=>el(id).hidden=!free);
      el('lsSourceBox').hidden=draw;
      el('lsEmbBox').hidden=draw||!['mixed','all'].includes(source);
      el('lsFgtsBox').hidden=draw||!['fgts','all'].includes(source);
      let amount=Number(el('lsAmount').value);
      let prelim=estimate(p,g,mode,unit,amount,0,0);
      let embedded=draw?0:source==='embedded'&&!prelim.error?prelim.bid:['mixed','all'].includes(source)?Number(el('lsEmb').value):0;
      let fgts=draw?0:['fgts','all'].includes(source)?Number(el('lsFgts').value):0;
      if(source==='embedded'&&!draw&&embedded>p.credit*.3+.005)prelim={error:'O lance integralmente embutido excede 30% do crédito. Escolha lance misto para complementar.'};
      const x=prelim.error?prelim:estimate(p,g,mode,unit,amount,embedded,fgts);
      current=x.error?null:x;el('lsError').hidden=!x.error;el('lsError').textContent=x.error||'';el('lsCopy').disabled=!!x.error;
      if(x.error){el('lsOutput').innerHTML='';return;}
      const row=(a,b)=>'<div class="ls-row"><span>'+a+'</span><b>'+b+'</b></div>';
      const tile=(a,b)=>'<div class="ls-result"><span class="ls-label">'+a+'</span><strong>'+b+'</strong></div>';
      el('lsOutput').innerHTML='<div class="ls-grid">'+tile('Lance total',brl(x.bid))+tile('Crédito líquido estimado',brl(x.credit))+tile('Recursos próprios',brl(x.own))+tile('Saldo remanescente estimado',brl(x.net))+'</div>'+
        row('Lance sobre a carta',pct(x.bid/p.credit*100))+row('Cota de referência estimada',brl(x.reference))+row('Cotas equivalentes', (x.bid/x.reference).toLocaleString('pt-BR',{maximumFractionDigits:2}))+row('Lance embutido',brl(x.embedded))+row('FGTS',brl(x.fgts))+row('Saldo antes do lance (sem seguro futuro)',brl(x.balance))+row('Primeira parcela oficial',brl(p.payment))+row('Desembolso inicial: parcela + recursos próprios',brl(p.payment+x.own))+
        '<h3 style="margin-top:15px">Compare as duas estratégias</h3><div class="ls-grid">'+tile('Manter prazo / reduzir parcela', (x.net>0?x.months:0)+' × '+brl(x.lower))+tile('Reduzir prazo / manter parcela integral',x.shorter+' meses')+'</div>'+row('Parcela integral estimada na redução de prazo',brl(x.regular))+row('Última parcela estimada',brl(Math.max(0,x.last)))+'<p class="ls-note">Saldo sem seguro futuro. Na modalidade reduzida, a diferença não amortizada permanece no saldo. Se o prazo calculado ultrapassar o prazo contratado, a administradora deverá ajustar as parcelas; não há extensão automática.</p>';
    }
    el('lsMode').value=String(fixed[0]);
    el('lsAmount').value=String(Math.round(p.credit*.2));
    for(const id of ['lsMode','lsUnit','lsAmount','lsSource','lsEmb','lsFgts'])el(id).addEventListener('input',update);
    el('lsRange').addEventListener('input',()=>{el('lsUnit').value='percent';el('lsAmount').value=el('lsRange').value;update()});
    el('lsClose').onclick=()=>dialog.close();
    el('lsReset').onclick=()=>{el('lsMode').value=String(fixed[0]);el('lsUnit').value='money';el('lsAmount').value=String(Math.round(p.credit*.2));el('lsSource').value='own';el('lsEmb').value=0;el('lsFgts').value=0;el('lsRange').value=20;el('lsStatus').textContent='';update()};
    el('lsCopy').onclick=async()=>{if(!current)return;const x=current;const msg=['Simulação comercial estimada — Grupo '+g.group+' / '+p.code,'Crédito: '+brl(p.credit),'Parcela de tabela: '+brl(p.payment)+' / '+p.term+' meses','Lance: '+brl(x.bid),'Recursos próprios: '+brl(x.own),'Embutido: '+brl(x.embedded),'FGTS: '+brl(x.fgts),'Crédito líquido: '+brl(x.credit),'Saldo estimado: '+brl(x.net),'Redução da parcela: '+brl(x.lower),'Redução do prazo: '+x.shorter+' meses','Sujeito à confirmação da administradora; sem garantia de contemplação.'].join('\n');try{await navigator.clipboard.writeText(msg);el('lsStatus').textContent='Cenário copiado.'}catch(e){el('lsStatus').textContent='Não foi possível copiar automaticamente.'}};
    dialog.addEventListener('close',()=>dialog.remove());
    update();dialog.showModal();
  };
})();
