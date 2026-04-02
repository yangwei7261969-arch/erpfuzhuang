'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Scissors,
  Plus,
  Search,
  RotateCcw,
  Download,
  Eye,
  Play,
  CheckCircle,
  Send,
  Layers,
  Ruler,
  Tag,
  History,
  AlertTriangle,
} from 'lucide-react';
import {
  type CuttingTask,
  type CuttingBed,
  type CuttingStatus,
  type CuttingBedStatus,
  type ZaHaoRecord,
  type CuttingSizeRatio,
  getCuttingTasks,
  getCuttingStats,
  saveCuttingTask,
  generateTaskNo,
  generateBedNo,
  initCuttingData,
  startSpreading,
  completeCutting,
  transferToWorkshop,
  getZaHaoRecords,
} from '@/types/cutting';
import { getCurrentUser } from '@/types/user';
import { logCuttingCreate, logCuttingComplete } from '@/types/log';
import { getOrders, type Order } from '@/types/order';
import { getBOMs, type BOM } from '@/types/bom';

const statusColors: Record<CuttingStatus, string> = {
  '待裁': 'bg-yellow-600 text-white',
  '拉布中': 'bg-blue-600 text-white',
  '已裁': 'bg-green-600 text-white',
  '已移交': 'bg-purple-600 text-white',
  '已取消': 'bg-gray-600 text-gray-400',
};

const bedStatusColors: Record<CuttingBedStatus, string> = {
  '待拉布': 'bg-yellow-600 text-white',
  '拉布中': 'bg-blue-600 text-white',
  '已裁': 'bg-green-600 text-white',
  '已移交': 'bg-purple-600 text-white',
};

const zaStatusColors: Record<string, string> = {
  '已生成': 'bg-gray-600 text-white',
  '已移交': 'bg-blue-600 text-white',
  '缝制中': 'bg-orange-600 text-white',
  '已转入尾部': 'bg-purple-600 text-white',
  '已入库': 'bg-green-600 text-white',
};

export default function CuttingPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<CuttingTask[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, spreading: 0, cutted: 0, transferred: 0 });
  const [loading, setLoading] = useState(false);
  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [searchStatus, setSearchStatus] = useState('全部');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [zaHaoDialogOpen, setZaHaoDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CuttingTask | null>(null);
  const [zaHaoRecords, setZaHaoRecords] = useState<ZaHaoRecord[]>([]);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  
  // 订单和BOM选择
  const [orders, setOrders] = useState<Order[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [availableBoms, setAvailableBoms] = useState<BOM[]>([]);

  // 新建任务表单
  const [formData, setFormData] = useState({
    orderId: '',
    orderNo: '',
    bomId: '',
    bomNo: '',
    styleNo: '',
    productName: '',
    bedSeq: '1',
    colorName: '',
    fabricName: '',
    fabricQuantity: '',
    fabricWidth: '',
    sizeRatio: 'S:2, M:3, L:3, XL:2',
    totalLayers: '50',
    remark: '',
  });

  useEffect(() => {
    initCuttingData();
    loadTasks();
    loadOrdersAndBoms();
  }, []);

  const loadOrdersAndBoms = () => {
    setOrders(getOrders());
    setBoms(getBOMs());
  };
  
  // 选择订单时，筛选对应的BOM并自动带出信息
  const handleOrderChange = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const orderBoms = boms.filter(b => b.orderNo === order.orderNo);
      setAvailableBoms(orderBoms);
      setFormData({
        ...formData,
        orderId,
        orderNo: order.orderNo,
        styleNo: order.styleNo,
        productName: order.productName,
        bomId: '',
        bomNo: '',
      });
    }
  };
  
  // 选择BOM时自动带出信息
  const handleBomChange = (bomId: string) => {
    const bom = boms.find(b => b.id === bomId);
    if (bom) {
      setFormData({
        ...formData,
        bomId,
        bomNo: bom.bomNo,
        styleNo: bom.styleNo,
        productName: bom.productName,
      });
    }
  };

  const loadTasks = () => {
    setLoading(true);
    const data = getCuttingTasks();
    setTasks(data);
    setStats(getCuttingStats());
    setLoading(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (searchOrderNo && !t.orderNo.includes(searchOrderNo)) return false;
    if (searchStatus !== '全部' && t.status !== searchStatus) return false;
    return true;
  });

  const handleReset = () => {
    setSearchOrderNo('');
    setSearchStatus('全部');
  };

  // 导出裁床任务
  const handleExport = () => {
    const headers = ['任务号', '订单号', 'BOM单号', '款号', '品名', '总件数', '已裁件数', '已移交件数', '状态', '创建时间'];
    const rows = filteredTasks.map(t => [
      t.taskNo, t.orderNo, t.bomNo, t.styleNo, t.productName,
      t.totalPieces, t.cuttedPieces, t.transferredPieces, t.status, t.createdAt
    ]);
    
    const csvContent = [
      '裁床任务明细',
      '导出时间：' + new Date().toLocaleString('zh-CN'),
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `裁床任务_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseSizeRatio = (ratioStr: string, layers: number): CuttingSizeRatio[] => {
    return ratioStr.split(',').map(s => {
      const [size, ratio] = s.trim().split(':');
      const r = parseInt(ratio) || 1;
      return { sizeName: size.trim(), ratio: r, layers, pieces: r * layers };
    });
  };

  const handleCreateTask = () => {
    if (!formData.orderNo || !formData.colorName) {
      setAlertMessage({ type: 'error', message: '请填写订单号和颜色' });
      return;
    }

    const user = getCurrentUser();
    const layers = parseInt(formData.totalLayers) || 50;
    const sizeRatios = parseSizeRatio(formData.sizeRatio, layers);
    const totalPieces = sizeRatios.reduce((sum, s) => sum + s.pieces, 0);
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const createdAt = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const newBed: CuttingBed = {
      id: Date.now().toString(),
      bedNo: generateBedNo(),
      bedSeq: parseInt(formData.bedSeq) || 1,
      colorName: formData.colorName,
      fabricName: formData.fabricName,
      fabricQuantity: parseFloat(formData.fabricQuantity) || 0,
      fabricWidth: parseFloat(formData.fabricWidth) || undefined,
      sizeRatios,
      totalLayers: layers,
      totalPieces,
      cuttedPieces: 0,
      status: '待拉布',
      createdAt,
      updatedAt: createdAt,
    };

    const newTask: CuttingTask = {
      id: Date.now().toString(),
      taskNo: generateTaskNo(),
      orderNo: formData.orderNo,
      bomNo: formData.bomNo,
      styleNo: formData.styleNo,
      productName: formData.productName,
      plan: {
        id: Date.now().toString(),
        orderNo: formData.orderNo,
        styleNo: formData.styleNo,
        productName: formData.productName,
        totalQuantity: totalPieces,
        status: '待裁',
        createdAt,
      },
      beds: [newBed],
      zaHaoRecords: [],
      totalPieces,
      cuttedPieces: 0,
      transferredPieces: 0,
      status: '待裁',
      remark: formData.remark,
      createdBy: user?.username || 'system',
      createdAt,
      updatedAt: createdAt,
    };

    saveCuttingTask(newTask);
    logCuttingCreate(newTask.taskNo, newTask.orderNo, user?.id || 'system', user?.username || 'system');
    loadTasks();
    setCreateDialogOpen(false);
    resetFormData();
    setAlertMessage({ type: 'success', message: '裁床任务创建成功' });
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const resetFormData = () => {
    setFormData({
      orderId: '',
      orderNo: '',
      bomId: '',
      bomNo: '',
      styleNo: '',
      productName: '',
      bedSeq: '1',
      colorName: '',
      fabricName: '',
      fabricQuantity: '',
      fabricWidth: '',
      sizeRatio: 'S:2, M:3, L:3, XL:2',
      totalLayers: '50',
      remark: '',
    });
    setAvailableBoms([]);
  };

  const handleViewDetail = (task: CuttingTask) => {
    setSelectedTask(task);
    setDetailDialogOpen(true);
  };

  const handleViewZaHao = (task: CuttingTask) => {
    setSelectedTask(task);
    setZaHaoRecords(getZaHaoRecords(task.id));
    setZaHaoDialogOpen(true);
  };

  // 状态流转操作
  const handleStartSpreading = (task: CuttingTask, bedId: string) => {
    const user = getCurrentUser();
    if (startSpreading(task.id, bedId, user?.username || 'system')) {
      loadTasks();
      setAlertMessage({ type: 'success', message: '已开始拉布' });
    } else {
      setAlertMessage({ type: 'error', message: '操作失败，请检查状态' });
    }
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const handleCompleteCutting = (task: CuttingTask, bedId: string) => {
    const user = getCurrentUser();
    if (completeCutting(task.id, bedId)) {
      logCuttingComplete(task.taskNo, task.orderNo, user?.id || 'system', user?.username || 'system');
      loadTasks();
      setAlertMessage({ type: 'success', message: '裁剪完成，已自动生成扎号' });
    } else {
      setAlertMessage({ type: 'error', message: '操作失败，请检查状态' });
    }
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const handleTransfer = (task: CuttingTask) => {
    const user = getCurrentUser();
    if (transferToWorkshop(task.id)) {
      loadTasks();
      setAlertMessage({ type: 'success', message: '已移交车间' });
    } else {
      setAlertMessage({ type: 'error', message: '操作失败，请检查状态' });
    }
    setTimeout(() => setAlertMessage(null), 3000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto space-y-6">
        {alertMessage && (
          <Alert variant={alertMessage.type === 'error' ? 'destructive' : 'default'} className="border-gray-600 bg-gray-900">
            <AlertDescription className="text-white">{alertMessage.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <Scissors className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">裁床管理</h1>
              <p className="text-gray-400 text-sm">状态流转：待裁 → 拉布中 → 已裁 → 已移交（自动生成扎号）</p>
            </div>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-white text-black hover:bg-gray-200 font-medium">
            <Plus className="w-4 h-4 mr-2" />新建任务
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Layers className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">总任务</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <Ruler className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">待裁</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">拉布中</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.spreading}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">已裁</p>
                  <p className="text-2xl font-bold text-green-400">{stats.cutted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">已移交</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.transferred}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 查询区 */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end">
              <div>
                <Label className="text-gray-400">订单号</Label>
                <Input
                  placeholder="请输入"
                  value={searchOrderNo}
                  onChange={(e) => setSearchOrderNo(e.target.value)}
                  className="mt-1 bg-gray-800 border-gray-600 text-white w-48"
                />
              </div>
              <div>
                <Label className="text-gray-400">状态</Label>
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                  <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">全部</SelectItem>
                    <SelectItem value="待裁">待裁</SelectItem>
                    <SelectItem value="拉布中">拉布中</SelectItem>
                    <SelectItem value="已裁">已裁</SelectItem>
                    <SelectItem value="已移交">已移交</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={loadTasks} className="bg-white text-black hover:bg-gray-200">
                <Search className="w-4 h-4 mr-1" />查询
              </Button>
              <Button variant="outline" onClick={handleReset} className="border-gray-600 text-gray-300">
                <RotateCcw className="w-4 h-4 mr-1" />重置
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 数据表格 - 桌面端 */}
        <Card className="bg-gray-900 border-gray-700 hidden lg:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800">
                    <TableHead className="text-gray-400 w-10">#</TableHead>
                    <TableHead className="text-gray-400">任务编号</TableHead>
                    <TableHead className="text-gray-400">订单号</TableHead>
                    <TableHead className="text-gray-400">款号/品名</TableHead>
                    <TableHead className="text-gray-400">床次数</TableHead>
                    <TableHead className="text-gray-400 text-right">总件数</TableHead>
                    <TableHead className="text-gray-400 text-right">已裁</TableHead>
                    <TableHead className="text-gray-400 text-right">已移交</TableHead>
                    <TableHead className="text-gray-400">状态</TableHead>
                    <TableHead className="text-gray-400">创建时间</TableHead>
                    <TableHead className="text-gray-400 w-48">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12 text-gray-500">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12 text-gray-500">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((task, index) => (
                      <TableRow key={task.id} className="border-gray-700 hover:bg-gray-800">
                        <TableCell className="text-gray-500">{index + 1}</TableCell>
                        <TableCell className="text-white font-medium">{task.taskNo}</TableCell>
                        <TableCell className="text-gray-300">{task.orderNo}</TableCell>
                        <TableCell className="text-gray-300">{task.styleNo} {task.productName}</TableCell>
                        <TableCell className="text-gray-300">{task.beds?.length || 0}</TableCell>
                        <TableCell className="text-right text-white">{task.totalPieces}</TableCell>
                        <TableCell className="text-right text-green-400">{task.cuttedPieces}</TableCell>
                        <TableCell className="text-right text-purple-400">{task.transferredPieces}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[task.status]}>{task.status}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">{task.createdAt}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetail(task)}
                              className="text-gray-400 hover:text-white hover:bg-gray-700"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {task.status === '待裁' && task.beds?.[0]?.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartSpreading(task, task.beds[0].id)}
                                className="border-blue-600 text-blue-400 hover:bg-gray-800"
                              >
                                开始拉布
                              </Button>
                            )}
                            {task.status === '拉布中' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteCutting(task, task.beds?.find(b => b.status === '拉布中')?.id || task.beds?.[0]?.id || '')}
                                className="border-green-600 text-green-400 hover:bg-gray-800"
                              >
                                完成裁剪
                              </Button>
                            )}
                            {task.status === '已裁' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTransfer(task)}
                                className="border-purple-600 text-purple-400 hover:bg-gray-800"
                              >
                                移交车间
                              </Button>
                            )}
                            {task.zaHaoRecords && task.zaHaoRecords.length > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewZaHao(task)}
                                className="text-orange-400 hover:text-orange-300 hover:bg-gray-700"
                                title="查看扎号"
                              >
                                <Tag className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between items-center p-4 border-t border-gray-700">
              <div className="text-sm text-gray-400">共 {filteredTasks.length} 条</div>
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />导出
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* 移动端卡片 */}
        <div className="lg:hidden space-y-3">
          {filteredTasks.length === 0 ? (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="py-12 text-center text-gray-500">暂无数据</CardContent>
            </Card>
          ) : (
            filteredTasks.map((task, index) => (
              <Card key={task.id} className="bg-gray-900 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-white font-medium">{task.taskNo}</div>
                      <div className="text-gray-400 text-sm">{task.orderNo}</div>
                    </div>
                    <Badge className={statusColors[task.status]}>{task.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-400">款号：</span>
                      <span className="text-white">{task.styleNo}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">床次：</span>
                      <span className="text-white">{task.beds?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">总件数：</span>
                      <span className="text-white">{task.totalPieces}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">已裁：</span>
                      <span className="text-green-400">{task.cuttedPieces}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap border-t border-gray-700 pt-3">
                    <Button size="sm" variant="outline" onClick={() => handleViewDetail(task)} className="border-gray-600 text-gray-300">
                      <Eye className="w-4 h-4 mr-1" />详情
                    </Button>
                    {task.status === '待裁' && task.beds?.[0]?.id && (
                      <Button size="sm" variant="outline" onClick={() => handleStartSpreading(task, task.beds[0].id)} className="border-blue-600 text-blue-400">
                        开始拉布
                      </Button>
                    )}
                    {task.status === '拉布中' && (
                      <Button size="sm" variant="outline" onClick={() => handleCompleteCutting(task, task.beds?.find(b => b.status === '拉布中')?.id || task.beds?.[0]?.id || '')} className="border-green-600 text-green-400">
                        完成裁剪
                      </Button>
                    )}
                    {task.status === '已裁' && (
                      <Button size="sm" variant="outline" onClick={() => handleTransfer(task)} className="border-purple-600 text-purple-400">
                        移交
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <div className="text-center text-sm text-gray-400 py-2">共 {filteredTasks.length} 条</div>
        </div>

        {/* 新建任务弹窗 */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">新建裁床任务</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">选择订单 *</Label>
                <Select value={formData.orderId} onValueChange={handleOrderChange}>
                  <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="请选择订单" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.filter(o => o.status === '已审核' || o.status === '已下达' || o.status === '生产中').map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.orderNo} - {o.styleNo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">选择BOM</Label>
                <Select value={formData.bomId} onValueChange={handleBomChange} disabled={!formData.orderId}>
                  <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder={formData.orderId ? "请选择BOM" : "请先选择订单"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBoms.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.bomNo} - {b.styleNo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">款号</Label>
                <Input
                  value={formData.styleNo}
                  readOnly
                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                  placeholder="自动带出"
                />
              </div>
              <div>
                <Label className="text-gray-400">品名</Label>
                <Input
                  value={formData.productName}
                  readOnly
                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                  placeholder="自动带出"
                />
              </div>
              <div>
                <Label className="text-gray-400">床次序号</Label>
                <Input
                  type="number"
                  value={formData.bedSeq}
                  onChange={(e) => setFormData({ ...formData, bedSeq: e.target.value })}
                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">颜色 *</Label>
                <Input
                  value={formData.colorName}
                  onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                  placeholder="输入颜色名称"
                />
              </div>
              <div>
                <Label className="text-gray-400">面料名称</Label>
                <Input
                  value={formData.fabricName}
                  onChange={(e) => setFormData({ ...formData, fabricName: e.target.value })}
                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">面料用量(米)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.fabricQuantity}
                  onChange={(e) => setFormData({ ...formData, fabricQuantity: e.target.value })}
                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-gray-400">尺码配比 (格式: S:2, M:3, L:3, XL:2)</Label>
                <Input
                  value={formData.sizeRatio}
                  onChange={(e) => setFormData({ ...formData, sizeRatio: e.target.value })}
                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">拉布层数</Label>
                <Input
                  type="number"
                  value={formData.totalLayers}
                  onChange={(e) => setFormData({ ...formData, totalLayers: e.target.value })}
                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">备注</Label>
                <Input
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-gray-600 text-gray-300">
                取消
              </Button>
              <Button onClick={handleCreateTask} className="bg-white text-black hover:bg-gray-200">
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 详情弹窗 */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-3xl bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">裁床任务详情</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-400 text-xs">任务编号</span>
                    <p className="text-white font-medium">{selectedTask.taskNo}</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-400 text-xs">订单号</span>
                    <p className="text-white">{selectedTask.orderNo}</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-400 text-xs">总件数</span>
                    <p className="text-white font-bold">{selectedTask.totalPieces}</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-400 text-xs">状态</span>
                    <Badge className={statusColors[selectedTask.status]}>{selectedTask.status}</Badge>
                  </div>
                </div>
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">床次明细</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-400">床次号</TableHead>
                          <TableHead className="text-gray-400">颜色</TableHead>
                          <TableHead className="text-gray-400">层数</TableHead>
                          <TableHead className="text-gray-400 text-right">件数</TableHead>
                          <TableHead className="text-gray-400 text-right">面料(米)</TableHead>
                          <TableHead className="text-gray-400">状态</TableHead>
                          <TableHead className="text-gray-400">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTask.beds?.map((bed) => (
                          <TableRow key={bed.id} className="border-gray-700">
                            <TableCell className="text-gray-300">{bed.bedNo}</TableCell>
                            <TableCell className="text-gray-300">{bed.colorName}</TableCell>
                            <TableCell className="text-gray-300">{bed.totalLayers}</TableCell>
                            <TableCell className="text-right text-white">{bed.totalPieces}</TableCell>
                            <TableCell className="text-right text-white">{bed.fabricQuantity.toFixed(4)}</TableCell>
                            <TableCell>
                              <Badge className={bedStatusColors[bed.status]}>{bed.status}</Badge>
                            </TableCell>
                            <TableCell>
                              {bed.status === '待拉布' && selectedTask.status === '待裁' && (
                                <Button size="sm" variant="outline" onClick={() => { handleStartSpreading(selectedTask, bed.id); setDetailDialogOpen(false); }} className="border-blue-600 text-blue-400">
                                  开始拉布
                                </Button>
                              )}
                              {bed.status === '拉布中' && (
                                <Button size="sm" variant="outline" onClick={() => { handleCompleteCutting(selectedTask, bed.id); setDetailDialogOpen(false); }} className="border-green-600 text-green-400">
                                  完成裁剪
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 扎号弹窗 */}
        <Dialog open={zaHaoDialogOpen} onOpenChange={setZaHaoDialogOpen}>
          <DialogContent className="max-w-4xl bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Tag className="w-5 h-5" />
                扎号记录
              </DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>任务：{selectedTask.taskNo}</span>
                  <span>订单：{selectedTask.orderNo}</span>
                  <span>共 {zaHaoRecords.length} 个扎号</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-400">扎号</TableHead>
                      <TableHead className="text-gray-400">编号(BN)</TableHead>
                      <TableHead className="text-gray-400">床次</TableHead>
                      <TableHead className="text-gray-400">颜色</TableHead>
                      <TableHead className="text-gray-400">尺码</TableHead>
                      <TableHead className="text-gray-400">层数</TableHead>
                      <TableHead className="text-gray-400 text-right">件数</TableHead>
                      <TableHead className="text-gray-400">状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zaHaoRecords?.slice(0, 50).map((za) => (
                      <TableRow key={za.id} className="border-gray-700">
                        <TableCell className="text-white font-mono">{za.zaNo}</TableCell>
                        <TableCell className="text-gray-300 font-mono">{za.bundleNo}</TableCell>
                        <TableCell className="text-gray-300">{za.bedNo}</TableCell>
                        <TableCell className="text-gray-300">{za.colorName}</TableCell>
                        <TableCell className="text-gray-300">{za.sizeName}</TableCell>
                        <TableCell className="text-gray-300">{za.layerStart}-{za.layerEnd}</TableCell>
                        <TableCell className="text-right text-white">{za.quantity}</TableCell>
                        <TableCell>
                          <Badge className={zaStatusColors[za.status]}>{za.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {zaHaoRecords.length > 50 && (
                  <div className="text-center text-gray-500 text-sm">仅显示前50条</div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
