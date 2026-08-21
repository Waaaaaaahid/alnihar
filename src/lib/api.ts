import { apiRequest, getAuthHeaders } from './apiClient';
import type { Category, MenuItem, Order, Coupon, Review, RestaurantSettings, Profile, Payment, CartItem, AuthResponse, TableBooking } from './types';
function normalize<T extends { _id?:string; id?:string }>(item:T):T{return item._id&&!item.id?{...item,id:item._id}:item;}
function normalizeArray<T extends { _id?:string; id?:string }>(items:T[]):T[]{return items.map(normalize);}
export async function authRegister(name:string,email:string,password:string,phone:string):Promise<AuthResponse>{return apiRequest<AuthResponse>('/api/auth/register',{method:'POST',body:JSON.stringify({name,email,password,phone})});}
export async function authLogin(email:string,password:string):Promise<AuthResponse>{return apiRequest<AuthResponse>('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});}
export async function authMe():Promise<Profile>{return apiRequest<Profile>('/api/auth/me');}
export async function updateProfile(userId:string,updates:{name?:string;phone?:string}):Promise<Profile>{return apiRequest<Profile>('/api/auth/profile',{method:'PUT',body:JSON.stringify(updates)});}
export async function fetchCategories():Promise<Category[]>{return normalizeArray(await apiRequest<Category[]>('/api/categories'));}
export async function fetchAllCategories():Promise<Category[]>{return normalizeArray(await apiRequest<Category[]>('/api/categories'));}
export async function createCategory(cat:Partial<Category>):Promise<Category>{return normalize(await apiRequest<Category>('/api/categories',{method:'POST',body:JSON.stringify(cat)}));}
export async function updateCategory(id:string,updates:Partial<Category>):Promise<Category>{return normalize(await apiRequest<Category>(`/api/categories/${id}`,{method:'PUT',body:JSON.stringify(updates)}));}
export async function deleteCategory(id:string):Promise<void>{await apiRequest(`/api/categories/${id}`,{method:'DELETE'});}
export async function fetchMenuItems(categoryId?:string):Promise<MenuItem[]>{return normalizeArray(await apiRequest<MenuItem[]>(`/api/menu${categoryId?`?categoryId=${categoryId}`:''}`));}
export async function fetchFeaturedItems():Promise<MenuItem[]>{return normalizeArray(await apiRequest<MenuItem[]>('/api/menu?featured=true'));}
export async function fetchBestsellerItems():Promise<MenuItem[]>{return normalizeArray(await apiRequest<MenuItem[]>('/api/menu?bestseller=true')).slice(0,8);}
export async function fetchMenuItem(id:string):Promise<MenuItem|null>{try{return normalize(await apiRequest<MenuItem>(`/api/menu/${id}`));}catch{return null;}}
export async function createMenuItem(item:Partial<MenuItem>):Promise<MenuItem>{return normalize(await apiRequest<MenuItem>('/api/menu',{method:'POST',body:JSON.stringify(item)}));}
export async function updateMenuItem(id:string,updates:Partial<MenuItem>):Promise<MenuItem>{return normalize(await apiRequest<MenuItem>(`/api/menu/${id}`,{method:'PUT',body:JSON.stringify(updates)}));}
export async function deleteMenuItem(id:string):Promise<void>{await apiRequest(`/api/menu/${id}`,{method:'DELETE'});}
export interface CreateOrderInput { userId?:string|null; customerName:string; customerPhone:string; customerEmail:string; deliveryAddress:string; deliveryLatitude?:number|null; deliveryLongitude?:number|null; orderNotes:string; paymentMethod:'cod'|'razorpay'; orderType?:'delivery'|'pickup'; items:CartItem[]; couponCode?:string; }
export async function createOrder(input:CreateOrderInput):Promise<Order>{const body={userId:input.userId||null,customerName:input.customerName,customerPhone:input.customerPhone,customerEmail:input.customerEmail,deliveryAddress:input.deliveryAddress,deliveryLatitude:input.deliveryLatitude??null,deliveryLongitude:input.deliveryLongitude??null,orderNotes:input.orderNotes,paymentMethod:input.paymentMethod,orderType:input.orderType||'delivery',couponCode:input.couponCode||'',items:input.items.map(i=>({menuItemId:i.menuItem.id||i.menuItem._id,name:i.menuItem.name,price:i.menuItem.price,quantity:i.quantity,imageUrl:i.menuItem.imageUrl}))};return normalize(await apiRequest<Order>('/api/orders',{method:'POST',body:JSON.stringify(body)}));}
export interface RazorpayCheckoutInput { userId?:string|null; customerName:string; customerPhone:string; customerEmail:string; deliveryAddress:string; deliveryLatitude?:number|null; deliveryLongitude?:number|null; orderNotes:string; orderType?:'delivery'|'pickup'; items:CartItem[]; couponCode?:string; }
export async function createRazorpayCheckout(input:RazorpayCheckoutInput):Promise<{razorpayOrderId:string;amount:number;currency:string;keyId:string;orderNumber:string}>{return apiRequest('/api/payments/razorpay/checkout',{method:'POST',body:JSON.stringify({userId:input.userId||null,customerName:input.customerName,customerPhone:input.customerPhone,customerEmail:input.customerEmail,deliveryAddress:input.deliveryAddress,deliveryLatitude:input.deliveryLatitude??null,deliveryLongitude:input.deliveryLongitude??null,orderNotes:input.orderNotes,orderType:input.orderType||'delivery',items:input.items.map(i=>({menuItemId:i.menuItem.id||i.menuItem._id,name:i.menuItem.name,quantity:i.quantity,imageUrl:i.menuItem.imageUrl})),couponCode:input.couponCode||''})});}
export async function verifyRazorpayPayment(input:{razorpayOrderId:string;razorpayPaymentId:string;razorpaySignature:string}):Promise<Order>{return normalize(await apiRequest<Order>('/api/payments/razorpay/verify',{method:'POST',body:JSON.stringify(input)}));}
export async function fetchOrder(id:string):Promise<Order|null>{try{return normalize(await apiRequest<Order>(`/api/orders/${id}`));}catch{return null;}}
export async function fetchUserOrders(userId:string):Promise<Order[]>{return normalizeArray(await apiRequest<Order[]>(`/api/orders/user/${userId}`));}
export async function fetchAllOrders(limit=200):Promise<Order[]>{return normalizeArray(await apiRequest<Order[]>(`/api/orders?limit=${limit}`));}
export async function updateOrderStatus(orderId:string,status:string):Promise<void>{await apiRequest(`/api/orders/${orderId}/status`,{method:'PUT',body:JSON.stringify({status})});}
export async function updatePaymentStatus(orderId:string,paymentStatus:string):Promise<void>{await apiRequest(`/api/orders/${orderId}/payment`,{method:'PUT',body:JSON.stringify({paymentStatus})});}
export async function fetchCouponByCode(code:string):Promise<Coupon|null>{try{return normalize(await apiRequest<Coupon>(`/api/coupons/${code}`));}catch{return null;}}
export async function fetchAllCoupons():Promise<Coupon[]>{return normalizeArray(await apiRequest<Coupon[]>('/api/coupons'));}
export async function createCoupon(coupon:Partial<Coupon>):Promise<Coupon>{return normalize(await apiRequest<Coupon>('/api/coupons',{method:'POST',body:JSON.stringify(coupon)}));}
export async function updateCoupon(id:string,updates:Partial<Coupon>):Promise<Coupon>{return normalize(await apiRequest<Coupon>(`/api/coupons/${id}`,{method:'PUT',body:JSON.stringify(updates)}));}
export async function deleteCoupon(id:string):Promise<void>{await apiRequest(`/api/coupons/${id}`,{method:'DELETE'});}
export async function fetchApprovedReviews():Promise<Review[]>{return normalizeArray(await apiRequest<Review[]>('/api/reviews'));}
export async function fetchAllReviews():Promise<Review[]>{return normalizeArray(await apiRequest<Review[]>('/api/reviews/admin'));}
export async function fetchMyOrderReview(orderId:string):Promise<Review|null>{try{return normalize(await apiRequest<Review>(`/api/reviews/order/${orderId}`));}catch{return null;}}
export async function createReview(review:{orderId?:string;name?:string;rating:number;comment:string}):Promise<Review>{return normalize(await apiRequest<Review>('/api/reviews',{method:'POST',body:JSON.stringify(review)}));}
export async function updateReview(id:string,updates:Partial<Review>):Promise<Review>{return normalize(await apiRequest<Review>(`/api/reviews/${id}`,{method:'PUT',body:JSON.stringify(updates)}));}
export async function deleteReview(id:string):Promise<void>{await apiRequest(`/api/reviews/${id}`,{method:'DELETE'});}
export async function fetchSettings():Promise<RestaurantSettings|null>{try{return normalize(await apiRequest<RestaurantSettings>('/api/settings'));}catch{return null;}}
export async function updateSettings(updates:Partial<RestaurantSettings>):Promise<RestaurantSettings>{return normalize(await apiRequest<RestaurantSettings>('/api/settings',{method:'PUT',body:JSON.stringify(updates)}));}
export async function fetchAdminStats():Promise<any>{return apiRequest('/api/orders/stats/overview');}
export async function fetchRecentOrders(limit=6):Promise<Order[]>{return normalizeArray(await apiRequest<Order[]>(`/api/orders?limit=${limit}`));}
export type SalesRange=7|30|180|365;
export async function fetchSalesData(days:SalesRange=7):Promise<{date:string;revenue:number;orders:number}[]>{return apiRequest(`/api/orders/stats/sales?days=${days}`);}
export async function fetchAllProfiles():Promise<Array<Profile & {onlineOrders:number;onlineSpend:number}>>{return apiRequest<any[]>('/api/users');}
export async function updateCustomerCod(userId:string,enabled:boolean):Promise<{id:string;codEnabled:boolean}>{return apiRequest(`/api/users/${userId}/cod`,{method:'PUT',body:JSON.stringify({enabled})});}
export async function fetchAllPayments():Promise<Payment[]>{return normalizeArray(await apiRequest<Payment[]>('/api/payments'));}
export async function createTableBooking(input:{customerName:string;customerPhone:string;customerEmail?:string;date:string;time:string;guests:number;notes?:string}):Promise<TableBooking>{return normalize(await apiRequest<TableBooking>('/api/bookings',{method:'POST',body:JSON.stringify(input)}));}
export async function fetchMyTableBookings():Promise<TableBooking[]>{return normalizeArray(await apiRequest<TableBooking[]>('/api/bookings/mine'));}
export async function fetchAllTableBookings():Promise<TableBooking[]>{return normalizeArray(await apiRequest<TableBooking[]>('/api/bookings'));}
export async function updateTableBookingStatus(id:string,status:TableBooking['status']):Promise<TableBooking>{return normalize(await apiRequest<TableBooking>(`/api/bookings/${id}/status`,{method:'PUT',body:JSON.stringify({status})}));}
export async function assignTableBooking(id:string,tableNumber:string):Promise<TableBooking>{return normalize(await apiRequest<TableBooking>(`/api/bookings/${id}/table`,{method:'PUT',body:JSON.stringify({tableNumber})}));}
export {calculateOrderTotals,formatPrice,formatDate,formatDateTime,timeAgo,validatePhone,validateEmail,cn,slugify} from './utils';
