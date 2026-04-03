'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Eye,
  Calculator,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  History
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  initFinanceData,
  getEmployeeWallet,
  getWalletTransactions,
  addWithdrawalApplication,
  type EmployeeWallet,
  type WalletTransaction,
  type WithdrawalApplication,
} from '@/types/finance';
import { getCurrentUser, type CurrentUser } from '@/types/user';

const transactionTypeLabels: Record<string, string> = {
  '工资解冻': '工资解冻',
  '预支到账': '预支到账',
  '工资抵扣': '工资抵扣',
  '工资提现': '工资提现',
  '报销到账': '报销到账',
  '报销提现': '报销提现',
};

const transactionTypeColors: Record<string, string> = {
  '工资解冻': 'text-green-600',
  '预支到账': 'text-blue-600',
  '工资抵扣': 'text-red-600',
  '工资提现': 'text-orange-600',
  '报销到账': 'text-purple-600',
  '报销提现': 'text-pink-600',
};

export default function WalletPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [wallet, setWallet] = useState<EmployeeWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('银行卡');
  const [accountInfo, setAccountInfo] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
  });

  // 筛选条件
  const [filterType, setFilterType] = useState('全部');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    initFinanceData();
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      loadWalletData(user.id);
    }
  }, []);

  const loadWalletData = (employeeId: string) => {
    const walletData = getEmployeeWallet(employeeId);
    setWallet(walletData);

    const transactionData = getWalletTransactions(employeeId);
    setTransactions(transactionData);
  };

  const handleWithdrawal = async () => {
    if (!currentUser || !wallet) return;

    const amount = Number(withdrawalAmount);
    if (amount <= 0) {
      alert('请输入有效的提现金额');
      return;
    }

    // 检查余额是否足够
    const availableBalance = wallet.availableSalary + wallet.reimbursementBalance - wallet.advanceDebt;
    if (amount > availableBalance) {
      alert('余额不足');
      return;
    }

    try {
      const withdrawal: Omit<WithdrawalApplication, 'id'> = {
        withdrawalNo: `WD${Date.now()}`,
        employeeId: currentUser.id,
        employeeName: currentUser.realName,
        amount,
        method: withdrawalMethod as '银行卡' | '微信' | '支付宝',
        accountInfo,
        status: '待审核',
        transferReceiptImages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addWithdrawalApplication(withdrawal);

      setShowWithdrawalDialog(false);
      setWithdrawalAmount('');
      setAccountInfo({ accountName: '', accountNumber: '', bankName: '' });

      alert('提现申请已提交');
    } catch (error) {
      alert('提交失败，请重试');
    }
  };

  // 筛选后的交易记录
  const filteredTransactions = transactions.filter(transaction => {
    if (filterType !== '全部' && transaction.type !== filterType) return false;
    if (filterDate && !transaction.createdAt.startsWith(filterDate)) return false;
    return true;
  });

  // 计算统计数据
  const stats = {
    totalIncome: transactions
      .filter(t => ['工资解冻', '预支到账', '报销到账'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions
      .filter(t => ['工资抵扣', '工资提现', '报销提现'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0),
    currentBalance: wallet ? wallet.availableSalary + wallet.reimbursementBalance - wallet.advanceDebt : 0,
  };

  if (!wallet) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Wallet className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">加载中...</h3>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">我的钱包</h1>
            <p className="text-muted-foreground">查看余额、交易记录和提现管理</p>
          </div>
          <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                申请提现
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>申请提现</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">提现金额</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">¥</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="请输入提现金额"
                      className="pl-8"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    可用余额：¥{stats.currentBalance.toLocaleString()}
                  </p>
                </div>

                <div>
                  <Label htmlFor="method">提现方式</Label>
                  <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="银行卡">银行卡</SelectItem>
                      <SelectItem value="微信">微信</SelectItem>
                      <SelectItem value="支付宝">支付宝</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {withdrawalMethod === '银行卡' && (
                  <>
                    <div>
                      <Label htmlFor="accountName">开户名</Label>
                      <Input
                        id="accountName"
                        placeholder="请输入开户名"
                        value={accountInfo.accountName}
                        onChange={(e) => setAccountInfo(prev => ({ ...prev, accountName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber">银行卡号</Label>
                      <Input
                        id="accountNumber"
                        placeholder="请输入银行卡号"
                        value={accountInfo.accountNumber}
                        onChange={(e) => setAccountInfo(prev => ({ ...prev, accountNumber: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankName">开户银行</Label>
                      <Input
                        id="bankName"
                        placeholder="请输入开户银行"
                        value={accountInfo.bankName}
                        onChange={(e) => setAccountInfo(prev => ({ ...prev, bankName: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {(withdrawalMethod === '微信' || withdrawalMethod === '支付宝') && (
                  <div>
                    <Label htmlFor="accountName">账户名</Label>
                    <Input
                      id="accountName"
                      placeholder={`请输入${withdrawalMethod}账户名`}
                      value={accountInfo.accountName}
                      onChange={(e) => setAccountInfo(prev => ({ ...prev, accountName: e.target.value }))}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowWithdrawalDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleWithdrawal}>
                    提交申请
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 余额统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">当前余额</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{stats.currentBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                可提现金额
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">工资余额</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{wallet.availableSalary.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                冻结：¥{wallet.frozenSalary.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">报销余额</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{wallet.reimbursementBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                专项报销款
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">预支欠款</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-¥{wallet.advanceDebt.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                待还款金额
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 标签页内容 */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">余额明细</TabsTrigger>
            <TabsTrigger value="transactions">交易记录</TabsTrigger>
            <TabsTrigger value="withdrawals">提现记录</TabsTrigger>
          </TabsList>

          {/* 余额明细 */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>收入统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>工资解冻</span>
                      <span className="font-bold text-green-600">
                        +¥{transactions
                          .filter(t => t.type === '工资解冻')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>预支到账</span>
                      <span className="font-bold text-blue-600">
                        +¥{transactions
                          .filter(t => t.type === '预支到账')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>报销到账</span>
                      <span className="font-bold text-purple-600">
                        +¥{transactions
                          .filter(t => t.type === '报销到账')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center font-bold">
                      <span>总收入</span>
                      <span className="text-green-600">+¥{stats.totalIncome.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>支出统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>工资抵扣</span>
                      <span className="font-bold text-red-600">
                        -¥{transactions
                          .filter(t => t.type === '工资抵扣')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>工资提现</span>
                      <span className="font-bold text-orange-600">
                        -¥{transactions
                          .filter(t => t.type === '工资提现')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>报销提现</span>
                      <span className="font-bold text-pink-600">
                        -¥{transactions
                          .filter(t => t.type === '报销提现')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center font-bold">
                      <span>总支出</span>
                      <span className="text-red-600">-¥{stats.totalExpense.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 交易记录 */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>交易记录</CardTitle>
                  <div className="flex space-x-2">
                    <div>
                      <Label htmlFor="filterType" className="text-sm">交易类型</Label>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="全部">全部</SelectItem>
                          {Object.entries(transactionTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="filterDate" className="text-sm">日期</Label>
                      <Input
                        id="filterDate"
                        type="month"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>交易时间</TableHead>
                      <TableHead>交易类型</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>余额</TableHead>
                      <TableHead>备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={transactionTypeColors[transaction.type]}>
                            {transactionTypeLabels[transaction.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${
                            ['工资解冻', '预支到账', '报销到账'].includes(transaction.type)
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {['工资解冻', '预支到账', '报销到账'].includes(transaction.type) ? '+' : '-'}
                            ¥{transaction.amount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>¥{transaction.balance.toLocaleString()}</TableCell>
                        <TableCell>{transaction.remark}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 提现记录 */}
          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>提现记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">暂无提现记录</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    您的提现申请将在此处显示
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}