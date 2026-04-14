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

### 单设备登录
系统采用单设备登录策略，每次登录会生成新 token 并覆盖旧 token（存储在 teachers 表 `current_token` 字段）。旧设备请求时会返回 HTTP 401：
```json
{ "code": 401, "message": "账号已在其他设备登录，请重新登录", "data": null }
```

### Token 失效处理
以下情况会返回 **HTTP 401**（非 200）：
- Token 过期或无效
- 账号在其他设备登录（current_token 不匹配）
- 调用 logout 后 token 被清除

前端收到 401 后应清除本地缓存并跳转到登录页。

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
      "subject": null,
      "teaching_years": null
    }
  }
}
```

### 1.3 退出登录

**POST** `/api/auth/logout`（需登录）

**请求参数：** 无（通过 Token 识别用户）

**成功响应：**
```json
{
  "code": 200,
  "message": "退出成功",
  "data": null
}
```

> 退出后会清除服务端的 current_token，使当前 token 失效。

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
    "teaching_years": 5,
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
| subject | string | 否 | 科目（多科目用逗号分隔，如"语文,数学"） |
| teaching_years | int | 否 | 教龄（年），最小值0 |

**请求示例：**
```json
{
  "school": "阳光小学",
  "subject": "语文,数学",
  "teaching_years": 5
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

## 3. 班级模块 `/class`（需登录）

### 3.1 获取班级列表
**POST** `/api/class/list`
**请求参数：** 无（通过 Token 识别用户）

### 3.2 创建班级
**POST** `/api/class/create`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| grade_number | int | 是 | 年级数字（1-6） |
| class_number | int | 是 | 班级序号 |

### 3.3 更新班级
**POST** `/api/class/update`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 班级ID |
| grade_number | int | 否 | 年级数字 |
| class_number | int | 否 | 班级序号 |

### 3.4 删除班级
**POST** `/api/class/delete`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 班级ID |

---

## 4. 学期模块 `/semester`（需登录）

### 4.1 获取学期列表
**POST** `/api/semester/list`

### 4.2 创建学期
**POST** `/api/semester/create`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 学期名称 |
| start_date | string | 是 | 开始日期 |
| end_date | string | 是 | 结束日期 |
| weeks_count | int | 是 | 总周数 |

### 4.3 更新学期
**POST** `/api/semester/update`

### 4.4 设置活跃学期
**POST** `/api/semester/set-active`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 学期ID |

### 4.5 归档学期
**POST** `/api/semester/archive`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 学期ID |

### 4.6 删除学期
**POST** `/api/semester/delete`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 学期ID |

---

## 5. 学生模块 `/student`（需登录）

### 5.1 获取学生列表
**POST** `/api/student/list`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_id | int | 是 | 班级ID |

### 5.2 创建学生
**POST** `/api/student/create`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| student_no | string | 是 | 学号 |
| name | string | 是 | 姓名 |
| gender | string | 是 | 性别 |
| birth_date | string | 否 | 出生日期 |
| class_id | int | 是 | 班级ID |

### 5.3 更新学生
**POST** `/api/student/update`

### 5.4 删除学生
**POST** `/api/student/delete`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 学生ID |

### 5.5 获取学生详情
**POST** `/api/student/detail`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 学生ID |

**成功响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "student_no": "001",
    "name": "张三",
    "gender": "男",
    "birth_date": null,
    "class_id": 1,
    "class_name": "三年级1班",
    "parent_name": "张父",
    "parent_phone": "13800000001",
    "created_at": "2026-04-01T10:00:00.000Z",
    "updated_at": "2026-04-01T10:00:00.000Z"
  }
}
```

---

## 6. 课程表模块 `/course`（需登录）

### 6.1 获取课程列表
**POST** `/api/course/list`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| semester_id | int | 是 | 学期ID |
| class_id | int | 是 | 班级ID |

### 6.2 创建课程
**POST** `/api/course/create`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_id | int | 是 | 班级ID |
| semester_id | int | 是 | 学期ID |
| weekday | int | 是 | 星期几（1-7） |
| period | int | 是 | 第几节课 |
| subject | string | 是 | 科目 |
| room | string | 否 | 教室 |

### 6.3 更新课程
**POST** `/api/course/update`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 课程ID |
| weekday | int | 否 | 星期几 |
| period | int | 否 | 第几节课 |
| subject | string | 否 | 科目 |
| room | string | 否 | 教室 |

### 6.4 删除课程
**POST** `/api/course/delete`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 课程ID |

### 6.5 获取今日我的课程
**POST** `/api/course/my-today`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| semester_id | int | 否 | 学期ID（可选筛选） |

### 6.6 批量创建课程
**POST** `/api/course/batch-create`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_id | int | 是 | 班级ID |
| semester_id | int | 是 | 学期ID |
| items | array | 是 | 课程数组 [{weekday, period, subject, room?}] |

---

## 7. 考勤模块 `/attendance`（需登录）

### 7.1 获取考勤记录
**POST** `/api/attendance/list`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_id | int | 是 | 班级ID |
| date | string | 是 | 日期（YYYY-MM-DD） |

### 7.2 批量保存考勤
**POST** `/api/attendance/batch-save`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_id | int | 是 | 班级ID |
| date | string | 是 | 日期 |
| items | array | 是 | [{student_id, status, remark?}] |

status 可选值：出勤 / 迟到 / 早退 / 请假 / 缺席

### 7.3 学生考勤统计
**POST** `/api/attendance/student-stats`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| student_id | int | 是 | 学生ID |
| start_date | string | 是 | 开始日期 |
| end_date | string | 是 | 结束日期 |

### 7.4 班级考勤统计
**POST** `/api/attendance/class-stats`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_id | int | 是 | 班级ID |
| date | string | 是 | 日期 |

---

## 8. 考试模块 `/exam`（需登录）

### 8.1 获取考试列表
**POST** `/api/exam/list`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_id | int | 是 | 班级ID |

### 8.2 创建考试
**POST** `/api/exam/create`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 考试名称 |
| subject | string | 是 | 科目 |
| date | string | 是 | 考试日期 |
| full_score | int | 否 | 满分（默认100） |
| class_id | int | 是 | 班级ID |

### 8.3 更新考试
**POST** `/api/exam/update`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 考试ID |
| name | string | 否 | 考试名称 |
| subject | string | 否 | 科目 |
| date | string | 否 | 考试日期 |
| full_score | int | 否 | 满分 |

### 8.4 删除考试
**POST** `/api/exam/delete`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 考试ID |

### 8.5 获取考试详情（含学生成绩）
**POST** `/api/exam/detail`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 考试ID |

**成功响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "name": "第一单元测试",
    "subject": "语文",
    "date": "2026-04-10",
    "full_score": 100,
    "class_id": 1,
    "class_name": "三年级1班",
    "students": [
      {
        "student_id": 1,
        "student_no": "001",
        "student_name": "张三",
        "score": 95
      },
      {
        "student_id": 2,
        "student_no": "002",
        "student_name": "李四",
        "score": null
      }
    ]
  }
}
```

> `score` 为 null 表示尚未录入成绩。`class_name` 为该考试所属班级名称。

---

## 9. 成绩模块 `/score`（需登录）

### 9.1 批量录入成绩
**POST** `/api/score/batch-save`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| exam_id | int | 是 | 考试ID |
| items | array | 是 | [{student_id, score}] |

### 9.2 考试统计
**POST** `/api/score/stats`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| exam_id | int | 是 | 考试ID |

**返回数据：** 平均分、最高分、最低分、分数段分布（90-100/80-89/70-79/60-69/60以下）、及格率、优秀率

### 9.3 获取学生成绩
**POST** `/api/score/student-scores`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| student_id | int | 是 | 学生ID |
| class_id | int | 是 | 班级ID |

---

## 10. 作业模块 `/homework`（需登录）

### 10.1 获取作业列表
**POST** `/api/homework/list`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_id | int | 是 | 班级ID |
| page | int | 否 | 页码（默认1） |
| pageSize | int | 否 | 每页条数（默认20） |

### 10.2 发布作业
**POST** `/api/homework/create`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_id | int | 是 | 班级ID |
| subject | string | 是 | 科目 |
| content | string | 是 | 作业内容 |
| deadline | string | 是 | 截止日期 |

### 10.3 更新作业
**POST** `/api/homework/update`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 作业ID |
| subject | string | 否 | 科目 |
| content | string | 否 | 作业内容 |
| deadline | string | 否 | 截止日期 |

### 10.4 删除作业
**POST** `/api/homework/delete`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 作业ID |

### 10.5 获取作业详情（含提交情况）
**POST** `/api/homework/detail`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 作业ID |

**成功响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "class_id": 1,
    "class_name": "三年级1班",
    "subject": "语文",
    "content": "完成课后练习第1-3题",
    "deadline": "2026-04-15",
    "created_at": "...",
    "updated_at": "...",
    "records": [
      {
        "id": 1,
        "student_id": 1,
        "student_name": "张三",
        "student_no": "001",
        "status": "已交",
        "grade": "优"
      },
      {
        "id": 2,
        "student_id": 2,
        "student_name": "李四",
        "student_no": "002",
        "status": "未交",
        "grade": null
      }
    ]
  }
}
```

> `grade` 可选值：优/良/中/差，null 表示未评分。

### 10.6 批量更新提交状态与评分
**POST** `/api/homework/record-save`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| homework_id | int | 是 | 作业ID |
| items | array | 是 | [{student_id, status, grade?}] |

**items 字段说明：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| student_id | int | 是 | 学生ID |
| status | string | 是 | 提交状态：已交/未交/迟交 |
| grade | string | 否 | 评分：优/良/中/差 |

### 10.7 作业完成率统计
**POST** `/api/homework/stats`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| homework_id | int | 是 | 作业ID |

---

## 11. 通知模块 `/notice`（需登录）

### 11.1 获取通知列表
**POST** `/api/notice/list`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_id | int | 否 | 班级ID（可选筛选） |

### 11.2 发布通知
**POST** `/api/notice/create`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 通知标题 |
| content | string | 是 | 通知内容 |
| type | string | 否 | 通知类型：普通通知/放假通知/活动通知/紧急通知 |
| class_id | int | 是 | 目标班级ID |

### 11.3 更新通知
**POST** `/api/notice/update`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 通知ID |
| title | string | 否 | 标题 |
| content | string | 否 | 内容 |
| type | string | 否 | 通知类型 |

### 11.4 删除通知
**POST** `/api/notice/delete`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 通知ID |

### 11.5 获取通知详情（含已读统计）
**POST** `/api/notice/detail`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 通知ID |

**返回数据：** 通知内容 + read_count + total_parents + unread_count

---

## 12. 请假模块 `/leave`（需登录）

### 12.1 获取请假列表
**POST** `/api/leave/list`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_id | int | 是 | 班级ID |
| status | string | 否 | 状态筛选：待审批/已批准/已拒绝 |

### 12.2 创建请假申请
**POST** `/api/leave/create`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| student_id | int | 是 | 学生ID |
| class_id | int | 是 | 班级ID |
| parent_id | int | 否 | 家长ID |
| start_date | string | 是 | 开始日期 |
| end_date | string | 是 | 结束日期 |
| reason | string | 是 | 请假原因 |

### 12.3 获取请假详情
**POST** `/api/leave/detail`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 请假ID |

### 12.4 批准请假
**POST** `/api/leave/approve`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 请假ID |

### 12.5 拒绝请假
**POST** `/api/leave/reject`
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 请假ID |

---

## 开发进度

| 模块 | 接口 | 状态 |
|------|------|------|
| 认证 | POST /api/auth/register | ✅ 已完成 |
| 认证 | POST /api/auth/login | ✅ 已完成 |
| 认证 | POST /api/auth/logout | ✅ 已完成 |
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
| 学生 | POST /api/student/detail | ✅ 已完成 |
| 课程 | POST /api/course/list | ✅ 已完成 |
| 课程 | POST /api/course/create | ✅ 已完成 |
| 课程 | POST /api/course/update | ✅ 已完成 |
| 课程 | POST /api/course/delete | ✅ 已完成 |
| 课程 | POST /api/course/my-today | ✅ 已完成 |
| 课程 | POST /api/course/batch-create | ✅ 已完成 |
| 考勤 | POST /api/attendance/list | ✅ 已完成 |
| 考勤 | POST /api/attendance/batch-save | ✅ 已完成 |
| 考勤 | POST /api/attendance/student-stats | ✅ 已完成 |
| 考勤 | POST /api/attendance/class-stats | ✅ 已完成 |
| 考试 | POST /api/exam/list | ✅ 已完成 |
| 考试 | POST /api/exam/create | ✅ 已完成 |
| 考试 | POST /api/exam/update | ✅ 已完成 |
| 考试 | POST /api/exam/delete | ✅ 已完成 |
| 考试 | POST /api/exam/detail | ✅ 已完成 |
| 成绩 | POST /api/score/batch-save | ✅ 已完成 |
| 成绩 | POST /api/score/stats | ✅ 已完成 |
| 成绩 | POST /api/score/student-scores | ✅ 已完成 |
| 作业 | POST /api/homework/list | ✅ 已完成 |
| 作业 | POST /api/homework/create | ✅ 已完成 |
| 作业 | POST /api/homework/update | ✅ 已完成 |
| 作业 | POST /api/homework/delete | ✅ 已完成 |
| 作业 | POST /api/homework/detail | ✅ 已完成 |
| 作业 | POST /api/homework/record-save | ✅ 已完成 |
| 作业 | POST /api/homework/stats | ✅ 已完成 |
| 通知 | POST /api/notice/list | ✅ 已完成 |
| 通知 | POST /api/notice/create | ✅ 已完成 |
| 通知 | POST /api/notice/update | ✅ 已完成 |
| 通知 | POST /api/notice/delete | ✅ 已完成 |
| 通知 | POST /api/notice/detail | ✅ 已完成 |
| 请假 | POST /api/leave/list | ✅ 已完成 |
| 请假 | POST /api/leave/create | ✅ 已完成 |
| 请假 | POST /api/leave/detail | ✅ 已完成 |
| 请假 | POST /api/leave/approve | ✅ 已完成 |
| 请假 | POST /api/leave/reject | ✅ 已完成 |
