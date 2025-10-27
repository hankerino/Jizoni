import { base44 } from '../base44';

export class Task {
  static async list(sort = "-updated_date", limit = 50) {
    const { data, error } = await base44.entities.Task.list(sort, limit);
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  static async filter(filters, sort = "wbs_code") {
    const { data, error } = await base44.entities.Task.filter(filters, sort);
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  static async create(data) {
    const { data: newTask, error } = await base44.entities.Task.create(data);
    if (error) {
      throw new Error(error.message);
    }
    return newTask;
  }

  static async bulkCreate(data) {
    const { data: newTasks, error } = await base44.entities.Task.bulkCreate(data);
    if (error) {
      throw new Error(error.message);
    }
    return newTasks;
  }

  static async update(id, data) {
    const { data: updatedTask, error } = await base44.entities.Task.update(id, data);
    if (error) {
      throw new Error(error.message);
    }
    return updatedTask;
  }

  static async delete(id) {
    // Note: This is a simplified delete. A real implementation would recursively delete children.
    const { error } = await base44.entities.Task.delete(id);
    if (error) {
      throw new Error(error.message);
    }
    return true;
  }
}
