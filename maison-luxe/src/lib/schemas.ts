/**
 * Schémas de validation Zod pour tout le projet
 * Centralisé pour cohérence et maintenabilité
 */

import { z } from 'zod';

// ============================================
// AUTHENTIFICATION
// ============================================

export const LoginSchema = z.object({
  email: z
    .string()
    .email('Email invalide')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Le mot de passe doit faire au moins 8 caractères'),
});

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Le nom doit faire au moins 2 caractères')
      .max(50, 'Le nom ne peut pas dépasser 50 caractères')
      .trim(),
    email: z
      .string()
      .email('Email invalide')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, 'Le mot de passe doit faire au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
      .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial'),
  })
  .refine((data) => {
    const local = data.email ? data.email.split('@')[0].toLowerCase() : '';
    if (!local) return true;
    return !data.password.toLowerCase().includes(local);
  }, {
    message: "Le mot de passe ne doit pas contenir la partie locale de l'email",
    path: ['password'],
  });

// ============================================
// PRODUITS
// ============================================

export const CreateProductSchema = z.object({
  name: z
    .string()
    .min(3, 'Le nom doit faire au moins 3 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .trim(),
  slug: z
    .string()
    .min(3, 'Le slug doit faire au moins 3 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des minuscules, chiffres et tirets'),
  description: z
    .string()
    .min(10, 'La description doit faire au moins 10 caractères')
    .max(5000, 'La description ne peut pas dépasser 5000 caractères'),
  price: z
    .number()
    .positive('Le prix doit être positif')
    .max(999999, 'Le prix ne peut pas dépasser 999 999€'),
  costPrice: z
    .number()
    .positive('Le coût doit être positif')
    .max(999999, 'Le coût ne peut pas dépasser 999 999€'),
  compareAtPrice: z
    .number()
    .positive('Le prix comparé doit être positif')
    .optional(),
  category: z
    .string()
    .min(1, 'La catégorie est requise'),
  stock: z
    .number()
    .int('Le stock doit être un nombre entier')
    .min(0, 'Le stock ne peut pas être négatif'),
  images: z
    .array(z.string().url("URL d'image invalide"))
    .min(1, 'Au moins une image est requise'),
  featured: z.boolean().optional().default(false),
  cjPid: z.string().optional(),
  cjVid: z.string().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// ============================================
// COMMANDES
// ============================================

export const ShippingAddressSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Le nom doit faire au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  address: z
    .string()
    .min(5, "L'adresse doit faire au moins 5 caractères")
    .max(200, "L'adresse ne peut pas dépasser 200 caractères"),
  city: z
    .string()
    .min(2, 'La ville doit faire au moins 2 caractères')
    .max(100, 'La ville ne peut pas dépasser 100 caractères'),
  postalCode: z
    .string()
    .min(2, 'Le code postal doit faire au moins 2 caractères')
    .max(20, 'Le code postal ne peut pas dépasser 20 caractères'),
  country: z
    .string()
    .length(2, 'Le pays doit être un code ISO 2 lettres'),
  phone: z
    .string()
    .min(8, 'Le téléphone doit faire au moins 8 caractères')
    .max(20, 'Le téléphone ne peut pas dépasser 20 caractères'),
  province: z.string().optional(),
  state: z.string().optional(),
});

export const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product: z.string().min(1, 'Product ID requis'),
        quantity: z
          .number()
          .int('La quantité doit être un nombre entier')
          .min(1, 'La quantité doit être au moins 1'),
      })
    )
    .min(1, 'Au moins un article est requis'),
  shippingAddress: ShippingAddressSchema,
  coupon: z.string().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
});

// ============================================
// COUPONS
// ============================================

export const CreateCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Le code doit faire au moins 3 caractères')
    .max(20, 'Le code ne peut pas dépasser 20 caractères')
    .toUpperCase(),
  type: z.enum(['percentage', 'fixed']),
  value: z
    .number()
    .positive('La valeur doit être positive'),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
  minPurchase: z
    .number()
    .nonnegative('Le montant minimum doit être positif')
    .optional(),
  maxDiscount: z
    .number()
    .positive('La réduction max doit être positive')
    .optional(),
  usageLimit: z
    .number()
    .int("La limite d'utilisation doit être un nombre entier")
    .positive('La limite doit être positive')
    .optional(),
  startDate: z.date().optional(),
  expiryDate: z.date().optional(),
  isActive: z.boolean().optional().default(true),
}).refine(
  (data) => {
    if (data.type === 'percentage' && data.value > 100) {
      return false;
    }
    return true;
  },
  {
    message: 'Un pourcentage ne peut pas dépasser 100%',
    path: ['value'],
  }
);

export const UpdateCouponSchema = CreateCouponSchema.partial();

// ============================================
// CATÉGORIES
// ============================================

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit faire au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  slug: z
    .string()
    .min(2, 'Le slug doit faire au moins 2 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des minuscules, chiffres et tirets'),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
  image: z
    .string()
    .url("URL d'image invalide")
    .optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// ============================================
// FAVORITES
// ============================================

export const FavoritePayloadSchema = z.object({
  productId: z.string().min(1, 'ID produit requis'),
});

// ============================================
// AVIS/REVIEWS
// ============================================

export const CreateReviewSchema = z.object({
  rating: z
    .number()
    .int('La note doit être un nombre entier')
    .min(1, 'La note doit être au moins 1')
    .max(5, 'La note ne peut pas dépasser 5'),
  comment: z
    .string()
    .min(5, 'Le commentaire doit faire au moins 5 caractères')
    .max(2000, 'Le commentaire ne peut pas dépasser 2000 caractères'),
});

export const UpdateReviewSchema = CreateReviewSchema.partial();

// ============================================
// CJ DROPSHIPPING
// ============================================

export const CJImportProductSchema = z.object({
  pid: z
    .string()
    .min(1, 'PID requis'),
  vid: z
    .string()
    .optional(),
  categoryId: z
    .string()
    .min(1, 'Catégorie requise'),
  customPrice: z
    .number()
    .positive('Le prix doit être positif')
    .optional(),
});

// Webhooks CJ: validation légère pour protéger les handlers
export const CJOrderWebhookSchema = z
  .object({
    orderId: z.string().optional(),
    orderNumber: z.string().optional(),
    orderStatus: z.string().optional(),
    trackingNumber: z.string().optional(),
    logisticName: z.string().optional(),
    updateTime: z.union([z.string(), z.number()]).optional(),
  })
  .refine((data) => !!(data.orderId || data.orderNumber), {
    message: 'orderId or orderNumber is required',
    path: ['orderId', 'orderNumber'],
  });

export const CJLogisticsWebhookSchema = z
  .object({
    trackingNumber: z.string().optional(),
    orderId: z.string().optional(),
    orderNumber: z.string().optional(),
    logisticName: z.string().optional(),
    trackingStatus: z.string().optional(),
    trackingFrom: z.string().optional(),
    trackingTo: z.string().optional(),
    deliveryTime: z.union([z.string(), z.number()]).optional(),
    deliveryDay: z.number().optional(),
    lastMileCarrier: z.string().optional(),
    lastTrackNumber: z.string().optional(),
    trackingEvents: z.array(z.any()).optional(),
  })
  .refine((data) => !!(data.trackingNumber || data.orderId || data.orderNumber), {
    message: 'trackingNumber, orderId or orderNumber is required',
    path: ['trackingNumber', 'orderId', 'orderNumber'],
  });

export const CJStockWebhookSchema = z
  .object({
    vid: z.string().optional(),
    sku: z.string().optional(),
    productId: z.string().optional(),
    stock: z.number().optional(),
    inStock: z.boolean().optional(),
    warehouseId: z.string().optional(),
    updateTime: z.union([z.string(), z.number()]).optional(),
  })
  .refine((data) => !!(data.vid || data.sku || data.productId), {
    message: 'vid, sku or productId is required',
    path: ['vid', 'sku', 'productId'],
  });

// ============================================
// PAGINATION & FILTRES
// ============================================

export const PaginationSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'La page doit être positive')
    .optional()
    .default(() => 1),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'La limite doit être entre 1 et 100')
    .optional()
    .default(() => 10),
  sort: z
    .enum(['newest', 'oldest', 'price-low', 'price-high', 'rating', 'popular'])
    .optional(),
});

// ============================================
// TYPES EXPORTÉS
// ============================================

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type CreateCouponInput = z.infer<typeof CreateCouponSchema>;
export type UpdateCouponInput = z.infer<typeof UpdateCouponSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
export type CJImportProductInput = z.infer<typeof CJImportProductSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type FavoritePayloadInput = z.infer<typeof FavoritePayloadSchema>;

// ============================================
// ADMIN ORDER UPDATE
// ============================================

export const UpdateOrderAdminSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  trackingNumber: z.string().optional(),
  trackingCarrier: z.string().optional(),
  shippedAt: z.string().optional(),
  deliveredAt: z.string().optional(),
  estimatedDelivery: z.string().optional(),
});

export type UpdateOrderAdminInput = z.infer<typeof UpdateOrderAdminSchema>;

// ============================================
// ADMIN CJ RETRY
// ============================================

export const RetryCJSchema = z.object({
  orderId: z.string().min(1, 'Order ID requis'),
});

export type RetryCJInput = z.infer<typeof RetryCJSchema>;

// ============================================
// CHECKOUT
// ============================================

export const CheckoutSuccessSchema = z.object({
  sessionId: z.string().min(1, 'sessionId requis'),
});

export type CheckoutSuccessInput = z.infer<typeof CheckoutSuccessSchema>;

// ============================================
// PROFILE
// ============================================

export const ProfileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
