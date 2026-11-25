// ═══════════════════════════════════════════════════════
// ⚡ InvenTrack — Sistema de Email Profesional
// 📧 Resend API — inventracx.cloud
// ═══════════════════════════════════════════════════════

import { Resend } from 'resend';

export interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  unit: string;
}

// ─── Modo de envio ───
// Sin RESEND_API_KEY el modo es "log": no se envía ningún correo, solo se
// escribe destinatario, asunto y texto en la consola del servidor.
// EMAIL_MODE=log fuerza ese modo aunque exista una API key (util en demos).
export type EmailMode = 'resend' | 'log';

export function getEmailMode(): EmailMode {
  if ((process.env.EMAIL_MODE ?? '').toLowerCase() === 'log') return 'log';
  return process.env.RESEND_API_KEY ? 'resend' : 'log';
}

export function getAlertRecipient(): string {
  return process.env.ALERT_EMAIL ?? 'admin@inventracx.cloud';
}

function getResendClient(): Resend | null {
  if (getEmailMode() === 'log') return null;
  return new Resend(process.env.RESEND_API_KEY);
}

// ─── Envío genérico ───
async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const resend = getResendClient();
  const from = `${process.env.SENDER_NAME || 'InvenTrack'} <${process.env.SENDER_EMAIL || 'noreply@inventracx.cloud'}>`;

  if (!resend) {
    console.log('[Email] modo log: no se envió ningún correo');
    console.log('[Email] Para:   ' + to);
    console.log('[Email] Asunto: ' + subject);
    console.log(text.split('\n').map(l => '[Email]   ' + l).join('\n'));
    return true;
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[Email] ❌ Error:', error.message);
      return false;
    }

    console.log(`[Email] ✅ Enviado a ${to} — ID: ${data?.id}`);
    return true;
  } catch (err: any) {
    console.error('[Email] ❌ Error:', err.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════
// 🎨 TEMPLATE: CONFIRMACIÓN DE CUENTA (MAMÓN LEVEL 100)
// ═══════════════════════════════════════════════════════

function getConfirmationHTML(name: string, confirmUrl: string): string {
  const year = new Date().getFullYear();
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirma tu cuenta — InvenTrack</title>
  </head>
  <body style="margin:0;padding:0;background-color:#07000f;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    
    <!-- Fondo oscuro con degradado -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#07000f 0%,#0d0520 50%,#07000f 100%);padding:40px 16px;">
      <tr>
        <td align="center">
          
          <!-- Card principal -->
          <table width="520" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,rgba(120,50,255,0.15) 0%,rgba(40,10,120,0.08) 100%);border-radius:24px;border:1px solid rgba(139,92,246,0.2);overflow:hidden;box-shadow:0 0 80px rgba(120,50,255,0.08),0 32px 64px rgba(0,0,0,0.4);">
            
            <!-- Barra superior degradada -->
            <tr>
              <td style="height:4px;background:linear-gradient(90deg,#8b5cf6,#d946ef,#ec4899,#d946ef,#8b5cf6);"></td>
            </tr>
            
            <!-- Logo + Nombre -->
            <tr>
              <td align="center" style="padding:44px 40px 16px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:56px;height:56px;background:linear-gradient(135deg,#8b5cf6,#d946ef);border-radius:16px;text-align:center;vertical-align:middle;font-size:24px;color:white;font-weight:900;box-shadow:0 8px 32px rgba(139,92,246,0.4);">I</td>
                    <td style="padding-left:16px;">
                      <p style="color:#ffffff;font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px;">InvenTrack</p>
                      <p style="color:rgba(139,92,246,0.6);font-size:11px;font-weight:600;margin:2px 0 0;letter-spacing:1px;text-transform:uppercase;">inventracx.cloud</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Separador -->
            <tr>
              <td style="padding:0 40px;">
                <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent);"></div>
              </td>
            </tr>

            <!-- Ícono de sobre -->
            <tr>
              <td align="center" style="padding:32px 40px 0;">
                <div style="width:72px;height:72px;background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(217,70,239,0.15));border:2px solid rgba(139,92,246,0.2);border-radius:20px;line-height:72px;font-size:34px;text-align:center;">✉️</div>
              </td>
            </tr>

            <!-- Título -->
            <tr>
              <td align="center" style="padding:20px 40px 0;">
                <h1 style="color:#c084fc;font-size:26px;font-weight:800;margin:0;letter-spacing:-0.3px;">¡Bienvenido a InvenTrack!</h1>
              </td>
            </tr>

            <!-- Saludo personalizado -->
            <tr>
              <td style="padding:16px 40px 0;">
                <p style="color:#e2e2f0;font-size:16px;line-height:1.7;margin:0;text-align:center;">
                  Hola <strong style="color:#d946ef;">${name}</strong>, tu cuenta fue creada exitosamente en nuestro sistema de gestión de inventario.
                </p>
              </td>
            </tr>

            <!-- Mensaje de acción -->
            <tr>
              <td style="padding:12px 40px 0;">
                <p style="color:rgba(200,180,255,0.5);font-size:14px;line-height:1.6;margin:0;text-align:center;">
                  Para activar tu acceso, confirma que este correo electrónico te pertenece haciendo clic en el siguiente botón:
                </p>
              </td>
            </tr>

            <!-- BOTÓN PRINCIPAL -->
            <tr>
              <td align="center" style="padding:28px 40px 0;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:linear-gradient(135deg,#8b5cf6,#d946ef);border-radius:14px;box-shadow:0 8px 32px rgba(139,92,246,0.35),0 2px 8px rgba(217,70,239,0.2);">
                      <a href="${confirmUrl}" style="display:inline-block;padding:18px 48px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:0.3px;">
                        ✅ Confirmar mi cuenta
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Timer -->
            <tr>
              <td align="center" style="padding:20px 40px 0;">
                <table cellpadding="0" cellspacing="0" style="background:rgba(217,70,239,0.08);border:1px solid rgba(217,70,239,0.15);border-radius:10px;">
                  <tr>
                    <td style="padding:10px 20px;">
                      <p style="color:#d946ef;font-size:12px;font-weight:600;margin:0;">⏰ Este enlace expira en 24 horas</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Separador -->
            <tr>
              <td style="padding:28px 40px 0;">
                <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent);"></div>
              </td>
            </tr>

            <!-- URL alternativa -->
            <tr>
              <td style="padding:20px 40px 0;">
                <p style="color:rgba(200,180,255,0.3);font-size:11px;margin:0 0 8px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <div style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.1);border-radius:10px;padding:12px 16px;">
                  <p style="color:#8b5cf6;font-size:10px;word-break:break-all;margin:0;font-family:monospace;">${confirmUrl}</p>
                </div>
              </td>
            </tr>

            <!-- Nota de seguridad -->
            <tr>
              <td style="padding:20px 40px 0;">
                <table cellpadding="0" cellspacing="0" style="background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.1);border-radius:10px;width:100%;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <p style="color:rgba(251,191,36,0.6);font-size:11px;margin:0;line-height:1.5;">
                        🔒 <strong>Nota de seguridad:</strong> Si no creaste esta cuenta, puedes ignorar este correo de forma segura. Nadie podrá acceder sin tu confirmación.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:28px 40px 0;">
                <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.2),transparent);"></div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 40px 32px;">
                <p style="color:rgba(100,80,160,0.5);font-size:11px;margin:0 0 4px;font-weight:600;">InvenTrack — Sistema de Gestión de Inventario</p>
                <p style="color:rgba(100,80,160,0.3);font-size:10px;margin:0 0 4px;">inventracx.cloud</p>
                <p style="color:rgba(100,80,160,0.2);font-size:10px;margin:0;">© ${year} Todos los derechos reservados. Este es un correo automático.</p>
              </td>
            </tr>

            <!-- Barra inferior degradada -->
            <tr>
              <td style="height:4px;background:linear-gradient(90deg,#8b5cf6,#d946ef,#ec4899,#d946ef,#8b5cf6);"></td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

// ═══════════════════════════════════════════════════════
// 🎨 TEMPLATE: CUENTA CONFIRMADA / APROBADA
// ═══════════════════════════════════════════════════════

function getAccountApprovedHTML(name: string, loginUrl: string): string {
  const year = new Date().getFullYear();
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background-color:#07000f;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#07000f 0%,#0d0520 50%,#07000f 100%);padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="520" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,rgba(16,185,129,0.12) 0%,rgba(40,10,120,0.08) 100%);border-radius:24px;border:1px solid rgba(16,185,129,0.2);overflow:hidden;box-shadow:0 0 80px rgba(16,185,129,0.06),0 32px 64px rgba(0,0,0,0.4);">
            
            <!-- Barra verde -->
            <tr>
              <td style="height:4px;background:linear-gradient(90deg,#10b981,#34d399,#6ee7b7,#34d399,#10b981);"></td>
            </tr>

            <!-- Logo -->
            <tr>
              <td align="center" style="padding:44px 40px 16px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:56px;height:56px;background:linear-gradient(135deg,#10b981,#34d399);border-radius:16px;text-align:center;vertical-align:middle;font-size:24px;color:white;font-weight:900;box-shadow:0 8px 32px rgba(16,185,129,0.4);">✓</td>
                    <td style="padding-left:16px;">
                      <p style="color:#ffffff;font-size:24px;font-weight:800;margin:0;">InvenTrack</p>
                      <p style="color:rgba(16,185,129,0.6);font-size:11px;font-weight:600;margin:2px 0 0;letter-spacing:1px;text-transform:uppercase;">inventracx.cloud</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Separador -->
            <tr>
              <td style="padding:0 40px;">
                <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(16,185,129,0.3),transparent);"></div>
              </td>
            </tr>

            <!-- Ícono -->
            <tr>
              <td align="center" style="padding:32px 40px 0;">
                <div style="width:72px;height:72px;background:linear-gradient(135deg,rgba(16,185,129,0.15),rgba(52,211,153,0.15));border:2px solid rgba(16,185,129,0.2);border-radius:20px;line-height:72px;font-size:34px;text-align:center;">🎉</div>
              </td>
            </tr>

            <!-- Título -->
            <tr>
              <td align="center" style="padding:20px 40px 0;">
                <h1 style="color:#34d399;font-size:26px;font-weight:800;margin:0;">¡Cuenta Aprobada!</h1>
              </td>
            </tr>

            <!-- Mensaje -->
            <tr>
              <td style="padding:16px 40px 0;">
                <p style="color:#e2e2f0;font-size:16px;line-height:1.7;margin:0;text-align:center;">
                  Hola <strong style="color:#34d399;">${name}</strong>, tu cuenta ha sido verificada y aprobada exitosamente.
                </p>
                <p style="color:rgba(200,180,255,0.5);font-size:14px;text-align:center;margin:12px 0 0;">
                  Ya tienes acceso completo al sistema de gestión de inventario.
                </p>
              </td>
            </tr>

            <!-- Qué puedes hacer -->
            <tr>
              <td style="padding:24px 40px 0;">
                <table cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.12);border-radius:12px;width:100%;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="color:#6ee7b7;font-size:12px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;">🚀 Ahora puedes:</p>
                      <p style="color:rgba(200,180,255,0.5);font-size:13px;margin:0 0 6px;">📦 Gestionar productos e inventario</p>
                      <p style="color:rgba(200,180,255,0.5);font-size:13px;margin:0 0 6px;">📊 Ver dashboard con métricas en tiempo real</p>
                      <p style="color:rgba(200,180,255,0.5);font-size:13px;margin:0 0 6px;">📋 Registrar movimientos de stock</p>
                      <p style="color:rgba(200,180,255,0.5);font-size:13px;margin:0;">📁 Importar/exportar datos en XML</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Botón -->
            <tr>
              <td align="center" style="padding:28px 40px 0;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:linear-gradient(135deg,#10b981,#34d399);border-radius:14px;box-shadow:0 8px 32px rgba(16,185,129,0.35);">
                      <a href="${loginUrl}" style="display:inline-block;padding:18px 48px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:0.3px;">
                        🚀 Iniciar Sesión
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:28px 40px 0;">
                <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(16,185,129,0.2),transparent);"></div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 40px 32px;">
                <p style="color:rgba(100,80,160,0.5);font-size:11px;margin:0 0 4px;font-weight:600;">InvenTrack — Sistema de Gestión de Inventario</p>
                <p style="color:rgba(100,80,160,0.3);font-size:10px;margin:0 0 4px;">inventracx.cloud</p>
                <p style="color:rgba(100,80,160,0.2);font-size:10px;margin:0;">© ${year} Todos los derechos reservados.</p>
              </td>
            </tr>

            <tr>
              <td style="height:4px;background:linear-gradient(90deg,#10b981,#34d399,#6ee7b7,#34d399,#10b981);"></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

// ═══════════════════════════════════════════════════════
// ─── FUNCIONES PÚBLICAS ──────────────────────────────
// ═══════════════════════════════════════════════════════

export async function sendConfirmationEmail(to: string, name: string, token: string): Promise<boolean> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const confirmUrl = `${appUrl}/api/auth/confirm?token=${token}`;

  const text = `Hola ${name},\n\nBienvenido a InvenTrack. Por favor confirma tu cuenta haciendo clic en el siguiente enlace:\n${confirmUrl}\n\nEste enlace expira en 24 horas.`;

  return sendEmail(to, '✉️ Confirma tu cuenta en InvenTrack', getConfirmationHTML(name, confirmUrl), text);
}

export async function sendApprovalEmail(to: string, name: string): Promise<boolean> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const loginUrl = `${appUrl}/login`;

  const text = `Hola ${name},\n\n¡Felicidades! Tu cuenta en InvenTrack ha sido aprobada. Ya puedes iniciar sesión en: ${loginUrl}`;

  return sendEmail(to, '✅ Tu cuenta en InvenTrack fue aprobada', getAccountApprovedHTML(name, loginUrl), text);
}

// ═══════════════════════════════════════════════════════
// ─── ALERTA DE STOCK BAJO ────────────────────────────
// ═══════════════════════════════════════════════════════

const escHtml = (v: unknown) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Cantidad sugerida para volver a 2 veces el mínimo. */
export function suggestedOrder(p: Pick<LowStockProduct, 'stock' | 'minStock'>): number {
  return Math.max(p.minStock * 2 - p.stock, 1);
}

/** Construye asunto, HTML y texto del correo de stock bajo (se usa para enviar y para la vista previa). */
export function renderLowStockAlertEmail(products: LowStockProduct[]): { subject: string; html: string; text: string } {
  const year = new Date().getFullYear();
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const out = products.filter(p => p.stock === 0).length;
  const td = 'padding:10px 14px;border-top:1px solid #eaecf0;font-size:13px;';

  const rows = products.map(p => `
        <tr>
          <td style="${td}color:#101828;">${escHtml(p.name)}<div style="font-family:Consolas,monospace;font-size:11px;color:#8a94a6;margin-top:2px;">${escHtml(p.sku)}</div></td>
          <td style="${td}text-align:right;font-weight:600;color:${p.stock === 0 ? '#c0331f' : '#a65300'};white-space:nowrap;">${p.stock} ${escHtml(p.unit)}</td>
          <td style="${td}text-align:right;color:#475467;white-space:nowrap;">${p.minStock}</td>
          <td style="${td}text-align:right;color:#101828;white-space:nowrap;">${suggestedOrder(p)}</td>
        </tr>`).join('');

  const th = 'padding:9px 14px;font-size:11px;font-weight:500;color:#8a94a6;background:#f8f9fb;';
  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Alerta de stock bajo</title></head>
<body style="margin:0;padding:0;background:#f5f6f8;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#101828;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e4e7ec;border-radius:12px;">
        <tr><td style="padding:24px 28px 0;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:26px;height:26px;background:#2f54d8;border-radius:7px;color:#ffffff;font-size:14px;font-weight:700;text-align:center;line-height:26px;">I</td>
            <td style="padding-left:10px;font-size:15px;font-weight:600;color:#101828;">InvenTrack</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:24px 28px 6px;">
          <div style="display:inline-block;padding:3px 10px;border-radius:99px;background:#fdf2e3;color:#a65300;font-size:12px;font-weight:500;">Alerta de inventario</div>
          <h1 style="margin:12px 0 6px;font-size:20px;line-height:1.3;font-weight:600;letter-spacing:-0.01em;">${products.length} ${products.length === 1 ? 'producto requiere' : 'productos requieren'} reabastecimiento</h1>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#475467;">Estos artículos están en o por debajo de su existencia mínima${out ? `; ${out} ${out === 1 ? 'está agotado' : 'están agotados'}` : ''}. La cantidad sugerida lleva cada uno al doble de su mínimo.</p>
        </td></tr>
        <tr><td style="padding:16px 28px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eaecf0;border-radius:8px;border-collapse:separate;">
            <tr>
              <th style="${th}text-align:left;border-top-left-radius:8px;">Producto</th>
              <th style="${th}text-align:right;">Existencia</th>
              <th style="${th}text-align:right;">Mínimo</th>
              <th style="${th}text-align:right;border-top-right-radius:8px;">Sugerido</th>
            </tr>${rows}
          </table>
        </td></tr>
        <tr><td style="padding:20px 28px 0;">
          <a href="${appUrl}/alertas" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#2f54d8;color:#ffffff;font-size:13px;font-weight:500;text-decoration:none;">Revisar en InvenTrack</a>
        </td></tr>
        <tr><td style="padding:24px 28px 24px;">
          <p style="margin:0;padding-top:16px;border-top:1px solid #eaecf0;font-size:12px;color:#8a94a6;">Mensaje automático de InvenTrack, ${year}. Se envía cuando un movimiento deja un producto en o bajo su mínimo.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const subject = `Stock bajo: ${products.length} ${products.length === 1 ? 'producto requiere' : 'productos requieren'} reabastecimiento`;
  const text = `Alerta de stock bajo: ${products.length} productos en o bajo su mínimo.\n\n` +
    products.map(p => `- ${p.name} (${p.sku}): ${p.stock} ${p.unit}, mínimo ${p.minStock}, sugerido ${suggestedOrder(p)}`).join('\n') +
    `\n\nRevisar: ${appUrl}/alertas`;

  return { subject, html, text };
}

export async function sendLowStockAlert(products: LowStockProduct[]): Promise<boolean> {
  const { subject, html, text } = renderLowStockAlertEmail(products);
  return sendEmail(getAlertRecipient(), subject, html, text);
}
