import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from './category.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CategoryService {

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {
  }

  public async findAllCategories(guildId: string): Promise<Category[]> {
    return this.categoryRepository.find({ where: { guildId: guildId } });
  }

  public async createCategory(category: Category) {
    return this.categoryRepository.insert(category);
  }

  public async editCategory(categoryId: number, data: Category) {
    const category = await this.categoryRepository.findOne(categoryId);
    if (!category) {
      throw new NotFoundException('category not found');
    }
    await this.categoryRepository.save({ ...category, ...data });
    return category;
  }

  public async deleteCategory(categoryId: number): Promise<Category> {
    const category = await this.categoryRepository.findOne(categoryId);
    if (!category) {
      throw new NotFoundException('category not found');
    }
    await this.categoryRepository.remove(category);
    return category;
  }
}
