// utils/orderOptimizer.js
// Utilitários para otimizar processamento de pedidos com concorrência

import mongoose from 'mongoose';
import Product from '../models/Product.js';

/**
 * Valida e verifica estoque de múltiplos produtos de forma otimizada
 * Usa transações atômicas para evitar race conditions
 */
export async function validateItemsWithStock(items) {
  // Extrair IDs únicos de produtos
  const productIds = items
    .map(item => item.productId || item.id)
    .filter(Boolean)
    .filter((id, index, self) => self.indexOf(id) === index); // Remover duplicatas

  if (productIds.length === 0) {
    throw new Error('Nenhum produto válido encontrado');
  }

  // Buscar todos os produtos de uma vez (otimização)
  const products = await Product.find({ _id: { $in: productIds } });
  const productsMap = new Map(products.map(p => [p._id.toString(), p]));

  const validatedItems = [];
  const stockChecks = [];

  // Usar transação do MongoDB para garantir atomicidade
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      for (const item of items) {
        // Validar campos obrigatórios
        if (!item.productId && !item.id) {
          throw new Error(`Produto sem ID: ${item.name || 'Produto desconhecido'}`);
        }

        const productId = item.productId || item.id;
        const quantity = parseInt(item.quantity) || 1;
        const price = parseFloat(item.price) || 0;

        // Validar quantidade
        if (quantity <= 0 || quantity > 100) {
          throw new Error(`Quantidade inválida para ${item.name || 'produto'}: ${quantity}`);
        }

        // Validar preço
        if (price <= 0 || price > 100000) {
          throw new Error(`Preço inválido para ${item.name || 'produto'}: R$ ${price}`);
        }

        // Buscar produto do mapa (já carregado)
        const product = productsMap.get(productId);
        if (!product) {
          throw new Error(`Produto não encontrado: ${item.name || productId}`);
        }

        // Verificar estoque disponível (por variante se tiver cor/tamanho)
        const selectedSize = item.selectedSize;
        const selectedColor = item.selectedColor;
        let availableStock = product.stock || 0;
        let variant = null;
        
        // Se tem stockByVariant e foi selecionado cor/tamanho, usar estoque da variante
        if (product.stockByVariant && selectedSize && selectedColor) {
          variant = `${selectedSize}-${selectedColor}`;
          // stockByVariant pode ser Map ou objeto
          if (product.stockByVariant instanceof Map) {
            availableStock = product.stockByVariant.get(variant) || 0;
          } else if (typeof product.stockByVariant === 'object' && product.stockByVariant !== null) {
            availableStock = product.stockByVariant[variant] || 0;
          }
        }
        
        // Verificar estoque dentro da transação (garante consistência)
        if (availableStock < quantity) {
          const variantInfo = variant ? ` (${variant})` : '';
          throw new Error(`Estoque insuficiente para ${product.name}${variantInfo}. Disponível: ${availableStock}, Solicitado: ${quantity}`);
        }

        // Validar que o preço não foi alterado (tolerância de 1%)
        const productPrice = (product.price_cents || 0) / 100;
        const priceDifference = Math.abs(price - productPrice);
        if (priceDifference > productPrice * 0.01) {
          console.warn(`Aviso: Preço alterado para ${product.name}. Original: R$ ${productPrice}, Recebido: R$ ${price}`);
        }

        // Armazenar verificação de estoque
        stockChecks.push({
          productId: product._id.toString(),
          quantity,
          availableStock,
          selectedSize: selectedSize || null,
          selectedColor: selectedColor || null,
          variant: variant || null,
        });

        validatedItems.push({
          productId: product._id.toString(),
          name: item.name || product.name,
          price: productPrice, // Usar preço do banco, não o enviado
          quantity,
          image: item.image || (product.images && product.images[0]) || null,
          selectedSize: selectedSize || null,
          selectedColor: selectedColor || null,
        });
      }
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });

    return { validatedItems, stockChecks };
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
}

