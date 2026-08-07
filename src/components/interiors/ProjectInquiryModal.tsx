import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { Building2, Send, CheckCircle2, Phone, Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultService?: string;
}

export const ProjectInquiryModal: React.FC<Props> = ({ open, onClose, defaultService = 'Modular Kitchen' }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (values: any) => {
    setLoading(true);

    // Save lead to localStorage quotes list
    const existing = JSON.parse(localStorage.getItem('rj_quotes_leads') || '[]');
    const newLead = {
      id: `lead-${Date.now()}`,
      ...values,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    localStorage.setItem('rj_quotes_leads', JSON.stringify([newLead, ...existing]));

    setTimeout(() => {
      setLoading(false);
      message.success('Thank you! S. Madasamy sir will contact you within 24 hours.');
      form.resetFields();
      onClose();

      // Open WhatsApp directly
      const waText = encodeURIComponent(
        `Hi Styleo Interiors,\nMy Name: ${values.name}\nPhone: ${values.phone}\nService Required: ${values.serviceNeeded}\nLocation: ${values.location || 'Kovilpatti'}\nNote: ${values.message || 'Please contact for consultation.'}`
      );
      window.open(`https://wa.me/919488475040?text=${waText}`, '_blank');
    }, 800);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      className="project-inquiry-modal"
    >
      <div className="p-2 sm:p-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Request Interior & Civil Consultation</h3>
            <p className="text-xs text-slate-500">Free 3D Photorealistic Design & Material Estimate by S. Madasamy</p>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ serviceNeeded: defaultService, location: 'Kovilpatti' }}
          className="mt-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label={<span className="font-semibold text-xs text-slate-700">Full Name</span>}
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input placeholder="e.g. S. Murugesan" size="large" />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span className="font-semibold text-xs text-slate-700">Contact Number</span>}
              rules={[{ required: true, message: 'Please enter phone number' }]}
            >
              <Input placeholder="e.g. 9488475040" size="large" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="serviceNeeded"
              label={<span className="font-semibold text-xs text-slate-700">Service Required</span>}
              rules={[{ required: true }]}
            >
              <Select size="large">
                <Select.Option value="Modular Kitchen">Modular Kitchen</Select.Option>
                <Select.Option value="False Ceiling & Lighting">False Ceiling & Lighting</Select.Option>
                <Select.Option value="Wardrobe & Storage">Wardrobe & Storage</Select.Option>
                <Select.Option value="Full Villa Interior">Full Villa Turnkey Interior</Select.Option>
                <Select.Option value="Civil Building Construction">Civil Building Construction</Select.Option>
                <Select.Option value="Commercial Office Design">Commercial Office Design</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="location"
              label={<span className="font-semibold text-xs text-slate-700">Project Location</span>}
            >
              <Input placeholder="e.g. Kovilpatti Town" size="large" />
            </Form.Item>
          </div>

          <Form.Item
            name="message"
            label={<span className="font-semibold text-xs text-slate-700">Project Details / Requirements</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Mention house BHK, total sqft area, timeline, or special preferences..."
            />
          </Form.Item>

          <div className="pt-2">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="bg-amber-500 hover:bg-amber-600 border-none text-slate-950 font-bold h-12 text-sm shadow-xl flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit & Send to WhatsApp</span>
            </Button>
          </div>

          <div className="text-center pt-2 text-xs text-slate-500">
            <span>Or Call Directly: </span>
            <a href="tel:9488475040" className="font-bold text-blue-600 hover:underline">9488475040</a>
            <span> / </span>
            <a href="tel:6381593537" className="font-bold text-blue-600 hover:underline">6381593537</a>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
