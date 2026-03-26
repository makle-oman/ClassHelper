import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '../../entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

const GRADE_NAMES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Class)
    private classRepo: Repository<Class>,
  ) {}

  /** 获取教师的班级列表 */
  async list(teacherId: number) {
    return this.classRepo.find({
      where: { teacher_id: teacherId, is_archived: false },
      order: { grade_number: 'ASC', class_number: 'ASC' },
    });
  }

  /** 创建班级 */
  async create(teacherId: number, dto: CreateClassDto) {
    const grade = GRADE_NAMES[dto.grade_number - 1];
    const name = `${grade}${dto.class_number}班`;

    // 检查是否重复
    const existing = await this.classRepo.findOne({
      where: {
        teacher_id: teacherId,
        grade_number: dto.grade_number,
        class_number: dto.class_number,
        is_archived: false,
      },
    });
    if (existing) {
      return null;
    }

    const classEntity = this.classRepo.create({
      grade,
      grade_number: dto.grade_number,
      class_number: dto.class_number,
      name,
      teacher_id: teacherId,
    });

    return this.classRepo.save(classEntity);
  }

  /** 更新班级 */
  async update(teacherId: number, dto: UpdateClassDto) {
    const classEntity = await this.classRepo.findOne({
      where: { id: dto.id, teacher_id: teacherId, is_archived: false },
    });
    if (!classEntity) {
      return null;
    }

    const gradeNumber = dto.grade_number ?? classEntity.grade_number;
    const classNumber = dto.class_number ?? classEntity.class_number;

    // 如果年级或班号变了，检查是否重复
    if (dto.grade_number !== undefined || dto.class_number !== undefined) {
      const existing = await this.classRepo.findOne({
        where: {
          teacher_id: teacherId,
          grade_number: gradeNumber,
          class_number: classNumber,
          is_archived: false,
        },
      });
      if (existing && existing.id !== dto.id) {
        return 'duplicate';
      }
    }

    const grade = GRADE_NAMES[gradeNumber - 1];
    const name = `${grade}${classNumber}班`;

    await this.classRepo.update(dto.id, {
      grade_number: gradeNumber,
      class_number: classNumber,
      grade,
      name,
    });

    return this.classRepo.findOne({ where: { id: dto.id } });
  }

  /** 删除班级（软删除，设置归档） */
  async remove(teacherId: number, id: number) {
    const classEntity = await this.classRepo.findOne({
      where: { id, teacher_id: teacherId, is_archived: false },
    });
    if (!classEntity) {
      return false;
    }

    await this.classRepo.update(id, { is_archived: true });
    return true;
  }
}
