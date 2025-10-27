import { base44 } from '../base44';

export class Project {
  static async list(sort = "-updated_date", limit = 10) {
    const { data, error } = await base44.entities.Project.list(sort, limit);
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  static async create(data) {
    const { data: newProject, error } = await base44.entities.Project.create(data);
    if (error) {
      throw new Error(error.message);
    }
    return newProject;
  }

  static async update(id, data) {
    const { data: updatedProject, error } = await base44.entities.Project.update(id, data);
    if (error) {
      throw new Error(error..message);
    }
    return updatedProject;
  }

  static async delete(id) {
    const { error } = await base44.entities.Project.delete(id);
    if (error) {
      throw new Error(error.message);
    }
    return true;
  }
}
