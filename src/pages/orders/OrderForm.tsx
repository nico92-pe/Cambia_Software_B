lue={installmentCount}
                        onChange={(e) => setInstallmentCount(parseInt(e.target.value))}
                        className="select w-full"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>{num} cuota{num > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {installments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Detalle de Cuotas</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Cuota
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Monto
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Fecha
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Días
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {installments.map((installment, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                                  {installment.installmentNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                                  {formatCurrency(installment.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <input
                                    type="date"
                                    value={installment.dueDate}
                                    onChange={(e) => updateInstallmentDate(index, e.target.value)}
                                    className="w-44 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary focus:border-transparent"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={installment.daysDue || ''}
                                    onChange={(e) => updateInstallmentDays(index, parseInt(e.target.value) || 0)}
                                    className="w-28 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary focus:border-transparent"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={4} className="px-6 py-4">
                                <div className="flex justify-end">
                                  <div className="w-64">
                                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                                      <span>Total Cuotas:</span>
                                      <span>{formatCurrency(installments.reduce((sum, inst) => sum + inst.amount, 0))}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card animate-in fade-in duration-500" style={{ animationDelay: '400ms' }}>
          <div className="card-header">
            <h2 className="card-title text-xl">Observaciones</h2>
            <p className="card-description">
              Notas adicionales del pedido
            </p>
          </div>
          <div className="card-content">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="input w-full resize-none"
              placeholder="Observaciones adicionales del pedido..."
            />
          </div>
        </div>

        {/* Order Status - Only for Asesor de Ventas */}
        {isCurrentUserSalesperson && (
          <div className="card animate-in fade-in duration-500" style={{ animationDelay: '450ms' }}>
            <div className="card-header">
              <h2 className="card-title text-xl">Estado del Pedido</h2>
              <p className="card-description">
                Selecciona el estado del pedido
              </p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estado
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="orderStatus"
                        value={OrderStatus.BORRADOR}
                        checked={currentStatus === OrderStatus.BORRADOR}
                        onChange={(e) => setCurrentStatus(e.target.value as OrderStatus)}
                        className="mr-2"
                      />
                      Borrador
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="orderStatus"
                        value={OrderStatus.TOMADO}
                        checked={currentStatus === OrderStatus.TOMADO}
                        onChange={(e) => setCurrentStatus(e.target.value as OrderStatus)}
                        className="mr-2"
                      />
                      Tomado
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 animate-in fade-in duration-500" style={{ animationDelay: '500ms' }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/orders')}
          >
            Cancelar
          </Button>
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              loading={isLoading}
              disabled={!selectedClient || items.length === 0}
            >
              Guardar Borrador
            </Button>
          )}
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            loading={isLoading}
            disabled={!selectedClient || items.length === 0}
          >
            <Save size={18} className="mr-2" />
            {isEditing ? 'Actualizar Pedido' : 'Confirmar Pedido'}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
            <AlertTriangle className="text-destructive flex-shrink-0" size={20} />
            <p className="text-sm">
              ¿Estás seguro de que deseas eliminar este producto del pedido?
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={deleteItem}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stock Warning Modal */}
      <Modal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        title="Sin Stock Disponible"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-warning/10 rounded-lg">
            <AlertTriangle className="text-warning flex-shrink-0" size={20} />
            <p className="text-sm">
              El producto <strong>"{stockModalProduct}"</strong> no cuenta con stock disponible.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => setShowStockModal(false)}
            >
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}