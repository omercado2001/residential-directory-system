'use client';

import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Shield, User as UserIcon, Store, Mail, Lock, Eye, EyeOff, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SystemUser } from '@/types/database';
import { toast } from 'sonner';

interface ProfilesModuleProps {
  users: SystemUser[];
  onSaveUser: (user: SystemUser) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  searchTerm: string;
}

const ROLES = [
  { id: 'admin', name: 'Administrador General (Acceso Total a Todo el Sistema)' },
  { id: 'editor', name: 'Editor / Gestor (Gestión de Comercios, Productos, Ofertas y Eventos)' },
  { id: 'viewer', name: 'Lector (Solo Consulta sin Permisos de Edición)' },
];

const getRoleChip = (role?: string) => {
  const clean = (role || '').toLowerCase();
  if (clean === 'admin' || clean === 'super_admin' || clean === 'administrador') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-extrabold border border-purple-200">
        <Shield className="w-3 h-3" /> Admin Total
      </span>
    );
  }
  if (clean === 'editor' || clean === 'business_owner' || clean === 'gestor') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold border border-blue-200">
        <Store className="w-3 h-3" /> Editor Gestor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold border border-slate-200">
      <UserIcon className="w-3 h-3" /> Solo Lectura
    </span>
  );
};

export default function ProfilesModule({
  users,
  onSaveUser,
  onDeleteUser,
  searchTerm,
}: ProfilesModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // Confirmation state
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<SystemUser | null>(null);
  const [confirmUpdatePayload, setConfirmUpdatePayload] = useState<SystemUser | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Form states
  const [id, setId] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const filteredUsers = users.filter((u) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    return (
      (u.full_name || '').toLowerCase().includes(query) ||
      (u.username || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openCreateModal = () => {
    setEditingUser(null);
    setId(crypto.randomUUID());
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('viewer');
    setAvatarUrl('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (u: SystemUser) => {
    setEditingUser(u);
    setId(u.id);
    setFullName(u.full_name || '');
    setUsername(u.username || '');
    setEmail(u.email || '');
    setPassword(''); // Leave blank to keep current password
    setRole(u.role || 'viewer');
    setAvatarUrl(u.avatar_url || '');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!fullName.trim()) {
      toast.error('El nombre completo es obligatorio');
      return;
    }

    if (!username.trim()) {
      toast.error('El nombre de usuario es obligatorio');
      return;
    }

    if (!editingUser && !password.trim()) {
      toast.error('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    // Check duplicate username
    const cleanUsername = username.trim().toLowerCase();
    const isDuplicate = users.some(
      (u) => u.id !== (editingUser?.id || id) && u.username.trim().toLowerCase() === cleanUsername
    );

    if (isDuplicate) {
      toast.error(`El usuario "@${cleanUsername}" ya existe. Por favor elige otro.`);
      return;
    }

    const payload: SystemUser = {
      id: id || editingUser?.id || crypto.randomUUID(),
      full_name: fullName.trim(),
      username: cleanUsername,
      email: email.trim().toLowerCase() || `${cleanUsername}@residencial.com`,
      role,
      avatar_url: avatarUrl || null,
      created_at: editingUser?.created_at || new Date().toISOString(),
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    if (editingUser) {
      setConfirmUpdatePayload(payload);
    } else {
      await onSaveUser(payload);
      setIsModalOpen(false);
    }
  };

  const executeUpdate = async () => {
    if (!confirmUpdatePayload) return;
    await onSaveUser(confirmUpdatePayload);
    setConfirmUpdatePayload(null);
    setIsModalOpen(false);
  };

  const executeDelete = async () => {
    if (!confirmDeleteUser) return;
    await onDeleteUser(confirmDeleteUser.id);
    setConfirmDeleteUser(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Action Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" /> Residentes y Usuarios
          </h2>
          <p className="text-xs text-slate-500 mt-1">Usuarios registrados en el sistema ({users.length})</p>
        </div>
        <Button
          onClick={openCreateModal}
          className="font-bold shadow-md bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 h-10 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">NOMBRE DE USUARIO</th>
                <th className="py-3.5 px-4">CORREO / USUARIO</th>
                <th className="py-3.5 px-4">ROL ASIGNADO</th>
                <th className="py-3.5 px-4">FECHA DE REGISTRO</th>
                <th className="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.full_name || u.username}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                            {(u.full_name || u.username || 'U').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {u.full_name || u.username}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">@{u.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-blue-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.email || `${u.username}@residencial.com`}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getRoleChip(u.role)}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Activo'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          className="w-8 h-8 p-0 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                          variant="ghost"
                          onClick={() => openEditModal(u)}
                          title="Editar usuario"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          className="w-8 h-8 p-0 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                          variant="ghost"
                          onClick={() => setConfirmDeleteUser(u)}
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[5, 8, 15, 30]}
        />
      </div>

      {/* Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-[28px] p-5 sm:p-6 border border-slate-200 shadow-2xl bg-white gap-0">
          <DialogHeader className="pb-3.5 mb-1 border-b border-slate-100 space-y-1 text-left">
            <DialogTitle className="text-[18px] font-extrabold text-slate-900 tracking-tight">
              {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
            </DialogTitle>
            <p className="text-[13px] text-slate-500 font-normal">
              {editingUser
                ? 'Actualiza los datos de perfil, accesos y permisos del usuario.'
                : 'Completa la información para dar de alta una nueva cuenta en el sistema.'}
            </p>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-slate-700 text-[13px] font-semibold block">Nombre Completo</label>
              <Input
                placeholder="Ej. Oscar Mercado"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11 px-3.5 rounded-[14px] bg-slate-50/70 border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-[13px] font-semibold flex items-center gap-1">
                  <AtSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>Usuario de Acceso</span>
                </label>
                <Input
                  placeholder="ej. oscar_admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 px-3.5 rounded-[14px] bg-slate-50/70 border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 text-[13px] font-semibold flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Correo Electrónico</span>
                </label>
                <Input
                  placeholder="usuario@residencial.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 px-3.5 rounded-[14px] bg-slate-50/70 border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 text-[13px] font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contraseña de Acceso {editingUser && '(Opcional al editar)'}</span>
                </span>
                {editingUser && <span className="text-[11px] text-slate-400 font-normal">Conservar actual si está vacío</span>}
              </label>
              <div className="relative">
                <Input
                  placeholder={editingUser ? '••••••••' : 'Ingresa la contraseña'}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 px-3.5 pr-10 rounded-[14px] bg-slate-50/70 border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 text-[13px] font-semibold block">Rol y Permisos</label>
              <SearchableSelect
                options={ROLES.map((r) => ({
                  value: r.id,
                  label: r.name,
                  icon: r.id === 'admin' ? Shield : r.id === 'editor' ? Store : UserIcon,
                }))}
                value={role}
                onChange={setRole}
                placeholder="Selecciona un rol..."
                searchPlaceholder="Escribe para buscar rol..."
                className="w-full"
              />
            </div>

            <ImageDropzone
              label="Foto de Perfil del Usuario"
              value={avatarUrl}
              onChange={setAvatarUrl}
              folder="avatars"
            />
          </div>

          <DialogFooter className="pt-3.5 mt-2 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <Button
              type="button"
              onClick={() => setIsModalOpen(false)}
              variant="secondary"
              className="h-11 px-5 rounded-[16px] font-semibold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 border-0 cursor-pointer transition-all"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleFormSubmit}
              className="h-11 px-6 rounded-[16px] font-bold text-[15px] bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {editingUser ? 'Actualizar Usuario' : 'Guardar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteUser)}
        onClose={() => setConfirmDeleteUser(null)}
        onConfirm={executeDelete}
        title="¿Eliminar Usuario?"
        description={`¿Estás seguro de que deseas eliminar el usuario "${confirmDeleteUser?.full_name || confirmDeleteUser?.username}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Confirmation Dialog for Update */}
      <ConfirmDialog
        isOpen={Boolean(confirmUpdatePayload)}
        onClose={() => setConfirmUpdatePayload(null)}
        onConfirm={executeUpdate}
        title="¿Actualizar Usuario?"
        description={`¿Deseas guardar los cambios realizados en el usuario "${confirmUpdatePayload?.full_name || confirmUpdatePayload?.username}"?`}
        confirmText="Sí, Actualizar"
        cancelText="Cancelar"
        variant="primary"
      />
    </div>
  );
}
