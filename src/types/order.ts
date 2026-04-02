/**
 * 订单相关类型定义
 */

// 订单状态
export type OrderStatus = 
  | '草稿' 
  | '待审核' 
  | '已审核' 
  | '已下达' 
  | '生产中' 
  | '已完成' 
  | '已作废';

// 季节
export type Season = '春夏' | '秋冬';

// 币种
export type Currency = '人民币' | '美元';

// 贸易条款
export type TradeTerms = 'FOB' | 'EXW' | 'CIF' | 'DDP';

// 装箱方式
export type PackingMethod = '独立包装' | '折叠';

// 箱唛要求
export type CartonLabelType = '英文' | '中文' | 'LOGO';

// 印绣花工艺
export type PrintEmbroideryType = '印花' | '绣花' | '烫画';

// 洗水类型
export type WashType = '普洗' | '酵素' | '石洗' | '漂洗';

// 颜色效果
export type ColorEffect = '原色' | '做旧' | '复古';

// 色码矩阵（颜色×尺码）
export interface ColorSizeMatrix {
  colorName: string;
  S: number;
  M: number;
  L: number;
  XL: number;
  XXL: number;
  XXXL: number;
  subtotal: number;
}

// 印绣花要求
export interface PrintEmbroideryRequirement {
  position: string;
  type: PrintEmbroideryType;
  colorCount: number;
  width: number;
  height: number;
  pantoneColor: string;
  isSymmetric: boolean;
  fastness: string;
  washRequirement: string;
}

// 洗水要求
export interface WashRequirement {
  washType: WashType;
  colorEffect: ColorEffect;
  shrinkageRate: '≤3%' | '≤5%';
  ecoRequirement: string[];
}

// 包装要求
export interface PackingRequirement {
  packingMethod: PackingMethod;
  peBagSize: string;
  cartonSize: string;
  piecesPerCarton: number;
  sizeRatio: string;
  cartonLabelType: CartonLabelType;
  sticker: string;
  barcode: string;
  moistureProof: boolean;
  desiccant: boolean;
  tissuePaper: boolean;
}

// 尾部要求
export interface TailRequirement {
  trimThread: boolean;
  ironing: boolean;
  inspection: boolean;
  spareButtons: number;
  spareThread: string;
  hangTag: string;
  hangRope: string;
  foldMethod: string;
}

// 车工要求（缝制工艺要求）
export interface SewingRequirement {
  // 线迹密度
  stitchDensity: string; // 如 "12-14针/3cm"
  // 线型
  threadType: string; // 如 "涤纶线402"
  // 缝纫线颜色
  threadColor: string;
  // 拷克要求
  overlockType: string; // 如 "三线拷克"、"四线拷克"
  // 打枣要求
  bartackPosition: string; // 打枣位置
  // 特殊工艺
  specialProcess: string[]; // 如 ["双针压线", "链条车缝"]
  // 止口要求
  seamAllowance: string; // 如 "1cm"
  // 其他说明
  otherNotes: string;
}

// 订单主表
export interface Order {
  id: string;
  orderNo: string;
  
  // 客户信息
  customerId: string;
  customerName: string;
  customerCode: string;
  customerModel: string;
  
  // 产品信息
  productCode: string;
  styleNo: string;
  productName: string;
  brand: string;
  season: Season;
  year: string;
  
  // 日期
  orderDate: string;
  deliveryDate: string;
  
  // 业务员
  salesman: string;
  remark: string;
  
  // 色码矩阵
  colorSizeMatrix: ColorSizeMatrix[];
  totalQuantity: number;
  
  // 价格信息
  unitPrice: number;
  amount: number;
  currency: Currency;
  tradeTerms: TradeTerms;
  
  // 状态
  status: OrderStatus;
  
  // 包装要求
  packingRequirement: PackingRequirement;
  
  // 印绣花要求
  printEmbroidery: PrintEmbroideryRequirement[];
  
  // 洗水要求
  washRequirement: WashRequirement;
  
  // 尾部要求
  tailRequirement: TailRequirement;
  
  // 车工要求（缝制工艺要求）
  sewingRequirement?: SewingRequirement;
  
  // 审核信息
  createdBy: string;
  createdAt: string;
  auditedBy?: string;
  auditedAt?: string;
  
  // 生产信息
  productionIssuedAt?: string;
  productionIssuedBy?: string;
  
  // 更新时间
  updatedAt?: string;
}

// 客户档案（简化版）
export interface Customer {
  id: string;
  name: string;
  code: string;
  contact: string;
  phone: string;
  address: string;
}

// 产品档案
export interface Product {
  id: string;
  styleNo: string;
  productName: string;
  brand: string;
  category: string;
  sizes: string[];
  colors: string[];
}

// ==================== 数据操作函数 ====================

import { DB_KEYS } from '@/lib/database';

// 生成订单号
export const generateOrderNo = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  if (typeof window === 'undefined') {
    return `ORD${dateStr}001`;
  }
  
  const storedOrders = localStorage.getItem(DB_KEYS.ORDERS);
  const orders: Order[] = storedOrders ? JSON.parse(storedOrders) : [];
  
  const todayOrders = orders.filter(o => o.orderNo.includes(dateStr));
  const maxSeq = todayOrders.length > 0 
    ? Math.max(...todayOrders.map(o => parseInt(o.orderNo.slice(-3)))) 
    : 0;
  
  const seq = String(maxSeq + 1).padStart(3, '0');
  return `ORD${dateStr}${seq}`;
};

// 获取所有订单
export const getOrders = (): Order[] => {
  if (typeof window === 'undefined') return [];
  const storedOrders = localStorage.getItem(DB_KEYS.ORDERS);
  return storedOrders ? JSON.parse(storedOrders) : [];
};

// 保存订单
export const saveOrder = (order: Order) => {
  if (typeof window === 'undefined') return;
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === order.id);
  if (index >= 0) {
    orders[index] = { ...order, updatedAt: new Date().toISOString() };
  } else {
    orders.push(order);
  }
  localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
};

// 删除订单
export const deleteOrder = (orderId: string) => {
  if (typeof window === 'undefined') return;
  const orders = getOrders().filter(o => o.id !== orderId);
  localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
};

// 审核订单
export const auditOrder = (orderId: string, auditor: string) => {
  if (typeof window === 'undefined') return;
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = '已审核';
    order.auditedBy = auditor;
    order.auditedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  }
};

// 退回订单
export const rejectOrder = (orderId: string) => {
  if (typeof window === 'undefined') return;
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = '草稿';
    order.auditedBy = undefined;
    order.auditedAt = undefined;
    order.updatedAt = new Date().toISOString();
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  }
};

// 作废订单
export const cancelOrder = (orderId: string) => {
  if (typeof window === 'undefined') return;
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = '已作废';
    order.updatedAt = new Date().toISOString();
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  }
};

// 下达生产
export const issueProduction = (orderId: string) => {
  if (typeof window === 'undefined') return;
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = '已下达';
    order.productionIssuedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  }
};

// 获取客户列表
export const getCustomers = (): Customer[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DB_KEYS.CUSTOMERS);
  return stored ? JSON.parse(stored) : [];
};

// 获取产品列表
export const getProducts = (): Product[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
  return stored ? JSON.parse(stored) : [];
};

// ==================== 订单进度相关 ====================

// 工序类型
export type ProcessType = 
  | '裁床' 
  | '缝制' 
  | '尾部' 
  | '入库';

// 工序进度
export interface ProcessProgress {
  processType: ProcessType;
  processName: string;
  totalQuantity: number;
  completedQuantity: number;
  progress: number;
  status: '未开始' | '进行中' | '已完成' | '已暂停';
  startTime?: string;
  endTime?: string;
  operator?: string;
  remark?: string;
}

// 订单生产进度
export interface OrderProgress {
  orderId: string;
  orderNo: string;
  totalQuantity: number;
  completedQuantity: number;
  overallProgress: number;
  processes: ProcessProgress[];
  currentProcess: ProcessType;
  estimatedCompletionDate?: string;
  delayDays: number;
  lastUpdateTime: string;
}

// 工序权重
export const PROCESS_WEIGHTS: Record<ProcessType, number> = {
  '裁床': 15,
  '缝制': 50,
  '尾部': 25,
  '入库': 10,
};

// 默认工序列表
export const DEFAULT_PROCESSES: { type: ProcessType; name: string }[] = [
  { type: '裁床', name: '裁床裁剪' },
  { type: '缝制', name: '缝制组装' },
  { type: '尾部', name: '尾部整烫' },
  { type: '入库', name: '成品入库' },
];

// 计算总体进度
const calculateOverallProgress = (processes: ProcessProgress[]): number => {
  let totalWeight = 0;
  let weightedProgress = 0;
  
  processes.forEach(p => {
    const weight = PROCESS_WEIGHTS[p.processType];
    totalWeight += weight;
    weightedProgress += (p.progress * weight) / 100;
  });
  
  return Math.round(weightedProgress);
};

// 生成订单进度数据
export const generateOrderProgress = (order: Order): OrderProgress => {
  const status = order.status;
  let processes: ProcessProgress[] = [];
  let overallProgress = 0;
  let completedQuantity = 0;
  let currentProcess: ProcessType = '裁床';
  
  // 根据订单状态生成进度
  if (status === '草稿' || status === '待审核' || status === '已审核') {
    processes = DEFAULT_PROCESSES.map(p => ({
      processType: p.type,
      processName: p.name,
      totalQuantity: order.totalQuantity,
      completedQuantity: 0,
      progress: 0,
      status: '未开始' as const,
    }));
    overallProgress = 0;
    currentProcess = '裁床';
  } else if (status === '已下达') {
    processes = [
      { processType: '裁床', processName: '裁床裁剪', totalQuantity: order.totalQuantity, completedQuantity: 0, progress: 0, status: '进行中', startTime: new Date().toISOString() },
      { processType: '缝制', processName: '缝制组装', totalQuantity: order.totalQuantity, completedQuantity: 0, progress: 0, status: '未开始' },
      { processType: '尾部', processName: '尾部整烫', totalQuantity: order.totalQuantity, completedQuantity: 0, progress: 0, status: '未开始' },
      { processType: '入库', processName: '成品入库', totalQuantity: order.totalQuantity, completedQuantity: 0, progress: 0, status: '未开始' },
    ];
    overallProgress = 0;
    currentProcess = '裁床';
  } else if (status === '生产中') {
    // 生产中状态，从缓存获取实际进度
    const cachedProgress = localStorage.getItem(`erp_order_progress_${order.id}`);
    if (cachedProgress) {
      const cached = JSON.parse(cachedProgress) as OrderProgress;
      processes = cached.processes;
      overallProgress = cached.overallProgress;
      completedQuantity = cached.completedQuantity;
      currentProcess = cached.currentProcess;
    } else {
      processes = DEFAULT_PROCESSES.map(p => ({
        processType: p.type,
        processName: p.name,
        totalQuantity: order.totalQuantity,
        completedQuantity: 0,
        progress: 0,
        status: '未开始' as const,
      }));
      overallProgress = 0;
      currentProcess = '裁床';
    }
  } else if (status === '已完成') {
    processes = DEFAULT_PROCESSES.map(p => ({
      processType: p.type,
      processName: p.name,
      totalQuantity: order.totalQuantity,
      completedQuantity: order.totalQuantity,
      progress: 100,
      status: '已完成' as const,
    }));
    overallProgress = 100;
    completedQuantity = order.totalQuantity;
    currentProcess = '入库';
  } else {
    processes = DEFAULT_PROCESSES.map(p => ({
      processType: p.type,
      processName: p.name,
      totalQuantity: order.totalQuantity,
      completedQuantity: 0,
      progress: 0,
      status: '未开始' as const,
    }));
    overallProgress = 0;
    currentProcess = '裁床';
  }
  
  // 计算延期天数
  const deliveryDate = new Date(order.deliveryDate);
  const now = new Date();
  const diffDays = Math.ceil((deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    orderId: order.id,
    orderNo: order.orderNo,
    totalQuantity: order.totalQuantity,
    completedQuantity,
    overallProgress,
    processes,
    currentProcess,
    delayDays: diffDays < 0 ? Math.abs(diffDays) : 0,
    lastUpdateTime: new Date().toISOString(),
  };
};

// 获取订单进度
export const getOrderProgress = (orderId: string): OrderProgress | null => {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;
  
  return generateOrderProgress(order);
};

// 更新工序进度
export const updateProcessProgress = (
  orderId: string, 
  processType: ProcessType, 
  completedQuantity: number
): boolean => {
  const progress = getOrderProgress(orderId);
  if (!progress) return false;
  
  const process = progress.processes.find(p => p.processType === processType);
  if (!process) return false;
  
  process.completedQuantity = Math.min(completedQuantity, process.totalQuantity);
  process.progress = Math.round((process.completedQuantity / process.totalQuantity) * 100);
  process.status = process.progress === 100 ? '已完成' : (process.progress > 0 ? '进行中' : '未开始');
  
  if (process.progress === 100 && !process.endTime) {
    process.endTime = new Date().toISOString();
  }
  if (process.progress > 0 && !process.startTime) {
    process.startTime = new Date().toISOString();
  }
  
  progress.overallProgress = calculateOverallProgress(progress.processes);
  progress.completedQuantity = Math.round(progress.totalQuantity * progress.overallProgress / 100);
  progress.lastUpdateTime = new Date().toISOString();
  
  const processOrder: ProcessType[] = ['裁床', '缝制', '尾部', '入库'];
  for (const pt of processOrder) {
    const p = progress.processes.find(item => item.processType === pt);
    if (p && p.progress < 100) {
      progress.currentProcess = pt;
      break;
    }
  }
  
  localStorage.setItem(`erp_order_progress_${orderId}`, JSON.stringify(progress));
  
  return true;
};
