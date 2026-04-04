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
import { 
  Plus, 
  Pencil, 
  Trash2, 
  CheckCircle, 
  Eye, 
  Download, 
  XCircle,
  Send,
  Search,
  RotateCcw,
  FileText,
  Layers,
  TrendingUp
} from 'lucide-react';
import { 
  initBOMData, 
  getBOMs, 
  deleteBOM, 
  auditBOM, 
  cancelBOM,
  rejectBOM,
  submitBOMAudit,
  type BOM,
  type BOMStatus 
} from '@/types/bom';
import { getCurrentUser, type CurrentUser } from '@/types/user';
import BOMDetailDialog from '@/components/bom/BOMDetailDialog';

const statusColors: Record<BOMStatus, string> = {
  '草稿': 'bg-gray-600 text-gray-200',
  '待审核': 'bg-yellow-600 text-white',
  '已审核': 'bg-blue-600 text-white',
  '已生效': 'bg-green-600 text-white',
  '已作废': 'bg-red-900 text-red-200',
};

export default function BOMPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [boms, setBOMs] = useState<BOM[]>([]);
  const [filteredBOMs, setFilteredBOMs] = useState<BOM[]>([]);
  
  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [searchBOMNo, setSearchBOMNo] = useState('');
  const [searchStyleNo, setSearchStyleNo] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('全部');
  
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [viewingBOM, setViewingBOM] = useState<BOM | null>(null);
  
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    initBOMData();
    loadBOMs();
  }, []);

  const loadBOMs = () => {
    const allBOMs = getBOMs();
    allBOMs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setBOMs(allBOMs);
    setFilteredBOMs(allBOMs);
  };

  useEffect(() => {
    let result = boms;
    if (searchOrderNo) result = result.filter(b => b.orderNo.includes(searchOrderNo));
    if (searchBOMNo) result = result.filter(b => b.bomNo.includes(searchBOMNo));
    if (searchStyleNo) result = result.filter(b => b.styleNo.includes(searchStyleNo));
    if (searchCustomer) result = result.filter(b => b.customerName.includes(searchCustomer));
    if (searchStatus !== '全部') result = result.filter(b => b.status === searchStatus);
    setFilteredBOMs(result);
  }, [boms, searchOrderNo, searchBOMNo, searchStyleNo, searchCustomer, searchStatus]);

  const handleResetSearch = () => {
    setSearchOrderNo('');
    setSearchBOMNo('');
    setSearchStyleNo('');
    setSearchCustomer('');
    setSearchStatus('全部');
  };

  const handleAddBOM = () => {
    router.push('/dashboard/bom/form');
  };

  // 导出BOM列表
  const handleExport = () => {
    const headers = ['BOM单号', '订单号', '款号', '品名', '客户', '订单数量', '单件成本', '总成本', '状态', '创建时间'];
    const rows = filteredBOMs.map(b => [
      b.bomNo, b.orderNo, b.styleNo, b.productName, b.customerName,
      b.orderQuantity, (b.pieceCost ?? 0).toFixed(2), (b.totalCost ?? 0).toFixed(2), b.status, b.createdAt
    ]);
    
    const csvContent = [
      'BOM物料清单',
      '导出时间：' + new Date().toLocaleString('zh-CN'),
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BOM清单_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleEditBOM = (bom: BOM) => {
    if (bom.status !== '草稿' && bom.status !== '待审核') {
      showAlert('error', '已生效BOM不可修改');
      return;
    }
    router.push(`/dashboard/bom/form?id=${bom.id}`);
  };

  const handleViewBOM = (bom: BOM) => {
    setViewingBOM(bom);
    setShowDetailDialog(true);
  };

  const handleDeleteBOM = (bom: BOM) => {
    if (bom.status !== '草稿') {
      showAlert('error', '只有草稿状态的BOM可以删除');
      return;
    }
    if (confirm(`确定要删除BOM ${bom.bomNo} 吗？`)) {
      deleteBOM(bom.id);
      loadBOMs();
      showAlert('success', 'BOM删除成功');
    }
  };

  const handleSubmitAudit = (bom: BOM) => {
    if (bom.status !== '草稿') {
      showAlert('error', '只有草稿状态的BOM可以提交审核');
      return;
    }
    submitBOMAudit(bom.id);
    loadBOMs();
    showAlert('success', 'BOM已提交审核');
  };

  const handleApproveBOM = (bom: BOM) => {
    if (bom.status !== '待审核') return;
    if (!currentUser) return;
    auditBOM(bom.id, currentUser.username);
    loadBOMs();
    showAlert('success', 'BOM审核通过，已生效');
  };

  const handleRejectBOM = (bom: BOM) => {
    if (bom.status !== '待审核') return;
    rejectBOM(bom.id);
    loadBOMs();
    showAlert('success', 'BOM已退回');
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertMessage({ type, message });
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const hasPermission = (permission: string) => {
    if (!currentUser) return false;
    return currentUser.permissions.includes('all') || currentUser.permissions.includes(permission);
  };

  // 统计数据
  const stats = {
    total: boms.length,
    draft: boms.filter(b => b.status === '草稿').length,
    pending: boms.filter(b => b.status === '待审核').length,
    effective: boms.filter(b => b.status === '已生效').length,
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto space-y-6">
        {alertMessage && (
          <Alert variant={alertMessage.type === 'error' ? 'destructive' : 'default'} className="border-2 border-gray-600 bg-gray-900">
            <AlertDescription className="text-white">{alertMessage.message}</AlertDescription>
          </Alert>
        )}

        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">BOM管理</h1>
              <p className="text-gray-400 text-sm">物料清单管理，与订单数据完全联动</p>
            </div>
          </div>
          {hasPermission('bom:create') && (
            <Button onClick={handleAddBOM} className="bg-white text-black hover:bg-gray-200 font-medium">
              <Plus className="w-4 h-4 mr-2" />
              新增BOM
            </Button>
          )}
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">BOM总数</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Layers className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">草稿</p>
                  <p className="text-2xl font-bold text-gray-300">{stats.draft}</p>
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-sm">D</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">待审核</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-900 rounded-full flex items-center justify-center">
                  <span className="text-yellow-400 text-sm">P</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">已生效</p>
                  <p className="text-2xl font-bold text-green-400">{stats.effective}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 查询区域 */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Label className="text-gray-400">关联订单号</Label>
                <Input
                  placeholder="请输入订单号"
                  value={searchOrderNo}
                  onChange={(e) => setSearchOrderNo(e.target.value)}
                  className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <Label className="text-gray-400">BOM编号</Label>
                <Input
                  placeholder="请输入BOM编号"
                  value={searchBOMNo}
                  onChange={(e) => setSearchBOMNo(e.target.value)}
                  className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <Label className="text-gray-400">款号</Label>
                <Input
                  placeholder="请输入款号"
                  value={searchStyleNo}
                  onChange={(e) => setSearchStyleNo(e.target.value)}
                  className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <Label className="text-gray-400">客户名称</Label>
                <Input
                  placeholder="请输入客户名称"
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                  className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <Label className="text-gray-400">BOM状态</Label>
                <Select value={searchStatus} onValueChange={setSearchStatus}>
                  <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">全部</SelectItem>
                    <SelectItem value="草稿">草稿</SelectItem>
                    <SelectItem value="待审核">待审核</SelectItem>
                    <SelectItem value="已审核">已审核</SelectItem>
                    <SelectItem value="已生效">已生效</SelectItem>
                    <SelectItem value="已作废">已作废</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={handleResetSearch} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <RotateCcw className="w-4 h-4 mr-2" />
                重置
              </Button>
              <Button className="bg-white text-black hover:bg-gray-200">
                <Search className="w-4 h-4 mr-2" />
                查询
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* BOM列表 - 桌面端表格 */}
        <Card className="bg-gray-900 border-gray-700 hidden lg:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800">
                    <TableHead className="text-gray-400 w-12">序号</TableHead>
                    <TableHead className="text-gray-400">BOM编号</TableHead>
                    <TableHead className="text-gray-400">关联订单号</TableHead>
                    <TableHead className="text-gray-400">款号</TableHead>
                    <TableHead className="text-gray-400">产品名称</TableHead>
                    <TableHead className="text-gray-400">客户名称</TableHead>
                    <TableHead className="text-gray-400 text-right">订单数量</TableHead>
                    <TableHead className="text-gray-400 text-right">单件成本</TableHead>
                    <TableHead className="text-gray-400">状态</TableHead>
                    <TableHead className="text-gray-400">创建人</TableHead>
                    <TableHead className="text-gray-400">创建时间</TableHead>
                    <TableHead className="text-gray-400 w-36">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBOMs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-12 text-gray-500">
                        暂无BOM数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBOMs.map((bom, index) => (
                      <TableRow key={bom.id} className="border-gray-700 hover:bg-gray-800">
                        <TableCell className="text-gray-400">{index + 1}</TableCell>
                        <TableCell className="text-white font-medium">{bom.bomNo}</TableCell>
                        <TableCell className="text-gray-300">{bom.orderNo}</TableCell>
                        <TableCell className="text-gray-300">{bom.styleNo}</TableCell>
                        <TableCell className="text-gray-300">{bom.productName}</TableCell>
                        <TableCell className="text-gray-300">{bom.customerName}</TableCell>
                        <TableCell className="text-right text-white">{bom.orderQuantity}</TableCell>
                        <TableCell className="text-right text-green-400 font-medium">¥{(bom.pieceCost ?? 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[bom.status]}>
                            {bom.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">{bom.createdBy}</TableCell>
                        <TableCell className="text-gray-400 text-sm">{bom.createdAt}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleViewBOM(bom)} className="text-gray-400 hover:text-white hover:bg-gray-700">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {hasPermission('bom:create') && bom.status === '草稿' && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleEditBOM(bom)} className="text-gray-400 hover:text-white hover:bg-gray-700">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleSubmitAudit(bom)} className="text-blue-400 hover:text-blue-300 hover:bg-gray-700">
                                  <Send className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {hasPermission('audit:approve') && bom.status === '待审核' && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleApproveBOM(bom)} className="text-green-400 hover:text-green-300 hover:bg-gray-700">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleRejectBOM(bom)} className="text-orange-400 hover:text-orange-300 hover:bg-gray-700">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {hasPermission('bom:delete') && bom.status === '草稿' && (
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteBOM(bom)} className="text-red-400 hover:text-red-300 hover:bg-gray-700">
                                <Trash2 className="w-4 h-4" />
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
              <div className="text-sm text-gray-400">
                共 {filteredBOMs.length} 条BOM
              </div>
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* BOM列表 - 移动端卡片 */}
        <div className="lg:hidden space-y-3">
          {filteredBOMs.length === 0 ? (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="py-12 text-center text-gray-500">
                暂无BOM数据
              </CardContent>
            </Card>
          ) : (
            filteredBOMs.map((bom, index) => (
              <Card key={bom.id} className="bg-gray-900 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-white font-medium">{bom.bomNo}</div>
                      <div className="text-gray-400 text-sm">{bom.orderNo}</div>
                    </div>
                    <Badge className={statusColors[bom.status]}>{bom.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-400">款号：</span>
                      <span className="text-white">{bom.styleNo}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">客户：</span>
                      <span className="text-white">{bom.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">数量：</span>
                      <span className="text-white">{bom.orderQuantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">单件成本：</span>
                      <span className="text-green-400 font-medium">¥{(bom.pieceCost ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap border-t border-gray-700 pt-3">
                    <Button size="sm" variant="outline" onClick={() => handleViewBOM(bom)} className="border-gray-600 text-gray-300">
                      <Eye className="w-4 h-4 mr-1" />查看
                    </Button>
                    {hasPermission('bom:create') && bom.status === '草稿' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEditBOM(bom)} className="border-gray-600 text-gray-300">
                          <Pencil className="w-4 h-4 mr-1" />编辑
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleSubmitAudit(bom)} className="border-blue-600 text-blue-400">
                          <Send className="w-4 h-4 mr-1" />提交
                        </Button>
                      </>
                    )}
                    {hasPermission('audit:approve') && bom.status === '待审核' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleApproveBOM(bom)} className="border-green-600 text-green-400">
                          <CheckCircle className="w-4 h-4 mr-1" />审核
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <div className="text-center text-sm text-gray-400 py-2">
            共 {filteredBOMs.length} 条BOM
          </div>
        </div>
      </div>

      {/* BOM详情弹窗 */}
      {showDetailDialog && viewingBOM && (
        <BOMDetailDialog
          bom={viewingBOM}
          onClose={() => {
            setShowDetailDialog(false);
            setViewingBOM(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
