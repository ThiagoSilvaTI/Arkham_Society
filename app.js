
const data=JSON.parse(localStorage.getItem('garageProData')||'{"clients":[],"vehicles":[],"parts":[]}');
    function persist(){localStorage.setItem('garageProData',JSON.stringify(data));refreshNotifications()}
    const os=[];
    const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    function renderRows(type,query=''){const rows=data[type].filter(r=>r.join(' ').toLowerCase().includes(query.toLowerCase()));const id=type==='clients'?'clientRows':type==='vehicles'?'vehicleRows':'stockRows';document.getElementById(id).innerHTML=rows.map((r,i)=>type==='clients'?`<tr><td><div class="person"><span class="avatar">${(r[0]||'?').split(' ').map(x=>x[0]).slice(0,2).join('')}</span><b>${esc(r[0])}</b></div></td><td>${esc(r[1]||'')}</td><td>${r[2]||0} veículo(s)</td><td>${r[3]||'Ainda não'}</td><td>${r[4]||'R$ 0,00'}</td><td><span class="status green">Ativo</span></td><td class="row-actions"><button data-edit="${type}" data-index="${i}">Editar</button><button class="delete" data-delete="${type}" data-index="${i}">Excluir</button></td></tr>`:type==='vehicles'?`<tr><td><b>${esc(r[0])}</b></td><td><span class="tag">${esc(r[1])}</span></td><td>${esc(r[2])}</td><td>${esc(r[3])} km</td><td>${r[4]||'Ainda não'}</td><td><span class="status green">Ativo</span></td><td class="row-actions"><button data-edit="${type}" data-index="${i}">Editar</button><button class="delete" data-delete="${type}" data-index="${i}">Excluir</button></td></tr>`:`<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td class="${Number(r[3])<Number(r[4])?'low':''}">${r[3]} un.</td><td>${r[4]} un.</td><td>R$ ${Number(r[5]||0).toFixed(2).replace('.',',')}</td><td><span class="status ${r[3]===0?'red':r[3]<r[4]?'orange':'green'}">${r[3]===0?'Zerado':r[3]<r[4]?'Estoque baixo':'Normal'}</span></td><td class="row-actions"><button data-edit="${type}" data-index="${i}">Editar</button><button class="delete" data-delete="${type}" data-index="${i}">Excluir</button></td></tr>`).join('')||`<tr><td colspan="8" class="empty">Nenhum registro cadastrado. Use o botão acima para começar.</td></tr>`;document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openModal(b.dataset.edit,Number(b.dataset.index)));document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>removeRecord(b.dataset.delete,Number(b.dataset.index)))}
    function removeRecord(type,index){if(!confirm('Excluir este registro?'))return;data[type].splice(index,1);persist();renderRows(type);toast('Registro excluído.')}
    function renderKanban(){const lanes=['Aguardando','Aprovado','Em execução','Finalizado'];document.getElementById('kanban').innerHTML=lanes.map(l=>`<div class="lane"><div class="lane-head"><b>${l}</b><span>${os.filter(x=>x.status===l).length}</span></div>${os.filter(x=>x.status===l).map(x=>`<article class="os-card"><b>${x.id} · ${x.title}</b><p>${x.client}</p><div class="os-meta"><span>Responsável</span><span class="avatar">${x.mechanic}</span></div></article>`).join('')}</div>`).join('')}
    const fields={client:[['name','Nome completo','wide'],['doc','CPF ou CNPJ',''],['phone','Telefone / WhatsApp',''],['email','E-mail',''],['notes','Observações','wide']],vehicle:[['plate','Placa',''],['model','Marca e modelo',''],['year','Ano',''],['km','Quilometragem',''],['owner','Cliente','wide']],part:[['name','Nome da peça','wide'],['sku','SKU / código interno',''],['category','Categoria',''],['stock','Estoque atual',''],['minimum','Estoque mínimo',''],['price','Preço de venda (R$)','']],appointment:[['client','Cliente',''],['vehicle','Veículo / placa',''],['date','Data',''],['time','Horário',''],['service','Serviço','wide']],os:[['client','Cliente',''],['vehicle','Veículo',''],['diagnosis','Diagnóstico inicial','wide'],['mechanic','Mecânico responsável',''],['delivery','Previsão de entrega','']]};
    const labels={client:'Novo cliente',vehicle:'Novo veículo',part:'Nova peça',appointment:'Novo agendamento',os:'Nova ordem de serviço',budget:'Novo orçamento',expense:'Nova despesa'};
    let editing={type:null,index:null};const requiredFields={client:['name'],vehicle:['plate','model','owner'],part:['name','sku']};function openModal(type,index=null){editing={type,index};document.getElementById('modalTitle').textContent=index===null?(labels[type]||'Novo cadastro'):'Editar cadastro';const fs=fields[type]||fields.os;const old=index===null?null:data[type]?.[index];document.getElementById('formFields').innerHTML=fs.map(([id,label,wide],i)=>`<label class="${wide}">${label}<input name="${id}" value="${old?esc(old[i]||''):''}" ${id==='date'||id==='delivery'?'type="date"':''} ${requiredFields[type]?.includes(id)?'required':''}></label>`).join('');document.getElementById('modalBg').classList.add('show')}
    function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}
    function showView(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===id));document.getElementById('crumb').textContent=document.querySelector(`[data-view="${id}"]`)?.innerText.trim()||id; if(id==='clients')renderRows('clients');if(id==='vehicles')renderRows('vehicles');if(id==='stock')renderRows('parts');if(id==='os')renderKanban()}
    document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));document.querySelectorAll('[data-new]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.new)));document.querySelectorAll('[data-filter]').forEach(input=>input.addEventListener('input',()=>renderRows(input.dataset.filter,input.value)));document.getElementById('globalSearch').addEventListener('input',e=>{const q=e.target.value.toLowerCase();if(!q)return;const found=data.vehicles.find(v=>v.join(' ').toLowerCase().includes(q))||data.clients.find(v=>v.join(' ').toLowerCase().includes(q));if(found)showView(found.length===5?'vehicles':'clients')});document.getElementById('closeModal').onclick=document.getElementById('cancelModal').onclick=()=>document.getElementById('modalBg').classList.remove('show');document.getElementById('modalForm').addEventListener('submit',e=>{e.preventDefault();const values=[...new FormData(e.target).values()];const type=editing.type;const collection=type==='client'?'clients':type==='vehicle'?'vehicles':type==='part'?'parts':type;let record;if(type==='client')record=[values[0],values[2],0,'Ainda não','R$ 0,00'];if(type==='vehicle')record=[values[1],values[0],values[4],values[3],'Ainda não'];if(type==='part')record=[values[0],values[1],values[2],Number(values[3]||0),Number(values[4]||0),Number(values[5]||0)];if(record){if(editing.index===null)data[collection].push(record);else data[collection][editing.index]=record;persist();document.getElementById('modalBg').classList.remove('show');renderRows(collection);toast('Cadastro salvo com sucesso.')}});document.getElementById('stockIn').addEventListener('click',()=>openModal('part'));
    function normalizeSearch(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
    function matchesSearch(value,query){const text=normalizeSearch(value);return normalizeSearch(query).split(/\s+/).filter(Boolean).every(token=>text.includes(token))}
    function searchResultsFor(query){
        const results=[];
        document.querySelectorAll('.nav-item[data-view]').forEach(button=>{
            const title=button.querySelector('span:last-child').textContent.trim();
            if(matchesSearch(title,query))results.push({title,detail:'Abrir seção',category:'Seção',view:button.dataset.view});
        });
        const createLabels={client:'Novo cliente',vehicle:'Novo veículo',part:'Nova peça'};
        document.querySelectorAll('[data-new]').forEach(button=>{
            const type=button.dataset.new;
            if(createLabels[type]&&matchesSearch(`${createLabels[type]} ${button.textContent}`,query)){
                results.push({title:createLabels[type],detail:'Abrir formulário de cadastro',category:'Ação',create:type});
            }
        });
        const collections=[
            {type:'clients',view:'clients',category:'Cliente'},
            {type:'vehicles',view:'vehicles',category:'Veículo'},
            {type:'parts',view:'stock',category:'Peça'}
        ];
        collections.forEach(({type,view,category})=>data[type].forEach(record=>{
            if(matchesSearch(record.join(' '),query))results.push({title:String(record[0]||'Sem nome'),detail:record.slice(1,4).filter(Boolean).join(' · '),category,view,filterable:type});
        }));
        customerAppointments.forEach(request=>{
            const text=Object.values(request).join(' ');
            if(matchesSearch(text,query))results.push({title:request.name||'Pedido de cliente',detail:`${request.service||'Agendamento'} · ${request.vehicle||'Veículo não informado'}`,category:'Pedido',view:'customerRequests',filterable:'customerRequests'});
        });
        return results.slice(0,8);
    }
    function runSearchResult(result){
        document.getElementById('searchResults').classList.remove('open');
        document.getElementById('globalSearch').value=result.title;
        if(result.create){openModal(result.create);return}
        showView(result.view);
        if(!result.filterable)return;
        if(result.filterable==='customerRequests'){
            const input=document.getElementById('customerRequestSearch');
            input.value=result.title;
            renderCustomerRequests(result.title);
            return;
        }
        const input=document.querySelector(`[data-filter="${result.filterable}"]`);
        if(input){input.value=result.title;renderRows(result.filterable,result.title)}
    }
    function initGlobalSearch(){
        const input=document.getElementById('globalSearch');
        const replacement=input.cloneNode(true);
        input.replaceWith(replacement);
        const results=document.createElement('div');
        results.className='search-results';
        results.id='searchResults';
        results.setAttribute('role','listbox');
        replacement.setAttribute('aria-controls',results.id);
        replacement.setAttribute('aria-autocomplete','list');
        replacement.parentElement.append(results);
        const render=()=>{
            const query=replacement.value.trim();
            if(!query){results.classList.remove('open');results.replaceChildren();return}
            const matches=searchResultsFor(query);
            results.replaceChildren();
            if(!matches.length){
                const empty=document.createElement('div');
                empty.className='search-empty';
                empty.textContent='Nenhum resultado encontrado.';
                results.append(empty);
            }else matches.forEach((result,index)=>{
                const button=document.createElement('button');
                button.type='button';
                button.className='search-result';
                button.setAttribute('role','option');
                button.dataset.resultIndex=String(index);
                const copy=document.createElement('span');
                copy.className='search-result-copy';
                const title=document.createElement('b');
                title.textContent=result.title;
                const detail=document.createElement('small');
                detail.textContent=result.detail;
                copy.append(title,detail);
                const category=document.createElement('span');
                category.className='search-result-type';
                category.textContent=result.category;
                button.append(copy,category);
                button.addEventListener('click',()=>runSearchResult(result));
                results.append(button);
            });
            results.classList.add('open');
        };
        replacement.addEventListener('input',render);
        replacement.addEventListener('keydown',event=>{
            if(event.key==='Escape'){results.classList.remove('open');return}
            if(event.key==='Enter'){
                const first=searchResultsFor(replacement.value.trim())[0];
                if(first){event.preventDefault();runSearchResult(first)}
            }
        });
        document.addEventListener('click',event=>{
            if(!replacement.parentElement?.contains(event.target))results.classList.remove('open');
        });
    }
    function showEmptyWorkspace(){if(data.clients.length||data.vehicles.length||data.parts.length||os.length)return;const dashboard=document.getElementById('dashboard');dashboard.querySelector('h1').textContent='Comece por aqui.';dashboard.querySelector('.sub').textContent='Cadastre seus dados e acompanhe sua operação neste painel.';const firstAction=dashboard.querySelector('[data-new="os"]');if(firstAction){firstAction.dataset.new='client';firstAction.textContent='+ Cadastrar cliente'}dashboard.querySelectorAll('.kpi strong').forEach((item,i)=>item.textContent=i===0||i===3?'R$ 0,00':i===4?'0 itens':'0');const layout=dashboard.querySelector('.layout');if(layout)layout.innerHTML='<div class="panel empty">Seu painel vai ganhar vida conforme você cadastrar clientes, veículos, serviços e ordens de serviço.</div>';const alerts=dashboard.querySelector('.alerts');if(alerts)alerts.innerHTML='<div class="panel-head"><div><h2>Central de atenção</h2><p>Nenhum alerta por enquanto</p></div></div>';const agenda=document.querySelector('#agenda .panel');if(agenda)agenda.innerHTML='<div class="empty">Nenhum agendamento cadastrado. Use "+ Novo agendamento" para começar.</div>';const budgets=document.querySelector('#budgets tbody');if(budgets)budgets.innerHTML='<tr><td colspan="6" class="empty">Nenhum orçamento cadastrado.</td></tr>';const finance=document.querySelector('#finance tbody');if(finance)finance.innerHTML='<tr><td colspan="5" class="empty">Nenhum lançamento financeiro cadastrado.</td></tr>'}
    showEmptyWorkspace();renderRows('clients');renderRows('vehicles');renderRows('parts');

    function clearSampleData(){
        const dashboard=document.getElementById('dashboard');
        const today=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'short',year:'numeric'}).format(new Date());
        dashboard.querySelector('.eyebrow').textContent=today.toUpperCase();
        dashboard.querySelector('h1').textContent='Painel da oficina';
        dashboard.querySelector('.sub').textContent='Os indicadores serão atualizados quando houver dados reais.';
        dashboard.querySelectorAll('.kpi').forEach((card,index)=>{
            card.querySelector('strong').textContent=index===0||index===3?'R$ 0,00':index===4?'0 itens':'0';
            card.querySelector('.trend').textContent='Sem movimentações registradas';
        });
        dashboard.querySelector('.layout').innerHTML='<div class="panel empty">Ainda não há movimentações suficientes para exibir indicadores.</div>';
        dashboard.querySelector('.alerts').innerHTML='<div class="panel-head"><div><h2>Central de atenção</h2><p>Nenhum alerta cadastrado</p></div></div>';

        const agenda=document.querySelector('#agenda .panel');
        document.querySelector('#agenda .page-head .sub').textContent='Nenhum agendamento cadastrado.';
        agenda.querySelectorAll('.agenda-row').forEach(row=>row.remove());
        const agendaEmpty=agenda.querySelector('.empty')||document.createElement('div');
        agendaEmpty.className='empty';
        agendaEmpty.textContent='Nenhum agendamento cadastrado.';
        if(!agendaEmpty.isConnected)agenda.append(agendaEmpty);

        document.querySelector('#budgets tbody').innerHTML='<tr><td colspan="6" class="empty">Nenhum orçamento cadastrado.</td></tr>';
        document.querySelectorAll('#finance .kpi').forEach(card=>{
            card.querySelector('strong').textContent='R$ 0,00';
            card.querySelector('.trend').textContent='Sem lançamentos registrados';
        });
        document.querySelector('#finance tbody').innerHTML='<tr><td colspan="5" class="empty">Nenhum lançamento financeiro cadastrado.</td></tr>';
        document.querySelector('#reports .layout').innerHTML='<div class="panel empty">Nenhum serviço ou indicador cadastrado para exibir relatórios.</div>';
    }
    clearSampleData();

    const serviceCatalog=[
        {name:'Revisão preventiva',description:'Inspeção geral e manutenção preventiva.'},
        {name:'Troca de óleo e filtros',description:'Troca do óleo do motor e dos filtros.'},
        {name:'Freios',description:'Inspeção e manutenção do sistema de freios.'},
        {name:'Alinhamento e balanceamento',description:'Ajuste de direção e balanceamento das rodas.'},
        {name:'Diagnóstico eletrônico',description:'Leitura de falhas e avaliação eletrônica do veículo.'}
    ];
    const phoneCountries=[
        {name:'Brasil',code:'55',min:10,max:11},{name:'Estados Unidos',code:'1',min:10,max:10},{name:'Canadá',code:'1',min:10,max:10},
        {name:'México',code:'52',min:10,max:10},{name:'Argentina',code:'54',min:10,max:10},{name:'Chile',code:'56',min:9,max:9},
        {name:'Colômbia',code:'57',min:10,max:10},{name:'Portugal',code:'351',min:9,max:9},{name:'Espanha',code:'34',min:9,max:9},
        {name:'Reino Unido',code:'44',min:10,max:10},{name:'França',code:'33',min:9,max:9},{name:'Alemanha',code:'49',min:10,max:11},
        {name:'Itália',code:'39',min:9,max:10},{name:'Austrália',code:'61',min:9,max:9},{name:'Japão',code:'81',min:10,max:10},
        {name:'China',code:'86',min:11,max:11},{name:'Índia',code:'91',min:10,max:10},{name:'África do Sul',code:'27',min:9,max:9},
        {name:'Angola',code:'244',min:9,max:9},{name:'Moçambique',code:'258',min:9,max:9}
    ];
    const phoneCountriesByCode=[...phoneCountries].sort((a,b)=>b.code.length-a.code.length);
    const splitPhone=value=>{
        const digits=String(value||'').replace(/\D/g,'');
        const hasPrefix=String(value||'').trim().startsWith('+');
        const country=hasPrefix?phoneCountriesByCode.find(item=>digits.startsWith(item.code))||phoneCountries[0]:phoneCountries[0];
        let local=hasPrefix?digits.slice(country.code.length):digits;
        if(!hasPrefix&&country.code==='55'&&local.startsWith('55')&&local.length>11)local=local.slice(2);
        return {country,local:local.slice(0,country.max)};
    };
    const countryOptions=selected=>phoneCountries.map(item=>`<option value="${item.name}" ${item.name===selected?'selected':''}>${item.name} (+${item.code})</option>`).join('');
    function mountPhoneInput(container,id,value='',required=false){
        if(!container)return;
        const parsed=splitPhone(value);
        container.innerHTML=`<select name="${id}Country" aria-label="País do telefone" required><option value="" disabled>País</option>${countryOptions(parsed.country.name)}</select><input name="${id}Digits" type="text" inputmode="numeric" autocomplete="tel-national" pattern="[0-9]{${parsed.country.min},${parsed.country.max}}" maxlength="${parsed.country.max}" placeholder="${parsed.country.min===parsed.country.max?'9'.repeat(parsed.country.max):'DDD + número'}" value="${parsed.local}" ${required?'required':''} aria-label="Número de telefone, somente dígitos">`;
        const country=container.querySelector('select');
        const digits=container.querySelector('input');
        const update=()=>{
            const selected=phoneCountries.find(item=>item.name===country.value)||phoneCountries[0];
            digits.maxLength=selected.max;
            digits.pattern=`[0-9]{${selected.min},${selected.max}}`;
            digits.placeholder=selected.min===selected.max?'9'.repeat(selected.max):'DDD + número';
            digits.value=digits.value.replace(/\D/g,'').slice(0,selected.max);
            const isOptionalEmpty=!digits.required&&digits.value.length===0;
            digits.setCustomValidity(isOptionalEmpty||digits.value.length>=selected.min&&digits.value.length<=selected.max?'':`Informe de ${selected.min} a ${selected.max} dígitos para ${selected.name}.`);
        };
        digits.addEventListener('input',()=>{
            const clean=digits.value.replace(/\D/g,'');
            if(digits.value!==clean)digits.value=clean;
            update();
            digits.classList.toggle('field-invalid',!digits.validity.valid);
        });
        country.addEventListener('change',update);
        digits.addEventListener('blur',()=>digits.classList.toggle('field-invalid',digits.value!==''&&!digits.validity.valid));
        update();
    }
    const phoneValueFromForm=(form,id)=>{
        const countryName=form.elements[`${id}Country`]?.value;
        const digits=String(form.elements[`${id}Digits`]?.value||'').replace(/\D/g,'');
        const country=phoneCountries.find(item=>item.name===countryName);
        if(!digits)return '';
        return country?`+${country.code}${digits}`:'';
    };
    function installEmailAssist(root){
        root.querySelectorAll('input[type="email"]:not([data-email-assist])').forEach(input=>{
            input.dataset.emailAssist='true';
            input.maxLength=Math.min(input.maxLength||160,160);
            input.pattern='[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}';
            const row=document.createElement('div');
            row.className='field-action-row';
            input.replaceWith(row);
            row.append(input);
            const button=document.createElement('button');
            button.type='button';
            button.textContent='@gmail.com';
            button.setAttribute('aria-label','Completar e-mail com gmail.com');
            button.addEventListener('click',()=>{
                const name=input.value.trim().split('@')[0];
                input.value=name?`${name}@gmail.com`:'';
                input.dispatchEvent(new Event('input',{bubbles:true}));
                input.focus();
            });
            row.append(button);
            input.addEventListener('input',()=>input.setCustomValidity(''));
        });
    }
    function installPasswordToggles(root){
        root.querySelectorAll('input[type="password"]:not([data-password-toggle])').forEach(input=>{
            input.dataset.passwordToggle='true';
            const row=document.createElement('div');
            row.className='password-input-row';
            input.replaceWith(row);
            row.append(input);
            const button=document.createElement('button');
            button.type='button';
            button.className='password-toggle';
            button.textContent='◉';
            button.setAttribute('aria-label','Mostrar senha');
            button.setAttribute('aria-pressed','false');
            button.addEventListener('click',()=>{
                const visible=input.type==='password';
                input.type=visible?'text':'password';
                button.setAttribute('aria-label',visible?'Ocultar senha':'Mostrar senha');
                button.setAttribute('aria-pressed',String(visible));
            });
            row.append(button);
        });
    }
    function installFormatValidation(root){
        root.querySelectorAll('input[name="document"]:not([data-format-validation])').forEach(input=>{
            input.dataset.formatValidation='true';
            input.addEventListener('input',()=>{
                input.value=input.value.replace(/\D/g,'').slice(0,14);
                input.setCustomValidity(validBrazilianDocument(input.value)?'':'Informe um CPF ou CNPJ válido, somente com números.');
                input.classList.toggle('field-invalid',Boolean(input.value)&&!input.validity.valid);
            });
            input.dispatchEvent(new Event('input',{bubbles:true}));
        });
        root.querySelectorAll('input[name="plate"]:not([data-format-validation])').forEach(input=>{
            input.dataset.formatValidation='true';
            input.pattern='[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}';
            input.title='Use o formato ABC1234 ou ABC1D23.';
            input.addEventListener('input',()=>{
                input.value=input.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7);
                input.setCustomValidity(input.value===''||/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(input.value)?'':'Use uma placa válida, como ABC1234 ou ABC1D23.');
            });
            input.dispatchEvent(new Event('input',{bubbles:true}));
        });
        root.querySelectorAll('input[type="number"]').forEach(input=>{
            input.addEventListener('input',()=>{
                if(input.value&&Number(input.value)<0)input.value='';
            });
        });
    }
    const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value||'').trim())&&String(value||'').length<=160;
    const validBrazilianDocument=value=>{
        const digits=String(value||'').replace(/\D/g,'');
        if(!digits)return true;
        if(/^(\d)\1+$/.test(digits))return false;
        if(digits.length===11){
            const check=length=>{
                const sum=[...digits.slice(0,length)].reduce((total,digit,index)=>total+Number(digit)*(length+1-index),0);
                const result=(sum*10)%11;
                return result===10?0:result;
            };
            return check(9)===Number(digits[9])&&check(10)===Number(digits[10]);
        }
        if(digits.length===14){
            const digit=(source,weights)=>{
                const sum=[...source].reduce((total,value,index)=>total+Number(value)*weights[index],0);
                const remainder=sum%11;
                return remainder<2?0:11-remainder;
            };
            const first=digit(digits.slice(0,12),[5,4,3,2,9,8,7,6,5,4,3,2]);
            const second=digit(digits.slice(0,12)+first,[6,5,4,3,2,9,8,7,6,5,4,3,2]);
            return first===Number(digits[12])&&second===Number(digits[13]);
        }
        return false;
    };
    const loadStored=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(error){console.error(`Não foi possível ler ${key} do armazenamento local.`,error);return fallback}};
    let accounts=loadStored('mekanikUsers',[]);
    let customerAppointments=loadStored('mekanikAppointments',[]);
    let customerPartRequests=loadStored('mekanikPartRequests',[]);
    let pendingPartRequest=null;
    let authMode='login';
    let profilePhotoData='';
    const authScreen=document.getElementById('authScreen');
    const authForm=document.getElementById('authForm');
    const authError=document.getElementById('authError');
    const currentUserKey='mekanikCurrentUser';
    installEmailAssist(authForm);
    installPasswordToggles(authForm);
    mountPhoneInput(document.getElementById('registerPhoneField'),'phone','',true);
    installEmailAssist(document.getElementById('profileForm'));
    installPasswordToggles(document.getElementById('profileForm'));
    const saveAccounts=()=>localStorage.setItem('mekanikUsers',JSON.stringify(accounts));
    const saveCustomerAppointments=()=>{localStorage.setItem('mekanikAppointments',JSON.stringify(customerAppointments));refreshNotifications()};
    const setAuthError=message=>{authError.textContent=message};
    const updateRoleVisibility=()=>authScreen.classList.toggle('admin-register',document.getElementById('registerRole').value==='admin');
    const initials=name=>String(name||'?').trim().split(/\s+/).map(part=>part[0]).slice(0,2).join('').toUpperCase()||'?';
    function setAvatar(element,user){
        if(!element)return;
        element.innerHTML=user.photo?`<img src="${esc(user.photo)}" alt="">`:esc(initials(user.name));
    }
    function setTheme(theme){
        const selected=theme==='light'?'light':'dark';
        document.body.dataset.theme=selected;
        localStorage.setItem('mekanikTheme',selected);
        document.querySelectorAll('.brand-logo,.mekanik2-intro img').forEach(logo=>{
            logo.src='https://www.image2url.com/r2/default/images/1794593515520-425e7846-039a-48cd-8969-56716e043d1c.jpeg';
            logo.alt='Logo Mekanik';
        });
        document.querySelectorAll('.theme-toggle').forEach(button=>{
            button.textContent=selected==='light'?'☾':'☀';
            button.setAttribute('aria-pressed',String(selected==='light'));
            button.title=selected==='light'?'Ativar modo escuro':'Ativar modo claro';
            button.setAttribute('aria-label',button.title);
        });
    }
    function makeButton(text,className,handler){
        const button=document.createElement('button');
        button.type='button';
        button.className=className;
        button.textContent=text;
        button.addEventListener('click',handler);
        return button;
    }
    function openProfileEditor(){
        const email=sessionStorage.getItem(currentUserKey);
        const activeAccount=accounts.find(account=>account.email===email);
        if(!activeAccount){toast('Entre novamente para editar seu perfil.');return}
        const form=document.getElementById('profileForm');
        form.elements.name.value=activeAccount.name;
        form.elements.email.value=activeAccount.email;
        form.elements.currentPassword.value='';
        form.elements.newPassword.value='';
        form.elements.confirmPassword.value='';
        mountPhoneInput(document.getElementById('profilePhoneField'),'phone',activeAccount.phone||'',false);
        profilePhotoData=activeAccount.photo||'';
        document.getElementById('profilePhoto').value='';
        document.getElementById('profileError').textContent='';
        setAvatar(document.getElementById('profilePreview'),{name:activeAccount.name,photo:profilePhotoData});
        const modal=document.getElementById('profileModal');
        modal.classList.add('show');
        modal.setAttribute('aria-hidden','false');
    }
    function closeProfileEditor(){
        const modal=document.getElementById('profileModal');
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden','true');
    }
    async function readProfilePhoto(file){
        if(!file.type.startsWith('image/'))throw new Error('Escolha um arquivo de imagem.');
        if(file.size>8*1024*1024)throw new Error('A imagem deve ter no máximo 8 MB.');
        const source=await new Promise((resolve,reject)=>{
            const reader=new FileReader();
            reader.onload=()=>resolve(String(reader.result));
            reader.onerror=()=>reject(new Error('Não foi possível ler o arquivo escolhido.'));
            reader.readAsDataURL(file);
        });
        const image=await new Promise((resolve,reject)=>{
            const picture=new Image();
            picture.onload=()=>resolve(picture);
            picture.onerror=()=>reject(new Error('Não foi possível abrir esta imagem.'));
            picture.src=source;
        });
        const scale=Math.min(1,512/Math.max(image.width,image.height));
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(image.width*scale));
        canvas.height=Math.max(1,Math.round(image.height*scale));
        const context=canvas.getContext('2d');
        if(!context)throw new Error('Não foi possível preparar a imagem neste navegador.');
        context.drawImage(image,0,0,canvas.width,canvas.height);
        return canvas.toDataURL('image/jpeg',0.82);
    }
    function installAccountControls(){
        const sidebarFooter=document.querySelector('.side-foot');
        sidebarFooter.querySelector('.logout-button').remove();
        const topActions=document.querySelector('.top-actions');
        const themeToggle=makeButton('☀','circle-btn theme-toggle',()=>setTheme(document.body.dataset.theme==='light'?'dark':'light'));
        topActions.insertBefore(themeToggle,topActions.querySelector('.circle-btn'));
        const notificationButton=topActions.querySelector('.circle-btn:not(.theme-toggle)');
        const notificationWrap=document.createElement('div');
        notificationWrap.className='notification-wrap';
        notificationButton.textContent='🔔︎';
        notificationButton.setAttribute('aria-label','Notificações');
        notificationButton.setAttribute('aria-haspopup','true');
        notificationButton.setAttribute('aria-expanded','false');
        const notificationMenu=document.createElement('div');
        notificationMenu.className='notification-menu';
        notificationMenu.id='notificationMenu';
        notificationMenu.setAttribute('role','menu');
        notificationMenu.innerHTML='<h3>Notificações</h3><div class="notification-list"></div>';
        notificationButton.setAttribute('aria-controls',notificationMenu.id);
        notificationButton.replaceWith(notificationWrap);
        notificationWrap.append(notificationButton,notificationMenu);
        notificationButton.addEventListener('click',()=>{
            const open=notificationMenu.classList.toggle('open');
            notificationButton.setAttribute('aria-expanded',String(open));
            closeAccountMenu();
        });
        notificationMenu.querySelector('.notification-list').addEventListener('click',event=>{
            const item=event.target.closest('[data-notification-view]');
            if(!item)return;
            notificationMenu.classList.remove('open');
            notificationButton.setAttribute('aria-expanded','false');
            showView(item.dataset.notificationView);
            if(item.dataset.notificationFilter){
                const input=item.dataset.notificationView==='customerRequests'
                    ?document.getElementById('customerRequestSearch')
                    :document.querySelector('[data-filter="parts"]');
                if(input){input.value=item.dataset.notificationFilter;if(item.dataset.notificationView==='customerRequests')renderCustomerRequests(input.value);else renderRows('parts',input.value)}
            }
        });
        const adminAvatar=document.querySelector('.top-actions .avatar');
        adminAvatar.id='adminTopAvatar';
        installAccountMenu(adminAvatar,false);
        initGlobalSearch();

        const clientActions=document.querySelector('.client-topbar > div:last-child');
        clientActions.classList.add('account-actions');
        const clientAvatar=document.createElement('span');
        clientAvatar.className='avatar';
        clientAvatar.id='clientAvatar';
        clientActions.prepend(clientAvatar);
        const clientLogout=clientActions.querySelector('.logout-button');
        clientLogout.remove();
        clientActions.prepend(makeButton('☀','circle-btn theme-toggle',()=>setTheme(document.body.dataset.theme==='light'?'dark':'light')));
        installAccountMenu(clientAvatar,true);

        const clientContent=document.querySelector('.client-content');
        const bookingPanel=document.querySelector('.booking-panel');
        bookingPanel.id='bookingPanel';
        document.querySelector('.my-bookings').id='myBookingsPanel';
        const overview=document.createElement('section');
        overview.className='panel client-overview';
        overview.innerHTML='<div><h2>Seu espaço Mekanik</h2><p>Agende serviços, acompanhe seus pedidos e mantenha seus dados atualizados.</p></div><div class="client-quick-actions"></div>';
        const quickActions=overview.querySelector('.client-quick-actions');
        quickActions.append(
            makeButton('＋ Agendar serviço','primary',()=>bookingPanel.scrollIntoView({behavior:'smooth',block:'start'})),
            makeButton('▤ Meus pedidos','ghost',()=>document.getElementById('myBookingsPanel').scrollIntoView({behavior:'smooth',block:'start'}))
        );
        clientContent.insertBefore(overview,document.querySelector('.client-section-title'));
        setTheme(localStorage.getItem('mekanikTheme')||'dark');
        document.getElementById('customerRequestSearch').addEventListener('input',event=>renderCustomerRequests(event.currentTarget.value));
        document.addEventListener('click',event=>{
            if(!event.target.closest('.account-menu-wrap'))closeAccountMenu();
            if(!event.target.closest('.notification-wrap')){
                const menu=document.getElementById('notificationMenu');
                const button=document.querySelector('.notification-wrap .circle-btn');
                menu.classList.remove('open');
                button.setAttribute('aria-expanded','false');
            }
        });
        document.addEventListener('keydown',event=>{
            if(event.key==='Escape'){
                closeAccountMenu();
                document.getElementById('notificationMenu').classList.remove('open');
                document.querySelector('.notification-wrap .circle-btn').setAttribute('aria-expanded','false');
                document.getElementById('searchResults').classList.remove('open');
            }
        });
        refreshNotifications();
    }
    function closeAccountMenu(){
        document.querySelectorAll('.account-menu.open').forEach(menu=>menu.classList.remove('open'));
        document.querySelectorAll('.account-trigger').forEach(button=>button.setAttribute('aria-expanded','false'));
    }
    function installAccountMenu(avatar,isClient){
        const wrap=document.createElement('div');
        wrap.className='account-menu-wrap';
        const trigger=document.createElement('button');
        trigger.type='button';
        trigger.className='avatar account-trigger';
        trigger.id=avatar.id;
        trigger.setAttribute('aria-label','Abrir menu da conta');
        trigger.setAttribute('aria-haspopup','true');
        trigger.setAttribute('aria-expanded','false');
        trigger.textContent=avatar.textContent;
        avatar.replaceWith(wrap);
        const menu=document.createElement('div');
        menu.className='account-menu';
        menu.id=isClient?'clientAccountMenu':'adminAccountMenu';
        menu.setAttribute('role','menu');
        trigger.setAttribute('aria-controls',menu.id);
        menu.setAttribute('aria-labelledby',trigger.id);
        const shortcuts=isClient
            ?'<button class="menu-action" data-account-shortcut="booking" type="button">Agendar serviço</button><button class="menu-action" data-account-shortcut="bookings" type="button">Meus pedidos</button>'
            :'<button class="menu-action" data-account-view="clients" type="button">Clientes</button><button class="menu-action" data-account-view="agenda" type="button">Agenda</button><button class="menu-action" data-account-view="stock" type="button">Estoque</button><button class="menu-action" data-account-view="customerRequests" type="button">Pedidos de clientes</button>';
        menu.innerHTML=`<div class="account-menu-heading"><b class="account-menu-name">${isClient?'Minha conta':'Administrador'}</b><small class="account-menu-email"></small></div><button class="menu-action" data-account-profile type="button">Editar perfil</button><div class="menu-divider"></div>${shortcuts}<div class="menu-divider"></div><button class="menu-action logout-button" type="button">Sair da conta</button>`;
        menu.querySelectorAll('button').forEach(button=>button.setAttribute('role','menuitem'));
        wrap.append(trigger,menu);
        trigger.addEventListener('click',()=>{
            const wasOpen=menu.classList.contains('open');
            closeAccountMenu();
            document.querySelectorAll('.notification-menu.open').forEach(item=>item.classList.remove('open'));
            const open=!wasOpen;
            if(open)menu.classList.add('open');
            trigger.setAttribute('aria-expanded',String(open));
        });
        if(isClient)menu.querySelector('[data-account-profile]').addEventListener('click',()=>{closeAccountMenu();openProfileEditor()});
        else menu.querySelector('[data-account-profile]').remove();
        menu.querySelectorAll('[data-account-view]').forEach(button=>button.addEventListener('click',()=>{closeAccountMenu();showView(button.dataset.accountView)}));
        menu.querySelectorAll('[data-account-shortcut]').forEach(button=>button.addEventListener('click',()=>{
            closeAccountMenu();
            const target=button.dataset.accountShortcut==='booking'?'bookingPanel':'myBookingsPanel';
            document.getElementById(target).scrollIntoView({behavior:'smooth',block:'start'});
        }));
    }
    function updateAccountMenu(user){
        const menu=document.getElementById(user.role==='client'?'clientAccountMenu':'adminAccountMenu');
        if(!menu)return;
        menu.querySelector('.account-menu-name').textContent=user.name;
        menu.querySelector('.account-menu-email').textContent=user.email;
    }
    function refreshNotifications(){
        const button=document.querySelector('.notification-wrap .circle-btn');
        const menu=document.getElementById('notificationMenu');
        if(!button||!menu)return;
        const items=[
            ...data.parts.filter(part=>Number(part[4])>0&&Number(part[3])<=Number(part[4])).map(part=>({icon:'⚠',title:`Estoque baixo: ${part[0]}`,detail:`${part[3]} un. disponíveis · mínimo ${part[4]}`,view:'stock',filter:part[0]})),
            ...customerAppointments.filter(request=>request.status==='Pendente').map(request=>({icon:'◷',title:`Pedido pendente: ${request.name}`,detail:`${request.service} · ${request.vehicle}`,view:'customerRequests',filter:request.name}))
        ];
        let badge=button.querySelector('.notification-badge');
        if(!badge){badge=document.createElement('span');badge.className='notification-badge';button.append(badge)}
        badge.textContent=String(items.length);
        badge.hidden=items.length===0;
        const list=menu.querySelector('.notification-list');
        list.replaceChildren();
        if(!items.length){
            const empty=document.createElement('div');
            empty.className='notification-empty';
            empty.textContent='Tudo em dia. Nenhuma notificação.';
            list.append(empty);
            return;
        }
        items.forEach(item=>{
            const button=document.createElement('button');
            button.type='button';
            button.className='notification-item';
            button.setAttribute('role','menuitem');
            button.dataset.notificationView=item.view;
            button.dataset.notificationFilter=item.filter;
            const icon=document.createElement('span');
            icon.className='notification-icon';
            icon.textContent=item.icon;
            const copy=document.createElement('span');
            copy.className='notification-copy';
            const title=document.createElement('b');
            title.textContent=item.title;
            const detail=document.createElement('small');
            detail.textContent=item.detail;
            copy.append(title,detail);
            button.append(icon,copy);
            list.append(button);
        });
    }
    document.getElementById('adminAvatar').textContent='AD';
    document.getElementById('adminIdentity').textContent='Administrador';
    document.querySelector('.top-actions .avatar').textContent='AD';
    installAccountControls();

    function renderServiceCatalog(){
        document.getElementById('serviceCards').innerHTML=serviceCatalog.map(service=>`<article class="service-card"><h3>${esc(service.name)}</h3><p>${esc(service.description)}</p></article>`).join('');
        document.getElementById('clientService').innerHTML=serviceCatalog.map(service=>`<option value="${esc(service.name)}">${esc(service.name)}</option>`).join('');
    }

    function renderMyBookings(email){
        const own=customerAppointments.map((item,index)=>({item,index})).filter(({item})=>item.email===email);
        document.getElementById('myBookings').innerHTML=own.length?own.map(({item,index})=>`<article class="booking-item"><div class="booking-item-copy"><b>${esc(item.service)}</b> · ${esc(item.vehicle)}<small>${esc(item.date)} às ${esc(item.time)}</small></div><div class="booking-item-actions"><span class="status ${item.status==='Confirmado'?'green':item.status==='Cancelado'?'red':'pending'}">${esc(item.status)}</span>${item.status==='Pendente'?`<button class="ghost" data-cancel-booking="${index}" type="button">Cancelar</button>`:''}</div></article>`).join(''):'<p class="sub">Você ainda não pediu nenhum agendamento. Use “Agendar serviço” para fazer seu primeiro pedido.</p>';
    }

    function renderPartRequests(email){
        const container=document.getElementById('partRequests');
        const own=customerPartRequests.filter(request=>request.email===email);
        if(!own.length){
            container.innerHTML='';
            return;
        }
        container.innerHTML=own.map(request=>`<article class="part-request-card">${request.photo?`<img src="${esc(request.photo)}" alt="Foto enviada da peça">`:'<div class="part-request-placeholder" aria-hidden="true">⌕</div>'}<div><h3>${esc(request.partName)}</h3><p>${esc(request.vehicleModel)} · Pedido enviado</p></div><span class="part-request-status">${esc(request.status)}<br><small>Ofertas reais precisam de empresas conectadas</small></span></article>`).join('');
    }

    async function readPartPhoto(file){
        if(!file.type.startsWith('image/'))throw new Error('Escolha um arquivo de imagem.');
        if(file.size>5*1024*1024)throw new Error('A foto deve ter no máximo 5 MB.');
        const source=await new Promise((resolve,reject)=>{
            const reader=new FileReader();
            reader.onload=()=>resolve(String(reader.result));
            reader.onerror=()=>reject(new Error('Não foi possível ler a foto escolhida.'));
            reader.readAsDataURL(file);
        });
        const image=await new Promise((resolve,reject)=>{
            const picture=new Image();
            picture.onload=()=>resolve(picture);
            picture.onerror=()=>reject(new Error('Não foi possível abrir esta imagem.'));
            picture.src=source;
        });
        const scale=Math.min(1,900/Math.max(image.width,image.height));
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(image.width*scale));
        canvas.height=Math.max(1,Math.round(image.height*scale));
        const context=canvas.getContext('2d');
        if(!context)throw new Error('Não foi possível preparar a imagem neste navegador.');
        context.drawImage(image,0,0,canvas.width,canvas.height);
        return canvas.toDataURL('image/jpeg',0.76);
    }

    function savePartRequest(draft,user){
        const request={...draft,id:`${Date.now()}-${Math.random().toString(16).slice(2)}`,name:user.name,email:user.email,status:'Aguardando ofertas',createdAt:new Date().toISOString()};
        try{
            const updated=[...customerPartRequests,request];
            localStorage.setItem('mekanikPartRequests',JSON.stringify(updated));
            customerPartRequests=updated;
        }catch(error){
            console.error('Não foi possível salvar o pedido de peça no armazenamento local.',error);
            document.getElementById('partRequestFeedback').textContent='Não foi possível salvar o pedido. O armazenamento local pode estar cheio; remova uma imagem ou libere espaço e tente novamente.';
            toast('Falha ao salvar o pedido.');
            return false;
        }
        renderPartRequests(user.email);
        document.getElementById('partSearchForm').reset();
        document.getElementById('partPhotoPreview').classList.remove('visible');
        document.getElementById('partRequestFeedback').textContent='Pedido salvo neste navegador. Para receber cotações reais de várias empresas, o Mekanik precisa de um banco compartilhado.';
        toast('Pedido salvo na demonstração local.');
        return true;
    }

    function showGuest(){
        document.body.classList.add('client-mode','guest-mode');
        authScreen.classList.add('hidden');
        authScreen.setAttribute('aria-hidden','true');
        document.getElementById('clientName').textContent='visitante';
        document.getElementById('bookingDate').min=new Date().toLocaleDateString('en-CA');
        renderServiceCatalog();
        document.getElementById('partRequestFeedback').textContent='Sem login: pesquise e preencha o pedido. O login só será solicitado ao enviar.';
    }

    function openAuthScreen(message=''){
        authMode='login';
        updateAuthMode();
        authScreen.classList.remove('hidden');
        authScreen.setAttribute('aria-hidden','false');
        if(message)setAuthError(message);
    }

    function showBrandIntro(){
        const intro=document.getElementById('mekanik2Intro');
        if(!intro)return;
        intro.classList.remove('play');
        void intro.offsetWidth;
        intro.classList.add('play');
        window.setTimeout(()=>intro.classList.remove('play'),1650);
    }

    function renderCustomerRequests(query=''){
        const body=document.getElementById('customerRequestRows');
        const matching=customerAppointments.map((item,index)=>({item,index})).filter(({item})=>matchesSearch(Object.values(item).join(' '),query));
        if(!matching.length){body.innerHTML=`<tr><td colspan="7" class="empty">${query?'Nenhum pedido encontrado.':'Ainda não há pedidos de clientes.'}</td></tr>`;return}
        body.innerHTML=matching.map(({item,index})=>`<tr><td>${esc(item.name)}<br><small>${esc(item.email)}</small></td><td>${esc(item.service)}</td><td>${esc(item.vehicle)}</td><td>${esc(item.date)}</td><td>${esc(item.time)}</td><td><span class="status ${item.status==='Confirmado'?'green':'pending'}">${esc(item.status)}</span></td><td>${item.status==='Pendente'?`<button class="primary customer-request-action" data-confirm-request="${index}" type="button">Confirmar</button>`:''}</td></tr>`).join('');
    }

    function enterApp(user){
        showBrandIntro();
        sessionStorage.setItem(currentUserKey,user.email);
        updateAccountMenu(user);
        authScreen.classList.add('hidden');
        authScreen.setAttribute('aria-hidden','true');
        if(user.role==='client'){
            document.body.classList.add('client-mode');
            document.body.classList.remove('guest-mode');
            document.getElementById('clientName').textContent=user.name;
            setAvatar(document.getElementById('clientAvatar'),user);
            document.getElementById('bookingDate').min=new Date().toLocaleDateString('en-CA');
            renderServiceCatalog();
            renderMyBookings(user.email);
            renderPartRequests(user.email);
            if(pendingPartRequest){
                if(savePartRequest(pendingPartRequest,user))pendingPartRequest=null;
            }
            return;
        }
        document.body.classList.remove('guest-mode');
        document.body.classList.remove('client-mode');
        setAvatar(document.getElementById('adminAvatar'),user);
        setAvatar(document.getElementById('adminTopAvatar'),user);
        const adminIdentity=document.getElementById('adminIdentity');
        if(adminIdentity)adminIdentity.innerHTML=`${esc(user.name)}<br><small>Administrador</small>`;
        document.querySelector('#dashboard h1').textContent=`Bom dia, ${user.name.trim().split(/\s+/)[0]}.`;
        showView('dashboard');
        renderCustomerRequests();
    }

    function leaveAccount(){
        sessionStorage.removeItem(currentUserKey);
        fetch('/api/auth/logout',{method:'POST'}).catch(error=>console.error('Não foi possível encerrar a sessão do servidor.',error));
        document.body.classList.remove('client-mode');
        authMode='login';
        authForm.reset();
        updateAuthMode();
        showGuest();
    }

    function updateAuthMode(){
        const registering=authMode==='register';
        authScreen.classList.toggle('registering',registering);
        document.getElementById('authTitle').textContent=registering?'Criar sua conta':'Entre na sua conta';
        document.getElementById('authDescription').textContent=registering?'Crie sua conta de cliente.':'Acesse sua área de cliente ou administrador.';
        document.getElementById('authSubmit').textContent=registering?'Criar conta':'Entrar';
        document.getElementById('authSwitch').textContent=registering?'Já tem conta? Entrar':'Ainda não tem conta? Cadastre-se';
        document.getElementById('authNote').textContent=registering?'Sua conta de cliente e seus pedidos são salvos neste navegador.':'A oficina usa uma sessão segura no servidor; contas de clientes e pedidos do portal ficam neste navegador.';
        authForm.elements.name.required=registering;
        authForm.elements.role.required=registering;
        authForm.elements.password.minLength=registering?8:6;
        const registrationPhone=document.querySelector('#registerPhoneField input');
        if(registrationPhone){
            registrationPhone.required=registering;
            if(registering)registrationPhone.dispatchEvent(new Event('input',{bubbles:true}));
            else registrationPhone.setCustomValidity('');
        }
        setAuthError('');
        updateRoleVisibility();
    }

    document.getElementById('authSwitch').addEventListener('click',()=>{authMode=authMode==='login'?'register':'login';updateAuthMode()});
    document.getElementById('registerRole').addEventListener('change',updateAuthMode);
    document.getElementById('guestContinue').addEventListener('click',()=>{
        authScreen.classList.add('hidden');
        authScreen.setAttribute('aria-hidden','true');
        setAuthError('');
    });
    document.getElementById('guestLogin').addEventListener('click',()=>openAuthScreen());
    document.getElementById('googleLogin').addEventListener('click',()=>toast('Para ativar o Google, falta criar e configurar o projeto Firebase Authentication.'));
    document.getElementById('partPhoto').addEventListener('change',async event=>{
        const file=event.currentTarget.files[0];
        const preview=document.getElementById('partPhotoPreview');
        if(!file){preview.classList.remove('visible');return}
        try{
            const photo=await readPartPhoto(file);
            preview.src=photo;
            preview.classList.add('visible');
        }catch(error){
            event.currentTarget.value='';
            preview.removeAttribute('src');
            preview.classList.remove('visible');
            document.getElementById('partRequestFeedback').textContent=error.message;
        }
    });
    document.getElementById('partSearchForm').addEventListener('submit',async event=>{
        event.preventDefault();
        const form=event.currentTarget;
        const values=new FormData(form);
        const photoFile=values.get('photo');
        let photo='';
        if(photoFile instanceof File&&photoFile.size){
            try{
                photo=await readPartPhoto(photoFile);
            }catch(error){
                document.getElementById('partRequestFeedback').textContent=error.message;
                return;
            }
        }
        const draft={
            partName:String(values.get('partName')).trim(),
            vehicleModel:String(values.get('vehicleModel')).trim(),
            photo
        };
        if(!draft.partName||!draft.vehicleModel){
            document.getElementById('partRequestFeedback').textContent='Informe o nome da peça e o modelo do veículo.';
            return;
        }
        const userEmail=sessionStorage.getItem(currentUserKey);
        const user=accounts.find(account=>account.email===userEmail&&account.role==='client');
        if(!user){
            pendingPartRequest=draft;
            openAuthScreen('Entre ou crie uma conta de cliente para enviar o pedido. O que você preencheu será mantido nesta sessão.');
            return;
        }
        savePartRequest(draft,user);
    });
    document.getElementById('closeProfile').addEventListener('click',closeProfileEditor);
    document.getElementById('cancelProfile').addEventListener('click',closeProfileEditor);
    document.getElementById('profileModal').addEventListener('click',event=>{
        if(event.target===event.currentTarget)closeProfileEditor();
    });
    document.addEventListener('keydown',event=>{
        if(event.key==='Escape'&&document.getElementById('profileModal').classList.contains('show'))closeProfileEditor();
    });
    document.getElementById('removeProfilePhoto').addEventListener('click',()=>{
        profilePhotoData='';
        setAvatar(document.getElementById('profilePreview'),{name:document.getElementById('profileForm').elements.name.value});
        document.getElementById('profilePhoto').value='';
        document.getElementById('profileError').textContent='';
    });
    document.getElementById('profilePhoto').addEventListener('change',async event=>{
        const file=event.currentTarget.files[0];
        if(!file)return;
        const error=document.getElementById('profileError');
        error.textContent='';
        try{
            profilePhotoData=await readProfilePhoto(file);
            setAvatar(document.getElementById('profilePreview'),{name:document.getElementById('profileForm').elements.name.value,photo:profilePhotoData});
        }catch(problem){
            error.textContent=problem.message;
            event.currentTarget.value='';
        }
    });
    document.getElementById('profileForm').addEventListener('submit',event=>{
        event.preventDefault();
        const account=accounts.find(item=>item.email===sessionStorage.getItem(currentUserKey));
        const error=document.getElementById('profileError');
        if(!account){error.textContent='Sua sessão expirou. Entre novamente para editar o perfil.';return}
        const values=new FormData(event.currentTarget);
        const name=String(values.get('name')).trim();
        const email=String(values.get('email')).trim().toLowerCase();
        const phoneInput=document.querySelector('#profilePhoneField input');
        const phoneDigits=String(phoneInput?.value||'').replace(/\D/g,'');
        const currentPassword=String(values.get('currentPassword'));
        const newPassword=String(values.get('newPassword'));
        const confirmPassword=String(values.get('confirmPassword'));
        if(!name||!email){error.textContent='Preencha seu nome e e-mail.';return}
        if(!validEmail(email)){error.textContent='Informe um e-mail válido, como nome@gmail.com.';return}
        if(phoneDigits&&!phoneInput.checkValidity()){error.textContent=phoneInput.validationMessage||'Confira o telefone informado.';phoneInput.reportValidity();return}
        if(accounts.some(item=>item!==account&&item.email===email)){error.textContent='Este e-mail já está associado a outra conta.';return}
        if(currentPassword||newPassword||confirmPassword){
            if(!currentPassword||!newPassword||!confirmPassword){error.textContent='Para trocar a senha, preencha a senha atual, a nova senha e a confirmação.';return}
            if(currentPassword!==account.password){error.textContent='A senha atual está incorreta.';return}
            if(newPassword.length<8||!/[A-Za-zÀ-ÿ]/.test(newPassword)||!/\d/.test(newPassword)){error.textContent='Use uma nova senha com pelo menos 8 caracteres, incluindo letras e números.';return}
            if(newPassword!==confirmPassword){error.textContent='A confirmação da nova senha não confere.';return}
            account.password=newPassword;
        }
        const previousEmail=account.email;
        account.name=name;
        account.email=email;
        account.phone=phoneValueFromForm(event.currentTarget,'phone');
        if(profilePhotoData)account.photo=profilePhotoData;
        else delete account.photo;
        if(account.role==='client'){
            customerAppointments.forEach(request=>{
                if(request.email===previousEmail){request.email=email;request.name=name}
            });
            saveCustomerAppointments();
        }
        saveAccounts();
        sessionStorage.setItem(currentUserKey,email);
        if(account.role==='client'){
            updateAccountMenu(account);
            document.getElementById('clientName').textContent=name;
            setAvatar(document.getElementById('clientAvatar'),account);
            renderMyBookings(email);
        }else{
             updateAccountMenu(account);
            setAvatar(document.getElementById('adminAvatar'),account);
            setAvatar(document.getElementById('adminTopAvatar'),account);
            const adminIdentity=document.getElementById('adminIdentity');
            if(adminIdentity)adminIdentity.innerHTML=`${esc(name)}<br><small>Administrador</small>`;
            document.querySelector('#dashboard h1').textContent=`Bom dia, ${name.split(/\s+/)[0]}.`;
            renderCustomerRequests();
        }
        closeProfileEditor();
        toast('Perfil atualizado com sucesso.');
    });
    authForm.addEventListener('submit',async event=>{
        event.preventDefault();
        const values=new FormData(authForm);
        const email=String(values.get('email')).trim().toLowerCase();
        if(!validEmail(email)){setAuthError('Informe um e-mail válido, como nome@gmail.com.');return}
        const password=String(values.get('password'));
        if(authMode==='register'){
            const name=String(values.get('name')).trim();
            if(!name){setAuthError('Digite seu nome completo.');return}
            const phoneInput=document.querySelector('#registerPhoneField input');
            if(!phoneInput||!phoneInput.checkValidity()){setAuthError(phoneInput?.validationMessage||'Informe um telefone válido.');phoneInput?.reportValidity();return}
            if(password.length<8||!/[A-Za-zÀ-ÿ]/.test(password)||!/\d/.test(password)){setAuthError('Use uma senha com pelo menos 8 caracteres, incluindo letras e números.');return}
            if(accounts.some(account=>account.email===email)){setAuthError('Já existe uma conta com este e-mail.');return}
            const account={name,email,password,phone:phoneValueFromForm(authForm,'phone'),role:'client'};
            accounts.push(account);
            saveAccounts();
            enterApp(account);
            toast('Conta criada com sucesso.');
            return;
        }
        let response;
        try{
            response=await fetch('/api/auth/login',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({email,password})
            });
        }catch(error){
            const clientAccount=accounts.find(item=>item.email===email&&item.password===password&&item.role==='client');
            if(clientAccount){enterApp(clientAccount);return}
            console.error('Não foi possível acessar o servidor de autenticação.',error);
            setAuthError('Servidor indisponível. Inicie o Mekanik com npm start e tente novamente.');
            return;
        }
        if(response.ok){
            try{
                const {user}=await response.json();
                await window.mekanikAdminReady();
                enterApp(user);
            }catch(error){
                await fetch('/api/auth/logout',{method:'POST'});
                console.error('Não foi possível carregar os dados da oficina.',error);
                setAuthError(error.message||'Não foi possível carregar os dados da oficina.');
            }
            return;
        }
        const clientAccount=accounts.find(item=>item.email===email&&item.password===password&&item.role==='client');
        if(response.status===401&&clientAccount){enterApp(clientAccount);return}
        const result=await response.json().catch(()=>({}));
        setAuthError(result.error||'Não foi possível entrar. Tente novamente.');
    });

    document.getElementById('bookingForm').addEventListener('submit',event=>{
        event.preventDefault();
        const userEmail=sessionStorage.getItem(currentUserKey);
        const user=accounts.find(account=>account.email===userEmail&&account.role==='client');
        if(!user){leaveAccount();setAuthError('Entre na conta de cliente para solicitar um horário.');return}
        const formValues=new FormData(event.currentTarget);
        const request={name:user.name,email:user.email,service:String(formValues.get('service')),vehicle:String(formValues.get('vehicle')).trim(),date:String(formValues.get('date')),time:String(formValues.get('time')),status:'Pendente'};
        if(request.date<new Date().toLocaleDateString('en-CA')){toast('Escolha hoje ou uma data futura.');return}
        customerAppointments.push(request);
        saveCustomerAppointments();
        renderMyBookings(user.email);
        event.currentTarget.reset();
        toast('Pedido enviado. Aguarde a confirmação da oficina.');
    });

    document.getElementById('myBookings').addEventListener('click',event=>{
        const button=event.target.closest('[data-cancel-booking]');
        if(!button)return;
        const request=customerAppointments[Number(button.dataset.cancelBooking)];
        const userEmail=sessionStorage.getItem(currentUserKey);
        if(!request||request.email!==userEmail){toast('Este pedido não foi encontrado.');return}
        if(request.status!=='Pendente'){toast('Somente pedidos pendentes podem ser cancelados.');return}
        if(!confirm('Deseja cancelar este pedido de agendamento?'))return;
        request.status='Cancelado';
        saveCustomerAppointments();
        renderMyBookings(userEmail);
        toast('Pedido cancelado.');
    });

    document.getElementById('customerRequestRows').addEventListener('click',event=>{
        const button=event.target.closest('[data-confirm-request]');
        if(!button)return;
        const request=customerAppointments[Number(button.dataset.confirmRequest)];
        if(!request){toast('Este pedido não foi encontrado.');return}
        request.status='Confirmado';
        saveCustomerAppointments();
        renderCustomerRequests();
    });
    document.querySelectorAll('.logout-button').forEach(button=>button.addEventListener('click',leaveAccount));
    document.querySelector('[data-view="customerRequests"]').addEventListener('click',renderCustomerRequests);
    updateAuthMode();
    renderServiceCatalog();
    const savedEmail=sessionStorage.getItem(currentUserKey)||localStorage.getItem('mekanikRememberedUser');
    const savedUser=accounts.find(account=>account.email===savedEmail&&account.role==='client');
    if(savedUser)enterApp(savedUser);
    else{
        showGuest();
        fetch('/api/auth/session').then(async response=>{
            if(!response.ok)return;
            const {user}=await response.json();
            if(!user)return;
            await window.mekanikAdminReady();
            enterApp(user);
        }).catch(error=>console.error('Não foi possível restaurar a sessão administrativa.',error));
    }

const marketplaceNavigation = document.querySelector('.sidebar');
    if (marketplaceNavigation) {
        const sectionLabel = document.createElement('div');
        sectionLabel.className = 'nav-label';
        sectionLabel.textContent = 'Conectar';

        const marketplaceLink = document.createElement('a');
        marketplaceLink.className = 'nav-item connect-link';
        marketplaceLink.href = 'belfo.html';
        marketplaceLink.title = 'Buscar produtos e serviços';
        marketplaceLink.setAttribute('aria-label', 'Buscar produtos e serviços no Perto');
        marketplaceLink.style.textDecoration = 'none';
        marketplaceLink.textContent = 'Buscar produtos';

        const sidebarFooter = marketplaceNavigation.querySelector('.side-foot');
        marketplaceNavigation.insertBefore(sectionLabel, sidebarFooter);
        marketplaceNavigation.insertBefore(marketplaceLink, sidebarFooter);
    }

    const authCard = document.querySelector('#authScreen .auth-card');
    const authNote = document.getElementById('authNote');
    if (authCard && authNote) {
        const publicMarketplaceLink = document.createElement('a');
        publicMarketplaceLink.className = 'auth-switch';
        publicMarketplaceLink.href = 'belfo.html';
        publicMarketplaceLink.textContent = 'Buscar produtos e serviços no Perto';
        publicMarketplaceLink.style.textDecoration = 'none';
        authCard.insertBefore(publicMarketplaceLink, authNote);
    }

(()=>{
        const stockView=document.getElementById('stock');
        const stockBody=document.getElementById('stockRows');
        const stockHeader=stockView.querySelector('thead tr');
        const actionHeading=document.createElement('th');
        actionHeading.textContent='Ações';
        stockHeader.append(actionHeading);
        const summary=document.createElement('div');
        summary.className='stock-summary';
        summary.innerHTML='<article class="stock-summary-card"><span>Produtos cadastrados</span><strong id="stockProductCount">0</strong></article><article class="stock-summary-card"><span>Unidades disponíveis</span><strong id="stockUnitCount">0</strong></article><article class="stock-summary-card"><span>Precisam de reposição</span><strong id="stockLowCount">0</strong></article>';
        stockView.insertBefore(summary,stockView.querySelector('.panel'));

        const modal=document.createElement('div');
        modal.className='modal-bg';
        modal.id='restockModal';
        modal.setAttribute('aria-hidden','true');
        modal.innerHTML='<section class="modal" role="dialog" aria-modal="true" aria-labelledby="restockTitle"><div class="modal-head"><h2 id="restockTitle">Registrar reposição</h2><button class="close" type="button" aria-label="Fechar">×</button></div><form id="restockForm" class="restock-form"><label>Peça<select name="part" required></select></label><p class="restock-current" id="restockCurrent"></p><label>Quantidade recebida<input name="quantity" type="number" min="1" step="1" placeholder="Ex.: 10" required></label><p class="restock-error" id="restockError" role="alert"></p><div class="modal-foot"><button class="ghost" type="button" data-restock-cancel>Cancelar</button><button class="primary" type="submit">Adicionar ao estoque</button></div></form></section>';
        document.body.append(modal);
        const restockForm=modal.querySelector('#restockForm');
        const partSelect=restockForm.elements.part;
        const currentLabel=modal.querySelector('#restockCurrent');
        const closeModal=()=>{
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden','true');
        };
        const refreshSummary=()=>{
            const parts=data.parts;
            document.getElementById('stockProductCount').textContent=String(parts.length);
            document.getElementById('stockUnitCount').textContent=String(parts.reduce((sum,part)=>sum+Math.max(0,Number(part[3])||0),0));
            document.getElementById('stockLowCount').textContent=String(parts.filter(part=>Number(part[3])<=Number(part[4])).length);
        };
        const openRestock=(selectedIndex=null)=>{
            const parts=data.parts;
            partSelect.replaceChildren();
            if(!parts.length){
                toast('Cadastre uma peça antes de registrar uma reposição.');
                openModal('part');
                return;
            }
            parts.forEach((part,index)=>{
                const option=document.createElement('option');
                option.value=String(index);
                option.textContent=`${part[0]} · ${part[1]} · ${part[3]} un.`;
                partSelect.append(option);
            });
            if(selectedIndex!==null)partSelect.value=String(selectedIndex);
            currentLabel.textContent=`Saldo atual: ${parts[Number(partSelect.value)]?.[3]??0} unidades`;
            modal.querySelector('#restockError').textContent='';
            restockForm.elements.quantity.value='';
            modal.classList.add('show');
            modal.setAttribute('aria-hidden','false');
            restockForm.elements.quantity.focus();
        };
        const renderStockRows=(query='')=>{
            const normalized=normalizeSearch(query);
            const matching=data.parts.map((part,index)=>({part,index})).filter(({part})=>matchesSearch(part.join(' '),normalized));
            stockBody.innerHTML=matching.length?matching.map(({part,index})=>{
                const quantity=Number(part[3])||0;
                const minimum=Number(part[4])||0;
                const status=quantity===0?'Zerado':quantity<=minimum?'Estoque baixo':'Normal';
                const statusClass=quantity===0?'red':quantity<=minimum?'orange':'green';
                return `<tr><td><b>${esc(part[0])}</b></td><td>${esc(part[1])}</td><td>${esc(part[2])}</td><td class="${quantity<=minimum?'low':''}">${quantity} un.</td><td>${minimum} un.</td><td>R$ ${(Number(part[5])||0).toFixed(2).replace('.',',')}</td><td><span class="status ${statusClass}">${status}</span></td><td class="row-actions"><button type="button" data-restock="${index}">Repor</button><button type="button" data-edit="part" data-index="${index}">Editar</button><button type="button" class="delete" data-delete="parts" data-index="${index}">Excluir</button></td></tr>`;
            }).join(''):'<tr><td colspan="8" class="empty">Nenhuma peça encontrada. Cadastre uma peça ou ajuste a busca.</td></tr>';
            refreshSummary();
        };
        const originalRenderRows=window.renderRows;
        window.renderRows=(type,query='')=>{
            if(type==='parts'){renderStockRows(query);return}
            originalRenderRows(type,query);
        };
        const originalOpenModal=window.openModal;
        window.openModal=(type,index=null)=>{
            if(type!=='part'){originalOpenModal(type,index);return}
            const part=index===null?[]:data.parts[index];
            if(index!==null&&!part)return;
            editing={type,index};
            document.getElementById('modalTitle').textContent=index===null?'Nova peça':'Editar peça';
            document.getElementById('formFields').innerHTML=fields.part.map(([id,label,wide],fieldIndex)=>{
                const numeric=['stock','minimum','price'].includes(id);
                const inputType=numeric?'number':'text';
                const step=id==='price'?'0.01':'1';
                const minimumValue=numeric?'min="0"':'';
                return `<label class="${wide}">${label}<input name="${id}" type="${inputType}" ${numeric?`step="${step}" ${minimumValue}`:''} value="${esc(part[fieldIndex]??'')}" ${requiredFields.part.includes(id)?'required':''}></label>`;
            }).join('');
            document.getElementById('modalBg').classList.add('show');
        };
        renderStockRows();
        const previousStockIn=stockView.querySelector('#stockIn');
        const stockIn=previousStockIn.cloneNode(true);
        previousStockIn.replaceWith(stockIn);
        stockIn.textContent='＋ Repor estoque';
        stockIn.addEventListener('click',()=>openRestock());
        stockBody.addEventListener('click',event=>{
            const restockButton=event.target.closest('[data-restock]');
            if(restockButton)openRestock(Number(restockButton.dataset.restock));
            const editButton=event.target.closest('[data-edit]');
            if(editButton)openModal('part',Number(editButton.dataset.index));
            const deleteButton=event.target.closest('[data-delete]');
            if(deleteButton)removeRecord('parts',Number(deleteButton.dataset.index));
        });
        partSelect.addEventListener('change',()=>{
            const part=data.parts[Number(partSelect.value)];
            currentLabel.textContent=part?`Saldo atual: ${part[3]} unidades`:'';
        });
        modal.querySelector('.close').addEventListener('click',closeModal);
        modal.querySelector('[data-restock-cancel]').addEventListener('click',closeModal);
        modal.addEventListener('click',event=>{if(event.target===modal)closeModal()});
        restockForm.addEventListener('submit',event=>{
            event.preventDefault();
            const part=data.parts[Number(partSelect.value)];
            const amount=Number(restockForm.elements.quantity.value);
            if(!part||!Number.isInteger(amount)||amount<1){
                modal.querySelector('#restockError').textContent='Escolha uma peça e informe uma quantidade inteira maior que zero.';
                return;
            }
            part[3]=(Number(part[3])||0)+amount;
            persist();
            renderStockRows(stockView.querySelector('[data-filter="parts"]').value);
            closeModal();
            toast(`Reposição registrada: ${part[0]} agora tem ${part[3]} unidades.`);
        });
        document.getElementById('modalForm').addEventListener('submit',()=>setTimeout(()=>{
            if(editing.type==='part')renderStockRows(stockView.querySelector('[data-filter="parts"]').value);
        },0));
        document.getElementById('modalBg').addEventListener('click',event=>{
            if(event.target===event.currentTarget)setTimeout(()=>renderStockRows(stockView.querySelector('[data-filter="parts"]').value),0);
        });
        stockView.querySelector('[data-new="part"]').addEventListener('click',()=>setTimeout(refreshSummary,0));
        restockForm.addEventListener('keydown',event=>{if(event.key==='Escape')closeModal()});
        refreshSummary();

        const authForm=document.getElementById('authForm');
        const rememberAccount=document.getElementById('rememberAccount');
        authForm.addEventListener('submit',()=>{
            const email=sessionStorage.getItem('mekanikCurrentUser');
            if(!email)return;
            if(rememberAccount.checked)localStorage.setItem('mekanikRememberedUser',email);
            else localStorage.removeItem('mekanikRememberedUser');
        });
        document.addEventListener('click',event=>{
            if(event.target.closest('.logout-button'))localStorage.removeItem('mekanikRememberedUser');
        });
        document.getElementById('googleLogin').title='Login Google precisa ser configurado com um projeto de autenticação.';
    })();

(()=>{
    document.title='Mekanik | Gestão automotiva';
    const sidebarBrand=document.querySelector('.sidebar .brand span');
    if(sidebarBrand)sidebarBrand.innerHTML='Mekanik<small>GESTÃO AUTOMOTIVA</small>';
    document.querySelectorAll('.auth-brand strong').forEach(label=>label.textContent='Mekanik');
    const breadcrumb=document.querySelector('.crumb');
    if(breadcrumb&&breadcrumb.firstChild)breadcrumb.firstChild.textContent='Mekanik / ';
    const storageKey='mekanik2WorkshopData';
    const entityLabels={
        customers:'Clientes',
        vehicles:'Veículos',
        services:'Serviços',
        mechanics:'Mecânicos',
        suppliers:'Empresas',
        parts:'Peças',
        catalog:'Marcas e modelos'
    };
    const defaultServices=[
        {name:'Revisão preventiva',description:'Inspeção geral e manutenção preventiva.',price:0,hours:1},
        {name:'Troca de óleo e filtros',description:'Troca do óleo do motor e dos filtros.',price:0,hours:1},
        {name:'Freios',description:'Inspeção e manutenção do sistema de freios.',price:0,hours:2},
        {name:'Alinhamento e balanceamento',description:'Ajuste de direção e balanceamento das rodas.',price:0,hours:1},
        {name:'Diagnóstico eletrônico',description:'Leitura de falhas e avaliação eletrônica do veículo.',price:0,hours:1}
    ];
    const starterBrands={
        Audi:['A3','A4','Q3','Q5'],
        BYD:['Dolphin','Dolphin Mini','Song Plus','Yuan Plus'],
        Chevrolet:['Onix','Onix Plus','Tracker','S10'],
        Citroën:['C3','C4 Cactus','Aircross'],
        Fiat:['Argo','Cronos','Fastback','Mobi','Pulse','Strada'],
        Ford:['EcoSport','Ka','Ranger','Territory'],
        GWM:['Haval H6','Ora 03','Tank 300'],
        Honda:['City','Civic','Fit','HR-V'],
        Hyundai:['HB20','Creta','Tucson'],
        Jeep:['Compass','Commander','Renegade'],
        Kia:['Cerato','Sportage','Stonic'],
        Mitsubishi:['L200','Outlander','Pajero'],
        Nissan:['Kicks','March','Sentra'],
        Peugeot:['208','2008','3008'],
        Renault:['Duster','Kwid','Logan','Sandero'],
        Toyota:['Corolla','Corolla Cross','Etios','Hilux','Yaris'],
        Volkswagen:['Gol','Nivus','Polo','T-Cross','Tiguan','Virtus'],
        Volvo:['EX30','XC40','XC60']
    };
    const createDemoData=brands=>{
        const firstNames=['Ana','Bruno','Camila','Daniel','Eduarda','Felipe','Giovana','Henrique','Isabela','João','Karen','Lucas','Mariana','Nicolas','Olivia','Pedro'];
        const lastNames=['Almeida','Barbosa','Costa','Dias','Esteves','Ferreira','Gomes','Lima','Mendes','Nogueira','Oliveira','Pereira','Ribeiro','Santos','Teixeira','Vieira'];
        const now=new Date();
        const dateString=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        const customers=Array.from({length:128},(_,index)=>({
            id:`CLI-${String(index+1).padStart(4,'0')}`,
            name:`${firstNames[index%firstNames.length]} ${lastNames[Math.floor(index/firstNames.length)%lastNames.length]}${index>=firstNames.length*lastNames.length?` ${Math.floor(index/(firstNames.length*lastNames.length))+1}`:''}`,
            document:'',
            phone:`+55119${String(1000+index).slice(-4)}${String(1000+index*7).slice(-4)}`,
            email:`cliente${index+1}@exemplo.com.br`,
            notes:'',
            createdAt:new Date(now.getFullYear(),Math.max(0,now.getMonth()-index%12),1).toISOString()
        }));
        const vehicles=Array.from({length:96},(_,index)=>{
            const brand=brands[index%brands.length];
            const year=String(2017+index%10);
            return {
                id:`VEI-${String(index+1).padStart(4,'0')}`,
                customerId:customers[index].id,
                brand:brand.name,
                model:brand.models[index%brand.models.length],
                year,
                plate:`MKN${String(index+1).padStart(4,'0')[0]}${String.fromCharCode(65+index%26)}${String(index+1).padStart(4,'0').slice(1,3)}`,
                km:18000+(index*2371)%145000
            };
        });
        const services=defaultServices.map((service,index)=>({...service,id:`SRV-${String(index+1).padStart(4,'0')}`,price:[180,240,320,160,290][index]}));
        const mechanics=['Rafael Costa','Marcos Lima','Diego Santos','André Ribeiro','Caio Mendes','Bruno Vieira'].map((name,index)=>({
            id:`MEC-${String(index+1).padStart(4,'0')}`,name,phone:`(11) 9${String(4000+index).slice(-4)}-${String(6000+index).slice(-4)}`,commissionRate:8,active:true
        }));
        const suppliers=['Auto Peças Central','Distribuidora Via Norte','Peças & Motores','Brasil Componentes'].map((name,index)=>({
            id:`EMP-${String(index+1).padStart(4,'0')}`,name,contact:['Renata','Paulo','Sueli','Roberto'][index],phone:`(11) 333${index}-${String(1000+index).slice(-4)}`,email:`vendas${index+1}@exemplo.com.br`,notes:''
        }));
        const partNames=['Pastilha de freio dianteira','Filtro de óleo','Óleo sintético 5W30','Filtro de ar','Vela de ignição','Correia de acessórios','Fluido de freio DOT 4','Filtro de cabine','Lâmpada H7','Palheta dianteira','Aditivo do radiador','Disco de freio'];
        const parts=partNames.map((name,index)=>({
            id:`PEC-${String(index+1).padStart(4,'0')}`,name,sku:`MKN-${String(1100+index)}`,category:['Freios','Filtros','Lubrificantes','Motor'][index%4],
            quantity:index<3?[2,3,4][index]:12+index*3,minimum:index<3?[5,6,8][index]:6,
            costPrice:35+index*11,salePrice:55+index*17,supplierId:suppliers[index%suppliers.length].id
        }));
        const monthlyRevenue=[27600,31850,35720,39340,43180,48290];
        const orders=[];
        monthlyRevenue.forEach((revenue,monthOffset)=>{
            const monthDate=new Date(now.getFullYear(),now.getMonth()-5+monthOffset,1);
            const count=monthOffset===5?24:6;
            const quotient=Math.floor(revenue/count);
            for(let index=0;index<count;index++){
                const day=Math.min(3+index*4,new Date(monthDate.getFullYear(),monthDate.getMonth()+1,0).getDate());
                const receivedAt=dateString(new Date(monthDate.getFullYear(),monthDate.getMonth(),day));
                const total=quotient+(index<revenue%count?1:0);
                const itemService=services[index%services.length];
                orders.push({
                    id:`OS-${String(orders.length+1).padStart(4,'0')}`,
                    customerId:customers[(monthOffset*13+index)%customers.length].id,
                    vehicleId:vehicles[(monthOffset*11+index)%vehicles.length].id,
                    mechanicId:mechanics[index%mechanics.length].id,
                    mechanicName:mechanics[index%mechanics.length].name,
                    commissionRate:mechanics[index%mechanics.length].commissionRate,
                    commissionValue:Number((total*mechanics[index%mechanics.length].commissionRate/100).toFixed(2)),
                    receivedAt,
                    deliveryDate:monthOffset===5?dateString(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1+index%6)):receivedAt,
                    status:monthOffset<5?'Finalizada':index<8?'Aguardando':'Em execução',
                    items:[{type:'service',itemId:itemService.id,name:itemService.name,quantity:1,unitPrice:total}],
                    diagnosis:'Revisão e manutenção preventiva registradas na demonstração.',
                    total,
                    createdAt:`${receivedAt}T12:00:00`
                });
            }
        });
        const budgets=Array.from({length:6},(_,index)=>({
            id:`ORC-${String(index+1).padStart(4,'0')}`,
            customerId:customers[index+24].id,vehicleId:vehicles[index+24].id,
            validUntil:dateString(new Date(now.getFullYear(),now.getMonth(),now.getDate()+index+3)),
            status:index<3?'Aguardando':'Aprovado',
            items:[{type:'service',itemId:services[index%services.length].id,name:services[index%services.length].name,quantity:1,unitPrice:780+index*145}],
            description:'Orçamento demonstrativo para manutenção do veículo.',
            total:780+index*145,
            createdAt:now.toISOString()
        }));
        return {customers,vehicles,services,mechanics,suppliers,parts,orders,budgets,brands,counters:{customer:customers.length,vehicle:vehicles.length,service:services.length,mechanic:mechanics.length,supplier:suppliers.length,part:parts.length,order:orders.length,budget:budgets.length}};
    };
    const repository={
        load(){
            const raw=localStorage.getItem(storageKey);
            if(raw){
                const loaded=JSON.parse(raw);
                for(const key of ['customers','vehicles','services','mechanics','suppliers','parts','orders','budgets','brands']){
                    if(!Array.isArray(loaded[key]))throw new Error(`O cadastro de ${key} está inválido no armazenamento local.`);
                }
                if(!loaded.counters||typeof loaded.counters!=='object'||Array.isArray(loaded.counters))throw new Error('Os contadores de cadastros estão inválidos no armazenamento local.');
                return loaded;
            }
            const brands=Object.entries(starterBrands).map(([name,models])=>({name,models}));
            const initial=createDemoData(brands);
            this.save(initial);
            return initial;
        },
        save(value){
            localStorage.setItem(storageKey,JSON.stringify(value));
        }
    };
    const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
    const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value)||0);
    const today=()=>{
        const date=new Date();
        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    };
    let serverSaveQueue=Promise.resolve();
    const saveToServer=value=>{
        serverSaveQueue=serverSaveQueue.then(async()=>{
            const response=await fetch('/api/workshop',{
                method:'PUT',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(value)
            });
            if(!response.ok){
                const result=await response.json().catch(()=>({}));
                throw new Error(result.error||'Não foi possível salvar os dados no servidor.');
            }
        }).catch(error=>{
            console.error('Não foi possível salvar os dados da oficina no banco de dados.',error);
            toast(error.message||'Não foi possível salvar os dados da oficina no servidor.');
        });
        return serverSaveQueue;
    };
    let state;
    let activeEntity='customers';
    let operationMode='orders';
    let searchQuery='';
    let editingId=null;
    let modalEntity=null;
    try{
        state=repository.load();
    }catch(error){
        console.error('Não foi possível inicializar os cadastros da oficina.',error);
        if(typeof toast==='function')toast(error.message||'Não foi possível carregar os cadastros.');
        return;
    }

    const sideFoot=document.querySelector('.side-foot');
    if(sideFoot)sideFoot.remove();
    const sidebar=document.querySelector('.sidebar');
    const main=document.querySelector('main');
    if(!sidebar||!main)return;
    const navGroup=document.createElement('div');
    navGroup.className='nav-label';
    navGroup.textContent='Gestão da oficina';
    sidebar.append(navGroup);
    const addNavigation=(id,label,icon)=>{
        const button=document.createElement('button');
        button.type='button';
        button.className='nav-item';
        button.dataset.view=id;
        button.innerHTML=`<span class="nav-icon">${icon}</span><span>${label}</span>`;
        button.addEventListener('click',()=>showView(id));
        sidebar.append(button);
    };
    addNavigation('workshopCatalog','Cadastros','▤');
    addNavigation('workshopOperations','Ordens e orçamentos','▣');
    main.insertAdjacentHTML('beforeend',`
        <section class="view workshop-view" id="workshopCatalog">
            <div class="page-head"><div><p class="eyebrow">CADASTROS DA OFICINA</p><h1>Cadastros</h1><p class="sub">Clientes com ID, veículos, serviços, equipe, empresas e peças.</p></div><button class="primary" id="addCatalogRecord" type="button">+ Novo cadastro</button></div>
            <div class="workshop-tabs" id="catalogTabs" role="tablist"></div>
            <div class="panel workshop-table-panel"><div class="module-toolbar"><input class="filter" id="catalogSearch" placeholder="Buscar neste cadastro..." aria-label="Buscar cadastro"><span class="catalog-count" id="catalogCount"></span></div><div class="table-scroll"><table class="module-table"><thead id="catalogHeader"></thead><tbody id="catalogRows"></tbody></table></div></div>
        </section>
        <section class="view workshop-view" id="workshopOperations">
            <div class="page-head"><div><p class="eyebrow">ATENDIMENTO E PRODUÇÃO</p><h1>Ordens e orçamentos</h1><p class="sub">Registre serviços, acompanhe prazos e imprima documentos para salvar em PDF.</p></div><button class="primary" id="addOperation" type="button">+ Nova ordem de serviço</button></div>
            <div class="workshop-tabs" id="operationTabs" role="tablist"><button class="workshop-tab active" data-operation="orders" type="button">Ordens de serviço</button><button class="workshop-tab" data-operation="budgets" type="button">Orçamentos</button></div>
            <div class="panel workshop-table-panel"><div class="module-toolbar"><input class="filter" id="operationSearch" placeholder="Buscar cliente, veículo ou número..." aria-label="Buscar ordem ou orçamento"><span class="catalog-count" id="operationCount"></span></div><div class="table-scroll"><table class="module-table"><thead id="operationHeader"></thead><tbody id="operationRows"></tbody></table></div></div>
        </section>
    `);
    const modal=document.createElement('div');
    modal.className='modal-bg workshop-modal-bg';
    modal.id='workshopModal';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML='<section class="modal workshop-modal" role="dialog" aria-modal="true" aria-labelledby="workshopModalTitle"><div class="modal-head"><h2 id="workshopModalTitle"></h2><button class="close" type="button" data-workshop-close aria-label="Fechar">×</button></div><form id="workshopForm"><div class="form-grid" id="workshopFields"></div><p class="workshop-form-error" id="workshopFormError" role="alert"></p><div class="modal-foot"><button class="ghost" type="button" data-workshop-close>Cancelar</button><button class="primary" type="submit">Salvar</button></div></form></section>';
    document.body.append(modal);

    const requiredFields=new Set(['name','plate','sku','customerId','vehicleId','brand']);
    const keyField=(name,label,value='',type='text',extra='')=>{
        if(name==='phone')return `<label class="${extra}">${label}<div class="phone-input-row" data-phone-entry data-phone-name="${name}" data-phone-value="${esc(value)}"></div></label>`;
        const maxLengths={name:100,document:14,email:160,plate:7,sku:30,category:50,brand:60,model:60,year:4,km:7,quantity:6,minimum:6,partQuantity:4,commissionRate:5,hours:4};
        const numericStep=['price','costPrice','salePrice','commissionRate'].includes(name)?'any':'1';
        const numericMaximum=name==='commissionRate'?100:maxLengths[name]!==undefined?10**maxLengths[name]-1:null;
        const numericAttributes=type==='number'?`min="0" step="${numericStep}" ${numericMaximum===null?'':`max="${numericMaximum}"`} inputmode="${numericStep==='1'?'numeric':'decimal'}"`:'';
        const inputMode=name==='document'?'inputmode="numeric"':name==='plate'?'maxlength="7" autocapitalize="characters"':'';
        return `<label class="${extra}">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${requiredFields.has(name)?'required':''} ${type==='number'?numericAttributes:''} ${type!=='number'&&maxLengths[name]?`maxlength="${maxLengths[name]}"`:''} ${inputMode}></label>`;
    };
    const selectField=(name,label,options,value='',extra='',required=false,multiple=false)=>{
        const selected=Array.isArray(value)?value.map(String):[String(value??'')];
        return `<label class="${extra}">${label}<select name="${name}" ${required?'required':''} ${multiple?'multiple':''}>${options.map(option=>`<option value="${esc(option.value)}" ${selected.includes(String(option.value))?'selected':''}>${esc(option.label)}</option>`).join('')}</select></label>`;
    };
    const areaField=(name,label,value='',extra='wide')=>`<label class="${extra}">${label}<textarea name="${name}" rows="3">${esc(value)}</textarea></label>`;
    const options=(records,labeler,includeEmpty='')=>[
        ...(includeEmpty!==null?[{value:'',label:includeEmpty||'Selecione'}]:[]),
        ...records.map(item=>({value:item.id,label:labeler(item)}))
    ];
    const catalogTabs=document.getElementById('catalogTabs');
    const catalogHeader=document.getElementById('catalogHeader');
    const catalogRows=document.getElementById('catalogRows');
    const catalogCount=document.getElementById('catalogCount');
    const operationRows=document.getElementById('operationRows');
    const operationHeader=document.getElementById('operationHeader');
    const operationCount=document.getElementById('operationCount');
    const form=document.getElementById('workshopForm');
    const fields=document.getElementById('workshopFields');

    const customerName=id=>state.customers.find(item=>item.id===id)?.name||'Cliente removido';
    const vehicleName=id=>{
        const item=state.vehicles.find(vehicle=>vehicle.id===id);
        return item?`${item.brand} ${item.model} · ${item.plate}`:'Veículo removido';
    };
    const mechanicName=id=>state.mechanics.find(item=>item.id===id)?.name||'Não atribuído';
    const supplierName=id=>state.suppliers.find(item=>item.id===id)?.name||'Sem empresa';
    const findRecord=(entity,id)=>state[entity].find(item=>item.id===id);
    const columns={
        customers:['ID','Cliente','Contato','E-mail','Cadastro'],
        vehicles:['Veículo','Ano','Placa','Cliente','Quilometragem'],
        services:['Serviço','Descrição','Preço','Duração'],
        mechanics:['Mecânico','Contato','Taxa do serviço','Status'],
        suppliers:['Empresa','Contato','Telefone','E-mail'],
        parts:['Peça / código','Categoria','Empresa','Estoque','Custo','Preço de venda'],
        catalog:['Marca','Modelos cadastrados']
    };
    const renderTabs=()=>{
        catalogTabs.replaceChildren();
        Object.entries(entityLabels).forEach(([entity,label])=>{
            const button=document.createElement('button');
            button.type='button';
            button.className=`workshop-tab${entity===activeEntity?' active':''}`;
            button.textContent=label;
            button.setAttribute('role','tab');
            button.setAttribute('aria-selected',String(entity===activeEntity));
            button.addEventListener('click',()=>{
                activeEntity=entity;
                document.getElementById('catalogSearch').value='';
                searchQuery='';
                renderCatalog();
            });
            catalogTabs.append(button);
        });
    };
    const filteredRecords=entity=>{
        const q=searchQuery.trim().toLocaleLowerCase('pt-BR');
        let records=entity==='catalog'
            ?state.brands
            :state[entity];
        if(!q)return records;
        return records.filter(item=>JSON.stringify(item).toLocaleLowerCase('pt-BR').includes(q));
    };
    const renderCatalog=()=>{
        renderTabs();
        const entity=activeEntity;
        const records=filteredRecords(entity);
        catalogHeader.innerHTML=`<tr>${columns[entity].map(column=>`<th>${column}</th>`).join('')}<th>Ações</th></tr>`;
        catalogCount.textContent=`${records.length} ${records.length===1?'registro':'registros'}`;
        if(entity==='customers'){
            catalogRows.innerHTML=records.length?records.map(item=>`<tr><td><span class="tag">${esc(item.id)}</span></td><td><b>${esc(item.name)}</b>${item.document?`<br><small>${esc(item.document)}</small>`:''}</td><td>${esc(item.phone)}</td><td>${esc(item.email)}</td><td>${new Date(item.createdAt).toLocaleDateString('pt-BR')}</td><td class="row-actions"><button type="button" data-edit-record="${item.id}">Editar</button><button class="delete" type="button" data-delete-record="${item.id}">Excluir</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">Nenhum cliente cadastrado. Adicione um cliente para gerar o ID automaticamente.</td></tr>';
        }else if(entity==='vehicles'){
            catalogRows.innerHTML=records.length?records.map(item=>`<tr><td><b>${esc(item.brand)} ${esc(item.model)}</b></td><td>${esc(item.year||'—')}</td><td><span class="tag">${esc(item.plate)}</span></td><td>${esc(customerName(item.customerId))}</td><td>${Number(item.km)||0} km</td><td class="row-actions"><button type="button" data-edit-record="${item.id}">Editar</button><button class="delete" type="button" data-delete-record="${item.id}">Excluir</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">Nenhum veículo cadastrado.</td></tr>';
        }else if(entity==='services'){
            catalogRows.innerHTML=records.length?records.map(item=>`<tr><td><b>${esc(item.name)}</b></td><td>${esc(item.description)}</td><td>${money(item.price)}</td><td>${Number(item.hours)||0} h</td><td class="row-actions"><button type="button" data-edit-record="${item.id}">Editar</button><button class="delete" type="button" data-delete-record="${item.id}">Excluir</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">Nenhum serviço cadastrado.</td></tr>';
        }else if(entity==='mechanics'){
            catalogRows.innerHTML=records.length?records.map(item=>`<tr><td><b>${esc(item.name)}</b></td><td>${esc(item.phone||'—')}</td><td>${Number(item.commissionRate)||0}%</td><td>${item.active?'Ativo':'Inativo'}</td><td class="row-actions"><button type="button" data-edit-record="${item.id}">Editar</button><button class="delete" type="button" data-delete-record="${item.id}">Excluir</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">Cadastre os mecânicos e a taxa aplicada sobre os serviços.</td></tr>';
        }else if(entity==='suppliers'){
            catalogRows.innerHTML=records.length?records.map(item=>`<tr><td><b>${esc(item.name)}</b></td><td>${esc(item.contact||'—')}</td><td>${esc(item.phone||'—')}</td><td>${esc(item.email||'—')}</td><td class="row-actions"><button type="button" data-edit-record="${item.id}">Editar</button><button class="delete" type="button" data-delete-record="${item.id}">Excluir</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">Cadastre as empresas e fornecedores de peças.</td></tr>';
        }else if(entity==='parts'){
            catalogRows.innerHTML=records.length?records.map(item=>`<tr><td><b>${esc(item.name)}</b><br><small>${esc(item.sku)}</small></td><td>${esc(item.category||'—')}</td><td>${esc(supplierName(item.supplierId))}</td><td>${Number(item.quantity)||0} un.</td><td>${money(item.costPrice)}</td><td>${money(item.salePrice)}</td><td class="row-actions"><button type="button" data-edit-record="${item.id}">Editar</button><button class="delete" type="button" data-delete-record="${item.id}">Excluir</button></td></tr>`).join(''):'<tr><td colspan="7" class="empty">Cadastre peças com empresa fornecedora, custo e preço de venda.</td></tr>';
        }else{
            const modelRows=records.flatMap(brand=>(brand.models||[]).map(model=>({brand:brand.name,model})));
            catalogRows.innerHTML=modelRows.length?modelRows.map(item=>`<tr><td><b>${esc(item.brand)}</b></td><td>${esc(item.model)}</td><td class="row-actions"><button class="delete" type="button" data-delete-model="${esc(item.brand)}" data-model="${esc(item.model)}">Excluir</button></td></tr>`).join(''):'<tr><td colspan="3" class="empty">Cadastre marcas e modelos que serão oferecidos nos formulários de veículos.</td></tr>';
            if(!records.length)catalogRows.innerHTML='<tr><td colspan="3" class="empty">Nenhuma marca ou modelo encontrado.</td></tr>';
        }
        document.getElementById('addCatalogRecord').textContent=entity==='catalog'?'+ Nova marca ou modelo':`+ Novo ${entity==='customers'?'cliente':entity==='vehicles'?'veículo':entity==='services'?'serviço':entity==='mechanics'?'mecânico':entity==='suppliers'?'empresa':'peça'}`;
    };
    const formatDate=value=>value?new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR'):'—';
    const renderOperations=()=>{
        const isOrder=operationMode==='orders';
        const collection=isOrder?state.orders:state.budgets;
        const q=(document.getElementById('operationSearch').value||'').trim().toLocaleLowerCase('pt-BR');
        const records=collection.filter(item=>!q||`${item.id} ${customerName(item.customerId)} ${vehicleName(item.vehicleId)} ${item.status}`.toLocaleLowerCase('pt-BR').includes(q));
        operationHeader.innerHTML=`<tr>${(isOrder?['Ordem','Cliente / veículo','Entrada','Previsão','Mecânico','Total','Status']:['Orçamento','Cliente / veículo','Validade','Total','Status']).map(item=>`<th>${item}</th>`).join('')}<th>Ações</th></tr>`;
        operationCount.textContent=`${records.length} ${records.length===1?'registro':'registros'}`;
        if(!records.length){
            operationRows.innerHTML=`<tr><td colspan="${isOrder?8:6}" class="empty">Nenhum ${isOrder?'serviço':'orçamento'} cadastrado.</td></tr>`;
            return;
        }
        operationRows.innerHTML=records.map(item=>{
            const details=`<b>${esc(customerName(item.customerId))}</b><br><small>${esc(vehicleName(item.vehicleId))}</small>`;
            const statusClass=item.status==='Finalizada'||item.status==='Aprovado'?'green':item.status==='Cancelado'?'red':'orange';
            const columnsHtml=isOrder
                ?`<td><b>${esc(item.id)}</b></td><td>${details}</td><td>${formatDate(item.receivedAt)}</td><td>${formatDate(item.deliveryDate)}</td><td>${esc(mechanicName(item.mechanicId))}${item.mechanicId?`<br><small>Taxa ${Number(item.commissionRate)||0}%</small>`:''}</td><td>${money(item.total)}</td><td><span class="status ${statusClass}">${esc(item.status)}</span></td>`
                :`<td><b>${esc(item.id)}</b></td><td>${details}</td><td>${formatDate(item.validUntil)}</td><td>${money(item.total)}</td><td><span class="status ${statusClass}">${esc(item.status)}</span></td>`;
            return `<tr>${columnsHtml}<td class="row-actions"><button type="button" data-print-record="${item.id}">PDF</button>${!isOrder?`<button type="button" data-convert-budget="${item.id}">Criar OS</button>`:''}<button type="button" data-edit-operation="${item.id}">Editar</button><button class="delete" type="button" data-delete-operation="${item.id}">Excluir</button></td></tr>`;
        }).join('');
    };
    const renderDashboard=()=>{
        const dashboard=document.getElementById('dashboard');
        if(!dashboard)return;
        const now=new Date();
        const monthKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
        const orderDate=order=>new Date(order.createdAt||`${order.receivedAt||''}T12:00:00`);
        const currentMonthOrders=state.orders.filter(order=>{
            const date=orderDate(order);
            return !Number.isNaN(date.getTime())&&monthKey(date)===monthKey(now);
        });
        const monthTotal=currentMonthOrders.reduce((total,order)=>total+(Number(order.total)||0),0);
        const openOrders=state.orders.filter(order=>!['Finalizada','Cancelado'].includes(order.status)).length;
        const criticalParts=state.parts.filter(part=>Number(part.minimum)>0&&Number(part.quantity)<=Number(part.minimum)).length;
        const previousMonth=new Date(now.getFullYear(),now.getMonth()-1,1);
        const previousMonthTotal=state.orders.filter(order=>{
            const date=orderDate(order);
            return !Number.isNaN(date.getTime())&&monthKey(date)===monthKey(previousMonth);
        }).reduce((total,order)=>total+(Number(order.total)||0),0);
        const revenueChange=previousMonthTotal?((monthTotal-previousMonthTotal)/previousMonthTotal*100):null;
        const linkedCustomers=new Set(state.vehicles.map(vehicle=>vehicle.customerId).filter(Boolean)).size;
        const customerCoverage=state.customers.length?Math.round(linkedCustomers/state.customers.length*100):0;
        const metrics=[
            {label:'Clientes na base',value:state.customers.length,icon:'◉',note:`${linkedCustomers} com veículo · ${customerCoverage}% da base`},
            {label:'Veículos cadastrados',value:state.vehicles.length,icon:'▣',note:`Vinculados a ${linkedCustomers} clientes`},
            {label:'OS em andamento',value:openOrders,icon:'✣',note:`${state.orders.length} OS no histórico`},
            {label:'Faturamento no mês',value:money(monthTotal).replace(',00',''),icon:'↗',note:revenueChange===null?`${currentMonthOrders.length} OS neste mês`:`${currentMonthOrders.length} OS · ${revenueChange>=0?'↑':'↓'} ${Math.abs(revenueChange).toLocaleString('pt-BR',{maximumFractionDigits:1})}% vs. mês anterior`},
            {label:'Estoque crítico',value:criticalParts,icon:'!',note:`${state.parts.length} itens monitorados · abaixo do mínimo`}
        ];
        dashboard.querySelector('.kpis').innerHTML=metrics.map(metric=>`<div class="kpi"><div class="kpi-top">${metric.label}<span class="kpi-icon">${metric.icon}</span></div><strong>${metric.value}</strong><span class="trend">${metric.note}</span></div>`).join('');
        dashboard.querySelector('.eyebrow').textContent=now.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'short',year:'numeric'}).toUpperCase();

        const months=Array.from({length:6},(_,index)=>{
            const date=new Date(now.getFullYear(),now.getMonth()-5+index,1);
            const key=monthKey(date);
            const total=state.orders.filter(order=>{
                const created=orderDate(order);
                return !Number.isNaN(created.getTime())&&monthKey(created)===key;
            }).reduce((sum,order)=>sum+(Number(order.total)||0),0);
            return {key,label:date.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''),total};
        });
        const maxMonth=Math.max(...months.map(item=>item.total),1);
        const chart=months.map(item=>{
            const barHeight=Math.max(3,item.total/maxMonth*100);
            const compactTotal=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',notation:'compact',maximumFractionDigits:1}).format(item.total);
            return `<div class="mekanik2-bar" title="${item.label}: ${money(item.total)}" style="--bar-height:${barHeight}%"><em>${compactTotal}</em><span style="height:${barHeight}%"></span><small>${item.label}</small></div>`;
        }).join('');
        const vehicleRatio=state.customers.length?Math.min(100,state.vehicles.length/state.customers.length*100):0;
        const statusCounts=state.orders.reduce((counts,order)=>{
            const label=order.status||'Sem status';
            counts[label]=(counts[label]||0)+1;
            return counts;
        },{});
        const statusTotal=state.orders.length||1;
        const statusRows=Object.entries(statusCounts).sort((a,b)=>b[1]-a[1]).map(([label,count])=>`<div class="mekanik2-legend-row"><span>${esc(label)}</span><strong>${count}</strong><div class="mekanik2-track"><span style="width:${count/statusTotal*100}%"></span></div></div>`).join('');
        const topParts=[...state.parts].sort((a,b)=>(Number(b.quantity)||0)-(Number(a.quantity)||0)).slice(0,5);
        const maxQuantity=Math.max(...topParts.map(part=>Number(part.quantity)||0),1);
        const partRows=topParts.map(part=>`<div class="mekanik2-list-row"><span>${esc(part.name)}<br><small>${esc(part.sku||'Sem código')}</small></span><strong>${Number(part.quantity)||0} un.</strong><div class="mekanik2-track" style="grid-column:1/-1"><span style="width:${Math.max(3,(Number(part.quantity)||0)/maxQuantity*100)}%"></span></div></div>`).join('');
        const recentOrders=[...state.orders].sort((a,b)=>orderDate(b)-orderDate(a)).slice(0,4);
        const recentRows=recentOrders.map(order=>`<div class="agenda-row"><span class="time">${esc(order.id)}</span><div class="event"><b>${esc(customerName(order.customerId))}</b><small>${esc(vehicleName(order.vehicleId))}</small></div><span class="tag">${esc(order.status||'Sem status')}</span></div>`).join('');
        const layout=dashboard.querySelector('.mekanik2-infographics')||dashboard.querySelector('.layout');
        layout.className='layout mekanik2-infographics';
        layout.innerHTML=`
            <article class="mekanik2-card"><h2>Clientes e veículos</h2><p>Indicadores ligados aos cadastros da oficina</p><div class="mekanik2-stat-pair"><div class="mekanik2-stat"><span>Clientes</span><strong>${state.customers.length}</strong></div><div class="mekanik2-stat"><span>Veículos</span><strong>${state.vehicles.length}</strong></div></div><div class="mekanik2-track" aria-label="${state.vehicles.length} veículos para ${state.customers.length} clientes"><span style="width:${vehicleRatio}%"></span></div></article>
            <article class="mekanik2-card"><h2>Faturamento mês a mês</h2><p>Valor das ordens de serviço nos últimos seis meses</p><div class="mekanik2-bars" aria-label="Valores mensais das ordens de serviço">${chart}</div><div class="mekanik2-proof"><span>${currentMonthOrders.length} ordens neste mês</span><strong class="${revenueChange!==null&&revenueChange<0?'negative':''}">${previousMonthTotal?`${revenueChange>=0?'+':''}${revenueChange.toLocaleString('pt-BR',{maximumFractionDigits:1})}% vs. mês anterior`:'Sem base de comparação'}</strong></div></article>
            <article class="mekanik2-card"><h2>Status das ordens</h2><p>${state.orders.length} ordem(ns) cadastrada(s)</p><div class="mekanik2-legend">${statusRows||'<div class="empty">Os status aparecerão quando houver ordens cadastradas.</div>'}</div></article>
            <article class="mekanik2-card"><h2>Visão do estoque</h2><p>${state.parts.length} tipo(s) de peça · ${criticalParts} abaixo do mínimo</p><div class="mekanik2-list">${partRows||'<div class="empty">Cadastre peças para acompanhar o estoque.</div>'}</div></article>
            <article class="mekanik2-card"><h2>Ordens recentes</h2><p>Clientes, veículos e status das últimas OS</p><div class="mekanik2-list">${recentRows||'<div class="empty">Nenhuma ordem de serviço cadastrada.</div>'}</div></article>`;
        const alerts=[
            ...state.parts.filter(part=>Number(part.minimum)>0&&Number(part.quantity)<=Number(part.minimum)).map(part=>`<div class="alert-row"><i class="alert-dot red"></i><span><b>Estoque no mínimo:</b> ${esc(part.name)}</span><small>${Number(part.quantity)||0} un.</small></div>`),
            ...state.budgets.filter(budget=>['Pendente','Aguardando'].includes(budget.status)).map(budget=>`<div class="alert-row"><i class="alert-dot"></i><span><b>Orçamento aguardando:</b> ${esc(budget.id)} · ${esc(customerName(budget.customerId))}</span><small>${money(budget.total)}</small></div>`)
        ];
        dashboard.querySelector('.alerts').innerHTML=`<div class="panel-head"><div><h2>Central de atenção</h2><p>${alerts.length?'Itens reais que pedem uma decisão':'Nenhum alerta nos cadastros atuais'}</p></div><span class="status ${alerts.length?'orange':'green'}">${alerts.length} alerta(s)</span></div>${alerts.join('')||'<div class="empty">Tudo em dia por aqui.</div>'}`;
        let demoNote=dashboard.querySelector('.mekanik2-demo-note');
        if(!demoNote){
            demoNote=document.createElement('p');
            demoNote.className='mekanik2-demo-note';
            dashboard.append(demoNote);
        }
        demoNote.textContent='Base demonstrativa editável: cadastros, ordens, veículos e estoque já estão preenchidos. Você pode ajustar ou remover os exemplos.';
    };
    const openModal=(entity,record=null)=>{
        modalEntity=entity;
        editingId=record?.id||null;
        document.getElementById('workshopFormError').textContent='';
        const isOperation=entity==='orders'||entity==='budgets';
        const isOrder=entity==='orders';
        const existing=record||{};
        let title='';
        let markup='';
        if(entity==='customers'){
            title=record?'Editar cliente':'Novo cliente';
            markup=keyField('name','Nome completo',existing.name,'text','wide')+
                keyField('document','CPF ou CNPJ',existing.document)+keyField('phone','Telefone / WhatsApp',existing.phone,'tel')+
                keyField('email','E-mail',existing.email,'email')+areaField('notes','Observações',existing.notes);
        }else if(entity==='vehicles'){
            title=record?'Editar veículo':'Novo veículo';
            const brandOptions=options(state.brands.map(item=>({id:item.name})),item=>item.id,'Selecione a marca');
            const selectedBrand=existing.brand||state.brands[0]?.name||'';
            const modelList=state.brands.find(item=>item.name===selectedBrand)?.models||[];
            const modelOptions=[{value:'',label:'Selecione o modelo'},...modelList.map(name=>({value:name,label:name}))];
            const yearOptions=[{value:'',label:'Selecione o ano'},...Array.from({length:58},(_,index)=>String(new Date().getFullYear()+1-index)).map(year=>({value:year,label:year}))];
            markup=selectField('customerId','Cliente',options(state.customers,item=>`${item.id} · ${item.name}`),existing.customerId,'wide',true)+
                selectField('brand','Marca',brandOptions,selectedBrand,'',true)+
                selectField('model','Modelo',modelOptions,existing.model,'',true)+
                selectField('year','Ano',yearOptions,existing.year)+keyField('plate','Placa',existing.plate,'text')+
                keyField('km','Quilometragem',existing.km??0,'number');
            if(!state.customers.length)document.getElementById('workshopFormError').textContent='Cadastre um cliente antes de cadastrar o veículo.';
        }else if(entity==='services'){
            title=record?'Editar serviço':'Novo serviço';
            markup=keyField('name','Nome do serviço',existing.name,'text','wide')+areaField('description','Descrição',existing.description)+
                keyField('price','Preço de mão de obra (R$)',existing.price??0,'number','')+keyField('hours','Duração estimada (horas)',existing.hours??1,'number');
        }else if(entity==='mechanics'){
            title=record?'Editar mecânico':'Novo mecânico';
            markup=keyField('name','Nome do mecânico',existing.name,'text','wide')+keyField('phone','Telefone',existing.phone,'tel')+
                keyField('commissionRate','Taxa sobre serviços (%)',existing.commissionRate??0,'number')+
                selectField('active','Situação',[{value:'true',label:'Ativo'},{value:'false',label:'Inativo'}],String(existing.active!==false),'');
        }else if(entity==='suppliers'){
            title=record?'Editar empresa':'Nova empresa';
            markup=keyField('name','Nome da empresa',existing.name,'text','wide')+keyField('contact','Pessoa de contato',existing.contact)+
                keyField('phone','Telefone',existing.phone,'tel')+keyField('email','E-mail',existing.email,'email')+
                areaField('notes','Condições comerciais / observações',existing.notes);
        }else if(entity==='parts'){
            title=record?'Editar peça':'Nova peça';
            markup=keyField('name','Nome da peça',existing.name,'text','wide')+keyField('sku','Código / SKU',existing.sku)+
                keyField('category','Categoria',existing.category)+selectField('supplierId','Empresa fornecedora',options(state.suppliers,item=>item.name),existing.supplierId)+
                keyField('quantity','Estoque atual',existing.quantity??0,'number')+keyField('minimum','Estoque mínimo',existing.minimum??0,'number')+
                keyField('costPrice','Preço de compra (R$)',existing.costPrice??0,'number')+keyField('salePrice','Preço de venda (R$)',existing.salePrice??0,'number');
            if(!state.suppliers.length)document.getElementById('workshopFormError').textContent='A peça pode ser cadastrada sem empresa; cadastre uma empresa para relacionar preços e compras.';
        }else if(entity==='catalog'){
            title='Cadastrar marca e modelo';
            const brandOptions=options(state.brands.map(item=>({id:item.name})),item=>item.id,'Selecione a marca');
            markup=selectField('brand','Marca existente',brandOptions,existing.brand||'')+
                    keyField('newBrand','Ou cadastre uma nova marca',existing.newBrand,'text')+
                keyField('model','Modelo (opcional)',existing.model,'text');
        }else if(isOperation){
            title=record?(isOrder?'Editar ordem de serviço':'Editar orçamento'):(isOrder?'Nova ordem de serviço':'Novo orçamento');
            const customers=options(state.customers,item=>`${item.id} · ${item.name}`,'Selecione o cliente');
            const vehicles=options(state.vehicles,item=>`${item.brand} ${item.model} · ${item.plate}`, 'Selecione o veículo');
            const services=options(state.services,item=>`${item.name} · ${money(item.price)}`,null);
            const parts=options(state.parts,item=>`${item.name} · ${money(item.salePrice)} · saldo ${item.quantity}`, 'Sem peça');
            const mechanics=options(state.mechanics.filter(item=>item.active!==false),item=>`${item.name} · taxa ${Number(item.commissionRate)||0}%`, 'Sem mecânico');
            const selectedServiceIds=record?.items?.filter(item=>item.type==='service').map(item=>item.itemId)||[];
            const selectedPart=record?.items?.find(item=>item.type==='part');
            markup=selectField('customerId','Cliente',customers,existing.customerId,'wide',true)+
                selectField('vehicleId','Veículo',vehicles,existing.vehicleId,'wide',true)+
                selectField('mechanicId','Mecânico responsável',mechanics,existing.mechanicId)+
                selectField('serviceIds','Serviços (selecione um ou mais)',services,selectedServiceIds,'wide',true,true)+
                selectField('partId','Peça',parts,selectedPart?.itemId||'')+
                keyField('partQuantity','Quantidade da peça',selectedPart?.quantity||1,'number')+
                areaField('diagnosis',isOrder?'Diagnóstico / observações':'Descrição do orçamento',existing.description||existing.diagnosis)+
                (isOrder
                    ?keyField('receivedAt','Data de entrada',existing.receivedAt||today(),'date')+keyField('deliveryDate','Previsão de entrega',existing.deliveryDate||today(),'date')+
                        selectField('status','Status',[{value:'Aguardando',label:'Aguardando'},{value:'Em execução',label:'Em execução'},{value:'Finalizada',label:'Finalizada'},{value:'Cancelado',label:'Cancelado'}],existing.status||'Aguardando')
                    :keyField('validUntil','Validade do orçamento',existing.validUntil||today(),'date')+
                        selectField('status','Status',[{value:'Pendente',label:'Pendente'},{value:'Aprovado',label:'Aprovado'},{value:'Recusado',label:'Recusado'}],existing.status||'Pendente'));
            if(!state.customers.length)document.getElementById('workshopFormError').textContent='Cadastre um cliente e um veículo antes de criar este documento.';
        }
        document.getElementById('workshopModalTitle').textContent=title;
        fields.innerHTML=markup;
        fields.querySelectorAll('[data-phone-entry]').forEach(container=>{
            mountPhoneInput(container,container.dataset.phoneName,container.dataset.phoneValue||'',requiredFields.has(container.dataset.phoneName));
        });
        installEmailAssist(form);
        installFormatValidation(form);
        modal.classList.add('show');
        modal.setAttribute('aria-hidden','false');
        const brandSelect=form.elements.brand;
        const modelSelect=form.elements.model;
        if(entity==='vehicles'&&brandSelect&&modelSelect){
            brandSelect.addEventListener('change',()=>{
                const models=state.brands.find(item=>item.name===brandSelect.value)?.models||[];
                modelSelect.innerHTML=`<option value="">Selecione o modelo</option>${models.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('')}`;
            });
        }
        if(isOperation){
            const customerSelect=form.elements.customerId;
            const vehicleSelect=form.elements.vehicleId;
            const selectedVehicle=existing.vehicleId||'';
            const updateVehicleOptions=()=>{
                const customerId=customerSelect.value;
                const vehicles=state.vehicles.filter(item=>item.customerId===customerId);
                vehicleSelect.innerHTML=`<option value="">Selecione o veículo</option>${vehicles.map(item=>`<option value="${esc(item.id)}" ${item.id===selectedVehicle?'selected':''}>${esc(`${item.brand} ${item.model} · ${item.plate}`)}</option>`).join('')}`;
                if(!vehicles.some(item=>item.id===vehicleSelect.value))vehicleSelect.value='';
                if(customerId&&!vehicles.length)document.getElementById('workshopFormError').textContent='Este cliente ainda não tem veículo cadastrado. Cadastre o veículo antes de continuar.';
                else if(document.getElementById('workshopFormError').textContent.startsWith('Este cliente ainda não tem veículo'))document.getElementById('workshopFormError').textContent='';
            };
            customerSelect.addEventListener('change',updateVehicleOptions);
            updateVehicleOptions();
        }
        form.querySelector('input,select,textarea')?.focus();
    };
    const closeModal=()=>{
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden','true');
        editingId=null;
        modalEntity=null;
    };
    const nextId=(key,prefix)=>{
        const next=(Number(state.counters[key])||0)+1;
        state.counters[key]=next;
        return `${prefix}-${String(next).padStart(4,'0')}`;
    };
    const saveState=next=>{
        try{
            repository.save(next);
            state=next;
            renderDashboard();
            saveToServer(next);
            return true;
        }catch(error){
            console.error('Não foi possível salvar os dados da oficina.',error);
            toast('Não foi possível salvar. Verifique o espaço disponível no navegador.');
            return false;
        }
    };
    const captureOperation=(values,entity,old=null)=>{
        const isOrder=entity==='orders';
        const mechanic=findRecord('mechanics',values.mechanicId);
        const serviceItems=values.serviceIds.map(id=>findRecord('services',id)).filter(Boolean).map(service=>({
            type:'service',
            itemId:service.id,
            name:service.name,
            quantity:1,
            unitPrice:Number(service.price)||0
        }));
        const selectedPart=findRecord('parts',values.partId);
        if(selectedPart&&Number(values.partQuantity)>0){
            serviceItems.push({
                type:'part',
                itemId:selectedPart.id,
                name:selectedPart.name,
                quantity:Number(values.partQuantity),
                unitPrice:Number(selectedPart.salePrice)||0
            });
        }
        const serviceTotal=serviceItems.filter(item=>item.type==='service').reduce((sum,item)=>sum+item.quantity*item.unitPrice,0);
        const total=serviceItems.reduce((sum,item)=>sum+item.quantity*item.unitPrice,0);
        const commissionRate=Number(mechanic?.commissionRate)||0;
        return {
            ...(old||{}),
            id:old?.id||nextId(isOrder?'order':'budget',isOrder?'OS':'ORC'),
            customerId:values.customerId,
            vehicleId:values.vehicleId,
            mechanicId:values.mechanicId||'',
            mechanicName:mechanic?.name||'',
            commissionRate,
            commissionValue:serviceTotal*commissionRate/100,
            items:serviceItems,
            total,
            description:values.diagnosis||'',
            diagnosis:values.diagnosis||'',
            receivedAt:values.receivedAt||today(),
            deliveryDate:values.deliveryDate||'',
            validUntil:values.validUntil||'',
            status:values.status||(isOrder?'Aguardando':'Pendente'),
            createdAt:old?.createdAt||new Date().toISOString()
        };
    };
    const handleSubmit=event=>{
        event.preventDefault();
        if(!form.reportValidity())return;
        const values=Object.fromEntries(new FormData(form).entries());
        values.phone=phoneValueFromForm(form,'phone');
        if(values.email&&!validEmail(values.email)){
            document.getElementById('workshopFormError').textContent='Informe um e-mail válido.';
            return;
        }
        const services=form.elements.serviceIds;
        values.serviceIds=services?[...services.selectedOptions].map(option=>option.value):[];
        const entity=modalEntity;
        const old=editingId?findRecord(entity,editingId):null;
        const next=structuredClone(state);
        let savedRecord;
        if(entity==='catalog'){
            const brandName=String(values.newBrand||values.brand||'').trim();
            const model=String(values.model||'').trim();
            if(!brandName){document.getElementById('workshopFormError').textContent='Informe uma marca existente ou cadastre uma nova.';return}
            let brand=next.brands.find(item=>item.name.toLocaleLowerCase('pt-BR')===brandName.toLocaleLowerCase('pt-BR'));
            if(!brand){brand={name:brandName,models:[]};next.brands.push(brand)}
            if(model&&!brand.models.some(item=>item.toLocaleLowerCase('pt-BR')===model.toLocaleLowerCase('pt-BR')))brand.models.push(model);
            if(!model&&!values.newBrand){document.getElementById('workshopFormError').textContent='Informe um modelo ou use o campo de nova marca.';return}
        }else if(['orders','budgets'].includes(entity)){
            if(!values.serviceIds.length){document.getElementById('workshopFormError').textContent='Selecione ao menos um serviço.';return}
            savedRecord=captureOperation(values,entity,old);
            const collection=entity==='orders'?next.orders:next.budgets;
            if(old)collection[collection.findIndex(item=>item.id===old.id)]=savedRecord;
            else collection.unshift(savedRecord);
        }else{
            const id=old?.id||nextId(entity==='customers'?'customer':entity==='vehicles'?'vehicle':entity==='services'?'service':entity==='mechanics'?'mechanic':entity==='suppliers'?'supplier':'part',
                entity==='customers'?'CLI':entity==='vehicles'?'VEI':entity==='services'?'SRV':entity==='mechanics'?'MEC':entity==='suppliers'?'EMP':'PEC');
            if(entity==='customers'){
                savedRecord={id,name:String(values.name||'').trim(),document:values.document||'',phone:values.phone||'',email:values.email||'',notes:values.notes||'',createdAt:old?.createdAt||new Date().toISOString()};
            }else if(entity==='vehicles'){
                savedRecord={id,customerId:values.customerId,brand:values.brand,model:values.model,year:values.year,plate:String(values.plate||'').trim().toUpperCase(),km:Number(values.km)||0};
            }else if(entity==='services'){
                savedRecord={id,name:String(values.name||'').trim(),description:values.description||'',price:Number(values.price)||0,hours:Number(values.hours)||0};
            }else if(entity==='mechanics'){
                const commissionRate=Number(values.commissionRate);
                if(commissionRate<0||commissionRate>100){document.getElementById('workshopFormError').textContent='A taxa deve estar entre 0% e 100%.';return}
                savedRecord={id,name:String(values.name||'').trim(),phone:values.phone||'',commissionRate,active:values.active==='true'};
            }else if(entity==='suppliers'){
                savedRecord={id,name:String(values.name||'').trim(),contact:values.contact||'',phone:values.phone||'',email:values.email||'',notes:values.notes||''};
            }else{
                const quantity=Number(values.quantity);
                const minimum=Number(values.minimum);
                const costPrice=Number(values.costPrice);
                const salePrice=Number(values.salePrice);
                if([quantity,minimum,costPrice,salePrice].some(value=>value<0)){document.getElementById('workshopFormError').textContent='Estoque e preços não podem ser negativos.';return}
                savedRecord={id,name:String(values.name||'').trim(),sku:String(values.sku||'').trim(),category:values.category||'',quantity,minimum,costPrice,salePrice,supplierId:values.supplierId||''};
            }
            if(old){
                const index=next[entity].findIndex(item=>item.id===old.id);
                next[entity][index]=savedRecord;
            }else next[entity].unshift(savedRecord);
        }
        next.counters=structuredClone(state.counters);
        if(!saveState(next))return;
        closeModal();
        renderCatalog();
        renderOperations();
        if(savedRecord&&['orders','budgets'].includes(entity)){
            const printable=confirm(`${savedRecord.id} foi salvo. Deseja abrir a impressão para salvar em PDF?`);
            if(printable)printDocument(savedRecord,entity);
        }else toast('Cadastro salvo com sucesso.');
    };
    const deleteRecord=(entity,id)=>{
        const record=findRecord(entity,id);
        if(!record)return;
        if(entity==='customers'&&(state.vehicles.some(item=>item.customerId===id)||[...state.orders,...state.budgets].some(item=>item.customerId===id))){
            toast('Este cliente está relacionado a veículos ou documentos e não pode ser excluído.');
            return;
        }
        if(entity==='vehicles'&&[...state.orders,...state.budgets].some(item=>item.vehicleId===id)){
            toast('Este veículo está relacionado a uma ordem ou orçamento e não pode ser excluído.');
            return;
        }
        if(entity==='mechanics'&&[...state.orders,...state.budgets].some(item=>item.mechanicId===id)){
            toast('Este mecânico está relacionado a documentos e não pode ser excluído.');
            return;
        }
        if(entity==='suppliers'&&state.parts.some(item=>item.supplierId===id)){
            toast('Esta empresa está relacionada a peças e não pode ser excluída.');
            return;
        }
        if(['services','parts'].includes(entity)&&[...state.orders,...state.budgets].some(document=>document.items?.some(item=>item.itemId===id))){
            toast('Este item está relacionado a uma ordem ou orçamento e não pode ser excluído.');
            return;
        }
        if(!confirm('Excluir este cadastro?'))return;
        const next=structuredClone(state);
        next[entity]=next[entity].filter(item=>item.id!==id);
        if(saveState(next)){renderCatalog();renderOperations();toast('Cadastro excluído.')}
    };
    const printDocument=(record,entity)=>{
        const isOrder=entity==='orders';
        const customer=findRecord('customers',record.customerId);
        const vehicle=findRecord('vehicles',record.vehicleId);
        const rows=(record.items||[]).map(item=>`<tr><td>${esc(item.name)}</td><td>${item.quantity}</td><td>${money(item.unitPrice)}</td><td>${money(item.quantity*item.unitPrice)}</td></tr>`).join('');
        const dateLine=isOrder
            ?`Entrada: ${formatDate(record.receivedAt)} &nbsp; Previsão: ${formatDate(record.deliveryDate)}`
            :`Válido até: ${formatDate(record.validUntil)}`;
        const documentHtml=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(record.id)} · Mekanik</title><style>body{font:14px Arial,sans-serif;color:#172124;margin:38px}h1{font-size:22px;margin:0}h2{font-size:15px;margin:25px 0 8px}header{display:flex;justify-content:space-between;border-bottom:2px solid #e98035;padding-bottom:16px}.number{font-size:18px;font-weight:bold;color:#b85a1a}.info{line-height:1.8;margin-top:18px}.info b{display:inline-block;min-width:105px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #d6dddf}th{font-size:11px;text-transform:uppercase;background:#f1f4f4}.total{text-align:right;font-size:19px;font-weight:bold;margin-top:18px}.notes{white-space:pre-wrap;min-height:60px;border:1px solid #d6dddf;padding:12px;border-radius:4px}.signatures{display:flex;gap:40px;margin-top:70px}.signatures div{flex:1;text-align:center;border-top:1px solid #777;padding-top:8px;font-size:12px}@media print{body{margin:18mm}}</style></head><body><header><div><h1>Mekanik · ${isOrder?'Ordem de serviço':'Orçamento'}</h1><p>${dateLine}</p></div><div class="number">${esc(record.id)}</div></header><section class="info"><div><b>Cliente:</b> ${esc(customer?.name||'')}</div><div><b>ID cliente:</b> ${esc(customer?.id||'')}</div><div><b>Documento:</b> ${esc(customer?.document||'—')}</div><div><b>Telefone:</b> ${esc(customer?.phone||'—')}</div><div><b>Veículo:</b> ${esc(vehicle?`${vehicle.brand} ${vehicle.model} ${vehicle.year||''}`:'')}</div><div><b>Placa:</b> ${esc(vehicle?.plate||'—')} &nbsp; <b>KM:</b> ${Number(vehicle?.km)||0}</div>${isOrder?`<div><b>Mecânico:</b> ${esc(record.mechanicName||'Não atribuído')} &nbsp; <b>Taxa:</b> ${Number(record.commissionRate)||0}%</div>`:''}</section><h2>Serviços e peças</h2><table><thead><tr><th>Descrição</th><th>Qtd.</th><th>Preço unitário</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><div class="total">Total: ${money(record.total)}</div>${isOrder?`<h2>Diagnóstico / observações</h2><div class="notes">${esc(record.diagnosis||'—')}</div>`:`<h2>Observações</h2><div class="notes">${esc(record.description||'—')}</div>`}<div class="signatures"><div>Assinatura do cliente</div><div>Responsável Mekanik</div></div><script>window.addEventListener('load',()=>window.print())<\/script></body></html>`;
        const printWindow=window.open('','_blank');
        if(!printWindow){toast('O navegador bloqueou a janela de impressão. Permita pop-ups para gerar o PDF.');return}
        printWindow.opener=null;
        printWindow.document.open();
        printWindow.document.write(documentHtml);
        printWindow.document.close();
    };
    const convertBudget=id=>{
        const budget=findRecord('budgets',id);
        if(!budget)return;
        const next=structuredClone(state);
        const order={
            ...budget,
            id:nextId('order','OS'),
            mechanicId:'',
            mechanicName:'',
            commissionRate:0,
            commissionValue:0,
            receivedAt:today(),
            deliveryDate:'',
            status:'Aguardando',
            createdAt:new Date().toISOString()
        };
        next.counters=structuredClone(state.counters);
        next.orders.unshift(order);
        if(saveState(next)){
            operationMode='orders';
            document.querySelectorAll('#operationTabs .workshop-tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.operation==='orders'));
            document.getElementById('addOperation').textContent='+ Nova ordem de serviço';
            renderOperations();
            toast(`Ordem ${order.id} criada a partir do orçamento.`);
        }
    };
    const printToPdf=(record,entity)=>{
        const entityRecord=findRecord(entity,record);
        if(entityRecord)printDocument(entityRecord,entity);
    };
    const handleCatalogClick=event=>{
        const edit=event.target.closest('[data-edit-record]');
        if(edit){openModal(activeEntity,findRecord(activeEntity,edit.dataset.editRecord));return}
        const remove=event.target.closest('[data-delete-record]');
        if(remove){deleteRecord(activeEntity,remove.dataset.deleteRecord);return}
        const removeModel=event.target.closest('[data-delete-model]');
        if(removeModel&&state.vehicles.some(item=>item.brand===removeModel.dataset.deleteModel&&item.model===removeModel.dataset.model)){
            toast('Este modelo está associado a um veículo e não pode ser excluído.');
            return;
        }
        if(removeModel&&confirm('Excluir este modelo do catálogo?')){
            const next=structuredClone(state);
            const brand=next.brands.find(item=>item.name===removeModel.dataset.deleteModel);
            if(brand)brand.models=brand.models.filter(item=>item!==removeModel.dataset.model);
            if(saveState(next)){renderCatalog();toast('Modelo removido.')}
        }
    };

    document.getElementById('addCatalogRecord').addEventListener('click',()=>openModal(activeEntity));
    document.getElementById('addOperation').addEventListener('click',()=>openModal(operationMode));
    document.getElementById('catalogSearch').addEventListener('input',event=>{searchQuery=event.target.value;renderCatalog()});
    document.getElementById('operationSearch').addEventListener('input',renderOperations);
    catalogRows.addEventListener('click',handleCatalogClick);
    document.getElementById('operationTabs').addEventListener('click',event=>{
        const button=event.target.closest('[data-operation]');
        if(!button)return;
        operationMode=button.dataset.operation;
        document.querySelectorAll('#operationTabs .workshop-tab').forEach(tab=>tab.classList.toggle('active',tab===button));
        document.getElementById('addOperation').textContent=`+ Novo ${operationMode==='orders'?'ordem de serviço':'orçamento'}`;
        renderOperations();
    });
    sidebar.addEventListener('click',event=>{
        const button=event.target.closest('.nav-item[data-view]');
        if(!button)return;
        const routes={clients:'customers',vehicles:'vehicles',os:'orders',budgets:'budgets',stock:'parts'};
        if(!routes[button.dataset.view])return;
        event.stopImmediatePropagation();
        if(['orders','budgets'].includes(routes[button.dataset.view])){
            operationMode=routes[button.dataset.view];
            document.querySelectorAll('#operationTabs .workshop-tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.operation===operationMode));
            document.getElementById('addOperation').textContent=`+ Novo ${operationMode==='orders'?'ordem de serviço':'orçamento'}`;
            renderOperations();
            showView('workshopOperations');
        }else{
            activeEntity=routes[button.dataset.view];
            searchQuery='';
            document.getElementById('catalogSearch').value='';
            renderCatalog();
            showView('workshopCatalog');
        }
    },true);
    document.addEventListener('click',event=>{
        const button=event.target.closest('[data-new]');
        if(!button)return;
        const routes={client:'customers',vehicle:'vehicles',part:'parts',os:'orders',budget:'budgets'};
        const target=routes[button.dataset.new];
        if(!target)return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if(['orders','budgets'].includes(target)){
            operationMode=target;
            document.querySelectorAll('#operationTabs .workshop-tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.operation===operationMode));
            document.getElementById('addOperation').textContent=`+ Novo ${operationMode==='orders'?'ordem de serviço':'orçamento'}`;
            showView('workshopOperations');
            openModal(target);
        }else{
            activeEntity=target;
            searchQuery='';
            document.getElementById('catalogSearch').value='';
            renderCatalog();
            showView('workshopCatalog');
            openModal(target);
        }
    },true);
    operationRows.addEventListener('click',event=>{
        const print=event.target.closest('[data-print-record]');
        if(print){printToPdf(print.dataset.printRecord,operationMode);return}
        const convert=event.target.closest('[data-convert-budget]');
        if(convert){convertBudget(convert.dataset.convertBudget);return}
        const edit=event.target.closest('[data-edit-operation]');
        if(edit){openModal(operationMode,findRecord(operationMode,edit.dataset.editOperation));return}
        const remove=event.target.closest('[data-delete-operation]');
        if(remove&&confirm('Excluir este documento?')){
            const next=structuredClone(state);
            next[operationMode]=next[operationMode].filter(item=>item.id!==remove.dataset.deleteOperation);
            if(saveState(next)){renderOperations();toast('Documento excluído.')}
        }
    });
    modal.addEventListener('click',event=>{if(event.target===modal||event.target.closest('[data-workshop-close]'))closeModal()});
    form.addEventListener('submit',handleSubmit);

    const searchWrap=document.querySelector('.search-wrap');
    const globalSearch=document.getElementById('globalSearch');
    if(globalSearch&&searchWrap){
        globalSearch.placeholder='Buscar cliente, veículo, OS, serviço ou peça...';
        const results=document.createElement('div');
        results.className='workshop-search-results';
        results.hidden=true;
        results.setAttribute('role','listbox');
        searchWrap.append(results);
        globalSearch.addEventListener('input',()=>{
            const q=globalSearch.value.trim().toLocaleLowerCase('pt-BR');
            if(!q){results.hidden=true;results.replaceChildren();return}
            const matches=[
                ...state.customers.filter(item=>`${item.id} ${item.name} ${item.phone} ${item.document}`.toLocaleLowerCase('pt-BR').includes(q)).map(item=>({label:`Cliente · ${item.id} · ${item.name}`,view:'workshopCatalog',entity:'customers',term:item.name})),
                ...state.vehicles.filter(item=>`${item.brand} ${item.model} ${item.plate} ${item.year}`.toLocaleLowerCase('pt-BR').includes(q)).map(item=>({label:`Veículo · ${item.brand} ${item.model} · ${item.plate}`,view:'workshopCatalog',entity:'vehicles',term:item.plate})),
                ...[...state.orders,...state.budgets].filter(item=>`${item.id} ${customerName(item.customerId)} ${vehicleName(item.vehicleId)}`.toLocaleLowerCase('pt-BR').includes(q)).map(item=>({label:`${item.id.startsWith('OS-')?'OS':'Orçamento'} · ${item.id} · ${customerName(item.customerId)}`,view:'workshopOperations'})),
                ...state.parts.filter(item=>`${item.name} ${item.sku} ${item.category}`.toLocaleLowerCase('pt-BR').includes(q)).map(item=>({label:`Peça · ${item.name} · ${item.sku}`,view:'workshopCatalog',entity:'parts',term:item.name}))
            ].slice(0,8);
            results.replaceChildren();
            if(!matches.length){
                const empty=document.createElement('div');
                empty.className='workshop-search-empty';
                empty.textContent='Nenhum cadastro encontrado.';
                results.append(empty);
            }else matches.forEach(match=>{
                const button=document.createElement('button');
                button.type='button';
                button.className='workshop-search-result';
                button.textContent=match.label;
                button.addEventListener('click',()=>{
                    showView(match.view);
                    if(match.entity){
                        activeEntity=match.entity;
                        document.getElementById('catalogSearch').value=match.term||'';
                        searchQuery=match.term||'';
                        renderCatalog();
                    }else{
                        document.getElementById('operationSearch').value=match.label.split(' · ')[1]||'';
                        operationMode=match.label.startsWith('Orçamento')?'budgets':'orders';
                        document.querySelectorAll('#operationTabs .workshop-tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.operation===operationMode));
                        document.getElementById('addOperation').textContent=`+ Novo ${operationMode==='orders'?'ordem de serviço':'orçamento'}`;
                        renderOperations();
                    }
                    results.hidden=true;
                });
                results.append(button);
            });
            results.hidden=false;
        });
        document.addEventListener('click',event=>{if(!searchWrap.contains(event.target))results.hidden=true});
    }
    renderCatalog();
    renderOperations();
    renderDashboard();
    window.mekanikAdminReady=async()=>{
        const response=await fetch('/api/workshop');
        if(!response.ok){
            const result=await response.json().catch(()=>({}));
            throw new Error(result.error||'Não foi possível carregar os dados da oficina.');
        }
        const {state:storedState}=await response.json();
        if(storedState){
            state=storedState;
            repository.save(state);
            renderCatalog();
            renderOperations();
            renderDashboard();
            return;
        }
        const saveResponse=await fetch('/api/workshop',{
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(state)
        });
        if(!saveResponse.ok){
            const result=await saveResponse.json().catch(()=>({}));
            throw new Error(result.error||'Não foi possível inicializar os dados da oficina no banco de dados.');
        }
    };
    document.querySelectorAll('.nav-item[data-view="clients"],.nav-item[data-view="vehicles"],.nav-item[data-view="stock"],.nav-item[data-view="os"],.nav-item[data-view="budgets"]').forEach(button=>{
        button.addEventListener('click',event=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            if(button.dataset.view==='os'||button.dataset.view==='budgets'){
                operationMode=button.dataset.view==='os'?'orders':'budgets';
                document.querySelectorAll('#operationTabs .workshop-tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.operation===operationMode));
                document.getElementById('addOperation').textContent=`+ Novo ${operationMode==='orders'?'ordem de serviço':'orçamento'}`;
                renderOperations();
                showView('workshopOperations');
                return;
            }
            activeEntity=button.dataset.view==='clients'?'customers':button.dataset.view==='vehicles'?'vehicles':'parts';
            searchQuery='';
            document.getElementById('catalogSearch').value='';
            renderCatalog();
            showView('workshopCatalog');
        },true);
    });
})();

