/**
 * 客户和供应商相关类型定义
 */

// 客户等级
export type CustomerLevel = 'A级' | 'B级' | 'C级' | 'D级';

// 账期天数
export type CreditDays = 7 | 15 | 30;

// 付款方式
export type PaymentMethod = '月结' | '现结' | '预付';

// 供应商类型
export type SupplierType = '面料' | '辅料' | '外协' | '其他';

// 客户状态
export type PartnerStatus = '启用' | '停用';

// 客户
export interface Customer {
  id: string;
  customerCode: string;
  customerName: string;
  shortName: string;
  contact: string;
  phone: string;
  address: string;
  level: CustomerLevel;
  creditDays: CreditDays;
  taxRate: number;
  invoiceInfo: string;
  deliveryAddress: string;
  totalOrders: number;
  totalAmount: number;
  status: PartnerStatus;
  createdAt: string;
  updatedAt?: string;
}

// 供应商
export interface Supplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  supplierType: SupplierType;
  contact: string;
  phone: string;
  address: string;
  invoiceInfo: string;
  creditDays: CreditDays;
  paymentMethod: PaymentMethod;
  totalPurchases: number;
  totalAmount: number;
  status: PartnerStatus;
  createdAt: string;
  updatedAt?: string;
}

// ==================== 数据操作函数 ====================

import { DB_KEYS } from '@/lib/database';

const CUSTOMERS_KEY = DB_KEYS.CUSTOMERS;
const SUPPLIERS_KEY = DB_KEYS.SUPPLIERS;

// 初始化客户和供应商数据（创建空数组）
export function initPartnerData(): void {
  if (typeof window === 'undefined') return;
  
  const storedCustomers = localStorage.getItem(CUSTOMERS_KEY);
  if (!storedCustomers) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify([]));
  }
  
  const storedSuppliers = localStorage.getItem(SUPPLIERS_KEY);
  if (!storedSuppliers) {
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify([]));
  }
}

// 获取客户列表
export function getCustomers(): Customer[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(CUSTOMERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

// 获取供应商列表
export function getSuppliers(): Supplier[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(SUPPLIERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

// 根据ID获取客户
export function getCustomerById(id: string): Customer | null {
  const customers = getCustomers();
  return customers.find(c => c.id === id) || null;
}

// 根据ID获取供应商
export function getSupplierById(id: string): Supplier | null {
  const suppliers = getSuppliers();
  return suppliers.find(s => s.id === id) || null;
}

// 保存客户
export function saveCustomer(customer: Customer): void {
  if (typeof window === 'undefined') return;
  const customers = getCustomers();
  const index = customers.findIndex(c => c.id === customer.id);
  if (index >= 0) {
    customers[index] = { ...customer, updatedAt: new Date().toISOString() };
  } else {
    customers.push(customer);
  }
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

// 保存供应商
export function saveSupplier(supplier: Supplier): void {
  if (typeof window === 'undefined') return;
  const suppliers = getSuppliers();
  const index = suppliers.findIndex(s => s.id === supplier.id);
  if (index >= 0) {
    suppliers[index] = { ...supplier, updatedAt: new Date().toISOString() };
  } else {
    suppliers.push(supplier);
  }
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
}

// 删除客户
export function deleteCustomer(id: string): void {
  if (typeof window === 'undefined') return;
  const customers = getCustomers().filter(c => c.id !== id);
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

// 删除供应商
export function deleteSupplier(id: string): void {
  if (typeof window === 'undefined') return;
  const suppliers = getSuppliers().filter(s => s.id !== id);
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
}

// 生成客户编号
export function generateCustomerCode(): string {
  const customers = getCustomers();
  const maxCode = customers.reduce((max, c) => {
    const num = parseInt(c.customerCode.replace('CUS', ''));
    return num > max ? num : max;
  }, 0);
  return `CUS${String(maxCode + 1).padStart(3, '0')}`;
}

// 生成供应商编号
export function generateSupplierCode(): string {
  const suppliers = getSuppliers();
  const maxCode = suppliers.reduce((max, s) => {
    const num = parseInt(s.supplierCode.replace('SUP', ''));
    return num > max ? num : max;
  }, 0);
  return `SUP${String(maxCode + 1).padStart(3, '0')}`;
}
