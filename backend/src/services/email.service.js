const nodemailer = require('nodemailer');

// Configurar transporter
// Em produção, use variáveis de ambiente para configurar o SMTP
const createTransporter = () => {
  // Se tiver configuração de SMTP, usa ela
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Fallback: usa ethereal para testes (emails não são enviados de verdade)
  // Em produção, configure as variáveis SMTP_*
  console.log('[EMAIL] Usando Ethereal para testes. Configure SMTP_* para envio real.');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'test@ethereal.email',
      pass: 'test'
    }
  });
};

/**
 * Enviar email de recuperação de senha
 */
const sendPasswordResetEmail = async (email, name, resetToken, resetUrl) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"App Interfone" <noreply@interfoneapp.com>',
    to: email,
    subject: 'Recuperação de Senha - App Interfone',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">App Interfone</h1>
                    <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Sistema de Interfone Virtual</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 22px;">Olá, ${name}!</h2>
                    <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                      Recebemos uma solicitação para redefinir a senha da sua conta no App Interfone.
                    </p>
                    <p style="margin: 0 0 30px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                      Clique no botão abaixo para criar uma nova senha:
                    </p>
                    
                    <!-- Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                            Redefinir Senha
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                      Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanecerá a mesma.
                    </p>
                    
                    <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                      Este link expira em <strong>1 hora</strong>.
                    </p>
                    
                    <!-- Alternative Link -->
                    <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
                      <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px;">
                        Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
                      </p>
                      <p style="margin: 0; color: #3b82f6; font-size: 13px; word-break: break-all;">
                        ${resetUrl}
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                      © ${new Date().getFullYear()} App Interfone. Todos os direitos reservados.
                    </p>
                    <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 12px;">
                      Este é um email automático. Por favor, não responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
      Olá, ${name}!
      
      Recebemos uma solicitação para redefinir a senha da sua conta no App Interfone.
      
      Acesse o link abaixo para criar uma nova senha:
      ${resetUrl}
      
      Este link expira em 1 hora.
      
      Se você não solicitou a redefinição de senha, ignore este email.
      
      App Interfone - Sistema de Interfone Virtual
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Email de recuperação enviado:', info.messageId);
    
    // Se for Ethereal, mostra o link para visualizar o email
    if (info.messageId && process.env.SMTP_HOST !== 'smtp.ethereal.email') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('[EMAIL] Preview URL:', previewUrl);
      }
    }
    
    return true;
  } catch (error) {
    console.error('[EMAIL] Erro ao enviar email:', error);
    // Não lançar erro para não revelar se o email existe ou não
    return false;
  }
};

/**
 * Enviar email de boas-vindas
 */
const sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"App Interfone" <noreply@interfoneapp.com>',
    to: email,
    subject: 'Bem-vindo ao App Interfone!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bem-vindo ao App Interfone</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">App Interfone</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #1e293b;">Bem-vindo, ${name}!</h2>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                      Sua conta foi criada com sucesso. Agora você pode acessar o App Interfone e aproveitar todos os recursos.
                    </p>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                      Sua conta está aguardando aprovação do administrador. Você será notificado quando sua conta for ativada.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                      © ${new Date().getFullYear()} App Interfone. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('[EMAIL] Erro ao enviar email de boas-vindas:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail
};
