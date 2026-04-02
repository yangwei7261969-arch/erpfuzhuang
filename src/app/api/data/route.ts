import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 数据文件路径 - 生产环境用 /tmp，开发环境用项目目录
const getDataPath = () => {
  const isProd = process.env.COZE_PROJECT_ENV === 'PROD';
  if (isProd) {
    return '/tmp/erp-data.json';
  }
  return path.join(process.env.COZE_WORKSPACE_PATH || '/workspace/projects', 'data', 'erp-data.json');
};

// 确保目录存在
const ensureDir = (filePath: string) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// GET - 读取所有数据
export async function GET() {
  try {
    const dataPath = getDataPath();
    
    if (!fs.existsSync(dataPath)) {
      // 文件不存在，返回空数据
      return NextResponse.json({ success: true, data: null, exists: false });
    }
    
    const content = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(content);
    
    return NextResponse.json({ success: true, data, exists: true });
  } catch (error) {
    console.error('读取数据失败:', error);
    return NextResponse.json(
      { success: false, error: '读取数据失败' },
      { status: 500 }
    );
  }
}

// POST - 保存所有数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dataPath = getDataPath();
    
    ensureDir(dataPath);
    
    // 添加保存时间戳
    const dataToSave = {
      ...body,
      _savedAt: new Date().toISOString(),
      _version: '2.0.0'
    };
    
    fs.writeFileSync(dataPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    
    return NextResponse.json({ 
      success: true, 
      message: '数据保存成功',
      savedAt: dataToSave._savedAt
    });
  } catch (error) {
    console.error('保存数据失败:', error);
    return NextResponse.json(
      { success: false, error: '保存数据失败' },
      { status: 500 }
    );
  }
}

// DELETE - 清除所有数据
export async function DELETE() {
  try {
    const dataPath = getDataPath();
    
    if (fs.existsSync(dataPath)) {
      fs.unlinkSync(dataPath);
    }
    
    return NextResponse.json({ success: true, message: '数据已清除' });
  } catch (error) {
    console.error('清除数据失败:', error);
    return NextResponse.json(
      { success: false, error: '清除数据失败' },
      { status: 500 }
    );
  }
}
