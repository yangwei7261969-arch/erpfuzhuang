export type PaymentStatus = '未付款' | '部分付款' | '已付款';
export type ReceiptStatus = '未收款' | '部分收款' | '已收款';
export type SalaryStatus = '待审核' | '已审核' | '已发放';

export interface PaymentRecord {
  id: string;
  paymentNo: string;
  payableNo: string;
  amount: number;
  paymentDate: string;
  paymentMethod: '银行转账' | '现金' | '支票' | '其他';
  remark: string;
  operator: string;
}

export interface ReceiptRecord {
  id: string;
  receiptNo: string;
  receivableNo: string;
  amount: number;
  receiptDate: string;
  receiptMethod: '银行转账' | '现金' | '支票' | '其他';
  remark: string;
  operator: string;
}

export interface OrderCost {
  id: string;
  orderNo: string;
  styleNo: string;
  productName: string;
  orderQuantity: number;
  materialCost: number;
  laborCost: number;
  manufacturingCost: number;
  totalProductionCost: number;
  pieceCost: number;
  salesAmount: number;
  grossMargin: number;
  status: '核算中' | '已确认';
  createdAt: string;
  updatedAt: string;
}

export interface Payable {
  id: string;
  payableNo: string;
  orderNo: string;
  supplierName: string;
  category: '面料' | '辅料' | '加工费' | '外协费' | '其他';
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  paymentStatus: PaymentStatus;
  payments: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface Receivable {
  id: string;
  receivableNo: string;
  orderNo: string;
  customerName: string;
  totalAmount: number;
  receivedAmount: number;
  unreceivedAmount: number;
  receiptStatus: ReceiptStatus;
  receipts: ReceiptRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSalary {
  id: string;
  employeeId: string;
  employeeName: string;
  team: string;
  year: number;
  month: number;
  pieceWageAmount: number;
  subsidyAmount: number;
  deductionAmount: number;
  netSalary: number;
  status: SalaryStatus;
  auditedBy?: string;
  auditedAt?: string;
  createdAt: string;
}

export interface FinanceSummary {
  totalReceivable: number;
  totalReceived: number;
  totalPayable: number;
  totalPaid: number;
  totalLaborCost: number;
  totalMaterialCost: number;
}

const ORDER_COSTS_KEY = 'erp_order_costs';
const PAYABLES_KEY = 'erp_payables';
const RECEIVABLES_KEY = 'erp_receivables';
const SALARIES_KEY = 'erp_salaries';

let orderCosts: OrderCost[] = [];
let payables: Payable[] = [];
let receivables: Receivable[] = [];
let salaries: EmployeeSalary[] = [];

export function initFinanceData(): void {
  if (typeof window === 'undefined') return;
  
  // 订单成本
  const storedCosts = localStorage.getItem(ORDER_COSTS_KEY);
  if (storedCosts) {
    orderCosts = JSON.parse(storedCosts);
  } else {
    orderCosts = [
      {
        id: '1',
        orderNo: 'ORD20250101001',
        styleNo: 'ST001',
        productName: '男士T恤',
        orderQuantity: 500,
        materialCost: 15000,
        laborCost: 8000,
        manufacturingCost: 2000,
        totalProductionCost: 25000,
        pieceCost: 50,
        salesAmount: 40000,
        grossMargin: 37.5,
        status: '已确认',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    ];
    localStorage.setItem(ORDER_COSTS_KEY, JSON.stringify(orderCosts));
  }

  // 应付
  const storedPayables = localStorage.getItem(PAYABLES_KEY);
  if (storedPayables) {
    payables = JSON.parse(storedPayables);
  } else {
    payables = [
      {
        id: '1',
        payableNo: 'AP20250101001',
        orderNo: 'ORD20250101001',
        supplierName: '面料供应商A',
        category: '面料',
        totalAmount: 10000,
        paidAmount: 5000,
        unpaidAmount: 5000,
        paymentStatus: '部分付款',
        payments: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      {
        id: '2',
        payableNo: 'AP20250101002',
        orderNo: 'ORD20250101001',
        supplierName: '辅料供应商B',
        category: '辅料',
        totalAmount: 5000,
        paidAmount: 0,
        unpaidAmount: 5000,
        paymentStatus: '未付款',
        payments: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    ];
    localStorage.setItem(PAYABLES_KEY, JSON.stringify(payables));
  }

  // 应收
  const storedReceivables = localStorage.getItem(RECEIVABLES_KEY);
  if (storedReceivables) {
    receivables = JSON.parse(storedReceivables);
  } else {
    receivables = [
      {
        id: '1',
        receivableNo: 'AR20250101001',
        orderNo: 'ORD20250101001',
        customerName: '客户A',
        totalAmount: 40000,
        receivedAmount: 10000,
        unreceivedAmount: 30000,
        receiptStatus: '部分收款',
        receipts: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    ];
    localStorage.setItem(RECEIVABLES_KEY, JSON.stringify(receivables));
  }

  // 工资
  const storedSalaries = localStorage.getItem(SALARIES_KEY);
  if (storedSalaries) {
    salaries = JSON.parse(storedSalaries);
  } else {
    salaries = [
      {
        id: '1',
        employeeId: '1',
        employeeName: '王五',
        team: '缝制一组',
        year: 2025,
        month: 1,
        pieceWageAmount: 3500,
        subsidyAmount: 200,
        deductionAmount: 0,
        netSalary: 3700,
        status: '待审核',
        createdAt: '2025-01-31',
      },
    ];
    localStorage.setItem(SALARIES_KEY, JSON.stringify(salaries));
  }
}

export function getOrderCosts(): OrderCost[] {
  return [...orderCosts];
}

export function getPayables(): Payable[] {
  return [...payables];
}

export function getReceivables(): Receivable[] {
  return [...receivables];
}

export function getSalaries(): EmployeeSalary[] {
  return [...salaries];
}

export function savePayable(payable: Payable): void {
  const index = payables.findIndex(p => p.id === payable.id);
  if (index >= 0) {
    payables[index] = payable;
  } else {
    payables.push(payable);
  }
  localStorage.setItem(PAYABLES_KEY, JSON.stringify(payables));
}

export function saveReceivable(receivable: Receivable): void {
  const index = receivables.findIndex(r => r.id === receivable.id);
  if (index >= 0) {
    receivables[index] = receivable;
  } else {
    receivables.push(receivable);
  }
  localStorage.setItem(RECEIVABLES_KEY, JSON.stringify(receivables));
}

export function saveSalary(salary: EmployeeSalary): void {
  const index = salaries.findIndex(s => s.id === salary.id);
  if (index >= 0) {
    salaries[index] = salary;
  } else {
    salaries.push(salary);
  }
  localStorage.setItem(SALARIES_KEY, JSON.stringify(salaries));
}

export function getFinanceSummary(): FinanceSummary {
  return {
    totalReceivable: receivables.reduce((sum, r) => sum + r.totalAmount, 0),
    totalReceived: receivables.reduce((sum, r) => sum + r.receivedAmount, 0),
    totalPayable: payables.reduce((sum, p) => sum + p.totalAmount, 0),
    totalPaid: payables.reduce((sum, p) => sum + p.paidAmount, 0),
    totalLaborCost: orderCosts.reduce((sum, c) => sum + c.laborCost, 0),
    totalMaterialCost: orderCosts.reduce((sum, c) => sum + c.materialCost, 0),
  };
}
