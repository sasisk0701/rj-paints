import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Card, message } from 'antd';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (values: any) => {
    setLoading(true);
    setErrorMessage(null);

    const res = await login(values.email, values.password);
    setLoading(false);

    if (res.success) {
      message.success('Admin authentication successful! Redirecting to Dashboard...');
      navigate('/admin');
    } else {
      setErrorMessage(res.message || 'Invalid admin credentials');
    }
  };

  const autofillDemo = () => {
    form.setFieldsValue({
      email: 'rjpaintsandhardwares@gmail.com',
      password: 'Admin@123'
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl rounded-3xl border border-slate-200 overflow-hidden p-2 sm:p-6">
          <div className="text-center pb-6 border-b border-slate-100 space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-slate-900/20">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Portal Login</h2>
            <p className="text-xs text-slate-500">RJ Paints & Styleo Interiors Executive Management</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleLogin}
            className="mt-6 space-y-4"
          >
            {errorMessage && (
              <Alert message={errorMessage} type="error" showIcon className="rounded-xl" />
            )}

            <Form.Item
              name="email"
              label={<span className="font-semibold text-xs text-slate-700">Admin Business Email</span>}
              rules={[{ required: true, message: 'Please enter admin email' }]}
            >
              <Input
                prefix={<Mail className="w-4 h-4 text-slate-400 mr-2" />}
                placeholder="rjpaintsandhardwares@gmail.com"
                size="large"
                className="rounded-xl"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="font-semibold text-xs text-slate-700">Password</span>}
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password
                prefix={<Lock className="w-4 h-4 text-slate-400 mr-2" />}
                placeholder="••••••••••••"
                size="large"
                className="rounded-xl"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="bg-slate-900 hover:bg-slate-800 border-none font-bold h-12 text-sm rounded-xl shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Authenticate JWT Admin Session</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Form>

          {/* Quick Auto-fill button for testing convenience */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={autofillDemo}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 inline-flex items-center"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Auto-fill Admin Credentials
            </button>
            <p className="text-[10px] text-slate-400 mt-2">
              Default Credentials: <code>rjpaintsandhardwares@gmail.com</code> / <code>Admin@123</code>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
