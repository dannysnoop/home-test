import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../db/data-source';
import { User } from '../entities/User';
import { env } from '../config/env';
import {emailService} from "./email.service";

const userRepo = AppDataSource.getRepository(User);

export class AuthService {
    // 🧩 REGISTER
    static async register(username: string, email: string, password: string) {
        const exists = await userRepo.findOne({ where: [{ username }, { email }] });
        if (exists) throw new Error('User already exists');

        const passwordHash = await bcrypt.hash(password, 10);
        const user = userRepo.create({ username, email, passwordHash });
        await userRepo.save(user);
        return user;
    }

    // 🧩 LOGIN
    static async login(usernameOrEmail: string, password: string) {
        const user = await userRepo.findOne({
            where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
        });
        if (!user) throw new Error('Invalid credentials');

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) throw new Error('Invalid credentials');

        const token = jwt.sign(
            { id: user.id, username: user.username },
            env.JWT_SECRET,
            { expiresIn: +env.JWT_EXPIRES_IN  }
        );

        return { token };
    }

    // 🧩 FORGOT PASSWORD
    static async forgotPassword(email: string) {
        const user = await userRepo.findOne({ where: { email } });
        // Không báo lỗi nếu email không tồn tại (tránh lộ thông tin)
        if (!user) {
            throw new Error('Invalid credentials');
        };

        // Tạo token tạm thời, chỉ dùng để reset password (hết hạn nhanh)
        const token = jwt.sign(
            { id: user.id },
            env.JWT_RESET_SECRET,
            { expiresIn: +env.JWT_RESET_EXPIRES  }
        );
        const resetLink = `${env.BASE_URL}/reset-password?token=${token}`;
        await emailService.sendPasswordResetEmail(user.email, resetLink);
    }

    // 🧩 RESET PASSWORD
    static async resetPassword(token: string, newPassword: string) {
        try {
            const payload = jwt.verify(token, env.JWT_RESET_SECRET) as { id: string };
            const user = await userRepo.findOne({ where: { id: payload.id } });
            if (!user) throw new Error('User not found');

            user.passwordHash = await bcrypt.hash(newPassword, 10);
            await userRepo.save(user);

            console.log(`[ResetPassword] Password updated for user: ${user.id}`);
            return { success: true };
        } catch (err) {
            console.error(err);
            throw new Error('Invalid or expired reset token');
        }
    }
}
