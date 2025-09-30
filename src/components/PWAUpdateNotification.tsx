import React from 'react';
import { Button } from './ui/button';
import { RefreshCw, X } from 'lucide-react';

interface PWAUpdateNotificationProps {
  updateAvailable: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

const PWAUpdateNotification: React.FC<PWAUpdateNotificationProps> = ({
  updateAvailable,
  onUpdate,
  onDismiss,
}) => {
  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-blue-500 text-white rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold">
                Atualização Disponível
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                Uma nova versão do app está disponível. Atualize para ter acesso às últimas funcionalidades.
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-2 text-blue-200 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <Button
            onClick={onUpdate}
            className="flex-1 bg-white text-blue-600 hover:bg-blue-50"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdateNotification;
