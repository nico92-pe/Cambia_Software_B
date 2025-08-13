/*
  # Fix Order Salesperson Assignment

  1. Updates
    - Update all orders to have María González as salesperson
    - Update all clients to have María González as assigned salesperson
  
  2. Data Fixes
    - Ensures all orders have a valid salesperson_id
    - Ensures all clients have a valid salesperson_id
*/

-- Update all orders to have María González as salesperson
UPDATE orders 
SET salesperson_id = '14e053fa-73a7-4657-a857-a6a54794259c'
WHERE salesperson_id IS NULL OR salesperson_id = '';

-- Update all clients to have María González as assigned salesperson  
UPDATE clients
SET salesperson_id = '14e053fa-73a7-4657-a857-a6a54794259c'
WHERE salesperson_id IS NULL OR salesperson_id = '';

-- Also update any orders that might reference the client's salesperson
UPDATE orders 
SET salesperson_id = (
  SELECT salesperson_id 
  FROM clients 
  WHERE clients.id = orders.client_id
)
WHERE orders.salesperson_id IS NULL;