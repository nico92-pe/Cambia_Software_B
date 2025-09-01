import React from 'react';
import { Building, Building2, MapPin, Phone, User, Truck } from 'lucide-react';
import { Client } from '../../lib/types';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  salespersonName?: string;
}

export function ClientDetailModal({
  client,
  isOpen,
  onClose,
  salespersonName,
}: ClientDetailModalProps) {
  if (!client) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Cliente"
      size="xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {client.commercialName}
            </h2>
            <p className="text-gray-600 text-lg">{client.businessName}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">RUC</p>
                <p className="font-medium text-lg">{client.ruc}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Vendedor Asignado</p>
                <p className="font-medium">{salespersonName || 'No disponible'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información de Contacto
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Contacto Principal</p>
                  <p className="font-medium">{client.contactName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono Principal</p>
                  <p className="font-medium">{client.contactPhone}</p>
                </div>
              </div>

              {client.contactName2 && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Contacto Secundario</p>
                    <p className="font-medium">{client.contactName2}</p>
                  </div>
                </div>
              )}

              {client.contactPhone2 && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono Secundario</p>
                    <p className="font-medium">{client.contactPhone2}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location Information Section */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ubicación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium">
                    {client.address}, {client.district}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Provincia</p>
                  <Badge variant={client.province === 'Lima' ? 'primary' : 'secondary'}>
                    {client.province}
                  </Badge>
                </div>
              </div>

              {client.reference && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Referencia</p>
                  <p className="font-medium">{client.reference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Transport Information - Only show if transport data exists */}
          {client.transport && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Información de Transporte
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transporte</p>
                  <p className="font-medium">{client.transport}</p>
                </div>
                {client.transportAddress && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección de Transporte</p>
                    <p className="font-medium">
                      {client.transportAddress}
                      {client.transportDistrict && `, ${client.transportDistrict}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Creado:</span>{' '}
                {formatDate(new Date(client.createdAt))}
              </div>
              <div>
                <span className="font-medium">Actualizado:</span>{' '}
                {formatDate(new Date(client.updatedAt))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}