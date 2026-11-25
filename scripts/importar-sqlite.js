const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const raiz = path.resolve(__dirname, '..');
const archivoEnv = path.join(raiz, '.env.local');
const valores = {};

if (fs.existsSync(archivoEnv)) {
  for (const linea of fs.readFileSync(archivoEnv, 'utf8').split(/\r?\n/)) {
    const coincidencia = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (coincidencia) valores[coincidencia[1]] = coincidencia[2].replace(/^["']|["']$/g, '');
  }
}

const url = valores.SUPABASE_URL || valores.EXPO_PUBLIC_SUPABASE_URL;
const clave = valores.SUPABASE_SECRET_KEY;
const ruta = process.argv[2];

if (!url || !clave || !ruta) {
  console.error('Uso: node scripts/importar-sqlite.js ruta/al/fisiokids-export.json');
  console.error('Requiere SUPABASE_URL (o EXPO_PUBLIC_SUPABASE_URL) y SUPABASE_SECRET_KEY en .env.local');
  process.exit(1);
}

if (!clave.startsWith('sb_secret_')) {
  console.error('SUPABASE_SECRET_KEY no parece una clave secreta (debe empezar por sb_secret_).');
  process.exit(1);
}

const datos = JSON.parse(fs.readFileSync(path.resolve(ruta), 'utf8'));
if (!datos?.tablas || typeof datos.tablas !== 'object') {
  console.error('El JSON no contiene la propiedad "tablas".');
  process.exit(1);
}

const ORDEN = [
  'usuarios',
  'salas',
  'ninos',
  'tipos_discapacidad',
  'suspensiones',
  'bloques',
  'asignaciones',
  'asistencias',
  'cierres_bloque',
  'avisos_leidos',
];

const COLUMNAS = {
  usuarios: ['id', 'nombres', 'apellidos', 'correo', 'rol', 'especialidad', 'activo', 'foto'],
  salas: ['id', 'nombre', 'capacidad', 'activo'],
  ninos: ['id', 'nombres', 'apellidos', 'fecha_nacimiento', 'tipo_discapacidad', 'grado', 'tutor_nombre', 'tutor_telefono', 'observaciones', 'activo'],
  tipos_discapacidad: ['id', 'nombre', 'activo'],
  suspensiones: ['id', 'fecha', 'motivo', 'origen'],
  bloques: ['id', 'dia_semana', 'hora_inicio', 'hora_fin', 'actividad', 'profesional_id', 'sala_id'],
  asignaciones: ['id', 'bloque_id', 'nino_id'],
  asistencias: ['id', 'bloque_id', 'nino_id', 'fecha', 'estado', 'actividades', 'observaciones'],
  cierres_bloque: ['id', 'bloque_id', 'fecha', 'cerrado_por'],
  avisos_leidos: ['usuario_id', 'clave'],
};

const cliente = createClient(url, clave, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function preparar(nombre, filas) {
  const permitidas = COLUMNAS[nombre];
  return filas
    .filter((fila) => fila && typeof fila === 'object')
    .map((fila) => {
      const limpia = {};
      for (const columna of permitidas) {
        if (columna in fila) limpia[columna] = fila[columna];
      }
      return limpia;
    });
}

function trozos(lista, tamano) {
  const resultado = [];
  for (let i = 0; i < lista.length; i += tamano) resultado.push(lista.slice(i, i + tamano));
  return resultado;
}

async function importar() {
  for (const nombre of ORDEN) {
    const filas = preparar(nombre, datos.tablas[nombre] ?? []);
    if (filas.length === 0) {
      console.log(`${nombre}: 0 filas (omitida)`);
      continue;
    }
    const conflict = nombre === 'avisos_leidos' ? 'usuario_id,clave' : 'id';
    for (const parte of trozos(filas, 200)) {
      const { error } = await cliente.from(nombre).upsert(parte, { onConflict: conflict });
      if (error) throw new Error(`${nombre}: ${error.message}`);
    }
    console.log(`${nombre}: ${filas.length} filas`);
  }

  const { error } = await cliente.rpc('fn_reajustar_secuencias');
  if (error) throw new Error(`fn_reajustar_secuencias: ${error.message}`);
  console.log('Secuencias reajustadas. Importación terminada.');
}

importar().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
