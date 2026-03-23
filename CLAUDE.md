# ClassHelper - 教师助手 APP

## 项目概述
面向小学教师的教学管理工具（班级、学生、课程、成绩、考勤等），后续扩展家长端。

## 技术栈
- **前端**: React Native 0.83 + Expo 55 + Expo Router（TypeScript）
- **后端**: NestJS 11（TypeScript）
- **数据库**: MySQL + TypeORM（计划中，尚未集成）
- **部署**: 自有服务器 + Nginx + PM2

## 项目结构
```
class/
├── app/                    # React Native 前端（Expo）
│   ├── app/                # Expo Router 页面
│   │   ├── (auth)/         # 登录、注册
│   │   ├── (tabs)/         # 5 个主 Tab 页面
│   │   │   ├── index.tsx       # 首页（快捷操作、今日课程、待办）
│   │   │   ├── schedule.tsx    # 课程表（周视图）
│   │   │   ├── students.tsx    # 学生花名册
│   │   │   ├── scores.tsx      # 成绩管理
│   │   │   └── profile.tsx     # 我的（个人中心）
│   │   ├── attendance.tsx      # 考勤
│   │   ├── homework.tsx        # 作业管理
│   │   ├── notices.tsx         # 通知公告
│   │   ├── class-manage.tsx    # 班级管理
│   │   ├── semester.tsx        # 学期管理
│   │   ├── promotion.tsx       # 年级升迁
│   │   ├── leave-approval.tsx  # 请假审批
│   │   ├── settings.tsx        # 设置
│   │   ├── student/[id].tsx    # 学生详情
│   │   └── exam/[id].tsx       # 考试详情
│   └── src/
│       ├── theme/colors.ts     # 主题色系（亮/暗模式，主色 #4CC590）
│       └── services/           # 课前提醒通知等服务
├── server/                 # NestJS 后端（骨架阶段）
│   └── src/
│       ├── main.ts             # 入口，端口 3000
│       ├── app.module.ts       # 根模块
│       ├── app.controller.ts   # 目前只有 GET /
│       └── app.service.ts      # Hello World
└── docs/
    └── requirements.md     # 完整需求文档（14 张数据表设计）
```

## 当前开发状态
- **前端**: UI 基本完成（10+ 页面），全部使用 Mock 数据，未对接 API
- **后端**: 仅有 NestJS 骨架，无实际 API/数据库/认证

## 待实现（按优先级）
1. 后端数据库集成（MySQL + TypeORM entities）
2. JWT 认证模块
3. 各业务 API（班级/学生/课程/考勤/成绩/作业/通知）
4. 前端对接后端 API（替换 Mock 数据）
5. Excel 导入功能（学生/成绩批量导入）

## 数据库设计（14 张表）
teachers, classes, students, parents, courses, semesters, attendance, exams, scores, homework, homework_records, notices, notice_reads, leave_requests
> 详见 docs/requirements.md

## 开发命令
```bash
# 前端
cd app && npm start           # Expo 开发服务器
cd app && npm run android     # Android
cd app && npm run ios         # iOS
cd app && npm run web         # Web

# 后端
cd server && npm run start:dev   # 开发模式（热重载）
cd server && npm run start:prod  # 生产模式
cd server && npm test            # 测试
```

## 编码约定
- 语言：TypeScript（前后端统一）
- 前端主题色：#4CC590（绿色），支持亮/暗模式
- 前端使用 Expo Router 文件路由
- 后端遵循 NestJS 模块化架构（Module/Controller/Service/Entity）
- 用户交互语言：中文
