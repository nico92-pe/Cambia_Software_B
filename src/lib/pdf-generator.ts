import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product } from './types';

interface ProductWithCategory extends Product {
  categoryName?: string;
}

export async function generateProductCatalogPDF(
  products: ProductWithCategory[],
  withStock: boolean
) {
  const doc = new jsPDF();

  // Add logo (top right)
  const logoSvg = `<svg viewBox="0 0 322.72 113.36" xmlns="http://www.w3.org/2000/svg">
    <g>
      <path fill="#5D7F98" d="M96.97,73.43c-3.98-2.41-9.24-1.66-11.76,2.15c-0.25,0.38-0.44,0.58-0.62,0.99c0,0-0.19,0.37-0.29,0.62
        c-3.19,7.74-14.9,14.67-26.13,14.67c-17.28,0-31.34-15.79-31.34-35.15c0-19.36,14.06-35.13,31.34-35.13
        c11.04,0,22.19,6.49,26.07,13.85c0.45,1.02,2.21,5.46,7.74,5.63c4.46,0,8.08-3.47,8.08-7.75c0-1.2-0.31-2.33-0.82-3.35l0.02-0.01
        C92.66,17.15,74.64,6.33,58.18,6.33c-26.06,0-47.25,22.58-47.25,50.34c0,27.77,21.2,50.35,47.25,50.35
        c17.31,0,34.35-10.7,41.34-22.98C101.59,80.02,100.48,75.55,96.97,73.43"/>
      <path fill="#00A2E1" d="M94.26,46.97c0.26,0.24,0.56,0.46,0.79,0.73c2.54,2.88,4.55,5.99,5.89,9.40c0.74,1.89,0.86,3.81,0.19,5.73
        c-0.5,1.44-1.45,2.57-3.18,3.13c-1.04,0.34-2.14,0.39-3.24,0.27c-1.30-0.13-2.52-0.48-3.44-1.30c-1.83-1.65-2.25-3.61-1.44-5.70
        c0.43-1.11,1.14-2.15,1.83-3.18c1.67-2.5,2.77-5.12,2.57-8.04c-0.02-0.32-0.05-0.64-0.07-0.97
        C94.19,47.01,94.22,46.99,94.26,46.97"/>
      <path fill="#FFFFFF" d="M97.74,58.21c0.07,0.06,0.15,0.12,0.21,0.19c0.68,0.77,1.21,1.60,1.57,2.50c0.20,0.50,0.23,1.01,0.05,1.53
        c-0.13,0.38-0.39,0.68-0.85,0.83c-0.28,0.09-0.57,0.10-0.86,0.07c-0.35-0.04-0.67-0.13-0.92-0.35c-0.49-0.44-0.60-0.96-0.38-1.52
        c0.12-0.30,0.31-0.57,0.49-0.85c0.44-0.67,0.74-1.37,0.69-2.14c-0.01-0.08-0.01-0.17-0.02-0.26
        C97.72,58.22,97.73,58.22,97.74,58.21"/>
      <path fill="#00A2E1" d="M59.54,74.38c-8.74,0-15.85-7.94-15.85-17.70c0-9.76,7.11-17.70,15.85-17.70c5.49,0,11.31,3.33,13.54,7.74
        l0.35,0.75c0.22,0.48,0.19,1.04-0.10,1.48c-0.28,0.45-0.77,0.72-1.30,0.72H71c-0.54,0-1.04-0.28-1.32-0.75l-0.14-0.24
        c-1.44-2.83-5.54-5.67-9.99-5.67c-6.51,0-11.81,6.13-11.81,13.66c0,7.53,5.30,13.66,11.81,13.66c4.37,0,8.55-2.83,10.05-5.57
        c0.01-0.02,0.02-0.03,0.03-0.05l0.14-0.24c0.28-0.47,0.78-0.75,1.32-0.75h1.09c0.54,0,1.05,0.28,1.32,0.75
        c0.28,0.47,0.29,1.04,0.04,1.52l-0.38,0.71C70.96,70.55,65.59,74.38,59.54,74.38"/>
      <path fill="#00A2E1" d="M142.07,74.38h-1.05c-0.66,0-1.25-0.43-1.46-1.05l-0.09-0.29l-11.89-27.02l-11.98,27.31
        c-0.21,0.63-0.80,1.05-1.47,1.05h-1.05c-0.52,0-1-0.26-1.29-0.69c-0.29-0.43-0.34-0.98-0.13-1.46l0.29-0.66l13.79-31.38
        c0.61-1.41,3.07-1.43,3.69,0.01l14.06,32.03c0.20,0.48,0.16,1.03-0.13,1.46C143.07,74.12,142.59,74.38,142.07,74.38"/>
      <path fill="#00A2E1" d="M191.25,74.38h-0.95c-0.85,0-1.54-0.69-1.54-1.54l-0.04-22.53l-10.37,22.88c-0.30,0.69-1.02,1.16-1.83,1.16
        c-0.81,0-1.54-0.47-1.85-1.19l-10.39-22.85v22.53c0,0.85-0.69,1.54-1.54,1.54h-0.95c-0.85,0-1.55-0.69-1.55-1.54V41
        c0-0.94,0.66-1.74,1.60-1.94c0.94-0.20,1.87,0.26,2.26,1.13l12.42,27.31l12.38-27.32c0.38-0.85,1.31-1.31,2.25-1.12
        c0.94,0.20,1.60,1,1.60,1.94l0.05,31.84C192.79,73.69,192.10,74.38,191.25,74.38"/>
      <path fill="#00A2E1" d="M229.30,73.91h-13.35c-1.13,0-2.02-0.89-2.02-2.02l0.02-14.52c-0.02-0.11-0.03-0.22-0.02-0.34l0.02-0.45
        l0.02-15.06c0-1.13,0.89-2.02,2.02-2.02l11.35-0.05c5.84,0,10.58,4.32,10.58,9.62c0,2.65-1.22,5.15-3.26,6.94
        c3.12,1.71,5.16,4.83,5.16,8.27C239.83,69.59,235.11,73.91,229.30,73.91 M218,58.70l0.02,11.21l11.28-0.04
        c3.58,0,6.49-2.51,6.49-5.58c0-3.08-2.91-5.58-6.49-5.58H218z M217.97,43.49l0.02,11.21l9.36-0.04c3.61,0,6.54-2.51,6.54-5.58
        c0-3.08-2.93-5.59-6.53-5.59H217.97z"/>
      <path fill="#00A2E1" d="M261.13,74.38h-0.95c-0.85,0-1.55-0.69-1.55-1.54V40.52c0-0.85,0.69-1.54,1.55-1.54h0.95
        c0.85,0,1.54,0.69,1.54,1.54v32.32C262.68,73.69,261.99,74.38,261.13,74.38"/>
      <path fill="#00A2E1" d="M310.25,74.38h-1.04c-0.66,0-1.25-0.43-1.46-1.05l-0.09-0.29l-11.89-27.02l-11.98,27.31
        c-0.21,0.63-0.80,1.05-1.46,1.05h-1.05c-0.52,0-1-0.26-1.29-0.69c-0.28-0.43-0.34-0.98-0.13-1.46l0.29-0.66l13.79-31.38
        c0.61-1.41,3.07-1.43,3.69,0.01l14.06,32.03c0.20,0.48,0.16,1.03-0.13,1.46C311.26,74.12,310.77,74.38,310.25,74.38"/>
    </g>
  </svg>`;

  // Convert SVG to data URL and add as image
  const svgBlob = new Blob([logoSvg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  // Create an image element to load the SVG
  const img = new Image();
  img.src = svgUrl;

  await new Promise((resolve) => {
    img.onload = () => {
      // Add logo to PDF (top right corner)
      // Original viewBox is 322.72 x 113.36, maintain aspect ratio
      const logoWidth = 40;
      const logoHeight = (logoWidth * 113.36) / 322.72;
      doc.addImage(img, 'PNG', 155, 8, logoWidth, logoHeight);
      URL.revokeObjectURL(svgUrl);
      resolve(null);
    };
  });

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Precios Cambia', 105, 35, { align: 'center' });

  // Add current month and year
  const currentDate = new Date();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const monthYear = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(monthYear, 105, 42, { align: 'center' });

  // Add note about discount
  doc.setFontSize(9);
  doc.text(
    'Descuento de 5% adicional sobre el precio Distribuidor para pedidos al contado y superiores a S/ 3,000 incluido IGV.',
    105,
    50,
    { align: 'center', maxWidth: 180 }
  );

  let yPosition = 58;

  // Define category order (exact order from the dropdown)
  const categoryOrder = [
    'Válvulas de Ingreso',
    'Válvulas de Descarga',
    'Pernos y Balancín',
    'Pulsadores',
    'Flappers',
    'Accesorios Completos de Inodoro',
    'Kits de Inodoro',
    'Trampas y Desague',
    'Aireadores',
    'En Liquidación'
  ];

  // Group products by category
  const productsByCategory: { [key: string]: ProductWithCategory[] } = {};
  products.forEach(product => {
    const categoryName = product.categoryName || 'Sin Categoría';
    if (!productsByCategory[categoryName]) {
      productsByCategory[categoryName] = [];
    }
    productsByCategory[categoryName].push(product);
  });

  // Sort categories according to the defined order
  const sortedCategories = categoryOrder
    .filter(cat => productsByCategory[cat])
    .map(cat => [cat, productsByCategory[cat]] as [string, ProductWithCategory[]]);

  // Add any categories not in the predefined order at the end
  Object.entries(productsByCategory).forEach(([categoryName, products]) => {
    if (!categoryOrder.includes(categoryName)) {
      sortedCategories.push([categoryName, products]);
    }
  });

  // Define table headers
  const headers = withStock
    ? ['Producto', 'Código', 'Minorista', 'Mayorista', 'Distribuidor', 'Stock']
    : ['Producto', 'Código', 'Minorista', 'Mayorista', 'Distribuidor'];

  // Generate tables for each category
  sortedCategories.forEach(([categoryName, categoryProducts], index) => {
    // Add category title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(categoryName, 14, yPosition);
    yPosition += 5;

    // Prepare table data
    const tableData = categoryProducts.map(product => {
      const row = [
        product.name,
        product.code,
        `${product.retailPrice.toFixed(2)}`,
        `${product.wholesalePrice.toFixed(2)}`,
        `${product.distributorPrice.toFixed(2)}`,
      ];

      if (withStock) {
        if (product.stock === undefined || product.stock === null) {
          row.push('');
        } else if (product.stock >= 999) {
          row.push('Sí');
        } else {
          row.push(product.stock.toString());
        }
      }

      return row;
    });

    // Generate table
    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 112, 192], // Blue color
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: withStock ? 60 : 70 }, // Producto
        1: { cellWidth: withStock ? 25 : 30, halign: 'center' }, // Código
        2: { cellWidth: withStock ? 22 : 25, halign: 'center' }, // Minorista
        3: { cellWidth: withStock ? 22 : 25, halign: 'center' }, // Mayorista
        4: { cellWidth: withStock ? 25 : 28, halign: 'center' }, // Distribuidor
        ...(withStock && { 5: { cellWidth: 22, halign: 'center' } }), // Stock
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        yPosition = data.cursor?.y || yPosition;
      },
    });

    // Update yPosition after table
    yPosition = (doc as any).lastAutoTable.finalY + 8;

    // Add new page if needed and not last category
    if (yPosition > 250 && index < sortedCategories.length - 1) {
      doc.addPage();
      yPosition = 20;
    }
  });

  // Save the PDF
  const fileName = withStock
    ? `Catalogo_Productos_Con_Stock_${monthYear.replace(' ', '_')}.pdf`
    : `Catalogo_Productos_Sin_Stock_${monthYear.replace(' ', '_')}.pdf`;

  doc.save(fileName);
}
