import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Upload } from 'antd';
import { databaseBackupService } from '../../services/api';
import { COMPANY_DETAILS } from '../../data/paintsData';
import { Settings, Download, Upload as UploadIcon, ShieldCheck, Database, Save } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [form] = Form.useForm();

  const handleSaveCompany = (values: any) => {
    message.success('Company settings updated successfully');
  };

  const handleExportBackup = () => {
    const jsonStr = databaseBackupService.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rj_paints_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Database backup JSON file downloaded!');
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const ok = databaseBackupService.restoreDatabaseJSON(content);
      if (ok) {
        message.success('Database restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        message.error('Invalid backup JSON format');
      }
    };
    reader.readAsText(file);
    return false;
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900">System Settings & Data Backup</h2>
        <p className="text-xs text-slate-500">Configure business info, GSTIN, and perform database backups</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Company Profile Settings */}
        <div className="lg:col-span-7">
          <Card className="shadow-md rounded-2xl border border-slate-200 p-2">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
              Company Information Settings
            </h3>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveCompany}
              initialValues={{
                name: COMPANY_DETAILS.name,
                interiorsName: COMPANY_DETAILS.interiorsName,
                owner: COMPANY_DETAILS.owner,
                location: COMPANY_DETAILS.location,
                gstNumber: COMPANY_DETAILS.gstNumber,
                phone: COMPANY_DETAILS.contactNumbers[0],
                email: COMPANY_DETAILS.email,
                website: COMPANY_DETAILS.website,
                address: COMPANY_DETAILS.address
              }}
              className="space-y-3"
            >
              <Form.Item name="name" label="Paints Store Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="interiorsName" label="Interior Business Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="owner" label="Proprietor / Owner Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="gstNumber" label="GSTIN Number" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="phone" label="Primary Contact Phone">
                  <Input />
                </Form.Item>
                <Form.Item name="email" label="Business Email">
                  <Input />
                </Form.Item>
              </div>

              <Form.Item name="website" label="Website URL">
                <Input />
              </Form.Item>

              <Form.Item name="address" label="Showroom Address">
                <Input.TextArea rows={2} />
              </Form.Item>

              <Button type="primary" htmlType="submit" icon={<Save className="w-4 h-4 mr-1" />} className="bg-blue-600 font-bold h-10">
                Save Settings
              </Button>
            </Form>
          </Card>
        </div>

        {/* Right Backup & Restore Panel */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-md rounded-2xl border border-slate-200 p-2">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 mb-4">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Database Backup & Restore</h3>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <p>Download full snapshot JSON backup of Products, Suppliers, Sales, Labour & Expense records.</p>
              
              <Button
                type="primary"
                icon={<Download className="w-4 h-4 mr-1" />}
                onClick={handleExportBackup}
                block
                size="large"
                className="bg-slate-900 font-bold"
              >
                Export Database Backup (.JSON)
              </Button>

              <div className="pt-4 border-t border-slate-100">
                <span className="font-bold text-slate-800 block mb-2">Restore Backup File</span>
                <Upload beforeUpload={handleRestore} showUploadList={false} accept=".json">
                  <Button icon={<UploadIcon className="w-4 h-4 mr-1" />} block size="large">
                    Select JSON File to Restore
                  </Button>
                </Upload>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
