// Shared TypeScript types for the Coffee Shop Admin Portal
// Aligned with backend DTOs

export type OrderStatus =
    | "PENDING_PAYMENT"
    | "CONFIRMED"
    | "PREPARING"
    | "READY"
    | "SERVED"
    | "CANCELLED";

export type OrderType = "DINE_IN" | "TAKEAWAY";
export type UserRole = "CUSTOMER" | "BARISTA" | "ADMIN";

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

/** Matches backend DashboardResponse */
export interface DashboardStats {
    totalOrders: number;
    pendingOrders: number;
    preparingOrders: number;
    readyOrders: number;
    totalProducts: number;
    lowStockIngredients: number;
}

/** Matches backend CategoryResponse */
export interface Category {
    id: number;
    name: string;
    icon: string | null;
    imageUrl: string | null;
}

/** Matches backend OrderItemResponse */
export interface OrderItem {
    id: string;
    productId: string;
    productName: string;
    productImageUrl?: string | null;
    quantity: number;
    unitPrice: number;
}

/** Matches backend OrderResponse */
export interface Order {
    id: string;
    userId: string;
    status: OrderStatus;
    orderType: OrderType;
    tableNumber: number | null;
    totalPrice: number;
    paymentRef: string | null;
    notes: string | null;
    baristaId: string | null;
    estimatedMinutes: number | null;
    createdAt: string;
    servedAt: string | null;
    items: OrderItem[];
    clientSecret: string | null;
    pickupToken: string | null;
    discountAmount: number | null;
    promoCode: string | null;
}

/** Matches backend ProductResponse */
export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string | null;
    imageUrl: string | null;
    active: boolean;
    showOnHomepage: boolean;
    todaySpecial: boolean;
    homePriority: number | null;
}

/** Matches backend IngredientResponse */
export interface Ingredient {
    id: string;
    name: string;
    unit: string;
    stockQty: number;
    lowThreshold: number;
    supplier: string | null;
    imageUrl: string | null;
    lowStock: boolean;
}

/** Matches backend PaymentResponse */
export interface Payment {
    id: string;
    orderId: string;
    paymentMethod: string;
    status: string;
    amount: number;
    transactionRef: string | null;
    paidAt: string | null;
    createdAt: string;
}

/** Matches backend ReceiptResponse.ReceiptItemResponse */
export interface ReceiptItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

/** Matches backend ReceiptResponse */
export interface Receipt {
    orderId: string;
    paymentId: string;
    orderType: string;
    tableNumber: number | null;
    items: ReceiptItem[];
    subtotal: number;
    totalPaid: number;
    paymentMethod: string;
    paidAt: string | null;
}

/** Matches backend AdminUserResponse */
export interface AdminUser {
    id: string;
    username: string;
    email: string;
    givenName: string;
    familyName: string;
    phoneNumber: string | null;
    profileImage?: string | null;
    enabled: boolean;
    accountNonLocked: boolean;
    roles: string[];
    createdAt: string | null;
}

/** Matches backend AdminCreateUserRequest */
export interface AdminCreateUserRequest {
    username: string;
    email: string;
    password: string;
    givenName: string;
    familyName: string;
    phoneNumber?: string;
    role: string;
}

/** Matches backend AdminUserRequest */
export interface AdminUpdateUserRequest {
    username: string;
    givenName: string;
    familyName: string;
    phoneNumber?: string;
    profileImage?: string;
    role?: string;
    password?: string;
}

/** Matches backend AuditLogResponse */
export interface AuditLog {
    id: number;
    actorId: string;
    actorUsername?: string | null;
    actorName?: string | null;
    actorRoles?: string[];
    action: string;
    entity: string;
    entityId: string;
    detail: string;
    createdAt: string;
}

/** Matches backend PromoCodeResponse */
export interface PromoCode {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    maxUses: number | null;
    usedCount: number;
    expiresAt: string | null;
    active: boolean;
    createdAt: string;
}

/** Matches backend PromoCodeRequest */
export interface PromoCodeRequest {
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    maxUses?: number;
    expiresAt?: string;
}

/** Matches backend RatingResponse */
export interface ProductRating {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    stars: number;
    comment: string | null;
    createdAt: string;
}

/** Matches backend LoyaltyOverviewResponse */
export interface LoyaltyOverview {
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    activeUsers: number;
    totalUsersWithPoints: number;
}

/** Matches backend SettlementReportResponse */
export interface SettlementReport {
    date: string;
    totalOrders: number;
    totalRevenue: number;
    cashRevenue: number;
    cashOrders: number;
    khqrRevenue: number;
    khqrOrders: number;
    cardRevenue: number;
    cardOrders: number;
    totalRefunds: number;
    netRevenue: number;
}
