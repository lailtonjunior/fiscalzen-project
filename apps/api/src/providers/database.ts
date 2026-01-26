import { container } from 'tsyringe';
import { db } from '../config/database';

export const DATABASE_TOKEN = 'Database';

container.register(DATABASE_TOKEN, { useValue: db });
