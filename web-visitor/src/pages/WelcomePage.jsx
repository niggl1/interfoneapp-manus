import { Building2, QrCode } from 'lucide-react';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Building2 className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          App Interfone
        </h1>
        
        <p className="text-slate-400 mb-12">
          Sistema de interfone inteligente para condomínios
        </p>

        {/* QR Code Instruction */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-blue-400" />
          </div>
          
          <h2 className="text-white text-lg font-semibold mb-2">
            Escaneie o QR Code
          </h2>
          
          <p className="text-slate-400 text-sm">
            Para ligar para um morador, escaneie o QR Code localizado na entrada do condomínio ou próximo ao apartamento.
          </p>
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-sm mt-12">
          © {new Date().getFullYear()} App Interfone. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
