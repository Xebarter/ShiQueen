export type FaqAnswerBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'statuses'; items: { label: string; text: string }[] };

export type FaqItem = {
  id: string;
  q: string;
  blocks: FaqAnswerBlock[];
};

export type FaqCategory = {
  id: string;
  title: string;
  description: string;
  items: FaqItem[];
};

/** Flatten answer blocks into plain text for search + JSON-LD. */
export function faqAnswerPlainText(blocks: FaqAnswerBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'p') return block.text;
      if (block.type === 'ul' || block.type === 'ol') return block.items.join(' ');
      return block.items.map((item) => `${item.label}: ${item.text}`).join(' ');
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function allFaqPairs(categories: FaqCategory[] = FAQ_CATEGORIES): { q: string; a: string }[] {
  return categories.flatMap((category) =>
    category.items.map((item) => ({
      q: item.q,
      a: faqAnswerPlainText(item.blocks),
    }))
  );
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'about',
    title: 'About ShiQueen',
    description: 'Who we are and how shopping works',
    items: [
      {
        id: 'what-is-shiqueen',
        q: 'What is ShiQueen?',
        blocks: [
          {
            type: 'p',
            text: "ShiQueen is an online women's lifestyle store offering carefully selected fashion, beauty, hair, accessories, skincare, jewellery, shoes, bags, sleepwear and other products for women.",
          },
        ],
      },
      {
        id: 'where-located',
        q: 'Where is ShiQueen located?',
        blocks: [
          {
            type: 'p',
            text: 'ShiQueen serves customers in Uganda, with operations based in Kampala. We deliver to customers in Kampala and other parts of Uganda.',
          },
        ],
      },
      {
        id: 'how-to-shop',
        q: 'How do I shop on ShiQueen?',
        blocks: [
          {
            type: 'p',
            text: 'Simply browse our products, select the items and variants you want, add them to your cart, and proceed to checkout. Enter your delivery details, choose your preferred payment option and complete your order.',
          },
        ],
      },
      {
        id: 'account-required',
        q: 'Do I need an account to place an order?',
        blocks: [
          {
            type: 'p',
            text: 'No. You can place an order without creating an account. However, having an account makes it easier to track orders, manage your details and view your order history.',
          },
        ],
      },
    ],
  },
  {
    id: 'products',
    title: 'Products',
    description: 'Catalogue, pricing and availability',
    items: [
      {
        id: 'what-products',
        q: 'What products does ShiQueen sell?',
        blocks: [
          { type: 'p', text: 'Our product range includes:' },
          {
            type: 'ul',
            items: [
              "Women's clothing and dresses",
              'Shoes and sandals',
              'Handbags and purses',
              'Jewellery and fashion accessories',
              'Makeup and cosmetics',
              'Skincare products',
              'Perfumes and body mists',
              'Hair products and accessories',
              'Wigs and hair extensions',
              'Lingerie and sleepwear',
              'Shapewear',
              'Beauty and self-care products',
              'Gift items',
            ],
          },
        ],
      },
      {
        id: 'stock-accuracy',
        q: 'Are the products shown on the website available?',
        blocks: [
          {
            type: 'p',
            text: 'We make every effort to keep our online stock information accurate. However, some products or specific variants may sell out quickly. If an item becomes unavailable after you place an order, we will contact you regarding the available options.',
          },
        ],
      },
      {
        id: 'currency',
        q: 'Are product prices in Uganda Shillings?',
        blocks: [
          {
            type: 'p',
            text: 'Yes. All prices displayed on ShiQueen are in **Uganda Shillings (UGX)** unless otherwise stated.',
          },
        ],
      },
      {
        id: 'prices-include-delivery',
        q: 'Do product prices include delivery?',
        blocks: [
          {
            type: 'p',
            text: 'Product prices generally do not include delivery charges. Any applicable delivery fee will be shown during checkout before you confirm your order.',
          },
        ],
      },
      {
        id: 'original-products',
        q: 'Do you sell original products?',
        blocks: [
          {
            type: 'p',
            text: 'We aim to source and offer quality products from reliable suppliers. Where a product is specifically identified as branded or original, the relevant product description will provide the available details.',
          },
        ],
      },
      {
        id: 'colour-difference',
        q: 'Can the colour of a product look different from the photo?',
        blocks: [
          {
            type: 'p',
            text: 'Yes. Colours may appear slightly different depending on lighting, photography, screen settings and the device being used to view the product.',
          },
        ],
      },
    ],
  },
  {
    id: 'sizes',
    title: 'Sizes and Variants',
    description: 'Fit, colour and product options',
    items: [
      {
        id: 'choose-size',
        q: 'How do I choose the right clothing size?',
        blocks: [
          {
            type: 'p',
            text: "Check the size options provided on the individual product page before adding the item to your cart. Where a size guide is available, use your measurements to select the closest fit.",
          },
        ],
      },
      {
        id: 'between-sizes',
        q: 'What if I am between two sizes?',
        blocks: [
          {
            type: 'p',
            text: "If you are between sizes, we recommend checking the product's specific size guide and considering the material and fit described on the product page.",
          },
        ],
      },
      {
        id: 'request-variant',
        q: 'Can I request a different size or colour?',
        blocks: [
          {
            type: 'p',
            text: 'You can only select the sizes and colours currently available for that product. If the variant you want is not listed, it may currently be out of stock.',
          },
        ],
      },
      {
        id: 'what-is-variant',
        q: 'What does "variant" mean?',
        blocks: [
          {
            type: 'p',
            text: 'A variant is a different option of the same product, such as a different colour, size, capacity or length.',
          },
          {
            type: 'p',
            text: 'For example, a dress may be available in **Black, Red and Pink**, with sizes **S, M, L and XL**.',
          },
        ],
      },
    ],
  },
  {
    id: 'ordering',
    title: 'Ordering',
    description: 'Placing, changing and confirming orders',
    items: [
      {
        id: 'how-to-order',
        q: 'How do I place an order?',
        blocks: [
          { type: 'p', text: 'To place an order:' },
          {
            type: 'ol',
            items: [
              'Find the product you want.',
              'Select the required size, colour or other variant.',
              'Click **Add to Cart**.',
              'Review the items in your cart.',
              'Proceed to checkout.',
              'Enter your delivery information.',
              'Select your payment method.',
              'Confirm and pay for your order.',
            ],
          },
        ],
      },
      {
        id: 'multiple-products',
        q: 'Can I order more than one product at a time?',
        blocks: [
          {
            type: 'p',
            text: 'Yes. You can add multiple products to your cart and complete them as one order.',
          },
        ],
      },
      {
        id: 'multiple-qty',
        q: 'Can I order multiple quantities of the same product?',
        blocks: [
          {
            type: 'p',
            text: 'Yes, provided the required quantity is in stock.',
          },
        ],
      },
      {
        id: 'change-order',
        q: 'Can I change my order after placing it?',
        blocks: [
          {
            type: 'p',
            text: 'Contact ShiQueen as soon as possible if you need to change an order. We will try to accommodate the request before the order is processed or dispatched. Once an order has been dispatched, changes may no longer be possible.',
          },
        ],
      },
      {
        id: 'cancel-order',
        q: 'Can I cancel my order?',
        blocks: [
          {
            type: 'p',
            text: 'You may request cancellation as soon as possible after placing the order. Cancellation may not be possible once the order has already been processed or dispatched.',
          },
        ],
      },
      {
        id: 'order-confirmation',
        q: 'How do I know whether my order was successfully placed?',
        blocks: [
          {
            type: 'p',
            text: 'After successfully completing your order, you should receive an order confirmation with your order details. If you do not receive confirmation, check your email or contact our support team with the details you used when ordering.',
          },
        ],
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    description: 'Payment methods and security',
    items: [
      {
        id: 'payment-methods',
        q: 'How can I pay for my order?',
        blocks: [
          {
            type: 'p',
            text: 'ShiQueen supports the payment methods made available at checkout. Depending on your location and the available payment options, these may include mobile money, cards and other supported payment methods.',
          },
        ],
      },
      {
        id: 'payment-safe',
        q: 'Is it safe to pay online?',
        blocks: [
          {
            type: 'p',
            text: 'We take reasonable measures to protect customer and payment information. Payments are processed through supported payment channels, and ShiQueen does not require you to share your PIN or payment password with our staff.',
          },
        ],
      },
      {
        id: 'mm-pin',
        q: 'Will ShiQueen ask for my Mobile Money PIN?',
        blocks: [
          {
            type: 'p',
            text: '**No. Never share your Mobile Money PIN with anyone claiming to represent ShiQueen.**',
          },
        ],
      },
      {
        id: 'payment-not-confirmed',
        q: 'What should I do if my payment was deducted but my order was not confirmed?',
        blocks: [
          {
            type: 'p',
            text: 'Do not immediately make another payment. Contact ShiQueen support and provide your order details and, where applicable, the payment transaction reference so that the payment can be verified.',
          },
        ],
      },
      {
        id: 'pay-on-delivery',
        q: 'Can I pay when my order is delivered?',
        blocks: [
          {
            type: 'p',
            text: 'Cash or payment-on-delivery availability depends on the delivery location and the options shown during checkout. If the option is available for your order, it will be displayed during checkout.',
          },
        ],
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    description: 'Coverage, timing and addresses',
    items: [
      {
        id: 'delivery-areas',
        q: 'Where does ShiQueen deliver?',
        blocks: [
          {
            type: 'p',
            text: 'ShiQueen delivers within Kampala and to other locations across Uganda, subject to delivery coverage.',
          },
        ],
      },
      {
        id: 'delivery-time',
        q: 'How long does delivery take?',
        blocks: [
          {
            type: 'p',
            text: 'Delivery times depend on your location, product availability, order processing and the delivery method selected. Estimated delivery information will be provided during the ordering process where available.',
          },
        ],
      },
      {
        id: 'delivery-cost',
        q: 'How much does delivery cost?',
        blocks: [
          {
            type: 'p',
            text: 'Delivery charges depend on your delivery location and other applicable factors. The delivery fee will be displayed before you complete your order.',
          },
        ],
      },
      {
        id: 'outside-kampala',
        q: 'Do you deliver outside Kampala?',
        blocks: [
          {
            type: 'p',
            text: 'Yes. ShiQueen can deliver to customers in other parts of Uganda where delivery service is available.',
          },
        ],
      },
      {
        id: 'specific-address',
        q: 'Can I provide a specific delivery address?',
        blocks: [
          {
            type: 'p',
            text: 'Yes. Provide a clear and accurate delivery address during checkout, including relevant information such as your area, building, landmark or other directions that can help the delivery team locate you.',
          },
        ],
      },
      {
        id: 'change-address',
        q: 'Can I change my delivery address?',
        blocks: [
          {
            type: 'p',
            text: 'Contact us as soon as possible if you need to change your delivery address. Address changes may not be possible once the order has been dispatched.',
          },
        ],
      },
      {
        id: 'unavailable-delivery',
        q: 'What happens if I am not available when delivery is attempted?',
        blocks: [
          {
            type: 'p',
            text: 'The delivery team may contact you to arrange another delivery attempt or an alternative collection arrangement. Additional charges may apply in some circumstances.',
          },
        ],
      },
      {
        id: 'someone-else-receive',
        q: 'Can someone else receive my order?',
        blocks: [
          {
            type: 'p',
            text: 'Yes, where appropriate. If another person will receive your order, make sure they are aware of the delivery and can provide the necessary order information.',
          },
        ],
      },
    ],
  },
  {
    id: 'tracking',
    title: 'Order Tracking',
    description: 'Statuses and delays',
    items: [
      {
        id: 'how-to-track',
        q: 'How can I track my order?',
        blocks: [
          {
            type: 'p',
            text: 'If order tracking is available for your order, you can use the tracking information provided by ShiQueen to follow its progress.',
          },
        ],
      },
      {
        id: 'order-statuses',
        q: 'What do the different order statuses mean?',
        blocks: [
          {
            type: 'statuses',
            items: [
              {
                label: 'Pending',
                text: 'Your order has been received and is awaiting processing.',
              },
              {
                label: 'Confirmed',
                text: 'Your order has been verified and is being prepared.',
              },
              {
                label: 'Processing',
                text: 'Your items are being prepared for dispatch.',
              },
              {
                label: 'Dispatched',
                text: 'Your order has been handed over for delivery.',
              },
              {
                label: 'Delivered',
                text: 'Your order has been successfully delivered.',
              },
              {
                label: 'Cancelled',
                text: 'The order has been cancelled and will not be fulfilled.',
              },
            ],
          },
        ],
      },
      {
        id: 'order-delayed',
        q: 'What should I do if my order is delayed?',
        blocks: [
          {
            type: 'p',
            text: 'Contact our support team with your order number. We will check the status of your order and provide an update.',
          },
        ],
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns and Exchanges',
    description: 'Eligibility and how to start a return',
    items: [
      {
        id: 'can-return',
        q: 'Can I return an item?',
        blocks: [
          {
            type: 'p',
            text: "Returns may be accepted for eligible products where the item meets ShiQueen's return conditions. Please contact us as soon as possible if you believe you have received an incorrect, damaged or defective item.",
          },
        ],
      },
      {
        id: 'non-returnable',
        q: 'What products cannot be returned?',
        blocks: [
          {
            type: 'p',
            text: 'For hygiene and safety reasons, certain products may not be eligible for return once opened or used. This may include cosmetics, skincare, makeup, lingerie, underwear, hair products and other personal-use items.',
          },
          {
            type: 'p',
            text: 'The specific return conditions shown on the product page or applicable to your order take priority.',
          },
        ],
      },
      {
        id: 'exchange-size',
        q: 'Can I exchange clothing or shoes for another size?',
        blocks: [
          {
            type: 'p',
            text: 'Eligible clothing and footwear may be exchanged where the requested size is available and the item meets our exchange conditions.',
          },
        ],
      },
      {
        id: 'return-condition',
        q: 'What condition must a returned item be in?',
        blocks: [
          {
            type: 'p',
            text: 'Unless the return is due to a defect or an error by ShiQueen, returned products should generally:',
          },
          {
            type: 'ul',
            items: [
              'Be unused and unworn.',
              'Be in their original condition.',
              'Have original tags and packaging where applicable.',
              'Not have stains, damage, perfume or other signs of use.',
              'Include any accessories that came with the product.',
            ],
          },
        ],
      },
      {
        id: 'wrong-product',
        q: 'What if I received the wrong product?',
        blocks: [
          {
            type: 'p',
            text: 'Contact us immediately. Do not use the item. We will review the order and advise you on the next steps.',
          },
        ],
      },
      {
        id: 'damaged-item',
        q: 'What if my item arrives damaged?',
        blocks: [
          {
            type: 'p',
            text: 'Take clear photos of the damaged item and its packaging and contact ShiQueen as soon as possible. We will assess the issue and advise you on the appropriate resolution.',
          },
        ],
      },
      {
        id: 'return-window',
        q: 'How long do I have to request a return?',
        blocks: [
          {
            type: 'p',
            text: 'Return requests should be made within the return period specified by ShiQueen. The applicable period and conditions may vary depending on the product.',
          },
        ],
      },
      {
        id: 'return-delivery-cost',
        q: 'Who pays for return delivery?',
        blocks: [
          {
            type: 'p',
            text: 'This depends on the reason for the return. Where the issue is caused by an incorrect, defective or damaged item supplied by ShiQueen, we may cover the applicable return arrangements. For other eligible returns or exchanges, the customer may be responsible for return delivery costs.',
          },
        ],
      },
    ],
  },
  {
    id: 'refunds',
    title: 'Refunds',
    description: 'How and when refunds are processed',
    items: [
      {
        id: 'how-refunds',
        q: 'How are refunds handled?',
        blocks: [
          {
            type: 'p',
            text: 'Once a return has been reviewed and approved, the refund will be processed using an appropriate payment method according to the circumstances of the order.',
          },
        ],
      },
      {
        id: 'refund-time',
        q: 'How long does a refund take?',
        blocks: [
          {
            type: 'p',
            text: 'Refund processing time depends on the payment method and the time required to verify and process the returned item.',
          },
        ],
      },
      {
        id: 'delivery-fee-refund',
        q: 'Will my delivery fee be refunded?',
        blocks: [
          {
            type: 'p',
            text: 'Delivery charges may be non-refundable unless the return is due to an error, defect or other circumstance for which ShiQueen is responsible.',
          },
        ],
      },
      {
        id: 'partial-order',
        q: 'What if I received a partial order?',
        blocks: [
          {
            type: 'p',
            text: 'Contact us with your order number and details of the missing item. We will investigate and resolve the issue where appropriate.',
          },
        ],
      },
    ],
  },
  {
    id: 'beauty',
    title: 'Beauty, Hair & Personal Care',
    description: 'Makeup, skincare, wigs and hygiene rules',
    items: [
      {
        id: 'choose-beauty',
        q: 'How should I choose beauty or skincare products?',
        blocks: [
          {
            type: 'p',
            text: 'Read the product description, ingredients and usage information provided on the product page. If you have known allergies or sensitivities, review the ingredients carefully before purchasing.',
          },
        ],
      },
      {
        id: 'return-makeup',
        q: 'Can I return makeup or skincare products?',
        blocks: [
          {
            type: 'p',
            text: 'Opened or used beauty and personal-care products may not be eligible for return for hygiene reasons. Contact ShiQueen before returning any such product.',
          },
        ],
      },
      {
        id: 'return-wigs',
        q: 'Are wigs and hair extensions returnable?',
        blocks: [
          {
            type: 'p',
            text: 'Eligibility depends on the condition of the product and the applicable return policy. Hair products that have been worn, altered, washed, cut or otherwise used may not qualify for return.',
          },
        ],
      },
      {
        id: 'wig-variants',
        q: 'Do you offer different wig lengths and colours?',
        blocks: [
          {
            type: 'p',
            text: 'Yes. Where available, wig products may have variants such as length, colour, texture or style. Available options are shown on the product page.',
          },
        ],
      },
    ],
  },
  {
    id: 'gifts',
    title: 'Gift Shopping',
    description: 'Sending orders as gifts',
    items: [
      {
        id: 'buy-as-gift',
        q: 'Can I buy a product as a gift for someone else?',
        blocks: [
          {
            type: 'p',
            text: "Yes. You can provide the recipient's delivery information when placing the order.",
          },
        ],
      },
      {
        id: 'send-directly',
        q: 'Can I send an order directly to someone else?',
        blocks: [
          {
            type: 'p',
            text: "Yes. Simply enter the recipient's delivery details at checkout and ensure the information is accurate.",
          },
        ],
      },
      {
        id: 'gift-packaging',
        q: 'Do you offer gift packaging?',
        blocks: [
          {
            type: 'p',
            text: 'Gift packaging is available for selected products or orders where offered. Any available gift-packaging option will be shown during the ordering process.',
          },
        ],
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Customer Information',
    description: 'Profiles, passwords and privacy',
    items: [
      {
        id: 'why-account',
        q: 'Why should I create a ShiQueen account?',
        blocks: [
          {
            type: 'p',
            text: 'An account can make shopping easier by allowing you to manage your personal information, view your order history and access available account features.',
          },
        ],
      },
      {
        id: 'change-account',
        q: 'Can I change my account information?',
        blocks: [
          {
            type: 'p',
            text: 'Yes. Where account editing is available, you can update your information through your account settings.',
          },
        ],
      },
      {
        id: 'forgot-password',
        q: 'I forgot my password. What should I do?',
        blocks: [
          {
            type: 'p',
            text: 'Use the **Forgot Password** option on the login page and follow the instructions to reset your password.',
          },
        ],
      },
      {
        id: 'info-safe',
        q: 'Is my personal information safe?',
        blocks: [
          {
            type: 'p',
            text: 'ShiQueen takes reasonable steps to protect customer information and uses customer data for legitimate purposes related to operating the store, processing orders, providing customer service and improving the shopping experience.',
          },
        ],
      },
      {
        id: 'share-info',
        q: 'Will ShiQueen share my information?',
        blocks: [
          {
            type: 'p',
            text: "Customer information is handled in accordance with ShiQueen's privacy practices. Information may be shared with service providers where necessary to process payments, fulfil orders, deliver products or provide other essential services.",
          },
        ],
      },
    ],
  },
  {
    id: 'promotions',
    title: 'Promotions and Discounts',
    description: 'Sales, codes and campaign terms',
    items: [
      {
        id: 'offer-discounts',
        q: 'Does ShiQueen offer discounts?',
        blocks: [
          {
            type: 'p',
            text: 'Yes. We may occasionally offer promotions, discounts, seasonal sales, special offers and other campaigns.',
          },
        ],
      },
      {
        id: 'use-code',
        q: 'How do I use a discount code?',
        blocks: [
          {
            type: 'p',
            text: 'Enter your valid promotional code in the designated field during checkout and apply it before completing your order.',
          },
        ],
      },
      {
        id: 'multiple-codes',
        q: 'Can I use more than one discount code?',
        blocks: [
          {
            type: 'p',
            text: 'This depends on the terms of the promotion. Unless specifically stated otherwise, promotional codes may not be combined.',
          },
        ],
      },
      {
        id: 'code-not-working',
        q: 'Why is my discount code not working?',
        blocks: [
          { type: 'p', text: 'Check that the code:' },
          {
            type: 'ul',
            items: [
              'Has been entered correctly.',
              'Has not expired.',
              'Applies to the products in your cart.',
              'Meets any minimum purchase requirements.',
              'Has not already been used.',
              'Is available in your location.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'support',
    title: 'Customer Support',
    description: 'How to reach us and what to include',
    items: [
      {
        id: 'how-to-contact',
        q: 'How do I contact ShiQueen?',
        blocks: [
          {
            type: 'p',
            text: 'You can contact ShiQueen through the customer-support channels provided on our website. When contacting us about an existing order, include your order number so that we can assist you faster.',
          },
        ],
      },
      {
        id: 'support-info',
        q: 'What information should I provide when contacting support?',
        blocks: [
          { type: 'p', text: 'For an order-related enquiry, provide:' },
          {
            type: 'ul',
            items: [
              'Your order number.',
              'The name used when placing the order.',
              'The issue you are experiencing.',
              'Relevant photos or screenshots where necessary.',
            ],
          },
        ],
      },
      {
        id: 'response-time',
        q: 'When will ShiQueen respond?',
        blocks: [
          {
            type: 'p',
            text: 'Our response time depends on the type and volume of enquiries received. We aim to respond to customer enquiries as promptly as possible.',
          },
        ],
      },
    ],
  },
  {
    id: 'common',
    title: 'Common Questions',
    description: 'Quick answers shoppers ask often',
    items: [
      {
        id: 'only-for-women',
        q: 'Is ShiQueen only for women?',
        blocks: [
          {
            type: 'p',
            text: 'Yes. ShiQueen is focused on products and services designed primarily for women.',
          },
        ],
      },
      {
        id: 'buy-for-someone',
        q: 'Can I buy products for someone else?',
        blocks: [
          {
            type: 'p',
            text: 'Absolutely. ShiQueen products can be purchased as gifts for friends, family members, partners or anyone else you would like to surprise.',
          },
        ],
      },
      {
        id: 'all-variants',
        q: 'Are all products available in every size and colour?',
        blocks: [
          {
            type: 'p',
            text: 'No. Availability varies by product. Only the currently available variants will be displayed for each product.',
          },
        ],
      },
      {
        id: 'out-of-stock',
        q: 'What if a product I want is out of stock?',
        blocks: [
          {
            type: 'p',
            text: 'You can check back later to see whether the product has been restocked. Where a restock notification feature is available, you may also subscribe to be notified.',
          },
        ],
      },
      {
        id: 'request-product',
        q: 'Can I request a product that is not on the website?',
        blocks: [
          {
            type: 'p',
            text: 'You may contact ShiQueen and let us know what you are looking for. While we cannot guarantee that every request can be fulfilled, customer requests help us understand what products our customers want.',
          },
        ],
      },
      {
        id: 'stay-updated',
        q: 'How can I stay updated about new products and offers?',
        blocks: [
          {
            type: 'p',
            text: 'Follow ShiQueen through our official social media channels and subscribe to available promotional or marketing communications.',
          },
        ],
      },
    ],
  },
];
