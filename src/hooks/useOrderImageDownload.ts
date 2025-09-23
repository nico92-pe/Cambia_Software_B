import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Order } from '../lib/types';

export function useOrderImageDownload() {
  const downloadOrderAsImage = useCallback(async (order: Order) => {
    try {
      // Ensure the order has all necessary data loaded
      console.log('Order data for download:', {
        id: order.id,
        itemsCount: order.items?.length || 0,
        installmentsCount: order.installmentDetails?.length || 0,
        paymentType: order.paymentType
      });
      
      // Get the order template element
      const element = document.getElementById(`order-template-${order.id}`);
      
      if (!element) {
        throw new Error('Order template not found');
      }

      // Wait a bit for the DOM to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Configure html2canvas options for better quality
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: Math.max(600, element.scrollHeight),
        scrollX: 0,
        scrollY: 0,
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure all styles are applied in the cloned document
          const clonedElement = clonedDoc.getElementById(`order-template-${order.id}`);
          if (clonedElement) {
            clonedElement.style.display = 'block';
            clonedElement.style.visibility = 'visible';
          }
        }
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `pedido-${order.client?.commercialName || 'cliente'}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Error downloading order as image:', error);
      throw new Error('Error al descargar la imagen del pedido');
    }
  }, []);

  const shareOrderAsImage = useCallback(async (order: Order) => {
    try {
      console.log('Order data for sharing:', {
        id: order.id,
        itemsCount: order.items?.length || 0,
        installmentsCount: order.installmentDetails?.length || 0,
        paymentType: order.paymentType
      });
      
      const element = document.getElementById(`order-template-${order.id}`);
      
      if (!element) {
        throw new Error('Order template not found');
      }

      // Wait a bit for the DOM to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: Math.max(600, element.scrollHeight),
        scrollX: 0,
        scrollY: 0,
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure all styles are applied in the cloned document
          const clonedElement = clonedDoc.getElementById(`order-template-${order.id}`);
          if (clonedElement) {
            clonedElement.style.display = 'block';
            clonedElement.style.visibility = 'visible';
          }
        }
      });

      // Convert canvas to blob
      return new Promise<void>((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }

          // Check if Web Share API is available
          if (navigator.share && navigator.canShare) {
            const file = new File([blob], `pedido-${order.client?.commercialName || 'cliente'}.png`, {
              type: 'image/png',
            });

            const shareData = {
              title: `Pedido - ${order.client?.commercialName || 'Cliente'}`,
              text: `Pedido generado el ${new Date().toLocaleDateString('es-PE')}`,
              files: [file],
            };

            if (navigator.canShare(shareData)) {
              try {
                await navigator.share(shareData);
                resolve();
              } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                  reject(error);
                } else {
                  resolve(); // User cancelled sharing
                }
              }
            } else {
              // Fallback to download
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `pedido-${order.client?.commercialName || 'cliente'}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              resolve();
            }
          } else {
            // Fallback to download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pedido-${order.client?.commercialName || 'cliente'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            resolve();
          }
        }, 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Error sharing order as image:', error);
      throw new Error('Error al compartir la imagen del pedido');
    }
  }, []);

  return {
    downloadOrderAsImage,
    shareOrderAsImage,
  };
}