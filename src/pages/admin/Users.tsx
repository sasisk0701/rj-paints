import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal, Form, Input, message, Popconfirm } from 'antd';
import { adminUserService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { CellItem } from '@/components/common/CellItem';
import { Avatar } from '@/components/common/Swatch';
import { Toolbar } from '@/components/common/Toolbar.tsx';
import { Button } from '@/components/common/Button.tsx';
import { Badge } from '@/components/common/Badge';
import { DataTable } from '@/components/common/DataTable';
import type { TableColumn } from '@/types/types';

interface PortalUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

const COLUMNS: TableColumn[] = [
  { key: 'user', label: 'User' },
  { key: 'role', label: 'Role' },
  { key: 'joined', label: 'Joined' },
  { key: 'actions', label: '' },
];

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUserService.getUsers();
      setUsers(data);
    } catch {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (values: { email: string; name: string; password: string }) => {
    try {
      setSaving(true);
      await adminUserService.createUser(values);
      message.success('User created successfully');
      setModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminUserService.deleteUser(id);
      message.success('User removed');
      fetchUsers();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to delete user');
    }
  };

  const rows = users.map((u) => ({
    id: u.id,
    user: (
      <CellItem
        icon={<Avatar initials={u.name.slice(0, 2).toUpperCase()} size={30} />}
        name={u.name}
        sub={u.email}
      />
    ),
    role: <Badge tone="neutral">{u.role}</Badge>,
    joined: new Date(u.createdAt).toLocaleDateString('en-IN'),
    actions: (
      <Popconfirm
        title="Remove this user?"
        onConfirm={() => handleDelete(u.id)}
        disabled={u.id === currentUser?.id}
        okText="Yes"
        cancelText="No"
      >
        <Button
          variant="ghost"
          size="sm"
          icon={Trash2}
          disabled={u.id === currentUser?.id}
        >
          Remove
        </Button>
      </Popconfirm>
    ),
  }));

  return (
    <div>
      <Toolbar
        left={<span className="text-xs text-ink-3">{users.length} admin user{users.length !== 1 ? 's' : ''}</span>}
        right={
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
            Add User
          </Button>
        }
      />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        title="Portal Users"
        subtitle="Admin accounts with full dashboard access"
        paginationText={`Showing ${users.length} user${users.length !== 1 ? 's' : ''}`}
      />

      <Modal
        title="Add Admin User"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Create User"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd} className="mt-4">
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input placeholder="S. Madasamy" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="admin@rjpaints.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="Min 6 characters" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
