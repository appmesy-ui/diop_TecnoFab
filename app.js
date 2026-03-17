const SB_URL = 'https://ihqrqcgswgvtmzddoquf.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocXJxY2dzd2d2dG16ZGRvcXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODYyMzQsImV4cCI6MjA4OTI2MjIzNH0.b5EPYLXVJxQ53QW-ceBb-vdVzl2zubwefTnp7B94X8U';
const OAI_KEY = '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';
const sb = supabase.createClient(SB_URL, SB_KEY);

let currentClient = null;
let currentSession = null;
let allAnswers = {};
let clients = [];

// ── QUESTION DATA ──
const SESSIONS = {
  ceo: {
    id:'ceo', label:'Sesión CEO', icon:'👔', iconClass:'shi-ceo', headerClass:'qbh-ceo',
    time:'~25 minutos', sub:'Dolor de negocio · Magnitud económica · Presupuesto',
    blocks:[
      { id:'ctx', name:'Contexto empresa', obj:'Base para benchmark sectorial y cálculo de ROI', questions:[
        {id:'sector', text:'¿A qué sector industrial pertenece la empresa?', type:'sel', prio:'c', opts:['Alimentación y bebidas','Farmacéutico','Cosmética y cuidado personal','Metal y componentes','Plástico y caucho','Papel y cartón','Química','Electrónica','Automoción','Textil','Otro']},
        {id:'employees', text:'¿Cuántos empleados tienen en planta operativa?', type:'sel', prio:'c', opts:['10 - 50 empleados','50 - 150 empleados','150 - 300 empleados','300 - 500 empleados','más de 500 empleados']},
        {id:'revenue', text:'¿Cuál es la facturación anual aproximada?', type:'sel', prio:'c', roi:'Base para calcular el impacto económico de cada problema identificado', opts:['menos de 2M€','2M€ - 5M€','5M€ - 10M€','10M€ - 25M€','25M€ - 50M€','más de 50M€']},
        {id:'lines', text:'¿Cuántas líneas de producción tienen activas?', type:'num', prio:'i'},
      ]},
      { id:'pain', name:'Dolor de negocio y magnitud', obj:'Identificar el dolor principal y cuantificarlo con el CEO', questions:[
        {id:'main_problem', text:'¿Cuál es el principal problema operativo que os impide crecer o ganar más margen?', type:'multi', prio:'c', opts:['No llegamos al plan de producción','Márgenes cayendo sin saber por qué','Costes de materia prima fuera de control','Problemas recurrentes de calidad','No podemos cumplir plazos de entrega','Costes de mantenimiento disparados','Stock siempre descontrolado','Dificultad para escalar','Personal poco capacitado / rotación alta']},
        {id:'problem_cost', text:'¿Cuánto estimáis que os cuesta ese problema al año en euros?', type:'sel', prio:'c', roi:'Percepción del CEO del coste — se contrasta con el cálculo real del diagnóstico', opts:['No lo sabemos','menos de 50.000€','50.000€ - 150.000€','150.000€ - 500.000€','más de 500.000€']},
        {id:'gross_margin', text:'¿Cuál es vuestro margen bruto aproximado sobre ventas?', type:'sel', prio:'c', roi:'Cada punto de mejora en eficiencia impacta directamente en este margen', opts:['menos del 10%','10% - 20%','20% - 35%','35% - 50%','más del 50%','No lo sabemos']},
        {id:'has_recall', text:'¿Habéis tenido recalls o problemas graves de calidad en los últimos 2 años?', type:'yn', prio:'c'},
        {id:'recall_cost', text:'Si tuvisteis recall — ¿cuánto os costó aproximadamente? (producto + gestión + reputación)', type:'sel', prio:'c', roi:'Cuantifica el riesgo de protección del negocio — uno de los argumentos más potentes', opts:['No aplica / No hubo','menos de 50.000€','50.000€ - 200.000€','más de 200.000€','No lo cuantificamos']},
        {id:'lost_orders', text:'¿Estáis perdiendo pedidos o clientes por no poder cumplir volumen o plazos?', type:'yn', prio:'c'},
      ]},
      { id:'budget', name:'Presupuesto y expectativas', obj:'Dimensionar la propuesta antes de salir de la reunión', questions:[
        {id:'project_budget', text:'¿Cuál es el presupuesto estimado para este proyecto de mejora?', type:'sel', prio:'c', opts:['menos de 10.000€','10.000€ - 25.000€','25.000€ - 50.000€','50.000€ - 100.000€','más de 100.000€']},
        {id:'timeline_expectation', text:'¿En cuánto tiempo esperáis ver resultados tangibles?', type:'sel', prio:'i', opts:['En 1-2 meses (Quick Wins)','En 3-6 meses','En 6-12 meses','En más de un año']},
      ]},
    ]
  },
  fab: {
    id:'fab', label:'Sesión Fábrica', icon:'🏭', iconClass:'shi-fab', headerClass:'qbh-fab',
    time:'~40 minutos', sub:'Procesos · Organización · KPIs operativos · Observación directa',
    blocks:[
      { id:'proc', name:'Procesos y complejidad productiva', obj:'Entender qué produce, cómo y con qué complejidad', questions:[
        {id:'process_type', text:'¿Tienen procesos de semiterminado + terminado o solo producto terminado?', type:'sel', prio:'c', opts:['Solo producto terminado','Semiterminado + terminado','Múltiples etapas de transformación']},
        {id:'sku_count', text:'¿Cuántos SKUs tienen activos en catálogo (semiterminados + terminados)?', type:'sel', prio:'c', roi:'Más de 50 SKUs = alta complejidad de cambios de formato. Coste oculto elevado', opts:['menos de 20','20 - 50','50 - 100','más de 100']},
        {id:'product_shelf_life', text:'¿Cuál es la vida útil del producto final?', type:'sel', prio:'i', opts:['Menos de 30 días','1 - 6 meses','6 - 24 meses','más de 2 años']},
        {id:'mp_type', text:'¿Cómo llega la materia prima principal?', type:'multi', prio:'i', opts:['Fresca / refrigerada','Paletizada','Silo / granel','Contenedor / importación']},
        {id:'changeovers_week', text:'¿Cuántos cambios de formato hacen por semana de media?', type:'num', prio:'c', roi:'Frecuencia × tiempo de cambio = horas perdidas semanales. Base para calcular coste de changeover'},
        {id:'changeover_time', text:'¿Cuánto tiempo tarda un cambio de formato de principio a fin? (minutos)', type:'num', prio:'c', roi:'Si la media del sector es 30 min y tardan más, el gap es dinero directo en el P&L'},
      ]},
      { id:'org', name:'Organización, equipo y planificación', obj:'Detectar dependencias, gaps de equipo e ineficiencias en planificación', questions:[
        {id:'team_roles', text:'¿Qué roles existen en planta? (marcar todos los que tienen)', type:'multi', prio:'c', opts:['Director de fábrica','Gerente de producción','Responsable de mantenimiento','Planificador de producción','Responsable de calidad','Técnico de mejora continua','Responsable de almacén / supply chain']},
        {id:'shift_handover', text:'¿Cómo se hace el traspaso de información en el cambio de turno?', type:'sel', prio:'c', opts:['Verbalmente entre operarios','En papel / cuaderno','Por WhatsApp o email','En Excel','En sistema digital']},
        {id:'production_planning', text:'¿Cómo hacen el calendario de producción semanal?', type:'sel', prio:'c', opts:['El director/gerente decide en el momento','Excel manual','Sistema ERP / MES','Herramienta específica de planificación']},
        {id:'planning_hours', text:'¿Cuántas horas a la semana dedica el planificador a tareas manuales de Excel o papel?', type:'sel', prio:'i', roi:'Coste de labor indirecto en tarea sin valor. Fácil de cuantificar y muy visual para el CEO', opts:['menos de 2h','2h - 5h','5h - 10h','más de 10h','No tienen planificador']},
        {id:'key_person_dependency', text:'¿Hay dependencia de personas clave para que el proceso funcione?', type:'yn', prio:'i'},
        {id:'new_operators_year', text:'¿Cuántos operarios nuevos entran al año de media?', type:'num', prio:'i', roi:'Rotación alta = coste formación + merma por inexperiencia + bajada de OEE durante onboarding'},
        {id:'onboarding_weeks', text:'¿Cuántas semanas tarda un operario nuevo en ser autónomo en la línea?', type:'sel', prio:'i', roi:'Tiempo de onboarding × coste/hora × rotación = coste real de la dependencia de personas', opts:['1 - 2 semanas','2 - 4 semanas','1 - 3 meses','más de 3 meses']},
      ]},
      { id:'obs', name:'Observación directa en línea', obj:'Ver con los propios ojos lo que los datos no cuentan', questions:[
        {id:'unnecessary_movement', text:'¿Se observan desplazamientos innecesarios de operarios entre puestos?', type:'yn', prio:'qw'},
        {id:'visible_bottleneck', text:'¿Se identifican cuellos de botella visibles en el flujo de producción?', type:'yn', prio:'c'},
        {id:'line_age', text:'¿Antigüedad promedio de las líneas de producción?', type:'sel', prio:'i', opts:['menos de 5 años','5 - 10 años','10 - 20 años','más de 20 años']},
        {id:'line_connected', text:'¿Las líneas están conectadas a la red corporativa?', type:'sel', prio:'c', opts:['Todas conectadas','Algunas conectadas','Ninguna conectada','No lo saben']},
        {id:'ergonomics_issues', text:'¿Se observan problemas de ergonomía o seguridad en la línea?', type:'yn', prio:'s'},
        {id:'fab_notes', text:'Observaciones libres de la visita en fábrica', type:'txt', prio:'s'},
      ]},
      { id:'kpis', name:'KPIs operativos estimados', obj:'Los números que el CEO no sabe que tiene — el corazón del diagnóstico', questions:[
        {id:'downtime_hours_week', text:'¿Cuántas horas de parada no planificada tienen por semana de media?', type:'sel', prio:'c', roi:'Horas paradas × coste hora línea = pérdida directa. Suele ser el número más impactante', opts:['menos de 2h','2h - 5h','5h - 10h','10h - 20h','más de 20h','No lo saben']},
        {id:'scrap_pct', text:'¿Qué porcentaje de merma o desperdicio estiman sobre la producción total?', type:'sel', prio:'c', roi:'% merma × coste MP × producción anual = pérdida real en euros. Benchmarked contra sector', opts:['menos del 2%','2% - 5%','5% - 10%','10% - 20%','más del 20%','No lo saben']},
        {id:'rework_pct', text:'¿Qué porcentaje del producto final requiere retrabajo o es rechazado en calidad?', type:'sel', prio:'c', roi:'% rechazo × coste producción = coste de no calidad. Puede superar 5-15% de la facturación', opts:['menos del 1%','1% - 3%','3% - 8%','más del 8%','No lo saben']},
        {id:'rework_hours_week', text:'¿Cuántas horas semanales se dedican a retrabajo o reproceso?', type:'num', prio:'c', roi:'Horas retrabajo × coste hora operario × 52 semanas = coste anual del retrabajo'},
      ]},
    ]
  },
  sys: {
    id:'sys', label:'Sesión Sistemas', icon:'⚙️', iconClass:'shi-sys', headerClass:'qbh-sys',
    time:'~35 minutos', sub:'Captura de datos · Trazabilidad · Mantenimiento · ERP',
    blocks:[
      { id:'capture', name:'Captura de datos y OEE', obj:'Auditar qué datos existen hoy y qué gaps hay', questions:[
        {id:'system_type', text:'¿Tienen SCADA, MES, o ningún sistema de captura automática?', type:'sel', prio:'c', opts:['SCADA industrial','MES (Manufacturing Execution System)','Ambos','Solo sensores básicos','Nada — todo manual']},
        {id:'downtime_capture', text:'¿Capturan paradas? ¿Solo cuellos de botella o toda la línea?', type:'sel', prio:'c', opts:['Toda la línea automáticamente','Solo cuellos de botella','El operario las registra a mano','No se capturan']},
        {id:'units_count', text:'¿Las unidades producidas se cuentan automáticamente o de forma manual?', type:'sel', prio:'c', opts:['Automáticamente por sensor','El operario lo cuenta y apunta','Se estima al final del turno','No se registra']},
        {id:'production_report', text:'¿Cómo registran y comunican los partes de producción por turno?', type:'sel', prio:'c', opts:['Sistema digital en tiempo real','Excel al final del turno','Papel / cuaderno','WhatsApp o email']},
        {id:'oee_calculation', text:'¿Cómo calculan el OEE hoy?', type:'sel', prio:'c', opts:['Sistema automático en tiempo real','Excel con datos manuales','Lo calcula el jefe de turno de cabeza','No calculan OEE']},
        {id:'oee_target', text:'¿Saben cuál es el OEE objetivo o nominal de cada línea?', type:'yn', prio:'c'},
        {id:'oee_current', text:'¿Cuál es el OEE real actual? (si lo tienen calculado)', type:'sel', prio:'c', roi:'Diferencia entre OEE actual y benchmark sector (85%) × capacidad línea = potencial de mejora en €', opts:['menos del 50%','50% - 65%','65% - 75%','75% - 85%','más del 85%','No lo saben']},
      ]},
      { id:'traceability', name:'Trazabilidad y calidad', obj:'Detectar exposición a riesgo regulatorio y coste de calidad', questions:[
        {id:'mp_relabel', text:'¿Reetiquetan la materia prima con lote propio a la entrada?', type:'yn', prio:'c'},
        {id:'lot_tracking', text:'¿Se registran y rastrean los lotes a través de todo el proceso productivo?', type:'sel', prio:'c', opts:['Trazabilidad completa de lote a producto final','Trazabilidad parcial (solo algunos puntos)','Solo se registra el lote de entrada','No se hace trazabilidad de lotes']},
        {id:'scrap_calculation_point', text:'¿En qué punto del proceso se calcula la merma?', type:'sel', prio:'c', opts:['En tiempo real por línea','Al final de cada turno','Al final del día','Al final del mes por diferencia contable','No se calcula sistemáticamente']},
        {id:'nonconforming_management', text:'¿Cómo gestionan el producto no conforme?', type:'sel', prio:'i', opts:['Se reaprovecha / reprocesa','Se desecha directamente','Depende del tipo de defecto','No hay protocolo definido']},
        {id:'cleaning_traceability', text:'¿Tienen trazabilidad de procesos de limpieza documentada?', type:'yn', prio:'i'},
        {id:'bom_location', text:'¿Dónde está el BOM (lista de materiales) y cuándo fue la última actualización?', type:'sel', prio:'c', roi:'BOM desactualizado = costes estándar incorrectos = decisiones de precio y margen equivocadas', opts:['En ERP actualizado regularmente','En Excel — actualizado el último año','En Excel — más de 1 año sin actualizar','En papel o en la cabeza del técnico','No tienen BOM formal']},
      ]},
      { id:'maintenance', name:'Mantenimiento', obj:'Cuantificar el coste real del mantenimiento reactivo', questions:[
        {id:'maintenance_records', text:'¿Se registran partes de mantenimiento?', type:'sel', prio:'c', opts:['Automáticamente en sistema CMMS','En ERP módulo mantenimiento','En Excel manualmente','En papel','No se registran']},
        {id:'maintenance_type_pct', text:'¿Qué porcentaje del mantenimiento es reactivo (se llama cuando algo falla) vs preventivo?', type:'sel', prio:'c', roi:'Mantenimiento reactivo cuesta 3-5x más que preventivo. Alta palanca de ROI y Quick Win', opts:['Casi todo reactivo (+80%)','Mayoría reactivo (50-80%)','Mitad y mitad','Mayoría preventivo (50-80%)','Casi todo preventivo (+80%)']},
        {id:'major_failures_month', text:'¿Cuántas averías graves (parada de línea +2h) tienen al mes de media?', type:'num', prio:'c', roi:'Averías × horas parada × coste hora línea = coste mensual de mantenimiento reactivo'},
        {id:'preventive_plan', text:'¿Tienen plan de mantenimiento preventivo formalizado?', type:'yn', prio:'i'},
        {id:'erp_maintenance', text:'¿El ERP tiene módulo de mantenimiento activo y en uso real?', type:'yn', prio:'i'},
      ]},
      { id:'infra', name:'Energía, personal y ERP', obj:'Completar el mapa de overheads y sistemas de gestión', questions:[
        {id:'energy_cost_month', text:'¿Cuánto gastan aproximadamente en energía al mes?', type:'sel', prio:'i', roi:'Comparado con benchmark del sector revela si hay ineficiencia energética oculta', opts:['menos de 5.000€/mes','5.000€ - 15.000€/mes','15.000€ - 50.000€/mes','50.000€ - 150.000€/mes','más de 150.000€/mes']},
        {id:'energy_tracking', text:'¿Se registran consumos de energía y agua?', type:'sel', prio:'i', opts:['Por línea en tiempo real','General de toda la fábrica','Solo la factura mensual','No se registra']},
        {id:'operator_tracking', text:'¿Se registran operarios por línea y operarios transversales (admin, mantenimiento, almacén)?', type:'sel', prio:'i', opts:['Sí, por línea y transversales','Solo operarios directos de línea','Solo el total de planta','No se registra']},
        {id:'erp_system', text:'¿Tienen ERP? ¿Con qué módulos activos y en uso real?', type:'multi', prio:'c', opts:['No tienen ERP','ERP básico sin módulos de producción','Producción / MRP activo','Mantenimiento activo','Calidad activo','Almacén / WMS activo','Finanzas / contabilidad activo']},
        {id:'warehouse_management', text:'¿Cómo gestionan el almacén e inventario de MP y producto terminado?', type:'sel', prio:'i', opts:['WMS dedicado','Módulo ERP de almacén','Excel / hojas de cálculo','Papel / visual','Sin sistema formal']},
        {id:'distribution', text:'¿Hacen expediciones a almacén logístico o directamente a cliente final?', type:'sel', prio:'s', opts:['Directamente a cliente final','A almacén logístico propio','A operador logístico externo','Mixto']},
      ]},
    ]
  }
};

const SESSION_ORDER = ['ceo','fab','sys'];
const SESSION_LABELS = {ceo:'CEO',fab:'Fábrica',sys:'Sistemas'};

// ── INIT ──
async function init() {
  await loadClients();
}

async function loadClients() {
  const {data,error} = await sb.from('diop_clients').select('*').order('created_at',{ascending:false});
  if(error){showToast('Error al cargar clientes');return;}
  clients = data || [];
  renderHome();
}

function renderHome() {
  document.getElementById('home-count').textContent = `${clients.length} diagnóstico${clients.length!==1?'s':''} activo${clients.length!==1?'s':''}`;
  document.getElementById('sidebar-stats').textContent = `${clients.length} cliente${clients.length!==1?'s':''}`;
  const grid = document.getElementById('client-grid');
  if(!clients.length){
    grid.innerHTML = '<div class="empty"><p>No hay diagnósticos todavía.</p></div>';
    return;
  }
  grid.innerHTML = clients.map(c => {
    const prog = getProgress(c);
    const pct = prog.pct;
    return `<div class="cc" onclick="openClient(${c.id})">
      <div class="cc-top"><div class="cc-name">${c.name}</div><div class="cc-sector">${c.sector||'Sin sector'}</div></div>
      <div class="cc-prog-row">
        <div class="prog-track"><div class="prog-fill" style="width:${pct}%"></div></div>
        <div class="prog-pct">${pct}% completado</div>
      </div>
      <div class="cc-sessions">
        ${SESSION_ORDER.map(s=>{
          const st = prog.sessions[s];
          const cls = st==='done'?'csd-done':st==='active'?'csd-active':'csd-pending';
          return `<div class="cs-dot ${cls}"><div class="csd-icon"></div>${SESSION_LABELS[s]}</div>`;
        }).join('')}
        <div class="cs-dot ${prog.report==='done'?'csd-done':prog.report==='active'?'csd-active':'csd-pending'}"><div class="csd-icon"></div>Informe</div>
      </div>
    </div>`;
  }).join('');
}

function getProgress(client) {
  const sessions = {};
  let totalQ = 0, answeredQ = 0;
  SESSION_ORDER.forEach(sid => {
    const completed = allAnswers[`${client.id}_${sid}__completed`];
    const sess = SESSIONS[sid];
    let sTotal = 0, sAnswered = 0;
    sess.blocks.forEach(b => {
      b.questions.forEach(q => {
        sTotal++; totalQ++;
        const ans = allAnswers[`${client.id}_${sid}_${q.id}`];
        if(ans && ans.trim()!=='') { sAnswered++; answeredQ++; }
      });
    });
    if(completed === 'true') {
      sessions[sid] = 'done';
    } else {
      sessions[sid] = sAnswered === sTotal ? 'done' : sAnswered > 0 ? 'active' : 'pending';
    }
  });
  const allSessDone = SESSION_ORDER.every(s=>sessions[s]==='done');
  return {
    pct: totalQ > 0 ? Math.round((answeredQ/totalQ)*100) : 0,
    sessions,
    report: allSessDone ? 'active' : 'pending'
  };
}

async function openClient(clientId) {
  const client = clients.find(c=>c.id===clientId);
  if(!client) return;
  currentClient = client;
  const {data} = await sb.from('diop_answers').select('*').eq('client_id',clientId);
  allAnswers = {};
  (data||[]).forEach(a => { allAnswers[`${clientId}_${a.session}_${a.question_id}`] = a.answer; });
  showClientUI();
}

function showClientUI() {
  document.getElementById('topbar-client').textContent = currentClient.name;
  document.getElementById('topbar-back').classList.add('visible');
  document.getElementById('sidebar-home-content').style.display='none';
  document.getElementById('sidebar-client-content').style.display='block';
  document.getElementById('sc-name').textContent = currentClient.name;
  document.getElementById('sc-meta').textContent = currentClient.sector||'';
  renderSidebarRoadmap();
  const prog = getProgress(currentClient);
  const nextSess = SESSION_ORDER.find(s=>prog.sessions[s]!=='done') || 'ceo';
  if(SESSION_ORDER.every(s=>prog.sessions[s]==='done')) {
    openReport();
  } else {
    openSession(nextSess);
  }
}

function renderSidebarRoadmap() {
  const prog = getProgress(currentClient);
  const steps = [...SESSION_ORDER.map(s=>({id:s,label:SESSION_LABELS[s],status:prog.sessions[s]})),{id:'report',label:'Informe',status:prog.report}];
  document.getElementById('sidebar-roadmap').innerHTML = steps.map((step,i)=>{
    const cls = step.status==='done'?'rc-done':step.status==='active'?'rc-active':'rc-pending';
    const lcls = step.status==='done'?'rld':step.status==='active'?'rla':'';
    const label = step.status==='done'?'✓':(i+1);
    const onclick = step.id!=='report' ? `onclick="openSession('${step.id}')"` : `onclick="openReport()"`;
    return `<div class="rm-item ${step.status==='active'?'rm-active':''}" ${onclick}>
      <div class="rm-circle ${cls}">${label}</div>
      <div class="rm-label ${lcls}">${step.label}</div>
    </div>`;
  }).join('');
}

function openSession(sessionId) {
  currentSession = sessionId;
  document.getElementById('main-content').scrollTop = 0;
  const sess = SESSIONS[sessionId];
  const prog = getProgress(currentClient);
  showScreen('session');

  const blocks = sess.blocks;
  const totalBlocks = blocks.length;

  let html = `<div class="session-hero">
    <div class="sh-icon ${sess.iconClass}">${sess.icon}</div>
    <div class="sh-info">
      <div class="sh-title">${sess.label}</div>
      <div class="sh-sub">${sess.sub}</div>
    </div>
    <div class="sh-time">${sess.time}</div>
  </div>
  <div class="block-prog">
    ${blocks.map((b,i)=>{
      const bAnswers = b.questions.filter(q=>allAnswers[`${currentClient.id}_${sessionId}_${q.id}`]?.trim()).length;
      const bCls = bAnswers===b.questions.length?'bp-done':bAnswers>0?'bp-active':'';
      return `<div class="bp ${bCls}"></div>`;
    }).join('')}
  </div>
  <div class="missing-banner" id="missing-banner">
    <span class="mb-icon">!</span>
    <span class="mb-text" id="missing-text">Hay preguntas críticas sin responder</span>
    <span class="mb-count" id="missing-count"></span>
  </div>`;

  blocks.forEach((block,bi) => {
    html += `<div class="q-block">
      <div class="qb-header ${sess.headerClass}">
        <div><div class="qbh-name">${block.name}</div><div class="qbh-obj">${block.obj}</div></div>
        <div class="qbh-count">${block.questions.length} preg.</div>
      </div>`;

    block.questions.forEach((q,qi) => {
      const globalIdx = blocks.slice(0,bi).reduce((a,b)=>a+b.questions.length,0)+qi+1;
      const pClass = {c:'qp-c',i:'qp-i',s:'qp-s',qw:'qp-qw'}[q.prio];
      const pLabel = {c:'Crítico',i:'Importante',s:'Secundario',qw:'Quick Win'}[q.prio];
      const curVal = allAnswers[`${currentClient.id}_${sessionId}_${q.id}`]||'';

      html += `<div class="q-card${q.roi?' q-quant':''}">
        <div class="q-top">
          <div class="q-meta">
            <span class="q-num">P${String(globalIdx).padStart(2,'0')}</span>
            <span class="q-prio ${pClass}">${pLabel}</span>
          </div>
          <div class="q-text">${q.text}</div>`;

      if(q.type==='yn') {
        html += `<div class="yn-row" data-sess="${sessionId}" data-qid="${q.id}" data-type="yn">
          <button class="yn-btn${curVal==='Sí'?' yn-sel-y':''}" data-val="Sí">Sí</button>
          <button class="yn-btn${curVal==='No'?' yn-sel-n':''}" data-val="No">No</button>
        </div>`;
      } else if(q.type==='sel') {
        html += `<div class="opt-grid" data-sess="${sessionId}" data-qid="${q.id}" data-type="sel">${q.opts.map(o=>`<button class="opt-btn${curVal===o?' opt-sel':''}" data-val="${o.replace(/"/g,'&quot;').replace(/'/g,'&#39;')}">${o}</button>`).join('')}</div>`;
      } else if(q.type==='multi') {
        const selVals = curVal ? curVal.split('||') : [];
        html += `<div class="opt-grid" data-sess="${sessionId}" data-qid="${q.id}" data-type="multi">${q.opts.map(o=>`<button class="opt-btn${selVals.includes(o)?' opt-multi-sel':''}" data-val="${o.replace(/"/g,'&quot;').replace(/'/g,'&#39;')}">${o}</button>`).join('')}</div>`;
      } else if(q.type==='num') {
        html += `<input class="num-input" type="number" min="0" value="${curVal}" placeholder="Introduce un número..." data-sess="${sessionId}" data-qid="${q.id}" data-type="num">`;
      } else if(q.type==='txt') {
        html += `<textarea class="txt-input" placeholder="Notas libres..." data-sess="${sessionId}" data-qid="${q.id}" data-type="txt">${curVal}</textarea>`;
      }

      if(q.roi) html += `<div class="q-roi-hint"><span class="qrh-icon">€</span><span class="qrh-text">${q.roi}</span></div>`;
      html += `</div></div>`;
    });
    html += `</div>`;
  });

  html += `<div class="save-bar">
    <div class="sb-info" id="sb-progress">Calculando progreso...</div>
    <div class="sb-actions">
      <button class="btn-save-sess" onclick="saveAndBack()">Guardar y salir</button>
      <button class="btn-complete-sess" onclick="completeSession('${sessionId}')">Marcar sesión como completada →</button>
    </div>
  </div>`;

  document.getElementById('session-content').innerHTML = html;
  updateSessionProgress(sessionId);
  renderSidebarRoadmap();
  attachSessionEvents();
  markExistingAnswers(sessionId);
}

function markExistingAnswers(sessionId) {
  const sess = SESSIONS[sessionId];
  sess.blocks.forEach(block => {
    block.questions.forEach(q => {
      const val = allAnswers[`${currentClient.id}_${sessionId}_${q.id}`];
      if(val && val.trim()) {
        const containers = document.querySelectorAll(`[data-sess="${sessionId}"][data-qid="${q.id}"]`);
        containers.forEach(c => {
          const card = c.closest('.q-card');
          if(card) card.classList.add('q-answered');
        });
        const inputs = document.querySelectorAll(`[data-type="num"][data-qid="${q.id}"], [data-type="txt"][data-qid="${q.id}"]`);
        inputs.forEach(inp => {
          const card = inp.closest('.q-card');
          if(card) card.classList.add('q-answered');
        });
      }
    });
  });
  updateBlockProgress();
}

let saveTimers = {};
function attachSessionEvents() {
  const sc = document.getElementById('session-content');

  sc.addEventListener('click', async function(e) {
    const btn = e.target.closest('button[data-val]');
    if(!btn) return;
    const container = btn.closest('[data-sess][data-qid]');
    if(!container) return;
    const sess = container.dataset.sess;
    const qid = container.dataset.qid;
    const val = btn.dataset.val;
    const type = container.dataset.type;

    if(type === 'yn') {
      container.querySelectorAll('button').forEach(b => b.classList.remove('yn-sel-y','yn-sel-n'));
      btn.classList.add(val === 'Sí' ? 'yn-sel-y' : 'yn-sel-n');
      await persistAnswer(sess, qid, val);
      markCardAnswered(btn.closest('.q-card'), val);
    } else if(type === 'sel') {
      container.querySelectorAll('button').forEach(b => b.classList.remove('opt-sel'));
      btn.classList.add('opt-sel');
      await persistAnswer(sess, qid, val);
      markCardAnswered(btn.closest('.q-card'), val);
    } else if(type === 'multi') {
      const key = `${currentClient.id}_${sess}_${qid}`;
      let current = allAnswers[key] ? allAnswers[key].split('||') : [];
      if(current.includes(val)) {
        current = current.filter(v => v !== val);
        btn.classList.remove('opt-multi-sel');
      } else {
        current.push(val);
        btn.classList.add('opt-multi-sel');
      }
      const newVal = current.join('||');
      await persistAnswer(sess, qid, newVal);
      markCardAnswered(btn.closest('.q-card'), newVal);
    }
  });

  sc.addEventListener('input', function(e) {
    const el = e.target;
    if(!el.dataset.sess || !el.dataset.qid) return;
    const key = el.dataset.sess + '_' + el.dataset.qid;
    clearTimeout(saveTimers[key]);
    saveTimers[key] = setTimeout(async () => {
      await persistAnswer(el.dataset.sess, el.dataset.qid, el.value);
      markCardAnswered(el.closest('.q-card'), el.value);
    }, 600);
  });
}

function markCardAnswered(card, val) {
  if(!card) return;
  if(val && val.toString().trim() !== '') {
    card.classList.add('q-answered');
    card.classList.remove('q-missing');
  } else {
    card.classList.remove('q-answered');
  }
  updateBlockProgress();
  const remaining = document.querySelectorAll('.q-card.q-missing').length;
  const banner = document.getElementById('missing-banner');
  if(banner && banner.classList.contains('visible')) {
    if(remaining === 0) {
      banner.classList.remove('visible');
    } else {
      const text = document.getElementById('missing-text');
      const count = document.getElementById('missing-count');
      if(text) text.textContent = `Hay ${remaining} pregunta${remaining!==1?'s':''} crítica${remaining!==1?'s':''} sin responder`;
      if(count) count.textContent = `${remaining} pendiente${remaining!==1?'s':''}`;
    }
  }
}

function updateBlockProgress() {
  const blocks = document.querySelectorAll('.q-block');
  const bpItems = document.querySelectorAll('.bp');
  blocks.forEach((block, i) => {
    const total = block.querySelectorAll('.q-card').length;
    const answered = block.querySelectorAll('.q-card.q-answered').length;
    if(i < bpItems.length) {
      bpItems[i].className = 'bp' + (answered === total ? ' bp-done' : answered > 0 ? ' bp-active' : '');
    }
    const header = block.querySelector('.qb-header');
    if(header) {
      if(answered === total) header.classList.add('block-complete');
      else header.classList.remove('block-complete');
    }
    const countEl = block.querySelector('.qbh-count');
    if(countEl) countEl.textContent = `${answered}/${total} respondidas`;
  });
  updateSessionProgress(currentSession);
}

function updateSessionProgress(sessionId) {
  const sess = SESSIONS[sessionId];
  let total=0,answered=0;
  sess.blocks.forEach(b=>b.questions.forEach(q=>{
    total++;
    if(allAnswers[`${currentClient.id}_${sessionId}_${q.id}`]?.trim()) answered++;
  }));
  const el = document.getElementById('sb-progress');
  if(el) el.textContent = `${answered} de ${total} preguntas respondidas`;
}

async function saveAnswer(sessionId, questionId, value, btn, selClass) {
  const parent = btn.closest('.yn-row, .opt-grid');
  if(parent) parent.querySelectorAll('button').forEach(b=>{
    b.classList.remove('yn-sel-y','yn-sel-n','opt-sel');
  });
  btn.classList.add(selClass);
  await persistAnswer(sessionId, questionId, value);
}

async function saveMulti(sessionId, questionId, value, btn) {
  const key = `${currentClient.id}_${sessionId}_${questionId}`;
  let current = allAnswers[key] ? allAnswers[key].split('||') : [];
  if(current.includes(value)) {
    current = current.filter(v=>v!==value);
    btn.classList.remove('opt-multi-sel');
  } else {
    current.push(value);
    btn.classList.add('opt-multi-sel');
  }
  const newVal = current.join('||');
  await persistAnswer(sessionId, questionId, newVal);
}

async function saveAnswerDirect(sessionId, questionId, value) {
  await persistAnswer(sessionId, questionId, value);
}

async function persistAnswer(sessionId, questionId, value) {
  const key = `${currentClient.id}_${sessionId}_${questionId}`;
  allAnswers[key] = value;
  updateSessionProgress(sessionId);
  await sb.from('diop_answers').upsert({
    client_id: currentClient.id,
    session: sessionId,
    question_id: questionId,
    answer: value,
    updated_at: new Date().toISOString()
  },{onConflict:'client_id,session,question_id'});
}

async function completeSession(sessionId) {
  const missing = getMissingCritical(sessionId);
  if(missing.length > 0) {
    highlightMissing(missing);
    return;
  }
  clearMissingHighlights();
  await persistAnswer(sessionId, '_completed', 'true');
  showToast('Sesión completada ✓');
  renderSidebarRoadmap();
  const prog = getProgress(currentClient);
  const nextSess = SESSION_ORDER.find(s=>s!==sessionId && prog.sessions[s]!=='done');
  if(!nextSess || SESSION_ORDER.every(s=>prog.sessions[s]==='done' || s===sessionId)) {
    setTimeout(()=>openReport(),800);
  } else {
    setTimeout(()=>openSession(nextSess),800);
  }
}

function getMissingCritical(sessionId) {
  const sess = SESSIONS[sessionId];
  const missing = [];
  sess.blocks.forEach(block => {
    block.questions.forEach(q => {
      if(q.prio === 'c') {
        const val = allAnswers[`${currentClient.id}_${sessionId}_${q.id}`];
        if(!val || val.trim() === '') missing.push(q.id);
      }
    });
  });
  return missing;
}

function highlightMissing(missingIds) {
  clearMissingHighlights();
  let firstMissing = null;
  missingIds.forEach(qid => {
    const containers = document.querySelectorAll(`[data-qid="${qid}"]`);
    containers.forEach(c => {
      const card = c.closest('.q-card');
      if(card) {
        card.classList.add('q-missing');
        if(!firstMissing) firstMissing = card;
      }
    });
    const inputs = document.querySelectorAll(`[data-qid="${qid}"]`);
    inputs.forEach(inp => {
      const card = inp.closest('.q-card');
      if(card) {
        card.classList.add('q-missing');
        if(!firstMissing) firstMissing = card;
      }
    });
  });
  const banner = document.getElementById('missing-banner');
  const text = document.getElementById('missing-text');
  const count = document.getElementById('missing-count');
  if(banner) {
    banner.classList.add('visible');
    if(text) text.textContent = `Hay ${missingIds.length} pregunta${missingIds.length!==1?'s':''} crítica${missingIds.length!==1?'s':''} sin responder`;
    if(count) count.textContent = `${missingIds.length} pendiente${missingIds.length!==1?'s':''}`;
  }
  if(firstMissing) {
    firstMissing.scrollIntoView({behavior:'smooth', block:'center'});
  }
}

function clearMissingHighlights() {
  document.querySelectorAll('.q-card.q-missing').forEach(c => c.classList.remove('q-missing'));
  const banner = document.getElementById('missing-banner');
  if(banner) banner.classList.remove('visible');
}

function saveAndBack() {
  showToast('Guardado');
  renderSidebarRoadmap();
}

// ── REPORT ──
function openReport() {
  showScreen('report');
  document.getElementById('main-content').scrollTop = 0;
  currentSession = 'report';
  renderSidebarRoadmap();
  const prog = getProgress(currentClient);
  const allDone = SESSION_ORDER.every(s=>prog.sessions[s]==='done');

  document.getElementById('report-content').innerHTML = `
    <div class="report-ready">
      <div class="rr-icon">${allDone?'🎯':'📋'}</div>
      <div class="rr-title">${allDone?'Listo para generar el informe':'Diagnóstico en progreso'}</div>
      <div class="rr-sub">${allDone?'Las tres sesiones están completadas. La IA analizará todas las respuestas y generará el informe DIOP completo.':'Completa las tres sesiones para poder generar el informe DIOP final.'}</div>
      ${allDone?`<button class="gen-btn" id="gen-btn" onclick="generateReport()">Generar Informe DIOP →</button>`:''}
    </div>
    <div class="report-content" id="report-body"></div>`;
}

async function generateReport() {
  const btn = document.getElementById('gen-btn');
  btn.disabled = true; btn.textContent = 'Analizando...';
  document.getElementById('report-body').innerHTML = `
    <div class="report-header">
      <div class="rh-body"><div class="ai-thinking"><div class="ait-dot"></div><div class="ait-dot"></div><div class="ait-dot"></div><span>La IA está analizando todas las respuestas del diagnóstico...</span></div></div>
    </div>`;

  let ctx = `CLIENTE: ${currentClient.name}\nSECTOR: ${currentClient.sector||'No indicado'}\n\n`;
  SESSION_ORDER.forEach(sid=>{
    ctx += `\n=== ${SESSIONS[sid].label.toUpperCase()} ===\n`;
    SESSIONS[sid].blocks.forEach(b=>{
      b.questions.forEach(q=>{
        const ans = allAnswers[`${currentClient.id}_${sid}_${q.id}`];
        if(ans) ctx += `${q.text}: ${ans}\n`;
      });
    });
  });

  const prompt = `Eres un experto en diagnóstico operativo industrial para pymes. Formas parte de Tecno-Fab, una consultora de digitalización industrial IT/OT especializada en empresas industriales de 50-500 empleados en España.

Has completado un diagnóstico DIOP completo de una empresa industrial. Aquí están todas las respuestas recogidas en las tres sesiones:

${ctx}

El framework DIOP de Tecno-Fab tiene tres verticales:
- PERFORMANCE: OEE, paradas, cambios de formato, planificación
- MATERIA PRIMA: trazabilidad, mermas, calidad
- OVERHEADS: energía, labor, mantenimiento

Y tres impactos de negocio: RENTABILIDAD Y MARGEN, CRECER Y ESCALAR, PROTECCIÓN DEL NEGOCIO.

Analiza todo y devuelve un diagnóstico completo en JSON con este formato exacto:
{
  "resumen_ejecutivo": "2-3 frases que resumen el diagnóstico en lenguaje de CEO. Impacto económico total estimado incluido.",
  "vertical_prioritaria": "la vertical con más impacto económico",
  "verticals_secundarias": ["otras verticales afectadas"],
  "impacto_negocio": ["impactos principales identificados"],
  "urgencia": "alta|media|baja",
  "kpis": {
    "oee_estimado": "% estimado o 'No medido'",
    "merma_pct": "% estimado",
    "coste_no_calidad": "estimación en € anuales o rango",
    "impacto_total_estimado": "euros anuales totales de todos los problemas identificados"
  },
  "madurez_digital": {
    "puntuacion": 3,
    "nivel": "nombre del nivel",
    "descripcion": "descripción en 1 frase",
    "siguiente_nivel": "qué necesita para mejorar"
  },
  "benchmark_sectorial": {
    "kpi_referencia": "KPI más relevante para este sector",
    "valor_cliente": "valor estimado del cliente",
    "valor_sector_medio": "media del sector",
    "valor_sector_top": "top performers del sector",
    "gap_euros": "diferencia económica estimada vs media sector"
  },
  "quick_wins": [
    {
      "titulo": "título corto",
      "descripcion": "qué hacer y por qué",
      "impacto_euros": "ahorro estimado anual",
      "plazo_dias": 30,
      "prioridad": 1
    }
  ],
  "roi": {
    "presupuesto_herramienta": "20-30% del presupuesto indicado",
    "ahorro_estimado_anual": "total de ahorros identificados",
    "plazo_retorno_meses": 12,
    "base_calculo": "explicación breve"
  },
  "herramientas_mercado": [
    {
      "nombre": "nombre real de la herramienta",
      "tipo": "SaaS|plataforma|módulo ERP|sensor|otro",
      "precio_aproximado": "ajustado al presupuesto disponible para herramienta",
      "para_que": "qué problema concreto resuelve",
      "url": "web oficial real"
    }
  ],
  "siguiente_pregunta_ceo": "la pregunta más importante para la próxima reunión con el CEO"
}

Para quick_wins incluye exactamente 3, ordenados por impacto económico descendente.
Para herramientas_mercado incluye exactamente 3 herramientas reales existentes en el mercado, ajustadas al sector y presupuesto.
Devuelve SOLO el JSON, sin texto adicional.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${OAI_KEY}`},
      body:JSON.stringify({model:'gpt-4o',max_tokens:2000,messages:[{role:'user',content:prompt}]})
    });
    const data = await res.json();
    const text = (data.choices[0].message.content||'').replace(/```json|```/g,'').trim();
    const r = JSON.parse(text);
    renderReport(r);
  } catch(err) {
    document.getElementById('report-body').innerHTML = `<div style="padding:20px;font-size:13px;color:var(--text2);">Error al generar el informe. Inténtalo de nuevo.</div>`;
    if(btn){btn.disabled=false;btn.textContent='Reintentar →';}
  }
}

function renderReport(r) {
  window._lastReport = r;
  const urgColor = r.urgencia==='alta'?'var(--red)':r.urgencia==='media'?'var(--amber)':'var(--green)';
  const scoreColor = r.madurez_digital?.puntuacion<=3?'var(--red)':r.madurez_digital?.puntuacion<=6?'var(--amber)':'var(--green)';
  const scorePct = ((r.madurez_digital?.puntuacion||0)/10)*100;
  const qws = r.quick_wins||[];
  const tools = r.herramientas_mercado||[];
  const roi = r.roi||{};
  const bench = r.benchmark_sectorial||{};
  const kpis = r.kpis||{};
  const mad = r.madurez_digital||{};
  const today = new Date().toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'});

  const reportHtml = `
  <div class="report-content">
    <div class="report-header">
      <div class="rh-top">
        <svg class="rh-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="36" height="36"><rect width="128" height="128" rx="28" fill="#0B1220"/><g transform="translate(15,36)" stroke="#2ED3C9" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M26 6 L4 28 L26 50"/><path d="M42 50 L56 6"/><path d="M72 6 L94 28 L72 50"/></g></svg>
        <div>
          <div class="rh-company">${currentClient.name}</div>
          <div class="rh-meta">Informe DIOP · Tecno-Fab · ${today}</div>
        </div>
        <div style="margin-left:auto;font-size:11px;padding:4px 10px;border-radius:4px;border:0.5px solid ${urgColor};color:${urgColor};background:rgba(226,75,74,0.06);">Urgencia ${r.urgencia||'—'}</div>
      </div>
      <div class="rh-body">
        <div class="r-section">
          <div class="r-label">Resumen ejecutivo</div>
          <div class="r-summary"><p>${r.resumen_ejecutivo||'—'}</p></div>
        </div>

        <div class="r-section">
          <div class="r-label">KPIs identificados</div>
          <div class="kpi-grid">
            <div class="kpi-card"><div class="kpi-lbl">OEE estimado</div><div class="kpi-val kv-r">${kpis.oee_estimado||'—'}</div></div>
            <div class="kpi-card"><div class="kpi-lbl">Merma estimada</div><div class="kpi-val kv-a">${kpis.merma_pct||'—'}</div></div>
            <div class="kpi-card"><div class="kpi-lbl">Impacto total estimado</div><div class="kpi-val kv-t">${kpis.impacto_total_estimado||'—'}</div></div>
          </div>
        </div>

        <div class="r-section">
          <div class="r-label">Madurez digital</div>
          <div class="madurez-bar-wrap">
            <div class="madurez-row">
              <div class="madurez-score" style="color:${scoreColor}">${mad.puntuacion||'—'}<span style="font-size:13px;color:var(--text3);font-weight:400;">/10</span></div>
              <div class="madurez-nivel" style="color:${scoreColor}">${mad.nivel||'—'}</div>
            </div>
            <div class="madurez-track"><div class="madurez-fill" style="width:${scorePct}%;background:${scoreColor}"></div></div>
            <div class="madurez-desc">${mad.descripcion||''}</div>
            <div class="madurez-next">Para subir de nivel: ${mad.siguiente_nivel||''}</div>
          </div>
        </div>

        <div class="r-section">
          <div class="r-label">Benchmark sectorial · ${bench.kpi_referencia||''}</div>
          <div class="bench-grid">
            <div class="bench-card" style="border:0.5px solid rgba(226,75,74,0.3);">
              <div class="bench-lbl">Tu empresa</div>
              <div class="bench-val kv-r">${bench.valor_cliente||'—'}</div>
            </div>
            <div class="bench-card" style="border:0.5px solid rgba(186,117,23,0.3);">
              <div class="bench-lbl">Media sector</div>
              <div class="bench-val kv-a">${bench.valor_sector_medio||'—'}</div>
            </div>
            <div class="bench-card" style="border:0.5px solid rgba(29,158,117,0.3);">
              <div class="bench-lbl">Top sector</div>
              <div class="bench-val kv-g">${bench.valor_sector_top||'—'}</div>
            </div>
          </div>
          ${bench.gap_euros?`<div style="margin-top:8px;font-size:12px;color:var(--text2);">Gap económico vs media del sector: <strong style="color:var(--teal-l);">${bench.gap_euros}</strong></div>`:''}
        </div>

        <div class="r-section">
          <div class="r-label">Quick Wins priorizados por impacto económico</div>
          <div class="qw-list">
            ${qws.map((qw,i)=>`
              <div class="qw-item">
                <span class="qw-badge ${['qwb-1','qwb-2','qwb-3'][i]||'qwb-3'}">${qw.impacto_euros} · ${qw.plazo_dias} días</span>
                <div class="qw-text"><strong style="color:var(--text)">${qw.titulo}</strong> — ${qw.descripcion}</div>
              </div>`).join('')}
          </div>
        </div>

        <div class="r-section">
          <div class="r-label">ROI estimado del proyecto</div>
          <div class="roi-grid">
            <div class="roi-card"><div class="roi-lbl">Presupuesto herramienta</div><div class="roi-val" style="color:var(--teal-l)">${roi.presupuesto_herramienta||'—'}</div></div>
            <div class="roi-card"><div class="roi-lbl">Ahorro anual estimado</div><div class="roi-val kv-g">${roi.ahorro_estimado_anual||'—'}</div></div>
            <div class="roi-card"><div class="roi-lbl">Plazo de retorno</div><div class="roi-val">${roi.plazo_retorno_meses||'—'} meses</div></div>
          </div>
          <div class="roi-note">${roi.base_calculo||''}</div>
        </div>

        <div class="r-section">
          <div class="r-label">Herramientas del mercado recomendadas</div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:8px;">Ajustadas al sector y presupuesto disponible. Primera = opción más económica.</div>
          <div class="tool-list">
            ${tools.map(t=>`
              <div class="tool-item">
                <div class="tool-top"><div class="tool-name">${t.nombre}</div><div class="tool-type">${t.tipo}</div></div>
                <div class="tool-desc">${t.para_que}</div>
                <div class="tool-foot">
                  <div class="tool-price">${t.precio_aproximado}</div>
                  ${t.url?`<a class="tool-link" href="${t.url}" target="_blank">Ver herramienta →</a>`:''}
                </div>
              </div>`).join('')}
          </div>
        </div>

        <div class="r-section">
          <div class="next-q-box">
            <div class="nqb-lbl">Siguiente pregunta al CEO</div>
            <div class="nqb-text">"${r.siguiente_pregunta_ceo||'—'}"</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  document.getElementById('report-body').innerHTML = reportHtml;
  const rr = document.querySelector('.report-ready');
  if(rr) rr.style.display='none';
  const exportBar = document.createElement('div');
  exportBar.style.cssText = 'display:flex;justify-content:flex-end;padding:16px 0 32px;';
  exportBar.innerHTML = '<button onclick="exportPDF()" style="display:flex;align-items:center;gap:8px;padding:10px 22px;background:rgba(0,173,181,0.1);border:0.5px solid rgba(0,173,181,0.35);border-radius:6px;color:#00dee8;font-size:13px;font-weight:500;cursor:pointer;font-family:var(--font);">↓ Exportar PDF</button>';
  document.getElementById('report-body').appendChild(exportBar);
}

// ── NAV ──
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById(`screen-${name}`).classList.add('on');
}

function goHome() {
  currentClient = null;
  currentSession = null;
  document.getElementById('topbar-client').textContent='';
  document.getElementById('topbar-back').classList.remove('visible');
  document.getElementById('sidebar-home-content').style.display='block';
  document.getElementById('sidebar-client-content').style.display='none';
  showScreen('home');
  loadClients();
}

// ── MODAL ──
function openNewClient() { document.getElementById('modal-client').classList.add('open'); }
function closeModal() { document.getElementById('modal-client').classList.remove('open'); }

async function createClient() {
  const name = document.getElementById('nc-name').value.trim();
  const sector = document.getElementById('nc-sector').value;
  const employees = document.getElementById('nc-employees').value;
  if(!name||!sector){showToast('Nombre y sector son obligatorios');return;}
  const btn = document.getElementById('btn-create');
  btn.disabled=true; btn.textContent='Creando...';
  const {data,error} = await sb.from('diop_clients').insert([{name,sector,employees:employees||null}]).select();
  btn.disabled=false; btn.textContent='Crear diagnóstico';
  if(error){showToast('Error al crear cliente');return;}
  closeModal();
  document.getElementById('nc-name').value='';
  document.getElementById('nc-sector').value='';
  document.getElementById('nc-employees').value='';
  await loadClients();
  openClient(data[0].id);
}

document.getElementById('modal-client').addEventListener('click',e=>{if(e.target===document.getElementById('modal-client'))closeModal();});

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

function exportPDF() {
  const r = window._lastReport;
  const client = currentClient;
  if(!r) { showToast('Genera el informe primero'); return; }
  const today = new Date().toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'});
  const urgColor = r.urgencia==='alta'?'#E24B4A':r.urgencia==='media'?'#BA7517':'#1D9E75';
  const scoreColor = (r.madurez_digital?.puntuacion||0)<=3?'#E24B4A':(r.madurez_digital?.puntuacion||0)<=6?'#BA7517':'#1D9E75';
  const scorePct = ((r.madurez_digital?.puntuacion||0)/10)*100;
  const kpis = r.kpis||{};
  const mad = r.madurez_digital||{};
  const bench = r.benchmark_sectorial||{};
  const roi = r.roi||{};
  const qws = r.quick_wins||[];
  const tools = r.herramientas_mercado||[];

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe DIOP — ${client.name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#0f1a2e;font-size:10pt;line-height:1.5;}
  @page{margin:14mm 12mm;size:A4;}
  @media print{
    body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}
    .no-break{page-break-inside:avoid;}
    .page-break{page-break-after:always;}
  }
  .cover{background:#060b12;color:#e8f4f5;padding:20mm 15mm;min-height:260mm;display:flex;flex-direction:column;}
  .cover-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:40mm;}
  .brand{font-size:14pt;font-weight:bold;color:#e8f4f5;letter-spacing:1px;}
  .diop-tag{font-size:8pt;color:#00adb5;border:1px solid #00adb5;padding:3px 10px;border-radius:4px;}
  .cover-line{width:30mm;height:2px;background:#00adb5;margin-bottom:6mm;}
  .cover-pre{font-size:8pt;color:#3a7a82;text-transform:uppercase;letter-spacing:2px;margin-bottom:3mm;}
  .cover-name{font-size:24pt;font-weight:bold;color:#e8f4f5;margin-bottom:3mm;line-height:1.2;}
  .cover-sector{font-size:11pt;color:#7ab0b8;margin-bottom:15mm;}
  .meta-grid{display:flex;gap:12mm;flex-wrap:wrap;margin-bottom:auto;}
  .meta-item strong{display:block;font-size:7pt;color:#3a7a82;text-transform:uppercase;letter-spacing:1px;margin-bottom:1mm;}
  .meta-item span{font-size:9pt;color:#00dee8;}
  .cover-footer{border-top:1px solid rgba(0,173,181,0.2);padding-top:5mm;display:flex;justify-content:space-between;align-items:center;margin-top:10mm;}
  .cover-footer-left{font-size:8pt;color:#3a7a82;}
  .urgency{font-size:9pt;padding:3px 10px;border-radius:4px;border:1px solid ${urgColor};color:${urgColor};}
  h2{font-size:7pt;text-transform:uppercase;letter-spacing:2px;color:#7ab0b8;margin-bottom:4mm;padding-bottom:2mm;border-bottom:1px solid #e0eef0;}
  .section{margin-bottom:6mm;}
  .summary-box{background:#f0f9fa;border-left:3px solid #00adb5;padding:4mm 5mm;border-radius:0 5px 5px 0;}
  .summary-box p{font-size:10pt;font-weight:bold;color:#0f1a2e;line-height:1.6;}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:4mm;}
  .card{background:#f7fafa;border:1px solid #daedef;border-radius:5px;padding:3mm 4mm;}
  .card-lbl{font-size:7pt;color:#7ab0b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:2mm;}
  .card-val{font-size:14pt;font-weight:bold;}
  .mad-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:2mm;}
  .mad-score{font-size:20pt;font-weight:bold;color:${scoreColor};}
  .mad-nivel{font-size:10pt;font-weight:bold;color:${scoreColor};}
  .mad-bar-bg{height:5px;background:#e0eef0;border-radius:3px;overflow:hidden;margin-bottom:2mm;}
  .mad-bar-fill{height:100%;background:${scoreColor};width:${scorePct}%;border-radius:3px;}
  .mad-desc{font-size:8.5pt;color:#4a7080;}
  .mad-next{font-size:8pt;color:#7ab0b8;font-style:italic;margin-top:1mm;}
  .bench-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm;}
  .bench-card{border-radius:5px;padding:3mm 4mm;text-align:center;}
  .bc1{background:#fef0f0;border:1px solid #f5c0c0;}
  .bc2{background:#fef8ee;border:1px solid #f0d8a0;}
  .bc3{background:#eef8f3;border:1px solid #b0dcc4;}
  .bench-lbl{font-size:7pt;color:#7ab0b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:2mm;}
  .bench-val{font-size:13pt;font-weight:bold;}
  .bench-gap{font-size:8pt;color:#4a7080;margin-top:3mm;}
  .bench-gap strong{color:#00706e;}
  .qw-item{display:flex;gap:3mm;padding:3mm 4mm;border-radius:5px;margin-bottom:3mm;border:1px solid;}
  .qw1{background:#fef0f0;border-color:#f5c0c0;}
  .qw2{background:#fef8ee;border-color:#f0d8a0;}
  .qw3{background:#eef8f3;border-color:#b0dcc4;}
  .qw-num{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9pt;font-weight:bold;flex-shrink:0;margin-top:1mm;}
  .qn1{background:#E24B4A;color:#fff;} .qn2{background:#BA7517;color:#fff;} .qn3{background:#1D9E75;color:#fff;}
  .qw-title{font-size:9pt;font-weight:bold;margin-bottom:1mm;}
  .qw-desc{font-size:8pt;color:#4a7080;line-height:1.4;}
  .qw-meta{font-size:8pt;font-weight:bold;margin-top:1mm;}
  .roi-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm;margin-bottom:2mm;}
  .roi-card{background:#f0f9fa;border:1px solid #daedef;border-radius:5px;padding:3mm 4mm;}
  .roi-lbl{font-size:7pt;color:#7ab0b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:2mm;}
  .roi-val{font-size:12pt;font-weight:bold;color:#00706e;}
  .roi-note{font-size:8pt;color:#7ab0b8;font-style:italic;}
  .tool-item{background:#f7fafa;border:1px solid #daedef;border-radius:5px;padding:3mm 4mm;margin-bottom:2mm;}
  .tool-item:first-child{border-color:#1D9E75;border-left:3px solid #1D9E75;}
  .tool-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:1mm;}
  .tool-name{font-size:9pt;font-weight:bold;}
  .tool-type{font-size:7pt;padding:1px 5px;background:#e8f0f2;color:#7ab0b8;border-radius:3px;}
  .tool-desc{font-size:8pt;color:#4a7080;margin-bottom:2mm;}
  .tool-foot{display:flex;justify-content:space-between;}
  .tool-price{font-size:7.5pt;color:#7ab0b8;}
  .tool-url{font-size:7.5pt;color:#00706e;}
  .next-q{background:#f0f9fa;border-left:3px solid #00adb5;padding:4mm 5mm;border-radius:0 5px 5px 0;}
  .nq-lbl{font-size:7pt;color:#7ab0b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:2mm;}
  .nq-text{font-size:10pt;color:#0f1a2e;font-style:italic;}
  .footer{background:#060b12;padding:3mm 5mm;display:flex;justify-content:space-between;align-items:center;margin-top:5mm;}
  .footer-left{font-size:7.5pt;color:#3a7a82;}
  .footer-right{font-size:7pt;color:#1e4a52;font-style:italic;}
  .disclaimer{background:#f0f9fa;border:1px solid #daedef;border-radius:5px;padding:4mm;margin-top:4mm;}
  .disclaimer p{font-size:8pt;color:#4a7080;line-height:1.5;}
  .header-bar{background:#060b12;padding:4mm 5mm;display:flex;justify-content:space-between;align-items:center;margin-bottom:6mm;}
  .hb-brand{font-size:9pt;font-weight:bold;color:#e8f4f5;}
  .hb-client{font-size:8pt;color:#3a7a82;}
  .hb-page{font-size:7.5pt;color:#3a7a82;}
</style>
</head>
<body>
<div class="cover page-break">
  <div class="cover-top">
    <div class="brand">&lt;/&gt; Tecno-Fab</div>
    <div class="diop-tag">DIOP · Diagnóstico de Impacto Operativo</div>
  </div>
  <div class="cover-line"></div>
  <div class="cover-pre">Informe de diagnóstico industrial</div>
  <div class="cover-name">${client.name}</div>
  <div class="cover-sector">${client.sector||''} ${client.employees?'· '+client.employees:''}</div>
  <div class="meta-grid">
    <div class="meta-item"><strong>Fecha</strong><span>${today}</span></div>
    <div class="meta-item"><strong>Vertical prioritaria</strong><span>${r.vertical_prioritaria||'—'}</span></div>
    <div class="meta-item"><strong>Madurez digital</strong><span>${mad.puntuacion||'—'}/10</span></div>
    <div class="meta-item"><strong>Impacto estimado</strong><span>${kpis.impacto_total_estimado||'—'}</span></div>
  </div>
  <div class="cover-footer">
    <div class="cover-footer-left">tecnofab.com · info@tecnofab.com</div>
    <div class="urgency">Urgencia ${r.urgencia||'—'}</div>
  </div>
</div>
<div class="no-break">
<div class="header-bar">
  <div class="hb-brand">&lt;/&gt; Tecno-Fab</div>
  <div class="hb-client">${client.name} · Informe DIOP</div>
  <div class="hb-page">Página 2 de 4</div>
</div>
<div class="section no-break">
  <h2>Resumen ejecutivo</h2>
  <div class="summary-box"><p>${r.resumen_ejecutivo||'—'}</p></div>
</div>
<div class="section no-break">
  <h2>KPIs identificados</h2>
  <div class="grid3">
    <div class="card"><div class="card-lbl">OEE estimado</div><div class="card-val" style="color:#E24B4A;">${kpis.oee_estimado||'—'}</div></div>
    <div class="card"><div class="card-lbl">Merma estimada</div><div class="card-val" style="color:#BA7517;">${kpis.merma_pct||'—'}</div></div>
    <div class="card"><div class="card-lbl">Impacto total</div><div class="card-val" style="color:#00706e;">${kpis.impacto_total_estimado||'—'}</div></div>
  </div>
</div>
<div class="grid2">
  <div class="section no-break">
    <h2>Madurez digital</h2>
    <div class="mad-row">
      <div class="mad-score">${mad.puntuacion||'—'}<span style="font-size:10pt;color:#7ab0b8;font-weight:normal;">/10</span></div>
      <div class="mad-nivel">${mad.nivel||'—'}</div>
    </div>
    <div class="mad-bar-bg"><div class="mad-bar-fill"></div></div>
    <div class="mad-desc">${mad.descripcion||''}</div>
    <div class="mad-next">Siguiente nivel: ${mad.siguiente_nivel||''}</div>
  </div>
  <div class="section no-break">
    <h2>Benchmark sectorial · ${bench.kpi_referencia||''}</h2>
    <div class="bench-grid">
      <div class="bench-card bc1"><div class="bench-lbl">Tu empresa</div><div class="bench-val" style="color:#E24B4A;">${bench.valor_cliente||'—'}</div></div>
      <div class="bench-card bc2"><div class="bench-lbl">Media sector</div><div class="bench-val" style="color:#BA7517;">${bench.valor_sector_medio||'—'}</div></div>
      <div class="bench-card bc3"><div class="bench-lbl">Top sector</div><div class="bench-val" style="color:#1D9E75;">${bench.valor_sector_top||'—'}</div></div>
    </div>
    ${bench.gap_euros?`<div class="bench-gap">Gap vs media del sector: <strong>${bench.gap_euros}</strong></div>`:''}
  </div>
</div>
<div class="footer">
  <div class="footer-left">Tecno-Fab · DIOP · ${today}</div>
  <div class="footer-right">Documento confidencial — uso exclusivo del cliente</div>
</div>
</div>
<div style="margin-top:8mm;" class="no-break">
<div class="header-bar">
  <div class="hb-brand">&lt;/&gt; Tecno-Fab</div>
  <div class="hb-client">${client.name} · Informe DIOP</div>
  <div class="hb-page">Página 3 de 4</div>
</div>
<div class="section no-break">
  <h2>Quick Wins priorizados por impacto económico</h2>
  ${qws.map((qw,i)=>`
  <div class="qw-item qw${i+1}">
    <div class="qw-num qn${i+1}">${i+1}</div>
    <div>
      <div class="qw-title">${qw.titulo||''}</div>
      <div class="qw-desc">${qw.descripcion||''}</div>
      <div class="qw-meta" style="color:${['#E24B4A','#BA7517','#1D9E75'][i]}">${qw.impacto_euros||''} · ${qw.plazo_dias||'—'} días</div>
    </div>
  </div>`).join('')}
</div>
<div class="section no-break">
  <h2>ROI estimado del proyecto</h2>
  <div class="roi-grid">
    <div class="roi-card"><div class="roi-lbl">Presupuesto herramienta</div><div class="roi-val">${roi.presupuesto_herramienta||'—'}</div></div>
    <div class="roi-card"><div class="roi-lbl">Ahorro anual estimado</div><div class="roi-val">${roi.ahorro_estimado_anual||'—'}</div></div>
    <div class="roi-card"><div class="roi-lbl">Plazo de retorno</div><div class="roi-val">${roi.plazo_retorno_meses||'—'} meses</div></div>
  </div>
  <div class="roi-note" style="margin-top:2mm;">${roi.base_calculo||''}</div>
</div>
<div class="footer">
  <div class="footer-left">Tecno-Fab · DIOP · ${today}</div>
  <div class="footer-right">Documento confidencial — uso exclusivo del cliente</div>
</div>
</div>
<div style="margin-top:8mm;" class="no-break">
<div class="header-bar">
  <div class="hb-brand">&lt;/&gt; Tecno-Fab</div>
  <div class="hb-client">${client.name} · Informe DIOP</div>
  <div class="hb-page">Página 4 de 4</div>
</div>
<div class="section no-break">
  <h2>Herramientas del mercado recomendadas</h2>
  <div style="font-size:8pt;color:#7ab0b8;margin-bottom:3mm;">Ajustadas al sector y presupuesto. Primera opción = más económica.</div>
  ${tools.map(t=>`
  <div class="tool-item">
    <div class="tool-top"><div class="tool-name">${t.nombre||''}</div><div class="tool-type">${t.tipo||''}</div></div>
    <div class="tool-desc">${t.para_que||''}</div>
    <div class="tool-foot">
      <div class="tool-price">${t.precio_aproximado||''}</div>
      ${t.url?`<div class="tool-url">${t.url}</div>`:''}
    </div>
  </div>`).join('')}
</div>
<div class="section no-break">
  <h2>Siguiente pregunta al CEO</h2>
  <div class="next-q">
    <div class="nq-lbl">Pregunta recomendada para la próxima reunión</div>
    <div class="nq-text">"${r.siguiente_pregunta_ceo||'—'}"</div>
  </div>
</div>
<div class="disclaimer no-break">
  <p>Este informe ha sido elaborado por Tecno-Fab mediante la metodología DIOP. Los datos y estimaciones están basados en la información recogida durante las sesiones de diagnóstico con el equipo de ${client.name}. Las cifras de ROI son estimaciones orientativas basadas en benchmarks del sector industrial.</p>
</div>
<div class="footer">
  <div class="footer-left">Tecno-Fab · DIOP · ${today}</div>
  <div class="footer-right">Documento confidencial — uso exclusivo del cliente</div>
</div>
</div>
</body>
</html>`;

  const btn = document.querySelector('[onclick="exportPDF()"]');
  if(btn) { btn.textContent = 'Generando PDF...'; btn.disabled = true; }

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(6,11,18,0.85);z-index:999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:#0a1220;border:0.5px solid rgba(0,173,181,0.3);border-radius:10px;padding:24px 32px;text-align:center;color:#e8f4f5;"><div style="font-size:14px;font-weight:500;margin-bottom:6px;">Generando informe PDF...</div><div style="font-size:12px;color:#3a7a82;">Esto puede tardar unos segundos</div></div>';
  document.body.appendChild(overlay);

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:0;top:0;width:794px;background:#fff;z-index:-1;opacity:0;pointer-events:none;';
  container.innerHTML = html;
  document.body.appendChild(container);

  setTimeout(() => {
    const opt = {
      margin: 0,
      filename: 'DIOP_' + client.name.replace(/[^a-zA-Z0-9]/g,'_') + '_' + new Date().getFullYear() + '.pdf',
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 1.5,
        useCORS: true,
        logging: false,
        windowWidth: 794,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css', before: '.page-break' }
    };

    html2pdf().set(opt).from(container).save().then(() => {
      document.body.removeChild(container);
      document.body.removeChild(overlay);
      if(btn) { btn.textContent = '↓ Exportar PDF'; btn.disabled = false; }
      showToast('PDF descargado ✓');
    }).catch(err => {
      document.body.removeChild(container);
      document.body.removeChild(overlay);
      if(btn) { btn.textContent = '↓ Exportar PDF'; btn.disabled = false; }
      showToast('Error al generar PDF');
      console.error(err);
    });
  }, 500);
}

window.addEventListener('DOMContentLoaded', init);
