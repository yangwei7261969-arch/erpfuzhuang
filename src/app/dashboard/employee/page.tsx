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
import {
  Users,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  RotateCcw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  type Employee,
  type Team,
  getEmployees,
  getTeams,
  initEmployeeData,
} from '@/types/employee';

export default function EmployeePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState('employees');
  
  const [searchTeam, setSearchTeam] = useState('全部');
  const [searchStatus, setSearchStatus] = useState('全部');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  useEffect(() => {
    initEmployeeData();
    loadData();
  }, []);
  
  const loadData = () => {
    setEmployees(getEmployees());
    setTeams(getTeams());
  };
  
  const filteredEmployees = employees.filter(e => {
    if (searchTeam !== '全部' && e.teamName !== searchTeam) return false;
    if (searchStatus !== '全部' && e.status !== searchStatus) return false;
    if (searchKeyword && !e.name.includes(searchKeyword) && !e.employeeNo.includes(searchKeyword)) return false;
    return true;
  });
  
  const handleReset = () => {
    setSearchTeam('全部');
    setSearchStatus('全部');
    setSearchKeyword('');
  };
  
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === '在职').length,
    teams: teams.length,
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">员工与班组管理</h1>
              <p className="text-muted-foreground text-sm">人事基础、班组配置、计件工资</p>
            </div>
          </div>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />新增员工
          </Button>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">员工总数</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">在职人数</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">班组数量</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.teams}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="employees">员工管理</TabsTrigger>
            <TabsTrigger value="teams">班组管理</TabsTrigger>
          </TabsList>
          
          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <Label>班组</Label>
                    <Select value={searchTeam} onValueChange={setSearchTeam}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部</SelectItem>
                        {teams.map(t => (
                          <SelectItem key={t.id} value={t.teamName}>{t.teamName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>状态</Label>
                    <Select value={searchStatus} onValueChange={setSearchStatus}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部</SelectItem>
                        <SelectItem value="在职">在职</SelectItem>
                        <SelectItem value="离职">离职</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>搜索</Label>
                    <Input placeholder="工号/姓名" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="mt-1" />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button onClick={loadData}>查询</Button>
                    <Button variant="outline" onClick={handleReset}><RotateCcw className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>工号</TableHead>
                        <TableHead>姓名</TableHead>
                        <TableHead>性别</TableHead>
                        <TableHead>班组</TableHead>
                        <TableHead>岗位</TableHead>
                        <TableHead>工资等级</TableHead>
                        <TableHead>保底工资</TableHead>
                        <TableHead>入职日期</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="w-20">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                            暂无员工数据
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEmployees.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell className="font-medium">{e.employeeNo}</TableCell>
                            <TableCell>{e.name}</TableCell>
                            <TableCell>{e.gender}</TableCell>
                            <TableCell>{e.teamName}</TableCell>
                            <TableCell>{e.position}</TableCell>
                            <TableCell>{e.wageLevel}</TableCell>
                            <TableCell className="text-right">¥{e.baseWage}</TableCell>
                            <TableCell>{e.entryDate}</TableCell>
                            <TableCell>
                              <Badge className={e.status === '在职' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                {e.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/employee/${e.id}`)} title="查看"><Eye className="w-4 h-4" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/employee/${e.id}/edit`)} title="编辑"><Edit className="w-4 h-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 border-t text-sm text-muted-foreground">
                  共 {filteredEmployees.length} 条
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">班组列表</CardTitle>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />新增班组
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>班组编码</TableHead>
                        <TableHead>班组名称</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>组长</TableHead>
                        <TableHead className="text-center">人数</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="w-20">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teams.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.teamCode}</TableCell>
                          <TableCell>{t.teamName}</TableCell>
                          <TableCell>{t.teamType}</TableCell>
                          <TableCell>{t.leaderName}</TableCell>
                          <TableCell className="text-center">{t.memberCount}</TableCell>
                          <TableCell>
                            <Badge className={t.status === '启用' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
