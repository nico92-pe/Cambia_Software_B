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

  // Add logo (top right) - Using text fallback since SVG rendering can be unreliable
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 162, 225); // #00A2E1 - CAMBIA blue color
  doc.text('CAMBIA', 155, 15);

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
