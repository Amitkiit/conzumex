import { UserRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt';
import { hashPassword } from '../utils/password';

const userRepository = new UserRepository();

export class AuthService {
  async register(data: any) {
    return userRepository.create(data);
  }

  async login(data: any) {
    const user = await userRepository.findByEmail(data.email);
    if (!user || user.password !== hashPassword(data.password)) {
      throw new Error('Invalid credentials');
    }

    return generateToken({ id: user.id });
  }
}
