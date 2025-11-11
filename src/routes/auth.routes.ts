import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { validate } from '../middlewares/validator';

const router = Router();

const RegisterSchema = z.object({
    body: z.object({
        username: z.string().min(3),
        email: z.string(),
        password: z.string().min(6),
    }),
});

const LoginSchema = z.object({
    body: z.object({
        usernameOrEmail: z.string().min(3),
        password: z.string().min(6),
    }),
});


const ForgetPasswordSchema = z.object({
    body: z.object({
        email: z.string()
    }),
});


const ResetPasswordSchema = z.object({
    body: z.object({
        newPassword: z.string().min(6),
    }),
    params: z.object({
        token: z.string()
    })
});





router.post('/register', validate(RegisterSchema), async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const user = await AuthService.register(username, email, password);
        res.status(201).json({ id: user.id, username: user.username, email: user.email });
    } catch (err: any) {
        next(err);
    }
});

router.post('/login', validate(LoginSchema), async (req, res, next) => {
    try {
        const { usernameOrEmail, password } = req.body;
        const result = await AuthService.login(usernameOrEmail, password);
        res.json({
            accessToken: result.token,
        });
    } catch (err: any) {
        next(err);
    }
});
router.post('/forgot-password', validate(ForgetPasswordSchema), async (req, res, next) => {
    try {
        const { email } = req.body;
         await AuthService.forgotPassword(email);
        res.json({
            message: 'If the email exists, a password reset link has been sent.',
        });
    } catch (err: any) {
        next(err);
    }
});


router.post('/reset-password', validate(ResetPasswordSchema), async (req, res, next) => {
    try {
        const { newPassword } = req.body;
        const { token } = req.params;
        const result = await AuthService.resetPassword(token, newPassword);
        res.json(result);
    } catch (err: any) {
        next(err);
    }
});

export default router;
