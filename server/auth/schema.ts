import 'server-only';

import { z } from 'zod';

export const emailSchema = z.string().email('请输入有效的邮箱地址');
export const passwordSchema = z
  .string()
  .min(8, '密码至少 8 位')
  .max(64, '密码过长')
  .regex(/[A-Za-z]/, '密码需包含字母')
  .regex(/[0-9]/, '密码需包含数字');

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().min(1, '昵称不能为空').max(40, '昵称过长')
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '请输入密码')
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
