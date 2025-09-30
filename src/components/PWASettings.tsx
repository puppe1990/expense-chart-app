import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Download, 
  RefreshCw, 
  Trash2, 
  Smartphone, 
  Monitor, 
  Wifi, 
  WifiOff,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const PWASettings: React.FC = () => {
  const { 
    isOnline, 
    isInstalled, 
    canInstall, 
    updateAvailable, 
    updateApp, 
    clearCache 
  } = usePWA();

  const handleInstall = async () => {
    // This will be handled by the PWAInstallPrompt component
    // This is just for display purposes
  };

  const handleUpdate = () => {
    updateApp();
  };

  const handleClearCache = async () => {
    if (window.confirm('Tem certeza que deseja limpar o cache? Isso pode afetar a performance offline.')) {
      await clearCache();
      window.location.reload();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="w-5 h-5" />
          <span>Configurações PWA</span>
        </CardTitle>
        <CardDescription>
          Gerencie as configurações do Progressive Web App
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {isInstalled ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm">
              {isInstalled ? 'Instalado' : 'Não Instalado'}
            </span>
          </div>
        </div>

        {/* Installation Status */}
        {isInstalled && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              App Instalado
            </Badge>
            <span className="text-xs text-gray-500">
              O app está instalado e funcionando em modo standalone
            </span>
          </div>
        )}

        {/* Update Available */}
        {updateAvailable && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Atualização Disponível
                </span>
              </div>
              <Button
                onClick={handleUpdate}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Atualizar
              </Button>
            </div>
          </div>
        )}

        {/* Installation Instructions */}
        {!isInstalled && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Como Instalar:</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="font-medium">•</span>
                <span>
                  <strong>Chrome/Edge:</strong> Clique no ícone de instalação na barra de endereços
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">•</span>
                <span>
                  <strong>Firefox:</strong> Menu → Instalar
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">•</span>
                <span>
                  <strong>Safari (iOS):</strong> Compartilhar → Adicionar à Tela de Início
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {!isInstalled && canInstall && (
            <Button
              onClick={handleInstall}
              size="sm"
              className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar App
            </Button>
          )}
          
          <Button
            onClick={handleClearCache}
            variant="outline"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Cache
          </Button>
        </div>

        {/* PWA Features Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center space-x-2">
            <Monitor className="w-3 h-3" />
            <span>Funciona em desktop e mobile</span>
          </div>
          <div className="flex items-center space-x-2">
            <WifiOff className="w-3 h-3" />
            <span>Funciona offline com cache inteligente</span>
          </div>
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-3 h-3" />
            <span>Atualizações automáticas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWASettings;
