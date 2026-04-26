// ═══════════════════════════════════════════════════════
// ⚡ InvenTrack — Sistema de Email Profesional
// 📧 SMTP Hostinger — inventracx.cloud
// ═══════════════════════════════════════════════════════

import nodemailer from 'nodemailer';

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  unit: string;
}

// ─── Configuración SMTP ───
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[Email] ⚠️ SMTP no configurado — emails simulados');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // ═══ FORZAR IPv4 (fix para Railway) ═══
    dnsOptions: {
      family: 4,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

// ─── Envío genérico ───
async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('[Email] ─────────────────────────────────');
    console.log('[Email] 📧 (SIMULADO) Para:', to);
    console.log('[Email] 📧 Asunto:', subject);
    console.log('[Email] ─────────────────────────────────');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SENDER_NAME || 'InvenTrack'}" <${process.env.SENDER_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'InvenTrack Mailer',
      }
    });
    console.log(`[Email] ✅ Enviado a ${to} — ID: ${info.messageId}`);
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

            <!-- Ícono de sobre animado -->
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

export async function sendLowStockAlert(products: LowStockProduct[]): Promise<boolean> {
  const toEmail = process.env.ALERT_EMAIL ?? 'admin@inventracx.cloud';
  const year = new Date().getFullYear();

  const rows = products
    .map(p => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.03);color:#e2e2f0;font-size:13px;">${p.name}</td>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.03);color:#8b8ba3;font-family:monospace;font-size:12px;">${p.sku}</td>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.03);color:#ef4444;font-weight:700;font-size:13px;">${p.stock} ${p.unit}</td>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.03);color:#8b8ba3;font-size:13px;">${p.minStock} ${p.unit}</td>
      </tr>`)
    .join('');

  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background-color:#07000f;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#07000f,#0d0520,#07000f);padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="580" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,rgba(239,68,68,0.1),rgba(40,10,120,0.08));border-radius:24px;border:1px solid rgba(239,68,68,0.2);overflow:hidden;box-shadow:0 0 80px rgba(239,68,68,0.06),0 32px 64px rgba(0,0,0,0.4);">
            
            <tr><td style="height:4px;background:linear-gradient(90deg,#ef4444,#f97316,#eab308,#f97316,#ef4444);"></td></tr>

            <tr>
              <td align="center" style="padding:36px 40px 16px;">
                <div style="width:56px;height:56px;background:linear-gradient(135deg,#ef4444,#f97316);border-radius:16px;line-height:56px;font-size:24px;text-align:center;box-shadow:0 8px 32px rgba(239,68,68,0.4);">⚠️</div>
                <h1 style="color:#fca5a5;font-size:22px;font-weight:800;margin:16px 0 4px;">Alerta de Stock Bajo</h1>
                <p style="color:rgba(200,180,255,0.4);font-size:13px;margin:0;">${products.length} producto(s) requieren atención inmediata</p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:12px;border:1px solid rgba(255,255,255,0.04);overflow:hidden;">
                  <tr style="background:rgba(139,92,246,0.08);">
                    <th style="padding:12px 16px;text-align:left;color:#c084fc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Producto</th>
                    <th style="padding:12px 16px;text-align:left;color:#c084fc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">SKU</th>
                    <th style="padding:12px 16px;text-align:left;color:#c084fc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Stock</th>
                    <th style="padding:12px 16px;text-align:left;color:#c084fc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Mínimo</th>
                  </tr>
                  ${rows}
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:24px 40px 32px;">
                <p style="color:rgba(100,80,160,0.4);font-size:10px;margin:0;">InvenTrack — inventracx.cloud — © ${year}</p>
              </td>
            </tr>

            <tr><td style="height:4px;background:linear-gradient(90deg,#ef4444,#f97316,#eab308,#f97316,#ef4444);"></td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;

  const subject = `⚠️ ${products.length} producto(s) con stock bajo — InvenTrack`;

  const text = `Alerta de Stock Bajo: ${products.length} productos requieren atención.\n\n` +
    products.map(p => `- ${p.name} (${p.sku}): ${p.stock} ${p.unit} (Mínimo: ${p.minStock})`).join('\n');

  return sendEmail(toEmail, subject, html, text);
}