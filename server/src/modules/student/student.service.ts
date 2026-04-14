import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../entities/student.entity';
import { Parent } from '../../entities/parent.entity';
import { Class } from '../../entities/class.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Parent)
    private parentRepo: Repository<Parent>,
    @InjectRepository(Class)
    private classRepo: Repository<Class>,
  ) {}

  /** 验证班级归属 */
  private async verifyClassOwnership(teacherId: number, classId: number) {
    return this.classRepo.findOne({
      where: { id: classId, teacher_id: teacherId, is_archived: false },
    });
  }

  /** 获取班级的学生列表（含家长信息） */
  async listByClass(teacherId: number, classId: number) {
    const classEntity = await this.verifyClassOwnership(teacherId, classId);
    if (!classEntity) {
      return null;
    }

    const students = await this.studentRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.classEntity', 'c')
      .where('s.class_id = :classId', { classId })
      .orderBy('s.student_no', 'ASC')
      .getMany();

    // 查询所有学生的家长信息
    const studentIds = students.map((s) => s.id);
    let parentsMap: Record<number, Parent> = {};
    if (studentIds.length > 0) {
      const parents = await this.parentRepo
        .createQueryBuilder('p')
        .where('p.student_id IN (:...studentIds)', { studentIds })
        .getMany();
      parentsMap = parents.reduce(
        (map, p) => {
          map[p.student_id] = p;
          return map;
        },
        {} as Record<number, Parent>,
      );
    }

    return students.map((s) => {
      const parent = parentsMap[s.id];
      return {
        id: s.id,
        student_no: s.student_no,
        name: s.name,
        gender: s.gender,
        birth_date: s.birth_date,
        class_id: s.class_id,
        parent_name: parent?.name || null,
        parent_phone: parent?.phone || null,
        created_at: s.created_at,
        updated_at: s.updated_at,
      };
    });
  }

  /** 获取单个学生详情（含班级名和家长信息） */
  async detail(teacherId: number, studentId: number) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['classEntity'],
    });
    if (!student) return null;

    const classEntity = await this.verifyClassOwnership(teacherId, student.class_id);
    if (!classEntity) return null;

    const parent = await this.parentRepo.findOne({ where: { student_id: studentId } });

    return {
      id: student.id,
      student_no: student.student_no,
      name: student.name,
      gender: student.gender,
      birth_date: student.birth_date,
      class_id: student.class_id,
      class_name: student.classEntity?.name || null,
      parent_name: parent?.name || null,
      parent_phone: parent?.phone || null,
      created_at: student.created_at,
      updated_at: student.updated_at,
    };
  }

  /** 创建学生 */
  async create(teacherId: number, dto: CreateStudentDto) {
    const classEntity = await this.verifyClassOwnership(teacherId, dto.class_id);
    if (!classEntity) {
      return null;
    }

    // 检查同班级下学号是否重复
    const existing = await this.studentRepo.findOne({
      where: { class_id: dto.class_id, student_no: dto.student_no },
    });
    if (existing) {
      return 'duplicate';
    }

    // 创建学生
    const student = this.studentRepo.create({
      class_id: dto.class_id,
      name: dto.name,
      student_no: dto.student_no,
      gender: dto.gender,
    });
    const savedStudent = await this.studentRepo.save(student);

    // 如果提供了家长信息，创建家长记录
    if (dto.parent_name && dto.parent_phone) {
      const parent = this.parentRepo.create({
        name: dto.parent_name,
        phone: dto.parent_phone,
        student_id: savedStudent.id,
      });
      await this.parentRepo.save(parent);
    }

    // 更新班级学生人数
    await this.classRepo.increment({ id: dto.class_id }, 'student_count', 1);

    return savedStudent;
  }

  /** 更新学生信息 */
  async update(teacherId: number, dto: UpdateStudentDto) {
    const student = await this.studentRepo.findOne({
      where: { id: dto.id },
    });
    if (!student) {
      return null;
    }

    // 验证班级归属
    const classEntity = await this.verifyClassOwnership(teacherId, student.class_id);
    if (!classEntity) {
      return null;
    }

    // 如果修改了学号，检查是否重复
    if (dto.student_no && dto.student_no !== student.student_no) {
      const existing = await this.studentRepo.findOne({
        where: { class_id: student.class_id, student_no: dto.student_no },
      });
      if (existing && existing.id !== dto.id) {
        return 'duplicate';
      }
    }

    // 更新学生基本信息
    const updateData: Partial<Student> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.student_no !== undefined) updateData.student_no = dto.student_no;
    if (dto.gender !== undefined) updateData.gender = dto.gender;

    if (Object.keys(updateData).length > 0) {
      await this.studentRepo.update(dto.id, updateData);
    }

    // 更新家长信息
    if (dto.parent_name !== undefined || dto.parent_phone !== undefined) {
      const parent = await this.parentRepo.findOne({
        where: { student_id: dto.id },
      });
      if (parent) {
        const parentUpdate: Partial<Parent> = {};
        if (dto.parent_name !== undefined) parentUpdate.name = dto.parent_name;
        if (dto.parent_phone !== undefined) parentUpdate.phone = dto.parent_phone;
        await this.parentRepo.update(parent.id, parentUpdate);
      } else if (dto.parent_name && dto.parent_phone) {
        // 如果没有家长记录但提供了完整信息，则创建
        const newParent = this.parentRepo.create({
          name: dto.parent_name,
          phone: dto.parent_phone,
          student_id: dto.id,
        });
        await this.parentRepo.save(newParent);
      }
    }

    return this.studentRepo.findOne({ where: { id: dto.id } });
  }

  /** 删除学生 */
  async remove(teacherId: number, id: number) {
    const student = await this.studentRepo.findOne({
      where: { id },
    });
    if (!student) {
      return false;
    }

    // 验证班级归属
    const classEntity = await this.verifyClassOwnership(teacherId, student.class_id);
    if (!classEntity) {
      return false;
    }

    // 删除关联的家长记录
    await this.parentRepo.delete({ student_id: id });

    // 删除学生
    await this.studentRepo.delete(id);

    // 更新班级学生人数
    await this.classRepo.decrement({ id: student.class_id }, 'student_count', 1);

    return true;
  }
}
