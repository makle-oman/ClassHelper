# ClassHelper API 接口文档

> 基础地址: `http://<服务器IP>:3000/api`
> 所有接口统一使用 **POST** 方法
> 请求体格式: `application/json`

## 统一响应格式

```json
{
  "code": 200,        // 200=成功，0=失败
  "message": "操作成功",
  "data": {}         // 业务数据
}
```

## 认证说明

需要登录的接口，请在请求头中携带 Token：
```
Authorization: Bearer <token>
```

---

## 1. 认证模块 `/auth`

### 1.1 教师注册

**POST** `/api/auth/register`

**请求参数：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号（11位） |
| password | string | 是 | 密码（至少6位） |
| name | string | 是 | 姓名 |

**请求示例：**
```json
{
  "phone": "13800138000",
  "password": "123456",
  "name": "张老师"
}
```

**成功响应：**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "teacher": {
      "id": 1,
      "phone": "13800138000",
      "name": "张老师"
    }
  }
}
```

**失败响应：**
```json
{
  "code": 0,
  "message": "该手机号已注册",
  "data": null
}
```

---

### 1.2 教师登录

**POST** `/api/auth/login`

**请求参数：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号 |
| password | string | 是 | 密码 |

**请求示例：**
```json
{
  "phone": "13800138000",
  "password": "123456"
}
```

**成功响应：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "teacher": {
      "id": 1,
      "phone": "13800138000",
      "name": "张老师",
      "avatar": null,
      "school": null,
      "subject": null
    }
  }
}
```

---

## 2. 教师模块 `/teacher`（需登录）

### 2.1 获取个人信息

**POST** `/api/teacher/profile`

**请求参数：** 无（通过 Token 识别用户）

**成功响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "phone": "13800138000",
    "name": "张老师",
    "avatar": null,
    "school": "阳光小学",
    "subject": "数学",
    "created_at": "2026-03-25T10:00:00.000Z",
    "updated_at": "2026-03-25T10:00:00.000Z"
  }
}
```

---

### 2.2 更新个人信息

**POST** `/api/teacher/update`

**请求参数：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 姓名 |
| avatar | string | 否 | 头像 URL |
| school | string | 否 | 学校 |
| subject | string | 否 | 科目 |

**请求示例：**
```json
{
  "school": "阳光小学",
  "subject": "数学"
}
```

**成功响应：** 同 2.1，返回更新后的个人信息

---

### 2.3 修改密码

**POST** `/api/teacher/change-password`

**请求参数：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | 是 | 旧密码 |
| newPassword | string | 是 | 新密码（至少6位） |

**请求示例：**
```json
{
  "oldPassword": "123456",
  "newPassword": "654321"
}
```

**成功响应：**
```json
{
  "code": 200,
  "message": "密码修改成功",
  "data": null
}
```

---

## 开发进度

| 模块 | 接口 | 状态 |
|------|------|------|
| 认证 | POST /api/auth/register | ✅ 已完成 |
| 认证 | POST /api/auth/login | ✅ 已完成 |
| 教师 | POST /api/teacher/profile | ✅ 已完成 |
| 教师 | POST /api/teacher/update | ✅ 已完成 |
| 教师 | POST /api/teacher/change-password | ✅ 已完成 |
| 班级 | POST /api/class/list | ✅ 已完成 |
| 班级 | POST /api/class/create | ✅ 已完成 |
| 班级 | POST /api/class/update | ✅ 已完成 |
| 班级 | POST /api/class/delete | ✅ 已完成 |
| 学期 | POST /api/semester/list | ✅ 已完成 |
| 学期 | POST /api/semester/create | ✅ 已完成 |
| 学期 | POST /api/semester/update | ✅ 已完成 |
| 学期 | POST /api/semester/set-active | ✅ 已完成 |
| 学期 | POST /api/semester/archive | ✅ 已完成 |
| 学期 | POST /api/semester/delete | ✅ 已完成 |
| 学生 | POST /api/student/list | ✅ 已完成 |
| 学生 | POST /api/student/create | ✅ 已完成 |
| 学生 | POST /api/student/update | ✅ 已完成 |
| 学生 | POST /api/student/delete | ✅ 已完成 |
| 课程 | 待开发 | ⬜ |
| 考勤 | 待开发 | ⬜ |
| 成绩 | 待开发 | ⬜ |
| 作业 | 待开发 | ⬜ |
| 通知 | 待开发 | ⬜ |
| 请假 | 待开发 | ⬜ |
