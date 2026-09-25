// Detalle de lote: etapas, frascos, incubación con menú, cosecha con modal de oleada.
window.LoteScreen = function LoteScreen({ notify }) {
  const { Stepper, KpiGrid, SectionCard, Table, StateSelect, StatusTag, ProgressDays, Button, IconButton, Menu, Card, PendingList, CostBreakdown, Tag, Dialog, Field, Input, Textarea, Drawer, ChoiceList, Select } = window.KallampaDS;
  const [jars, setJars] = React.useState({ F01: 'Usado', F02: 'Usado', F03: 'Usado', F04: 'Contaminado', F05: 'Colonizado' });
  const [recs, setRecs] = React.useState([
    { id: 'R01', from: 'F01', zone: 'Carpa 1', sub: 'Paja de trigo', kg: 5, inc: 'Finalizado', d: 7, dt: 7, fr: 'Finalizado', waves: [['23/09/2026', 2], ['24/09/2026', 2]] },
    { id: 'R02', from: 'F03', zone: 'Carpa 1', sub: 'Paja de trigo', kg: 3, inc: 'Finalizado', d: 10, dt: 10, fr: 'Fructificando', waves: [] },
    { id: 'R03', from: 'F02', zone: 'Carpa 2', sub: 'Aserrín de roble', kg: 4, inc: 'Incubando', d: 4, dt: 14, fr: null, waves: [] },
  ]);
  const [menu, setMenu] = React.useState(null);
  const [wave, setWave] = React.useState(null);
  const [drawer, setDrawer] = React.useState(false);
  const [pick, setPick] = React.useState(['F05']);
  const upd = (id, fn) => setRecs(rs => rs.map(r => r.id === id ? fn(r) : r));
  const fkg = n => n.toFixed(2).replace('.', ',') + ' kg';
  const total = recs.reduce((a, r) => a + r.waves.reduce((b, w) => b + w[1], 0), 0);
  const fr = recs.filter(r => r.fr);
  const P = 'ENK-L-2026-001-';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 20, padding: '20px 24px 48px', maxWidth: 'var(--content-max)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, flex: '999 1 620px' }}>
        <Card padding="18px 20px">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>ENK-L-2026-001</h1><StatusTag status="En curso" /></div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Enoki · <i>Flammulina velutipes</i> · Inoculado el 07/09/2026 · 5 frascos</div>
          <div style={{ marginTop: 20 }}><Stepper steps={[{ name: 'Inoculación', meta: '07/09 · 5 frascos', state: 'done' }, { name: 'Incubación', meta: recs.length + ' recipientes', state: recs.some(r => r.inc === 'Incubando') ? 'active' : 'done' }, { name: 'Fructificación', meta: fr.filter(r => r.fr === 'Fructificando').length + ' fructificando', state: 'active' }, { name: 'Cosecha', meta: fkg(total), state: 'active' }]} /></div>
          <KpiGrid style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--color-divider)' }} items={[{ label: 'Peso cosechado', value: fkg(total) }, { label: 'Eficiencia biológica', value: (total / fr.reduce((a, r) => a + r.kg, 0) * 100).toFixed(1).replace('.', ',') + ' %' }, { label: 'Costo total', value: '$ 9.160' }, { label: 'Costo por kg', value: '$ ' + Math.round(9160 / total).toLocaleString('es-AR') }]} />
        </Card>
        <SectionCard number="01" title="Inoculación en grano" meta="Arroz · 10 kg · $600/kg · 5 frascos">
          <Table rows={Object.keys(jars)} rowKey={c => c} columns={[
            { key: 'c', label: 'N° de guía (spawn)', numeric: true, render: c => P + c },
            { key: 's', label: 'Estado', render: c => <StateSelect value={jars[c]} options={['Colonizando', 'Colonizado', 'Contaminado', 'Usado']} onChange={v => { setJars(j => ({ ...j, [c]: v })); notify(c + ' marcado como ' + v.toLowerCase()); }} /> },
            { key: 'a', label: '', align: 'right', render: c => jars[c] === 'Colonizado' ? <Button variant="ghost" icon="git-branch">Clonar</Button> : null },
          ]} />
        </SectionCard>
        <SectionCard number="02" title="Incubación" meta={recs.length + ' recipientes'} actions={<Button icon="plus" onClick={() => setDrawer(true)}>Nueva incubación</Button>}>
          <Table minWidth={640} rows={recs} rowKey={r => r.id} columns={[
            { key: 'id', label: 'N° de seguimiento', numeric: true, nowrap: true, render: r => P + r.id },
            { key: 'zone', label: 'Zona' }, { key: 'sub', label: 'Sustrato' },
            { key: 'inc', label: 'Estado', render: r => <StatusTag status={r.inc} /> },
            { key: 'd', label: 'Días', render: r => <ProgressDays value={r.d} total={r.dt} status={r.inc} /> },
            { key: 'm', label: '', align: 'right', render: r => r.inc !== 'Incubando' ? null : <div style={{ position: 'relative', display: 'inline-block' }}><IconButton icon="dots-three" label="Acciones" onClick={() => setMenu(r.id)} />
              <Menu open={menu === r.id} onClose={() => setMenu(null)} items={[
                { label: 'Pasar a fructificación', icon: 'arrow-right', onClick: () => { upd(r.id, x => ({ ...x, inc: 'Finalizado', d: x.dt, fr: 'Fructificando' })); notify(r.id + ' pasó a fructificación'); } },
                { label: 'Marcar contaminado', icon: 'warning-circle', danger: true, onClick: () => upd(r.id, x => ({ ...x, inc: 'Contaminado' })) },
                { label: 'Marcar descartado', icon: 'trash', danger: true, onClick: () => upd(r.id, x => ({ ...x, inc: 'Descartado' })) }]} /></div> },
          ]} />
        </SectionCard>
        <SectionCard number="04" title="Cosecha" meta={fkg(total) + ' en total'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fr.map(r => (
              <Card inset padding="12px 14px" key={r.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ fontWeight: 500, fontSize: 13.5 }}>{P + r.id}</span><StatusTag status={r.fr} /></div>
                  {r.fr === 'Fructificando' ? <div style={{ display: 'flex', gap: 6 }}><Button icon="plus" onClick={() => setWave({ id: r.id, kg: '', tried: false })}>Agregar oleada</Button><Button variant="secondary" onClick={() => upd(r.id, x => ({ ...x, fr: 'Finalizado' }))}>Marcar finalizado</Button></div> : null}
                </div>
                {r.waves.length ? <Table minWidth={400} rows={r.waves} columns={[{ key: 'n', label: 'Oleada', render: (w, i) => (i + 1) + 'ª' }, { key: 'd', label: 'Fecha', numeric: true, render: w => w[0] }, { key: 'k', label: 'Peso', align: 'right', numeric: true, render: w => fkg(w[1]) }]} />
                  : <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 10 }}>Todavía no se registraron oleadas.</div>}
              </Card>
            ))}
          </div>
        </SectionCard>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 76, flex: '1 1 280px', minWidth: 0 }}>
        <PendingList items={[...recs.filter(r => r.inc === 'Incubando').map(r => ({ icon: 'hourglass-medium', text: r.id + ' incubando en ' + r.zone + ': día ' + r.d + ' de ' + r.dt })), ...Object.keys(jars).filter(c => jars[c] === 'Contaminado').map(c => ({ icon: 'warning-circle', tone: 'danger', text: c + ' contaminado: descartar' }))]} />
        <Card padding={16}><CostBreakdown onAdd={() => {}} items={[{ name: 'Grano (arroz)', value: 6000 }, { name: 'Sustrato', value: 2560 }, { name: 'Energía', value: 400 }, { name: 'Bolsas y filtros', value: 200 }]} /></Card>
      </div>

      <Dialog open={!!wave} onClose={() => setWave(null)} title="Agregar oleada" badge={wave ? <Tag tone="accent">{(recs.find(r => r.id === wave.id).waves.length + 1) + 'ª oleada'}</Tag> : null}
        subtitle={wave ? P + wave.id + ' · Paja de trigo · 3,00 kg' : null}
        onSubmit={e => { e.preventDefault(); const k = parseFloat(String(wave.kg).replace(',', '.')); if (!(k > 0)) return setWave({ ...wave, tried: true }); upd(wave.id, x => ({ ...x, waves: [...x.waves, ['25/09/2026', k]] })); notify('Oleada de ' + wave.id + ' guardada: ' + fkg(k)); setWave(null); }}
        footer={<><Button variant="secondary" onClick={() => setWave(null)}>Cancelar</Button><Button type="submit">Guardar oleada</Button></>}>
        {wave ? <>
          <Field label="Peso cosechado" error={wave.tried && !(parseFloat(String(wave.kg).replace(',', '.')) > 0) ? 'Ingresá el peso cosechado.' : null}><Input inputMode="decimal" suffix="kg" placeholder="0,00" value={wave.kg} invalid={wave.tried && !(parseFloat(String(wave.kg).replace(',', '.')) > 0)} onChange={e => setWave({ ...wave, kg: e.target.value })} /></Field>
          <Field label="Notas" optional><Textarea placeholder="Ej.: racimos parejos" /></Field>
        </> : null}
      </Dialog>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Nueva incubación" description="Repartí grano colonizado de uno o más frascos en un nuevo recipiente con sustrato."
        meta={<span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>Se va a crear <Tag tone="outline">{P + 'R0' + (recs.length + 1)}</Tag></span>}
        onSubmit={e => { e.preventDefault(); const id = 'R0' + (recs.length + 1); setRecs(rs => [...rs, { id, from: pick.join(' + '), zone: 'Carpa 1', sub: 'Paja de trigo', kg: 5, inc: 'Incubando', d: 0, dt: 14, fr: null, waves: [] }]); setDrawer(false); notify(id + ' creado en Carpa 1'); }}
        footer={<><Button variant="secondary" block onClick={() => setDrawer(false)}>Cancelar</Button><Button type="submit" block>Crear recipiente</Button></>}>
        <Field label="Frascos de origen"><ChoiceList type="checkbox" name="fr" value={pick} onChange={setPick} items={Object.keys(jars).map(c => ({ value: c, label: P + c, status: jars[c] === 'Usado' ? null : jars[c], note: jars[c] === 'Usado' ? 'ya usado' : null, disabled: ['Colonizando', 'Contaminado'].includes(jars[c]) }))} /></Field>
        <Field label="Zona de incubación" hint="2 recipientes · 22 °C"><Select options={['Carpa 1', 'Carpa 2', 'Sala de incubación']} /></Field>
        <Field label="Sustrato" hint="42 kg en inventario · $200/kg"><Select options={['Paja de trigo', 'Aserrín de roble']} /></Field>
        <Field label="Peso de sustrato (kg)"><Input inputMode="decimal" suffix="kg" placeholder="5,00" /></Field>
      </Drawer>
    </div>
  );
};
