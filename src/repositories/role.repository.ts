import { RoleModel, type IRole } from '@/models/role.model';
import { BaseRepository } from '@/repositories/base.repository';

export class RoleRepository extends BaseRepository<IRole> {
  constructor() {
    super(RoleModel);
  }

  async findByName(name: string): Promise<IRole | null> {
    return this.findOne({ name: name.toLowerCase(), isDeleted: false } as Partial<IRole>);
  }

  async findAllActive(): Promise<IRole[]> {
    return this.findMany({ isDeleted: false } as Partial<IRole>);
  }
}

export const roleRepository = new RoleRepository();
