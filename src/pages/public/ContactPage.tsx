import React from 'react';
import { Card, Form, Input, message } from 'antd';
import { MapPin, Phone, Mail, Globe, ShieldCheck, User, Send, Clock } from 'lucide-react';
import { Button } from '@/components/common/Button';

export const ContactPage: React.FC = () => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    message.success('Thank you! S. Madasamy sir will get back to you shortly.');
    form.resetFields();

    const waText = encodeURIComponent(
      `Hi RJ Paints / Styleo Interiors,\nName: ${values.name}\nPhone: ${values.phone}\nRequirement: ${values.message}`
    );
    window.open(`https://wa.me/919488475040?text=${waText}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-12">
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl">
        <span className="px-3.5 py-1 rounded-full bg-blue-900/80 border border-blue-700 text-blue-300 text-xs font-bold uppercase tracking-wider inline-flex items-center mb-3">
          <ShieldCheck className="w-4 h-4 mr-1 text-amber-400" />
          Kovilpatti Showroom & Office
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white">Get In Touch With Us</h1>
        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
          Visit our showroom near New Bus Stand, Kovilpatti or call proprietor S. Madasamy directly for Asian Paints quotes & turnkey interior design consultations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-lg rounded-2xl border border-slate-200 p-2">
            <h3 className="text-xl font-bold text-slate-900 pb-4 border-b border-slate-100">Company Information</h3>
            
            <div className="space-y-4 mt-4 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Proprietor / Managing Director</span>
                  <span className="text-slate-600">S. Madasamy</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Store Location</span>
                  <span className="text-slate-600">Near New Bus Stand, Main Road, Kovilpatti - 628501, Tamil Nadu, India</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Direct Contact Phone Numbers</span>
                  <div className="flex flex-col space-y-1 font-semibold text-blue-700 mt-1">
                    <a href="tel:9488475040">📞 9488475040</a>
                    <a href="tel:6381593537">📞 6381593537</a>
                    <a href="tel:9969429723">📞 9969429723</a>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Business Email</span>
                  <a href="mailto:rjpaintsandhardwares@gmail.com" className="text-blue-700 font-semibold hover:underline">
                    rjpaintsandhardwares@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Globe className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Official Website</span>
                  <a href="http://www.styleointeriors.com" target="_blank" rel="noreferrer" className="text-blue-700 font-semibold hover:underline">
                    www.styleointeriors.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Showroom Timings</span>
                  <span className="text-slate-600">Monday - Saturday: 8:30 AM - 9:00 PM</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Contact Form & Google Maps Placeholder */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-lg rounded-2xl border border-slate-200 p-2">
            <h3 className="text-xl font-bold text-slate-900 pb-4 border-b border-slate-100">Send Direct Message</h3>
            
            <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Form.Item name="name" label="Your Name" rules={[{ required: true }]}>
                  <Input size="large" placeholder="S. Ramanathan" />
                </Form.Item>
                <Form.Item name="phone" label="Phone Number" rules={[{ required: true }]}>
                  <Input size="large" placeholder="9488475040" />
                </Form.Item>
              </div>

              <Form.Item name="email" label="Email Address">
                <Input size="large" placeholder="name@domain.com" />
              </Form.Item>

              <Form.Item name="message" label="How Can We Help You?" rules={[{ required: true }]}>
                <Input.TextArea rows={4} placeholder="Ask about paint bucket pricing, interior design 3D quote, or hardware availability..." />
              </Form.Item>

              <Button
                type="submit"
                size="large"
                loading={false}
                className="w-full bg-blue-600 hover:bg-blue-700 border-blue-600 font-bold h-12 text-white shadow-md shadow-blue-500/20"
              >
                <Send className="w-4 h-4" />
                <span>Submit & WhatsApp S. Madasamy</span>
              </Button>
            </Form>
          </Card>

          {/* Kovilpatti Google Maps Iframe */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-md overflow-hidden h-72">
            <iframe
              title="Kovilpatti Showroom Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3941.528374291823!2d77.8643872!3d9.172481!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b03f0b2f567b45f%3A0x6b1b2c3d4e5f6g7h!2sKovilpatti%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1650000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen={false}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
