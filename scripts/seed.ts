/**
 * Datos de DEMOSTRACIÓN. Todos los usuarios, reseñas y pedidos son ficticios (users.is_demo = true).
 * Uso: npm run db:seed   (borra y recrea todos los datos; se niega si hay usuarios reales salvo SEED_FORCE=1)
 */
import { config } from "dotenv";
config({ path: process.env.ENV_FILE ?? ".env.local" });

import { deflateSync } from "node:zlib";
import { sql } from "drizzle-orm";
import { CATEGORIES, VERIFICATION_VALIDITY_MONTHS } from "../src/lib/constants";
import { hashPassword } from "../src/lib/auth/password";

const DEMO_PASSWORD = "demo1234";

// PRNG determinístico para que el seed sea reproducible.
let seedState = 20261027;
const rand = () => ((seedState = (seedState * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const daysAgo = (d: number, h = 0) => new Date(Date.now() - d * 864e5 - h * 36e5);

/** PNG liso generado en memoria (placeholder de documento de demostración). */
function demoPng(w = 320, h = 200, rgb: [number, number, number] = [222, 215, 200]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const border = x < 6 || y < 6 || x > w - 7 || y > h - 7;
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = border ? 232 : rgb[0];
      raw[o + 1] = border ? 100 : rgb[1];
      raw[o + 2] = border ? 28 : rgb[2];
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

type ProSeed = {
  name: string;
  email: string;
  trade: string;
  cats: string[];
  zones: string[];
  years: number;
  price: number;
  unit: "visita" | "hora" | "trabajo";
  avail: "hoy" | "esta_semana" | "a_coordinar";
  plan?: "premium";
  bio: string;
  status?: "en_revision" | "pendiente" | "rechazado";
  expiresInDays?: number;
  jobs?: number;
};

const PROS: ProSeed[] = [
  { name: "Carlos Medina", email: "carlos.medina", trade: "Electricista matriculado", cats: ["electricidad"], zones: ["Centro", "Pichincha", "Echesortu", "Abasto"], years: 18, price: 30000, unit: "visita", avail: "esta_semana", plan: "premium", jobs: 9, bio: "Electricista matriculado con 18 años de oficio. Hago instalaciones completas, cambio de tableros, disyuntores y puesta a tierra. Trabajo prolijo, con materiales de primera y presupuesto por escrito antes de empezar." },
  { name: "Gustavo Ríos", email: "gustavo.rios", trade: "Plomero", cats: ["plomeria"], zones: ["Fisherton", "Funes", "Belgrano"], years: 12, price: 28000, unit: "visita", avail: "esta_semana", jobs: 6, bio: "Plomería general: pérdidas, cambio de griferías, instalación de termotanques y bombas. Zona oeste y Funes. Llego a horario y dejo todo limpio." },
  { name: "Marcelo Ibáñez", email: "marcelo.ibanez", trade: "Gasista matriculado", cats: ["gas", "plomeria"], zones: ["Centro", "Alberdi", "Arroyito", "Lourdes"], years: 22, price: 35000, unit: "visita", avail: "a_coordinar", plan: "premium", jobs: 8, bio: "Gasista matriculado de primera categoría. Detección de pérdidas, conexión de artefactos, planos y trámites ante Litoral Gas. Más de 20 años trabajando en Rosario." },
  { name: "Daniela Sosa", email: "daniela.sosa", trade: "Técnica en heladeras y lavarropas", cats: ["electrodomesticos"], zones: ["Echesortu", "Lourdes", "República de la Sexta", "Centro"], years: 9, price: 25000, unit: "visita", avail: "hoy", jobs: 7, bio: "Reparo heladeras, freezers y lavarropas de todas las marcas. Diagnóstico a domicilio y repuestos originales con garantía de 90 días sobre la reparación." },
  { name: "Rubén Acosta", email: "ruben.acosta", trade: "Albañil y pintor", cats: ["reparaciones-hogar"], zones: ["Barrio Martin", "Parque España", "Centro", "Abasto"], years: 25, price: 40000, unit: "trabajo", avail: "a_coordinar", jobs: 5, bio: "Arreglos de albañilería, humedad, revoques, colocación de cerámicos y pintura interior. Trabajo con un ayudante y respeto los tiempos acordados." },
  { name: "Lautaro Giménez", email: "lautaro.gimenez", trade: "Técnico en PC y redes", cats: ["tecnologia"], zones: ["Centro", "Pichincha", "Puerto Norte", "Arroyito"], years: 6, price: 22000, unit: "visita", avail: "hoy", jobs: 8, bio: "Armado y reparación de PC, configuración de wifi, repetidores y mesh, impresoras y cámaras. Explico todo para que puedas manejarlo solo/a después." },
  { name: "Hernán Paz", email: "hernan.paz", trade: "Electricista", cats: ["electricidad"], zones: ["Fisherton", "Funes", "Roldán"], years: 10, price: 27000, unit: "visita", avail: "esta_semana", jobs: 5, bio: "Instalaciones eléctricas en casas y departamentos, iluminación LED, ventiladores de techo y reparación de cortocircuitos." },
  { name: "Silvina Morales", email: "silvina.morales", trade: "Plomera", cats: ["plomeria"], zones: ["Centro", "Echesortu", "Abasto"], years: 8, price: 26000, unit: "visita", avail: "hoy", jobs: 7, bio: "Plomera con 8 años de experiencia. Pérdidas, depósitos de inodoro, canillas, sifones y destapaciones simples. Atiendo urgencias en el día." },
  { name: "Néstor Quiroga", email: "nestor.quiroga", trade: "Gasista matriculado", cats: ["gas"], zones: ["Saladillo", "Tablada", "Villa Gobernador Gálvez", "Las Delicias"], years: 30, price: 32000, unit: "visita", avail: "esta_semana", jobs: 6, bio: "Gasista matriculado. Instalaciones nuevas, rehabilitación de servicio, calefactores y calefones. Zona sur y Villa Gobernador Gálvez." },
  { name: "Federico Luna", email: "federico.luna", trade: "Técnico de aire acondicionado", cats: ["electrodomesticos"], zones: ["Centro", "Puerto Norte", "Alberdi", "Arroyito"], years: 11, price: 30000, unit: "visita", avail: "esta_semana", plan: "premium", jobs: 9, bio: "Instalación, carga de gas y mantenimiento de aires split. Service preventivo antes del verano. Trabajo con matafuego y equipo de altura." },
  { name: "Javier Domínguez", email: "javier.dominguez", trade: "Carpintero", cats: ["reparaciones-hogar"], zones: ["Alberdi", "Arroyito", "La Florida", "Granadero Baigorria"], years: 15, price: 28000, unit: "visita", avail: "a_coordinar", jobs: 4, bio: "Carpintería a medida y arreglos: puertas que no cierran, placares, bisagras, estantes y muebles de cocina." },
  { name: "Agustina Peralta", email: "agustina.peralta", trade: "Soporte técnico y cámaras", cats: ["tecnologia"], zones: ["Fisherton", "Funes", "Roldán", "Belgrano"], years: 7, price: 24000, unit: "visita", avail: "esta_semana", jobs: 5, bio: "Instalo cámaras de seguridad, porteros con video y redes hogareñas. También soporte para notebooks y celulares." },
  { name: "Osvaldo Cabrera", email: "osvaldo.cabrera", trade: "Electricista domiciliario", cats: ["electricidad"], zones: ["Empalme Graneros", "Ludueña", "Barrio Inglés", "Belgrano"], years: 27, price: 26000, unit: "visita", avail: "esta_semana", expiresInDays: 20, jobs: 6, bio: "Electricista con 27 años de experiencia en zona noroeste. Reparaciones, ampliaciones y cambio de cableado viejo." },
  { name: "Pablo Vera", email: "pablo.vera", trade: "Destapaciones y cloacas", cats: ["plomeria"], zones: ["Refinería", "Arroyito", "Alberdi", "Lourdes"], years: 14, price: 30000, unit: "visita", avail: "hoy", jobs: 7, bio: "Destapaciones con máquina, cámaras sépticas, cloacas y desagües pluviales. Atención de urgencias." },
  { name: "Mariano Ojeda", email: "mariano.ojeda", trade: "Gasista y mantenimiento", cats: ["gas", "reparaciones-hogar"], zones: ["Fisherton", "Funes", "Pérez"], years: 16, price: 34000, unit: "visita", avail: "a_coordinar", jobs: 4, bio: "Gasista matriculado y mantenimiento general del hogar. Calefactores, cocinas, termotanques y pequeños arreglos." },
  { name: "Lorena Castro", email: "lorena.castro", trade: "Técnica en lavarropas y lavavajillas", cats: ["electrodomesticos"], zones: ["Fisherton", "Belgrano", "Pérez"], years: 10, price: 24000, unit: "visita", avail: "esta_semana", jobs: 5, bio: "Reparación de lavarropas automáticos, secarropas y lavavajillas. Presupuesto sin cargo si se hace la reparación." },
  { name: "Ezequiel Romero", email: "ezequiel.romero", trade: "Pintor", cats: ["reparaciones-hogar"], zones: ["Centro", "Pichincha", "Echesortu", "Lourdes", "Luis Agote"], years: 9, price: 35000, unit: "trabajo", avail: "esta_semana", jobs: 5, bio: "Pintura de interiores y exteriores, tratamiento de humedad y empapelado. Cubro muebles y pisos antes de empezar." },
  { name: "Ignacio Ferreyra", email: "ignacio.ferreyra", trade: "Técnico en celulares y notebooks", cats: ["tecnologia"], zones: ["Centro", "Abasto", "República de la Sexta"], years: 5, price: 15000, unit: "visita", avail: "hoy", jobs: 6, bio: "Cambio de pantallas y baterías, limpieza de notebooks, recuperación de datos y configuración de equipos nuevos." },
  { name: "Raúl Navarro", email: "raul.navarro", trade: "Electricista y mantenimiento", cats: ["electricidad", "reparaciones-hogar"], zones: ["Saladillo", "Tablada", "Bella Vista", "Azcuénaga"], years: 20, price: 25000, unit: "visita", avail: "esta_semana", jobs: 6, bio: "Electricidad y mantenimiento general: enchufes, luminarias, pequeños arreglos de albañilería y colocación de accesorios." },
  { name: "Walter Sánchez", email: "walter.sanchez", trade: "Mecánico a domicilio", cats: ["mecanica"], zones: ["Centro", "Echesortu", "Fisherton", "Alberdi"], years: 19, price: 35000, unit: "visita", avail: "a_coordinar", jobs: 3, bio: "Mecánica liviana a domicilio: diagnóstico, cambio de batería, service de aceite y filtros, frenos." },
  { name: "Cecilia Vargas", email: "cecilia.vargas", trade: "Plomera y gasista matriculada", cats: ["gas", "plomeria"], zones: ["Pichincha", "Puerto Norte", "Arroyito", "Alberdi"], years: 13, price: 33000, unit: "visita", avail: "esta_semana", plan: "premium", jobs: 8, bio: "Matriculada en gas y con amplia experiencia en plomería de departamentos. Trabajo con presupuesto detallado y factura." },
  { name: "Diego Molina", email: "diego.molina", trade: "Técnico de heladeras", cats: ["electrodomesticos"], zones: ["Ludueña", "Empalme Graneros", "Barrio Inglés", "Capitán Bermúdez"], years: 17, price: 23000, unit: "visita", avail: "hoy", jobs: 5, bio: "Service de heladeras familiares y comerciales, carga de gas, cambio de motocompresores y burletes." },
  { name: "Franco Ledesma", email: "franco.ledesma", trade: "Electricista", cats: ["electricidad"], zones: ["Centro", "Lourdes"], years: 4, price: 24000, unit: "visita", avail: "esta_semana", status: "en_revision", bio: "Electricista recibido en escuela técnica. Instalaciones domiciliarias, cambio de térmicas y luminarias." },
  { name: "Matías Correa", email: "matias.correa", trade: "Técnico de redes", cats: ["tecnologia"], zones: ["Puerto Norte"], years: 3, price: 20000, unit: "visita", avail: "esta_semana", status: "pendiente", bio: "Configuro redes hogareñas y pequeñas oficinas. Cableado estructurado y wifi." },
  { name: "Sergio Paredes", email: "sergio.paredes", trade: "Plomero", cats: ["plomeria"], zones: ["Bella Vista", "Tablada"], years: 6, price: 25000, unit: "visita", avail: "a_coordinar", status: "rechazado", bio: "Plomería en general, instalaciones de agua fría y caliente, reparaciones de pérdidas." },
];

const CLIENTS = [
  { name: "Lucía Fernández", email: "lucia", zone: "Centro" },
  { name: "Martín Gómez", email: "martin", zone: "Fisherton" },
  { name: "Sofía Ramírez", email: "sofia", zone: "Pichincha" },
  { name: "Joaquín Herrera", email: "joaquin", zone: "Alberdi" },
  { name: "Carla Benítez", email: "carla", zone: "Echesortu" },
  { name: "Tomás Aguirre", email: "tomas", zone: "Arroyito" },
];

const JOB_TITLES: Record<string, string[]> = {
  electricidad: ["Cambio de tablero y disyuntor", "Instalar ventilador de techo", "Arreglar enchufes que no andan", "Colocar luces LED en cocina", "Salta la térmica seguido", "Agregar tomas en el living"],
  plomeria: ["Pérdida en la canilla de la cocina", "Cambiar depósito del inodoro", "Destapar cañería del baño", "Instalar termotanque nuevo", "Pérdida en el sifón del lavatorio", "Cambio de flexibles y llaves de paso"],
  gas: ["Revisión de pérdida de gas", "Conectar cocina nueva", "Service de calefactor", "Instalar calefón", "Rehabilitación del servicio de gas"],
  electrodomesticos: ["Heladera que no enfría", "Lavarropas no centrifuga", "Service de aire acondicionado", "Instalar aire split", "Lavavajillas pierde agua"],
  "reparaciones-hogar": ["Arreglar humedad en pared", "Pintar living y comedor", "Puerta de placard descolgada", "Colocar estantes", "Arreglo de revoque en balcón"],
  tecnologia: ["Configurar wifi y repetidor", "Instalar cámaras de seguridad", "Notebook muy lenta", "Cambiar pantalla de celular", "Configurar impresora en red"],
  mecanica: ["Auto no arranca, revisar batería", "Service de aceite y filtros", "Ruido en los frenos"],
};

const COMMENTS_5 = [
  "Llegó puntual, me explicó el problema y lo resolvió en el momento. Lo volvería a llamar sin dudar.",
  "Excelente trabajo. El presupuesto fue exactamente lo que terminé pagando, sin sorpresas. Muy prolijo, dejó todo limpio.",
  "Súper recomendable. Vino el mismo día, fue muy respetuoso y me mostró las piezas que cambió. Da confianza.",
  "Muy profesional. Me mandó fotos del avance por el chat y terminó antes de lo previsto.",
  "Atento y claro con los precios. Comparé tres presupuestos y no era el más barato, pero valió la pena por la calidad.",
  "Resolvió algo que otro técnico no había podido arreglar. Muy buena predisposición y conocimiento.",
  "Trabajo impecable y muy buena onda. Me dio consejos para que no vuelva a pasar.",
  "Muy respetuoso dentro de casa, cuidadoso con los muebles y con el orden. Se nota la experiencia.",
  "Me pasó el presupuesto en el día y vino cuando dijo. Cero vueltas, muy recomendable.",
  "Excelente atención de principio a fin. Respondió todas mis dudas por el chat antes de venir.",
  "Encontró la falla rápido y no me cobró de más. Ya lo agendé para la próxima.",
];
const LUCIA_REVIEW = "Vivo sola y me daba inseguridad que entre alguien a casa, pero fue todo muy correcto y profesional. Lo recomiendo.";
const COMMENTS_4 = [
  "Buen trabajo, quedó bien. Llegó un rato más tarde de lo acordado pero avisó por el chat.",
  "Cumplió con lo presupuestado. Tuvo que volver al otro día por un repuesto, pero lo resolvió.",
  "Muy correcto y prolijo. El precio un poco alto, pero el trabajo lo vale.",
  "Todo bien, rápido y claro. Le faltó un poco de limpieza al final.",
  "Buen trabajo y buena predisposición. Tardó un poco en responder los mensajes.",
];
const COMMENTS_3 = ["El trabajo quedó bien, pero tardó más días de los que había dicho y tuve que insistir para coordinar."];

const TAGS_GOOD = ["Puntualidad", "Prolijidad", "Precio justo", "Buena comunicación", "Resolvió rápido", "Confiable", "Explicó todo"];

async function main() {
  const { db, closeDb, schema } = await import("../src/db");

  const real = await db.execute(sql`select count(*)::int n from users where is_demo = false and role <> 'admin'`);
  if ((real.rows[0] as { n: number }).n > 0 && process.env.SEED_FORCE !== "1") {
    throw new Error("Hay usuarios reales en la base. Corré con SEED_FORCE=1 si de verdad querés borrar todo.");
  }

  console.log("→ Limpiando tablas…");
  await db.execute(sql`truncate table analytics_events, audit_log, email_log, contact_messages, claim_events, claims, reviews, messages, jobs, quotes, service_requests, verification_documents, professional_profiles, files, users, categories restart identity cascade`);

  console.log("→ Categorías");
  await db.insert(schema.categories).values(CATEGORIES.map((c, i) => ({ ...c, sortOrder: i })));

  const demoHash = await hashPassword(DEMO_PASSWORD);
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 10) throw new Error("Definí SEED_ADMIN_PASSWORD (mín. 10 caracteres) en el entorno.");

  console.log("→ Usuarios");
  await db.insert(schema.users).values({
    role: "admin",
    name: "Equipo Manny a la Obra",
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@manny.example",
    passwordHash: await hashPassword(adminPassword),
    isDemo: true,
    createdAt: daysAgo(330),
  });
  const [admin] = await db.select().from(schema.users).where(sql`role = 'admin'`);

  const clientRows = await db
    .insert(schema.users)
    .values(
      CLIENTS.map((c, i) => ({
        role: "cliente" as const,
        name: c.name,
        email: `${c.email}@manny.example`,
        phone: `341 15${(5000000 + i * 137911).toString().slice(0, 7)}`,
        passwordHash: demoHash,
        isDemo: true,
        createdAt: daysAgo(320 - i * 10),
      })),
    )
    .returning();
  const clients = Object.fromEntries(CLIENTS.map((c, i) => [c.email, { ...clientRows[i], zone: c.zone }]));

  const proRows = await db
    .insert(schema.users)
    .values(
      PROS.map((p, i) => ({
        role: "profesional" as const,
        name: p.name,
        email: `${p.email}@manny.example`,
        phone: `341 15${(6000000 + i * 104729).toString().slice(0, 7)}`,
        passwordHash: demoHash,
        isDemo: true,
        createdAt: daysAgo(310 - i * 4),
      })),
    )
    .returning();
  const pros = Object.fromEntries(PROS.map((p, i) => [p.email, { ...proRows[i], seed: p }]));

  console.log("→ Perfiles y verificación");
  const png = demoPng();
  for (const [i, p] of PROS.entries()) {
    const user = proRows[i];
    const status = p.status ?? "verificado";
    const verifiedAt = status === "verificado" ? daysAgo(300 - i * 4) : null;
    let expires: Date | null = null;
    if (verifiedAt) {
      expires = new Date(verifiedAt);
      expires.setMonth(expires.getMonth() + VERIFICATION_VALIDITY_MONTHS);
      if (p.expiresInDays) expires = daysAgo(-p.expiresInDays);
    }
    const licensed = p.cats.some((c) => c === "gas" || c === "electricidad");
    await db.insert(schema.professionalProfiles).values({
      userId: user.id,
      tradeTitle: p.trade,
      categories: p.cats,
      bio: status === "pendiente" ? "" : p.bio,
      yearsExperience: p.years,
      zones: p.zones,
      referencePrice: p.price,
      priceUnit: p.unit,
      availability: p.avail,
      plan: p.plan ?? "gratis",
      licenseNumber: licensed ? `MP-${10000 + i * 731}` : null,
      verificationStatus: status,
      verificationSubmittedAt: status === "pendiente" ? null : daysAgo(status === "en_revision" ? 1 : 305 - i * 4),
      verifiedAt,
      verificationExpiresAt: expires,
      rejectionReason: status === "rechazado" ? "La foto del DNI (dorso) está borrosa y no se puede leer. Subila de nuevo con buena luz." : null,
      externalVerificationRef: status === "pendiente" ? null : `mock-seed-${i}`,
      createdAt: user.createdAt,
    });
    if (status !== "pendiente") {
      const types: ("dni_frente" | "dni_dorso" | "selfie" | "matricula")[] = ["dni_frente", "dni_dorso", "selfie", ...(licensed ? (["matricula"] as const) : [])];
      for (const type of types) {
        const [f] = await db
          .insert(schema.files)
          .values({ ownerId: user.id, kind: "verificacion", mime: "image/png", size: png.length, data: png, originalName: `demo-${type}.png` })
          .returning({ id: schema.files.id });
        await db.insert(schema.verificationDocuments).values({
          professionalId: user.id,
          type,
          fileId: f.id,
          status: status === "verificado" ? "aprobado" : status === "rechazado" && type === "dni_dorso" ? "rechazado" : "pendiente",
          adminNotes: status === "rechazado" && type === "dni_dorso" ? "Imagen ilegible." : null,
        });
      }
    }
  }

  console.log("→ Historial de trabajos y reseñas");
  const clientList = Object.values(clients);
  const anonFor = (userId: string) => `seed-${userId.slice(0, 8)}`;
  const events: (typeof schema.analyticsEvents.$inferInsert)[] = [];

  async function createJob(opts: {
    clientId: string;
    proId: string;
    category: string;
    title: string;
    zone: string;
    created: Date;
    price: number;
    jobStatus: "contratado" | "en_curso" | "finalizado" | "calificado" | "en_reclamo";
    review?: { rating: number; comment: string; tags: string[] };
    extraQuotes?: string[];
  }) {
    const [req] = await db
      .insert(schema.serviceRequests)
      .values({
        clientId: opts.clientId,
        categorySlug: opts.category,
        title: opts.title,
        description: `${opts.title}. Pedido de demostración generado automáticamente para mostrar el flujo completo.`,
        zone: opts.zone,
        urgency: pick(["baja", "media", "urgente"] as const),
        status: "contratado",
        createdAt: opts.created,
      })
      .returning();
    const responded = new Date(opts.created.getTime() + (2 + rand() * 20) * 36e5);
    const [quote] = await db
      .insert(schema.quotes)
      .values({
        requestId: req.id,
        professionalId: opts.proId,
        status: "aceptada",
        price: opts.price,
        durationText: pick(["En el día", "2 a 3 horas", "1 día", "2 días"]),
        message: "Hola, puedo pasar a ver el trabajo. El precio incluye mano de obra; los materiales se presupuestan aparte si hacen falta.",
        respondedAt: responded,
        createdAt: opts.created,
      })
      .returning();
    for (const other of opts.extraQuotes ?? []) {
      await db.insert(schema.quotes).values({
        requestId: req.id,
        professionalId: other,
        status: "descartada",
        price: Math.round((opts.price * (0.85 + rand() * 0.4)) / 500) * 500,
        durationText: "1 día",
        message: "Te paso presupuesto por el trabajo completo.",
        respondedAt: responded,
        createdAt: opts.created,
      });
    }
    const hired = new Date(responded.getTime() + (1 + rand() * 30) * 36e5);
    const finished = ["finalizado", "calificado", "en_reclamo"].includes(opts.jobStatus) ? new Date(hired.getTime() + (24 + rand() * 72) * 36e5) : null;
    const [job] = await db
      .insert(schema.jobs)
      .values({
        requestId: req.id,
        quoteId: quote.id,
        clientId: opts.clientId,
        professionalId: opts.proId,
        status: opts.jobStatus,
        hiredAt: hired,
        startedAt: opts.jobStatus === "contratado" ? null : new Date(hired.getTime() + 12 * 36e5),
        finishedAt: finished,
        createdAt: hired,
      })
      .returning();
    if (opts.review && finished) {
      await db.insert(schema.reviews).values({
        jobId: job.id,
        clientId: opts.clientId,
        professionalId: opts.proId,
        rating: opts.review.rating,
        comment: opts.review.comment,
        tags: opts.review.tags,
        createdAt: new Date(finished.getTime() + 20 * 36e5),
      });
      events.push({ name: "review_created", userId: opts.clientId, anonId: anonFor(opts.clientId), props: { rating: opts.review.rating }, createdAt: finished });
    }
    const anonId = anonFor(opts.clientId);
    events.push(
      { name: "search_performed", userId: opts.clientId, anonId, props: { categoria: opts.category }, createdAt: new Date(opts.created.getTime() - 15 * 6e4) },
      { name: "quote_request_created", userId: opts.clientId, anonId, props: { category: opts.category }, createdAt: opts.created },
      { name: "job_hired", userId: opts.clientId, anonId, props: { hoursToHire: Math.round((hired.getTime() - opts.created.getTime()) / 36e5) }, createdAt: hired },
    );
    return { req, quote, job };
  }

  const verifiedPros = PROS.filter((p) => !p.status);
  for (const p of verifiedPros) {
    const pro = pros[p.email];
    const pool5 = [...COMMENTS_5].sort(() => rand() - 0.5);
    const pool4 = [...COMMENTS_4].sort(() => rand() - 0.5);
    for (let k = 0; k < (p.jobs ?? 4); k++) {
      const client = pick(clientList);
      const roll = rand();
      const rating = roll < 0.72 ? 5 : roll < 0.95 ? 4 : 3;
      const comment = rating === 5 ? pool5[k % pool5.length] : rating === 4 ? pool4[k % pool4.length] : pick(COMMENTS_3);
      const tags = rating >= 4 ? [...TAGS_GOOD].sort(() => rand() - 0.5).slice(0, 1 + Math.floor(rand() * 3)) : ["Explicó todo"];
      const cat = p.cats[k % p.cats.length];
      await createJob({
        clientId: client.id,
        proId: pro.id,
        category: cat,
        title: pick(JOB_TITLES[cat]),
        zone: pick(p.zones),
        created: daysAgo(20 + rand() * 280),
        price: Math.round((p.price * (1 + rand() * 2.5)) / 500) * 500,
        jobStatus: rand() < 0.88 ? "calificado" : "finalizado",
        review: { rating, comment, tags },
      });
    }
  }
  // Las reseñas sin trabajo calificado quedan como "finalizado" sin reseña.
  await db.execute(sql`delete from reviews where job_id in (select id from jobs where status = 'finalizado')`);

  console.log("→ Escenario de Lucía (pedidos en todos los estados)");
  const lucia = clients.lucia;
  const P = (k: string) => pros[k].id;

  // 1) Presupuestado: 2 presupuestos para comparar + 1 pendiente, con chat.
  const [r1] = await db
    .insert(schema.serviceRequests)
    .values({
      clientId: lucia.id,
      categorySlug: "plomeria",
      title: "Pérdida de agua debajo de la bacha",
      description: "Desde hace unos días gotea el caño debajo de la bacha de la cocina y se está mojando el mueble. Es un departamento en un 4° piso con ascensor.",
      zone: "Centro",
      urgency: "urgente",
      desiredDate: daysAgo(-2).toISOString().slice(0, 10),
      status: "presupuestado",
      createdAt: daysAgo(1, 5),
    })
    .returning();
  await db.insert(schema.quotes).values([
    { requestId: r1.id, professionalId: P("silvina.morales"), status: "enviada", price: 38000, durationText: "En el día, 2 horas", availableFrom: daysAgo(-1).toISOString().slice(0, 10), message: "Hola Lucía, por lo que contás es probable que sea el sifón o el flexible. Paso mañana a la mañana; el precio incluye el repuesto si es flexible.", respondedAt: daysAgo(1, 2), createdAt: r1.createdAt },
    { requestId: r1.id, professionalId: P("pablo.vera"), status: "enviada", price: 32000, durationText: "1 a 2 horas", availableFrom: daysAgo(-2).toISOString().slice(0, 10), message: "Puedo pasar pasado mañana. Materiales aparte según lo que haya que cambiar.", respondedAt: daysAgo(0, 20), createdAt: r1.createdAt },
    { requestId: r1.id, professionalId: P("gustavo.rios"), status: "solicitada", createdAt: r1.createdAt },
  ]);
  await db.insert(schema.messages).values([
    { requestId: r1.id, professionalId: P("silvina.morales"), senderId: lucia.id, body: "Hola Silvina, ¿el presupuesto incluye cambiar el sifón si hace falta?", createdAt: daysAgo(1, 1) },
    { requestId: r1.id, professionalId: P("silvina.morales"), senderId: P("silvina.morales"), body: "Sí, si es el sifón estándar lo incluyo. Si es otra cosa te aviso antes de hacer nada.", createdAt: daysAgo(0, 23) },
  ]);

  // 2) Solicitado: esperando respuesta de dos electricistas.
  const [r2] = await db
    .insert(schema.serviceRequests)
    .values({
      clientId: lucia.id,
      categorySlug: "electricidad",
      title: "Tomacorriente que hace chispas",
      description: "El enchufe del dormitorio hace chispas cuando conecto el cargador y está un poco quemado alrededor. Quisiera cambiarlo y revisar los demás.",
      zone: "Centro",
      urgency: "media",
      status: "solicitado",
      createdAt: daysAgo(0, 3),
    })
    .returning();
  await db.insert(schema.quotes).values([
    { requestId: r2.id, professionalId: P("carlos.medina"), status: "solicitada", createdAt: r2.createdAt },
    { requestId: r2.id, professionalId: P("raul.navarro"), status: "solicitada", createdAt: r2.createdAt },
  ]);

  // 3) Contratado, 4) En curso, 5) Finalizado (para calificar), 6) Calificado, 7) En reclamo.
  await createJob({ clientId: lucia.id, proId: P("federico.luna"), category: "electrodomesticos", title: "Instalar aire acondicionado split", zone: "Centro", created: daysAgo(4), price: 85000, jobStatus: "contratado", extraQuotes: [P("daniela.sosa")] });
  await createJob({ clientId: lucia.id, proId: P("lautaro.gimenez"), category: "tecnologia", title: "Configurar wifi y repetidor", zone: "Centro", created: daysAgo(6), price: 30000, jobStatus: "en_curso" });
  await createJob({ clientId: lucia.id, proId: P("daniela.sosa"), category: "electrodomesticos", title: "Lavarropas que no centrifuga", zone: "Centro", created: daysAgo(12), price: 45000, jobStatus: "finalizado" });
  await createJob({ clientId: lucia.id, proId: P("marcelo.ibanez"), category: "gas", title: "Revisión de calefactor antes del invierno", zone: "Centro", created: daysAgo(150), price: 42000, jobStatus: "calificado", review: { rating: 5, comment: LUCIA_REVIEW, tags: ["Confiable", "Explicó todo", "Puntualidad"] } });
  const paint = await createJob({ clientId: lucia.id, proId: P("ezequiel.romero"), category: "reparaciones-hogar", title: "Pintar dormitorio", zone: "Centro", created: daysAgo(25), price: 120000, jobStatus: "en_reclamo" });

  console.log("→ Reclamos");
  const [c1] = await db
    .insert(schema.claims)
    .values({
      jobId: paint.job.id,
      clientId: lucia.id,
      professionalId: P("ezequiel.romero"),
      reason: "trabajo_mal_hecho",
      description: "Quedaron manchas de pintura en el piso y en el marco de la ventana, y una de las paredes tiene zonas sin cubrir. Le escribí por el chat pero no respondió.",
      status: "abierto",
      createdAt: daysAgo(3),
    })
    .returning();
  await db.insert(schema.claimEvents).values({ claimId: c1.id, actorId: lucia.id, status: "abierto", note: "Reclamo iniciado por el cliente. El equipo de Manny a la Obra lo va a revisar en hasta 48 h hábiles.", createdAt: daysAgo(3) });

  const martinJob = await createJob({ clientId: clients.martin.id, proId: P("pablo.vera"), category: "plomeria", title: "Destapar cañería del baño", zone: "Fisherton", created: daysAgo(60), price: 30000, jobStatus: "calificado", review: { rating: 4, comment: "Destapó bien y rápido. Hubo una diferencia con el precio que se resolvió con la mediación de Manny.", tags: ["Resolvió rápido"] } });
  const [c2] = await db
    .insert(schema.claims)
    .values({
      jobId: martinJob.job.id,
      clientId: clients.martin.id,
      professionalId: P("pablo.vera"),
      reason: "precio_distinto",
      description: "El presupuesto era de $30.000 y al terminar me quiso cobrar $45.000 por usar la máquina, algo que no estaba aclarado.",
      status: "resuelto",
      resolution: "Se verificó en el chat que el uso de máquina no estaba presupuestado. El profesional aceptó cobrar lo acordado ($30.000). Ambas partes conformes.",
      resolvedAt: daysAgo(52),
      createdAt: daysAgo(55),
    })
    .returning();
  await db.insert(schema.claimEvents).values([
    { claimId: c2.id, actorId: clients.martin.id, status: "abierto", note: "Reclamo iniciado por el cliente.", createdAt: daysAgo(55) },
    { claimId: c2.id, actorId: admin.id, status: "en_mediacion", note: "Contactamos a ambas partes y revisamos el presupuesto y el chat del pedido.", createdAt: daysAgo(54) },
    { claimId: c2.id, actorId: admin.id, status: "resuelto", note: "Acuerdo alcanzado: se respeta el precio presupuestado.", createdAt: daysAgo(52) },
  ]);

  console.log("→ Un pedido para que Carlos lo responda y analítica de búsquedas anónimas");
  for (let i = 0; i < 40; i++) {
    const anonId = `seed-anon-${i}`;
    events.push({ name: "search_performed", anonId, props: { categoria: pick(CATEGORIES).slug }, createdAt: daysAgo(rand() * 90) });
  }
  for (const p of PROS) events.push({ name: "pro_signup_started", userId: pros[p.email].id, createdAt: pros[p.email].createdAt });
  for (const p of PROS.filter((x) => !x.status || x.status !== "pendiente"))
    events.push({ name: "pro_verification_submitted", userId: pros[p.email].id, createdAt: pros[p.email].createdAt });
  for (let i = 0; i < events.length; i += 200) await db.insert(schema.analyticsEvents).values(events.slice(i, i + 200));

  await db.insert(schema.auditLog).values({ actorId: admin.id, action: "seed.run", entity: "system", entityId: null, meta: { demo: true } });

  const summary = await db.execute(sql`select
    (select count(*) from users where role='profesional') pros,
    (select count(*) from professional_profiles where verification_status='verificado') verificados,
    (select count(*) from users where role='cliente') clientes,
    (select count(*) from service_requests) pedidos,
    (select count(*) from reviews) resenas,
    (select round(avg(rating)::numeric,2) from reviews) promedio,
    (select count(*) from claims) reclamos`);
  console.log("✓ Seed listo:", summary.rows[0]);
  console.log(`  Demo: lucia@manny.example / carlos.medina@manny.example (contraseña: ${DEMO_PASSWORD})`);
  await closeDb();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
