import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Notice, PageHeader } from "@/components/ui";
import { SITE } from "@/lib/constants";

type Doc = { title: string; description: string; body: ReactNode };

const UPDATED = "27 de octubre de 2026";

const DOCS: Record<string, Doc> = {
  terminos: {
    title: "Términos y condiciones",
    description: "Condiciones de uso de la plataforma Manny a la Obra.",
    body: (
      <>
        <h2>1. Qué es Manny a la Obra</h2>
        <p>Manny a la Obra (en adelante, “la Plataforma”) es un servicio digital que conecta a personas que necesitan contratar un servicio (“Clientes”) con profesionales independientes previamente verificados (“Profesionales”). La Plataforma no presta los servicios ofrecidos por los Profesionales ni es empleadora de ellos.</p>
        <h2>2. Cuentas</h2>
        <p>Para pedir presupuestos o ofrecer servicios tenés que crear una cuenta con datos verdaderos y mantener la confidencialidad de tu contraseña. Debés ser mayor de 18 años. Podemos suspender cuentas ante datos falsos, fraude o incumplimientos graves.</p>
        <h2>3. Verificación de Profesionales</h2>
        <p>Los Profesionales deben acreditar su identidad (DNI y selfie) y, cuando el oficio lo exija, su matrícula habilitante. La verificación es una revisión documental razonable y no constituye garantía absoluta sobre la conducta futura del Profesional. La verificación tiene una vigencia de 12 meses.</p>
        <h2>4. Presupuestos y contratación</h2>
        <p>Los presupuestos son emitidos por cada Profesional bajo su exclusiva responsabilidad. El contrato de servicios se celebra directamente entre Cliente y Profesional. En esta etapa, los pagos se realizan por fuera de la Plataforma.</p>
        <h2>5. Comisiones y planes</h2>
        <p>El uso para Clientes es gratuito. Los Profesionales del plan Gratis abonan una comisión del 15% sobre los trabajos concretados a través de la Plataforma; el plan Premium tiene un costo mensual informado en la sección Para profesionales.</p>
        <h2>6. Reseñas</h2>
        <p>Sólo pueden calificar los Clientes que contrataron y finalizaron un trabajo en la Plataforma, conforme a la <Link href="/legal/resenas">Política de reseñas</Link>.</p>
        <h2>7. Reclamos y respaldo</h2>
        <p>Los reclamos se gestionan según la <Link href="/legal/reclamos">Política de reclamos y garantía</Link>. La Plataforma actúa como mediadora y no asume responsabilidad directa por la ejecución del trabajo, sin perjuicio de los derechos que asisten al Cliente bajo la Ley 24.240 de Defensa del Consumidor.</p>
        <h2>8. Conductas prohibidas</h2>
        <ul>
          <li>Publicar información falsa, ofensiva o que infrinja derechos de terceros.</li>
          <li>Usar la Plataforma para contactar usuarios con fines ajenos al servicio.</li>
          <li>Manipular reseñas o eludir deliberadamente la Plataforma para evitar comisiones.</li>
        </ul>
        <h2>9. Modificaciones</h2>
        <p>Podemos modificar estos términos. Te avisaremos por email con al menos 15 días de anticipación cuando los cambios sean relevantes.</p>
        <h2>10. Ley aplicable</h2>
        <p>Estos términos se rigen por las leyes de la República Argentina. Para cualquier controversia serán competentes los tribunales ordinarios de la ciudad de Rosario, provincia de Santa Fe, salvo norma de orden público en contrario.</p>
      </>
    ),
  },
  privacidad: {
    title: "Política de privacidad",
    description: "Cómo tratamos tus datos personales según la Ley 25.326.",
    body: (
      <>
        <h2>1. Responsable</h2>
        <p>El responsable de la base de datos es Manny a la Obra (sociedad en formación, SAS), con domicilio en Rosario, Santa Fe. Contacto: {SITE.email}.</p>
        <h2>2. Qué datos recolectamos</h2>
        <ul>
          <li>De todos los usuarios: nombre, email, teléfono, contraseña (cifrada) y datos de uso.</li>
          <li>De Clientes: pedidos, descripciones, fotos, mensajes, reseñas y reclamos.</li>
          <li>De Profesionales: datos de perfil, zonas, matrícula y documentación de verificación (DNI, selfie).</li>
        </ul>
        <h2>3. Para qué los usamos</h2>
        <p>Para prestar el servicio (búsqueda, presupuestos, chat, reseñas y reclamos), verificar identidades, prevenir fraude, enviar notificaciones y medir el uso de la Plataforma de forma agregada.</p>
        <h2>4. Documentación de verificación</h2>
        <p>Los documentos de identidad sólo son accesibles por el propio Profesional y por personal autorizado de la Plataforma. Nunca se publican ni se comparten con Clientes. Podremos compartirlos con un proveedor de verificación de identidad que actúe como encargado del tratamiento.</p>
        <h2>5. Con quién compartimos</h2>
        <p>Con la otra parte de un pedido, sólo lo necesario para coordinar el trabajo; con proveedores tecnológicos (alojamiento, base de datos, email) bajo acuerdos de confidencialidad; y con autoridades cuando la ley lo exija.</p>
        <h2>6. Tus derechos</h2>
        <p>Podés ejercer los derechos de acceso, rectificación, actualización y supresión escribiendo a {SITE.email}. El acceso es gratuito en intervalos no menores a seis meses (art. 14, inc. 3, Ley 25.326).</p>
        <p>LA AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.</p>
        <h2>7. Conservación y seguridad</h2>
        <p>Conservamos los datos mientras tengas una cuenta activa y luego por los plazos legales. Aplicamos medidas técnicas razonables: cifrado en tránsito, contraseñas cifradas y control de acceso por rol.</p>
        <h2>8. Cookies</h2>
        <p>Usamos cookies estrictamente necesarias para mantener tu sesión y un identificador anónimo para medir el uso de forma agregada.</p>
      </>
    ),
  },
  resenas: {
    title: "Política de reseñas",
    description: "Quién puede opinar, qué se modera y cómo se publican las reseñas.",
    body: (
      <>
        <h2>1. Sólo trabajos reales</h2>
        <p>Una reseña sólo puede publicarla el Cliente que contrató al Profesional a través de la Plataforma, una vez que el trabajo fue marcado como finalizado. Se permite una reseña por trabajo.</p>
        <h2>2. Qué incluye</h2>
        <p>Una calificación de 1 a 5 estrellas, un comentario y, opcionalmente, etiquetas (puntualidad, prolijidad, precio justo, etc.).</p>
        <h2>3. Moderación</h2>
        <p>Revisamos antes de publicar las reseñas que contengan datos de contacto, enlaces, lenguaje ofensivo o acusaciones graves sin detalle. Podemos ocultar reseñas que violen esta política; nunca editamos su contenido.</p>
        <h2>4. Denuncias</h2>
        <p>El Profesional puede denunciar una reseña que considere injusta o falsa. La reseña sigue visible mientras el equipo la revisa. Una reseña negativa no se oculta por ser negativa.</p>
        <h2>5. Prohibiciones</h2>
        <ul>
          <li>Ofrecer beneficios a cambio de reseñas.</li>
          <li>Publicar reseñas sobre uno mismo o de competidores.</li>
          <li>Incluir datos personales de terceros.</li>
        </ul>
      </>
    ),
  },
  reclamos: {
    title: "Política de reclamos y garantía",
    description: "Cómo funciona el respaldo de Manny a la Obra cuando algo sale mal.",
    body: (
      <>
        <h2>1. Quién puede reclamar</h2>
        <p>El Cliente que contrató un trabajo a través de la Plataforma puede abrir un reclamo una vez que el trabajo fue marcado como finalizado, dentro de los 30 días siguientes.</p>
        <h2>2. Motivos</h2>
        <p>Trabajo mal hecho, incumplimiento de plazo, cobro distinto al presupuestado, inasistencia, daños, trato inadecuado u otros motivos debidamente descriptos.</p>
        <h2>3. Procedimiento</h2>
        <ul>
          <li><strong>Abierto:</strong> registramos el reclamo y confirmamos su recepción.</li>
          <li><strong>En mediación:</strong> en hasta 48 h hábiles contactamos a ambas partes y revisamos presupuesto, chat y fotos.</li>
          <li><strong>Resuelto:</strong> se registra el acuerdo (corrección del trabajo, ajuste de precio u otra solución).</li>
          <li><strong>Cerrado:</strong> cuando no corresponde o no hay acuerdo, con nuestro dictamen fundado.</li>
        </ul>
        <h2>4. Alcance del respaldo en esta etapa</h2>
        <p>En el MVP, el respaldo consiste en la mediación y el registro del reclamo. La Plataforma no realiza reintegros dinerarios por cuenta propia. La retención de pagos y la garantía con aseguradora se incorporarán en una etapa posterior.</p>
        <h2>5. Consecuencias para Profesionales</h2>
        <p>Los incumplimientos acreditados pueden implicar advertencias, pérdida de visibilidad, suspensión de la insignia Verificado o baja de la Plataforma.</p>
        <h2>6. Derechos del consumidor</h2>
        <p>Este procedimiento no limita los derechos del Cliente bajo la Ley 24.240 ni su posibilidad de acudir a las autoridades de defensa del consumidor.</p>
      </>
    ),
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = DOCS[slug];
  return doc ? { title: doc.title, description: doc.description } : { title: "No encontrado" };
}

export default async function LegalPage(props: PageProps<"/legal/[slug]">) {
  const { slug } = await props.params;
  const doc = DOCS[slug];
  if (!doc) notFound();
  return (
    <div className="container-page max-w-3xl py-12">
      <PageHeader eyebrow="Legales" title={doc.title}>
        Última actualización: {UPDATED}
      </PageHeader>
      <Notice tone="warn">
        <strong>Aviso interno:</strong> borrador a revisar por un abogado antes del lanzamiento público.
      </Notice>
      <article className="prose-legal mt-6 [&_a]:underline">{doc.body}</article>
      <nav aria-label="Otros documentos legales" className="mt-10 flex flex-wrap gap-3 border-t border-border pt-6 text-sm">
        {Object.entries(DOCS)
          .filter(([k]) => k !== slug)
          .map(([k, d]) => (
            <Link key={k} href={`/legal/${k}`} className="font-semibold underline">
              {d.title}
            </Link>
          ))}
      </nav>
    </div>
  );
}
