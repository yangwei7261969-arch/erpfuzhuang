export type PaymentStatus = '未付款' | '部分付款' | '已付款';
export type ReceiptStatus = '未收款' | '部分收款' | '已收款';
export type SalaryStatus = '待审核' | '已审核' | '已发放';

// 工资相关类型
export type WageType = '计件工资' | '计时工资' | '全勤奖' | '夜班补贴' | '岗位补贴' | '绩效奖金' | '返工补贴';
export type DeductionType = '旷工扣款' | '请假扣款' | '次品扣款' | '物料损坏扣款' | '车间违规罚款';
export type AdvanceStatus = '待审核' | '车间审核中' | '财务审核中' | '已通过' | '已驳回';
export type WithdrawalStatus = '待审核' | '处理中' | '已到账' | '已失败';
export type ReimbursementCategory = '出差车费' | '油费' | '路费' | '采购辅料' | '配件小额杂费' | '快递物流费' | '食堂食材杂费' | '办公耗材费' | '维修设备费' | '其他因公临时杂费';
export type ReimbursementStatus = '待审核' | '主管审核中' | '财务审核中' | '老板审核中' | '已通过' | '已驳回' | '已到账';

export interface WageRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  wageType: WageType;
  amount: number;
  hours?: number; // 计时工时
  pieces?: number; // 计件数量
  remark?: string;
}

export interface DeductionRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  deductionType: DeductionType;
  amount: number;
  reason: string;
  evidenceImages: string[]; // 截图留证
  operator: string;
  createdAt: string;
}

export interface MonthlySalary {
  id: string;
  employeeId: string;
  employeeName: string;
  year: number;
  month: number;
  wageRecords: WageRecord[];
  deductionRecords: DeductionRecord[];
  totalWage: number;
  totalDeduction: number;
  netSalary: number;
  frozenAmount: number; // 冻结待结算金额
  availableAmount: number; // 可提现金额
  status: '冻结中' | '已解冻' | '已结算';
  createdAt: string;
  updatedAt: string;
}

export interface AdvanceApplication {
  id: string;
  advanceNo: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  reason: string;
  maxAdvanceAmount: number; // 当前可预支最大值
  status: AdvanceStatus;
  workshopAuditor?: string;
  workshopAuditTime?: string;
  workshopComment?: string;
  financeAuditor?: string;
  financeAuditTime?: string;
  financeComment?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdvanceDebt {
  id: string;
  advanceId: string;
  advanceNo: string;
  employeeId: string;
  employeeName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: '未结清' | '已结清';
  createdAt: string;
  updatedAt: string;
}

export interface SalaryDeduction {
  id: string;
  salaryId: string;
  advanceDebtId: string;
  amount: number;
  deductionDate: string;
  createdAt: string;
}

export interface WithdrawalApplication {
  id: string;
  withdrawalNo: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  method: '银行卡' | '微信' | '支付宝';
  accountInfo: {
    accountName: string;
    accountNumber: string;
    bankName?: string;
  };
  status: WithdrawalStatus;
  transferReceiptImages: string[]; // 转账回执截图
  failureReason?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryFreeze {
  id: string;
  employeeId: string;
  employeeName: string;
  isFrozen: boolean; // 是否开启工资冻结储蓄
  frozenAmount: number;
  createdAt: string;
  updatedAt: string;
}

// 报销相关类型
export interface ApprovalRecord {
  approverId: string;
  approverName: string;
  approved: boolean;
  comment: string;
  approvedAt: string;
}

export interface ReimbursementApplication {
  id: string;
  reimbursementNo: string;
  employeeId: string;
  employeeName: string;
  category: ReimbursementCategory;
  amount: number;
  useDate: string;
  description: string;
  attachments: string[]; // 附件文件名
  status: ReimbursementStatus;
  createdAt: string;
  updatedAt: string;
  // 审核流程
  supervisorApproval?: ApprovalRecord;
  financeApproval?: ApprovalRecord;
  bossApproval?: ApprovalRecord;
  rejectionReason?: string;
}

export interface ReimbursementRecord {
  id: string;
  reimbursementId: string;
  reimbursementNo: string;
  employeeId: string;
  employeeName: string;
  category: ReimbursementCategory;
  amount: number;
  paidAt: string;
  createdAt: string;
}

// 钱包相关类型
export interface EmployeeWallet {
  employeeId: string;
  employeeName: string;
  // 工资相关
  frozenSalary: number; // 冻结待结算工资
  availableSalary: number; // 已解冻可提现工资
  advanceDebt: number; // 待抵扣预支欠款
  // 报销相关
  reimbursementBalance: number; // 报销专项余额
  // 统计
  totalWithdrawn: number; // 已提现总金额
  totalReimbursed: number; // 已报销总金额
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  employeeId: string;
  transactionNo: string;
  type: '工资解冻' | '预支到账' | '工资抵扣' | '工资提现' | '报销到账' | '报销提现';
  amount: number;
  balance: number; // 变动后的余额
  relatedId?: string; // 关联的申请ID
  remark: string;
  evidenceImages?: string[]; // 转账回执等
  createdAt: string;
}

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

// 新增的存储key
const WAGE_RECORDS_KEY = 'erp_wage_records';
const DEDUCTION_RECORDS_KEY = 'erp_deduction_records';
const MONTHLY_SALARIES_KEY = 'erp_monthly_salaries';
const ADVANCE_APPLICATIONS_KEY = 'erp_advance_applications';
const ADVANCE_DEBTS_KEY = 'erp_advance_debts';
const SALARY_DEDUCTIONS_KEY = 'erp_salary_deductions';
const WITHDRAWAL_APPLICATIONS_KEY = 'erp_withdrawal_applications';
const SALARY_FREEZES_KEY = 'erp_salary_freezes';
const REIMBURSEMENT_APPLICATIONS_KEY = 'erp_reimbursement_applications';
const REIMBURSEMENT_RECORDS_KEY = 'erp_reimbursement_records';
const EMPLOYEE_WALLETS_KEY = 'erp_employee_wallets';
const WALLET_TRANSACTIONS_KEY = 'erp_wallet_transactions';

let orderCosts: OrderCost[] = [];
let payables: Payable[] = [];
let receivables: Receivable[] = [];
let salaries: EmployeeSalary[] = [];

// 新增的数据存储
let wageRecords: WageRecord[] = [];
let deductionRecords: DeductionRecord[] = [];
let monthlySalaries: MonthlySalary[] = [];
let advanceApplications: AdvanceApplication[] = [];
let advanceDebts: AdvanceDebt[] = [];
let salaryDeductions: SalaryDeduction[] = [];
let withdrawalApplications: WithdrawalApplication[] = [];
let salaryFreezes: SalaryFreeze[] = [];
let reimbursementApplications: ReimbursementApplication[] = [];
let reimbursementRecords: ReimbursementRecord[] = [];
let employeeWallets: EmployeeWallet[] = [];
let walletTransactions: WalletTransaction[] = [];

export function initFinanceData(): void {
  if (typeof window === 'undefined') return;
  
  // 订单成本
  const storedCosts = localStorage.getItem(ORDER_COSTS_KEY);
  if (storedCosts) {
    orderCosts = JSON.parse(storedCosts);
  } else {
    orderCosts = [];
    localStorage.setItem(ORDER_COSTS_KEY, JSON.stringify(orderCosts));
  }

  // 应付
  const storedPayables = localStorage.getItem(PAYABLES_KEY);
  if (storedPayables) {
    payables = JSON.parse(storedPayables);
  } else {
    payables = [];
    localStorage.setItem(PAYABLES_KEY, JSON.stringify(payables));
  }

  // 应收
  const storedReceivables = localStorage.getItem(RECEIVABLES_KEY);
  if (storedReceivables) {
    receivables = JSON.parse(storedReceivables);
  } else {
    receivables = [];
    localStorage.setItem(RECEIVABLES_KEY, JSON.stringify(receivables));
  }

  // 工资
  const storedSalaries = localStorage.getItem(SALARIES_KEY);
  if (storedSalaries) {
    salaries = JSON.parse(storedSalaries);
  } else {
    salaries = [];
    localStorage.setItem(SALARIES_KEY, JSON.stringify(salaries));
  }

  // 初始化工资相关数据
  initSalaryData();
}

// 初始化工资相关数据
function initSalaryData(): void {
  // 工资记录
  const storedWageRecords = localStorage.getItem(WAGE_RECORDS_KEY);
  if (!storedWageRecords) {
    wageRecords = [];
    localStorage.setItem(WAGE_RECORDS_KEY, JSON.stringify(wageRecords));
  } else {
    wageRecords = JSON.parse(storedWageRecords);
  }

  // 扣款记录
  const storedDeductionRecords = localStorage.getItem(DEDUCTION_RECORDS_KEY);
  if (!storedDeductionRecords) {
    deductionRecords = [];
    localStorage.setItem(DEDUCTION_RECORDS_KEY, JSON.stringify(deductionRecords));
  } else {
    deductionRecords = JSON.parse(storedDeductionRecords);
  }

  // 月度工资
  const storedMonthlySalaries = localStorage.getItem(MONTHLY_SALARIES_KEY);
  if (!storedMonthlySalaries) {
    monthlySalaries = [];
    localStorage.setItem(MONTHLY_SALARIES_KEY, JSON.stringify(monthlySalaries));
  } else {
    monthlySalaries = JSON.parse(storedMonthlySalaries);
  }

  // 预支申请
  const storedAdvanceApplications = localStorage.getItem(ADVANCE_APPLICATIONS_KEY);
  if (!storedAdvanceApplications) {
    advanceApplications = [];
    localStorage.setItem(ADVANCE_APPLICATIONS_KEY, JSON.stringify(advanceApplications));
  } else {
    advanceApplications = JSON.parse(storedAdvanceApplications);
  }

  // 预支欠款
  const storedAdvanceDebts = localStorage.getItem(ADVANCE_DEBTS_KEY);
  if (!storedAdvanceDebts) {
    advanceDebts = [];
    localStorage.setItem(ADVANCE_DEBTS_KEY, JSON.stringify(advanceDebts));
  } else {
    advanceDebts = JSON.parse(storedAdvanceDebts);
  }

  // 工资抵扣记录
  const storedSalaryDeductions = localStorage.getItem(SALARY_DEDUCTIONS_KEY);
  if (!storedSalaryDeductions) {
    salaryDeductions = [];
    localStorage.setItem(SALARY_DEDUCTIONS_KEY, JSON.stringify(salaryDeductions));
  } else {
    salaryDeductions = JSON.parse(storedSalaryDeductions);
  }

  // 提现申请
  const storedWithdrawalApplications = localStorage.getItem(WITHDRAWAL_APPLICATIONS_KEY);
  if (!storedWithdrawalApplications) {
    withdrawalApplications = [];
    localStorage.setItem(WITHDRAWAL_APPLICATIONS_KEY, JSON.stringify(withdrawalApplications));
  } else {
    withdrawalApplications = JSON.parse(storedWithdrawalApplications);
  }

  // 工资冻结
  const storedSalaryFreezes = localStorage.getItem(SALARY_FREEZES_KEY);
  if (!storedSalaryFreezes) {
    salaryFreezes = [];
    localStorage.setItem(SALARY_FREEZES_KEY, JSON.stringify(salaryFreezes));
  } else {
    salaryFreezes = JSON.parse(storedSalaryFreezes);
  }

  // 报销申请
  const storedReimbursementApplications = localStorage.getItem(REIMBURSEMENT_APPLICATIONS_KEY);
  if (!storedReimbursementApplications) {
    reimbursementApplications = [];
    localStorage.setItem(REIMBURSEMENT_APPLICATIONS_KEY, JSON.stringify(reimbursementApplications));
  } else {
    reimbursementApplications = JSON.parse(storedReimbursementApplications);
  }

  // 报销记录
  const storedReimbursementRecords = localStorage.getItem(REIMBURSEMENT_RECORDS_KEY);
  if (!storedReimbursementRecords) {
    reimbursementRecords = [];
    localStorage.setItem(REIMBURSEMENT_RECORDS_KEY, JSON.stringify(reimbursementRecords));
  } else {
    reimbursementRecords = JSON.parse(storedReimbursementRecords);
  }

  // 员工钱包
  const storedEmployeeWallets = localStorage.getItem(EMPLOYEE_WALLETS_KEY);
  if (!storedEmployeeWallets) {
    employeeWallets = [];
    localStorage.setItem(EMPLOYEE_WALLETS_KEY, JSON.stringify(employeeWallets));
  } else {
    employeeWallets = JSON.parse(storedEmployeeWallets);
  }

  // 钱包交易记录
  const storedWalletTransactions = localStorage.getItem(WALLET_TRANSACTIONS_KEY);
  if (!storedWalletTransactions) {
    walletTransactions = [];
    localStorage.setItem(WALLET_TRANSACTIONS_KEY, JSON.stringify(walletTransactions));
  } else {
    walletTransactions = JSON.parse(storedWalletTransactions);
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

// ===== 工资相关函数 =====

// 工资记录管理
export function getWageRecords(employeeId?: string): WageRecord[] {
  if (employeeId) {
    return wageRecords.filter(r => r.employeeId === employeeId);
  }
  return [...wageRecords];
}

export function saveWageRecord(record: WageRecord): void {
  const index = wageRecords.findIndex(r => r.id === record.id);
  if (index >= 0) {
    wageRecords[index] = record;
  } else {
    wageRecords.push(record);
  }
  localStorage.setItem(WAGE_RECORDS_KEY, JSON.stringify(wageRecords));
}

// 扣款记录管理
export function getDeductionRecords(employeeId?: string): DeductionRecord[] {
  if (employeeId) {
    return deductionRecords.filter(r => r.employeeId === employeeId);
  }
  return [...deductionRecords];
}

export function saveDeductionRecord(record: DeductionRecord): void {
  const index = deductionRecords.findIndex(r => r.id === record.id);
  if (index >= 0) {
    deductionRecords[index] = record;
  } else {
    deductionRecords.push(record);
  }
  localStorage.setItem(DEDUCTION_RECORDS_KEY, JSON.stringify(deductionRecords));
}

// 月度工资管理
export function getMonthlySalaries(employeeId?: string): MonthlySalary[] {
  if (employeeId) {
    return monthlySalaries.filter(s => s.employeeId === employeeId);
  }
  return [...monthlySalaries];
}

export function saveMonthlySalary(salary: MonthlySalary): void {
  const index = monthlySalaries.findIndex(s => s.id === salary.id);
  if (index >= 0) {
    monthlySalaries[index] = salary;
  } else {
    monthlySalaries.push(salary);
  }
  localStorage.setItem(MONTHLY_SALARIES_KEY, JSON.stringify(monthlySalaries));
}

// 预支申请管理
export function getAdvanceApplications(employeeId?: string): AdvanceApplication[] {
  if (employeeId) {
    return advanceApplications.filter(a => a.employeeId === employeeId);
  }
  return [...advanceApplications];
}

export function saveAdvanceApplication(application: AdvanceApplication): void {
  const index = advanceApplications.findIndex(a => a.id === application.id);
  if (index >= 0) {
    advanceApplications[index] = application;
  } else {
    advanceApplications.push(application);
  }
  localStorage.setItem(ADVANCE_APPLICATIONS_KEY, JSON.stringify(advanceApplications));
}

// 预支欠款管理
export function getAdvanceDebts(employeeId?: string): AdvanceDebt[] {
  if (employeeId) {
    return advanceDebts.filter(d => d.employeeId === employeeId);
  }
  return [...advanceDebts];
}

export function saveAdvanceDebt(debt: AdvanceDebt): void {
  const index = advanceDebts.findIndex(d => d.id === debt.id);
  if (index >= 0) {
    advanceDebts[index] = debt;
  } else {
    advanceDebts.push(debt);
  }
  localStorage.setItem(ADVANCE_DEBTS_KEY, JSON.stringify(advanceDebts));
}

// 工资抵扣管理
export function getSalaryDeductions(employeeId?: string): SalaryDeduction[] {
  if (employeeId) {
    return salaryDeductions.filter(d => d.salaryId.startsWith(employeeId));
  }
  return [...salaryDeductions];
}

export function saveSalaryDeduction(deduction: SalaryDeduction): void {
  const index = salaryDeductions.findIndex(d => d.id === deduction.id);
  if (index >= 0) {
    salaryDeductions[index] = deduction;
  } else {
    salaryDeductions.push(deduction);
  }
  localStorage.setItem(SALARY_DEDUCTIONS_KEY, JSON.stringify(salaryDeductions));
}

// 提现申请管理
export function getWithdrawalApplications(employeeId?: string): WithdrawalApplication[] {
  if (employeeId) {
    return withdrawalApplications.filter(w => w.employeeId === employeeId);
  }
  return [...withdrawalApplications];
}

export function saveWithdrawalApplication(application: WithdrawalApplication): void {
  const index = withdrawalApplications.findIndex(w => w.id === application.id);
  if (index >= 0) {
    withdrawalApplications[index] = application;
  } else {
    withdrawalApplications.push(application);
  }
  localStorage.setItem(WITHDRAWAL_APPLICATIONS_KEY, JSON.stringify(withdrawalApplications));
}

// 工资冻结管理
export function getSalaryFreeze(employeeId: string): SalaryFreeze | null {
  return salaryFreezes.find(f => f.employeeId === employeeId) || null;
}

export function saveSalaryFreeze(freeze: SalaryFreeze): void {
  const index = salaryFreezes.findIndex(f => f.id === freeze.id);
  if (index >= 0) {
    salaryFreezes[index] = freeze;
  } else {
    salaryFreezes.push(freeze);
  }
  localStorage.setItem(SALARY_FREEZES_KEY, JSON.stringify(salaryFreezes));
}

// ===== 报销相关函数 =====

// 报销申请管理
export function getReimbursementApplications(employeeId?: string): ReimbursementApplication[] {
  if (employeeId) {
    return reimbursementApplications.filter(r => r.employeeId === employeeId);
  }
  return [...reimbursementApplications];
}

export function saveReimbursementApplication(application: ReimbursementApplication): void {
  const index = reimbursementApplications.findIndex(r => r.id === application.id);
  if (index >= 0) {
    reimbursementApplications[index] = application;
  } else {
    reimbursementApplications.push(application);
  }
  localStorage.setItem(REIMBURSEMENT_APPLICATIONS_KEY, JSON.stringify(reimbursementApplications));
}

// 报销记录管理
export function getReimbursementRecords(employeeId?: string): ReimbursementRecord[] {
  if (employeeId) {
    return reimbursementRecords.filter(r => r.employeeId === employeeId);
  }
  return [...reimbursementRecords];
}

export function saveReimbursementRecord(record: ReimbursementRecord): void {
  const index = reimbursementRecords.findIndex(r => r.id === record.id);
  if (index >= 0) {
    reimbursementRecords[index] = record;
  } else {
    reimbursementRecords.push(record);
  }
  localStorage.setItem(REIMBURSEMENT_RECORDS_KEY, JSON.stringify(reimbursementRecords));
}

// ===== 钱包相关函数 =====

// 员工钱包管理
export function getEmployeeWallet(employeeId: string): EmployeeWallet | null {
  return employeeWallets.find(w => w.employeeId === employeeId) || null;
}

export function saveEmployeeWallet(wallet: EmployeeWallet): void {
  const index = employeeWallets.findIndex(w => w.employeeId === wallet.employeeId);
  if (index >= 0) {
    employeeWallets[index] = wallet;
  } else {
    employeeWallets.push(wallet);
  }
  localStorage.setItem(EMPLOYEE_WALLETS_KEY, JSON.stringify(employeeWallets));
}

// 钱包交易记录管理
export function getWalletTransactions(employeeId?: string): WalletTransaction[] {
  if (employeeId) {
    return walletTransactions.filter(t => t.employeeId === employeeId);
  }
  return [...walletTransactions];
}

export function saveWalletTransaction(transaction: WalletTransaction): void {
  walletTransactions.push(transaction);
  localStorage.setItem(WALLET_TRANSACTIONS_KEY, JSON.stringify(walletTransactions));
}

// ===== 业务逻辑函数 =====

// 生成编码
export function generateAdvanceNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const count = advanceApplications.length + 1;
  return `ADV${dateStr}${count.toString().padStart(4, '0')}`;
}

export function generateWithdrawalNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const count = withdrawalApplications.length + 1;
  return `WD${dateStr}${count.toString().padStart(4, '0')}`;
}

export function generateReimbursementNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const count = reimbursementApplications.length + 1;
  return `RB${dateStr}${count.toString().padStart(4, '0')}`;
}

// 计算可预支金额
export function calculateMaxAdvanceAmount(employeeId: string): number {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  // 获取当月冻结工资
  const monthlySalary = monthlySalaries.find(
    s => s.employeeId === employeeId && s.year === currentYear && s.month === currentMonth
  );
  
  if (!monthlySalary) return 0;
  
  return Math.floor(monthlySalary.frozenAmount * 0.3); // 30%上限
}

// 检查预支资格
export function checkAdvanceEligibility(employeeId: string): { eligible: boolean; reason?: string } {
  // 检查入职时间（简化逻辑，实际应从员工档案获取）
  const hireDate = new Date('2024-01-01'); // 示例入职日期
  const now = new Date();
  const daysSinceHire = Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceHire < 15) {
    return { eligible: false, reason: `入职不满15天，还需${15 - daysSinceHire}天` };
  }
  
  // 检查本月预支次数
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthlyAdvances = advanceApplications.filter(
    a => a.employeeId === employeeId && 
         new Date(a.createdAt).getFullYear() === currentYear &&
         new Date(a.createdAt).getMonth() + 1 === currentMonth
  );
  
  if (monthlyAdvances.length >= 2) {
    return { eligible: false, reason: '本月预支次数已达上限' };
  }
  
  return { eligible: true };
}

// 工资解冻逻辑
export function unfreezeSalary(employeeId: string, year: number, month: number): void {
  const salary = monthlySalaries.find(
    s => s.employeeId === employeeId && s.year === year && s.month === month
  );
  
  if (!salary || salary.status !== '冻结中') return;
  
  // 解冻工资
  salary.availableAmount = salary.frozenAmount;
  salary.frozenAmount = 0;
  salary.status = '已解冻';
  salary.updatedAt = new Date().toISOString();
  
  // 自动抵扣预支欠款
  const debts = advanceDebts.filter(d => d.employeeId === employeeId && d.status === '未结清');
  let remainingAmount = salary.availableAmount;
  
  for (const debt of debts) {
    if (remainingAmount <= 0) break;
    
    const deductAmount = Math.min(remainingAmount, debt.remainingAmount);
    
    // 创建抵扣记录
    const deduction: SalaryDeduction = {
      id: `ded${Date.now()}${Math.random()}`,
      salaryId: salary.id,
      advanceDebtId: debt.id,
      amount: deductAmount,
      deductionDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    
    saveSalaryDeduction(deduction);
    
    // 更新欠款
    debt.paidAmount += deductAmount;
    debt.remainingAmount -= deductAmount;
    if (debt.remainingAmount <= 0) {
      debt.status = '已结清';
    }
    saveAdvanceDebt(debt);
    
    remainingAmount -= deductAmount;
  }
  
  salary.availableAmount = remainingAmount;
  saveMonthlySalary(salary);
  
  // 更新钱包
  updateEmployeeWallet(employeeId);
}

// 更新员工钱包
export function updateEmployeeWallet(employeeId: string): void {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const monthlySalary = monthlySalaries.find(
    s => s.employeeId === employeeId && s.year === currentYear && s.month === currentMonth
  );
  
  const advanceDebt = advanceDebts
    .filter(d => d.employeeId === employeeId && d.status === '未结清')
    .reduce((sum, d) => sum + d.remainingAmount, 0);
  
  const reimbursementBalance = reimbursementRecords
    .filter(r => r.employeeId === employeeId)
    .reduce((sum, r) => sum + r.amount, 0);
  
  const wallet: EmployeeWallet = {
    employeeId,
    employeeName: '', // 应从员工档案获取
    frozenSalary: monthlySalary?.frozenAmount || 0,
    availableSalary: monthlySalary?.availableAmount || 0,
    advanceDebt,
    reimbursementBalance,
    totalWithdrawn: 0, // 计算逻辑可扩展
    totalReimbursed: reimbursementBalance,
    updatedAt: new Date().toISOString(),
  };
  
  saveEmployeeWallet(wallet);
}

// ===== 报销业务逻辑函数 =====

// 获取单个报销申请
export function getReimbursementApplicationById(id: string): ReimbursementApplication | null {
  return reimbursementApplications.find(r => r.id === id) || null;
}

// 添加报销申请
export function addReimbursementApplication(application: Omit<ReimbursementApplication, 'id'>): void {
  const newApplication: ReimbursementApplication = {
    ...application,
    id: `rb${Date.now()}${Math.random()}`,
  };
  reimbursementApplications.push(newApplication);
  localStorage.setItem(REIMBURSEMENT_APPLICATIONS_KEY, JSON.stringify(reimbursementApplications));
}

// 更新报销申请
export function updateReimbursementApplication(id: string, updates: Partial<ReimbursementApplication>): void {
  const index = reimbursementApplications.findIndex(r => r.id === id);
  if (index >= 0) {
    reimbursementApplications[index] = { ...reimbursementApplications[index], ...updates };
    localStorage.setItem(REIMBURSEMENT_APPLICATIONS_KEY, JSON.stringify(reimbursementApplications));
  }
}

// 审核报销申请
export function approveReimbursementApplication(
  id: string,
  approverId: string,
  approverName: string,
  approved: boolean,
  comment?: string
): void {
  const application = getReimbursementApplicationById(id);
  if (!application) return;

  const now = new Date().toISOString();

  // 根据当前状态确定审核级别
  if (application.status === '待审核') {
    application.supervisorApproval = {
      approverId,
      approverName,
      approved,
      comment: comment || '',
      approvedAt: now,
    };
    application.status = approved ? '财务审核中' : '已驳回';
    if (!approved) {
      application.rejectionReason = comment;
    }
  } else if (application.status === '财务审核中') {
    application.financeApproval = {
      approverId,
      approverName,
      approved,
      comment: comment || '',
      approvedAt: now,
    };
    application.status = approved ? '老板审核中' : '已驳回';
    if (!approved) {
      application.rejectionReason = comment;
    }
  } else if (application.status === '老板审核中') {
    application.bossApproval = {
      approverId,
      approverName,
      approved,
      comment: comment || '',
      approvedAt: now,
    };
    application.status = approved ? '已通过' : '已驳回';
    if (!approved) {
      application.rejectionReason = comment;
    }
  }

  application.updatedAt = now;
  updateReimbursementApplication(id, application);

  // 如果审核通过且是最终审核，创建报销记录
  if (approved && application.status === '已通过') {
    const record: ReimbursementRecord = {
      id: `rbr${Date.now()}${Math.random()}`,
      reimbursementId: application.id,
      reimbursementNo: application.reimbursementNo,
      employeeId: application.employeeId,
      employeeName: application.employeeName,
      category: application.category,
      amount: application.amount,
      paidAt: now,
      createdAt: now,
    };
    saveReimbursementRecord(record);

    // 更新钱包
    updateEmployeeWallet(application.employeeId);
  }
}

// ===== 提现业务逻辑函数 =====

// 添加提现申请
export function addWithdrawalApplication(application: Omit<WithdrawalApplication, 'id'>): void {
  const newApplication: WithdrawalApplication = {
    ...application,
    id: `wd${Date.now()}${Math.random()}`,
  };
  withdrawalApplications.push(newApplication);
  localStorage.setItem(WITHDRAWAL_APPLICATIONS_KEY, JSON.stringify(withdrawalApplications));
}
