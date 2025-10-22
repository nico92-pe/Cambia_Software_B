import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface ProductCatalogDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (withStock: boolean) => void;
  isDownloading: boolean;
}

export function ProductCatalogDownloadModal({
  isOpen,
  onClose,
  onDownload,
  isDownloading,
}: ProductCatalogDownloadModalProps) {
  const [selectedOption, setSelectedOption] = useState<'with-stock' | 'without-stock' | null>(null);

  const handleDownload = () => {
    if (selectedOption === null) return;
    onDownload(selectedOption === 'with-stock');
  };

  const handleClose = () => {
    setSelectedOption(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Descargar Catálogo de Productos</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDownloading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-muted-foreground mb-6">
            Selecciona el tipo de catálogo que deseas descargar:
          </p>

          <div className="space-y-3">
            <label
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedOption === 'with-stock'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="stock-option"
                value="with-stock"
                checked={selectedOption === 'with-stock'}
                onChange={() => setSelectedOption('with-stock')}
                className="w-4 h-4 text-primary focus:ring-primary"
                disabled={isDownloading}
              />
              <div className="ml-3">
                <div className="font-medium">Con Stock</div>
                <div className="text-sm text-muted-foreground">
                  Incluye la columna de stock en el catálogo
                </div>
              </div>
            </label>

            <label
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedOption === 'without-stock'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="stock-option"
                value="without-stock"
                checked={selectedOption === 'without-stock'}
                onChange={() => setSelectedOption('without-stock')}
                className="w-4 h-4 text-primary focus:ring-primary"
                disabled={isDownloading}
              />
              <div className="ml-3">
                <div className="font-medium">Sin Stock</div>
                <div className="text-sm text-muted-foreground">
                  No incluye la columna de stock
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDownloading}
          >
            Cancelar
          </Button>
          <Button
            icon={<Download size={18} />}
            onClick={handleDownload}
            disabled={selectedOption === null || isDownloading}
            loading={isDownloading}
          >
            Descargar PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
