// utils/stockManager.js
// Gerenciamento de estoque com transações atômicas

import mongoose from 'mongoose';
import Product from '../models/Product.js';

/**
 * Reduz estoque de produtos usando transação atômica
 * Garante consistência mesmo com múltiplas requisições simultâneas
 */
export async function reduceStock(orderItems) {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      for (const item of orderItems) {
        if (!item.productId) continue;

        const product = await Product.findById(item.productId).session(session);
        if (!product) {
          console.warn(`Produto ${item.productId} não encontrado para reduzir estoque`);
          continue;
        }

        const quantity = item.quantity || 1;
        const selectedSize = item.selectedSize;
        const selectedColor = item.selectedColor;
        
        // Se tem stockByVariant e foi selecionado cor/tamanho, reduzir da variante
        if (product.stockByVariant && selectedSize && selectedColor) {
          const variant = `${selectedSize}-${selectedColor}`;
          let stockByVariant = product.stockByVariant;
          
          // Converter Map para objeto se necessário para manipulação
          let variantStock = 0;
          if (stockByVariant instanceof Map) {
            variantStock = stockByVariant.get(variant) || 0;
            const newVariantStock = Math.max(0, variantStock - quantity);
            stockByVariant.set(variant, newVariantStock);
            product.stockByVariant = stockByVariant;
            
            // Atualizar estoque total
            let totalStock = 0;
            stockByVariant.forEach((qty) => totalStock += qty);
            product.stock = totalStock;
            
            console.log(`✅ Estoque da variante reduzido: ${product.name} (${variant}) - De ${variantStock} para ${newVariantStock}`);
          } else if (typeof stockByVariant === 'object' && stockByVariant !== null) {
            variantStock = stockByVariant[variant] || 0;
            const newVariantStock = Math.max(0, variantStock - quantity);
            stockByVariant[variant] = newVariantStock;
            
            // Atualizar estoque total
            let totalStock = 0;
            Object.values(stockByVariant).forEach((qty) => totalStock += qty);
            product.stock = totalStock;
            
            console.log(`✅ Estoque da variante reduzido: ${product.name} (${variant}) - De ${variantStock} para ${newVariantStock}`);
          }
        } else {
          // Fallback para estoque geral
          const currentStock = product.stock || 0;
          const newStock = Math.max(0, currentStock - quantity);
          product.stock = newStock;
          console.log(`✅ Estoque geral reduzido: ${product.name} - De ${currentStock} para ${newStock}`);
        }
        
        await product.save({ session });
      }
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });

    console.log('✅ Estoque reduzido com sucesso para todos os produtos');
  } catch (error) {
    console.error('❌ Erro ao reduzir estoque:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Restaura estoque de produtos (usado quando pedido é cancelado)
 */
export async function restoreStock(orderItems) {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      for (const item of orderItems) {
        if (!item.productId) continue;

        const product = await Product.findById(item.productId).session(session);
        if (!product) {
          console.warn(`Produto ${item.productId} não encontrado para restaurar estoque`);
          continue;
        }

        const quantity = item.quantity || 1;
        const selectedSize = item.selectedSize;
        const selectedColor = item.selectedColor;
        
        // Se tem stockByVariant e foi selecionado cor/tamanho, restaurar na variante
        if (product.stockByVariant && selectedSize && selectedColor) {
          const variant = `${selectedSize}-${selectedColor}`;
          let stockByVariant = product.stockByVariant;
          
          if (stockByVariant instanceof Map) {
            const variantStock = stockByVariant.get(variant) || 0;
            stockByVariant.set(variant, variantStock + quantity);
            product.stockByVariant = stockByVariant;
            
            // Atualizar estoque total
            let totalStock = 0;
            stockByVariant.forEach((qty) => totalStock += qty);
            product.stock = totalStock;
            
            console.log(`✅ Estoque da variante restaurado: ${product.name} (${variant}) - Novo estoque: ${variantStock + quantity}`);
          } else if (typeof stockByVariant === 'object' && stockByVariant !== null) {
            const variantStock = stockByVariant[variant] || 0;
            stockByVariant[variant] = variantStock + quantity;
            
            // Atualizar estoque total
            let totalStock = 0;
            Object.values(stockByVariant).forEach((qty) => totalStock += qty);
            product.stock = totalStock;
            
            console.log(`✅ Estoque da variante restaurado: ${product.name} (${variant}) - Novo estoque: ${variantStock + quantity}`);
          }
        } else {
          // Fallback para estoque geral
          const currentStock = product.stock || 0;
          product.stock = currentStock + quantity;
          console.log(`✅ Estoque geral restaurado: ${product.name} - Novo estoque: ${currentStock + quantity}`);
        }
        
        await product.save({ session });
      }
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });

    console.log('✅ Estoque restaurado com sucesso para todos os produtos');
  } catch (error) {
    console.error('❌ Erro ao restaurar estoque:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}

